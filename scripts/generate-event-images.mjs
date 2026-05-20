#!/usr/bin/env node
// scripts/generate-event-images.mjs
//
// For every event in data/events.json without an imageUrl, generate a
// Cannes-themed AI image via OpenAI gpt-image-1, save to
// public/events/<id>.jpg, and patch events.json.
//
// Each image is keyed off the event's category (beach-club, party, panel,
// etc.) with a small per-event modifier so visuals vary while staying
// on-theme. No people. No brand logos. No text in the images.
//
// Tries api.openai.com directly first (no longer sandbox-blocked per
// recent credentials.md note); falls back to the n8n claude-http-proxy
// if direct fails with a network error.
//
// Usage:
//   OPENAI_API_KEY=sk-... node scripts/generate-event-images.mjs
//   # or relies on credentials.md key inlined below

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVENTS_PATH = path.join(ROOT, "data", "events.json");
const OUT_DIR = path.join(ROOT, "public", "events");

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.error("error: OPENAI_API_KEY env var is required");
  console.error("       OPENAI_API_KEY=sk-... node scripts/generate-event-images.mjs");
  process.exit(1);
}
const PROXY = "https://airpost.app.n8n.cloud/webhook/claude-http-proxy";
const OPENAI_URL = "https://api.openai.com/v1/images/generations";

const CONCURRENCY = 4;
const SIZE = "1536x1024"; // landscape, matches card aspect

const COMMON_SUFFIX =
  ", Cannes Lions Festival of Creativity 2026, editorial magazine photography, " +
  "no people, no brand logos, no text overlays, no signs, horizontal landscape composition, " +
  "high quality, depth of field";

const PROMPTS = {
  "beach-club":
    "Luxury Mediterranean beach club at golden hour: striped sun umbrellas, white loungers, " +
    "palm trees, turquoise water, French Riviera atmosphere",
  yacht:
    "Luxury yacht moored in Cannes harbor at sunset, polished teak deck, Côte d'Azur water reflections, " +
    "fairy lights, glamorous Mediterranean vibe",
  party:
    "Cannes rooftop terrace at twilight: cocktail glasses, candles, twinkling string lights, " +
    "Mediterranean coastline view, warm romantic glow",
  dinner:
    "Elegant outdoor dining in Cannes at dusk: long table with white linens, candles, " +
    "citrus and lavender, coastal view, soft warm light",
  brunch:
    "Sun-drenched Mediterranean morning brunch: pastel parasols, fresh fruit, espresso cups, " +
    "linen tablecloth, soft natural light",
  panel:
    "Modern panel stage with sleek empty chairs and a clean white backdrop, " +
    "Riviera glass walls overlooking the sea, soft cinematic lighting",
  workshop:
    "Bright collaborative workshop space: whiteboards, mid-century modern furniture, " +
    "Riviera windows with sea view, natural daylight",
  awards:
    "Palais des Festivals red-carpet steps at sunset, golden hour, anticipatory mood, " +
    "iconic architectural composition",
  networking:
    "Cannes Croisette palm-lined promenade at golden hour: soft sunlight on cobblestones, " +
    "Mediterranean breeze, lifestyle editorial mood",
  activation:
    "Cannes Lions Festival activation along the Croisette: bright signage glow, palm trees, " +
    "afternoon sun, vibrant advertising-industry energy",
};

function promptFor(event) {
  const base = PROMPTS[event.category] ?? PROMPTS.activation;
  const modifier = event.name
    ? `, mood inspired by "${event.name.replace(/"/g, "")}"`
    : "";
  return base + modifier + COMMON_SUFFIX;
}

async function callOpenAIDirect(prompt) {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: SIZE,
      quality: "medium",
      n: 1,
      output_format: "jpeg",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI direct ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function callOpenAIViaProxy(prompt) {
  const body = {
    method: "POST",
    url: OPENAI_URL,
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    payload: {
      model: "gpt-image-1",
      prompt,
      size: SIZE,
      quality: "medium",
      n: 1,
      output_format: "jpeg",
    },
  };
  const res = await fetch(PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Proxy ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

let proxyOnly = false;

async function generateImage(prompt) {
  try {
    if (!proxyOnly) return await callOpenAIDirect(prompt);
  } catch (err) {
    if (err.message?.includes("ENOTFOUND") || err.message?.includes("network") || err.message?.includes("403") || err.message?.includes("blocked")) {
      console.warn(`  direct failed (${err.message.slice(0, 80)}), switching to proxy permanently`);
      proxyOnly = true;
    } else {
      throw err; // legit OpenAI error like content policy
    }
  }
  return await callOpenAIViaProxy(prompt);
}

async function processOne(event) {
  const id = event.id;
  const prompt = promptFor(event);
  const outPath = path.join(OUT_DIR, `${id}.jpg`);
  try {
    const json = await generateImage(prompt);
    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) throw new Error(`no b64_json in response: ${JSON.stringify(json).slice(0, 200)}`);
    const buf = Buffer.from(b64, "base64");
    fs.writeFileSync(outPath, buf);
    return { id, ok: true, size: buf.length };
  } catch (err) {
    return { id, ok: false, error: err.message };
  }
}

async function runBatched(events) {
  const results = [];
  let i = 0;
  while (i < events.length) {
    const batch = events.slice(i, i + CONCURRENCY);
    process.stdout.write(`[${i + 1}-${i + batch.length}/${events.length}] `);
    const promises = batch.map((e) =>
      processOne(e).then((r) => {
        process.stdout.write(r.ok ? `✓${r.id.slice(0, 18)} ` : `✗${r.id.slice(0, 18)} `);
        return r;
      })
    );
    const batchResults = await Promise.all(promises);
    process.stdout.write("\n");
    results.push(...batchResults);
    i += CONCURRENCY;
  }
  return results;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const events = JSON.parse(fs.readFileSync(EVENTS_PATH, "utf8"));

  const todo = events.filter((e) => !e.imageUrl);
  console.log(`Events needing AI image: ${todo.length} (of ${events.length} total)`);
  if (todo.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  console.log(`Concurrency: ${CONCURRENCY}, size: ${SIZE}, model: gpt-image-1\n`);

  const results = await runBatched(todo);

  const ok = results.filter((r) => r.ok);
  const fail = results.filter((r) => !r.ok);
  console.log(`\nGenerated: ${ok.length}  Failed: ${fail.length}`);
  if (fail.length) {
    console.log("\nFailures:");
    for (const f of fail.slice(0, 10)) console.log(`  ${f.id}: ${f.error?.slice(0, 100)}`);
  }

  // Patch events.json with imageUrl for successes
  const okIds = new Set(ok.map((r) => r.id));
  let patched = 0;
  for (const e of events) {
    if (okIds.has(e.id)) {
      e.imageUrl = `/events/${e.id}.jpg`;
      patched++;
    }
  }
  fs.writeFileSync(EVENTS_PATH, JSON.stringify(events, null, 2) + "\n");
  console.log(`\nPatched ${patched} entries in events.json`);
}

main().catch((err) => {
  console.error("FAIL:", err.stack || err.message);
  process.exit(1);
});
