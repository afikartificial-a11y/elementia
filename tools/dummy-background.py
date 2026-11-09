"""Gambar dummy untuk foto yang dipakai sebagai LATAR (hero/cover).

Varian ini tanpa teks besar di tengah supaya tidak menabrak judul hero;
hanya label kecil di pojok. Ukuran mengikuti berkas asli di archive/img-asli/.
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = r"D:\Home\Grok Bot\elementia"
FOTO = os.path.join(ROOT, "assets", "img", "foto")
BAK = os.path.join(ROOT, "archive", "img-asli", "foto")

DARK = (255, 255, 255)
DARK2 = (247, 247, 247)
GOLD = (184, 115, 51)
CREAM = (251, 250, 245)


def font(size, bold=False):
    for n in (("segoeuib.ttf", "arialbd.ttf") if bold else ("segoeui.ttf", "arial.ttf")):
        p = os.path.join(r"C:\Windows\Fonts", n)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def make(src, dst):
    w, h = Image.open(src).size
    im = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(im)
    # gradien diagonal hijau tua
    for y in range(h):
        t = y / max(1, h - 1)
        c = tuple(int(DARK[i] + (DARK2[i] - DARK[i]) * t) for i in range(3))
        d.line([(0, y), (w, y)], fill=c)
    # garis emas tipis di tepi atas
    d.rectangle([0, 0, w, max(2, int(h * 0.004))], fill=GOLD)

    # Tanpa teks: latar dipakai di belakang judul hero, teks akan terpotong oleh object-fit.
    # Status placeholder ditandai lewat alt teks di HTML dan dokumentasi proyek.
    im.save(dst, "WEBP", quality=80, method=4)
    return w, h


n = 0
TARGET = ["kebun-aerial.webp", "kebun-aerial-1200.webp", "kebun-jalan.webp",
          "petani-kebun.webp", "petani-panen.webp", "menanam-bibit.webp", "sulur-lada.webp"]
for f in TARGET:
    if not os.path.exists(os.path.join(FOTO, f)):
        continue
    src = os.path.join(BAK, f)
    if not os.path.exists(src):
        src = os.path.join(FOTO, f)
    w, h = make(src, os.path.join(FOTO, f))
    n += 1
    print("  %-24s %dx%d" % (f, w, h))
print("latar dummy dibuat:", n)
