# Halaman v3: PDP per komoditas, Tumpangsari, Bisnis.
# Dieksekusi dari build.py (exec) sehingga memakai helper & data yang sama.

def spec_rows(k):
    rows = [("Nama latin", k["latin"]), ("Asal", k["asal"]),
            ("Bentuk", ", ".join(k["bentuk"])), ("Kemasan", ", ".join(k["kemasan"])),
            ("Status", "Siap dibeli" if k["status"] == "tersedia" else "Segera hadir — harga menyusul")]
    return "".join(f'<tr><th scope="row">{E(a)}</th><td>{E(b)}</td></tr>' for a, b in rows)


def galeri(k, badge):
    g = k.get("galeri") or []
    if not g:
        return '<div class="bk-pdp__media" style="--aksen:%s">%s%s</div>' % (k["aksen"], kom_media(k, 900), badge)
    n = len(g)
    slides, thumbs = [], []
    for idx, it in enumerate(g):
        on = " is-on" if idx == 0 else ""
        if it.get("img"):
            _f = it["img"] if "." in it["img"] else it["img"] + ".webp"
            media = ('<img src="assets/img/produk/%s" alt="%s" width="900" height="900" loading="%s">'
                     % (_f, E(it.get("cap") or k["nama"]), "eager" if idx == 0 else "lazy"))
        else:
            media = ('<div class="bk-ph" style="--aksen:%s"><span>%s</span><small>foto menyusul</small></div>'
                     % (k["aksen"], E(k["nama"].split()[0])))
        hidden = "" if idx == 0 else ' aria-hidden="true"'
        slides.append('<div class="bk-gal__slide%s" role="group" aria-roledescription="slide" aria-label="Foto %d dari %d"%s>%s<p class="bk-gal__cap">%s</p></div>'
                      % (on, idx + 1, n, hidden, media, E(it.get("cap") or "")))
        thumb_media = media if it.get("img") else '<span class="bk-gal__ph"></span>'
        thumbs.append('<button type="button" class="bk-gal__thumb%s" data-gal-to="%d" role="tab" aria-selected="%s" aria-label="Foto %d">%s</button>'
                      % (on, idx, "true" if idx == 0 else "false", idx + 1, thumb_media))
    return ('<div class="bk-gal" data-gal tabindex="0" aria-label="Galeri foto %s" style="--aksen:%s">'
            '<div class="bk-gal__stage">%s'
            '<button type="button" class="bk-gal__nav is-prev" data-gal-prev aria-label="Foto sebelumnya">&#8249;</button>'
            '<button type="button" class="bk-gal__nav is-next" data-gal-next aria-label="Foto berikutnya">&#8250;</button>'
            '<span class="bk-gal__count" data-gal-count aria-live="polite">1 / %d</span></div>'
            '<div class="bk-gal__thumbs" role="tablist" aria-label="Pilih foto">%s</div></div>') % (
        E(k["nama"]), k["aksen"], badge + "".join(slides), n, "".join(thumbs))

