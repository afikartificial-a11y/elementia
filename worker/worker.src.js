// ELEMENTIA preview — Worker API toko (mode uji coba). Aset statis dilayani oleh binding ASSETS.
// Notifikasi WA admin: FONNTE_TOKEN (Fonnte) atau WA_CLOUD_TOKEN + WA_PHONE_ID (WhatsApp Cloud API); var ADMIN_WA, PUBLIC_URL.
// Secrets opsional: MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY, MIDTRANS_IS_PRODUCTION ("true"), BITESHIP_API_KEY, ORIGIN_POSTAL_CODE.
// Bila key belum ada, adapter otomatis memakai mock (SIMULASI).
import { buildLabelsPdf, SIZES as LABEL_SIZES } from "./labels.js";
/* __CATALOG__ */
const BY_SKU = Object.fromEntries(CATALOG.items.map(i => [i.sku, i]));
const STATUSES = ["baru", "menunggu_wa", "dibayar", "dikirim", "selesai", "batal"];
const STAT_LABEL = { baru: "Menunggu pembayaran", menunggu_wa: "Menunggu konfirmasi WA", dibayar: "Dibayar", dikirim: "Dikirim", selesai: "Selesai", batal: "Dibatalkan" };
const DIRECT = "langsung:elementia"; // kirim langsung oleh Elementia — khusus pesanan via WhatsApp
const CARGO_MIN_G = 5000, CARGO_MIN_KG = 10, REMIND_AFTER = 2 * 3600, REMIND_MAX = 6;
// Kurir yang diminta ke Biteship (kode resmi). Gudang asal: Kawasan Industri De Prima Terra Blok A1 No. 1A,
// Kel. Tegalluar, Kec. Bojongsoang, Kab. Bandung 40288 — dipakai sebagai ORIGIN_POSTAL_CODE.
const COURIERS = "jne,jnt,sicepat,spx";
const PBKDF2_ITER = 100000; // batas maksimum WebCrypto PBKDF2 di Workers
const DAY = 86400;
const enc = new TextEncoder();

// ---------- util ----------
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
const err = (msg, status = 400) => json({ ok: false, error: msg }, status);
const now = () => Math.floor(Date.now() / 1000);
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
const rand = (n = 32) => b64u(crypto.getRandomValues(new Uint8Array(n)));
const sha256 = async s => hex(await crypto.subtle.digest("SHA-256", enc.encode(s)));
function timingSafeEq(a, b) { const x = enc.encode(a), y = enc.encode(b); if (x.length !== y.length) return false; let d = 0; for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i]; return d === 0; }
function cookies(req) { const o = {}; (req.headers.get("cookie") || "").split(/;\s*/).forEach(p => { const i = p.indexOf("="); if (i > 0) o[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1)); }); return o; }
function setCookie(name, val, maxAge) { return `${name}=${encodeURIComponent(val)}; Path=/; HttpOnly; Secure; SameSite=Lax${maxAge != null ? `; Max-Age=${maxAge}` : ""}`; }
const s = (v, max = 200) => String(v ?? "").trim().slice(0, max);
const rp = n => "Rp " + n.toLocaleString("id-ID");

async function hashPassword(pw) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITER }, key, 256);
  return `pbkdf2-sha256$${PBKDF2_ITER}$${b64u(salt)}$${b64u(bits)}`;
}
async function verifyPassword(pw, stored) {
  const [alg, iter, saltB, hashB] = String(stored).split("$");
  if (alg !== "pbkdf2-sha256") return false;
  const salt = Uint8Array.from(atob(saltB.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: +iter }, key, 256);
  return timingSafeEq(b64u(bits), hashB);
}
async function hmac(secret, msg) {
  const k = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
}

// ---------- sesi ----------
async function createSession(env, userId, remember) {
  const token = rand(32), t = now();
  const ttl = remember ? 30 * DAY : DAY; // tanpa "ingat saya": cookie sesi browser, server kedaluwarsa 24 jam
  await env.DB.prepare("INSERT INTO sessions (id_hash,user_id,expires_at,remember,created_at) VALUES (?,?,?,?,?)").bind(await sha256(token), userId, t + ttl, remember ? 1 : 0, t).run();
  return setCookie("bk_sess", token, remember ? 30 * DAY : null);
}
async function currentUser(req, env) {
  const tok = cookies(req).bk_sess; if (!tok) return null;
  const row = await env.DB.prepare("SELECT u.id,u.name,u.email,u.phone,u.cart_json,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id_hash=?").bind(await sha256(tok)).first();
  if (!row || row.expires_at < now()) return null;
  return row;
}

// ---------- rate limit login (D1) ----------
async function tooMany(env, keys) {
  const since = now() - 15 * 60;
  for (const [k, max] of keys) {
    const r = await env.DB.prepare("SELECT COUNT(*) c FROM login_attempts WHERE k=? AND ts>?").bind(k, since).first();
    if (r.c >= max) return true;
  }
  return false;
}
async function recordFail(env, keys) {
  const t = now();
  await env.DB.batch(keys.map(([k]) => env.DB.prepare("INSERT INTO login_attempts (k,ts) VALUES (?,?)").bind(k, t)));
  if (Math.random() < 0.05) await env.DB.prepare("DELETE FROM login_attempts WHERE ts<?").bind(t - DAY).run();
}

// ---------- keranjang ----------
function cleanCart(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) { const q = Math.floor(+v); if (BY_SKU[k] && q > 0) out[k] = Math.min(q, 99); }
  return out;
}
function priceCart(cart) {
  const items = []; let subtotal = 0, weight = 0;
  for (const [sku, qty] of Object.entries(cleanCart(cart))) {
    const c = BY_SKU[sku]; const line = c.harga * qty;
    items.push({ sku, name: c.nama, price: c.harga, qty, weight_g: (c.berat_bruto_g || c.berat_g), line_total: line });
    subtotal += line; weight += (c.berat_bruto_g || c.berat_g) * qty;
  }
  return { items, subtotal, weight_g: weight };
}

