---
name: elementia-store
description: Operasikan proyek toko Elementia (rempah tumpangsari) — cari SKU dan harga, hitung ongkir per provinsi, telusuri wilayah dan kode pos, baca pesanan lokal, build, dan deploy. Gunakan saat pengguna bertanya tentang produk, harga, ongkir, alamat, pesanan, atau meminta perubahan pada situs Elementia.
---

# Elementia Store

Proyek toko di `D:\Home\Grok Bot\elementia` (atau lokasi hasil duplikasi). Semua perintah
dijalankan dari akar proyek.

## Kapan dipakai

- Pertanyaan produk/harga/kemasan → `catalog`
- Pertanyaan ongkir ke suatu daerah → `rates`
- Alamat tidak valid atau perlu kode pos → `wilayah`
- Cek pesanan masuk → `orders`
- Perubahan situs → sunting sumber lalu build

## Perintah

```bash
node tools/agent-cli.mjs info
node tools/agent-cli.mjs catalog search "kunyit" --limit 5
node tools/agent-cli.mjs catalog get kunyit-kering-pouch-250g
node tools/agent-cli.mjs rates --provinsi "DKI Jakarta" --kode-pos 12410 --items kunyit-kering-pouch-250g:2
node tools/agent-cli.mjs wilayah search "cibiru"
node tools/agent-cli.mjs orders --status baru --limit 10
```

Keluaran selalu JSON. `--pretty` untuk versi terbaca.

## Aturan

1. Harga, berat, dan tarif hanya dari berkas data — jangan menaksir.
2. Berat kirim selalu netto + 10%; jangan menghitung dari berat netto saja.
3. Tarif ongkir adalah acuan snapshot KiriminAja; sebutkan bahwa itu bukan tarif real-time.
4. Setelah mengubah sumber Python/JS: `python build.py && python assemble.py dist`, lalu `node --check dist/worker.js`.
5. Jangan menulis kredensial ke repo; pakai `npx wrangler secret put`.

## MCP

Alternatif CLI untuk klien MCP: `node tools/mcp-server.mjs` (stdio). Tool: `project_info`,
`catalog_search`, `catalog_get`, `shipping_rates`, `wilayah_lookup`, `wilayah_search`, `orders_list`.

## Rujukan

- `AGENTS.md` — kontrak lengkap proyek
- `agent/manifest.json` — daftar kemampuan, data, secret
- `data/TARIF.md` — metode dan keterbatasan tarif ongkir
