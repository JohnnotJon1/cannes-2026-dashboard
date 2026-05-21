// For every event with a registrationUrl, fetch the page text and look
// for named individuals in patterns the event description didn't capture:
//   "Name (Role at Company)"  → strong signal
//   "with Name (Company)"
//   "feat. Name"
//   "hosted by Name"
//   "moderated by Name"
//   "Confirmed speakers: Name, Name, Name"
//
// Writes candidates to /tmp/event_page_speakers.json.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVENTS_PATH = path.join(ROOT, "data", "events.json");
const OUT = "/tmp/event_page_speakers.json";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PAGE_TIMEOUT = 18000;
const CONCURRENCY = 4;

const NAME_CORE_SRC = "(?:Sir |Dr\\.? |Lord |Lady |Dame |Hon\\.? )?[A-Z][a-z'’]+(?:[-' ’][A-Z][a-z'’]+){1,3}";
const PAREN_PATTERN = new RegExp(`(${NAME_CORE_SRC})\\s*\\(([^)]{3,80})\\)`, "g");
const LEAD_PATTERNS_SRC = [
  `\\bfeat(?:\\.|uring)?\\s+(${NAME_CORE_SRC})`,
  `\\bhosted by\\s+(${NAME_CORE_SRC})`,
  `\\bmoderated by\\s+(${NAME_CORE_SRC})`,
  `\\bin conversation with\\s+(${NAME_CORE_SRC})`,
  `\\bspeakers?(?: include)?:\\s+((?:${NAME_CORE_SRC}(?:,\\s+)?)+)`,
  `\\bconfirmed speakers?:\\s+((?:${NAME_CORE_SRC}(?:,\\s+)?)+)`,
  `\\blive podcast with\\s+(${NAME_CORE_SRC})`,
  `\\bkeynote from\\s+(${NAME_CORE_SRC})`,
  `\\b(${NAME_CORE_SRC}),\\s+(?:CEO|CMO|CTO|COO|CRO|CFO|CSO|founder|co-founder|chair|chief|president|VP|SVP|EVP|director|head of)\\b`,
];

const ROLE_KEYWORDS_SRC =
  "ceo|cmo|cto|coo|cro|cfo|cso|chief|founder|co-?founder|chair|president|" +
  "vp|svp|evp|avp|vice president|director|head of|senior leader|managing partner|" +
  "general manager|gm|partner|principal|moderator|host|editor|publisher|" +
  "anchor|correspondent|designer|creative|author|musician|actor|athlete|" +
  "olympian|speaker|panelist|jury|juror";
const BRAND_HINT_SRC = "p&g|walmart|amazon|google|meta|apple|microsoft|openai|anthropic|netflix|disney|pepsi|coca|unilever|samsung|kraft|mastercard|wpp|publicis|havas|dentsu|omnicom|ipg|stagwell|instacart|tiktok|spotify|youtube|snap|reddit|pinterest|canva|webflow|scope3|tubi|axios|fortune|forbes|wsj|washington post|guardian|deloitte|mars|magnite|trade desk|mediaocean|patagonia|coinbase|essity|hunter|vayner|vaynerx|linkedin|bain|kantar|nbcuniversal|nbcu|samba|videoamp|siriusxm|adswizz|rumble|tavern|huntsman|billion dollar boy|newdigitalage|nda|monks|media\\.monks|dept|msq|cnn|nyt|axe|nestle|coca-cola|adobe|ibm|verizon|t-mobile|salesforce|sap|oracle|stripe|airbnb|uber|lyft|doordash|expedia|booking|airalo";