// ---------- adapter ongkir ----------
const RATES = {
  "aceh": { "jne:reg":[53000,58000,"3-4"], "jnt:ez":[38950,39500,""], "sicepat:reg":[49200,54200,"5-7"] },
  "bali": { "jne:reg":[22100,25450,"3-4"], "jnt:ez":[19950,19950,""], "sicepat:reg":[26100,27950,"3-5"], "spx:std":[19091,19100,"2-4"] },
  "banten": { "jne:reg":[13600,14700,"1-2"], "jnt:ez":[12350,12350,""], "sicepat:reg":[12600,12600,"2-3"], "spx:std":[11819,11800,"1-2"] },
  "bengkulu": { "jne:reg":[37000,42000,"3-4"], "jnt:ez":[34200,34400,""], "sicepat:reg":[37800,41600,"3-5"], "spx:std":[32728,32750,"3-4"] },
  "di yogyakarta": { "jne:reg":[15300,16850,"1-2"], "jnt:ez":[15200,15200,""], "sicepat:reg":[14400,14400,"2-4"], "spx:std":[14546,14550,"1-2"] },
  "dki jakarta": { "jne:reg":[11050,11500,"1-2"], "jnt:ez":[10450,10450,""], "sicepat:reg":[9900,9900,"1-2"], "spx:std":[9728,11200,"1-2"] },
  "gorontalo": { "jne:reg":[102000,107000,"7-10"], "jnt:ez":[69350,72300,""], "spx:std":[66364,66350,"4-7"] },
  "jambi": { "jne:reg":[26350,30800,"3-4"], "jnt:ez":[24700,24700,""], "sicepat:reg":[27900,30050,"3-5"], "spx:std":[23637,23650,"2-3"] },
  "jawa barat": { "jne:reg":[7650,7650,"1-2"], "jnt:ez":[7600,7600,""], "sicepat:reg":[6300,6300,"1-2"], "spx:std":[7100,6150,"1"] },
  "jawa tengah": { "jne:reg":[15300,16850,"1-2"], "jnt:ez":[15200,15200,""], "sicepat:reg":[14400,14400,"2-3"], "spx:std":[14546,14550,"1-2"] },
  "jawa timur": { "jne:reg":[17850,20100,"1-2"], "jnt:ez":[17100,17100,""], "sicepat:reg":[16200,16400,"2-3"], "spx:std":[16091,16100,"1-2"] },
  "kalimantan barat": { "jne:reg":[48000,53000,"3-4"], "jnt:ez":[36100,36450,""], "sicepat:reg":[34200,37400,"4-6"], "spx:std":[34546,34550,"2-5"] },
  "kalimantan selatan": { "jne:reg":[47000,52000,"3-4"], "jnt:ez":[35150,35400,""], "sicepat:reg":[33300,36350,"3-5"], "spx:std":[33637,33650,"2-3"] },
  "kalimantan tengah": { "jne:reg":[48000,53000,"3-4"], "jnt:ez":[36100,36450,""], "sicepat:reg":[41400,45800,"4-6"], "spx:std":[34546,34550,"3-6"] },
  "kalimantan timur": { "jne:reg":[52000,57000,"3-4"], "jnt:ez":[38000,38500,""], "sicepat:reg":[36000,39500,"4-6"], "spx:std":[36364,36350,"2-4"] },
  "kalimantan utara": { "jne:reg":[67000,72000,"3-5"], "jnt:ez":[61750,64100,""], "sicepat:reg":[67000,72000,"4-6"], "spx:std":[56819,56800,"3-17"] },
  "kepulauan bangka belitung": { "jne:reg":[33000,38000,"3-4"], "jnt:ez":[31350,31350,""], "sicepat:reg":[34200,37400,"4-6"], "spx:std":[30000,30000,"4-6"] },
  "kepulauan riau": { "jne:reg":[39000,44000,"3-4"], "jnt:ez":[29450,29450,""], "sicepat:reg":[37080,40750,"3-5"], "spx:std":[28182,28200,"2-4"] },
  "lampung": { "jne:reg":[18700,21150,"3-4"], "jnt:ez":[19950,19950,""], "sicepat:reg":[19800,20600,"2-4"], "spx:std":[19091,19100,"1-2"] },
  "maluku": { "jne:reg":[105000,110000,"3-4"], "jnt:ez":[68400,71300,""], "spx:std":[65455,65450,"3-11"] },
  "maluku utara": { "jnt:ez":[64600,67200,""] },
  "nusa tenggara barat": { "jne:reg":[45000,50000,"3-4"], "jnt:ez":[32300,32350,""], "sicepat:reg":[38700,42650,"3-5"], "spx:std":[30910,30900,"3-4"] },
  "nusa tenggara timur": { "jne:reg":[89000,94000,"5-7"], "jnt:ez":[57950,60000,""], "sicepat:reg":[152000,157000,"13-16"], "spx:std":[55455,55450,"2-4"] },
  "papua": { "jne:reg":[139000,144000,"4-5"], "jnt:ez":[90250,94900,""], "sicepat:reg":[116300,121300,"18-21"], "spx:std":[86364,86350,"3-4"] },
  "papua barat": { "jne:reg":[145000,150000,"4-5"], "jnt:ez":[122000,127000,""], "sicepat:reg":[245300,180400,"11-14"], "spx:std":[115455,115450,"4-7"] },
  "riau": { "jne:reg":[40000,45000,"3-4"], "jnt:ez":[30400,30400,""], "sicepat:reg":[38160,42000,"3-5"], "spx:std":[29091,29100,"3-5"] },
  "sulawesi barat": { "jne:reg":[62000,67000,"5-7"], "jnt:ez":[57950,60000,""], "spx:std":[55455,55450,"3-6"] },
  "sulawesi selatan": { "jne:reg":[51000,56000,"3-4"], "jnt:ez":[46550,31200,""], "sicepat:reg":[48000,53000,"3-5"], "spx:std":[44000,29800,"2-5"] },
  "sulawesi tengah": { "jne:reg":[81000,86000,"3-4"], "jnt:ez":[56050,58000,""], "spx:std":[53637,53650,"3-5"] },
  "sulawesi tenggara": { "jne:reg":[81000,86000,"3-4"], "jnt:ez":[56050,58000,""], "spx:std":[53637,53650,"3-5"] },
  "sulawesi utara": { "jne:reg":[75000,80000,"3-4"], "jnt:ez":[52250,53900,""] },
  "sumatera barat": { "jne:reg":[40000,45000,"3-4"], "jnt:ez":[30400,30400,""], "spx:std":[29091,29100,"2-6"] },
  "sumatera selatan": { "jne:reg":[21250,24400,"3-4"], "jnt:ez":[20900,20900,""], "sicepat:reg":[22500,23750,"3-5"], "spx:std":[20000,20000,"2-3"] },
  "sumatera utara": { "jne:reg":[42000,47000,"3-4"], "jnt:ez":[31350,31350,""], "sicepat:reg":[29700,32150,"4-6"], "spx:std":[29728,29750,"2-6"] }
};
// Tarif acuan KiriminAja (cekaja), asal Tegalluar Bandung, diambil 8 Nov 2026.
// Nilai = tarif tampil (setelah diskon kampanye). [tarif 1 kg, biaya tiap kg tambahan, estimasi hari]
// Dikalibrasi dari 38 provinsi: 1 kg + 3 kg per provinsi, biaya kg tambahan = (tarif 3 kg - 1 kg) / 2.
const PROV_ALIAS = {
  "papua selatan": "papua", "papua tengah": "papua", "papua pegunungan": "papua",
  "papua barat daya": "papua barat",
};
const CARGO_COL = { "jawa barat": 0, "dki jakarta": 1, "jawa timur": 2 };
const provKey = p => {
  p = String(p || "").toLowerCase().trim().replace(/\s+/g, " ");
  return PROV_ALIAS[p] || p;
};
function rateFor(prov, code, kg) {
  const t = RATES[provKey(prov)];
  if (!t || !t[code]) return null;
  const [r1, inc, etd] = t[code];
  return { price: kg <= 1 ? r1 : r1 + (kg - 1) * inc, etd };
}

