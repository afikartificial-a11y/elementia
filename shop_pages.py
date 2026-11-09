# ================= TOKO (v3): katalog + halaman keranjang/checkout/akun/admin =================
import re as _re
IMG = {}
for _k in KOM:
    for _v in _k["varian"]:
        _f = _v["img"] if "." in _v["img"] else _v["img"] + ".webp"
        IMG[(_k["nama"], _v["nama"])] = "assets/img/produk/" + _f

CAT = []
for _k in H:
    for _v in _k["varian"]:
        for _km in _v["kemasan"]:
            CAT.append({
                "sku": sku_of(_k["nama"], _v["nama"], _km["jenis"], _km["gram"]),
                "nama": f'{_k["nama"]} {_v["nama"]} {_km["jenis"]} {gram_txt(_km["gram"])}',
                "jenis": _k["nama"],
                "bentuk": _v["nama"],
                "kemasan": _km["jenis"],
                "ukuran": gram_txt(_km["gram"]),
                "harga": _km["harga"],
                "berat_g": _km["gram"],
        "berat_bruto_g": int(round(_km["gram"] * 1.10)),
                "img": IMG.get((_k["nama"], _v["nama"]), ""),
            })
os.makedirs(os.path.join(ROOT, "assets", "data"), exist_ok=True)
json.dump({"sumber": "Varian Produk.xlsx (harga termasuk PPN)",
           "catatan_berat": "berat_g = netto; berat_bruto_g = netto + 10% kemasan (dummy, menunggu data asli)",
           "items": CAT},
          open(os.path.join(ROOT, "assets", "data", "catalog.json"), "w"), ensure_ascii=False, indent=1)
print("catalog", len(CAT))

TEST = '<div class="bk-testmode" role="note"><strong>Mode uji coba</strong> — pembayaran &amp; ongkir masih SIMULASI. Tidak ada uang sungguhan yang ditagih.</div>'
PROV = ["Aceh","Sumatera Utara","Sumatera Barat","Riau","Kepulauan Riau","Jambi","Sumatera Selatan","Kepulauan Bangka Belitung","Bengkulu","Lampung",
 "DKI Jakarta","Banten","Jawa Barat","Jawa Tengah","DI Yogyakarta","Jawa Timur","Bali","Nusa Tenggara Barat","Nusa Tenggara Timur",
 "Kalimantan Barat","Kalimantan Tengah","Kalimantan Selatan","Kalimantan Timur","Kalimantan Utara",
 "Sulawesi Utara","Gorontalo","Sulawesi Tengah","Sulawesi Barat","Sulawesi Selatan","Sulawesi Tenggara",
 "Maluku","Maluku Utara","Papua","Papua Barat","Papua Barat Daya","Papua Tengah","Papua Pegunungan","Papua Selatan"]
def shop_page(name, title, h1, sub, body, crumb):
    pg = head(f"{title} | ELEMENTIA", f"{title} — toko online ELEMENTIA.", name, noindex=True)
    pg += f'''<div class="wp-block-group alignfull bk-shop-hero"><div class="bk-wrap"><nav class="ct-breadcrumbs" aria-label="Breadcrumb"><a href="index.html">Beranda</a> / <span>{crumb}</span></nav><h1 class="bk-h2">{h1}</h1>{f"<p>{sub}</p>" if sub else ""}</div></div>
<div class="wp-block-group alignfull bk-section bk-shop"><div class="bk-wrap">{body}</div></div>
''' + foot()
    write(name, pg)

shop_page("keranjang.html", "Keranjang", "Keranjang belanja", "Harga sesuai Pricelist 2027, sudah termasuk PPN.", TEST + f'''
<div class="bk-shop-grid"><div class="bk-panel"><div id="cart-list" aria-live="polite"><p class="bk-muted">Memuat keranjang…</p></div></div>
<aside class="bk-panel bk-summary"><h2 class="bk-h3">Ringkasan</h2><dl class="bk-sum"><dt>Subtotal</dt><dd id="cart-subtotal">Rp 0</dd><dt>Perkiraan berat</dt><dd id="cart-weight">0 g</dd></dl>
<p class="bk-muted" style="font-size:13px">Ongkos kirim dihitung di halaman checkout.</p>
<div class="wp-block-button bk-block"><a class="wp-block-button__link" id="to-checkout" href="checkout.html">Lanjut ke checkout</a></div>
<div class="wp-block-button is-style-outline bk-block" style="margin-top:10px"><a class="wp-block-button__link" id="cart-wa" href="{WA_PL}" target="_blank" rel="noopener">{I["wa"]} Atau pesan via WhatsApp</a></div>
<p style="margin-top:14px;font-size:14px"><a href="produk.html">← Lanjut belanja</a></p></aside></div>''', "Keranjang")

