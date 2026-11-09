// Pustaka inti Elementia — dipakai CLI (tools/agent-cli.mjs) dan server MCP (tools/mcp-server.mjs).
// Tanpa dependensi eksternal. Semua path relatif terhadap akar proyek.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const readJson = (rel, fallback) => {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Berkas tidak ditemukan: ${rel}`);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
};

const norm = s => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
const stripPrefix = s => norm(s).replace(/^(kota|kabupaten|kab\.?|kecamatan|kec\.?)\s+/i, "");
const rp = n => "Rp" + Number(n || 0).toLocaleString("id-ID");

// ---------- katalog ----------
export function catalog() {
  const d = readJson("assets/data/catalog.json");
  return {
    sumber: d.sumber,
    catatan_berat: d.catatan_berat,
    items: d.items.map(i => ({ ...i, berat_bruto_g: i.berat_bruto_g || Math.round(i.berat_g * 1.1) })),
  };
}

export function searchCatalog(term, limit = 20) {
  const terms = norm(term).split(" ").filter(Boolean);
  const items = catalog().items.filter(i => {
    if (!terms.length) return true;
    const hay = norm([i.sku, i.nama, i.jenis, i.bentuk, i.kemasan, i.ukuran].join(" ")).replace(/-/g, " ");
    return terms.every(t => hay.includes(t));
  });
  return { total: items.length, items: items.slice(0, limit) };
}

export function getSku(sku) {
  const hit = catalog().items.find(i => i.sku === String(sku).trim());
  if (!hit) throw new Error(`SKU tidak ditemukan: ${sku}`);
  return hit;
}

// ---------- wilayah ----------
export function provinsiList() {
  return readJson("assets/data/wilayah/index.json").provinsi;
}

export function provinsiData(id) {
  return readJson(`assets/data/wilayah/${id}.json`);
}

function findProvinsi(nama) {
  const key = stripPrefix(nama);
  const hit = provinsiList().find(p => stripPrefix(p.nama) === key);
  if (!hit) throw new Error(`Provinsi tidak dikenali: ${nama}. Pakai salah satu nama resmi (lihat wilayah --list).`);
  return hit;
}

export function resolveWilayah({ provinsi, kabupaten, kecamatan } = {}) {
  const p = findProvinsi(provinsi);
  const data = provinsiData(p.id);
  const out = { provinsi: p.nama, kabupaten: null, kecamatan: null, kodepos: [] };
  if (!kabupaten) {
    out.daftar_kabupaten = data.kabkot.map(k => k.nama);
    return out;
  }
  // Cocokkan persis dulu ("Kota Bandung" vs "Kabupaten Bandung" harus dibedakan),
  // baru jatuh ke pencocokan tanpa awalan bila hanya ada satu kandidat.
  let k = data.kabkot.find(x => norm(x.nama) === norm(kabupaten));
  if (!k) {
    const cand = data.kabkot.filter(x => stripPrefix(x.nama) === stripPrefix(kabupaten));
    if (cand.length > 1) throw new Error(`Nama "${kabupaten}" ambigu di ${p.nama}: ${cand.map(x => x.nama).join(", ")}. Tulis lengkap.`);
    k = cand[0];
  }
  if (!k) throw new Error(`Kabupaten/kota "${kabupaten}" tidak ada di ${p.nama}.`);
  out.kabupaten = k.nama;
  if (!kecamatan) {
    out.daftar_kecamatan = k.kecamatan.map(x => x.nama);
    return out;
  }
  const c = k.kecamatan.find(x => norm(x.nama) === norm(kecamatan));
  if (!c) throw new Error(`Kecamatan "${kecamatan}" tidak ada di ${k.nama}.`);
  out.kecamatan = c.nama;
  out.kodepos = c.kodepos;
  return out;
}

export function searchWilayah(term, limit = 25) {
  const t = norm(term);
  if (!t) throw new Error("Kata kunci wilayah kosong.");
  const hits = [];
  for (const p of provinsiList()) {
    if (norm(p.nama).includes(t)) hits.push({ tingkat: "provinsi", provinsi: p.nama });
    const d = provinsiData(p.id);
    for (const k of d.kabkot) {
      if (norm(k.nama).includes(t)) hits.push({ tingkat: "kabupaten", provinsi: p.nama, kabupaten: k.nama });
      for (const c of k.kecamatan) {
        if (norm(c.nama) === t || norm(c.nama).includes(t)) {
          hits.push({ tingkat: "kecamatan", provinsi: p.nama, kabupaten: k.nama, kecamatan: c.nama, kodepos: c.kodepos });
        }
        if (hits.length >= limit * 6) break;
      }
      if (hits.length >= limit * 6) break;
    }
    if (hits.length >= limit * 6) break;
  }
  return { total: hits.length, items: hits.slice(0, limit) };
}