const CARGO_TABLE = {
  // Tarif kargo per kg, diturunkan dari total KiriminAja pada 25 kg (7 Nov 2026):
  // SentralCargo 52.500 (Bandung) / 60.000 (Jakarta) / 85.000 (Surabaya);
  // J&T Cargo 73.500 / 73.500 / 98.000; SiCepat Kargo 87.500 / 87.500 / 137.500.
  // Hanya provinsi yang diuji yang punya nilai; sisanya null (tidak ditampilkan, bukan dikarang).
  "cargo:sentral": { label: "SentralCargo Darat", perKg: [2100, 2400, 3400], etd: ["1-3", "1-3", "2-4"] },
  "cargo:jnt":     { label: "J&T Cargo Reguler", perKg: [2940, 2940, 3920], etd: ["1-3", "1-3", "1-3"] },
  "cargo:sicepat": { label: "SiCepat Kargo",     perKg: [3500, 3500, 5500], etd: ["2-4", "2-4", "2-4"] },
};
async function shippingRates(env, dest, weight_g, items) {
  const r = await courierRates(env, dest, weight_g, items);
  r.rates.forEach(x => x.group = "kurir");
  const col = CARGO_COL[provKey(dest.provinsi)];
  if (weight_g > CARGO_MIN_G && col != null) {
    const ckg = Math.max(CARGO_MIN_KG, r.kg);
    for (const [code, t] of Object.entries(CARGO_TABLE)) {
      r.rates.push({ code, label: t.label, price: t.perKg[col] * ckg, etd: t.etd[col] + " hari", group: "cargo", simulasi: true, note: `Min. ${CARGO_MIN_KG} kg · dihitung ${ckg} kg` });
    }
  }
  r.rates.push({ code: DIRECT, label: "Kirim langsung oleh Elementia (tanpa kurir)", price: null, etd: "Dijadwalkan dengan admin", group: "langsung", disabled: true, wa_only: true, note: "Khusus pesanan via WhatsApp — ongkos & jadwal disepakati dengan admin" });
  return r;
}
async function courierRates(env, dest, weight_g, items) {
  const kg = Math.max(1, Math.ceil(weight_g / 1000)); // berat sudah termasuk kemasan (+10% dari netto), dibulatkan ke atas per kg
  if (env.BITESHIP_API_KEY) {
    const r = await fetch("https://api.biteship.com/v1/rates/couriers", {
      method: "POST", headers: { authorization: env.BITESHIP_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ origin_postal_code: +(env.ORIGIN_POSTAL_CODE || 40288), destination_postal_code: +dest.kode_pos, couriers: COURIERS,
        items: items.map(i => ({ name: i.name, value: i.price, quantity: i.qty, weight: i.weight_g })) }) });
    const d = await r.json();
    if (!r.ok || !d.success) throw new Error("Biteship: " + (d.error || r.status));
    return { mode: "biteship", kg, rates: d.pricing.map(p => ({ code: `${p.courier_code}:${p.courier_service_code}`, label: `${p.courier_name} ${p.courier_service_name}`, price: p.price, etd: p.duration })) };
  }
  const LABEL = {
    "jne:reg": "JNE Reguler", "jnt:ez": "J&T EZ",
    "sicepat:reg": "SiCepat REG", "spx:std": "Shopee Express (SPX) Standard",
  };
  const list = Object.keys(LABEL).map(code => {
    const v = rateFor(dest.provinsi, code, kg);
    if (!v) return null;
    return { code, label: LABEL[code], price: v.price, etd: (v.etd ? v.etd + " hari" : ""), simulasi: true,
      note: "tarif acuan KiriminAja · 8 Nov 2026" };
  }).filter(Boolean);
  if (!list.length) throw new Error("Ongkir ke " + (dest.provinsi || "tujuan ini") + " belum tersedia — hubungi admin lewat WhatsApp.");
  return { mode: "kiriminaja", kg, rates: list };
}

// ---------- adapter pembayaran ----------
async function createPayment(env, order, origin) {
  if (env.MIDTRANS_SERVER_KEY) {
    const base = env.MIDTRANS_IS_PRODUCTION === "true" ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
    const r = await fetch(base + "/snap/v1/transactions", {
      method: "POST", headers: { authorization: "Basic " + btoa(env.MIDTRANS_SERVER_KEY + ":"), "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ transaction_details: { order_id: order.id, gross_amount: order.total },
        item_details: [...order.items.map(i => ({ id: i.sku, price: i.price, quantity: i.qty, name: i.name.slice(0, 50) })), { id: "ongkir", price: order.shipping_cost, quantity: 1, name: "Ongkos kirim " + order.courier_label }],
        customer_details: { first_name: order.name, email: order.email, phone: order.phone },
        callbacks: { finish: `${origin}/bayar?order=${order.id}&t=${order.view_token}` } }) });
    const d = await r.json();
    if (!r.ok) throw new Error("Midtrans: " + JSON.stringify(d.error_messages || d));
    return { mode: "midtrans", url: d.redirect_url, ref: d.token };
  }
  return { mode: "simulasi", url: `/bayar?order=${order.id}&t=${order.view_token}`, ref: null };
}
async function sha512hex(s) { return hex(await crypto.subtle.digest("SHA-512", enc.encode(s))); }

// ---------- pesanan ----------
async function loadOrder(env, id) {
  const o = await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(id).first(); if (!o) return null;
  const { results } = await env.DB.prepare("SELECT sku,name,price,qty,line_total FROM order_items WHERE order_id=? ORDER BY id").bind(id).all();
  o.items = results; return o;
}
const publicOrder = o => { const { view_token, user_id, ...rest } = o; return rest; };
function newOrderId() { const d = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10).replace(/-/g, ""); const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let r = ""; for (const b of crypto.getRandomValues(new Uint8Array(5))) r += a[b % a.length]; return `BK-${d}-${r}`; }

