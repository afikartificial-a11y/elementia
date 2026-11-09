/**
 * tools-sync-rates.mjs — tarik tarif ASLI dari Biteship lalu simpan sebagai snapshot.
 *
 * Kenapa ada: tabel MOCK_TABLE di worker/worker.src.js hanyalah cadangan untuk mode
 * "simulasi". Tarif yang benar hanya keluar dari API kurir (lewat Biteship). Skrip ini
 * membuat proses sinkronisasi bisa diulang, bukan ditambal manual.
 *
 * Pakai:
 *   BITESHIP_API_KEY=xxxx node tools-sync-rates.mjs
 *   BITESHIP_API_KEY=xxxx node tools-sync-rates.mjs --weights 250,1000,5000,25000
 *
 * Hasil: data/rates-snapshot.json + ringkasan di layar.
 * Tanpa BITESHIP_API_KEY skrip berhenti dan TIDAK mengarang angka.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KEY = process.env.BITESHIP_API_KEY || "";
const ORIGIN = process.env.ORIGIN_POSTAL_CODE || "40288";
const API = "https://api.biteship.com/v1/rates/couriers";
const COURIERS = ["jne", "jnt", "sicepat", "spx"];
const LABEL = { jne: "JNE", jnt: "J&T", sicepat: "SiCepat", spx: "Shopee Express (SPX)" };

// Satu kode pos per zona tarif. Zona mengikuti ZONE() di worker.src.js.
const DESTINATIONS = [
  { zone: 1, postal: "40288", note: "Bandung (gudang, kontrol internal)" },
  { zone: 2, postal: "12190", note: "Jakarta Selatan" },
  { zone: 2, postal: "60111", note: "Surabaya" },
  { zone: 2, postal: "55111", note: "Yogyakarta" },
  { zone: 3, postal: "20111", note: "Medan" },
  { zone: 3, postal: "30111", note: "Palembang" },
  { zone: 3, postal: "80111", note: "Denpasar" },
  { zone: 4, postal: "76111", note: "Balikpapan" },
  { zone: 4, postal: "90111", note: "Makassar" },
  { zone: 5, postal: "99111", note: "Jayapura" },
];

const argW = process.argv.find((a) => a.startsWith("--weights="));
const argWSpaced = process.argv.indexOf("--weights") >= 0 ? process.argv[process.argv.indexOf("--weights") + 1] : null;
const WEIGHTS = (argW ? argW.split("=")[1] : argWSpaced || "250,1000,5000,25000")
  .split(",").map((n) => parseInt(n.trim(), 10)).filter((n) => n > 0).sort((a, b) => a - b);

if (!KEY) {
  console.error("BITESHIP_API_KEY kosong — tidak ada tarif yang bisa ditarik.");
  console.error("Isi dulu kuncinya (dashboard Biteship → Settings → API), lalu jalankan ulang:");
  console.error("  PowerShell:  $env:BITESHIP_API_KEY='xxx'; node tools-sync-rates.mjs");
  console.error("Skrip ini sengaja tidak menulis angka perkiraan ke snapshot.");
  process.exit(2);
}

async function ratesFor(postal, weightG) {
  const res = await fetch(API, {
    method: "POST",
    headers: { authorization: KEY, "content-type": "application/json" },
    body: JSON.stringify({
      origin_postal_code: +ORIGIN,
      destination_postal_code: +postal,
      couriers: COURIERS.join(","),
      items: [{ name: "Lada ELEMENTIA", description: "contoh", value: 100000, quantity: 1, weight: weightG }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(`${postal}/${weightG}g: ${data.error || res.status}`);
  return (data.pricing || []).map((p) => ({
    code: `${p.courier_code}:${p.courier_service_code}`,
    courier: p.courier_code,
    service: p.courier_service_name,
    label: `${p.courier_name} ${p.courier_service_name}`,
    price: p.price,
    etd: p.duration,
    weight_g: weightG,
    destination: postal,
  }));
}

const matrix = [];
const flat = [];
for (const d of DESTINATIONS) {
  for (const w of WEIGHTS) {
    try {
      const rows = await ratesFor(d.postal, w);
      matrix.push({ destination: d.postal, note: d.note, zone: d.zone, weight_g: w, rates: rows });
      flat.push(...rows.map((r) => ({ ...r, zone: d.zone, destination_note: d.note })));
      const cheap = rows.filter((r) => r.courier === "spx").map((r) => r.price);
      console.log(`${String(d.postal).padEnd(6)} ${String(w).padStart(6)}g  ${rows.length} layanan` +
        (cheap.length ? `  · SPX mulai ${Math.min(...cheap).toLocaleString("id-ID")}` : "  · SPX tidak tersedia"));
    } catch (e) {
      console.error(`GAGAL ${d.note} ${w}g — ${e.message}`);
      matrix.push({ destination: d.postal, note: d.note, zone: d.zone, weight_g: w, error: e.message, rates: [] });
    }
    await new Promise((r) => setTimeout(r, 350)); // sopan ke API
  }
}

const snapshot = {
  fetched_at: new Date().toISOString(),
  origin_postal_code: ORIGIN,
  origin_address: "Kawasan Industri De Prima Terra Blok A1 No. 1A, Kel. Tegalluar, Kec. Bojongsoang, Kab. Bandung 40288",
  couriers: COURIERS,
  weights_g: WEIGHTS,
  rows: flat.length,
  matrix,
};

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "rates-snapshot.json");
fs.writeFileSync(outFile, JSON.stringify(snapshot, null, 1), "utf8");

console.log(`\nTersimpan: ${outFile}`);
console.log(`${flat.length} baris tarif dari ${DESTINATIONS.length} tujuan × ${WEIGHTS.length} berat.`);

// Ringkas: rata-rata harga per kurir per zona pada 1 kg — pembanding cepat tabel mock.
const byCourierZone = {};
for (const r of flat.filter((x) => x.weight_g === 1000)) {
  const k = `${r.courier}|${r.zone}`;
  (byCourierZone[k] ||= []).push(r.price);
}
console.log("\nHarga 1 kg, rata-rata per kurir/zona (untuk memperbarui MOCK_TABLE):");
for (const courier of COURIERS) {
  const cells = [1, 2, 3, 4, 5].map((z) => {
    const v = byCourierZone[`${courier}|${z}`];
    return v && v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
  });
  console.log(`  ${LABEL[courier].padEnd(20)} ${cells.map((c) => String(c ?? "-").padStart(7)).join("")}`);
}
console.log("\nCatatan: SPX ikut ditarik; bila kosong, akun Biteship belum mengaktifkan layanan SPX.");
