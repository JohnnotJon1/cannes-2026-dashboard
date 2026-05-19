#!/usr/bin/env node
// scripts/scrape-cannes-signals.mjs
//
// One-off Apify scrape that refreshes data/people.json with public posts
// about Cannes Lions 2026 (and last year's attendees still talking about
// it). Not a continuous cron — run this whenever you want a fresher batch.
//
// Usage:
//   APIFY_TOKEN=apify_api_xxx node scripts/scrape-cannes-signals.mjs
//   # or:
//   npm run scrape-people     (reads APIFY_TOKEN from your shell)
//
// What it does (two sources):
//   1. X / Twitter via apidojo/tweet-scraper (validated, works well).
//   2. LinkedIn via apify/google-search-scraper + site:linkedin.com/posts
//      queries. Stays TOS-clean (we never crawl LinkedIn directly — Apify
//      hits Google's index of public LinkedIn posts).
//
// Privacy posture:
//   - Only public posts. No LinkedIn auth, no Twitter API auth.
//   - Respects data/people-blocklist.json — URLs / handles listed there
//     are filtered out before writing the output.
//   - Hard cost caps via MAX_ITEMS_PER_QUERY.
//
// Tunable defaults (env-var overrides):
//   APIFY_X_ACTOR            default: apidojo/tweet-scraper
//   APIFY_LINKEDIN_SERP_ACTOR default: apify/google-search-scraper

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// ----- config ---------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_PATH = path.join(ROOT, "data", "people.json");
const BLOCKLIST_PATH = path.join(ROOT, "data", "people-blocklist.json");
const REFRESH_PATH = path.join(ROOT, "data", "refresh.json");

const APIFY_TOKEN = process.env.APIFY_TOKEN;
if (!APIFY_TOKEN) {
  console.error("error: APIFY_TOKEN env var is required.");
  console.error("       Set it inline:  APIFY_TOKEN=apify_api_xxx npm run scrape-people");
  process.exit(1);
}

const X_ACTOR = process.env.APIFY_X_ACTOR ?? "apidojo~tweet-scraper";
const LINKEDIN_SERP_ACTOR =
  process.env.APIFY_LINKEDIN_SERP_ACTOR ?? "apify~google-search-scraper";

const MAX_ITEMS_PER_QUERY = 50;

const X_QUERIES = [
  "Cannes Lions 2026",
  "Cannes Lions International Festival of Creativity 2026",
  "see you at Cannes Lions 2026",
  "I'm going to Cannes Lions",
];

// Google SERP queries that surface public LinkedIn posts indexed by Google.
const LINKEDIN_SERP_QUERIES = [
  'site:linkedin.com/posts "Cannes Lions 2026"',
  'site:linkedin.com/posts "see you at Cannes" 2026',
  'site:linkedin.com/posts "going to Cannes Lions"',
  'site:linkedin.com/posts "heading to Cannes Lions"',
  'site:linkedin.com/posts "Cannes Lions" jury 2026',
  'site:linkedin.com/posts "speaking at Cannes Lions"',
  'site:linkedin.com/posts "I will be at Cannes Lions"',
  'site:linkedin.com/posts "see you in Cannes" 2026',
  'site:linkedin.com/posts "Cannes Lions 2026" excited',
  'site:linkedin.com/posts "Cannes Lions 2026" CMO',
];

// Slugs we never treat as a person.
const ORG_HANDLES = new Set([
  "reddit","reddit-com","adweek","adweek-com","linkedin","linkedin-news",
  "publicis","publicis-worldwide","wpp","wpp-plc","dentsu","dentsu-creative",
  "havas","omnicom","omnicomadvertising","mccann","ogilvy","bbdo","tbwa",
  "droga5","accenture","accenture-song","leo-burnett","leo","stagwell",
  "tiktok","tiktok-for-business","snap","snap-inc","meta","meta-platforms",
  "spotify","mastercard","openai","google","apple","amazon","microsoft",
  "freewheel","comcast","tubi","canva","pinterest","instagram","facebook",
  "youtube","x","twitter","redbird","redbird-capital",
  "auditoire","burson","weareteamagency","heyjasperai","pmgworldwide",
  "billion-dollar-boy","gen-z","gale","gale-partners","r-ga","r-slash-ga",
  "vml","vmlyr","ad-age","adage","prnewswire","businesswire",
  "marketingweek","creativebrief","creative-equals","campaign-asia",
  "campaign","campaignlive","fastcompany","fast-company","variety",
  "digiday","cmswire","cms-wire","wieden-kennedy","wieden","kennedy",
  "design-bridge","designbridge","design-army","gut","gut-agency",
  "rethink","mother","mother-new-york","72andsunny","sphere",
  "adnews-australia","advertising-association","bb-buzz","creator-fest",
  "dig-insights","martech-edge","martech","contentful","brand-finance",
]);

