# Sumber tarif ongkir (snapshot)

**Diambil:** 7 November 2026, dari **https://kiriminaja.com/cekaja** (alat publik, tanpa login).
**Asal:** Tegalluar, Bojongsoang, Kab. Bandung 40288.
**Berat uji:** 1.000 g untuk parcel, 25.000 g untuk kargo.

Berkas mentah: `kiriminaja-parcel-2026-11-07.json`, `kiriminaja-kargo-2026-11-07.json`.

## Peta zona (worker: `ZONE()`)

| Zona | Provinsi | Kota acuan KiriminAja |
|---|---|---|
| 1 | Jawa Barat | Bandung |
| 2 | DKI Jakarta, Banten | Jakarta Selatan |
| 3 | Jawa Tengah, DI Yogyakarta | Semarang |
| 4 | Jawa Timur, Bali | Surabaya |
| 5 | Seluruh Sumatera | Medan |
| 6 | Kalimantan, Sulawesi, NT, Maluku, Papua | Makassar |

## Tarif parcel per kg (Rp)

| Kurir | z1 | z2 | z3 | z4 | z5 | z6 |
|---|---|---|---|---|---|---|
| JNE Reguler | 7.650 | 11.050 | 15.300 | 17.850 | 42.000 | 51.000 |
| JNE YES | 12.000 | 17.000 | 22.000 | 41.000 | 78.000 | 89.000 |
| J&T EZ | 7.600 | 10.450 | 15.200 | 17.100 | 31.350 | 46.550 |
| SiCepat REG | 6.300 | 9.900 | 14.400 | 16.200 | 29.700 | 48.000 |
| SPX Standard | 7.100 | 9.728 | 14.546 | 16.091 | 29.728 | 44.000 |

## Tarif kargo per kg (min. 10 kg)

| Kurir | z1 | z2 | z3 | z4 | z5 | z6 |
|---|---|---|---|---|---|---|
| SentralCargo Darat | 2.100 | 2.400 | — | 3.400 | — | — |
| J&T Cargo Reguler | 2.940 | 2.940 | — | 3.920 | — | — |
| SiCepat Kargo | 3.500 | 3.500 | — | 5.500 | — | — |

Angka kargo diturunkan dari total 25 kg di KiriminAja (mis. SentralCargo Jakarta Rp60.000 ÷ 25 kg).

## Cara hitung di Worker

1. `kg = ceil(berat_barang × 1,05 / 1000)` — pembulatan ke atas per kg (perilaku KiriminAja: 1,5 kg ditagih 2 kg).
2. Parcel: `harga = perKg[zona] × kg`.
3. Kargo (berat > 5 kg): `harga = perKg[zona] × max(10, kg)`.

## Batasan yang perlu diketahui

- **Bukan tarif real-time.** Ini potret. Bila kurir menaikkan tarif, angkanya kedaluwarsa.
- **Zona 3/5/6 untuk kargo masih kosong** — tidak ditampilkan, bukan dikarang.
- **Parcel di atas ±10 kg** cenderung lebih mahal dari tagihan nyata karena tarif kurir menurun per kg pada berat besar; kargo disediakan sebagai alternatif.
- Angka SPX memakai tarif tampil KiriminAja (setelah diskon dasar), bukan harga coret.

## Cara memperbarui

1. Buka https://kiriminaja.com/cekaja, isi asal Tegalluar, berat 1.000 g, lalu ulangi untuk 6 kota acuan.
2. Ganti array `perKg` pada `MOCK_TABLE` (parcel) dan `CARGO_TABLE` (kargo) di `worker/worker.src.js`.
3. `python assemble.py dist && npx wrangler deploy`.

Jika nanti memakai API KiriminAja/Biteship dengan kunci, tabel ini otomatis tidak dipakai — `courierRates()` memilih API lebih dulu.

---

## Berat paket (mulai 7 Nov 2026)

- `berat_g` = berat **netto** (sesuai daftar harga).
- `berat_bruto_g` = netto **+ 10%** — masih **dummy**, menunggu data kemasan asli.
- Berat kirim = Σ (berat_bruto_g × qty); `kg = ceil(berat_kirim / 1000)`.
- Contoh terverifikasi: 950 g netto → 1.045 g → **2 kg** (sebelumnya dengan +5% menjadi 998 g → 1 kg, kurang tagih).

## Status integrasi akun KiriminAja (7 Nov 2026)

Login ke akun berhasil, tetapi **belum bisa real-time** karena:

