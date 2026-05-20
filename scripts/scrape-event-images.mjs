// For every event in data/events.json, fetch the registrationUrl,
// extract the og:image (or twitter:image) meta tag, download the image,
// store it locally under public/events/<id>.jpg, and set imageUrl on the
// event. Skips events that already have a non-empty imageUrl.
//
// Idempotent: re-running only touches events without imageUrl.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVENTS_PATH = path.join(ROOT, "data", "events.json");
const OUT_DIR = path.join(ROOT, "public", "events");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

if (!fs.existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}`);
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const events = JSON.parse(fs.readFileSync(EVENTS_PATH, "utf-8"));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  defaultViewport: { width: 1280, height: 800 },
  args: ["--hide-scrollbars"],
});

let added = 0;
let skipped = 0;
let failed = 0;

try {
  for (const event of events) {
    if (event.imageUrl) {
      skipped++;
      continue;
    }
    if (!event.registrationUrl) {
      console.log(`-- ${event.id}: no registrationUrl, skip`);
      skipped++;
      continue;
    }

    const localPath = `/events/${event.id}.jpg`;
    const onDiskPath = path.join(OUT_DIR, `${event.id}.jpg`);

    process.stdout.write(`${event.id.padEnd(36)} `);

    let page;
    try {
      page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      await page.goto(event.registrationUrl, {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });

      const imageUrl = await page.evaluate(() => {
        const sel = [
          'meta[property="og:image:secure_url"]',
          'meta[property="og:image"]',
          'meta[name="og:image"]',
          'meta[name="twitter:image"]',
          'meta[property="twitter:image"]',
        ];
        for (const s of sel) {
          const el = document.querySelector(s);
          if (el) {
            const v = el.getAttribute("content");
            if (v) return v;
          }
        }
        return null;
      });

      if (!imageUrl) {
        console.log("✗ no og:image found");
        failed++;
        await page.close();
        continue;
      }

      // Resolve relative URL against the event URL
      const absolute = new URL(imageUrl, event.registrationUrl).toString();

      // Download to disk
      const res = await fetch(absolute, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: event.registrationUrl,
        },
      });
      if (!res.ok) {
        console.log(`✗ image fetch ${res.status}`);
        failed++;
        await page.close();
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1000) {
        console.log(`✗ image too small (${buf.length}b)`);
        failed++;
        await page.close();
        continue;
      }
      fs.writeFileSync(onDiskPath, buf);
      event.imageUrl = localPath;
      console.log(`✓ ${buf.length}b → ${localPath}`);
      added++;
      await page.close();
    } catch (err) {
      console.log(`✗ ${err.message?.split("\n")[0] ?? err}`);
      failed++;
      if (page) await page.close().catch(() => {});
    }
  }
} finally {
  await browser.close();
}

fs.writeFileSync(EVENTS_PATH, JSON.stringify(events, null, 2) + "\n");
console.log(`\nDone. Added: ${added}  Skipped: ${skipped}  Failed: ${failed}`);
console.log(`Updated ${EVENTS_PATH}`);