function readAddr(b) {
  const a = { name: s(b.name, 100), phone: s(b.phone, 20), email: s(b.email, 120).toLowerCase(), provinsi: s(b.provinsi, 60), kota: s(b.kota, 80), kecamatan: s(b.kecamatan, 80), kode_pos: s(b.kode_pos, 5), alamat: s(b.alamat, 300), catatan: s(b.catatan, 200) };
  for (const k of ["name", "phone", "email", "provinsi", "kota", "kecamatan", "kode_pos", "alamat"]) if (!a[k]) return [null, `Kolom ${k.replace("_", " ")} wajib diisi.`];
  if (!/^\S+@\S+\.\S+$/.test(a.email)) return [null, "Format email tidak valid."];
  if (!/^\d{5}$/.test(a.kode_pos)) return [null, "Kode pos harus 5 angka."];
  if (!/^[0-9+ -]{8,20}$/.test(a.phone)) return [null, "Nomor HP tidak valid."];
  return [a, null];
}

async function addrFromAccount(env, user, body) { // pakai alamat tersimpan di akun (server = sumber kebenaran)
  const [a, e] = readAddrLoose(body);
  if (!user) return [a, e];
  const id = +body.address_id || 0;
  const r = id ? await env.DB.prepare("SELECT * FROM addresses WHERE id=? AND user_id=?").bind(id, user.id).first() : null;
  if (!r) return [a, e];
  const m = { name: s(user.name || body.name, 100), phone: s(user.phone || body.phone, 20), email: s(user.email, 120).toLowerCase(), penerima: s(r.name, 100), hp_penerima: s(r.phone, 20),
    provinsi: r.provinsi, kota: r.kota, kecamatan: r.kecamatan, kode_pos: r.kode_pos, alamat: r.alamat, catatan: s(body.catatan, 200) || r.catatan || "" };
  if (!m.phone) m.phone = m.hp_penerima;
  return readAddr({ ...m, name: m.name || m.penerima }).map((x, i) => i === 0 && x ? { ...x, penerima: m.penerima, hp_penerima: m.hp_penerima } : x);
}
function readAddrLoose(b) { const [a, e] = readAddr(b); if (a) { a.penerima = s(b.penerima || b.name, 100); a.hp_penerima = s(b.hp_penerima || b.phone, 20); } return [a, e]; }

// ---------- pesan WhatsApp ----------
const fmtRp = n => "Rp " + Number(n || 0).toLocaleString("id-ID").replace(/,/g, ".");
const fmtKg = g => (g >= 1000 ? (Math.round(g / 10) / 100).toString().replace(".", ",") + " kg" : g + " g");
const variant = sku => { const c = BY_SKU[sku]; return c ? `${c.bentuk}, ${c.kemasan}` : ""; };
const baseUrl = env => (env.PUBLIC_URL || "https://elementia-preview.nsntr.workers.dev").replace(/\/$/, "");
const adminWa = env => String(env.ADMIN_WA || "6280000000000").replace(/\D/g, "");
function addrLines(o) { // alamat pengiriman lengkap — satu sumber untuk pesan WA pembeli, notifikasi admin & halaman admin
  const L = [`Penerima: ${o.penerima || o.name}`];
  const hp = o.hp_penerima || o.phone; if (hp) L.push(`No. HP penerima: ${hp}`);
  L.push(`Alamat: ${o.alamat}`, `Kecamatan: ${o.kecamatan}`, `Kota/Kab.: ${o.kota}`, `Provinsi: ${o.provinsi}`, `Kode pos: ${o.kode_pos}`);
  if (o.catatan) L.push(`Catatan: ${o.catatan}`);
  return L;
}
function customerWaMessage(o) { // dibangun dari pesanan TERSIMPAN; TANPA info kurir/ongkir
  const L = ["Halo Admin ELEMENTIA, saya ingin memesan.", `No. pesanan: ${o.id}`, "", "*Informasi pembeli*", `Nama: ${o.name}`, `No. HP: ${o.phone}`, `Email: ${o.email}`, "",
    "*Alamat pengiriman*", ...addrLines(o), "", "*Detail produk*"];
  o.items.forEach((i, n) => L.push(`${n + 1}. ${i.name}`, `   Varian: ${variant(i.sku)}`, `   ${i.qty} x ${fmtRp(i.price)} = ${fmtRp(i.line_total)}`));
  L.push("", `Subtotal produk: ${fmtRp(o.subtotal)}`, `Total berat: ± ${fmtKg(o.weight_g)}`, "", "Pengiriman: mohon diskusikan dengan admin (bisa diantar langsung oleh Elementia).", "", "Terima kasih.");
  return L.join("\n");
}
function adminWaMessage(env, o, kind) {
  const head = kind === "reminder" ? `⏰ PENGINGAT: pesanan sudah dibayar ${Math.max(1, Math.floor((now() - (o.paid_at || o.created_at)) / 3600))} jam lalu dan BELUM diproses` : "🔔 PESANAN DIBAYAR — SEGERA PROSES";
  return [head, "", `No. pesanan: ${o.id}`, `Pembeli: ${o.name} (${o.phone}) · ${o.email}`, "", "Alamat pengiriman:", ...addrLines(o), "",
    "Item:", ...o.items.map(i => `- ${i.name} x${i.qty} = ${fmtRp(i.line_total)}`), `Pengiriman: ${o.courier_service || "-"} (${fmtRp(o.shipping_cost)})`, `Total: ${fmtRp(o.total)}`, "", `Buka admin: ${baseUrl(env)}/admin#${o.id}`].join("\n");
}
const waLink = (num, text) => `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(text)}`; // teks utuh ter-encode (\n, #, &, +)