const ORG_SUFFIXES = [
  "-com","-inc","-llc","-co","-news","-media","-tv","-films","-studio",
  "-studios","-agency","-group","-magazine","-network","-press","-publishing",
  "-publications","-bureau","-marketing","-pr","-advertising","-international",
  "-partners","-worldwide","-global","-association","-fest","-insights",
  "-edge","-buzz","-collective","-labs","-club",
];

// ----- helpers --------------------------------------------------------------

async function callApify(actorId, input) {
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=420&memory=1024`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${actorId} returned ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error(`${actorId} returned non-array: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return data;
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
  if (!existsSync(BLOCKLIST_PATH)) return new Set();
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
    /\b(CEO|CMO|CTO|COO|CRO|CCO|Chief [A-Za-z ]+|VP[ A-Za-z]*|Vice President[ A-Za-z]*|Founder|Co-Founder|President|Director[ A-Za-z]*|Head of [A-Za-z ]+|Manager[ A-Za-z]*|Lead[ A-Za-z]*|Partner|Principal)\b/i
  );
  return m ? m[0].trim() : "";
}

function detectYearSignal(text) {
  if (!text) return "going-this-year";
  const t = text.toLowerCase();
  if (/2025/.test(t) && !/2026/.test(t)) return "attended-last-year";
  return "going-this-year";
}

// ----- X / Twitter mapper ---------------------------------------------------

function mapXPost(p) {
  const user = p.author || p.user_info || p.user || {};
  const screenName = user.userName || user.username || user.screen_name;
  const name = user.name || user.display_name || screenName;
  if (!name || !screenName) return null;

  const looksLikeNewsBot =
    /\b(news|magazine|newsdesk|daily|weekly|publication|publisher|press release)\b/i.test(
      user.description || ""
    ) && (user.followers || 0) < 200000;
  if (looksLikeNewsBot) return null;

  const text = p.text || p.fullText || p.full_text || "";
  if (/\b(rsvp|register now|subscribe|sign up|#sponsored)\b/i.test(text)) return null;

  const postedAt = p.createdAt || p.created_at || p.date;
  return {
    id: `x-${slugify(screenName)}-${(p.id || p.tweet_id || "").toString().slice(-8)}`,
    name,
    company: extractCompany(user.description || ""),
    role: extractRole(user.description || ""),
    twitterUrl: `https://x.com/${screenName}`,
    linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
      `${name} ${extractCompany(user.description || "")}`.trim()
    )}`,
    sourcePostUrl: p.url || p.twitterUrl || `https://x.com/${screenName}/status/${p.id}`,
    sourceQuote: truncate(text),
    signalReason: "Public X / Twitter post about Cannes Lions 2026",
    yearSignal: detectYearSignal(text),
    detectedAt: postedAt ? new Date(postedAt).toISOString() : new Date().toISOString(),
  };
}

// ----- LinkedIn-via-Google SERP mapper -------------------------------------

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
  if (rawParts.length < 2) return null; // single-segment vanity URLs aren't splittable

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
    "cannes lions","the festival","festival of creativity",
    "ad age","linkedin","post by","'s post","’s post","' post",
  ]) {
    if (lower.includes(bad)) return false;
  }
  if (!/^[A-Z]/u.test(t)) return false;
  return true;
}

