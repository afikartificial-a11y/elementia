# ELEMENTIA — Serah Terima Proyek (Status per 10 November 2026)

Dokumen ini berdiri sendiri. Agen AI mana pun bisa membacanya tanpa riwayat percakapan
dan langsung melanjutkan pekerjaan.

---

## 1. Ringkasan

Toko daring **ELEMENTIA** — rempah & bumbu dasar satu bahan, dikemas seperti tabel periodik
(01 `Wp`, 03 `Bp`, 06 `Tr`, …). Situs statis + Cloudflare Worker + D1, dengan checkout,
akun, pesanan, ongkir per provinsi, dan 50 resep halal bertaut ke halaman produk.

Berasal dari dua generasi sebelumnya: **Bukara** (100 SKU, identitas lama) dan **Lyra**
(rebrand pertama). Keduanya masih utuh di folder masing-masing; Elementia adalah lini terbaru.

## 2. Peta cepat

| Item | Nilai |
|---|---|
| Folder proyek | `D:\Home\Grok Bot\elementia` |
| Situs live | https://elementia-preview.afik-artificial.workers.dev |
| Worker | `elementia-preview` |
| Database | D1 `elementia-preview-db` (`53fd1f4e-240f-4601-809b-55f0576d045d`) |
| Repo | git lokal, commit terakhir `973de9b` |
| Bahasa | Indonesia (seluruh konten situs) |
| Runtime | Node ≥ 22, Python ≥ 3.10 |

## 3. Identitas merek

| Field | Nilai |
|---|---|
| Nama | ELEMENTIA |
| Tagline | **Pure & Essential** |
| Tagline panjang | Pure Elements for Your Daily Dish |
| Badan hukum | **PT Origin Eka Manufaktur** |
| Domain rencana | elementia.id (belum dipakai) |
| Palet | Pure White `#FFFFFF`, Charcoal `#333333`, Copper `#B87333` |

Palet hanya tiga warna. Turunan yang diizinkan: `#96602A` (hover copper), `#262626`
(permukaan gelap), `#F7F7F7` (band section), `#E6E6E6` (garis), `#8A5A1E` (teks chip).

## 4. Data — sumber kebenaran

| Berkas | Isi | Jumlah |
|---|---|---|
| `data/katalog-v3.json` | komoditas, varian, simbol elemen, narasi, galeri | 11 komoditas / 25 varian |
| `data/harga-2026.json` | kemasan + harga per varian | 50 SKU (25 × 2 kemasan) |
| `assets/data/catalog.json` | katalog runtime untuk checkout/API | 50 item (hasil build) |
| `data/resep-halal.json` | resep halal | 50 resep, 85 bahan bertag |
| `data/tarif-provinsi-2026-11.json` | tarif ongkir terukur | 34 provinsi × 4 kurir |
| `assets/data/wilayah/` | provinsi → kabupaten → kecamatan → kode pos | 38 provinsi, 7.097 kecamatan |
| `data/pricelist-2027.json` | halaman daftar harga | 11 komoditas |

### Skema SKU

`{komoditas}-{varian}-{kemasan}-{gram}` → contoh `lada-putih-butir-pouch-250g`.
Setiap item punya `berat_g` (netto) dan `berat_bruto_g` (netto × 1,10).

### Simbol elemen

| No | Simbol | Komoditas | No | Simbol | Komoditas |
|---|---|---|---|---|---|
| 01 | Wp | Lada Putih | 17 | Cs | Gula Kelapa |
| 03 | Bp | Lada Hitam | 18 | Ch | Cabai |
| 06 | Tr | Kunyit | 21 | Gf | Bawang Putih |
| 08 | Lg | Sereh | 23 | Co | Ketumbar |
| 10 | Bl | Daun Salam | 25 | Cn | Kemiri |
| 12 | Ps | Gula Aren | | | |

Nomor yang tampil = nomor komoditas, bukan varian. Varian (Butir/Bubuk/Pecah/Kering/…)
tidak menampilkan nomor.

## 5. Arsitektur & perintah

```
build.py        → menghasilkan 24 halaman HTML di akar proyek
assemble.py     → menyalin ke dist/ + bundel worker (esbuild via node)
worker/         → API + D1 (worker.src.js, schema.sql, migrate-v4..v7.sql)
tools-dev.mjs   → server lokal SQLite persisten (data/local.db)
```

```bash
python build.py && python assemble.py dist   # bangun ulang
node tools-dev.mjs                            # lokal http://127.0.0.1:8787
npx wrangler@4 deploy                         # deploy
node tools/agent-cli.mjs info                 # ringkasan proyek (JSON)
node tools/agent-cli.mjs catalog search lada
node tools/agent-cli.mjs rates --provinsi Bali --kode-pos 80361 --items lada-putih-butir-pouch-250g:2
node tools/mcp-server.mjs                     # server MCP (stdio)
```

Server MCP menyediakan 7 tool: `project_info`, `catalog_search`, `catalog_get`,
`shipping_rates`, `wilayah_lookup`, `wilayah_search`, `orders_list`.

## 6. Keputusan yang mengikat

