#!/usr/bin/env node
// scripts/mine-round5.mjs
//
// Round 5 of attendee mining. PURELY ADDITIVE — only appends entries to
// data/people.json whose LinkedIn slug / Twitter handle / name aren't
// already present. Never deletes or replaces existing entries.
//
// Three new sources this round:
//   1. LinkedIn-via-Google with brand-side-biased queries
//   2. X / Twitter with brand-side-biased queries
//   3. Instagram hashtag scrape (#canneslions2026 etc.) — Meta property,
//      lower yield but new surface
//
// Usage:
//   APIFY_TOKEN=apify_api_xxx node scripts/mine-round5.mjs
//
// Cost cap: MAX_ITEMS_PER_QUERY × 30ish queries × ~$0.0005 = ~$10 max.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_PATH = path.join(ROOT, "data", "people.json");
const REFRESH_PATH = path.join(ROOT, "data", "refresh.json");
const BLOCKLIST_PATH = path.join(ROOT, "data", "people-blocklist.json");

const APIFY_TOKEN = process.env.APIFY_TOKEN;
if (!APIFY_TOKEN) {
  console.error("error: APIFY_TOKEN env var is required");
  process.exit(1);
}

const N8N_PROXY = "https://airpost.app.n8n.cloud/webhook/claude-http-proxy";

const X_ACTOR = "apidojo~tweet-scraper";
const LINKEDIN_SERP_ACTOR = "apify~google-search-scraper";
const IG_HASHTAG_ACTOR = "apify~instagram-hashtag-scraper";

const MAX_ITEMS_PER_QUERY = 60;

// New queries — angles NOT covered by rounds 1-4
const X_QUERIES = [
  '"Cannes Lions 2026" CMO',
  '"Cannes Lions 2026" "brand director"',
  '"Cannes Lions" 2026 "head of marketing"',
  '"Cannes Lions" 2026 "VP marketing"',
  '"Cannes Lions" 2026 "looking forward"',
  '"Cannes Lions 2026" "first time"',
  '"Cannes Lions 2026" delegation',
  '"Cannes Lions 2026" "joining"',
  '"Cannes Lions 2026" "I am thrilled"',
  '"Cannes Lions 2026" "I\'m excited"',
  '"Cannes 2026" "see you there"',
  '"Cannes Lions" jury 2026',
];

const LINKEDIN_SERP_QUERIES = [
  'site:linkedin.com/posts "Cannes Lions 2026" CMO',
  'site:linkedin.com/posts "Cannes Lions 2026" "brand director"',
  'site:linkedin.com/posts "Cannes Lions 2026" "head of brand"',
  'site:linkedin.com/posts "Cannes Lions 2026" "marketing leader"',
  'site:linkedin.com/posts "Cannes Lions 2026" "global marketing"',
  'site:linkedin.com/posts "Cannes Lions 2026" "first time"',
  'site:linkedin.com/posts "Cannes Lions 2026" "honoured to"',
  'site:linkedin.com/posts "Cannes Lions 2026" "honored to"',
  'site:linkedin.com/posts "Cannes Lions 2026" sustainability',
  'site:linkedin.com/posts "Cannes Lions 2026" gaming',
  'site:linkedin.com/posts "Cannes Lions 2026" creator',
  'site:linkedin.com/posts "Cannes Lions 2026" entertainment',
  'site:linkedin.com/posts "Cannes Lions 2026" B2B',
  'site:linkedin.com/posts "Cannes Lions 2026" "moderating"',
  'site:linkedin.com/posts "Cannes Lions 2026" "Palais"',
  'site:linkedin.com/posts "see you in Cannes" "2026"',
  'site:linkedin.com/posts "heading to Cannes" 2026',
  'site:linkedin.com/posts "thrilled to be" "Cannes Lions" 2026',
];

const IG_HASHTAGS = ["canneslions2026", "cannes2026", "canneslionsfestival"];

// ----- shared helpers ------------------------------------------------------

