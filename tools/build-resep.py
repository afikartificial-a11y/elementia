"""Ubah Resep_Halal_Elementia_Top2.md menjadi data/resep-halal.json.

Setiap bahan yang cocok dengan produk ELEMENTIA diberi tag + tautan ke laman produk.
"""
import io, json, os, re

ROOT = r"D:\Home\Grok Bot\elementia"
SRC = r"C:\Users\afikd\Downloads\Resep_Halal_Elementia_Top2.md"
OUT = os.path.join(ROOT, "data", "resep-halal.json")

VARIAN = {
    "Lada Putih Butir": ("lada-putih", "Butir"),
    "Lada Putih Bubuk": ("lada-putih", "Bubuk"),
    "Lada Hitam Butir": ("lada-hitam", "Butir"),
    "Lada Hitam Pecah": ("lada-hitam", "Pecah"),
    "Lada Hitam Bubuk": ("lada-hitam", "Bubuk"),
    "Kunyit Kering": ("kunyit", "Kering"),
    "Kunyit Bubuk": ("kunyit", "Bubuk"),
    "Sereh Kering": ("sereh", "Kering"),
    "Sereh Bubuk": ("sereh", "Bubuk"),
    "Daun Salam Kering": ("daun-salam", "Kering"),
    "Daun Salam Bubuk": ("daun-salam", "Bubuk"),
    "Gula Aren Balok": ("gula-aren", "Balok"),
    "Gula Aren Semut": ("gula-aren", "Semut"),
    "Gula Aren Cair": ("gula-aren", "Cair"),
    "Gula Kelapa Balok": ("gula-kelapa", "Balok"),
    "Gula Kelapa Semut": ("gula-kelapa", "Semut"),
    "Gula Kelapa Cair": ("gula-kelapa", "Cair"),
    "Cabai Kasar": ("cabai", "Kasar"),
    "Cabai Bubuk": ("cabai", "Bubuk"),
    "Bawang Putih Goreng": ("bawang-putih", "Goreng"),
    "Bawang Putih Bubuk": ("bawang-putih", "Bubuk"),
    "Ketumbar Butir": ("ketumbar", "Butir"),
    "Ketumbar Bubuk": ("ketumbar", "Bubuk"),
    "Kemiri Utuh": ("kemiri", "Utuh"),
    "Kemiri Bubuk": ("kemiri", "Bubuk"),
}

# frasa bahan -> kunci varian (dicocokkan dari yang terpanjang)
TAG = {
    "lada putih butir": "Lada Putih Butir",
    "lada putih bubuk": "Lada Putih Bubuk",
    "lada hitam butir": "Lada Hitam Butir",
    "lada hitam pecah": "Lada Hitam Pecah",
    "lada hitam bubuk": "Lada Hitam Bubuk",
    "kunyit kering": "Kunyit Kering",
    "kunyit bubuk": "Kunyit Bubuk",
    "sereh kering": "Sereh Kering",
    "sereh bubuk": "Sereh Bubuk",
    "daun salam kering": "Daun Salam Kering",
    "daun salam bubuk": "Daun Salam Bubuk",
    "gula aren balok": "Gula Aren Balok",
    "gula aren semut": "Gula Aren Semut",
    "gula aren cair": "Gula Aren Cair",
    "gula kelapa balok": "Gula Kelapa Balok",
    "gula kelapa semut": "Gula Kelapa Semut",
    "gula kelapa cair": "Gula Kelapa Cair",
    "cabai kasar": "Cabai Kasar",
    "cabai bubuk": "Cabai Bubuk",
    "bawang putih goreng": "Bawang Putih Goreng",
    "bawang putih bubuk": "Bawang Putih Bubuk",
    "ketumbar butir": "Ketumbar Butir",
    "ketumbar bubuk": "Ketumbar Bubuk",
    "kemiri utuh": "Kemiri Utuh",
    "kemiri bubuk": "Kemiri Bubuk",
}

PHRASES = sorted(TAG.keys(), key=len, reverse=True)


