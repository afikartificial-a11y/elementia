#!/usr/bin/env node
// Ganti identitas merek di berkas sumber (bukan hasil build).
// Pakai: node tools/rebrand.mjs --map brand.json [--dry-run]
//
// brand.json:
// {
//   "files": ["build.py", "shop_pages.py", "assets/js/shop.js"],   // opsional; default daftar di bawah
//   "replace": [["ELEMENTIA", "ELEMENTIA"], ["elementia.id", "elementia.id"]],
//   "rename":  [["assets/css/elementia.css", "assets/css/elementia.css"]]
// }
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const arg = n => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : null; };

const DEFAULT_FILES = [
  "build.py", "shop_pages.py", "v3_pages.py",
  "worker/worker.src.js", "worker/labels.js", "worker/wrangler.jsonc",
  "assets/js/shop.js", "assets/js/main.js", "assets/js/katalog.js", "assets/js/bisnis.js", "assets/js/galeri.js",
  "assets/css/elementia.css",
  "site.config.json", "wrangler.jsonc", "package.json",
  "agent/manifest.json", "agent/SKILL.md", "AGENTS.md", "DEPLOY.md",
];

const mapPath = arg("map");
if (!mapPath) {
  console.error("Pakai: node tools/rebrand.mjs --map brand.json [--dry-run]");
  process.exit(2);
}
const map = JSON.parse(fs.readFileSync(path.resolve(mapPath), "utf8"));
const dry = argv.includes("--dry-run");
const files = map.files || DEFAULT_FILES;
const pairs = (map.replace || []).filter(([a]) => a);

let changed = 0, total = 0;
for (const rel of files) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { console.log(`lewati (tidak ada): ${rel}`); continue; }
  let s = fs.readFileSync(p, "utf8");
  const before = s;
  const hits = {};
  for (const [from, to] of pairs) {
    const n = s.split(from).length - 1;
    if (n) { s = s.split(from).join(to); hits[from] = n; }
  }
  if (s !== before) {
    changed++; total += Object.values(hits).reduce((a, b) => a + b, 0);
    console.log(`${dry ? "[ditolak? tidak]" : "ubah"} ${rel}: ${Object.entries(hits).map(([k, v]) => `${k}=${v}`).join(", ")}`);
    if (!dry) fs.writeFileSync(p, s, "utf8");
  }
}

for (const [from, to] of map.rename || []) {
  const a = path.join(ROOT, from), b = path.join(ROOT, to);
  if (!fs.existsSync(a)) { console.log(`ganti nama dilewati: ${from} tidak ada`); continue; }
  console.log(`ganti nama: ${from} -> ${to}`);
  if (!dry) { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.renameSync(a, b); }
}

console.log(`\n${dry ? "Rencana" : "Selesai"}: ${changed} berkas, ${total} penggantian.`);
if (!dry) console.log("Lanjutkan: python build.py && python assemble.py dist");
