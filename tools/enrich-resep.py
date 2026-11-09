"""Lengkapi data resep: judul dengan varian, nama berkas gambar, lalu buat gambar dummy 1200x675."""
import io, json, os
from PIL import Image, ImageDraw, ImageFont

ROOT = r"D:\Home\Grok Bot\elementia"
P = os.path.join(ROOT, "data", "resep-halal.json")
IMG = os.path.join(ROOT, "assets", "img", "resep-halal")

KOM = {
    "lada-putih": "Lada Putih", "lada-hitam": "Lada Hitam", "kunyit": "Kunyit",
    "sereh": "Sereh", "daun-salam": "Daun Salam", "gula-aren": "Gula Aren",
    "gula-kelapa": "Gula Kelapa", "cabai": "Cabai", "bawang-putih": "Bawang Putih",
    "ketumbar": "Ketumbar", "kemiri": "Kemiri",
}

INK = (51, 51, 51)
COPPER = (184, 115, 51)
MUT = (120, 120, 120)
LINE = (230, 230, 230)


def font(size, bold=False):
    for name in (("seguisb.ttf", "arialbd.ttf") if bold else ("segoeui.ttf", "arial.ttf")):
        p = os.path.join(r"C:\Windows\Fonts", name)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def wrap(d, text, fnt, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=fnt) <= maxw:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def main():
    d = json.load(io.open(P, encoding="utf-8"))
    os.makedirs(IMG, exist_ok=True)
    for r in d["resep"]:
        nama = KOM[r["komoditas"]]
        j = r["judul"]
        low = j.lower()
        if nama.lower() in low:
            i = low.index(nama.lower())
            lengkap = j[:i] + nama + " " + r["varian"] + j[i + len(nama):]
        else:
            lengkap = j + " — " + nama + " " + r["varian"]
        r["judul_lengkap"] = lengkap
        r["img"] = "resep-halal/" + r["slug"] + ".webp"

        W, H = 1200, 675
        im = Image.new("RGB", (W, H), (255, 255, 255))
        dr = ImageDraw.Draw(im)
        dr.rectangle([0, 0, W, 6], fill=COPPER)
        dr.rectangle([60, 60, W - 60, H - 60], outline=LINE, width=2)

        f_tag = font(22, True)
        dr.text((90, 96), "FOTO DUMMY", font=f_tag, fill=COPPER)

        f_title = font(44, True)
        lines = wrap(dr, lengkap, f_title, W - 200)
        y = H // 2 - (len(lines) * 56) // 2 - 10
        for ln in lines[:3]:
            tw = dr.textlength(ln, font=f_title)
            dr.text(((W - tw) / 2, y), ln, font=f_title, fill=INK)
            y += 56

        f_sub = font(22)
        sub = "foto asli menyusul"
        sw = dr.textlength(sub, font=f_sub)
        dr.text(((W - sw) / 2, y + 18), sub, font=f_sub, fill=MUT)
        im.save(os.path.join(IMG, r["slug"] + ".webp"), "WEBP", quality=86, method=6)

    io.open(P, "w", encoding="utf-8", newline="").write(json.dumps(d, ensure_ascii=False, indent=1))
    print("resep dilengkapi:", len(d["resep"]), "| gambar:", len(os.listdir(IMG)))
    for r in d["resep"][:3]:
        print(" -", r["judul_lengkap"])


if __name__ == "__main__":
    main()
