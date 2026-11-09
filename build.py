# Generator halaman statis ELEMENTIA v2 — markup mengikuti struktur tema Blocksy
# (header type-1, offcanvas .ct-panel, footer type-1, entry-content blok Gutenberg).
# Jalankan: python3 build.py
import json, html, os, urllib.parse as U
E = html.escape
ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = "https://elementia.id"
WA = "6280000000000"
def wa(msg): return f"https://wa.me/{WA}?text=" + U.quote(msg)
WA_HALO = wa("Halo ELEMENTIA, saya ingin bertanya tentang produk lada.")
WA_GROSIR = wa("Halo ELEMENTIA, saya ingin memesan lada kemasan 25 kg (grosir). Mohon info stok dan pengiriman.")
WA_PL = wa("Halo ELEMENTIA, saya ingin memesan sesuai Pricelist 2027. Produk yang saya inginkan: ")
TOKPED = "https://www.tokopedia.com/bumbu-pusaka-nusantara"
SHOPEE = "https://shopee.co.id/elementia_100"
IG = "https://www.instagram.com/elementiaofficial/"
FB = "https://www.facebook.com/people/Bumbu-Pusaka-Nusantara/100082871965412/"
EMAIL = "halo@elementia.id"
TEL = "+622287319273"; TEL_TXT = "000-0000-0000"; WA_TXT = "0800-0000-0000"
HOURS = "Senin – Sabtu : 9 pagi – 4 sore"
ADDR = ["Kawasan Industri De Prima Terra Blok A1 No. 1A,", "Kelurahan Tegalluar, Kecamatan Bojongsoang,", "Kabupaten Bandung – 40288", "Jawa Barat – Indonesia"]
ADDR_Q = "Kawasan Industri De Prima Terra Blok A1 No. 1A, Kel. Tegalluar, Kec. Bojongsoang, Kab. Bandung 40288"
MAPS = "https://maps.app.goo.gl/iXgv6vH6ZpSrdFup8"
MAPS_EMBED = "https://www.google.com/maps?q=" + U.quote(ADDR_Q) + "&output=embed"
F = "assets/img/foto/"
def rp(n): return "Rp " + f"{n:,}".replace(",", ".")

I = {
 "cart": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg>',
 "user": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
 "wa": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>',
 "leaf": '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 38c16 0 28-12 28-30C20 8 10 18 10 30v8zM10 38c6-8 12-12 20-16"/></svg>',
 "fire": '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M24 44c8 0 14-6 14-14 0-10-10-14-10-24-6 4-10 10-10 16-2-2-4-4-4-8-4 4-4 10-4 16 0 8 6 14 14 14z"/></svg>',
 "shield": '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M24 6 8 12v12c0 10 7 16 16 18 9-2 16-8 16-18V12L24 6z"/><path d="m17 24 5 5 9-10"/></svg>',
 "home": '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 22 24 7l18 15"/><path d="M11 18v22h26V18"/><path d="M20 40V28h8v12"/></svg>',
 "chef": '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 26a8 8 0 1 1 3-15 9 9 0 0 1 14 0 8 8 0 1 1 3 15v12H14V26z"/><path d="M14 32h20"/></svg>',
 "store": '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 18 9 8h30l3 10"/><path d="M6 18c0 3 2.5 5 5.5 5S17 21 17 18c0 3 2.5 5 5.5 5S28 21 28 18c0 3 2.5 5 5.5 5S42 21 42 18"/><path d="M9 23v17h30V23"/><path d="M20 40V30h8v10"/></svg>',
 "factory": '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 41V20l11 7v-7l11 7v-7l11 7V8h5v33z"/><path d="M12 34h4M22 34h4M32 34h4"/></svg>',
 "pin": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
 "phone": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
 "mail": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14"/><path d="m3 7 9 6 9-6"/></svg>',
 "clock": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 "ig": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
 "fb": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v7h4v-7h3l.5-4h-3.5V9c0-.6.4-1 1-1z"/></svg>',
 # ikon trigger & close mengikuti ikon bawaan Blocksy
 "trigger": '<svg class="ct-icon" width="18" height="14" viewBox="0 0 18 14" data-type="type-1" aria-hidden="true"><rect y="0.00" width="18" height="1.7" rx="1"/><rect y="6.15" width="18" height="1.7" rx="1"/><rect y="12.3" width="18" height="1.7" rx="1"/></svg>',
 "close": '<svg class="ct-icon" width="12" height="12" viewBox="0 0 15 15" aria-hidden="true"><path d="M1 15a1 1 0 01-.71-.29 1 1 0 010-1.41l5.8-5.8-5.8-5.8A1 1 0 011.7.29l5.8 5.8 5.8-5.8a1 1 0 011.41 1.41l-5.8 5.8 5.8 5.8a1 1 0 01-1.41 1.41l-5.8-5.8-5.8 5.8A1 1 0 011 15z"/></svg>',
 "top": '<svg class="ct-icon" width="15" height="15" viewBox="0 0 20 20" fill="#fff" aria-hidden="true"><path d="M10,0L9.4,0.6L0.8,9.1l1.2,1.2l7.1-7.1V20h1.7V3.3l7.1,7.1l1.2-1.2l-8.5-8.5L10,0z"/></svg>',
}

NAV = [("index.html","Beranda"),("produk.html","Produk"),("tumpangsari.html","Tumpangsari"),("bisnis.html","Bisnis"),("resep.html","Resep"),("tentang.html","Tentang"),("kontak.html","Kontak")]

def menu_items(path):
    return "".join(f'<li class="menu-item{" current-menu-item" if h==path else ""}"><a href="{h}" class="ct-menu-link"{" aria-current=\"page\"" if h==path else ""}>{t}</a></li>' for h,t in NAV)

