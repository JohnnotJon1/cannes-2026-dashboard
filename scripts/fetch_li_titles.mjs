#!/usr/bin/env node
// Backfill role + company for people with linkedinUrl but empty fields,
// using dev_fusion~linkedin-profile-scraper through the n8n proxy.
// Same actor + transport as the earlier photo scrape (see commit bb7b2f1).
//
// Usage:
//   node scripts/fetch_li_titles.mjs
//
// Reads people.json, patches in-place, prints stats.

import { readFileSync, writeFileSync } from "node:fs";

const PEOPLE_PATH = "/Users/JohnG_1/Desktop/Claude-Work/cannes-command-center/data/people.json";
const APIFY_TOKEN = process.env.APIFY_TOKEN;
if (!APIFY_TOKEN) {
  console.error("error: APIFY_TOKEN env var is required");
  console.error("       APIFY_TOKEN=apify_api_xxx node scripts/fetch_li_titles.mjs");
  process.exit(1);
}
const PROXY = "https://airpost.app.n8n.cloud/webhook/claude-http-proxy";
const ACTOR = "dev_fusion~linkedin-profile-scraper";
const BATCH_SIZE = 40;

function slugOf(linkedinUrl) {
  return linkedinUrl?.match(/linkedin\.com\/in\/([^/?#]+)/i)?.[1]?.toLowerCase() ?? null;
}

// Parse a role/title out of a LinkedIn headline. Mirrors the regex used by
// scripts/scrape-cannes-signals.mjs so the parsing is consistent across
// sources. Falls back to the first 60 chars of headline if no role keyword.
function extractRoleFromHeadline(headline) {
  if (!headline) return "";
  const m = headline.match(
    /\b(CEO|CMO|CTO|COO|CRO|CCO|CFO|CSO|Chief [A-Za-z ]+|EVP[ A-Za-z]*|SVP[ A-Za-z]*|VP[ A-Za-z]*|Vice President[ A-Za-z]*|Founder|Co-Founder|Cofounder|President|Director[ A-Za-z]*|Head of [A-Za-z ]+|General Manager|Senior Manager|Manager[ A-Za-z]*|Senior Lead|Lead[ A-Za-z]*|Partner|Principal|Strategist|Producer|Editor|Anchor|Author|Designer)\b/i
  );
  if (m) return m[0].trim();
  // No role keyword: take the chunk before the first separator (| or @ or -)
  const firstChunk = headline.split(/\s*[|@—•·\-]\s*/)[0].trim();
  return firstChunk.length > 0 && firstChunk.length < 80 ? firstChunk : headline.slice(0, 60).trim();
}

async function fetchBatch(profileUrls) {
  const body = {
    method: "POST",
    url: `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=300&memory=1024`,
    headers: { "Content-Type": "application/json" },
    payload: { profileUrls },
  };
  const res = await fetch(PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Proxy ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error(`Expected array: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return data;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const people = JSON.parse(readFileSync(PEOPLE_PATH, "utf8"));

  // Target: people with a LinkedIn URL AND empty role OR empty company.
  const targets = people.filter((p) => {
    const slug = slugOf(p.linkedinUrl);
    if (!slug) return false;
    const roleEmpty = !p.role || p.role.trim() === "";
    const companyEmpty = !p.company || p.company.trim() === "";
    return roleEmpty || companyEmpty;
  });

  console.log(`People needing role/company backfill: ${targets.length}`);
  if (targets.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  const urls = [...new Set(targets.map((p) => `https://www.linkedin.com/in/${slugOf(p.linkedinUrl)}/`))];
  console.log(`Unique URLs: ${urls.length}`);

  const batches = chunk(urls, BATCH_SIZE);
  console.log(`Firing ${batches.length} batches of up to ${BATCH_SIZE}\n`);

  const all = [];
  let n = 0;
  for (const batch of batches) {
    n++;
    const start = Date.now();
    process.stdout.write(`[batch ${n}/${batches.length}] ${batch.length} URLs...`);
    try {
      const items = await fetchBatch(batch);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      const withCompany = items.filter((i) => i.companyName).length;
      const withHeadline = items.filter((i) => i.headline).length;
      console.log(` got ${items.length} in ${elapsed}s (${withCompany} w/ company, ${withHeadline} w/ headline)`);
      all.push(...items);
    } catch (err) {
      console.log(` FAILED: ${err.message}`);
    }
  }

  // Build slug -> { role, company } map.
  const map = new Map();
  for (const r of all) {
    const slug = (r.publicIdentifier || slugOf(r.linkedinUrl) || "").toLowerCase();
    if (!slug) continue;
    map.set(slug, {
      role: extractRoleFromHeadline(r.headline),
      company: r.companyName?.trim() ?? "",
      headline: r.headline,
    });
  }

  console.log(`\nProfile records returned: ${all.length}`);
  console.log(`Slug→data map size: ${map.size}\n`);

  // Patch people.json: only fill empty fields, don't overwrite curated values.
  let patchedRole = 0;
  let patchedCompany = 0;
  for (const p of people) {
    const slug = slugOf(p.linkedinUrl);
    if (!slug || !map.has(slug)) continue;
    const m = map.get(slug);
    if ((!p.role || p.role.trim() === "") && m.role) {
      p.role = m.role;
      patchedRole++;
    }
    if ((!p.company || p.company.trim() === "") && m.company) {
      p.company = m.company;
      patchedCompany++;
    }
  }

  console.log(`Patched role on ${patchedRole} people`);
  console.log(`Patched company on ${patchedCompany} people`);

  writeFileSync(PEOPLE_PATH, JSON.stringify(people, null, 2) + "\n");
  console.log(`\nWrote ${PEOPLE_PATH}`);
}

main().catch((err) => {
  console.error("FAIL:", err.stack || err.message);
  process.exit(1);
});
