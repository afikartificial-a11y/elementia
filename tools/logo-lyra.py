"""Buat wordmark ELEMENTIA pengganti logo lama (placeholder sampai logo resmi tersedia)."""
import base64, io, os
from PIL import Image, ImageDraw, ImageFont

ROOT = r"D:\Home\Grok Bot\elementia"
IMG = os.path.join(ROOT, "assets", "img")
GREEN = (20, 61, 43, 255)
GOLD = (201, 161, 59, 255)


def tt(name, size):
    p = os.path.join(r"C:\Windows\Fonts", name)
    return ImageFont.truetype(p, size) if os.path.exists(p) else ImageFont.load_default()


def draw_spaced(d, xy, text, fnt, fill, tracking, stroke=0, stroke_fill=None):
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=fnt, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)
        x += d.textlength(ch, font=fnt) + tracking


def measure(text, fnt, tracking):
    d = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    return sum(d.textlength(c, font=fnt) for c in text) + tracking * (len(text) - 1)


def wordmark(w, h, size_ratio=0.42, sub=None, sub_ratio=0.055, bg=None, fill=None, stroke=0):
    im = Image.new("RGBA", (w, h), bg if bg else (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    fs = int(h * size_ratio)
    f = tt("georgiab.ttf", fs)
    tr = fs * 0.12
    tw = measure("ELEMENTIA", f, tr)
    x = (w - tw) / 2
    y = (h - fs) / 2 - (h * 0.06 if sub else 0)
    draw_spaced(d, (x, y), "ELEMENTIA", f, fill or GREEN, tr, stroke, (251, 250, 245, 255))
    # garis emas tipis di bawah wordmark
    lw = tw * 0.55
    ly = y + fs * 1.12
    d.rectangle([(w - lw) / 2, ly, (w + lw) / 2, ly + max(2, h * 0.006)], fill=GOLD)
    if sub:
        f2 = tt("segoeuib.ttf", int(h * sub_ratio))
        tw2 = d.textlength(sub, font=f2)
        d.text(((w - tw2) / 2, ly + h * 0.035), sub, font=f2, fill=(89, 101, 90, 255))
    return im


# logo situs (transparan)
wordmark(360, 226, stroke=20).save(os.path.join(IMG, "logo.webp"), "WEBP", quality=92, method=6)
wordmark(360, 226, stroke=20).save(os.path.join(IMG, "logo.png"), "PNG")

# gambar OG (latar krem)
wordmark(900, 565, 0.34, sub="PT ORIGIN EKA MANUFAKTUR", bg=(251, 250, 245, 255), fill=GREEN
         ).convert("RGB").save(os.path.join(IMG, "logo-og.png"), "PNG")

# favicon: monogram L di kotak hijau
fav = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
d = ImageDraw.Draw(fav)
d.rounded_rectangle([2, 2, 62, 62], radius=14, fill=GREEN)
f = tt("georgiab.ttf", 42)
tw = d.textlength("L", font=f)
d.text(((64 - tw) / 2 - 1, 6), "L", font=f, fill=(251, 250, 245, 255))
fav.save(os.path.join(IMG, "favicon.png"), "PNG")

# label pengiriman worker
lab = wordmark(360, 226, stroke=20, bg=(255, 255, 255, 255))
lab.save(os.path.join(ROOT, "worker", "logo-label.png"), "PNG")
b64 = base64.b64encode(open(os.path.join(ROOT, "worker", "logo-label.png"), "rb").read()).decode()
with io.open(os.path.join(ROOT, "worker", "logo-label.b64.js"), "w", encoding="utf-8", newline="") as fh:
    fh.write('// Logo label pengiriman (placeholder ELEMENTIA). Ganti dengan logo resmi bila tersedia.\n')
    fh.write('export const LOGO_B64 = "data:image/png;base64,%s";\n' % b64)

print("logo dibuat: logo.webp, logo.png, logo-og.png, favicon.png, logo-label.png/b64")