_wil = __import__("json").load(open(__import__("os").path.join(__import__("os").path.dirname(__file__), "assets", "data", "wilayah", "index.json"), encoding="utf-8"))
prov_opts = '<option value="">Pilih provinsi</option>' + "".join(
    f'<option value="{E(p["nama"])}" data-id="{p["id"]}">{E(p["nama"])}</option>' for p in _wil["provinsi"])
shop_page("checkout.html", "Checkout", "Checkout", "Isi kontak dan alamat pengiriman. Pembeli tamu bisa langsung checkout.", TEST + f'''
<form id="checkout-form" class="bk-shop-grid" novalidate>
<div class="bk-panel">
 <div id="co-login-hint" class="bk-note" style="margin-bottom:24px">Sudah punya akun? <a href="masuk.html?next=checkout.html">Masuk</a> untuk memakai alamat tersimpan.</div>
 <fieldset><legend class="bk-h3">1. Kontak</legend>
  <div class="bk-fields"><label>Nama lengkap<input name="name" autocomplete="name" required maxlength="100"></label>
  <label>No. HP / WhatsApp<input name="phone" type="tel" autocomplete="tel" inputmode="tel" required pattern="[0-9+ -]{{8,20}}" placeholder="08xxxxxxxxxx"></label>
  <label class="bk-full">Email<input name="email" type="email" autocomplete="email" required maxlength="120"></label></div></fieldset>
 <fieldset><legend class="bk-h3">2. Alamat pengiriman</legend>
  <div id="saved-addr" hidden><label class="bk-full">Alamat tersimpan<select id="addr-select"></select></label></div>
   <div class="bk-fields"><label>Provinsi<select name="provinsi" id="addr-prov" autocomplete="address-level1" required>{prov_opts}</select></label>
   <label>Kota / Kabupaten<select name="kota" id="addr-kota" autocomplete="address-level2" required disabled><option value="">Pilih provinsi dulu</option></select></label>
   <label>Kecamatan<select name="kecamatan" id="addr-kec" autocomplete="address-level3" required disabled><option value="">Pilih kabupaten dulu</option></select></label>
   <label>Kode pos<select name="kode_pos" id="addr-kp" autocomplete="postal-code" required disabled><option value="">Pilih kecamatan dulu</option></select></label>
   <label class="bk-full">Alamat lengkap<textarea name="alamat" autocomplete="street-address" rows="3" required maxlength="300" placeholder="Nama jalan, nomor rumah, RT/RW, nama desa/kelurahan, patokan"></textarea></label>
   <label class="bk-full">Catatan (opsional)<input name="catatan" maxlength="200" placeholder="Mis. titip ke satpam, kirim pagi hari"></label></div>
   <p class="bk-muted" style="font-size:12px;margin-top:8px">Wilayah dipilih dari daftar resmi agar ongkir dan alamat pengiriman tidak salah. Detail jalan, nomor rumah, dan desa/kelurahan ditulis di kolom alamat lengkap.</p>
  <label class="bk-check" id="save-addr-wrap" hidden><input type="checkbox" name="save_address" checked> Simpan alamat ini ke akun saya</label></fieldset>
 <fieldset id="create-acc"><legend class="bk-h3">3. Buat akun (opsional)</legend>
  <label class="bk-check"><input type="checkbox" name="create_account" id="create-account"> Buat akun agar checkout berikutnya lebih cepat</label>
  <div id="create-acc-fields" hidden><label>Kata sandi (min. 8 karakter)<input name="password" type="password" autocomplete="new-password" minlength="8"></label>
  <label class="bk-check"><input type="checkbox" name="remember" checked> Ingat saya di perangkat ini</label></div></fieldset>
 <fieldset><legend class="bk-h3">Pengiriman</legend><p class="bk-muted" style="font-size:13px" id="rate-mode"></p><div id="rates" class="bk-rates"><p class="bk-muted">Pilih provinsi, kabupaten/kota, kecamatan, dan kode pos untuk melihat ongkir.</p></div></fieldset>
</div>
<aside class="bk-panel bk-summary"><h2 class="bk-h3">Pesanan Anda</h2><div id="co-items"></div>
 <dl class="bk-sum"><dt>Subtotal</dt><dd id="co-subtotal">Rp 0</dd><dt>Ongkos kirim</dt><dd id="co-ship">—</dd><dt class="bk-total">Total</dt><dd class="bk-total" id="co-total">Rp 0</dd></dl>
 <p class="bk-error" id="co-error" role="alert" hidden></p>
 <div class="wp-block-button bk-block"><button class="wp-block-button__link" type="submit" id="co-submit">Buat pesanan &amp; bayar</button></div>
 <p class="bk-muted" style="font-size:12px;margin-top:12px">Total dihitung ulang di server dari Pricelist 2027.</p>
 <div class="bk-wa-order"><div class="bk-or"><span>atau</span></div>
  <div class="wp-block-button is-style-outline bk-block"><button class="wp-block-button__link bk-btn-wa" type="button" id="co-wa">{I["wa"]} Pesan via WhatsApp</button></div>
  <p class="bk-muted" style="font-size:12px;margin-top:10px">Kirim data pembeli, alamat &amp; produk ke admin. Ongkir &amp; pengiriman (termasuk diantar langsung oleh Elementia) disepakati lewat chat — tanpa bayar online.</p></div>
 <p style="font-size:14px"><a href="{WA_PL}" target="_blank" rel="noopener">{I["wa"]} Butuh bantuan? Chat WhatsApp</a></p></aside>
</form>''', "Checkout")

