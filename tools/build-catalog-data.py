"""Bangun data katalog ELEMENTIA dari ringkasan produk:
50 SKU (25 varian x 2 kemasan), simbol periodik, nama Inggris, harga ritel."""
import io, json, os

ROOT = r"D:\Home\Grok Bot\elementia"
G = "Botol Grinder"
S = "Botol Shaker"
P = "Pouch"
B = "Botol"

# (no, komoditas, varian, nama_en, elemen, [(jenis, gram, harga), ...])
ROWS = [
    (1, "Lada Putih", "Butir", "White Pepper Whole", [(G, 55, 45000), (P, 250, 125000)]),
    (2, "Lada Putih", "Bubuk", "White Pepper Powder", [(S, 70, 30000), (P, 250, 140000)]),
    (3, "Lada Hitam", "Butir", "Black Pepper Whole", [(G, 50, 45000), (P, 250, 120000)]),
    (4, "Lada Hitam", "Pecah", "Black Pepper Cracked", [(S, 65, 30000), (P, 250, 130000)]),
    (5, "Lada Hitam", "Bubuk", "Black Pepper Powder", [(S, 65, 30000), (P, 250, 130000)]),
    (6, "Kunyit", "Kering", "Turmeric Dried", [(P, 50, 10000), (P, 250, 20000)]),
    (7, "Kunyit", "Bubuk", "Turmeric Powder", [(P, 50, 10000), (P, 250, 20000)]),
    (8, "Sereh", "Kering", "Lemongrass Dried", [(P, 50, 10000), (P, 250, 20000)]),
    (9, "Sereh", "Bubuk", "Lemongrass Powder", [(P, 50, 10000), (P, 250, 20000)]),
    (10, "Daun Salam", "Kering", "Bay Leaf Dried", [(P, 50, 10000), (P, 250, 20000)]),
    (11, "Daun Salam", "Bubuk", "Bay Leaf Powder", [(P, 50, 10000), (P, 250, 20000)]),
    (12, "Gula Aren", "Balok", "Palm Sugar Block", [(P, 250, 10000), (P, 1000, 35000)]),
    (13, "Gula Aren", "Semut", "Palm Sugar Granulated", [(P, 50, 7500), (P, 250, 15000)]),
    (14, "Gula Aren", "Cair", "Palm Sugar Liquid", [(B, 150, 7500), (B, 500, 35000)]),
    (15, "Gula Kelapa", "Balok", "Coconut Sugar Block", [(P, 250, 10000), (P, 1000, 35000)]),
    (16, "Gula Kelapa", "Semut", "Coconut Sugar Granulated", [(P, 50, 7500), (P, 250, 15000)]),
    (17, "Gula Kelapa", "Cair", "Coconut Sugar Liquid", [(B, 150, 7500), (B, 500, 35000)]),
    (18, "Cabai", "Kasar", "Chili Coarse", [(P, 50, 12500), (P, 250, 22000)]),
    (19, "Cabai", "Bubuk", "Chili Powder", [(P, 50, 12500), (P, 250, 22000)]),
    (20, "Bawang Putih", "Goreng", "Garlic Fried", [(P, 50, 15000), (P, 250, 25000)]),
    (21, "Bawang Putih", "Bubuk", "Garlic Powder", [(P, 50, 15000), (P, 250, 25000)]),
    (22, "Ketumbar", "Butir", "Coriander Whole", [(P, 50, 10000), (P, 250, 20000)]),
    (23, "Ketumbar", "Bubuk", "Coriander Powder", [(P, 50, 10000), (P, 250, 20000)]),
    (24, "Kemiri", "Utuh", "Candlenut Whole", [(P, 50, 12000), (P, 250, 22000)]),
    (25, "Kemiri", "Bubuk", "Candlenut Powder", [(P, 50, 12000), (P, 250, 22000)]),
]

# meta per komoditas: slug, nama_en, simbol, aksen, nama latin
META = {
    "Lada Putih": ("lada-putih", "White Pepper", "Wp", "#B8A88C", "Piper nigrum"),
    "Lada Hitam": ("lada-hitam", "Black Pepper", "Bp", "#2A3B45", "Piper nigrum"),
    "Kunyit": ("kunyit", "Turmeric", "Tr", "#C98A2E", "Curcuma longa"),
    "Sereh": ("sereh", "Lemongrass", "Lg", "#7E9A5A", "Cymbopogon citratus"),
    "Daun Salam": ("daun-salam", "Bay Leaf", "Bl", "#6B7F52", "Syzygium polyanthum"),
    "Gula Aren": ("gula-aren", "Palm Sugar", "Ps", "#A9713F", "Arenga pinnata"),
    "Gula Kelapa": ("gula-kelapa", "Coconut Sugar", "Cs", "#8C6239", "Cocos nucifera"),
    "Cabai": ("cabai", "Chili", "Ch", "#C2452D", "Capsicum annuum"),
    "Bawang Putih": ("bawang-putih", "Garlic", "Gf", "#C9B79A", "Allium sativum"),
    "Ketumbar": ("ketumbar", "Coriander", "Co", "#9AA37A", "Coriandrum sativum"),
    "Kemiri": ("kemiri", "Candlenut", "Cn", "#B08968", "Aleurites moluccanus"),
}