def head(title, desc, path, img=F+"kebun-aerial-1200.webp", extra="", preload=None, noindex=False):
    url = SITE + "/" + ("" if path=="index.html" else path)
    pre = f'<link rel="preload" as="image" href="{preload}" fetchpriority="high">' if preload else ""
    logo = '<a href="index.html" class="site-logo-container" rel="home"><img width="360" height="226" src="assets/img/logo.webp" class="default-logo" alt="ELEMENTIA — Pure & Essential"></a>'
    cta = f'<div class="ct-header-cta" data-id="button"><a href="{WA_PL}" class="ct-button" data-size="medium" target="_blank" rel="noopener">{I["wa"]} Pesan via WhatsApp</a></div>'
    shop = f'<div class="bk-shopnav"><a href="akun.html" class="bk-icon-link" data-account-link aria-label="Akun saya">{I["user"]}<span class="bk-icon-label" data-account-label>Masuk</span></a><a href="keranjang.html" class="bk-icon-link" aria-label="Keranjang belanja">{I["cart"]}<span class="bk-cart-count" data-cart-count hidden>0</span></a></div>'
    return f'''<!doctype html>
<html lang="id-ID">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">{"<meta name=\"robots\" content=\"noindex\">" if noindex else ""}
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#B87333">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ELEMENTIA — Rempah Tumpangsari">
<meta property="og:locale" content="id_ID">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/{img}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/img/logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&amp;family=Staatliches&amp;display=swap">
<link rel="stylesheet" id="blocksy-dynamic-global-css" href="assets/css/blocksy/global.css?v=20261108d">
<link rel="stylesheet" id="ct-main-styles-css" href="assets/css/blocksy/main.min.css?v=20261108d">
<link rel="stylesheet" id="ct-back-to-top-styles-css" href="assets/css/blocksy/back-to-top.min.css">
<link rel="stylesheet" id="elementia-css" href="assets/css/elementia.css?v=20261108d">
{pre}
{extra}
</head>
<body class="page wp-theme-blocksy" data-link="type-2" data-prefix="single_page" data-header="type-1" data-footer="type-1">
<a class="skip-link screen-reader-text" href="#main">Lewati ke konten</a>
<div class="ct-drawer-canvas" data-location="start"><div id="offcanvas" class="ct-panel ct-header" data-behaviour="modal" role="dialog" aria-label="Menu navigasi" inert="">
  <div class="ct-panel-actions"><button class="ct-toggle-close" data-type="type-1" aria-label="Tutup menu">{I["close"]}</button></div>
  <div class="ct-panel-content" data-device="mobile"><div class="ct-panel-content-inner">
    <a href="index.html" class="site-logo-container" data-id="offcanvas-logo" rel="home"><img width="360" height="226" src="assets/img/logo.webp" class="default-logo" alt="ELEMENTIA"></a>
    <nav class="mobile-menu menu-container" data-id="mobile-menu" data-interaction="click" data-toggle-type="type-1" aria-label="Menu utama"><ul>{menu_items(path)}</ul></nav>
    {cta}
  </div></div>
</div></div>
<div id="main-container">
<header id="header" class="ct-header" data-id="type-1">
 <div data-device="desktop" data-transparent=""><div data-row="middle" data-column-set="3" data-transparent-row="yes"><div class="ct-container">
  <div data-column="start" data-placements="1"><div data-items="primary"><div class="site-branding" data-id="logo">{logo}</div></div></div>
  <div data-column="middle"><div data-items=""><nav id="header-menu-1" class="header-menu-1 menu-container" data-id="menu" data-interaction="hover" data-menu="type-1" data-dropdown="type-1:simple" data-responsive="no" aria-label="Menu utama"><ul id="menu-main-menu" class="menu">{menu_items(path)}</ul></nav></div></div>
  <div data-column="end" data-placements="1"><div data-items="primary">{shop}{cta}</div></div>
 </div></div></div>
 <div data-device="mobile" data-transparent=""><div data-row="middle" data-column-set="2" data-transparent-row="yes"><div class="ct-container">
  <div data-column="start" data-placements="1"><div data-items="primary"><div class="site-branding" data-id="logo">{logo}</div></div></div>
  <div data-column="end" data-placements="1"><div data-items="primary">{shop}<button class="ct-header-trigger ct-toggle" data-toggle-panel="#offcanvas" aria-controls="offcanvas" aria-expanded="false" data-design="simple" data-label="right" aria-label="Buka menu" data-id="trigger"><span class="ct-label ct-hidden-sm ct-hidden-md ct-hidden-lg" aria-hidden="true">Menu</span>{I["trigger"]}</button></div></div>
 </div></div></div>
</header>
<main id="main" class="site-main">
<div class="ct-container-full" data-content="normal">
<article id="post-2" class="post-2 page type-page">
<div class="entry-content is-layout-constrained">
'''

def foot():
    return f'''</div></article></div>
</main>
<footer id="footer" class="ct-footer" data-id="type-1">
 <div data-row="middle"><div class="ct-container">
  <div data-column="widget-area-1"><div class="ct-widget is-layout-flow">
   <img class="bk-foot-logo" src="assets/img/logo-light.webp" alt="ELEMENTIA" width="360" height="226" loading="lazy">
   <p>ELEMENTIA — Rempah Tumpangsari. Lada putih Bangka Belitung dan lada hitam Lampung, 100% murni. Produk dari <a href="https://elementia.id/" target="_blank" rel="noopener">PT ORIGIN EKA MANUFAKTUR</a>.</p>
   <div class="bk-social"><a href="{IG}" target="_blank" rel="noopener" aria-label="Instagram ELEMENTIA">{I["ig"]}</a><a href="{FB}" target="_blank" rel="noopener" aria-label="Facebook ELEMENTIA">{I["fb"]}</a><a href="{WA_HALO}" target="_blank" rel="noopener" aria-label="WhatsApp ELEMENTIA">{I["wa"]}</a></div>
  </div></div>
  <div data-column="widget-area-2"><div class="ct-widget is-layout-flow"><h4>Menu</h4><ul>{"".join(f'<li><a href="{h}">{t}</a></li>' for h,t in NAV)}</ul></div></div>
  <div data-column="widget-area-3"><div class="ct-widget is-layout-flow"><h4>Belanja</h4><ul>
   <li><a href="harga.html">Pricelist 2027</a></li>
   <li><a href="{TOKPED}" target="_blank" rel="noopener">Tokopedia | Elementia Official</a></li>
   <li><a href="{SHOPEE}" target="_blank" rel="noopener">Shopee | Elementia Official</a></li>
   <li><a href="{WA_GROSIR}" target="_blank" rel="noopener">Grosir 25 kg via WhatsApp</a></li></ul></div></div>
  <div data-column="widget-area-4"><div class="ct-widget is-layout-flow"><h4>Kantor Pusat</h4>
   <p>PT ORIGIN EKA MANUFAKTUR<br>{"<br>".join(ADDR)}</p>
   <p><a href="tel:{TEL}">{TEL_TXT}</a><br><a href="{WA_HALO}" target="_blank" rel="noopener">{WA_TXT} (WhatsApp)</a><br><a href="mailto:{EMAIL}">{EMAIL}</a><br>{HOURS}</p></div></div>
 </div></div>
 <div data-row="bottom"><div class="ct-container"><div data-column="copyright"><div class="ct-footer-copyright" data-id="copyright">© <span id="year">2026</span> ELEMENTIA | Rempah Tumpangsari. All Rights Reserved.</div></div></div></div>
</footer>
</div>
<a href="#main" class="ct-back-to-top" data-shape="square" data-alignment="right" title="Kembali ke atas" aria-label="Kembali ke atas">{I["top"]}</a>
<div class="bk-fab">
<a class="bk-fab__btn" href="keranjang.html" aria-label="Buka keranjang" title="Keranjang"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3.5h2.2l2.3 11.2h11.3l2-8.2H6.2"/></svg><span class="bk-fab__badge" data-cart-count hidden></span></a>
<a class="bk-wa-float" href="{WA_HALO}" target="_blank" rel="noopener" aria-label="Chat WhatsApp ELEMENTIA">{I["wa"]}</a>
</div>
<script src="assets/js/main.js?v=20261108d" defer></script>
<script src="assets/js/shop.js?v=20261108d" defer></script>
</body>
</html>
'''

def page_hero(title, sub, img, crumb, alt):
    return f'''<div class="wp-block-cover alignfull bk-page-hero"><img class="wp-block-cover__image-background" src="{img}" alt="{E(alt)}" width="1200" height="800" fetchpriority="high"><span class="wp-block-cover__background" aria-hidden="true"></span>
<div class="wp-block-cover__inner-container"><nav class="ct-breadcrumbs" aria-label="Breadcrumb"><a href="index.html">Beranda</a> / <span>{crumb}</span></nav><h1>{title}</h1><p>{sub}</p></div></div>
'''

def cta_band(img=F+"gudang.webp"):
    return f'''<div class="wp-block-cover alignfull bk-cta"><img class="wp-block-cover__image-background" src="{img}" alt="" width="1200" height="900" loading="lazy"><span class="wp-block-cover__background" aria-hidden="true"></span>
<div class="wp-block-cover__inner-container reveal"><span class="bk-eyebrow">Grosir &amp; B2B</span>
<h2 class="bk-h2">Kemasan 25 kg untuk restoran, katering, reseller &amp; produksi</h2>
<p>Lada putih Bangka dan lada hitam Lampung, butir maupun bubuk. Harga grosir tercantum di <a href="harga.html" style="color:#fff;text-decoration:underline">Pricelist 2027</a> dan sudah termasuk PPN.</p>
<div class="wp-block-buttons is-content-justification-center"><div class="wp-block-button is-style-gold"><a class="wp-block-button__link" href="{WA_GROSIR}" target="_blank" rel="noopener">{I["wa"]} Pesan grosir via WhatsApp</a></div>
<div class="wp-block-button is-style-light"><a class="wp-block-button__link" href="harga.html">Lihat daftar harga</a></div></div>
<small>{WA_TXT} · {HOURS}</small></div></div>
'''

def write(name, s):
    open(os.path.join(ROOT,name),"w").write(s); print("ok", name)

