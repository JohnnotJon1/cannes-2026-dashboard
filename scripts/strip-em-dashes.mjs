#!/usr/bin/env node
// Strip every em dash (U+2014 "—") from rendered content.
//
// Rule: " — " → ", ", bare "—" → ", ", then collapse any ", ," → ","
// and " +" → " " runs that pop out.
//
// Walks: data/people.json + data/events.json (JSON-aware) plus all
// .tsx/.ts/.css/.md under app/, components/, lib/ (plain-text).
// Skips: node_modules/, .next/, .vercel/, public/ (binary), scripts/
// (mining scripts may keep their own em dashes; their OUTPUT goes
// through this script before shipping anyway).
//
// Idempotent. Run as: node scripts/strip-em-dashes.mjs

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const EM = "—"; // em dash

function rewrite(s) {
  return s
    .replace(/ — /g, ", ")
    .replace(/—/g, ", ")
    .replace(/, ,/g, ",")
    .replace(/ {2,}/g, " ");
}

function countEm(s) {
  let n = 0;
  for (const c of s) if (c === EM) n++;
  return n;
}

// JSON path: parse → walk → rewrite all string leaves → re-serialize.
function rewriteJsonFile(path) {
  const raw = readFileSync(path, "utf8");
  const before = countEm(raw);
  if (before === 0) return { path, before: 0, after: 0, touched: false };
  const parsed = JSON.parse(raw);
  function walk(node) {
    if (typeof node === "string") return rewrite(node);
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === "object") {
      const out = {};
      for (const [k, v] of Object.entries(node)) out[k] = walk(v);
      return out;
    }
    return node;
  }
  const next = walk(parsed);
  const serialized = JSON.stringify(next, null, 2) + "\n";
  writeFileSync(path, serialized);
  return { path, before, after: countEm(serialized), touched: true };
}

// Plain-text path: just regex over the whole file.
function rewriteTextFile(path) {
  const raw = readFileSync(path, "utf8");
  const before = countEm(raw);
  if (before === 0) return { path, before: 0, after: 0, touched: false };
  const next = rewrite(raw);
  writeFileSync(path, next);
  return { path, before, after: countEm(next), touched: true };
}

const SKIP_DIRS = new Set(["node_modules", ".next", ".vercel", ".git", "public", "scripts"]);
const TEXT_EXT = new Set([".tsx", ".ts", ".jsx", ".js", ".css", ".md", ".mdx"]);

function walkDir(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walkDir(p, files);
    else if (TEXT_EXT.has(extname(entry))) files.push(p);
  }
  return files;
}

function main() {
  const results = [];

  // JSON data files (only the ones with visible content).
  for (const p of ["data/people.json", "data/events.json"]) {
    const abs = join(ROOT, p);
    try {
      results.push(rewriteJsonFile(abs));
    } catch (e) {
      console.error(`SKIP ${p}: ${e.message}`);
    }
  }

  // Source code text files under app/, components/, lib/.
  for (const dir of ["app", "components", "lib"]) {
    const abs = join(ROOT, dir);
    try {
      for (const f of walkDir(abs)) {
        results.push(rewriteTextFile(f));
      }
    } catch (e) {
      console.error(`SKIP ${dir}/: ${e.message}`);
    }
  }

  const touched = results.filter((r) => r.touched);
  const totalBefore = touched.reduce((sum, r) => sum + r.before, 0);
  const totalAfter = results.reduce((sum, r) => sum + r.after, 0);

  console.log(`Rewrote em dashes in ${touched.length} files:`);
  for (const r of touched) {
    console.log(`  ${r.before.toString().padStart(4)} → ${r.after}  ${r.path.replace(ROOT + "/", "")}`);
  }
  console.log(`\nTotal: ${totalBefore} em dashes removed. Remaining: ${totalAfter}.`);

  if (totalAfter !== 0) {
    console.error("\n❌ Some em dashes survived. Check files above with non-zero `after`.");
    process.exit(1);
  }
}

main();