// ---------- adapter notifikasi WA (Fonnte / WhatsApp Cloud API / mock) ----------
async function sendWa(env, to, text) {
  if (env.FONNTE_TOKEN) {
    // Format sesuai docs.fonnte.com "Sending API Messages": multipart form, header Authorization = token (tanpa Bearer)
    const fd = new FormData(); fd.append("target", String(to)); fd.append("message", text); fd.append("countryCode", "62"); fd.append("connectOnly", "true");
    const r = await fetch("https://api.fonnte.com/send", { method: "POST", headers: { authorization: env.FONNTE_TOKEN }, body: fd });
    const d = await r.json().catch(() => ({}));
    const resp = JSON.stringify({ http: r.status, status: d.status ?? d.Status, detail: d.detail, reason: d.reason, process: d.process, id: d.id, requestid: d.requestid, target: d.target, quota: d.quota }).slice(0, 500);
    if (!r.ok || (d.status ?? d.Status) !== true) { const e = new Error("Fonnte: " + (d.reason || d.detail || r.status)); e.resp = resp; throw e; }
    return { provider: "fonnte", resp };
  }
  if (env.WA_CLOUD_TOKEN && env.WA_PHONE_ID) {
    const r = await fetch(`https://graph.facebook.com/v21.0/${env.WA_PHONE_ID}/messages`, { method: "POST", headers: { authorization: "Bearer " + env.WA_CLOUD_TOKEN, "content-type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { preview_url: false, body: text } }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error("WA Cloud: " + JSON.stringify(d.error || r.status));
    return { provider: "wa_cloud", resp: JSON.stringify(d).slice(0, 500) };
  }
  return { provider: "mock", resp: null };
}
async function notifyAdmin(env, orderId, kind) {
  const o = await loadOrder(env, orderId); if (!o) return null;
  const to = adminWa(env), isTest = /\[TES SISTEM\]/.test(o.catatan || "") || o.name === "TES NOTIFIKASI";
  const text = (isTest ? "[TES SISTEM] " : "") + adminWaMessage(env, o, kind) + (isTest ? "\n\n(Ini pesan uji coba sistem notifikasi — abaikan.)" : "");
  let provider = "mock", status = "mock", error = null, resp = null;
  try { const x = await sendWa(env, to, text); provider = x.provider; resp = x.resp; status = provider === "mock" ? "mock" : "terkirim"; } catch (e) { provider = env.FONNTE_TOKEN ? "fonnte" : "wa_cloud"; status = "gagal"; error = String(e.message).slice(0, 300); resp = e.resp || null; }
  await env.DB.prepare("INSERT INTO notifications (order_id,kind,provider,target,message,status,error,response,created_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(o.id, kind, provider, to, text, status, error, resp, now()).run();
  await env.DB.prepare("UPDATE orders SET reminded_at=?, reminder_count=COALESCE(reminder_count,0)+? WHERE id=?").bind(now(), kind === "reminder" ? 1 : 0, o.id).run();
  return { provider, status };
}
async function runReminders(env) { // dipanggil Cron: pesanan 'dibayar' > 2 jam & belum diproses
  const t = now();
  const { results } = await env.DB.prepare("SELECT id FROM orders WHERE status='dibayar' AND COALESCE(paid_at,created_at) <= ? AND COALESCE(reminded_at,0) <= ? AND COALESCE(reminder_count,0) < ? ORDER BY paid_at LIMIT 25").bind(t - REMIND_AFTER, t - REMIND_AFTER, REMIND_MAX).all();
  const out = []; for (const r of results) out.push({ id: r.id, ...(await notifyAdmin(env, r.id, "reminder")) });
  return out;
}

// ---------- admin ----------
async function isAdmin(req, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const c = cookies(req).bk_admin; if (!c) return false;
  const [ts, sig] = c.split("."); if (!ts || now() - +ts > 12 * 3600) return false;
  return timingSafeEq(sig || "", await hmac(env.ADMIN_PASSWORD, "admin." + ts));
}

// ---------- router ----------
async function api(req, env, url) {
  const p = url.pathname, m = req.method;
  if (m !== "GET") { // CSRF dasar: hanya JSON dari origin sendiri (kecuali webhook Midtrans)
    if (p !== "/api/payment/midtrans-notify") {
      const o = req.headers.get("origin"); if (o && o !== url.origin) return err("Origin tidak diizinkan.", 403);
      if (!(req.headers.get("content-type") || "").includes("application/json")) return err("Gunakan JSON.", 415);
    }
  }
  const body = m === "GET" ? {} : await req.json().catch(() => ({}));
  const ip = req.headers.get("cf-connecting-ip") || "0";

  if (p === "/api/config") return json({ ok: true, payment_mode: env.MIDTRANS_SERVER_KEY ? "midtrans" : "simulasi", shipping_mode: env.BITESHIP_API_KEY ? "biteship" : "simulasi", midtrans_client_key: env.MIDTRANS_CLIENT_KEY || null });
  if (p === "/api/quote") {
    if (m !== "POST") return json({ ok: false, error: "Metode tidak didukung." }, 405);
    const ip = req.headers.get("cf-connecting-ip") || "0", key = "quote:" + ip;
    if (await tooMany(env, [[key, 5]])) return json({ ok: false, error: "Terlalu banyak permintaan dari jaringan ini. Coba lagi beberapa menit lagi." }, 429);
    const s = (v, n) => String(v == null ? "" : v).trim().slice(0, n);
    const name = s(body.name, 80), company = s(body.company, 120), role = s(body.role, 80),
      phone = s(body.phone, 30), email = s(body.email, 120), city = s(body.city, 80),
      volume = s(body.volume, 40), note = s(body.note, 1200),
      kom = Array.isArray(body.komoditas) ? body.komoditas.slice(0, 8).map(x => s(x, 40)).join(", ") : "";
    if (!name || !company || !phone) return json({ ok: false, error: "Nama, bisnis, dan WhatsApp wajib diisi." }, 400);
    if (!/^[0-9+()\-\s]{9,25}$/.test(phone)) return json({ ok: false, error: "Nomor WhatsApp tidak valid." }, 400);
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: "Email tidak valid." }, 400);
    await env.DB.prepare("INSERT INTO leads (name,company,role,phone,email,city,commodities,volume,note,source,ip,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(name, company, role, phone, email, city, kom, volume, note, "bisnis", ip, now()).run();
    await env.DB.prepare("INSERT INTO login_attempts (k,ts) VALUES (?,?)").bind(key, now()).run();
    return json({ ok: true }, 201);
  }

  if (p === "/api/register" && m === "POST") {
    const name = s(body.name, 100), email = s(body.email, 120).toLowerCase(), phone = s(body.phone, 20), pw = String(body.password || "");
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) return err("Nama dan email wajib diisi dengan benar.");
    if (pw.length < 8 || pw.length > 200) return err("Kata sandi minimal 8 karakter.");
    if (await tooMany(env, [["reg:" + ip, 10]])) return err("Terlalu banyak percobaan. Coba lagi 15 menit lagi.", 429);
    if (await env.DB.prepare("SELECT 1 FROM users WHERE email=?").bind(email).first()) { await recordFail(env, [["reg:" + ip]]); return err("Email sudah terdaftar. Silakan masuk.", 409); }
    const r = await env.DB.prepare("INSERT INTO users (name,email,phone,pass_hash,cart_json,created_at) VALUES (?,?,?,?,?,?)").bind(name, email, phone, await hashPassword(pw), JSON.stringify(cleanCart(body.cart)), now()).run();
    const c = await createSession(env, r.meta.last_row_id, !!body.remember);
    return json({ ok: true, user: { name, email, phone } }, 201, { "set-cookie": c });
  }
  if (p === "/api/login" && m === "POST") {
    const email = s(body.email, 120).toLowerCase(), pw = String(body.password || "");
    const keys = [["ip:" + ip, 20], ["em:" + email, 5]];
    if (await tooMany(env, keys)) return err("Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.", 429);
    const u = await env.DB.prepare("SELECT id,name,email,phone,pass_hash FROM users WHERE email=?").bind(email).first();
    if (!u || !(await verifyPassword(pw, u.pass_hash))) { await recordFail(env, keys); return err("Email atau kata sandi salah.", 401); }
    const c = await createSession(env, u.id, !!body.remember);
    return json({ ok: true, user: { name: u.name, email: u.email, phone: u.phone } }, 200, { "set-cookie": c });
  }
  if (p === "/api/logout" && m === "POST") {
    const tok = cookies(req).bk_sess; if (tok) await env.DB.prepare("DELETE FROM sessions WHERE id_hash=?").bind(await sha256(tok)).run();
    return json({ ok: true }, 200, { "set-cookie": setCookie("bk_sess", "", 0) });
  }

  const user = await currentUser(req, env);
  if (p === "/api/me") {
    if (!user) return json({ ok: true, user: null });
    const { results } = await env.DB.prepare("SELECT id,name,phone,provinsi,kota,kecamatan,kode_pos,alamat,catatan FROM addresses WHERE user_id=? ORDER BY id DESC").bind(user.id).all();
    return json({ ok: true, user: { name: user.name, email: user.email, phone: user.phone }, addresses: results, cart: JSON.parse(user.cart_json || "{}") });
  }
  if (p === "/api/cart" && m === "PUT") {
    if (!user) return err("Belum masuk.", 401);
    const c = cleanCart(body.cart); await env.DB.prepare("UPDATE users SET cart_json=? WHERE id=?").bind(JSON.stringify(c), user.id).run();
    return json({ ok: true, cart: c });
  }
  if (p === "/api/cart/merge" && m === "POST") {
    if (!user) return err("Belum masuk.", 401);
    const a = cleanCart(JSON.parse(user.cart_json || "{}")), b = cleanCart(body.cart);
    for (const [k, q] of Object.entries(b)) a[k] = Math.min(99, Math.max(a[k] || 0, q)); // gabung: ambil jumlah terbesar per SKU
    await env.DB.prepare("UPDATE users SET cart_json=? WHERE id=?").bind(JSON.stringify(a), user.id).run();
    return json({ ok: true, cart: a });
  }
  if (p.startsWith("/api/addresses/") && m === "DELETE") {
    if (!user) return err("Belum masuk.", 401);
    await env.DB.prepare("DELETE FROM addresses WHERE id=? AND user_id=?").bind(+p.split("/").pop(), user.id).run();
    return json({ ok: true });
  }
  if (p === "/api/shipping/rates" && m === "POST") {
    const pc = priceCart(body.cart); if (!pc.items.length) return err("Keranjang kosong.");
    if (!body.provinsi || !/^\d{5}$/.test(String(body.kode_pos || ""))) return err("Isi provinsi dan kode pos 5 angka.");
    try { return json({ ok: true, ...(await shippingRates(env, { provinsi: body.provinsi, kode_pos: body.kode_pos }, pc.weight_g, pc.items)), weight_g: pc.weight_g, subtotal: pc.subtotal }); }
    catch (e) { return err("Gagal menghitung ongkir: " + e.message, 502); }
  }
  if (p === "/api/order-wa" && m === "POST") { // pesanan via WhatsApp: tersimpan di D1, tanpa kurir/ongkir
    const pc = priceCart(body.cart); if (!pc.items.length) return err("Keranjang kosong.");
    const [a, aerr] = await addrFromAccount(env, user, body); if (aerr) return err(aerr);
    if (await tooMany(env, [["wa:" + ip, 20]])) return err("Terlalu banyak pesanan WA. Coba lagi 15 menit lagi.", 429);
    await recordFail(env, [["wa:" + ip]]);
    const t = now(), o = { id: newOrderId(), ...a, items: pc.items, subtotal: pc.subtotal, weight_g: pc.weight_g };
    const stmts = [env.DB.prepare(`INSERT INTO orders (id,user_id,name,phone,email,provinsi,kota,kecamatan,kode_pos,alamat,catatan,penerima,hp_penerima,courier,courier_service,shipping_cost,shipping_mode,weight_g,subtotal,total,status,payment_mode,view_token,created_at,updated_at,channel) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,'diskusi',?,?,?,'menunggu_wa','whatsapp',?,?,?,'whatsapp')`)
      .bind(o.id, user ? user.id : null, a.name, a.phone, a.email, a.provinsi, a.kota, a.kecamatan, a.kode_pos, a.alamat, a.catatan, a.penerima, a.hp_penerima, body.courier === DIRECT ? DIRECT : "diskusi", body.courier === DIRECT ? "Kirim langsung oleh Elementia (disepakati via WA)" : "Didiskusikan via WhatsApp", pc.weight_g, pc.subtotal, pc.subtotal, rand(18), t, t),
      ...pc.items.map(i => env.DB.prepare("INSERT INTO order_items (order_id,sku,name,price,qty,weight_g,line_total) VALUES (?,?,?,?,?,?,?)").bind(o.id, i.sku, i.name, i.price, i.qty, i.weight_g, i.line_total))];
    if (user) stmts.push(env.DB.prepare("UPDATE users SET cart_json='{}' WHERE id=?").bind(user.id));
    await env.DB.batch(stmts);
    const text = customerWaMessage(await loadOrder(env, o.id)); // dari data tersimpan
    return json({ ok: true, order_id: o.id, message: text, wa_url: waLink(adminWa(env), text) }, 201);
  }
  if (p === "/api/checkout" && m === "POST") {
    const pc = priceCart(body.cart); if (!pc.items.length) return err("Keranjang kosong.");
    const [a, aerr] = await addrFromAccount(env, user, body); if (aerr) return err(aerr);
    let rates; try { rates = await shippingRates(env, a, pc.weight_g, pc.items); } catch (e) { return err("Gagal menghitung ongkir: " + e.message, 502); }
    if (body.courier === DIRECT) return err("Kirim langsung oleh Elementia hanya untuk pesanan via WhatsApp — ongkos & jadwal disepakati dengan admin.", 422);
    const rate = rates.rates.find(r => r.code === body.courier && !r.disabled && r.price != null); if (!rate) return err("Pilih kurir pengiriman.");
    let uid = user ? user.id : null, setC = null;
    if (!user && body.create_account) {
      const pw = String(body.password || ""); if (pw.length < 8) return err("Kata sandi akun minimal 8 karakter.");
      if (await env.DB.prepare("SELECT 1 FROM users WHERE email=?").bind(a.email).first()) return err("Email sudah terdaftar — silakan masuk dulu atau hapus centang 'Buat akun'.", 409);
      const r = await env.DB.prepare("INSERT INTO users (name,email,phone,pass_hash,cart_json,created_at) VALUES (?,?,?,?,?,?)").bind(a.name, a.email, a.phone, await hashPassword(pw), "{}", now()).run();
      uid = r.meta.last_row_id; setC = await createSession(env, uid, !!body.remember);
    }
    const t = now(), order = { id: newOrderId(), view_token: rand(18), ...a, items: pc.items, subtotal: pc.subtotal, weight_g: pc.weight_g, shipping_cost: rate.price, courier: rate.code, courier_label: rate.label, total: pc.subtotal + rate.price };
    const stmts = [env.DB.prepare(`INSERT INTO orders (id,user_id,name,phone,email,provinsi,kota,kecamatan,kode_pos,alamat,catatan,penerima,hp_penerima,courier,courier_service,shipping_cost,shipping_mode,weight_g,subtotal,total,status,payment_mode,view_token,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'baru',?,?,?,?)`)
      .bind(order.id, uid, a.name, a.phone, a.email, a.provinsi, a.kota, a.kecamatan, a.kode_pos, a.alamat, a.catatan, a.penerima, a.hp_penerima, rate.code, `${rate.label} (${rate.etd})`, rate.price, rates.mode, pc.weight_g, pc.subtotal, order.total, env.MIDTRANS_SERVER_KEY ? "midtrans" : "simulasi", order.view_token, t, t),
      ...pc.items.map(i => env.DB.prepare("INSERT INTO order_items (order_id,sku,name,price,qty,weight_g,line_total) VALUES (?,?,?,?,?,?,?)").bind(order.id, i.sku, i.name, i.price, i.qty, i.weight_g, i.line_total))];
    if (uid && (body.save_address || (!user && body.create_account))) {
      const dup = await env.DB.prepare("SELECT 1 FROM addresses WHERE user_id=? AND alamat=? AND kode_pos=?").bind(uid, a.alamat, a.kode_pos).first();
      if (!dup) stmts.push(env.DB.prepare("INSERT INTO addresses (user_id,name,phone,provinsi,kota,kecamatan,kode_pos,alamat,catatan,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)").bind(uid, a.name, a.phone, a.provinsi, a.kota, a.kecamatan, a.kode_pos, a.alamat, a.catatan, t));
    }
    if (uid) stmts.push(env.DB.prepare("UPDATE users SET cart_json='{}' WHERE id=?").bind(uid));
    await env.DB.batch(stmts);
    let pay; try { pay = await createPayment(env, order, url.origin); } catch (e) { return err("Pesanan tersimpan (" + order.id + ") tetapi gagal membuat pembayaran: " + e.message, 502); }
    if (pay.ref) await env.DB.prepare("UPDATE orders SET payment_ref=? WHERE id=?").bind(pay.ref, order.id).run();
    return json({ ok: true, order_id: order.id, token: order.view_token, total: order.total, payment_mode: pay.mode, payment_url: pay.url }, 201, setC ? { "set-cookie": setC } : {});
  }
  const om = p.match(/^\/api\/orders\/(BK-[0-9]{8}-[A-Z0-9]{5})$/);
  if (om && m === "GET") {
    const o = await loadOrder(env, om[1]);
    if (!o || !((user && o.user_id === user.id) || (url.searchParams.get("t") && timingSafeEq(url.searchParams.get("t"), o.view_token)))) return err("Pesanan tidak ditemukan.", 404);
    return json({ ok: true, order: publicOrder(o) });
  }
  if (p === "/api/payment/mock" && m === "POST") {
    if (env.MIDTRANS_SERVER_KEY) return err("Mode simulasi nonaktif karena Midtrans sudah terpasang.", 403);
    const o = await loadOrder(env, s(body.order_id, 30));
    if (!o || !timingSafeEq(String(body.token || ""), o.view_token)) return err("Pesanan tidak ditemukan.", 404);
    if (o.status !== "baru") return err("Pesanan sudah diproses (status: " + o.status + ").", 409);
    const method = ["qris", "va_bca", "va_bni", "va_mandiri", "gopay", "ovo", "shopeepay"].includes(body.method) ? body.method : "qris";
    const t = now();
    await env.DB.prepare("UPDATE orders SET status='dibayar', payment_method=?, payment_ref=?, paid_at=?, updated_at=? WHERE id=?").bind(method, "SIMULASI-" + rand(6), t, t, o.id).run();
    const n = await notifyAdmin(env, o.id, "paid");
    return json({ ok: true, status: "dibayar", notify: n && n.provider });
  }
  if (p === "/api/payment/midtrans-notify" && m === "POST") {
    if (!env.MIDTRANS_SERVER_KEY) return err("Midtrans belum dikonfigurasi.", 404);
    const sig = await sha512hex(`${body.order_id}${body.status_code}${body.gross_amount}${env.MIDTRANS_SERVER_KEY}`);
    if (!timingSafeEq(sig, String(body.signature_key || ""))) return err("Signature tidak valid.", 403);
    const o = await loadOrder(env, s(body.order_id, 30)); if (!o) return err("Pesanan tidak ditemukan.", 404);
    const paid = ["capture", "settlement"].includes(body.transaction_status) && (body.fraud_status || "accept") === "accept";
    const failed = ["deny", "cancel", "expire"].includes(body.transaction_status);
    if (Math.round(+body.gross_amount) !== o.total) return err("Nominal tidak cocok.", 400);
    if (paid && o.status === "baru") { await env.DB.prepare("UPDATE orders SET status='dibayar', payment_method=?, paid_at=?, updated_at=? WHERE id=?").bind(s(body.payment_type, 30), now(), now(), o.id).run(); await notifyAdmin(env, o.id, "paid"); }
    if (failed && o.status === "baru") await env.DB.prepare("UPDATE orders SET status='batal', updated_at=? WHERE id=?").bind(now(), o.id).run();
    return json({ ok: true });
  }
  if (p === "/api/account/orders") {
    if (!user) return err("Belum masuk.", 401);
    const { results } = await env.DB.prepare("SELECT id,status,total,subtotal,shipping_cost,courier_service,resi,created_at,paid_at,payment_method,payment_mode,channel FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 50").bind(user.id).all();
    for (const o of results) o.items = (await env.DB.prepare("SELECT name,qty,price,line_total FROM order_items WHERE order_id=?").bind(o.id).all()).results;
    return json({ ok: true, orders: results });
  }
  // --- admin ---
  if (p === "/api/admin/login" && m === "POST") {
    if (!env.ADMIN_PASSWORD) return err("Admin belum dikonfigurasi.", 503);
    const keys = [["admin:" + ip, 5]];
    if (await tooMany(env, keys)) return err("Terlalu banyak percobaan. Coba lagi 15 menit lagi.", 429);
    if (!timingSafeEq(await hmac("cmp", String(body.password || "")), await hmac("cmp", env.ADMIN_PASSWORD))) { await recordFail(env, keys); return err("Kata sandi salah.", 401); }
    const ts = String(now());
    return json({ ok: true }, 200, { "set-cookie": `bk_admin=${ts}.${await hmac(env.ADMIN_PASSWORD, "admin." + ts)}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=43200` });
  }
  if (p.startsWith("/api/admin/")) {
    if (!(await isAdmin(req, env))) return err("Perlu login admin.", 401);
    if (p === "/api/admin/logout") return json({ ok: true }, 200, { "set-cookie": "bk_admin=; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0" });
    if (p === "/api/admin/orders" && m === "GET") {
      const st = url.searchParams.get("status");
      const q = st && STATUSES.includes(st) ? env.DB.prepare("SELECT * FROM orders WHERE status=? ORDER BY created_at DESC LIMIT 200").bind(st) : env.DB.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200");
      const { results } = await q.all();
      for (const o of results) {
        delete o.view_token; o.items = (await env.DB.prepare("SELECT sku,name,qty,price,line_total FROM order_items WHERE order_id=?").bind(o.id).all()).results;
        if (o.status === "dibayar") o.wa_admin_url = waLink(adminWa(env), adminWaMessage(env, o, now() - (o.paid_at || 0) > REMIND_AFTER ? "reminder" : "paid"));
        if (o.status === "dibayar" || o.status === "menunggu_wa") o.wa_buyer_url = waLink(String(o.phone).replace(/\D/g, "").replace(/^0/, "62"), `Halo ${o.name}, kami dari ELEMENTIA terkait pesanan ${o.id}.`);
      }
      const nt = (await env.DB.prepare("SELECT id,order_id,kind,provider,status,error,created_at FROM notifications ORDER BY id DESC LIMIT 30").all()).results;
      const wa = env.FONNTE_TOKEN ? "fonnte" : (env.WA_CLOUD_TOKEN && env.WA_PHONE_ID ? "wa_cloud" : "mock");
      return json({ ok: true, orders: results, statuses: STATUSES, labels: STAT_LABEL, notifications: nt, wa_provider: wa, admin_wa: adminWa(env) });
    }
    if (p === "/api/admin/labels" && m === "GET") { // label pengiriman PDF siap cetak: ?ids=A,B | ?status=dibayar ; size=100x150|a6|a4 ; harga=1
      const size = LABEL_SIZES[url.searchParams.get("size")] ? url.searchParams.get("size") : "100x150", harga = url.searchParams.get("harga") === "1";
      let ids = String(url.searchParams.get("ids") || "").split(",").map(x => x.trim()).filter(x => /^BK-[0-9A-Z-]{5,30}$/.test(x)).slice(0, 200);
      const st = url.searchParams.get("status");
      if (!ids.length && st && STATUSES.includes(st)) ids = (await env.DB.prepare("SELECT id FROM orders WHERE status=? ORDER BY created_at ASC LIMIT 200").bind(st).all()).results.map(r => r.id);
      if (!ids.length) return err("Tidak ada pesanan dipilih.", 400);
      const orders = [];
      for (const id of [...new Set(ids)]) { const o = await loadOrder(env, id); if (o) { o.items.forEach(i => i.variant = variant(i.sku)); orders.push(o); } }
      if (!orders.length) return err("Pesanan tidak ditemukan.", 404);
      const pdf = await buildLabelsPdf(orders, { size, harga });
      const name = orders.length === 1 ? `label-${orders[0].id}.pdf` : `label-${st || "pilihan"}-${orders.length}-pesanan.pdf`;
      return new Response(pdf, { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${name}"`, "cache-control": "no-store" } });
    }
    if (p === "/api/admin/notifications" && m === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM notifications ORDER BY id DESC LIMIT 100").all();
      return json({ ok: true, notifications: results });
    }
    if (p === "/api/admin/wa/status" && m === "GET") { // cek perangkat Fonnte TANPA mengirim pesan
      if (!env.FONNTE_TOKEN) return json({ ok: true, provider: "mock" });
      const t = env.FONNTE_TOKEN, r = await fetch("https://api.fonnte.com/device", { method: "POST", headers: { authorization: t } });
      const d = await r.json().catch(() => ({})); delete d.token;
      return json({ ok: true, provider: "fonnte", token_len: t.length, token_trimmed_differs: t !== t.trim(), token_sha256_8: (await sha256(t)).slice(0, 8), fonnte: d });
    }
    if (p === "/api/admin/reminders/run" && m === "POST") return json({ ok: true, sent: await runReminders(env) }); // jalankan logika cron manual
    if (p === "/api/admin/test/backdate" && m === "POST") { // HANYA mode uji coba: mundurkan waktu bayar untuk menguji pengingat
      if (env.MIDTRANS_SERVER_KEY) return err("Nonaktif di mode live.", 403);
      const h = Math.min(48, Math.max(0, +body.hours || 0));
      const r = await env.DB.prepare("UPDATE orders SET paid_at=paid_at-?, reminded_at=CASE WHEN reminded_at IS NULL THEN NULL ELSE reminded_at-? END WHERE id=? AND status='dibayar'").bind(h * 3600, h * 3600, s(body.id, 30)).run();
      return json({ ok: true, changed: r.meta.changes });
    }
    const am = p.match(/^\/api\/admin\/orders\/(BK-[0-9]{8}-[A-Z0-9]{5})$/);
    if (am && m === "POST") {
      const status = s(body.status, 20), resi = s(body.resi, 60);
      if (!STATUSES.includes(status)) return err("Status tidak valid.");
      const prev = await env.DB.prepare("SELECT status FROM orders WHERE id=?").bind(am[1]).first();
      const r = await env.DB.prepare("UPDATE orders SET status=?, resi=?, updated_at=?, paid_at=COALESCE(paid_at, CASE WHEN ?='dibayar' THEN ? END) WHERE id=?").bind(status, resi || null, now(), status, now(), am[1]).run();
      if (!r.meta.changes) return err("Pesanan tidak ditemukan.", 404);
      if (status === "dibayar" && prev && prev.status !== "dibayar") await notifyAdmin(env, am[1], "paid");
      return json({ ok: true });
    }
  }
  return err("Tidak ditemukan.", 404);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) {
      try { return await api(req, env, url); }
      catch (e) { console.error(e); return err("Terjadi kesalahan server.", 500); }
    }
    return env.ASSETS.fetch(req);
  },
  async scheduled(event, env, ctx) { ctx.waitUntil(runReminders(env).then(r => console.log("pengingat WA admin:", JSON.stringify(r)))); },
};
