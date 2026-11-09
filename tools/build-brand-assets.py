"""Siapkan aset merek Elementia: potong 7 ikon elemen dari lembar ikon,
buat varian logo (gelap/terang) + favicon + OG, dan tile untuk simbol yang belum ada."""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = r"D:\Home\Grok Bot\elementia"
SRC = os.path.join(ROOT, "brand-src")
OUT = os.path.join(ROOT, "assets", "img", "elemen")
IMG = os.path.join(ROOT, "assets", "img")
CREAM = (255, 255, 255)
NAVY = (51, 51, 51)


def font(size, bold=False):
    for n in (("seguisb.ttf", "arialbd.ttf") if bold else ("segoeui.ttf", "arial.ttf")):
        p = os.path.join(r"C:\Windows\Fonts", n)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def content_cols(im, bg, tol=20):
    w, h = im.size
    px = im.load()
    cols = []
    for x in range(w):
        cnt = 0
        for y in range(0, h, 2):
            r, g, b = px[x, y][:3]
            if abs(r - bg[0]) > tol or abs(g - bg[1]) > tol or abs(b - bg[2]) > tol:
                cnt += 1
        cols.append(cnt)
    return cols


def boxes(im, bg, tol=20, gap=40):
    cols = content_cols(im, bg, tol)
    hit = [i for i, c in enumerate(cols) if c > 1]
    if not hit:
        return []
    groups, start, prev = [], hit[0], hit[0]
    for x in hit[1:]:
        if x - prev > gap:
            groups.append((start, prev))
            start = x
        prev = x
    groups.append((start, prev))
    return groups


icons = Image.open(os.path.join(SRC, "icons.jpg")).convert("RGB")
bg = icons.getpixel((3, 3))
groups = boxes(icons, bg, gap=60)
print("kolom terdeteksi:", len(groups))
for g in groups:
    print("   x", g, "lebar", g[1] - g[0])


def vbox(im, x0, x1, bg, tol=20):
    px = im.load()
    ys = []
    for y in range(im.size[1]):
        cnt = 0
        for x in range(x0, x1):
            r, g, b = px[x, y][:3]
            if abs(r - bg[0]) > tol or abs(g - bg[1]) > tol or abs(b - bg[2]) > tol:
                cnt += 1
        if cnt >= 6:            # abaikan bintik/tepi JPEG
            ys.append(y)
    return (min(ys), max(ys)) if ys else (0, im.size[1])


SLUGS = ["lada-putih", "lada-hitam", "kunyit", "sereh", "daun-salam", "gula-aren", "cabai"]
if len(groups) == len(SLUGS):
    for slug, (x0, x1) in zip(SLUGS, groups):
        y0, y1 = vbox(icons, x0, x1 + 1, bg)
        pad = 28
        crop = icons.crop((max(0, x0 - pad), max(0, y0 - pad),
                           min(icons.size[0], x1 + pad), min(icons.size[1], y1 + pad)))
        side = max(crop.size)
        canvas = Image.new("RGB", (side, side), (255, 255, 255))
        canvas.paste(crop, ((side - crop.size[0]) // 2, (side - crop.size[1]) // 2))
        canvas = canvas.resize((640, 640), Image.LANCZOS)
        canvas.save(os.path.join(OUT, slug + ".webp"), "WEBP", quality=92, method=6)
        print("  ikon:", slug, crop.size)
else:
    print("!! jumlah kolom tidak sesuai, ikon tidak dipotong otomatis")

# --- tile untuk simbol yang tidak punya ilustrasi ---
MISSING = [("gula-kelapa", "15", "Cs", "Coconut Sugar"),
           ("bawang-putih", "20", "Gf", "Garlic"),
           ("ketumbar", "22", "Co", "Coriander"),
           ("kemiri", "24", "Cn", "Candlenut")]
for slug, num, sym, name in MISSING:
    S = 800
    im = Image.new("RGB", (S, S), CREAM)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([120, 250, 680, 550], 18, outline=(120, 110, 90), width=5)
    d.text((150, 268), num, font=font(58, True), fill=(120, 110, 90))
    d.text((S // 2, 400), sym, font=font(210, True), fill=NAVY, anchor="mm")
    d.text((S // 2, 690), name.upper(), font=font(44, True), fill=(120, 110, 90), anchor="mm")
    im.save(os.path.join(OUT, slug + ".webp"), "WEBP", quality=92, method=6)
    print("  tile:", slug)

# --- logo: versi gelap & terang, latar transparan ---
logo = Image.open(os.path.join(SRC, "logo.jpg")).convert("RGB")
lw, lh = logo.size
px = logo.load()
dark = Image.new("RGBA", (lw, lh), (0, 0, 0, 0))
light = Image.new("RGBA", (lw, lh), (0, 0, 0, 0))
dpx, lpx = dark.load(), light.load()
for y in range(lh):
    for x in range(lw):
        r, g, b = px[x, y]
        lum = (r + g + b) / 3
        if lum > 225:            # latar krem -> transparan
            alpha = 0
        else:
            alpha = min(255, int((225 - lum) * 3.4))
        if alpha:
            dpx[x, y] = (51, 51, 51, alpha)
            lpx[x, y] = (255, 255, 255, alpha)

dark.save(os.path.join(IMG, "logo.webp"), "WEBP", quality=95, method=6)
dark.save(os.path.join(IMG, "logo.png"))
light.save(os.path.join(IMG, "logo-light.webp"), "WEBP", quality=95, method=6)
light.save(os.path.join(IMG, "logo-light.png"))

# OG: logo di atas krem
og = Image.new("RGB", (1200, 630), CREAM)
mark = dark.crop(dark.getbbox())
scale = min(880 / mark.size[0], 300 / mark.size[1])
mark = mark.resize((int(mark.size[0] * scale), int(mark.size[1] * scale)), Image.LANCZOS)
og.paste(mark, ((1200 - mark.size[0]) // 2, (630 - mark.size[1]) // 2 - 20), mark)
d = ImageDraw.Draw(og)
d.text((600, 520), "Pure Elements for Your Daily Dish", font=font(38), fill=(120, 110, 90), anchor="mm")
og.save(os.path.join(IMG, "logo-og.png"))

# favicon: huruf E pada kotak navy
fav = Image.new("RGB", (256, 256), (38, 38, 38))
d = ImageDraw.Draw(fav)
d.text((128, 132), "E", font=font(150, True), fill=(255, 255, 255), anchor="mm")
fav.save(os.path.join(IMG, "favicon.png"))
print("logo & favicon selesai")