shop_page("masuk.html", "Masuk / Daftar", "Masuk atau daftar", "Simpan alamat dan lihat riwayat pesanan Anda.", f'''
<div class="bk-auth">
<form id="login-form" class="bk-panel" method="post" action="/api/login" novalidate>
 <h2 class="bk-h3">Masuk</h2>
 <label>Email<input name="email" type="email" autocomplete="username" required id="login-email"></label>
 <label>Kata sandi<input name="password" type="password" autocomplete="current-password" required id="login-password"></label>
 <label class="bk-check"><input type="checkbox" name="remember" value="1" checked> Ingat saya (30 hari)</label>
 <p class="bk-error" role="alert" hidden></p>
 <div class="wp-block-button bk-block"><button class="wp-block-button__link" type="submit">Masuk</button></div>
</form>
<form id="register-form" class="bk-panel" method="post" action="/api/register" novalidate>
 <h2 class="bk-h3">Daftar akun baru</h2>
 <label>Nama lengkap<input name="name" autocomplete="name" required maxlength="100"></label>
 <label>Email<input name="email" type="email" autocomplete="username" required maxlength="120"></label>
 <label>No. HP / WhatsApp<input name="phone" type="tel" autocomplete="tel" inputmode="tel" required></label>
 <label>Kata sandi (min. 8 karakter)<input name="password" type="password" autocomplete="new-password" minlength="8" required></label>
 <label class="bk-check"><input type="checkbox" name="remember" value="1" checked> Ingat saya (30 hari)</label>
 <p class="bk-error" role="alert" hidden></p>
 <div class="wp-block-button is-style-outline bk-block"><button class="wp-block-button__link" type="submit">Daftar</button></div>
</form></div>''', "Masuk")

shop_page("akun.html", "Akun saya", "Akun saya", "", f'''
<div id="acc-root" aria-live="polite"><p class="bk-muted">Memuat…</p></div>''', "Akun saya")

shop_page("bayar.html", "Pembayaran", "Pembayaran", "", TEST + '''
<div id="pay-root" aria-live="polite"><p class="bk-muted">Memuat pesanan…</p></div>''', "Pembayaran")

shop_page("admin.html", "Admin pesanan", "Admin pesanan", "", '''
<div id="admin-root"><form id="admin-login" class="bk-panel" style="max-width:420px" method="post" action="/api/admin/login">
 <input type="text" name="username" value="admin" autocomplete="username" hidden>
 <label>Kata sandi admin<input type="password" name="password" autocomplete="current-password" required></label>
 <p class="bk-error" role="alert" hidden></p>
 <div class="wp-block-button bk-block"><button class="wp-block-button__link" type="submit">Masuk admin</button></div></form></div>''', "Admin")
