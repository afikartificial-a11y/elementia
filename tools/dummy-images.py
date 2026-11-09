"""Ganti foto kebun/tanaman dan foto kemasan bermerek lama dengan gambar dummy.
Ukuran asli dipertahankan agar tata letak tidak bergeser. Asli dipindah ke archive/img-asli/."""
import io, os, re, shutil
from PIL import Image, ImageDraw, ImageFont

ROOT = r"D:\Home\Grok Bot\elementia"
IMG = os.path.join(ROOT, "assets", "img")
BAK = os.path.join(ROOT, "archive", "img-asli")

BG = (238, 244, 227)
LINE = (199, 214, 178)
INK = (27, 94, 50)
MUT = (89, 101, 90)
ACC = (163, 35, 30)


def font(size, bold=False):
    for name in (("segoeuib.ttf", "arialbd.ttf") if bold else ("segoeui.ttf", "arial.ttf")):
        p = os.path.join(r"C:\Windows\Fonts", name)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def human(fn):
    s = os.path.splitext(fn)[0]
    s = re.sub(r"[_-]+", " ", s).strip()
    return s[:46]


def dummy(src, label):
    im = Image.open(src)
    w, h = im.size
    im.close()
    canvas = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(canvas)
    pad = max(8, int(min(w, h) * 0.035))
    d.rounded_rectangle([pad, pad, w - pad, h - pad], radius=max(6, int(min(w, h) * 0.02)),
                        outline=LINE, width=max(2, int(min(w, h) * 0.006)))
    d.rectangle([pad, pad, w - pad, pad + max(4, int(h * 0.012))], fill=ACC)

    base = min(w, h)
    f1 = font(max(11, int(base * 0.075)), True)
    f2 = font(max(9, int(base * 0.052)))
    f3 = font(max(8, int(base * 0.042)))

    def center(text, y, fnt, fill):
        tw = d.textbbox((0, 0), text, font=fnt)[2]
        d.text(((w - tw) / 2, y), text, font=fnt, fill=fill)
        return d.textbbox((0, 0), text, font=fnt)[3] - d.textbbox((0, 0), text, font=fnt)[1]

    h1 = center("FOTO DUMMY", h * 0.36, f1, ACC)
    center(label, h * 0.36 + h1 + base * 0.045, f2, INK)
    center("foto asli menyusul", h * 0.36 + h1 + base * 0.045 + base * 0.09, f3, MUT)

    canvas.save(src, "WEBP", quality=82, method=4)


targets = []
foto = ["kebun-aerial.webp", "kebun-aerial-1200.webp", "kebun-jalan.webp",
        "petani-kebun.webp", "petani-panen.webp", "menanam-bibit.webp", "sulur-lada.webp"]
for f in foto:
    p = os.path.join(IMG, "foto", f)
    if os.path.exists(p):
        targets.append((p, "Suasana kebun & tanaman lada"))

prod = os.path.join(IMG, "produk")
if os.path.isdir(prod):
    for f in sorted(os.listdir(prod)):
        if f.lower().endswith(".webp") and not f.lower().startswith("beras"):
            targets.append((os.path.join(prod, f), "Foto kemasan produk"))

pl = os.path.join(IMG, "pricelist")
if os.path.isdir(pl):
    for f in sorted(os.listdir(pl)):
        if f.lower().endswith(".webp"):
            targets.append((os.path.join(pl, f), "Daftar harga"))

done = 0
for path, label in targets:
    rel = os.path.relpath(path, ROOT)
    bak = os.path.join(BAK, os.path.relpath(path, IMG))
    os.makedirs(os.path.dirname(bak), exist_ok=True)
    shutil.copy2(path, bak)
    dummy(path, label)
    done += 1

print("gambar dummy dibuat:", done)
print("asli disimpan di:", os.path.relpath(BAK, ROOT))