1. **API key belum ada.** Halaman `app.kiriminaja.com/integrasi-aplikasi/mitra/submission` menampilkan "Belum Ada Data — Ajukan akses MitraAPI terlebih dahulu". Akses Mitra API adalah pendaftaran 4 langkah (dokumen usaha).
2. **Endpoint internal dashboard menolak akses luar.** `prd-kaj-srvc-dshbd-api-ext.kiriminaja.com/api/dm/v1/shipping/express` mengembalikan `401 Unauthenticated` tanpa sesi login.
3. **Tidak ada markup untuk akun login.** Tarif dashboard untuk rute Tegalluar → Jakarta Selatan 1 kg **identik** dengan halaman publik cekaja pada 9 ekspedisi (Ninja 8.000, NCS 9.000, Tiki 9.700, SPX 9.728, SiCepat 9.900, ID Express 9.975, J&T 10.450, JNE 11.050, Regpack 12.018).

Artinya: angka di tabel ini **sama persis** dengan yang dilihat akun Anda hari itu. Yang belum ada hanyalah pembaruan otomatis.

### Langkah membuka real-time

1. Ajukan **Mitra API** di akun (menu Integrasi Aplikasi → Mitra API → 4 langkah, butuh dokumen usaha).
2. Setelah disetujui, salin API key, lalu:
   `npx wrangler secret put KIRIMINAJA_API_KEY`
3. Beri tahu saya — adapter KiriminAja akan diaktifkan (butuh pemetaan kode pos → `subdistrict_id` lewat endpoint coverage mereka).

---

# Pembaruan 8 Nov 2026 — tarif per provinsi (menggantikan 6 zona)

## Apa yang berubah

| | Sebelum | Sesudah |
|---|---|---|
| Pembagian wilayah | 6 zona (Bandung/Jakarta/Semarang/Surabaya/Medan/Makassar) | **34 provinsi**, tiap provinsi punya tarif sendiri |
| Dasar angka | 1 kg × jumlah kg | tarif 1 kg + biaya per kg tambahan (diukur dari tarif 3 kg) |
| Sumber harga | tarif kotor | **tarif tampil di cekaja** (setelah diskon kampanye) |
| Input alamat | teks bebas (rawan salah tulis) | dropdown provinsi → kabupaten/kota → kecamatan → kode pos |

## Cara mengumpulkan

- 60 pengecekan di `https://kiriminaja.com/cekaja`, asal Tegalluar Bojongsoang Bandung 40288.
- Setiap provinsi diwakili ibu kota/kota terbesarnya, diuji pada **1.000 g dan 3.000 g**.
- Biaya kg tambahan = (tarif 3 kg − tarif 1 kg) / 2, dibulatkan ke Rp50.
- Provinsi pemekaran Papua (Papua Selatan, Papua Tengah, Papua Pegunungan, Papua Barat Daya)
  memakai tarif induknya: Papua / Papua Barat.
- Harga memakai **tarif yang tampil** di cekaja. JNE, J&T, dan SiCepat punya diskon kampanye
  (mis. JNE Denpasar 26.000 → tampil 22.100); SPX tidak. Bila kampanye berakhir, tarif dasar
  yang berlaku — perbarui tabel ini.

## Selisih nyata vs tabel lama

| Tujuan | Tabel lama (JNE) | Tarif cekaja (JNE) |
|---|---|---|
| Banda Aceh | 42.000 | 53.000 |
| Denpasar | 17.850 | 22.100 |
| Mataram | 51.000 | 45.000 |
| Kupang | 51.000 | 89.000 |
| Pontianak | 51.000 | 48.000 |
| Balikpapan | 51.000 | 52.000 |
| Jayapura | 51.000 | 139.000 |

## Keterbatasan

- Snapshot, bukan API real-time: tarif berubah tanpa pemberitahuan.
- Tarif di atas 3 kg diekstrapolasi linear memakai biaya kg tambahan.
- Layanan yang tidak tersedia di suatu tujuan tidak ditampilkan (mis. Maluku Utara hanya J&T).
- Kargo (min. 10 kg) hanya untuk Jawa Barat, DKI Jakarta, dan Jawa Timur — itu yang diuji 25 kg.

## Data pendukung

- `data/tarif-provinsi-2026-11.json` — tabel final (r1, r3, inc, etd per provinsi).
- `ref/kiriminaja/rates-*.json` — rekaman mentah respons `/intl-api/pricing`.
- `assets/data/wilayah/` — 38 provinsi, 7.097 kecamatan, 11.247 pasangan kecamatan–kode pos.
