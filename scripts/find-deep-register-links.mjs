// For every event in data/events.json with a registrationUrl, open the
// page with Puppeteer and look for a "Register"/"RSVP"/"Apply"/"Sign up"
// anchor that points deeper than the current URL. If exactly one such
// candidate is found (and survives the form-domain whitelist + same-
// domain filter), update event.registrationUrl in place.
//
// Conservative: if there are 0 or ≥2 candidate URLs, the event is left
// unchanged. Never swaps to a worse URL.
//
// Skips events whose URL is already on a known per-event platform
// (Splash That, Luma, Eventbrite, Cvent) — those are typically already
// deep-linked.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVENTS_PATH = path.join(ROOT, "data", "events.json");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const CONCURRENCY = 4;
const PAGE_TIMEOUT = 15000;

// Already-deep-link platforms — no point re-checking the page for a
// "register" anchor; the current URL is the form.
const ALREADY_DEEP_HOSTS = [
  /(^|\.)splashthat\.com$/,
  /(^|\.)splash\.com$/,
  /(^|\.)luma\.com$/,
  /(^|\.)eventbrite\.(com|co\.uk|fr|de|es)$/,
  /(^|\.)cvent\.com$/,
  /(^|\.)cventevents\.com$/,
];

// Off-domain links we WILL follow because they're form providers.
const FORM_HOSTS = [
  /(^|\.)splashthat\.com$/,
  /(^|\.)splash\.com$/,
  /(^|\.)cvent\.com$/,
  /(^|\.)cventevents\.com$/,
  /(^|\.)eventbrite\.(com|co\.uk|fr|de|es)$/,
  /(^|\.)hubspot\.com$/,
  /(^|\.)hsforms\.com$/,
  /(^|\.)luma\.com$/,
  /(^|\.)forms\.google\.com$/,
  /(^|\.)airtable\.com$/,
];

const REGISTER_TEXT = /\b(register|rsvp|sign up|apply|request invite|request to attend|join us|reserve|secure your spot)\b/i;

function isAlreadyDeep(urlStr) {
  try {
    const u = new URL(urlStr);
    return ALREADY_DEEP_HOSTS.some((re) => re.test(u.host));
  } catch {
    return false;
  }
}

function isFormHost(urlStr) {
  try {
    const u = new URL(urlStr);
    return FORM_HOSTS.some((re) => re.test(u.host));
  } catch {
    return false;
  }
}

function normalize(urlStr) {
  try {
    const u = new URL(urlStr);
    // Drop hash, drop common tracking params for dedup purposes only
    u.hash = "";
    return u.toString();
  } catch {
    return urlStr;
  }
}

async function processOne(browser, event) {
  const inputUrl = event.registrationUrl;
  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.goto(inputUrl, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT });

    const candidates = await page.evaluate((REGISTER_TEXT_SRC) => {
      const re = new RegExp(REGISTER_TEXT_SRC, "i");
      const links = Array.from(document.querySelectorAll("a[href]"));
      return links
        .filter((a) => {
          const text = (a.textContent || "").trim();
          if (!text) return false;
          return re.test(text);
        })
        .map((a) => ({ text: a.textContent.trim().slice(0, 80), href: a.href }));
    }, REGISTER_TEXT.source);

    const inputHost = new URL(inputUrl).host;
    const inputNorm = normalize(inputUrl);

    const usable = new Map(); // normalized URL -> {text, href}
    for (const c of candidates) {
      if (!c.href) continue;
      if (c.href.startsWith("mailto:") || c.href.startsWith("tel:") || c.href.startsWith("javascript:")) continue;
      let u;
      try {
        u = new URL(c.href);
      } catch {
        continue;
      }
      const cNorm = normalize(c.href);
      if (cNorm === inputNorm) continue;
      const sameDomain = u.host === inputHost;
      const formHost = isFormHost(c.href);
      if (!sameDomain && !formHost) continue;
      // De-dup by normalized URL (collapse duplicate "Register" buttons on the page)
      if (!usable.has(cNorm)) usable.set(cNorm, c);
    }

    await page.close();

    if (usable.size === 1) {
      const pick = usable.values().next().value;
      return { id: event.id, status: "changed", from: inputUrl, to: pick.href, picked_text: pick.text };
    }
    if (usable.size === 0) {
      return { id: event.id, status: "no-candidate" };
    }
    return { id: event.id, status: "ambiguous", count: usable.size, urls: [...usable.keys()] };
  } catch (err) {
    if (page) await page.close().catch(() => {});
    return { id: event.id, status: "error", error: err.message?.split("\n")[0] };
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
        process.stdout.write(`[${idx + 1}/${items.length}] ${r.status === "changed" ? "✓ " : r.status === "error" ? "! " : "· "}${r.id}\n`);
        results.push(r);
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

  const candidates = events.filter((e) => {
    if (!e.registrationUrl) return false;
    if (isAlreadyDeep(e.registrationUrl)) return false;
    return true;
  });

  console.log(`Total events: ${events.length}`);
  console.log(`Skipping ${events.length - candidates.length} on already-deep platforms (Splash That / Luma / Eventbrite / Cvent)`);
  console.log(`Scraping ${candidates.length} candidates with concurrency ${CONCURRENCY}\n`);

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

  // Apply patches
  const changedById = new Map();
  for (const r of results) {
    if (r.status === "changed") changedById.set(r.id, r);
  }

  for (const e of events) {
    if (changedById.has(e.id)) {
      e.registrationUrl = changedById.get(e.id).to;
    }
  }

  fs.writeFileSync(EVENTS_PATH, JSON.stringify(events, null, 2) + "\n", "utf8");

  // Summary
  const stats = results.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});
  console.log(`\n=== summary ===`);
  console.log(stats);
  console.log(`\n=== updates ===`);
  for (const r of results.filter((x) => x.status === "changed")) {
    console.log(`  ${r.id}`);
    console.log(`    from: ${r.from}`);
    console.log(`    to:   ${r.to}`);
    console.log(`    (matched anchor text: "${r.picked_text}")`);
  }
  const errors = results.filter((x) => x.status === "error");
  if (errors.length) {
    console.log(`\n=== errors (${errors.length}) ===`);
    for (const r of errors.slice(0, 10)) console.log(`  ${r.id}: ${r.error}`);
  }
}

main().catch((err) => {
  console.error("FAIL:", err.stack || err.message);
  process.exit(1);
});