def pdp(k):
    tersedia = k["status"] == "tersedia"
    slugs = "/".join(k["slug"].split("-"))
    crumb = '<a href="produk.html">Produk</a>'
    if tersedia:
        _cards = []
        for _v in k["varian"]:
            for _km in hvar(k["nama"], _v["nama"]):
                _sc = sku_of(k["nama"], _v["nama"], _km["jenis"], _km["gram"])
                _lab = f'{k["nama"]} {_v["nama"]} {_km["jenis"]} {gram_txt(_km["gram"])}'
                _src = img_of(k["nama"], _v["nama"], _km)
                _cards.append(
                    f'<button type="button" class="bk-pack" data-add-sku="{_sc}" aria-label="Tambah {E(_lab)} ke keranjang">'
                    f'<span class="bk-pack__img"><img src="{_src}" alt="{E(_lab)}" width="72" height="72" loading="lazy"></span>'
                    f'<span class="bk-pack__body"><span class="bk-pack__kem">{E(_v["nama"])} &middot; {E(_km["jenis"])} {gram_txt(_km["gram"])}</span>'
                    f'<strong>{rp(_km["harga"])}</strong></span></button>')
        _tbl = ('<div class="bk-buy"><h3 class="bk-buy__title">Kemasan &amp; harga</h3>'
                '<div class="bk-buy__grid">' + "".join(_cards) + '</div>'
                '<p class="bk-note">Klik kartu untuk menambah ke keranjang.</p></div>')
    else:
        _tbl = ""
    buy = _tbl + (f'<div class="wp-block-buttons"><div class="wp-block-button"><a class="wp-block-button__link" href="harga.html">Daftar harga lengkap</a></div>'
           f'<div class="wp-block-button is-style-outline"><a class="wp-block-button__link" href="{WA_HALO}" target="_blank" rel="noopener">{I["wa"]} Tanya stok</a></div></div>') if tersedia else (
           f'<div class="wp-block-buttons"><div class="wp-block-button"><a class="wp-block-button__link" href="bisnis.html#permintaan">Minta penawaran &amp; sampel</a></div>'
           f'<div class="wp-block-button is-style-outline"><a class="wp-block-button__link" href="{wa("Halo ELEMENTIA, saya ingin diberi tahu saat " + k["nama"] + " tersedia.")}" target="_blank" rel="noopener">{I["wa"]} Kabari saya</a></div></div>')
    pakai = "".join(f"<li>{E(x)}</li>" for x in k["pakai"])
    pas = " · ".join(f'<a href="resep.html">{E(x)}</a>' for x in k["pasangan"])
    desk = "".join(f"<p>{E(x)}</p>" for x in k["deskripsi"])
    badge = "" if tersedia else '<span class="bk-badge">Segera hadir</span>'
    price = f'<p class="bk-pdp__price">Mulai <strong>{rp(k["harga_mulai"])}</strong></p>' if k.get("harga_mulai") else '<p class="bk-pdp__price">Harga <strong>menyusul</strong></p>'

    pg = head(f'{k["nama"]} {k["nama_en"]} — ELEMENTIA',
              f'{k["nama"]} ({k["simbol"]}) — {k["nama_en"]}. {k["ringkas"]} 100% murni, tanpa pengisi, pewarna, atau MSG.',
              f'produk-{k["slug"]}.html', img=(f'assets/img/produk/{k["img"]}.webp' if k.get("img") else F + "sulur-lada.webp"),
              extra='<script src="assets/js/galeri.js?v=20261108d" defer></script>')
    pg += page_hero(k["nama"], k["ringkas"], F + "hero-elemen.webp", k["nama"], k["nama"])
    pg += f'''<div class="wp-block-group alignfull bk-section"><div class="bk-wrap">
 <nav class="bk-crumb">{crumb} / <span>{E(k["nama"])}</span></nav>
 <p class="bk-elemen"><span class="bk-elemen__no">{k["nomor"]:02d}</span> <strong>{k["simbol"]}</strong> · {E(k["nama_en"])} · <em>100% murni</em></p>
 <div class="bk-pdp">
  <div class="bk-pdp__gal reveal">{galeri(k, badge)}</div>
  <div class="bk-pdp__head reveal"><span class="bk-eyebrow">{E(k["asal"])}</span><h2 class="bk-h2">{E(k["nama"])}</h2>
   {price}
   <ul class="bk-kom__var bk-kom__var--pdp">{"".join(f"<li>{E(v['nama'])}</li>" for v in k["varian"])}</ul></div>
  <div class="bk-pdp__buy reveal">{buy}</div>
  <div class="bk-spec-block bk-pdp__spec reveal"><div class="bk-table-wrap"><table class="bk-table bk-spec"><caption>Spesifikasi</caption><tbody>{spec_rows(k)}</tbody></table></div></div>
  <div class="bk-pdp__desc reveal">{desk}
   <div class="bk-taste"><span>Citarasa</span><p>{E(k["citarasa"])}</p></div>
   <h3 class="bk-h3">Cocok untuk</h3><ul class="bk-checks">{pakai}</ul>
   <p class="bk-note">Pasangan resep: {pas}</p></div>
  <div class="bk-panel bk-pdp__panel reveal"><h3 class="bk-h3">Cara menyimpan</h3><ul class="bk-checks"><li>Simpan di wadah kedap udara, jauh dari sinar matahari langsung.</li><li>Pakai sendok kering &mdash; uap air mempercepat jamur.</li><li>Kemasan 25 kg sebaiknya dipindah ke wadah tertutup setelah dibuka.</li></ul><p class="bk-note">Berat pada tabel adalah berat bersih. Ongkir dihitung terpisah di checkout.</p></div>
 </div></div></div>'''
    return pg + cta_band() + foot()

for _k in KOM:
    write(f'produk-{_k["slug"]}.html', pdp(_k))