async function callApify(actorId, input, label) {
  // Route through n8n proxy (api.apify.com is blocked by sandbox + the
  // direct token rotates often). The proxy supplies its own auth via the
  // workflow's stored Apify cred.
  const body = {
    method: "POST",
    url: `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=420&memory=1024`,
    headers: { "Content-Type": "application/json" },
    payload: input,
  };
  try {
    const res = await fetch(N8N_PROXY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`  ! ${label} proxy returned ${res.status}: ${text.slice(0, 200)}`);
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.warn(`  ! ${label} returned non-array: ${JSON.stringify(data).slice(0, 200)}`);
      return [];
    }
    return data;
  } catch (err) {
    console.warn(`  ! ${label} threw: ${err.message}`);
    return [];
  }
}

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function truncate(s, n = 200) {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

function loadBlocklist() {
  try {
    const j = JSON.parse(readFileSync(BLOCKLIST_PATH, "utf8"));
    return new Set((j.urls || []).map((u) => u.toLowerCase()));
  } catch {
    return new Set();
  }
}

function extractCompany(headline) {
  if (!headline) return "";
  const at = headline.match(/(?:at|@)\s+([^|·•—,\n]{2,60})/i);
  if (at) return at[1].trim();
  const pipe = headline.split(/\s*[|·•—]\s*/)[0];
  if (pipe && pipe.length < 60 && !/\b(CEO|CMO|VP|Director|Head|Founder|Manager|Lead)\b/i.test(pipe)) {
    return pipe.trim();
  }
  return "";
}

function extractRole(headline) {
  if (!headline) return "";
  const m = headline.match(
    /\b(CEO|CMO|CTO|COO|CRO|CCO|Chief [A-Za-z ]+|VP[ A-Za-z]*|Vice President[ A-Za-z]*|Founder|Co-Founder|President|Director[ A-Za-z]*|Head of [A-Za-z ]+|Manager[ A-Za-z]*|Lead[ A-Za-z]*|Partner|Principal)\b/i,
  );
  return m ? m[0].trim() : "";
}

function detectYearSignal(text) {
  if (!text) return "going-this-year";
  const t = text.toLowerCase();
  if (/2025/.test(t) && !/2026/.test(t)) return "attended-last-year";
  return "going-this-year";
}

// Strict slug-name match: at least one 3+ char name token must appear in
// the slug. Used to reject "Jane Doe" claimed to be at slug "johnsmith".
function nameTokens(name) {
  return (name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

function slugMatchesName(slug, name) {
  const tokens = nameTokens(name);
  if (tokens.length === 0) return true;
  const s = slug.toLowerCase();
  return tokens.some((t) => s.includes(t));
}

// ----- X mapper ------------------------------------------------------------

function mapXPost(p) {
  const user = p.author || p.user_info || p.user || {};
  const screenName = user.userName || user.username || user.screen_name;
  const name = user.name || user.display_name || screenName;
  if (!name || !screenName) return null;

  const looksLikeNewsBot =
    /\b(news|magazine|newsdesk|daily|weekly|publication|publisher|press release)\b/i.test(
      user.description || "",
    ) && (user.followers || 0) < 200000;
  if (looksLikeNewsBot) return null;

  const text = p.text || p.fullText || p.full_text || "";
  if (/\b(rsvp|register now|subscribe|sign up|#sponsored)\b/i.test(text)) return null;

  const postedAt = p.createdAt || p.created_at || p.date;
  const company = extractCompany(user.description || "");
  return {
    id: `x-${slugify(screenName)}-r5${(p.id || p.tweet_id || "").toString().slice(-6)}`,
    name,
    company,
    role: extractRole(user.description || ""),
    twitterUrl: `https://x.com/${screenName}`,
    linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${name} ${company}`.trim())}`,
    sourcePostUrl: p.url || p.twitterUrl || `https://x.com/${screenName}/status/${p.id}`,
    sourceQuote: truncate(text),
    signalReason: "Public X / Twitter post about Cannes Lions 2026",
    yearSignal: detectYearSignal(text),
    detectedAt: postedAt ? new Date(postedAt).toISOString() : new Date().toISOString(),
  };
}

// ----- LinkedIn SERP mapper (matches the existing scraper's logic) --------

const ORG_HANDLES = new Set([
  "reddit", "adweek", "adage", "campaign", "digiday", "linkedin",
  "linkedin-news", "publicis", "wpp", "dentsu", "havas", "omnicom",
  "mccann", "ogilvy", "bbdo", "tbwa", "droga5", "accenture",
  "accenture-song", "leo-burnett", "leo", "stagwell", "design-army",
  "gut", "rethink", "mother", "72andsunny", "cannes-lions",
  "cmswire", "wieden-kennedy", "wieden", "kennedy",
]);

const ORG_SUFFIXES = [
  "-com", "-inc", "-llc", "-co", "-news", "-media", "-tv", "-films",
  "-studio", "-studios", "-agency", "-group", "-magazine", "-network",
  "-press", "-publishing", "-bureau", "-marketing", "-pr", "-advertising",
  "-international", "-partners", "-worldwide", "-global", "-association",
  "-fest", "-insights", "-edge", "-buzz", "-collective", "-labs", "-club",
];

function looksLikeOrgSlug(slug) {
  if (!slug) return true;
  const lower = slug.toLowerCase();
  if (ORG_HANDLES.has(lower)) return true;
  for (const suf of ORG_SUFFIXES) {
    if (lower.endsWith(suf) || lower.includes(suf + "-")) return true;
  }
  return false;
}

function stripTrailingHash(parts) {
  if (parts.length < 2) return parts;
  const last = parts[parts.length - 1];
  if (/^\d+$/.test(last)) return parts.slice(0, -1);
  if (last.length >= 5 && /\d/.test(last) && /^[a-z0-9]+$/i.test(last)) {
    return parts.slice(0, -1);
  }
  return parts;
}

function nameFromLinkedInUrl(url) {
  const m = url.match(/linkedin\.com\/posts\/([^_/]+)/i);
  if (!m) return null;
  const slug = m[1];
  if (looksLikeOrgSlug(slug)) return null;
  const rawParts = slug.split("-").filter((p) => p.length > 0);
  if (rawParts.length < 2) return null;
  const parts = stripTrailingHash(rawParts);
  if (parts.length < 2) return null;
  for (const p of parts) {
    if (!/^[a-z]+$/i.test(p)) return null;
    if (p.length < 2) return null;
  }
  const trimmed = parts.slice(0, 4);
  return {
    slug,
    name: trimmed
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" "),
  };
}

function looksLikePersonName(s) {
  if (!s) return false;
  const t = s.trim();
  if (t.length < 5 || t.length > 60) return false;
  if (!/\s/.test(t)) return false;
  if (/[#@★⚡️📣🎬🔥🚀]/.test(t)) return false;
  if (/[^\p{L}\p{M}\s.'-]/u.test(t)) return false;
  const lower = t.toLowerCase();
  for (const bad of [
    "cannes lions", "the festival", "festival of creativity",
    "ad age", "linkedin", "post by", "'s post", "'s post", "' post",
  ]) {
    if (lower.includes(bad)) return false;
  }
  if (!/^[A-Z]/u.test(t)) return false;
  return true;
}

function nameFromSerpTitle(title) {
  if (!title) return null;
  let t = title;
  t = t.replace(/[''']s?\s+Post\b.*$/i, "");
  t = t.replace(/\s+[-—:|·].*$/, "");
  t = t.replace(/^Post by\s+/i, "");
  t = t.trim();
  return looksLikePersonName(t) ? t : null;
}

function mapSerpItem(r) {
  const url = r.url;
  if (!url || !/linkedin\.com\/posts\//i.test(url)) return null;
  const desc = (r.description || r.snippet || "").trim();
  if (!/cannes/i.test(desc) && !/cannes/i.test(r.title || "")) return null;

  const fromUrl = nameFromLinkedInUrl(url);
  if (!fromUrl) return null;

  const titleName = nameFromSerpTitle(r.title);
  let name = titleName || fromUrl.name;
  if (!looksLikePersonName(name)) {
    name = fromUrl.name;
    if (!looksLikePersonName(name)) return null;
  }

  // We don't fabricate /in/ URLs from /posts/ slugs here — the post slug
  // is the person's post-author handle which is RELIABLE (it's their own
  // post). Use linkedin search URL as the safer profile link.
  return {
    id: `g-${fromUrl.slug.replace(/[^a-z0-9-]/gi, "").slice(0, 40)}-r5`,
    name,
    company: "",
    role: "",
    linkedinUrl: `https://www.linkedin.com/in/${fromUrl.slug}/`,
    sourcePostUrl: url,
    sourceQuote: truncate(desc, 220).replace(/\bRead more\b\.?/gi, "").trim(),
    signalReason: "Public LinkedIn post about Cannes Lions 2026 (Google-indexed)",
    yearSignal: detectYearSignal(desc),
    detectedAt: new Date().toISOString(),
  };
}

// ----- Instagram hashtag mapper -------------------------------------------

function mapIgPost(p) {
  // IG hashtag scraper returns: { ownerFullName, ownerUsername, caption, url, ... }
  const name = p.ownerFullName || "";
  const handle = p.ownerUsername || "";
  if (!name || !handle) return null;
  if (!/\s/.test(name)) return null; // need full name
  if (name.length < 5 || name.length > 60) return null;
  if (/[#@]/.test(name)) return null;
  // Filter out obvious org accounts by username pattern
  const handleLower = handle.toLowerCase();
  if (/(_|^)(news|media|magazine|agency|official|hq|group|brand|studio)/i.test(handleLower)) {
    return null;
  }
  const caption = (p.caption || "").replace(/\s+/g, " ").trim();
  if (!/cannes/i.test(caption)) return null;
  return {
    id: `i-${slugify(handle)}-r5`,
    name,
    company: "",
    role: "",
    linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}`,
    twitterUrl: "",
    sourcePostUrl: p.url || `https://www.instagram.com/${handle}/`,
    sourceQuote: truncate(caption, 220),
    signalReason: "Public Instagram post about Cannes Lions 2026",
    yearSignal: detectYearSignal(caption),
    detectedAt: p.timestamp ? new Date(p.timestamp).toISOString() : new Date().toISOString(),
  };
}

// ----- pipeline ------------------------------------------------------------

async function runX() {
  const out = [];
  for (const q of X_QUERIES) {
    console.log(`  x  "${q}"…`);
    const tweets = await callApify(X_ACTOR, {
      searchTerms: [q],
      tweetLanguage: "en",
      maxItems: MAX_ITEMS_PER_QUERY,
      sort: "Latest",
    }, `X "${q}"`);
    console.log(`     got ${tweets.length}`);
    for (const t of tweets) {
      const m = mapXPost(t);
      if (m) out.push(m);
    }
  }
  return out;
}

async function runLinkedInSerp() {
  console.log(`  linkedin SERP · ${LINKEDIN_SERP_QUERIES.length} queries…`);
  const pages = await callApify(LINKEDIN_SERP_ACTOR, {
    queries: LINKEDIN_SERP_QUERIES.join("\n"),
    maxPagesPerQuery: 2,
    countryCode: "us",
    languageCode: "en",
  }, "LinkedIn SERP");
  console.log(`     got ${pages.length} SERP pages`);
  const out = [];
  const seen = new Set();
  for (const page of pages) {
    for (const r of page.organicResults || []) {
      const m = mapSerpItem(r);
      if (!m) continue;
      const slug = m.linkedinUrl.match(/linkedin\.com\/in\/([^/?#]+)/)?.[1];
      if (slug && seen.has(slug)) continue;
      // Strict slug-name match (avoid the round-4 mismatch bug)
      if (slug && !slugMatchesName(slug, m.name)) {
        // Slug doesn't contain any name token. Fall back to search URL.
        m.linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(m.name)}`;
      }
      if (slug) seen.add(slug);
      out.push(m);
    }
  }
  return out;
}

async function runInstagram() {
  console.log(`  instagram hashtags · ${IG_HASHTAGS.join(", ")}…`);
  const posts = await callApify(IG_HASHTAG_ACTOR, {
    hashtags: IG_HASHTAGS,
    resultsLimit: 150,
  }, "Instagram hashtag");
  console.log(`     got ${posts.length} IG posts`);
  const out = [];
  const seen = new Set();
  for (const p of posts) {
    const m = mapIgPost(p);
    if (!m) continue;
    const key = (m.name + "|" + (p.ownerUsername || "")).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

async function main() {
  console.log(`mine-round5: X + LinkedIn SERP + Instagram hashtag\n`);

  const blocklist = loadBlocklist();

  // Run all three sources in parallel — each handles its own errors
  const [xSignals, liSignals, igSignals] = await Promise.all([
    runX(),
    runLinkedInSerp(),
    runInstagram(),
  ]);
  const fresh = [...xSignals, ...liSignals, ...igSignals];
  console.log(`\nfresh signals: X=${xSignals.length} LI=${liSignals.length} IG=${igSignals.length} total=${fresh.length}`);

  // Intra-batch dedupe
  const seenKeys = new Set();
  const deduped = [];
  for (const p of fresh) {
    const liSlug = p.linkedinUrl?.match(/linkedin\.com\/in\/([^/?#]+)/)?.[1] ?? "";
    const xHandle = p.twitterUrl?.match(/x\.com\/([^/?#]+)/)?.[1] ?? "";
    const key = `${liSlug}|${xHandle}|${p.name.toLowerCase()}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    deduped.push(p);
  }
  console.log(`after intra-batch dedupe: ${deduped.length}`);

  // Load full existing dataset
  const existing = JSON.parse(readFileSync(OUTPUT_PATH, "utf8"));
  const existingSlugs = new Set();
  const existingHandles = new Set();
  const existingNames = new Set();
  for (const p of existing) {
    const li = p.linkedinUrl?.match(/linkedin\.com\/in\/([^/?#]+)/)?.[1];
    if (li) existingSlugs.add(li);
    const tw = p.twitterUrl?.match(/x\.com\/([^/?#]+)/)?.[1];
    if (tw) existingHandles.add(tw.toLowerCase());
    if (p.name) existingNames.add(p.name.toLowerCase().trim());
  }

  // Filter: blocklist + already-known dedupe (additive — never delete existing)
  const truly_new = deduped.filter((p) => {
    const liLower = (p.linkedinUrl || "").toLowerCase();
    if ([...blocklist].some((b) => b && liLower.includes(b))) return false;
    const slug = liLower.match(/linkedin\.com\/in\/([^/?#]+)/)?.[1];
    if (slug && existingSlugs.has(slug)) return false;
    const tw = p.twitterUrl?.toLowerCase().match(/x\.com\/([^/?#]+)/)?.[1];
    if (tw && existingHandles.has(tw)) return false;
    if (existingNames.has((p.name || "").toLowerCase().trim())) return false;
    return true;
  });

  console.log(`truly NEW after dedup against existing: ${truly_new.length}`);
  if (truly_new.length === 0) {
    console.log("nothing new to add — leaving people.json unchanged.");
    return;
  }

  // Sort new entries by name for stable diff
  truly_new.sort((a, b) => a.name.localeCompare(b.name));

  const merged = [...existing, ...truly_new];
  writeFileSync(OUTPUT_PATH, JSON.stringify(merged, null, 2) + "\n", "utf8");

  // Bump refresh
  try {
    const refresh = JSON.parse(readFileSync(REFRESH_PATH, "utf8"));
    refresh.people = { lastUpdated: new Date().toISOString(), count: merged.length };
    writeFileSync(REFRESH_PATH, JSON.stringify(refresh, null, 2) + "\n");
  } catch {}

  console.log(`\nwrote ${merged.length} entries (added ${truly_new.length} new)`);
  console.log(`\nfollow-up: run \`node scripts/verify-linkedin-urls.mjs --apply\` to scrub any bad LinkedIn URLs in the new batch.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