# ---------- Data ----------
PL = json.load(open(os.path.join(ROOT,"data","pricelist-2027.json")))["produk"]
RES = json.load(open(os.path.join(ROOT,"data","resep.json")))
V3 = json.load(open(os.path.join(ROOT,"data","katalog-v3.json")))
KOM = V3["komoditas"]

# ---------- harga 2026 (sumber: Varian Produk.xlsx) ----------
import re as _re
H = json.load(open(os.path.join(ROOT, "data", "harga-2026.json")))["komoditas"]
HK = {k["nama"]: k for k in H}

def _slug(s):
    return _re.sub(r"[^a-z0-9]+", "-", str(s).lower()).strip("-")

def gram_txt(g):
    return f"{g} g" if g < 1000 else f"{g // 1000} kg"

def sku_of(kom, var, jenis, gram):
    return "%s-%s-%s-%dg" % (_slug(kom), _slug(var), _slug(jenis), gram)

IMGN = {}
for _k in KOM:
    for _v in _k["varian"]:
        _f = _v["img"] if "." in _v["img"] else _v["img"] + ".webp"
        IMGN[(_k["nama"], _v["nama"])] = "assets/img/produk/" + _f

def img_of(kom, var, km):
    return (km or {}).get("img") or IMGN.get((kom, var), "")

def foto_cell(kom, var, km, label):
    src = img_of(kom, var, km)
    return ('<button type="button" class="bk-thumb" data-zoom data-src="%s" data-cap="%s" '
            'aria-label="Perbesar foto %s"><img src="%s" alt="%s" width="52" height="52" loading="lazy"></button>'
            % (src, E(label), E(label), src, E(label)))

def hvar(kom, var):
    for v in HK.get(kom, {}).get("varian", []):
        if v["nama"] == var:
            return v["kemasan"]
    return []

def harga_mulai(kom):
    p = [km["harga"] for v in HK.get(kom, {}).get("varian", []) for km in v["kemasan"]]
    return min(p) if p else None

for _k in KOM:
    _k["status"] = "tersedia" if _k["nama"] in HK else "segera"
    _k["harga_mulai"] = harga_mulai(_k["nama"])
    if _k["nama"] in HK:
        _k["kemasan"] = [x[1] for x in sorted({(km["gram"], f'{km["jenis"]} {gram_txt(km["gram"])}')
                          for v in HK[_k["nama"]]["varian"] for km in v["kemasan"]})]

def vname(p,v): return f'{p["jenis"]} {v["bentuk"]} {p["kemasan"].replace("Kemasan ","")}'
def wa_order(p,v):
    return wa(f'Halo ELEMENTIA, saya ingin memesan {p["jenis"]} {v["bentuk"]} {p["kemasan"]} ({v["ukuran"]}) — harga {rp(v["harga"])} sesuai Pricelist 2027. Jumlah: ... Alamat kirim: ...')
def sku(p,v): return f'{p["id"]}:{v["bentuk"].lower()}'
def add_btn(p,v,label="Keranjang"):
    return f'<button type="button" class="wp-block-button__link bk-add" data-add-sku="{sku(p,v)}" aria-label="Tambah {E(p["jenis"])} {v["bentuk"]} {E(p["kemasan"])} ke keranjang">{I["cart"]} {label}</button>'
SEG = {"eceran":"Eceran","dapur usaha":"Dapur usaha","grosir":"Grosir 25 kg"}

def prod_card(p):
    vs = p["varian"]; lo = min(v["harga"] for v in vs)
    same = len({v["harga"] for v in vs})==1
    forms = " & ".join(v["bentuk"] for v in vs)
    imgs = vs if len(vs)>1 else vs[:1]
    tags = " ".join([p["jenis"].split()[1].lower(), p["segmen"].split()[0]] + [v["bentuk"].lower() for v in vs])
    rows = "".join(f'''<li class="bk-var"><span class="bk-var__name">{v["bentuk"]} {v["ukuran"]}<small>{E(p["jenis"])} {v["bentuk"].lower()}</small></span><span class="bk-var__price">{rp(v["harga"])}</span>
<span class="bk-var__act">{add_btn(p,v,"Beli")}<a class="bk-wa-mini" href="{wa_order(p,v)}" target="_blank" rel="noopener" aria-label="Pesan {E(p["jenis"])} {v["bentuk"]} {E(p["kemasan"])} via WhatsApp" title="Pesan via WhatsApp">{I["wa"]}</a></span></li>''' for v in vs)
    return f'''<article class="bk-prod reveal" id="{p["id"]}" data-tags="{tags}">
<div class="bk-prod__img{" is-duo" if len(imgs)>1 else ""}">{"".join(f'<img src="assets/img/produk/{v["img"]}.webp" alt="{E(p["jenis"])} {v["bentuk"]} ELEMENTIA {E(p["kemasan"])}" width="640" height="640" loading="lazy">' for v in imgs)}
<span class="bk-prod__origin{" is-putih" if "Putih" in p["jenis"] else ""}">{E(p["asal"])}</span></div>
<div class="bk-prod__body"><span class="bk-tag">{SEG[p["segmen"]]} · {forms}</span><h3>{E(p["jenis"])} {forms}</h3>
<div class="bk-prod__pack">{E(p["kemasan"])}</div>
<div class="bk-prod__from">{"Harga" if same else "Mulai dari"}<strong>{rp(lo)}</strong></div>
<ul class="bk-vars">{rows}</ul>
{f'<p style="font-size:12px;color:var(--bk-muted);margin:10px 0 0">{E(p["catatan"])}</p>' if p.get("catatan") else ""}
 </div></article>'''

# ---------- Komponen v3 ----------
def kom_price(k):
    return f'Mulai {rp(k["harga_mulai"])}' if k.get("harga_mulai") else "Harga menyusul"

def kom_media(k, w=640):
    if k.get("img"):
        f = k["img"] if "." in k["img"] else k["img"] + ".webp"
        return f'<img src="assets/img/produk/{f}" alt="{E(k["nama"])} ELEMENTIA" width="{w}" height="{w}" loading="lazy">'
    return f'<div class="bk-ph" style="--aksen:{k["aksen"]}"><span>{E(k["nama"].split()[0])}</span><small>foto menyusul</small></div>'

def kom_card(k):
    badge = '' if k["status"]=="tersedia" else '<span class="bk-badge">Segera hadir</span>'
    return f'''<article class="bk-kom reveal" data-kom="{k["slug"]}" data-status="{k["status"]}" data-text="{E(k["nama"] + " " + k["latin"] + " " + k["ringkas"] + " " + " ".join(k["pasangan"])).lower()}" style="--aksen:{k["aksen"]}">
 <a class="bk-kom__media" href="produk-{k["slug"]}.html" aria-label="{E(k["nama"])}">{kom_media(k)}{badge}</a>
 <div class="bk-kom__body"><h3><a href="produk-{k["slug"]}.html">{E(k["nama"])}</a></h3><em>{E(k["latin"])}</em><p class="bk-kom__desc">{E(k["ringkas"])}</p>
 <ul class="bk-kom__var">{"".join(f"<li>{E(v['nama'])}</li>" for v in k["varian"])}</ul>
 <div class="bk-kom__foot"><span class="bk-kom__price">{kom_price(k)}</span><a class="bk-more" href="produk-{k["slug"]}.html">Detail</a></div></div></article>'''

