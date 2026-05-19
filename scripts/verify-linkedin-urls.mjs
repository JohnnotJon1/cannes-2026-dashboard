#!/usr/bin/env node
// Verify every entry in data/people.json:
// - URL slug must plausibly match the person's name (otherwise fall back to LinkedIn search)
// - Drop entries where the post is about a different event (MIPIM, etc.)
// - Repair entries where the "name" field is contaminated with post-title text by
//   re-deriving the name from the URL slug

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PEOPLE_PATH = path.resolve(__dirname, "..", "data", "people.json");
const REFRESH_PATH = path.resolve(__dirname, "..", "data", "refresh.json");

const APPLY = process.argv.includes("--apply");

// Topical filter: post quote / name must look like Cannes Lions, not MIPIM/Berlinale/etc.
const WRONG_EVENT_KEYWORDS = ["MIPIM", "Berlinale", "SXSW", "TIFF", "Sundance"];

function slugFromUrl(url) {
  if (!url) return "";
  const match = url.match(/\/in\/([^/?#]+)/);
  if (!match) return "";
  try {
    return decodeURIComponent(match[1]).toLowerCase();
  } catch {
    return match[1].toLowerCase();
  }
}

function normalize(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function searchUrl(name) {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}`;
}

// Convert "neo-makhele-36821621" or "sophie-godfrey" to "Neo Makhele" / "Sophie Godfrey".
// LinkedIn hash suffixes always contain at least one digit (e.g. "81b61215a"),
// so we only strip when the trailing token has digits — otherwise we'd kill
// legit surnames like "godfrey".
function slugToName(slug) {
  if (!slug) return "";
  const cleaned = slug.replace(/-[a-z0-9]*\d[a-z0-9]*$/i, "");
  return cleaned
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// Does the entry's text indicate a different event (MIPIM etc.) rather than Cannes Lions?
// Note: MIPIM happens in Cannes too, so a plain "Cannes" mention isn't enough — we
// require "Cannes Lions" specifically to keep an entry that also mentions MIPIM.
function looksLikeWrongEvent(person) {
  const haystack = `${person.name} ${person.sourceQuote || ""}`;
  const mentionsCannesLions = /cannes\s+lions/i.test(haystack);
  const mentionsWrong = WRONG_EVENT_KEYWORDS.some((kw) =>
    new RegExp(`\\b${kw}\\b`, "i").test(haystack),
  );
  return mentionsWrong && !mentionsCannesLions;
}

// Does the name look like it's actually post text (longer than 4 tokens, has punctuation
// or sentence words like "the" / "and" / "for")?
function looksLikePostText(name) {
  if (!name) return false;
  const tokens = name.trim().split(/\s+/);
  if (tokens.length > 4) return true;
  const lower = name.toLowerCase();
  if (/[.!?]/.test(name)) return true;
  if (/^(i'm|im|we're|were|the|and|for|how|why|what|when|where|join|attending|going|boost|maximize|join|connect)\b/i.test(lower)) return true;
  // Single-token names ("Lions", "Cannes") or all-caps shouts are not personal names.
  if (tokens.length === 1) return true;
  if (name === name.toUpperCase() && name.length > 3) return true;
  // Two-word capitalized post fragments like "LIONS Sport"
  if (/^(LIONS|CANNES|MIPIM)\b/.test(name)) return true;
  return false;
}

// Is this entry an organization/brand page, not a real person?
function looksLikeOrganization(person) {
  const slug = slugFromUrl(person.linkedinUrl || "");
  const name = person.name || "";
  const ORG_HINTS = [
    /^the-/,
    /-group$/,
    /-agency$/,
    /-collective$/,
    /-magazine$/,
    /-media$/,
    /-network$/,
    /-foundation$/,
    /-guide$/,
    /-studio$/,
    /-studios$/,
    /-contractors(?:-nv)?$/,
    /-ltd$/,
    /-inc$/,
    /-llc$/,
    /-nv$/,
    /-gmbh$/,
    /-co$/,
    /-corp$/,
  ];
  if (ORG_HINTS.some((re) => re.test(slug))) return true;
  if (/^The /.test(name)) return true;
  return false;
}

const people = JSON.parse(fs.readFileSync(PEOPLE_PATH, "utf-8"));

const drops = [];
const renames = [];
const urlFallbacks = [];

const kept = [];
for (const person of people) {
  // Drop: wrong-event posts (MIPIM, etc.)
  if (looksLikeWrongEvent(person)) {
    drops.push({ id: person.id, name: person.name, reason: "wrong event" });
    continue;
  }

  // Drop: organization / brand pages (not real people)
  if (looksLikeOrganization(person)) {
    drops.push({ id: person.id, name: person.name, reason: "organization page" });
    continue;
  }

  let working = { ...person };

  // Repair: name field contaminated by post-title text
  if (looksLikePostText(working.name)) {
    const slug = slugFromUrl(working.linkedinUrl || "");
    const derivedName = slugToName(slug);
    if (derivedName && derivedName.split(" ").length >= 2) {
      renames.push({ id: working.id, from: working.name, to: derivedName });
      working = { ...working, name: derivedName };
    } else {
      drops.push({ id: working.id, name: working.name, reason: "garbage name, no slug" });
      continue;
    }
  }

  // Fallback: replace wrong-profile URLs with a LinkedIn search URL
  const url = working.linkedinUrl || "";
  if (url.includes("/in/")) {
    const slug = slugFromUrl(url);
    const slugNorm = normalize(slug);
    const tokens = working.name
      .split(/[\s\-']+/)
      .map(normalize)
      .filter((t) => t.length >= 3);
    const matched = tokens.length === 0 || tokens.some((t) => slugNorm.includes(t));
    if (!matched) {
      urlFallbacks.push({ id: working.id, name: working.name, slug });
      working = { ...working, linkedinUrl: searchUrl(working.name) };
    }
  }

  kept.push(working);
}

console.log(`Started with ${people.length} entries.`);
console.log(`Dropped:        ${drops.length}`);
for (const d of drops) console.log(`  - ${d.name.padEnd(60)} (${d.reason})`);
console.log(`Renamed:        ${renames.length}`);
for (const r of renames) console.log(`  - ${r.from.padEnd(50)} -> ${r.to}`);
console.log(`Search-fallback ${urlFallbacks.length} bad LinkedIn URLs:`);
for (const u of urlFallbacks) console.log(`  - ${u.name.padEnd(30)} (was: ${u.slug})`);
console.log(`Final count:    ${kept.length}`);

if (!APPLY) {
  console.log(`\nRun with --apply to write changes to ${PEOPLE_PATH}.`);
  process.exit(0);
}

fs.writeFileSync(PEOPLE_PATH, JSON.stringify(kept, null, 2) + "\n");

// Bump refresh.json
const refresh = JSON.parse(fs.readFileSync(REFRESH_PATH, "utf-8"));
refresh.people = { lastUpdated: new Date().toISOString(), count: kept.length };
fs.writeFileSync(REFRESH_PATH, JSON.stringify(refresh, null, 2) + "\n");

console.log(`\nWrote ${kept.length} entries to ${PEOPLE_PATH}`);
console.log(`Bumped ${REFRESH_PATH} to count=${kept.length}`);