def tags_for(text):
    low = re.sub(r"\s+", " ", text.lower())
    out, used = [], set()
    for p in PHRASES:
        if p in low and p not in used:
            key = TAG[p]
            slug, var = VARIAN[key]
            out.append({"label": key, "komoditas": slug, "varian": var})
            used.add(p)
    return out


def clean(s):
    return re.sub(r"\s+", " ", s).strip()


def slugify(s):
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def main():
    raw = io.open(SRC, encoding="utf-8").read()
    lines = raw.splitlines()

    recipes, cur_var, cur = [], None, None
    mode = None
    for ln in lines:
        t = ln.rstrip()
        m2 = re.match(r"^## \d+\.\s+(.+)$", t)
        if m2:
            cur_var = clean(m2.group(1))
            cur = None
            mode = None
            continue
        if t.startswith("## "):          # bagian catatan / ringkasan
            cur_var = None
            cur = None
            mode = None
            continue
        m3 = re.match(r"^###\s+(.+)$", t)
        if m3 and cur_var:
            judul_raw = clean(m3.group(1))
            porsi = "2 porsi"
            mp = re.search(r"\(([^)]*porsi[^)]*)\)", judul_raw, re.I)
            if mp:
                porsi = clean(mp.group(1))
                judul_raw = clean(judul_raw.replace(mp.group(0), ""))
            cur = {
                "slug": slugify(cur_var + " " + judul_raw),
                "judul": judul_raw,
                "varian_nama": cur_var,
                "komoditas": VARIAN[cur_var][0],
                "varian": VARIAN[cur_var][1],
                "waktu": "",
                "porsi": porsi,
                "bahan": [],
                "langkah": [],
                "tips": "",
            }
            recipes.append(cur)
            mode = "head"
            continue
        if cur is None:
            continue

        mt = re.match(r"^\*\*Waktu:\*\*\s*(.+)$", t)
        if mt:
            cur["waktu"] = clean(mt.group(1))
            mode = "head"
            continue
        if t.startswith("**Bahan:**"):
            mode = "bahan"
            continue
        if t.startswith("**Langkah:**"):
            mode = "langkah"
            continue
        if t.startswith("**Tips:**"):
            cur["tips"] = clean(t.replace("**Tips:**", ""))
            mode = None
            continue
        if t.startswith("---") or t.startswith("**Bahan (") or t.startswith("**Waktu:") or t.startswith("**Catatan"):
            continue

        if mode == "bahan" and t.startswith("- "):
            item = clean(t[2:])
            # pisahkan kuantitas di depan
            mq = re.match(r"^([\d\.,/]+\s*(?:g|kg|ml|liter|sdm|sdt|siung|ruas|lembar|batang|butir|potong|cangkir|bungkus|papan|bonggol|iris|tomat|pisang|kentang|tusuk|toples)?)\s+(.*)$", item)
            qty, nama = (mq.group(1), mq.group(2)) if mq else ("", item)
            cur["bahan"].append({"q": qty, "nama": nama, "tags": tags_for(nama)})
            continue
        if mode == "langkah" and re.match(r"^\d+\.\s", t):
            cur["langkah"].append(clean(re.sub(r"^\d+\.\s*", "", t)))
            continue

    data = {
        "sumber": "Resep_Halal_Elementia_Top2.md",
        "jumlah": len(recipes),
        "resep": recipes,
    }
    io.open(OUT, "w", encoding="utf-8", newline="").write(
        json.dumps(data, ensure_ascii=False, indent=1))

    tagged = sum(1 for r in recipes for b in r["bahan"] if b["tags"])
    print("resep:", len(recipes), "| bahan bertag:", tagged)
    for r in recipes[:2]:
        print(" -", r["judul"], "|", r["waktu"], "|", len(r["bahan"]), "bahan")
        for b in r["bahan"]:
            if b["tags"]:
                print("    *", b["nama"][:50], "->", [t["label"] for t in b["tags"]])


if __name__ == "__main__":
    main()