def persona_sky():
    p = V3["persona"]; d, b = p["dapur"], p["bisnis"]
    def card(x, icon, href, label):
        lis = "".join(f'<li>{E(i)}</li>' for i in x["poin"])
        return f'''<article class="bk-persona__card reveal"><div class="bk-persona__ic">{I[icon]}</div>
 <h3>{E(x["judul"])}</h3><p>{E(x["sub"])}</p><ul class="bk-checks">{lis}</ul>
 <a class="wp-block-button__link is-style-outline" href="{href}">{label}</a></article>'''
    return f'''<div class="wp-block-group alignfull bk-section bk-persona-wrap"><div class="bk-wrap">
 <div class="bk-head has-text-align-center reveal"><span class="bk-eyebrow">Untuk siapa</span><h2 class="bk-h2">Tiga dapur, satu standar</h2><p class="bk-lead">Rempah yang sama dipakai di dapur rumah, dapur profesional, dan lini produksi. Bedanya ukuran kemasan dan dokumen yang menyertainya.</p></div>
 <div class="bk-persona">{card(d,"home","produk.html","Belanja untuk rumah")}{card(b,"chef","bisnis.html","Ajukan penawaran bisnis")}{card(p["industri"],"factory","bisnis.html#industri","Lihat skema industri")}</div>
 </div></div>

 <div class="wp-block-group alignfull bk-section has-palette-color-6-background-color bk-kom-wrap"><div class="bk-wrap">
 <div class="bk-head has-text-align-center reveal"><span class="bk-eyebrow">Katalog</span><h2 class="bk-h2">Sebelas komoditas, satu kebun</h2><p class="bk-lead">Lada, kunyit, sereh, daun salam, cabai, bawang putih, ketumbar, kemiri, sampai gula aren dan gula kelapa — ditanam bersama pohon dalam sistem tumpangsari, bukan ladang monokultur.</p></div>
 <div class="bk-koms">{"".join(kom_card(k) for k in KOM)}</div>
 </div></div>

 '''

# ================= BERANDA =================
ORG_LD = {
 "@context": "https://schema.org",
 "@type": "Organization",
 "name": "ELEMENTIA — Rempah Tumpangsari",
 "url": SITE,
 "logo": SITE + "/assets/img/logo.png",
 "email": EMAIL,
 "telephone": TEL,
 "parentOrganization": {"@type": "Organization", "name": "PT ORIGIN EKA MANUFAKTUR", "url": "https://elementia.id/"},
 "address": {"@type": "PostalAddress", "streetAddress": "Kawasan Industri De Prima Terra Blok A1 No. 1A, Kel. Tegalluar, Kec. Bojongsoang", "addressLocality": "Kabupaten Bandung", "addressRegion": "Jawa Barat", "postalCode": "40288", "addressCountry": "ID"},
 "sameAs": [IG, FB, TOKPED, SHOPEE],
}
LD_JSON = json.dumps(ORG_LD, ensure_ascii=False)

home = head("ELEMENTIA Rempah Tumpangsari — Lada Putih Bangka & Lada Hitam Lampung",
  "ELEMENTIA — bumbu satu bahan dengan takaran presisi. Tanpa kupas, tanpa ulek, tanpa potong. 100% murni, tanpa pengisi, pewarna, atau MSG. Pesan langsung, ongkir dihitung per alamat.", "index.html", preload=F+"hero-elemen.webp",
  extra=f'<script type="application/ld+json">{LD_JSON}</script>')
