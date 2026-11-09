# Deploy ke Cloudflare lewat GitHub

Alur: **push ke GitHub → GitHub Actions membangun situs → `wrangler deploy` ke Cloudflare Workers → uji asap otomatis.**

Yang saya belum bisa lakukan sendiri: repo ini belum punya remote GitHub, dan mesin ini tidak punya token Cloudflare (`CLOUDFLARE_API_TOKEN` kosong, `gh` tidak terpasang, 0 koneksi terotorisasi). Semua langkah di bawah sudah disiapkan sebagai file — tinggal dijalankan dengan kredensial Anda.

---

## 0. Yang harus Anda siapkan

| Kebutuhan | Cara mendapat |
|---|---|
| Repo GitHub kosong | github.com → New repository, **jangan** centang README |
| `CLOUDFLARE_API_TOKEN` | dash.cloudflare.com → My Profile → API Tokens → Create Token → template **Edit Cloudflare Workers** + izin **D1: Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | dash.cloudflare.com → Workers & Pages → sisi kanan, "Account ID" |
| `CLOUDFLARE_D1_ID` | jalankan `npx wrangler d1 create elementia-preview-db` (atau ambil dari D1 yang sudah ada) |

## 1. Sekali saja: siapkan database

```powershell
cd "D:\Home\Grok Bot\elementia"
npx wrangler login
npx wrangler d1 create elementia-preview-db
```

Salin `database_id` yang muncul. Kalau ingin memakai database yang sudah dipakai situs live sekarang, ambil id-nya di dashboard D1 — jangan buat baru, agar data lama tidak hilang.

## 2. Isi rahasia Worker (bukan di repo)

```powershell
npx wrangler secret put ADMIN_PASSWORD --name elementia-preview
npx wrangler secret put BITESHIP_API_KEY --name elementia-preview   # opsional
npx wrangler secret put MIDTRANS_SERVER_KEY --name elementia-preview # opsional
```

## 3. Push repo

```powershell
cd "D:\Home\Grok Bot\elementia"
git remote add origin https://github.com/<akun>/<repo>.git
git branch -M main
git push -u origin main
```

## 4. Tambahkan 3 secret di GitHub

Repo → Settings → Secrets and variables → Actions → **New repository secret**:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_ID`

Setelah itu setiap push ke `main` otomatis: build → migrasi D1 → deploy → uji asap.

## 5. Alternatif: Cloudflare Workers Builds (tanpa Actions)

Kalau lebih suka tombol di dashboard: Workers & Pages → Create → **Workers** → **Connect to Git** → pilih repo → isi:

| Setelan | Nilai |
|---|---|
| Build command | `npm ci --prefix worker/build && python build.py && python assemble.py dist` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

Catatan: Workers Builds harus punya Python di image-nya. Jika build gagal karena `python: not found`, pakai jalur GitHub Actions di atas — jalur itu sudah mengunci versi Node 22 dan Python 3.12.

---

## Yang dijalankan CI

`.github/workflows/deploy.yml`:

1. `npm ci` di `worker/build` (esbuild + pdf-lib)
2. `python build.py` → 12 halaman HTML + sitemap
3. `python assemble.py dist` → `dist/public` + `dist/worker.js` (katalog harga di-embed)
4. `sed` mengisi `__D1_ID__` dari secret
5. `wrangler d1 execute` untuk `schema.sql` lalu `migrate-v*.sql` (migrasi yang sudah pernah jalan dilewati)
6. `wrangler deploy`
7. Uji asap: `GET /` harus memuat teks "Lima rempah" dan `GET /api/config` harus `{"ok":true}` — kalau tidak, job gagal

## Kalau perlu rollback

```powershell
npx wrangler deployments list --name elementia-preview
npx wrangler rollback --name elementia-preview <deployment-id>
```

## Belum siap produksi (jangan dianggap selesai)

- `GET /api/config` masih `payment_mode: simulasi`, `shipping_mode: simulasi` — kunci Midtrans/Biteship belum diisi.
- Empat komoditas (sereh, kunyit, cabai, daun salam) masih "harga menyusul" dan fotonya placeholder.
- Tabel `leads` sudah ada dan menerima permintaan penawaran, tapi belum ada layar admin untuk membacanya.
- `data/local.db` (data uji lokal) tidak ikut ter-commit — `data/` hanya berisi pricelist & katalog.

---

## Status deploy - 6 November 2026

Sudah live, langsung dari mesin ini memakai OAuth Wrangler (bukan lewat CI, karena repo GitHub belum ada).

| Item | Nilai |
|---|---|
| URL | https://elementia-preview.afik-artificial.workers.dev |
| Akun Cloudflare | afik.artificial@gmail.com (8a502aaaf17864aef2e58f28af72f731) |
| Worker | elementia-preview |
| D1 | elementia-preview-db / dd6b9bfd-4082-4f34-8dbf-81388ad15d47 (APAC) |
| Versi | 24f99a80-184b-4f34-9d4c-2356552fd077 |
| Cron | */15 * * * * (pengingat pesanan) |
| Secret | ADMIN_PASSWORD (disimpan di ADMIN_PASSWORD.txt, gitignored) |

Verifikasi: 5 halaman 200; /api/config ok; /api/quote 400 tanpa nama, 201 saat valid; 1 baris uji masuk tabel leads (id=1 "Uji Deploy"); checkout menolak keranjang kosong dan kurir tak dikenal.

Belum: repo GitHub (CI belum aktif), MIDTRANS dan BITESHIP (masih simulasi), domain kustom, dan hapus baris uji leads.