const NON_NAME_WORDS = new Set([
  "cannes", "lions", "festival", "beach", "hotel", "plage", "club", "rue",
  "avenue", "boulevard", "bd", "studio", "house", "lounge", "cabana",
  "villa", "palais", "ponton", "carlton", "majestic", "martinez",
  "splendid", "ondine", "scena", "tba", "tbd", "tbc",
  "mon", "tue", "wed", "thu", "fri", "sat", "sun",
  "monday", "tuesday", "wednesday", "thursday", "friday", "june",
  "all", "week", "day", "afternoon", "evening", "morning",
  "the", "and", "or", "of", "for", "to", "at", "in", "on",
  "creator", "creators", "creative", "marketing", "marketers",
  "panel", "panels", "roundtable", "session", "sessions",
  "talk", "talks", "drinks", "cocktail", "cocktails", "dinner",
  "brunch", "breakfast", "luncheon", "lunch", "reception", "kickoff",
  "soiree", "party", "pre", "post", "kit", "form", "forms",
  "rsvp", "application", "ticketed", "free", "invite", "private",
  "open", "ai", "tv", "ctv", "dtc", "b2b", "b2c",
  "us", "uk", "eu", "uae", "apac",
  "across", "stage", "shop", "show", "media", "advertising",
  "purpose", "happy", "hour", "tower", "boom", "voice",
  "showcase", "champagne", "bar", "pop", "purpose", "north",
  "south", "american", "european", "asian", "global",
  "frequency", "visibility", "index", "winning", "attention",
  "she", "runs", "it", "badass", "bosses", "closing", "opening",
  "solutions", "streets", "screens", "future", "past", "present",
  "modern", "heritage", "world", "cup", "woman", "women", "in",
  "leadership", "leaders", "performance", "society", "innovators",
  "officer", "builders", "internet", "daily",
  "spikes", "asia", "editorial", "collective", "agenda",
  "late", "night", "equality", "female", "quotient",
  "creator", "lions", "friday", "grand", "impact", "run",
  "drinks", "sunset", "row", "trade", "desk", "atlantic",
  "old", "new", "glass", "pink", "pride", "ceremony",
  "lounge", "roberto", "cavalli", "salon",
  "stagwell", "sport", "strava", "live", "programming", "stream",
  "adtech", "brand", "vega", "la", "le", "des", "von", "van", "der",
  "see", "you", "you've", "first", "second", "third", "fourth", "fifth",
  "annual", "press", "release", "presented", "with", "by", "from",
  "through", "club", "hub", "lab", "fresh", "y2k", "young", "ny",
  "san", "francisco", "los", "angeles", "york", "chicago", "amsterdam",
  "london", "paris", "berlin", "tokyo", "sydney", "this", "that",
  "these", "those", "many", "few", "small", "agency", "network",
  "wall", "street", "journal", "washington", "post", "wsj", "ft",
  "menu", "navigation", "cookies", "accept", "decline",
  "policy", "terms", "service",
]);