featured = [("lada-putih",0),("lada-hitam",0),("cabai",0),("bawang-putih",2),("kunyit",0),("gula-aren",2)]
PLD = {p["id"]:p for p in PL}
fdesc = {"lada-putih":"Giling segar, aroma bangkit saat ditabur.","lada-hitam":"Butir utuh untuk grinder dan steak.","cabai":"Pedas terukur tanpa ulek, siap masuk wajan.","bawang-putih":"Tanpa kupas dan tanpa sisa bau di tangan.","kunyit":"Warna dan aroma stabil untuk kuah dan bumbu dasar.","gula-aren":"Manis karamel alami untuk kopi dan kecap."}
home += f'''
<div class="wp-block-cover alignfull bk-hero"><img class="wp-block-cover__image-background" src="{F}hero-elemen.webp" sizes="100vw" alt="Latar ELEMENTIA" width="1920" height="1078" fetchpriority="high">
<span class="wp-block-cover__background" aria-hidden="true"></span>
<div class="wp-block-cover__inner-container"><div class="bk-hero__text">
  <span class="bk-eyebrow">Pure Elements for Your Daily Dish &nbsp;·&nbsp; Wp · Bp · Tr · Lg · Bl · Ps · Cs · Ch · Gf · Co · Cn</span>
  <h1 class="bk-display">Satu bahan. <span>Takaran presisi.</span></h1>
  <p>Bumbu satu bahan tanpa kupas, tanpa ulek, tanpa potong — tinggal tuang dan masak. Dirancang untuk profesional kota yang ingin masakan cepat, sehat, dan autentik setiap hari. 100% murni: tanpa pengisi, tanpa pewarna, tanpa MSG.</p>
  <div class="wp-block-buttons"><div class="wp-block-button"><a class="wp-block-button__link" href="produk.html">Jelajahi rempah</a></div>
  <div class="wp-block-button is-style-light"><a class="wp-block-button__link" href="bisnis.html">{I["chef"]} Untuk hotel, resto &amp; kafe</a></div></div>
  <p class="bk-hero__note">Juga tersedia di <a href="{TOKPED}" target="_blank" rel="noopener">Tokopedia</a> dan <a href="{SHOPEE}" target="_blank" rel="noopener">Shopee</a> — atau pesan langsung di sini.</p>
</div></div></div>



 ''' + persona_sky() + f'''
<div class="wp-block-group alignfull bk-section"><div class="bk-wrap"><div class="wp-block-columns">
 <div class="wp-block-column reveal"><div class="bk-media"><img src="{F}petani-panen.webp" alt="Petani perempuan memanen buah lada ke dalam keranjang anyaman" width="1056" height="998" loading="lazy">
  <div class="bk-media__second"><img src="{F}jemur-lada-putih.webp" alt="Lada putih dijemur di atas tampah bambu" width="1200" height="802" loading="lazy"></div>
  <div class="bk-stamp"><strong>2 tahun</strong>umur simpan produk lada</div></div></div>
 <div class="wp-block-column reveal"><span class="bk-eyebrow">Tentang ELEMENTIA</span>
  <h2 class="bk-h2">Terjaga dari kebun sampai dapur</h2>
  <p>ELEMENTIA berawal dari lada Bangka Belitung sebagai <em>Bumbu Pusaka Nusantara</em>. Namanya kini dibaca lebih luas: <strong>Rempah Tumpangsari</strong> — karya pangan dari kebun Nusantara, dengan cara kerja yang tidak berubah.</p>
  <ul class="bk-checks"><li>Bekerja langsung dengan petani binaan di Pulau Bangka dan Belitung</li><li>Lada putih berkualitas ekspor, lada hitam Lampung yang tersterilisasi</li><li>Dikemas di fasilitas bersertifikat HALAL &amp; HACCP</li></ul>
  <div class="wp-block-buttons"><div class="wp-block-button is-style-outline"><a class="wp-block-button__link" href="tentang.html">Kenali kami</a></div></div></div>
</div></div></div>

<div class="wp-block-group alignfull bk-section has-palette-color-6-background-color"><div class="bk-wrap">
 <div class="bk-head has-text-align-center reveal"><span class="bk-eyebrow">Produk</span><h2 class="bk-h2">Sebelas elemen, satu rak dapur</h2><p class="bk-lead">Dua jenis lada, dua bentuk — butir dan bubuk — dari pouch 50 g sampai kemasan 25 kg.</p></div>
 <div class="bk-cards">
  <article class="bk-card reveal"><div class="bk-card__img"><img src="assets/img/produk/elemen-lada-putih.webp" alt="Lada putih bubuk ELEMENTIA" width="640" height="640" loading="lazy"></div>
   <div class="bk-card__body"><span class="bk-tag">6 kemasan · 100% Lada Bangka</span><h3>Lada Putih</h3><p>Masukkan saat memasak — rasanya menyatu ke seluruh masakan. Mulai {rp(17500)}.</p><a class="bk-more" href="produk.html#lada-putih">Lihat varian &amp; harga</a></div></article>
  <article class="bk-card reveal"><div class="bk-card__img"><img src="assets/img/produk/elemen-lada-hitam.webp" alt="Lada hitam butir ELEMENTIA" width="640" height="640" loading="lazy"></div>
   <div class="bk-card__body"><span class="bk-tag">5 kemasan · 100% Lada Lampung</span><h3>Lada Hitam</h3><p>Taburkan setelah matang — aroma naik saat masakan dihidangkan. Mulai {rp(16000)}.</p><a class="bk-more" href="produk.html#lada-hitam">Lihat varian &amp; harga</a></div></article>
  <article class="bk-card reveal"><div class="bk-card__img"><img src="{F}gudang.webp" alt="Gudang berisi tumpukan karung lada di atas palet" width="1200" height="900" loading="lazy"></div>
   <div class="bk-card__body"><span class="bk-tag">Kemasan 25 kg · Butir &amp; Bubuk</span><h3>Grosir &amp; B2B</h3><p>Untuk restoran, katering, reseller, dan produksi. Mulai {rp(4377500)} per 25 kg.</p><a class="bk-more" href="harga.html#grosir">Lihat harga grosir</a></div></article>
 </div>
</div></div>

<div class="wp-block-group alignfull bk-section"><div class="bk-wrap">
 <div class="bk-head has-text-align-center reveal"><span class="bk-eyebrow">Pricelist 2027</span><h2 class="bk-h2">Pilihan favorit dapur</h2><p class="bk-lead">Harga sesuai Pricelist ELEMENTIA 2027, sudah termasuk PPN.</p></div>
 <div class="bk-menu">{"".join((lambda p,v: f'<div class="bk-menu__item reveal"><img src="assets/img/produk/{v["img"]}.webp" alt="" width="92" height="92" loading="lazy"><div style="flex:1"><div class="bk-menu__top"><h3>{E(p["jenis"])} {v["bentuk"]} {v["ukuran"]}</h3><span class="bk-dots"></span><strong>{rp(v["harga"])}</strong></div><p>{E(v["kemasan"])} — {fdesc[p["id"]]}</p></div></div>')(PLD[i],PLD[i]["varian"][k]) for i,k in featured)}</div>
 <div class="wp-block-buttons is-content-justification-center" style="margin-top:56px"><div class="wp-block-button"><a class="wp-block-button__link" href="harga.html">Lihat pricelist lengkap</a></div></div>
</div></div>

<div class="wp-block-group alignfull bk-section has-palette-color-4-background-color"><div class="bk-wrap">
 <div class="bk-head has-text-align-center reveal"><span class="bk-eyebrow" style="color:var(--bk-gold-soft)">Dari kebun</span><h2 class="bk-h2">Perjalanan lada ELEMENTIA</h2><p class="bk-lead" style="color:rgba(255,255,255,.7)">Dari sulur lada di kebun petani binaan sampai karung yang siap dikirim.</p></div>
 <div class="bk-steps">
  <figure class="bk-step reveal" style="margin:0"><img src="{F}sulur-lada.webp" alt="Sulur tanaman lada dengan bulir bunga" width="1159" height="998" loading="lazy"><figcaption class="bk-step__cap"><b>01</b><h3>Tumbuh</h3><p>Sulur lada dirawat petani di kebun.</p></figcaption></figure>
  <figure class="bk-step reveal" style="margin:0"><img src="{F}petani-panen.webp" alt="Petani memanen lada" width="1056" height="998" loading="lazy"><figcaption class="bk-step__cap"><b>02</b><h3>Panen</h3><p>Buah lada dipetik ke keranjang anyaman.</p></figcaption></figure>
  <figure class="bk-step reveal" style="margin:0"><img src="{F}jemur-lada-putih.webp" alt="Lada putih dijemur di atas tampah" width="1200" height="802" loading="lazy"><figcaption class="bk-step__cap"><b>03</b><h3>Jemur</h3><p>Lada putih dijemur di atas tampah bambu.</p></figcaption></figure>
  <figure class="bk-step reveal" style="margin:0"><img src="{F}gudang.webp" alt="Karung lada tersusun di gudang" width="1200" height="900" loading="lazy"><figcaption class="bk-step__cap"><b>04</b><h3>Kemas</h3><p>Dikemas dan disimpan sebelum dikirim.</p></figcaption></figure>
 </div>
</div></div>

<div class="wp-block-group alignfull bk-section has-palette-color-7-background-color"><div class="bk-wrap"><div class="wp-block-columns">
 <div class="wp-block-column reveal"><span class="bk-eyebrow">Untuk setiap dapur</span><h2 class="bk-h2">Kemasan untuk setiap kebutuhan</h2>
  <p style="color:var(--bk-muted);margin-bottom:40px">Dari pouch 50 g sampai kemasan 25 kg — semua harga tercantum di pricelist.</p>
  <div class="bk-occ">
   <div><div class="bk-occ__icon">{I["home"]}</div><h3>Rumah tangga</h3><p>Pouch 50–100 g, botol 65–70 g, dan grinder 50–55 g.</p></div>
   <div><div class="bk-occ__icon">{I["chef"]}</div><h3>Restoran &amp; katering</h3><p>Kemasan plastik 1 kg untuk dapur yang memasak setiap hari.</p></div>
   <div><div class="bk-occ__icon">{I["store"]}</div><h3>Reseller</h3><p>Hubungi tim kami untuk kebutuhan stok kemasan eceran.</p></div>
   <div><div class="bk-occ__icon">{I["factory"]}</div><h3>Produksi</h3><p>Kemasan 25 kg butir maupun bubuk untuk industri pangan.</p></div>
  </div></div>
 <div class="wp-block-column reveal"><div class="bk-media bk-media--wide"><img src="{F}kebun-jalan.webp" alt="Kebun lada dari udara dengan jalan tanah di tengahnya" width="1200" height="900" loading="lazy"></div></div>
</div></div></div>

<div class="wp-block-group alignfull bk-section bk-section--tight"><div class="bk-wrap">
 <div class="bk-head has-text-align-center reveal"><span class="bk-eyebrow">Standar ELEMENTIA</span><h2 class="bk-h2">Aman dan murni</h2></div>
 <div class="bk-badges">
  <div class="bk-badge reveal"><strong>HALAL</strong><span>Bersertifikat</span></div>
  <div class="bk-badge reveal"><strong>HACCP</strong><span>Pabrik tersertifikasi</span></div>
  <div class="bk-badge reveal"><strong>Uji lab</strong><span>Berkala: piperine, kadar air, cemaran mikroba</span></div>
 </div>
</div></div>

<div class="wp-block-group alignfull bk-section has-palette-color-6-background-color"><div class="bk-wrap">
 <div class="bk-head has-text-align-center reveal"><span class="bk-eyebrow">Masak dengan ELEMENTIA</span><h2 class="bk-h2">Ide masakan rumahan</h2><p class="bk-lead">Resep yang menunjukkan tempat lada bekerja paling baik.</p></div>
 <div class="bk-recipes">{"".join(f'<a class="bk-recipe reveal" href="resep.html#{r["slug"]}"><img src="assets/img/resep/{r["slug"]}.webp" alt="{E(r["title"])}" width="900" height="675" loading="lazy"><div class="bk-recipe__cap"><span>{E(r["lada"])}</span><h3>{E(r["title"].capitalize() if r["title"].islower() else r["title"])}</h3></div></a>' for r in [x for x in RES if x["slug"] in ("nasi-goreng","soto-lamongan","baso-tahu-bandung","dimsum-ayam","spaghetti-carbonara","beef-brisket-dry-rub")])}</div>
 <div class="wp-block-buttons is-content-justification-center" style="margin-top:50px"><div class="wp-block-button is-style-outline"><a class="wp-block-button__link" href="resep.html">Lihat semua resep</a></div></div>
</div></div>
''' + cta_band() + foot()
write("index.html", home)

# ================= PRODUK (v3) =================
def var_rows(k):
    out = []
    ready = k["status"] == "tersedia"
    for v in k["varian"]:
        f = v["img"] if "." in v["img"] else v["img"] + ".webp"
        hv = hvar(k["nama"], v["nama"])
        out.append(
            f'<li class="bk-varrow"><img src="assets/img/produk/{f}" alt="{E(k["nama"])} {E(v["nama"])}" width="96" height="96" loading="lazy">'
            f'<div class="bk-varrow__txt"><strong>{E(v["nama"])}</strong><small>{E(v.get("ket", ""))} · {len(hvar(k["nama"], v["nama"]))} kemasan</small></div>'
            f'<span class="bk-varrow__price">{("Mulai " + rp(min(km["harga"] for km in hv))) if hv else "&mdash;"}</span>'
            f'<span class="bk-varrow__st {"is-ready" if ready else "is-soon"}">{"Siap dibeli" if ready else "Segera hadir"}</span>'
            f'<a class="bk-more" href="produk-{k["slug"]}.html">Lihat</a></li>')
    return "".join(out)