# ================= TUMPANGSARI =================
prinsip = [
 ("Tumbuh bersama pohon", "leaf", "Rempah ditanam di antara tanaman keras, bukan di ladang terbuka. Naungan pohon menjaga kelembapan tanah dan menekan gulma tanpa herbisida."),
 ("Tanah yang tidak dihabiskan", "shield", "Akar pohon menahan lapisan atas tanah. Petani bisa memanen rempah bertahun-tahun di lahan yang sama, bukan membuka lahan baru setiap musim."),
 ("Pendapatan yang tidak tunggal", "store", "Satu petak menghasilkan rempah, buah, dan kayu. Risiko gagal panen satu komoditas tidak langsung menghapus seluruh pendapatan."),
]
ag = head("Tumpangsari — Rempah yang Tumbuh Bersama Komunitas | ELEMENTIA",
          "ELEMENTIA mengambil rempah dari kebun tumpangsari: ditanam bersama pohon, dipanen petani mitra, dikeringkan tanpa pengawet, lalu disortir sebelum dikemas.",
          "tumpangsari.html", img=F + "kebun-jalan.webp")
ag += page_hero("Tumpangsari", "Rempah yang tumbuh bersama komunitas, di antara pohon.", F + "kebun-jalan.webp", "Tumpangsari", "Kebun rempah di antara pohon")
ag += f'''<div class="wp-block-group alignfull bk-section"><div class="bk-wrap">
 <div class="bk-head has-text-align-center reveal"><span class="bk-eyebrow">Cara kami menanam</span><h2 class="bk-h2">Empat prinsip, bukan slogan</h2>
  <p class="bk-lead">Tumpangsari bukan label pemasaran. Ia mengubah cara kebun dikelola — dan itu terasa pada rasa, harga, serta daya tahan pasokan.</p></div>
 <div class="bk-grid-2">{"".join(f'<article class="bk-prin reveal"><div class="bk-feature__icon">{I[ic]}</div><h3>{E(t)}</h3><p>{E(d)}</p></article>' for t, ic, d in prinsip)}</div>
</div></div>

<div class="wp-block-group alignfull bk-section has-palette-color-6-background-color"><div class="bk-wrap bk-split">
 <div class="reveal"><span class="bk-eyebrow">Dari kebun ke kemasan</span><h2 class="bk-h2">Empat langkah yang bisa Anda periksa</h2>
  <ol class="bk-steps"><li><strong>Panen</strong> oleh petani mitra, dicatat tanggal dan lokasi kebunnya.</li>
  <li><strong>Pengeringan</strong> suhu rendah agar minyak atsiri tidak menguap.</li>
  <li><strong>Sortasi &amp; uji</strong> kadar air dan cemaran mikroorganisme secara berkala.</li>
  <li><strong>Pengemasan</strong> dengan kemasan yang menjaga aroma dan kadar air.</li></ol></div>
 <div class="bk-panel reveal"><h3>Kenapa ini penting untuk dapur Anda</h3>
  <p style="font-size:15px">Rempah yang dikeringkan terlalu panas terlihat sama di foto, tapi aromanya hilang. Rempah yang tidak lolos sortasi bisa berjamur di kemasan.</p>
  <p style="font-size:15px">Karena itu kami menulis spesifikasi, bukan hanya menjual foto. Untuk dapur bisnis, dokumen ini yang biasanya diminta tim QC sebelum supplier disetujui.</p>
  <a class="bk-more" href="bisnis.html">Lihat kebutuhan bisnis →</a></div>
</div></div>
''' + cta_band() + foot()
write("tumpangsari.html", ag)

# ================= BISNIS (HoReCa) =================
segmen = [("Hotel & resort", "Standar rasa yang sama di setiap cabang, dokumen lengkap untuk audit dapur."),
          ("Restoran", "Pasokan rutin dengan spesifikasi tetap agar resep tidak bergeser."),
          ("Kafe & bakery", "Bubuk halus dan kemasan kecil untuk uji menu sebelum volume penuh."),
          ("Katering & produksi", "Kemasan 25 kg, harga kontrak, dan jadwal kirim yang bisa disesuaikan."),
          ("Industri & produksi", "Bumbu untuk lini produksi: bumbu instan, saus, snack, dan makanan olahan.")]
dok = [("shield", "HALAL &amp; HACCP", "Sertifikat HALAL dan proses produksi tersertifikasi HACCP."),
       ("leaf", "Spesifikasi tertulis", "Bentuk, kadar air, dan kemasan tertulis sebelum PO."),
       ("factory", "Kemasan produksi", "1 kg untuk uji menu, 25 kg untuk produksi harian."),
       ("clock", "Jadwal kirim", "Pengiriman berkala sesuai siklus menu, bukan menunggu stok habis.")]

opts_kom = "".join(f'<label class="bk-check"><input type="checkbox" name="komoditas" value="{E(k["nama"])}"> {E(k["nama"])}</label>' for k in KOM)

