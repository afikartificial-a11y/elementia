/**
 * tools-dev.mjs — jalankan toko + API di komputer sendiri, tanpa Cloudflare.
 *
 * Kenapa ada: membuka index.html / checkout.html lewat server file statis membuat semua
 * panggilan /api/* dijawab 404 HTML. Akibatnya checkout & "buat akun" selalu gagal dengan
 * pesan "Respon tidak valid" — bukan karena kodenya salah, tapi karena tidak ada API.
 *
 * Pakai (setelah `python build.py` dan `python assemble.py dist`):
 *   node tools-dev.mjs            → http://127.0.0.1:8787
 *   node tools-dev.mjs 8900       → pilih port lain
 *   node tools-dev.mjs --memory   → data sementara (hilang saat berhenti)
 *
 * D1 diganti SQLite lokal (node:sqlite, Node 22+). Secara bawaan data DISIMPAN KE FILE
 * `data/local.db` di folder proyek, jadi pesanan, akun, dan alamat tetap ada setelah
 * server dimatikan. Lokasi bisa diubah lewat variabel lingkungan BK_DB.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, "dist");
const PUB = path.join(DIST, "public");
const PORT = parseInt(process.argv[2] || "8787", 10);

if (!fs.existsSync(path.join(DIST, "worker.js"))) {
  console.error("dist/worker.js belum ada. Jalankan dulu: python assemble.py dist");
  process.exit(2);
}

// ---------- D1 tiruan di atas node:sqlite, persisten ke file ----------
const MEMORY = process.argv.includes("--memory");
const DBFILE = process.env.BK_DB || path.join(ROOT, "data", "local.db");
if (!MEMORY) fs.mkdirSync(path.dirname(DBFILE), { recursive: true });
const db = new DatabaseSync(MEMORY ? ":memory:" : DBFILE);
if (!MEMORY) db.exec("PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;");
db.exec(fs.readFileSync(path.join(DIST, "schema.sql"), "utf8"));

// Terapkan migrasi berurutan bila ada. Skema memakai IF NOT EXISTS dan ALTER di dalam
// migrate-vN.sql, jadi aman dijalankan berulang: galat "duplicate column" diabaikan.
const WDIR = path.join(ROOT, "worker");
if (fs.existsSync(WDIR)) {
  const migs = fs.readdirSync(WDIR).filter((n) => /^migrate-v\d+\.sql$/.test(n))
    .sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));
  for (const f of migs) {
    const sql = fs.readFileSync(path.join(WDIR, f), "utf8");
    for (const stmt of sql.split(/;\s*(?:\r?\n|$)/).map((s) => s.trim()).filter(Boolean)) {
      try { db.exec(stmt); } catch (e) {
        if (!/duplicate column|already exists/i.test(e.message)) console.error("migrasi", f, "→", e.message);
      }
    }
  }
}

function makeStmt(sql, params) {
  return {
    bind: (...a) => makeStmt(sql, a),
    async first() {
      const row = db.prepare(sql).get(...params);
      return row === undefined ? null : row;
    },
    async all() {
      return { results: db.prepare(sql).all(...params) };
    },
    async run() {
      const r = db.prepare(sql).run(...params);
      return { meta: { changes: r.changes, last_row_id: Number(r.lastInsertRowid) } };
    },
  };
}
const DB = {
  prepare: (sql) => makeStmt(sql, []),
  async batch(stmts) {
    const out = [];
    for (const s of stmts) out.push(await s.run());
    return out;
  },
};

// ---------- ASSETS tiruan ----------
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml", ".ico": "image/x-icon",
};
function serveStatic(req) {
  const url = new URL(req.url);
  let rel = decodeURIComponent(url.pathname);
  if (rel === "/") rel = "/index.html";
  const tries = [rel, rel + ".html", path.posix.join(rel, "index.html")];
  for (const t of tries) {
    const file = path.join(PUB, t);
    if (!file.startsWith(PUB)) continue;
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      return new Response(fs.readFileSync(file), {
        status: 200,
        headers: { "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" },
      });
    }
  }
  return new Response("Not found", { status: 404, headers: { "content-type": "text/plain" } });
}

const env = {
  DB,
  ASSETS: { fetch: async (req) => serveStatic(req) },
  ADMIN_WA: process.env.ADMIN_WA || "6285138361551",
  PUBLIC_URL: process.env.PUBLIC_URL || `http://127.0.0.1:${PORT}`,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin-lokal",
  // BITESHIP_API_KEY / MIDTRANS_SERVER_KEY sengaja dibiarkan kosong → mode simulasi
  ...(process.env.BITESHIP_API_KEY ? { BITESHIP_API_KEY: process.env.BITESHIP_API_KEY } : {}),
  ...(process.env.ORIGIN_POSTAL_CODE ? { ORIGIN_POSTAL_CODE: process.env.ORIGIN_POSTAL_CODE } : {}),
};

const workerUrl = pathToFileURL(path.join(DIST, "worker.js")).href + "?v=" + Date.now();
const { default: worker } = await import(workerUrl);

http.createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const request = new Request(`http://127.0.0.1:${PORT}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : body,
    });
    const out = await worker.fetch(request, env);
    res.writeHead(out.status, Object.fromEntries(out.headers));
    res.end(Buffer.from(await out.arrayBuffer()));
  } catch (e) {
    console.error("GAGAL:", e);
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("harness error: " + e.message);
  }
}).listen(PORT, () => {
  console.log(`Toko + API lokal: http://localhost:${PORT} atau http://127.0.0.1:${PORT}`);
  console.log(MEMORY
    ? "D1: in-memory — data hilang saat proses berhenti (mode --memory)."
    : "D1: file " + DBFILE + " — persisten, skema & migrasi sudah diterapkan.");
});