def kom_block(k):
    price = f'Mulai {rp(k["harga_mulai"])}' if k.get("harga_mulai") else "Harga menyusul"
    n = len(k["varian"])
    txt = E(k["nama"] + " " + k["latin"] + " " + k["ringkas"] + " " + " ".join(v["nama"] for v in k["varian"])).lower()
    meta = E(" · ".join([k["latin"], str(n) + " varian", "kemasan " + " / ".join(k["kemasan"][:3])]))
    return f'''<section class="bk-block reveal" data-kom="{k["slug"]}" data-status="{k["status"]}" data-text="{txt}" style="--aksen:{k["aksen"]}">
<header class="bk-block__head"><div><span class="bk-eyebrow">{E(k["asal"])}</span><h3 class="bk-block__title">{E(k["nama"])}</h3><p class="bk-block__meta">{meta}</p></div>
<div class="bk-block__side"><span class="bk-block__price">{price}</span><a class="bk-more" href="produk-{k["slug"]}.html">Detail produk &rarr;</a></div></header>
<ul class="bk-varrows">{var_rows(k)}</ul></section>'''

_nkom = len(KOM); _nvar = sum(len(k["varian"]) for k in KOM)
_nama_kom = ", ".join(k["nama"] for k in KOM[:-1]) + ", dan " + KOM[-1]["nama"]
pg = head(f"Katalog Rempah — {_nkom} Komoditas, {_nvar} Varian | ELEMENTIA",
  f"{_nkom} komoditas tumpangsari dalam {_nvar} varian: {_nama_kom}. Kemasan 50 g sampai 25 kg.",
  "produk.html", img=F+"sulur-lada.webp",
  extra='<script src="assets/js/katalog.js?v=20261108d" defer></script>')
pg += page_hero("Katalog Rempah","Sebelas komoditas, dua puluh lima varian — dari lada butir sampai gula aren cair. Pilih komoditas, lalu tentukan bentuk dan kemasan.",F+"sulur-lada.webp","Produk","Sulur tanaman lada di kebun")

kom_chips = "".join(f'<button class="bk-chip" data-kf="{k["slug"]}" aria-pressed="false">{E(k["nama"])}</button>' for k in KOM)
pg += f'''<div class="wp-block-group alignfull bk-section"><div class="bk-wrap">
 <div class="bk-toolbar reveal">
  <div class="bk-search-wrap">
   <label class="screen-reader-text" for="kom-q">Cari rempah</label>
   <input id="kom-q" type="search" class="bk-search" placeholder="Cari komoditas atau varian — mis. sereh, gula aren, pecah" data-kom-search autocomplete="off">
  </div>
  <div class="bk-chips" role="group" aria-label="Saring komoditas">
   <button class="bk-chip" data-kf="all" aria-pressed="true">Semua</button>
   <button class="bk-chip" data-kf="tersedia" aria-pressed="false">Siap dibeli</button>
   <button class="bk-chip" data-kf="segera" aria-pressed="false">Segera hadir</button>
   {kom_chips}
  </div>
  <p class="bk-note bk-count" data-kom-count aria-live="polite">8 komoditas · 19 varian</p>
 </div>
 <div class="bk-koms bk-blocks" data-kom-grid>{"".join(kom_block(k) for k in KOM)}</div>
 <p class="bk-empty" data-kom-empty hidden>Tidak ada komoditas yang cocok. Coba kata lain, atau <a href="{WA_HALO}" target="_blank" rel="noopener">tanya lewat WhatsApp</a>.</p>
</div></div>

''' + cta_band() + foot()
write("produk.html", pg)

# ================= HARGA =================
_nk = len(H)
_nv = sum(len(k["varian"]) for k in H)
_ns = sum(len(v["kemasan"]) for k in H for v in k["varian"])
hg = head(f"Daftar Harga 2026 — {_ns} SKU | ELEMENTIA",
  f"Harga lengkap {_nk} komoditas, {_nv} varian, {_ns} SKU: botol grinder, pouch 50 g sampai 250 g, dan karung 25 kg. Harga termasuk PPN.",
  "harga.html", img="assets/img/pricelist/pricelist-elementia-2027.webp")
hg += page_hero("Daftar Harga 2026", "Semua varian dan kemasan dalam satu halaman. Harga sudah termasuk PPN.", F + "gudang.webp", "Daftar Harga", "Gudang dengan karung rempah tersusun di atas palet")

def harga_tabel(k):
    vrows = []
    for v in k["varian"]:
        cells = []
        for km in v["kemasan"]:
            sc = sku_of(k["nama"], v["nama"], km["jenis"], km["gram"])
            cells.append(
                f'<td class="bk-td-foto">{foto_cell(k["nama"], v["nama"], km, k["nama"] + " " + v["nama"] + " " + km["jenis"] + " " + gram_txt(km["gram"]))}</td>'
                f'<td><strong>{E(km["jenis"])} {gram_txt(km["gram"])}</strong>'
                f'<span class="bk-tbl__price">{rp(km["harga"])}</span>'
                f'<button type="button" class="bk-btn-mini" data-add-sku="{sc}" '
                f'aria-label="Tambah {E(k["nama"])} {E(v["nama"])} {E(km["jenis"])} {gram_txt(km["gram"])} ke keranjang">Beli</button></td>')
        vrows.append(f'<tr><th scope="row">{E(v["nama"])}</th>{"".join(cells)}</tr>')
    return f'''<div class="bk-table-wrap reveal" style="margin-bottom:38px"><table class="bk-table bk-price">
<caption>{E(k["nama"])}</caption>
<thead><tr><th scope="col">Varian</th><th scope="col">Foto</th><th scope="col">Kemasan &amp; harga</th><th scope="col">Kemasan &amp; harga</th><th scope="col">Kemasan &amp; harga</th><th scope="col">Kemasan &amp; harga</th></tr></thead>
<tbody>{"".join(vrows)}</tbody></table></div>'''

hg += f'''<div class="wp-block-group alignfull bk-section"><div class="bk-wrap">
 <div class="bk-head reveal"><span class="bk-eyebrow">Pricelist</span><h2 class="bk-h2">{_nk} komoditas, {_nv} varian, {_ns} SKU</h2>
  <p class="bk-lead">Harga sudah termasuk PPN. Berat tertera adalah berat bersih; ongkir dihitung di checkout. Tombol Beli langsung memasukkan barang ke keranjang.</p></div>
''' + "".join(harga_tabel(k) for k in H) + '''</div></div>''' + cta_band() + foot()
write("harga.html", hg)

# ================= RESEP =================
rs = head("Resep | Dapur ELEMENTIA","9 resep untuk mencoba lada ELEMENTIA di dapur Anda — nasi goreng, soto Lamongan, baso tahu Bandung, dimsum ayam, carbonara, dan lainnya.","resep.html", img="assets/img/resep/nasi-goreng.webp")
rs += page_hero("Dapur ELEMENTIA","9 resep untuk mencoba lada di dapur Anda — masakan Nusantara dan lainnya. Setiap resep pakai satu lada ELEMENTIA.",F+"taburan.webp","Resep","Lada ditaburkan di atas masakan")
rs += '<div class="wp-block-group alignfull bk-section" style="padding-top:70px"><div class="bk-wrap"><p class="bk-note">Tips: kandungan piperine lada Bangka membuatnya jauh lebih pedas dari lada pasaran. Pakai setengah dari takaran yang biasa Anda gunakan.</p><div>'
for r in RES:
    t = r["title"].capitalize() if r["title"].islower() else r["title"]
    rs += f'''<article class="bk-recipe-full" id="{r["slug"]}">
 <div class="bk-recipe-full__img reveal"><img src="assets/img/resep/{r["slug"]}.webp" alt="{E(t)}" width="900" height="675" loading="lazy"></div>
 <div class="reveal"><span class="bk-eyebrow">Resep</span><h2 class="bk-h2">{E(t)}</h2>
  <p><span class="bk-pill" style="margin:0">Pakai {E(r["lada"])} ELEMENTIA</span> &nbsp;<span style="color:var(--bk-muted)">{len(r["ing"])} bahan · {len(r["steps"])} langkah</span></p>
  <details open><summary>Bahan</summary><ul class="bk-ing">{"".join(f"<li><b>{E(q)}</b> {E(n)}</li>" for q,n in r["ing"])}</ul></details>
  <details><summary>Cara membuat</summary><ol class="bk-steps-list">{"".join(f"<li>{E(s)}</li>" for s in r["steps"])}</ol></details>
 </div></article>'''