bz = head("Untuk Hotel, Resto, Kafe & Industri — Pasokan Rempah | ELEMENTIA",
          "Pasokan rempah tumpangsari untuk hotel, restoran, kafe, katering, dan industri pengolahan: sampel, spesifikasi tertulis, sertifikat HALAL & HACCP, kemasan 1 kg hingga 25 kg, PO dan faktur.",
          "bisnis.html", img=F + "gudang.webp", extra='<script src="assets/js/bisnis.js?v=20261106a" defer></script>')
bz += page_hero("Untuk dapur profesional & industri", "Spesifikasi tertulis, sampel sebelum kontrak, dan pasokan yang tidak bergantung musim pasar.", F + "gudang.webp", "Bisnis", "Gudang dengan karung rempah di atas palet")
bz += f'''<div class="wp-block-group alignfull bk-section"><div class="bk-wrap">
 <div class="bk-head has-text-align-center reveal"><span class="bk-eyebrow">Yang kami sediakan</span><h2 class="bk-h2">Bukan sekadar kirim karung</h2>
  <p class="bk-lead">Dapur profesional membeli kepastian, bukan kejutan. Empat hal ini yang kami siapkan sebelum pesanan pertama.</p></div>
 <div class="bk-grid-2">{"".join(f'<article class="bk-prin reveal"><div class="bk-feature__icon">{I[ic]}</div><h3>{t}</h3><p>{d}</p></article>' for ic, t, d in dok)}</div>
</div></div>

<div class="wp-block-group alignfull bk-section has-palette-color-6-background-color"><div class="bk-wrap">
 <div class="bk-head reveal" id="industri"><span class="bk-eyebrow">Segmen</span><h2 class="bk-h2">Kebutuhan tiap dapur berbeda</h2></div>
 <div class="bk-seg-grid">{"".join(f'<article class="bk-seg reveal"><h3>{E(t)}</h3><p>{E(d)}</p></article>' for t, d in segmen)}</div>
</div></div>

<div class="wp-block-group alignfull bk-section" id="permintaan"><div class="bk-wrap bk-split bk-split--form">
 <div class="reveal"><span class="bk-eyebrow">Permintaan penawaran</span><h2 class="bk-h2">Ceritakan kebutuhan dapur Anda</h2>
  <p>Isi singkat — kami balas dengan rentang harga, spesifikasi, ketersediaan, dan opsi sampel. Tidak ada biaya untuk mengajukan.</p>
  <ul class="bk-checks"><li>Balasan di hari kerja, lewat WhatsApp atau email</li><li>Sampel bisa dikirim untuk uji menu</li><li>Harga kontrak untuk pesanan rutin</li></ul>
  <p class="bk-note">Butuh cepat? <a href="{wa("Halo ELEMENTIA, saya dari (nama bisnis). Kami butuh pasokan rempah untuk dapur kami.")}" target="_blank" rel="noopener">Chat langsung via WhatsApp</a> · {WA_TXT}</p></div>
 <form class="bk-form reveal" id="quote-form" novalidate>
  <div class="bk-form__grid">
   <label>Nama<abbr title="wajib">*</abbr><input name="name" required autocomplete="name"></label>
   <label>Bisnis / perusahaan<abbr title="wajib">*</abbr><input name="company" required autocomplete="organization"></label>
   <label>Jabatan<input name="role" autocomplete="organization-title" placeholder="mis. Head Chef, Purchasing"></label>
   <label>WhatsApp<abbr title="wajib">*</abbr><input name="phone" required inputmode="tel" autocomplete="tel" placeholder="08xx"></label>
   <label>Email<input name="email" type="email" autocomplete="email"></label>
   <label>Kota<input name="city" autocomplete="address-level2"></label>
  </div>
  <fieldset class="bk-form__set"><legend>Komoditas yang dibutuhkan</legend><div class="bk-checks-row">{opts_kom}</div></fieldset>
  <label>Perkiraan volume per bulan
   <select name="volume"><option value="">Pilih…</option><option>Di bawah 50 kg</option><option>50 – 200 kg</option><option>200 – 1.000 kg</option><option>Di atas 1.000 kg</option><option>Belum tahu, ingin sampel dulu</option></select></label>
  <label>Catatan<textarea name="note" rows="3" placeholder="Spesifikasi yang diminta, jadwal kirim, atau pertanyaan lain"></textarea></label>
  <button class="wp-block-button__link bk-submit" type="submit" id="quote-submit">Kirim permintaan</button>
  <p class="bk-form__msg" id="quote-msg" role="status" aria-live="polite"></p>
  <p class="bk-form__fine">Data hanya dipakai untuk menindaklanjuti permintaan ini.</p>
 </form>
</div></div>
''' + foot()
write("bisnis.html", bz)