# ---- harga-2026.json ----
h = json.load(io.open(os.path.join(ROOT, "data", "harga-2026.json"), encoding="utf-8"))
order = [k["nama"] for k in h["komoditas"]]
by = {}
for no, kom, var, en, pak in ROWS:
    by.setdefault(kom, []).append({"nama": var, "kemasan": [
        {"jenis": j, "gram": g, "harga": p} for j, g, p in pak]})
h["komoditas"] = [{"nama": k, "varian": by[k]} for k in order if k in by]
h["sumber"] = "elementia_product_summary.md (harga ritel, 2 kemasan per varian)"
h["catatan_berat"] = ("berat_g = isi bersih; berat_bruto_g = netto + 10% kemasan (dummy). "
                      "Produk cair (150/500 ml) dihitung 1 ml = 1 g.")
io.open(os.path.join(ROOT, "data", "harga-2026.json"), "w", encoding="utf-8", newline="").write(
    json.dumps(h, ensure_ascii=False, indent=1))
print("harga:", len(h["komoditas"]), "komoditas,", sum(len(k["varian"]) for k in h["komoditas"]), "varian,",
      sum(len(v["kemasan"]) for k in h["komoditas"] for v in k["varian"]), "SKU")

# ---- katalog-v3.json ----
v3 = json.load(io.open(os.path.join(ROOT, "data", "katalog-v3.json"), encoding="utf-8"))
num_of = {}
for no, kom, var, en, pak in ROWS:
    num_of.setdefault(kom, {})[var] = no

for k in v3["komoditas"]:
    nama = k["nama"]
    slug, en, sym, aksen, latin = META[nama]
    var_rows = [r for r in ROWS if r[1] == nama]
    k["nama_en"] = en
    k["simbol"] = sym
    k["latin"] = latin
    k["nomor"] = min(r[0] for r in var_rows)
    k["img"] = "elemen-" + slug
    k["aksen"] = aksen
    k["harga_mulai"] = min(p for r in var_rows for _, _, p in r[4])
    k["bentuk"] = [r[2] for r in var_rows]
    kem = []
    for r in var_rows:
        for j, g, _ in r[4]:
            label = ("%d ml" % g) if j == B else ("%d g" % g if g < 1000 else "%d kg" % (g // 1000))
            if label not in kem:
                kem.append(label)
    k["kemasan"] = kem
    lama = {v["nama"]: v for v in k["varian"]}
    baru = []
    for r in var_rows:
        v = {"nama": r[2], "img": k["img"], "ket": lama.get(r[2], {}).get("ket", "")}
        v["nama_en"] = r[3]
        v["nomor"] = r[0]
        baru.append(v)
    k["varian"] = baru

v3["_catatan"] = ("Katalog ELEMENTIA: 11 komoditas, 25 varian, 50 SKU. Simbol periodik "
                  "mengikuti elementia_product_summary.md.")
io.open(os.path.join(ROOT, "data", "katalog-v3.json"), "w", encoding="utf-8", newline="").write(
    json.dumps(v3, ensure_ascii=False, indent=1))
print("katalog-v3 diperbarui:", len(v3["komoditas"]), "komoditas")

# ---- pricelist-2027.json ----
pl = []
for k in order:
    if k not in by:
        continue
    slug, en, sym, aksen, latin = META[k]
    varian = []
    for v in by[k]:
        for km in v["kemasan"]:
            ukuran = ("%d ml" % km["gram"]) if km["jenis"] == B else (
                "%d g" % km["gram"] if km["gram"] < 1000 else "%d kg" % (km["gram"] // 1000))
            varian.append({
                "bentuk": v["nama"],
                "ukuran": ukuran,
                "kemasan": km["jenis"],
                "harga": km["harga"],
                "img": "elemen-" + slug,
            })
    pl.append({
        "id": slug,
        "jenis": k,
        "jenis_en": en,
        "simbol": sym,
        "asal": "",
        "kemasan": "Botol / Pouch",
        "judul_pdf": "%s — %s" % (k, en),
        "segmen": "eceran",
        "varian": varian,
    })
io.open(os.path.join(ROOT, "data", "pricelist-2027.json"), "w", encoding="utf-8", newline="").write(
    json.dumps({"sumber": "elementia_product_summary.md", "produk": pl}, ensure_ascii=False, indent=1))
print("pricelist:", len(pl), "produk")