rs += '</div></div></div>' + cta_band() + foot()
write("resep.html", rs)

# ================= TENTANG =================
vals = [("Bahan Baku Alami","Kami menggunakan bahan-bahan alami dengan kualitas terbaik. Tanpa zat aditif dan bahan pengawet buatan — hasilnya lebih enak dan sehat."),
 ("Pertanian yang Berkelanjutan","Kami percaya pertanian adalah sektor vital bagi kehidupan yang bahagia. Kami aktif bermitra mencari dan menerapkan teknologi pertanian yang lebih baik."),
 ("Mendukung Petani Lokal","Kami bekerja langsung dengan petani lokal Pulau Bangka dan Belitung — petani yang antusias, berdedikasi, dan bangga dengan produknya."),
 ("Menghargai Keutuhan Produk","Produk sederhana dengan metode Whole Food Plant Based — menjaga keutuhan produk dan tidak memproses secara berlebihan.")]
tg = head("Tentang | ELEMENTIA Rempah Tumpangsari","ELEMENTIA berawal dari lada Bangka Belitung sebagai Bumbu Pusaka Nusantara — kini Rempah Tumpangsari. Produk PT ORIGIN EKA MANUFAKTUR, bersama petani binaan Bangka Belitung.","tentang.html", img=F+"petani-kebun.webp")
tg += page_hero("Rempah Tumpangsari","Rasa yang istimewa — dari kebun Nusantara ke meja makan keluarga.",F+"petani-kebun.webp","Tentang","Petani berjalan di antara tanaman lada")
tg += f'''<div class="wp-block-group alignfull bk-section"><div class="bk-wrap"><div class="wp-block-columns">
 <div class="wp-block-column reveal"><span class="bk-eyebrow">Profil</span><h2 class="bk-h2">Dari Bumbu Pusaka ke Buah Karya</h2>
  <p>ELEMENTIA berawal dari lada Bangka Belitung sebagai <strong>Bumbu Pusaka Nusantara</strong>. Namanya kini dibaca lebih luas: <strong>Rempah Tumpangsari</strong> — karya pangan dari kebun Nusantara, dengan cara kerja yang tidak berubah.</p>
  <p>Nama kami tidak berhenti di satu bumbu. ELEMENTIA tumbuh dari lada Bangka Belitung menjadi satu rak karya pangan Nusantara — bahan asli, petani binaan, mutu yang dijaga di setiap tahap.</p></div>
 <div class="wp-block-column reveal"><div class="bk-media"><img src="{F}jemur-lada-putih.webp" alt="Tangan memegang lada putih di atas tampah bambu" width="1200" height="802" loading="lazy" style="aspect-ratio:4/3"></div></div>
</div></div></div>

<div class="wp-block-group alignfull bk-section has-palette-color-6-background-color"><div class="bk-wrap">
 <div class="bk-head has-text-align-center reveal"><span class="bk-eyebrow">Nilai Kami</span><h2 class="bk-h2">Lima prinsip yang kami pegang</h2></div>
 <div class="bk-values">{"".join(f'<div class="bk-value reveal"><div class="bk-value__num">0{i+1}</div><h3>{a}</h3><p>{b}</p></div>' for i,(a,b) in enumerate(vals))}
 <div class="bk-value is-cta reveal"><h3>Ingin tahu lebih banyak?</h3><p style="color:rgba(255,255,255,.85);margin-bottom:20px">Tanyakan apa saja tentang produk, kemitraan, atau grosir.</p><div class="wp-block-button is-style-gold"><a class="wp-block-button__link" href="{WA_HALO}" target="_blank" rel="noopener">{I["wa"]} WhatsApp</a></div></div></div>
</div></div>

<div class="wp-block-group alignfull bk-section"><div class="bk-wrap"><div class="wp-block-columns">
 <div class="wp-block-column reveal"><div class="bk-media"><img src="{F}menanam-bibit.webp" alt="Dua petani perempuan menanam bibit di kebun" width="1200" height="799" loading="lazy" style="aspect-ratio:4/3"></div></div>
 <div class="wp-block-column reveal"><span class="bk-eyebrow">Petani &amp; keberlanjutan</span><h2 class="bk-h2">Tumbuh bersama petani binaan</h2>
  <p>Kami bekerja langsung dengan petani lokal Pulau Bangka dan Belitung, dan aktif bermitra mencari serta menerapkan teknologi pertanian yang lebih baik.</p>
  <ul class="bk-checks"><li>Bermitra langsung dengan petani binaan</li><li>Pertanian yang berkelanjutan</li><li>Produk sederhana, tidak diproses berlebihan</li></ul></div>
</div></div></div>

<div class="wp-block-group alignfull bk-section has-palette-color-7-background-color"><div class="bk-wrap">
 <div class="bk-head has-text-align-center reveal"><span class="bk-eyebrow">Galeri</span><h2 class="bk-h2">Dari kebun lada kami</h2></div>
 <div class="bk-gallery reveal">
  <figure class="g-wide g-tall"><img src="{F}kebun-aerial-1200.webp" alt="Kebun lada dilihat dari udara" width="1200" height="674" loading="lazy"><figcaption>Hamparan kebun lada</figcaption></figure>
  <figure><img src="{F}sulur-lada.webp" alt="Sulur lada dengan bulir bunga" width="1159" height="998" loading="lazy"><figcaption>Sulur lada</figcaption></figure>
  <figure class="g-tall"><img src="{F}petani-panen.webp" alt="Petani memanen lada" width="1056" height="998" loading="lazy"><figcaption>Panen</figcaption></figure>
  <figure><img src="{F}jemur-lada-putih.webp" alt="Lada putih dijemur" width="1200" height="802" loading="lazy"><figcaption>Penjemuran lada putih</figcaption></figure>
  <figure class="g-wide"><img src="{F}kebun-jalan.webp" alt="Kebun lada dan jalan kebun dari udara" width="1200" height="900" loading="lazy"><figcaption>Jalan kebun</figcaption></figure>
  <figure><img src="{F}menanam-bibit.webp" alt="Petani menanam bibit" width="1200" height="799" loading="lazy"><figcaption>Menanam bibit</figcaption></figure>
  <figure><img src="{F}gudang.webp" alt="Gudang karung lada" width="1200" height="900" loading="lazy"><figcaption>Gudang</figcaption></figure>
 </div>
</div></div>

<div class="wp-block-group alignfull bk-section"><div class="bk-wrap"><div class="wp-block-columns">
 <div class="wp-block-column reveal"><span class="bk-eyebrow">Produsen</span><h2 class="bk-h2">PT ORIGIN EKA MANUFAKTUR</h2>
  <p>ELEMENTIA adalah produk dari PT ORIGIN EKA MANUFAKTUR. Kami bekerja langsung dengan petani binaan di Pulau Bangka dan Belitung untuk menghadirkan lada berkualitas ekspor ke meja makan keluarga Nusantara.</p>
  <div class="wp-block-buttons"><div class="wp-block-button is-style-outline"><a class="wp-block-button__link" href="https://elementia.id/" target="_blank" rel="noopener">Kunjungi elementia.id</a></div></div></div>
 <div class="wp-block-column reveal"><div class="bk-media"><img src="{F}gudang.webp" alt="Gudang penyimpanan karung lada" width="1200" height="900" loading="lazy" style="aspect-ratio:4/3"></div></div>
</div>
<div class="bk-facts reveal" style="margin-top:80px">
 <div><small>Sertifikasi</small><strong>HALAL &amp; HACCP</strong></div><div><small>Asal bahan baku</small><strong>Bangka Belitung &amp; Lampung</strong></div>
 <div><small>Umur simpan</small><strong>2 tahun</strong></div><div><small>Operasional</small><strong>Senin – Sabtu, 09.00–16.00</strong></div>
</div></div></div>
''' + cta_band() + foot()
write("tentang.html", tg)