function isValidPersonName(s) {
  const trimmed = s.trim().replace(/^["']|["']$/g, "");
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2 || parts.length > 5) return false;
  if (trimmed.length < 5 || trimmed.length > 60) return false;
  const tokens = parts.map((p) => p.toLowerCase().replace(/[.'’]/g, ""));
  for (const t of tokens) {
    if (NON_NAME_WORDS.has(t)) return false;
  }
  for (const p of parts) {
    if (["de", "van", "von", "du", "la", "le", "del", "della", "al", "y"].includes(p.toLowerCase())) continue;
    if (!/^[A-Z]/.test(p) && !["Sir", "Dr.", "Lord", "Lady", "Dame", "Hon."].includes(p)) {
      return false;
    }
  }
  return true;
}

function hasRoleOrBrand(paren) {
  const lower = paren.toLowerCase();
  if (new RegExp(`\\b(${ROLE_KEYWORDS_SRC})\\b`, "i").test(lower)) return true;
  if (new RegExp(`(${BRAND_HINT_SRC})`, "i").test(lower)) return true;
  return false;
}

function extractFromText(text, eventCtx) {
  const found = [];
  // Paren pattern
  const parenRe = new RegExp(`(${NAME_CORE_SRC})\\s*\\(([^)]{3,80})\\)`, "g");
  let m;
  while ((m = parenRe.exec(text)) !== null) {
    const name = m[1].trim();
    const paren = m[2].trim();
    if (isValidPersonName(name) && hasRoleOrBrand(paren)) {
      found.push({ name, paren_context: paren, kind: "paren" });
    }
  }
  // Lead patterns
  for (const src of LEAD_PATTERNS_SRC) {
    const re = new RegExp(src, "gi");
    while ((m = re.exec(text)) !== null) {
      const payload = m[1];
      for (const candidate of payload.split(/,\s*/)) {
        const name = candidate.trim();
        if (isValidPersonName(name)) {
          found.push({ name, kind: "lead" });
        }
      }
    }
  }
  return found;
}

async function processOne(browser, event) {
  if (!event.registrationUrl) return null;
  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.goto(event.registrationUrl, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT });
    const text = await page.evaluate(() => {
      // Get all visible text in the body, normalized
      const body = document.body;
      if (!body) return "";
      return (body.innerText || body.textContent || "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n\s*\n/g, "\n")
        .slice(0, 200000);
    });
    await page.close();
    const found = extractFromText(text, event);
    if (!found.length) return null;
    // Dedup within event
    const seen = new Set();
    const unique = [];
    for (const f of found) {
      const key = f.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(f);
      }
    }
    return { event_id: event.id, event_name: event.name, event_url: event.registrationUrl, found: unique };
  } catch (err) {
    if (page) await page.close().catch(() => {});
    return { event_id: event.id, error: err.message?.split("\n")[0] };
  }
}

async function runConcurrent(items, fn, concurrency) {
  const results = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (i < items.length) {
        const idx = i++;
        const r = await fn(items[idx]);
        if (r) results.push(r);
        const tag = r?.error ? "!" : r ? `+${r.found?.length ?? 0}` : "·";
        process.stdout.write(`[${idx + 1}/${items.length}] ${tag} ${items[idx].id}\n`);
      }
    })
  );
  return results;
}

async function main() {
  if (!fs.existsSync(CHROME)) {
    console.error(`Chrome not found at ${CHROME}`);
    process.exit(1);
  }
  const events = JSON.parse(fs.readFileSync(EVENTS_PATH, "utf8"));
  const candidates = events.filter((e) => !!e.registrationUrl);
  console.log(`Mining ${candidates.length} event pages with concurrency ${CONCURRENCY}\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    defaultViewport: { width: 1280, height: 800 },
    args: ["--hide-scrollbars"],
  });

  let results;
  try {
    results = await runConcurrent(candidates, (e) => processOne(browser, e), CONCURRENCY);
  } finally {
    await browser.close();
  }

  // Aggregate by person name across events
  const byName = new Map();
  for (const r of results) {
    if (!r?.found) continue;
    for (const f of r.found) {
      const key = f.name.toLowerCase();
      if (!byName.has(key)) {
        byName.set(key, { name: f.name, mentions: [] });
      }
      byName.get(key).mentions.push({
        event_id: r.event_id,
        event_name: r.event_name,
        event_url: r.event_url,
        paren_context: f.paren_context,
        kind: f.kind,
      });
    }
  }

  const out = Array.from(byName.values()).sort((a, b) => b.mentions.length - a.mentions.length);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`\nUnique candidate names: ${out.length}`);
  console.log(`Wrote ${OUT}`);
  console.log(`\nTop 30 by mention count:`);
  for (const p of out.slice(0, 30)) {
    const ctx = p.mentions[0]?.paren_context ? ` (${p.mentions[0].paren_context.slice(0, 50)})` : "";
    console.log(`  ${p.mentions.length}× ${p.name}${ctx}`);
  }
}

main().catch((err) => {
  console.error("FAIL:", err.stack || err.message);
  process.exit(1);
});