1. **Harga tidak boleh dikarang.** Semua angka berasal dari `Resep/` atau `harga-2026.json`.
2. **Berat kirim = bruto (netto + 10%)**, dibulatkan ke atas per kg. Bruto masih dummy.
3. **Ongkir = snapshot**, bukan API real-time. UI wajib menyebut "tarif acuan".
4. **Alamat wajib dropdown** (provinsi → kabupaten → kecamatan → kode pos). Tidak ada input bebas.
5. **Foto produk masih placeholder.** Ikon elemen adalah pengganti resmi sementara.
6. **Judul masakan memuat varian**; tidak ada kelompok/tag varian terpisah.
7. Bahan segar (bawang putih, cabai rawit, jahe, sereh batang) **tidak** diberi tag produk —
   hanya bentuk olahan yang benar-benar dijual.

## 7. Riwayat perubahan terakhir

| Commit | Isi |
|---|---|
| `973de9b` | bersihkan berkas tambal sementara |
| `7c821d1` | resep: hapus kepala kelompok varian, 50 gambar dummy 16:9, kartu lepas dari animasi |
| `90437bf` | resep: 50 resep halal + 85 tag bahan bertaut ke produk |
| `aec5048` | perbaikan beranda: tag `</ul>` yang tertukar, badge bertumpuk, nav meluber |
| `bfd2929` | ikon Gf/Cs/Co/Cn; baris varian jadi tautan penuh (tanpa tombol Lihat) |
| `edf6244` | palet putih/charcoal/copper menyeluruh + koreksi kontras |
| `c93cd46` | rebrand Lyra → Elementia, katalog 50 SKU, ikon elemen |

## 8. Status

**Selesai:** rebranding, palet, katalog 50 SKU, ikon 11 elemen, dropdown wilayah,
ongkir 34 provinsi, 50 resep + tag bahan + gambar dummy, halaman produk, checkout, D1.

**Belum:**

| Hal | Dampak |
|---|---|
| Nomor WA/telepon masih `000-0000-0000` | tombol WhatsApp tidak berfungsi |
| Alamat gudang masih Tegalluar 40288 | menentukan tarif ongkir, wajib dicek |
| Foto produk = ikon elemen | belum ada foto kemasan asli |
| Foto masakan = dummy 1200×675 | menunggu foto asli |
| Pembayaran `simulasi` (tanpa Midtrans) | belum bisa transaksi nyata |
| `ADMIN_PASSWORD` belum diset | panel admin tertutup |
| Domain `elementia.id` belum diarahkan | masih pakai workers.dev |

## 9. Cara melanjutkan

1. **Ganti foto masakan.** Timpa `assets/img/resep-halal/{slug}.webp` dengan foto asli
   (rasio 16:9, 1200×675). Nama berkas tidak perlu diubah.
2. **Ganti foto produk.** Siapkan `assets/img/produk/` lalu ubah `img` pada
   `data/katalog-v3.json`, jalankan `python build.py`.
3. **Isi kontak asli** di `site.config.json` → `brand`, lalu build ulang.
4. **Aktifkan admin:** `npx wrangler secret put ADMIN_PASSWORD`.
5. **Pembayaran nyata:** set `MIDTRANS_SERVER_KEY` + `MIDTRANS_CLIENT_KEY`.
6. **Domain:** pasang custom domain di Cloudflare lalu perbarui `PUBLIC_URL` di `wrangler.jsonc`.

## 10. Jebakan yang sudah pernah menggigit

Catat agar tidak terulang:

1. **Jangan pernah `replace('</ul>', '</div>')` global.** Pernah dilakukan → 8 kartu keluar
   kontainer, tinggi beranda 12.370 px → 30.977 px. Selalu sunting dengan konteks unik.
2. **Jangan hapus `foot()` dari blok halaman.** Pernah terjadi → halaman tanpa `<script>`,
   50 kartu `opacity: 0` tak terlihat.
3. **Jangan pakai nama variabel `_slug`, `_k`, `_v`** di skrip build — menimpa fungsi global
   `_slug()` dan memicu `TypeError: 'str' object is not callable`.
4. **`.bk-badge` dipakai dua komponen.** Label kecil "Segera hadir" memakai
   `.bk-badge--pill`; kartu HALAL/HACCP/UJI LAB memakai `.bk-badge`. Jangan disatukan.
5. **Migrasi SQL lama tidak idempoten.** Untuk database baru cukup `worker/schema.sql`;
   `migrate-v4..v6` akan gagal "duplicate column" — itu normal.
6. **Animasi reveal bergantung JS.** Kartu resep sengaja tidak memakainya.

## 11. Berkas kunci

```
AGENTS.md                 kontrak proyek untuk agen
agent/manifest.json       kapabilitas + perintah
agent/SKILL.md            skill siap pasang
tools/agent-cli.mjs       CLI
tools/mcp-server.mjs      server MCP
tools/build-brand-assets.py   potong ikon + buat logo
tools/build-catalog-data.py   bangun katalog dari ringkasan produk
tools/build-resep.py          parse resep .md → JSON
tools/enrich-resep.py         judul bervarian + gambar dummy
tools/dummy-images.py         gambar dummy produk/hero
assets/css/elementia.css      seluruh gaya + palet
```

Sumber mentah: `brand-src/` (logo & lembar ikon asli dari pemilik merek).
Foto asli yang diganti dummy TIDAK disimpan di proyek ini — salinannya ada di
`D:\Home\Grok Bot\lyra\archive\img-asli\`.