function nameFromSerpTitle(title) {
  if (!title) return null;
  let t = title;
  // Match "Name's Post", "Name’s Post", AND "Name' Post" (name ending in s).
  t = t.replace(/[’']s?\s+Post\b.*$/i, "");
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

  const profileUrl = `https://www.linkedin.com/in/${fromUrl.slug}/`;
  const cleanQuote = desc
    .replace(/\bRead more\b\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);

  return {
    id: `g-${fromUrl.slug.replace(/[^a-z0-9-]/gi, "").slice(0, 40)}`,
    name,
    company: "",
    role: "",
    linkedinUrl: profileUrl,
    sourcePostUrl: url,
    sourceQuote: cleanQuote,
    signalReason:
      "Public LinkedIn post about Cannes Lions 2026 (Google-indexed)",
    yearSignal: detectYearSignal(cleanQuote),
    detectedAt: new Date().toISOString(),
  };
}

// ----- pipeline -------------------------------------------------------------

async function runXScrape() {
  const out = [];
  for (const q of X_QUERIES) {
    console.log(`  x  "${q}"…`);
    try {
      const tweets = await callApify(X_ACTOR, {
        searchTerms: [q],
        tweetLanguage: "en",
        maxItems: MAX_ITEMS_PER_QUERY,
        sort: "Latest",
      });
      console.log(`     got ${tweets.length}`);
      for (const t of tweets) {
        const m = mapXPost(t);
        if (m) out.push(m);
      }
    } catch (err) {
      console.warn(`  ! x "${q}" failed: ${err.message}`);
    }
  }
  return out;
}

async function runLinkedInSerpScrape() {
  console.log(`  linkedin (via Google SERP) · ${LINKEDIN_SERP_QUERIES.length} queries…`);
  try {
    const pages = await callApify(LINKEDIN_SERP_ACTOR, {
      queries: LINKEDIN_SERP_QUERIES.join("\n"),
      maxPagesPerQuery: 2,
      countryCode: "us",
      languageCode: "en",
    });
    console.log(`     got ${pages.length} SERP pages`);
    const out = [];
    const seenSlugs = new Set();
    for (const page of pages) {
      for (const r of page.organicResults || []) {
        const m = mapSerpItem(r);
        if (!m) continue;
        const slug = m.linkedinUrl.match(/linkedin\.com\/in\/([^/?#]+)/)?.[1];
        if (slug && seenSlugs.has(slug)) continue;
        seenSlugs.add(slug);
        out.push(m);
      }
    }
    return out;
  } catch (err) {
    console.warn(`  ! linkedin SERP failed: ${err.message}`);
    return [];
  }
}

async function main() {
  console.log(`scrape-cannes-signals · X=${X_ACTOR} · LinkedIn-SERP=${LINKEDIN_SERP_ACTOR}`);

  const blocklist = loadBlocklist();

  const [xSignals, liSignals] = await Promise.all([
    runXScrape(),
    runLinkedInSerpScrape(),
  ]);
  const fresh = [...xSignals, ...liSignals];
  console.log(`\ntotal fresh signals: ${fresh.length} (X: ${xSignals.length}, LinkedIn: ${liSignals.length})`);

  // Dedupe within fresh batch by LinkedIn profile slug + X handle.
  const seenKeys = new Set();
  const deduped = [];
  for (const p of fresh) {
    const liSlug =
      p.linkedinUrl?.match(/linkedin\.com\/in\/([^/?#]+)/)?.[1] ?? "";
    const xHandle = p.twitterUrl?.match(/x\.com\/([^/?#]+)/)?.[1] ?? "";
    const key = `${liSlug}|${xHandle}|${p.name.toLowerCase()}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    deduped.push(p);
  }
  console.log(`after intra-batch dedupe: ${deduped.length}`);

  // Preserve curated entries (anything not starting with x- or g-).
  let existing = [];
  try {
    existing = JSON.parse(readFileSync(OUTPUT_PATH, "utf8"));
  } catch {
    /* file may not exist on first run */
  }
  const curated = existing.filter(
    (p) => !p.id?.startsWith("g-") && !p.id?.startsWith("x-")
  );
  const curatedSlugs = new Set();
  const curatedNames = new Set();
  for (const p of curated) {
    const li = p.linkedinUrl?.match(/linkedin\.com\/in\/([^/?#]+)/)?.[1];
    if (li) curatedSlugs.add(li);
    if (p.name) curatedNames.add(p.name.toLowerCase().trim());
  }

  // Apply blocklist + curated-list dedupe.
  const newOnes = deduped.filter((p) => {
    const liLower = (p.linkedinUrl || "").toLowerCase();
    if ([...blocklist].some((b) => b && liLower.includes(b))) return false;
    const slug = liLower.match(/linkedin\.com\/in\/([^/?#]+)/)?.[1];
    if (slug && curatedSlugs.has(slug)) return false;
    if (curatedNames.has((p.name || "").toLowerCase().trim())) return false;
    return true;
  });
  newOnes.sort((a, b) => a.name.localeCompare(b.name));

  if (curated.length === 0 && newOnes.length === 0) {
    console.warn("no results from any source. data/people.json left unchanged.");
    process.exit(2);
  }

  const merged = [...curated, ...newOnes];
  writeFileSync(OUTPUT_PATH, JSON.stringify(merged, null, 2) + "\n", "utf8");

  let refresh = {};
  try {
    refresh = JSON.parse(readFileSync(REFRESH_PATH, "utf8"));
  } catch {
    /* */
  }
  refresh.people = {
    lastUpdated: new Date().toISOString(),
    count: merged.length,
  };
  writeFileSync(REFRESH_PATH, JSON.stringify(refresh, null, 2) + "\n", "utf8");

  const goingCount = merged.filter((p) => p.yearSignal === "going-this-year").length;
  console.log(
    `\nwrote ${merged.length} entries  (${curated.length} curated + ${newOnes.length} fresh; ${goingCount} going-this-year)`
  );
}

main().catch((err) => {
  console.error("scrape failed:", err);
  process.exit(1);
});
