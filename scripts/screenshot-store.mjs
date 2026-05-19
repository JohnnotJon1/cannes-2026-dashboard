// Generate 4 Chrome Web Store screenshots from the live site at 1280x800.
// Dismisses the onboarding overlay + privacy banner + extension banner before
// each screenshot so the actual dashboard UI is captured.

import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "https://cannes-2026-dashboard.vercel.app";
const OUT = "/Users/JohnG_1/Desktop/Claude-Work/cannes-command-center/public/screenshots";

if (!existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}`);
  process.exit(1);
}

const SHOTS = [
  { path: "/",            file: "1-home.png",      label: "Dashboard" },
  { path: "/people",      file: "2-people.png",    label: "Who's going" },
  { path: "/profile",     file: "3-profile.png",   label: "Profile" },
  { path: "/extension",   file: "4-extension.png", label: "Extension landing" },
];

// Profile data to pre-fill (used for the profile screenshot).
const DEMO_PROFILE = {
  name: "Alex Lawson",
  email: "alex@example.com",
  company: "Mercer & Wells Creative",
  title: "VP of Brand Marketing",
  linkedinUrl: "https://www.linkedin.com/in/alexlawson",
  phone: "",
  updatedAt: new Date().toISOString(),
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
  args: ["--hide-scrollbars"],
});

try {
  for (const shot of SHOTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

    // Pre-seed localStorage so the onboarding overlay + banners stay dismissed.
    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.evaluate((profile) => {
      localStorage.setItem("ccc:v1:onboarding-completed", "true");
      localStorage.setItem("ccc:v1:privacy-banner-dismissed", "true");
      localStorage.setItem("ccc:v1:extension-banner-dismissed", "true");
      localStorage.setItem("ccc:v1:profile", JSON.stringify(profile));
    }, DEMO_PROFILE);

    // Now navigate to the target page with the seeded state.
    const target = BASE + shot.path;
    await page.goto(target, { waitUntil: "networkidle2", timeout: 30000 });

    // Small extra wait for hero images / web fonts.
    await new Promise((r) => setTimeout(r, 2500));

    const out = `${OUT}/${shot.file}`;
    await page.screenshot({ path: out.replace(".png", ".jpg"), type: "jpeg", quality: 92, clip: { x: 0, y: 0, width: 1280, height: 800 } });
    console.log(`✓ ${shot.label.padEnd(20)} → ${shot.file}`);
    await page.close();
  }
} finally {
  await browser.close();
}