// ---------- ongkir ----------
const PROV_ALIAS = {
  "papua selatan": "papua", "papua tengah": "papua", "papua pegunungan": "papua",
  "papua barat daya": "papua barat",
};
const LABEL = {
  "jne:reg": "JNE Reguler", "jnt:ez": "J&T EZ",
  "sicepat:reg": "SiCepat REG", "spx:std": "Shopee Express (SPX) Standard",
};

export function rateTable() {
  return readJson("data/tarif-provinsi-2026-11.json");
}

export function shippingRates({ provinsi, kodePos, items } = {}) {
  if (!provinsi) throw new Error("provinsi wajib diisi.");
  if (!/^\d{5}$/.test(String(kodePos || ""))) throw new Error("kodePos harus 5 angka.");
  const list = Array.isArray(items) && items.length ? items : [{ sku: "lada-putih-butir-botol-grinder-55g", qty: 1 }];
  let weight = 0, subtotal = 0;
  const lines = list.map(({ sku, qty }) => {
    const it = getSku(sku);
    const q = Math.max(1, parseInt(qty || 1, 10));
    weight += it.berat_bruto_g * q;
    subtotal += it.harga * q;
    return { sku: it.sku, nama: it.nama, qty: q, harga: it.harga, berat_netto_g: it.berat_g, berat_bruto_g: it.berat_bruto_g };
  });
  const kg = Math.max(1, Math.ceil(weight / 1000));
  const key = PROV_ALIAS[norm(provinsi)] || norm(provinsi);
  const t = rateTable().provinsi?.[Object.keys(rateTable().provinsi).find(k => norm(k) === key)];
  if (!t) throw new Error(`Tarif untuk provinsi "${provinsi}" belum tersedia.`);
  const rates = Object.entries(LABEL).map(([code, label]) => {
    const r = t.rates[code];
    if (!r) return null;
    const price = kg <= 1 ? r.r1 : r.r1 + (kg - 1) * r.inc;
    return { code, label, price, rp: rp(price), etd: r.etd ? `${r.etd} hari` : "", terukur: !r.est };
  }).filter(Boolean);
  return {
    provinsi_terpakai: t.kota_uji || provinsi, provinsi_input: provinsi,
    kode_pos: kodePos, berat_netto_g: lines.reduce((a, l) => a + l.berat_netto_g * l.qty, 0),
    berat_bruto_g: weight, kg, subtotal, lines, rates,
    catatan: "Tarif acuan KiriminAja (8 Nov 2026), bukan real-time. Berat bruto = netto + 10%.",
  };
}

// ---------- pesanan (baca-saja dari database lokal) ----------
export async function listOrders({ status, limit = 20, dbPath } = {}) {
  const p = dbPath || path.join(ROOT, "data", "local.db");
  if (!fs.existsSync(p)) throw new Error(`Database lokal tidak ada: ${path.relative(ROOT, p)}. Jalankan "serve" sekali untuk membuatnya.`);
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(p, { readOnly: true });
  const cols = "id,status,total,subtotal,shipping_cost,courier_service,courier,weight_g,created_at";
  const q = status
    ? `SELECT ${cols} FROM orders WHERE status=? ORDER BY created_at DESC LIMIT ?`
    : `SELECT ${cols} FROM orders ORDER BY created_at DESC LIMIT ?`;
  const rows = status ? db.prepare(q).all(status, limit) : db.prepare(q).all(limit);
  const stats = db.prepare("SELECT status, COUNT(*) n FROM orders GROUP BY status").all();
  db.close();
  return { total: rows.length, per_status: stats, orders: rows };
}

// ---------- info proyek ----------
export function projectInfo() {
  const cfg = readJson("site.config.json", {});
  const man = readJson("agent/manifest.json", {});
  return {
    project: man.id || "elementia", version: man.version || "0.0.0",
    brand: cfg.brand || {}, contact: cfg.contact || {}, origin: cfg.origin || {},
    cloudflare: cfg.cloudflare || {},
    sku: catalog().items.length, provinsi: provinsiList().length,
    commands: (man.commands || []).map(c => c.name),
  };
}

export { rp };