# ================= KONTAK & FAQ =================
faqs = [("Kenapa harus Lada ELEMENTIA?",["100% murni menggunakan produk lada tanpa bahan campuran lainnya.","Rasa lebih pedas. Cukup menggunakan setengah dari takaran biasa.","Tanpa bahan pengawet dan bahan kimia campuran.","Bersertifikat HALAL."]),
 ("Apakah harga sudah termasuk PPN?",["Ya. Semua harga di Pricelist ELEMENTIA 2027 sudah termasuk PPN.","Ongkos kirim belum termasuk dan dikonfirmasi oleh tim kami melalui WhatsApp."]),
 ("Bagaimana cara memesan?",["Tekan tombol Pesan pada produk di halaman Produk atau Daftar Harga — WhatsApp akan terbuka dengan pesan berisi produk dan varian pilihan Anda.","Produk juga tersedia di toko resmi Tokopedia dan Shopee Elementia Official."]),
 ("Cocok untuk masakan apa saja?",["Lada bubuk bisa digunakan untuk makanan berbahan sayuran ataupun daging — masakan tradisional Indonesia, western, chinese, dan lainnya.","Lada putih bubuk cocok diberikan saat proses memasak sehingga rasanya lebih menyatu pada keseluruhan makanan.","Lada hitam bubuk lebih cocok sebagai taburan akhir masakan yang sudah matang, sehingga menambah aroma ketika dihidangkan."]),
 ("Terbuat dari apa produk tersebut?",["Lada putih bubuk dan lada hitam bubuk menggunakan 100% lada tanpa bahan tambahan apa pun.","Lada putih bubuk berasal dari lada putih Bangka dan Belitung dengan kualitas ekspor.","Lada hitam bubuk berasal dari lada hitam Lampung yang telah tersterilisasi."]),
 ("Apakah bumbu tersebut aman dikonsumsi?",["Kami melakukan uji lab secara berkala untuk memastikan kualitas dan keamanan produk hingga ke tangan konsumen.","Uji lab meliputi kandungan piperine (senyawa yang memengaruhi tingkat kepedasan), kadar air, hingga cemaran mikroorganisme.","Produk ELEMENTIA bersertifikat HALAL, dan proses pengolahannya tersertifikasi HACCP."]),
 ("Berapa lama umur simpan produk?",["Umur simpan produk lada kami adalah 2 tahun. Disarankan dihabiskan paling lambat 6 bulan setelah kemasan dibuka untuk menghindari perubahan rasa dan penggumpalan."])]
kt = head("Kontak & FAQ | ELEMENTIA Rempah Tumpangsari","Hubungi ELEMENTIA: telepon 000-0000-0000, WhatsApp 0800-0000-0000, email halo@elementia.id. Kantor pusat di Bojongsoang, Kabupaten Bandung. Jawaban pertanyaan umum tentang lada ELEMENTIA.","kontak.html", img=F+"kebun-jalan.webp",
  extra='<script type="application/ld+json">'+json.dumps({"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":" ".join(a)}} for q,a in faqs]},ensure_ascii=False)+'</script>')
kt += page_hero("Kontak","Kami senang dengan kunjungan Anda. Pelayanan terbaik untuk semua pelanggan kami di Indonesia.",F+"kebun-jalan.webp","Kontak","Kebun lada dari udara")
kt += f'''<div class="wp-block-group alignfull bk-section"><div class="bk-wrap"><div class="wp-block-columns are-vertically-aligned-top" style="align-items:stretch">
 <div class="wp-block-column reveal"><span class="bk-eyebrow">Informasi Kontak</span><h2 class="bk-h2">Hubungi kami</h2>
  <ul class="bk-contact-list">
   <li><span class="bk-ic">{I["pin"]}</span><div><small>Kantor Pusat</small>PT ORIGIN EKA MANUFAKTUR<br>{"<br>".join(ADDR)}<br><a href="{MAPS}" target="_blank" rel="noopener" class="bk-more" style="margin-top:6px">Buka di Google Maps</a></div></li>
   <li><span class="bk-ic">{I["phone"]}</span><div><small>Telepon</small><a href="tel:{TEL}">{TEL_TXT}</a></div></li>
   <li><span class="bk-ic">{I["wa"].replace('<svg','<svg fill="currentColor"')}</span><div><small>WhatsApp</small><a href="{WA_HALO}" target="_blank" rel="noopener">{WA_TXT}</a></div></li>
   <li><span class="bk-ic">{I["mail"]}</span><div><small>Email</small><a href="mailto:{EMAIL}">{EMAIL}</a></div></li>
   <li><span class="bk-ic">{I["clock"]}</span><div><small>Jam Buka</small>{HOURS}</div></li>
  </ul>
  <div class="wp-block-buttons"><div class="wp-block-button is-style-wa"><a class="wp-block-button__link" href="{WA_HALO}" target="_blank" rel="noopener">{I["wa"]} Chat WhatsApp</a></div>
   <div class="wp-block-button is-style-outline"><a class="wp-block-button__link" href="{TOKPED}" target="_blank" rel="noopener">Tokopedia</a></div><div class="wp-block-button is-style-outline"><a class="wp-block-button__link" href="{SHOPEE}" target="_blank" rel="noopener">Shopee</a></div></div>
  <p style="margin-top:22px;font-size:14px;color:var(--bk-muted)">Ikuti kami: <a href="{IG}" target="_blank" rel="noopener">Instagram | Elementia Official</a> · <a href="{FB}" target="_blank" rel="noopener">Facebook | Elementia Official</a></p></div>
 <div class="wp-block-column reveal"><iframe class="bk-map" title="Peta lokasi gudang ELEMENTIA" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="{MAPS_EMBED}"></iframe></div>
</div></div></div>
<div class="wp-block-group alignfull bk-section has-palette-color-6-background-color" id="faq"><div class="bk-wrap">
 <div class="bk-head has-text-align-center reveal"><span class="bk-eyebrow">FAQ</span><h2 class="bk-h2">Pertanyaan yang sering diajukan</h2><p class="bk-lead">Elementia berinovasi dengan mengembangkan produksi pangan yang mendukung kesehatan manusia dan kelestarian lingkungan.</p></div>
 <div class="bk-faq">{"".join(f'<details class="reveal"{" open" if i==0 else ""}><summary>{E(q)}</summary><div class="ans"><ul>{"".join(f"<li>{E(x)}</li>" for x in a)}</ul></div></details>' for i,(q,a) in enumerate(faqs))}</div>
 <p class="has-text-align-center" style="margin-top:40px">Masih ada pertanyaan? <a href="{WA_HALO}" target="_blank" rel="noopener">Chat langsung via WhatsApp</a>.</p>
</div></div>
''' + foot()
write("kontak.html", kt)

exec(open(os.path.join(ROOT,"shop_pages.py")).read())
exec(open(os.path.join(ROOT,"v3_pages.py")).read())
def _loc(h):
    return SITE + "/" + ("" if h == "index.html" else h)
open(os.path.join(ROOT,"sitemap.xml"),"w").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + "".join(f"<url><loc>{_loc(h)}</loc></url>" for h, _ in NAV) + "".join(f"<url><loc>{SITE}/produk-{k['slug']}.html</loc></url>" for k in KOM) + "</urlset>\n")
open(os.path.join(ROOT,"robots.txt"),"w").write(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
