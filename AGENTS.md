# AGENTS.md — kontrak proyek untuk agen AI

Proyek ini adalah toko daring **Elementia**, hasil duplikasi proyek Elementia, dan bisa dipanggil agen mana pun.
Baca ini sebelum mengubah apa pun.

> **Status: pratinjau live, belum siap transaksi nyata.** Situs jalan di
> https://elementia-preview.afik-artificial.workers.dev (Worker `elementia-preview` + D1
> `elementia-preview-db`). Katalog 11 komoditas / 50 SKU. Yang masih placeholder: nomor WhatsApp
> & telepon `000-0000-0000`, alamat gudang Tegalluar (menentukan ongkir), foto produk (ikon
> elemen), foto masakan (dummy), pembayaran & ongkir mode `simulasi`, serta domain `elementia.id`.
> Daftar lengkap ada di `site.config.json` → `_todo` dan `HANDOFF.md` §8.

## 1. Panggilan cepat

```bash
node tools/agent-cli.mjs info
node tools/agent-cli.mjs catalog search "lada bubuk" --limit 5
node tools/agent-cli.mjs rates --provinsi Bali --kode-pos 80361 --items lada-putih-butir-pouch-250g:2
node tools/agent-cli.mjs wilayah --provinsi "Jawa Barat" --kabupaten "Kota Bandung" --kecamatan Cibiru
node tools/agent-cli.mjs orders --status baru --limit 10
```

Semua keluaran JSON: `{ "ok": true, ... }` atau `{ "ok": false, "error": "..." }`.
Tambahkan `--pretty` untuk keluaran terbaca.

Sebagai alat MCP (stdio, tanpa dependensi):

```json
{ "mcpServers": { "elementia": { "command": "node", "args": ["<akar-proyek>/tools/mcp-server.mjs"] } } }
```

Tool yang tersedia: `project_info`, `catalog_search`, `catalog_get`, `shipping_rates`,
`wilayah_lookup`, `wilayah_search`, `orders_list`.

## 2. Bentuk proyek

| Bagian | Berkas | Catatan |
|---|---|---|
| Generator halaman | `build.py`, `shop_pages.py`, `v3_pages.py` | Sumber HTML; **jangan** sunting `*.html` hasil build |
| Data | `assets/data/catalog.json` (50 SKU, hasil build), `data/harga-2026.json`, `data/tarif-provinsi-2026-11.json`, `assets/data/wilayah/` | Sumber kebenaran |
| Frontend | `assets/js/*.js`, `assets/css/elementia.css` | `shop.js` = keranjang, checkout, wilayah bertingkat |
| Backend | `worker/worker.src.js` + `worker/schema.sql` | Cloudflare Worker + D1 |
| Rakit & deploy | `assemble.py dist`, `npx wrangler deploy` | `dist/` hasil, jangan disunting |

Alur build: `python build.py` → `python assemble.py dist` → deploy `dist/worker.js` + `dist/public`.

Panel admin (`/admin.html`, perlu `ADMIN_PASSWORD`): daftar pesanan + ubah status/resi, unduh label
PDF, log notifikasi WA, dan panel **permintaan penawaran B2B** (lead dari `/bisnis.html`) dengan
filter status, ubah status, chat WhatsApp, serta unduh CSV. Endpoint: `GET /api/admin/leads`,
`POST /api/admin/leads/:id`, `GET /api/admin/leads.csv`.

## 3. Aturan yang tidak boleh dilanggar

1. **Jangan mengarang harga, berat, atau tarif.** Semua dari berkas data.
2. **Berat kirim = netto × 1,10** (`berat_bruto_g`). Sudah dihitung di `catalog.json` dan dihitung ulang di Worker.
3. **Ongkir adalah snapshot** KiriminAja (`data/TARIF.md` menyebut tanggal). Selalu sebut "bukan real-time".
4. **Alamat memakai dropdown** provinsi → kabupaten → kecamatan → kode pos. Detail jalan/desa di kolom alamat.
5. **Tanpa kredensial di repo.** Secret lewat `npx wrangler secret put`.
6. **Jangan mengubah `data/local.db`** milik pengguna lewat alat baca-saja; `orders` hanya membaca.

## 4. Tugas yang sering diminta

- **Tambah/ubah produk**: ubah `data/harga-2026.json` → jalankan `python _xlsx_to_json.py` bila dari Excel → `python build.py` → cek `assets/data/catalog.json` → `python assemble.py dist`.
- **Perbarui tarif ongkir**: `python _build_tarif.py` (memakai rekaman di `ref/kiriminaja/`) lalu `python tools/_patch*.py` tidak diperlukan — tabel ada di `data/tarif-provinsi-2026-11.json`, Worker membacanya lewat blok `RATES`.
- **Ubah merek/kontak**: sunting `site.config.json`, lalu ikuti `files_to_edit` di berkas itu.
- **Perbarui data wilayah**: `python _build_wilayah.py` (sumber CSV di `_wilayah/`, tidak ikut deploy).

## 5. Verifikasi sebelum menyatakan selesai

```bash
python build.py && python assemble.py dist
node --check dist/worker.js
node tools/agent-cli.mjs rates --provinsi Bali --kode-pos 80361 --items lada-putih-butir-pouch-250g:5
```

Uji lokal: `node tools-dev.mjs` (http://127.0.0.1:8787, SQLite di `data/local.db`; `--memory` untuk sementara).
