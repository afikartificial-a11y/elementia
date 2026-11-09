import io, json, re
import openpyxl

SRC = r"D:\Home\Grok Bot\Varian Produk.xlsx"
OUT = r"D:\Home\Grok Bot\elementia-v2\data\harga-2026.json"

wb = openpyxl.load_workbook(SRC, data_only=True)
ws = wb.active

rows = []
for r in ws.iter_rows(min_row=3, values_only=True):
    if not r or not r[1]:
        continue
    kom, var = str(r[1]).strip(), str(r[2]).strip()
    kem = []
    for i in range(4):
        jenis = r[3 + i * 3]; gram = r[4 + i * 3]; harga = r[5 + i * 3]
        if not jenis or not gram or harga is None:
            continue
        kem.append({"jenis": str(jenis).strip(), "gram": int(gram), "harga": int(harga)})
    rows.append({"komoditas": kom, "varian": var, "kemasan": kem})

# kelompokkan per komoditas
kom = []
for r in rows:
    if not kom or kom[-1]["nama"] != r["komoditas"]:
        kom.append({"nama": r["komoditas"], "varian": []})
    kom[-1]["varian"].append({"nama": r["varian"], "kemasan": r["kemasan"]})

out = {
    "sumber": "Varian Produk.xlsx — harga termasuk PPN",
    "catatan_berat": "berat_g = berat bersih; sistem menambahkan 5% untuk kemasan",
    "komoditas": kom,
}
io.open(OUT, "w", encoding="utf-8", newline="").write(json.dumps(out, ensure_ascii=False, indent=2) + "\n")

n_var = sum(len(k["varian"]) for k in kom)
n_sku = sum(len(v["kemasan"]) for k in kom for v in k["varian"])
print("komoditas:", len(kom), "| varian:", n_var, "| SKU:", n_sku)
for k in kom[:2]:
    print(k["nama"], "->", [(v["nama"], [(x["jenis"], x["gram"], x["harga"]) for x in v["kemasan"]]) for v in k["varian"]][:1])
