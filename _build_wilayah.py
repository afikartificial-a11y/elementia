"""Bangun data wilayah (provinsi -> kabupaten/kota -> kecamatan -> kode pos)
dari CSV ichadhr/db-wilayah-indonesia. Output: assets/data/wilayah/"""
import csv, io, json, os

SRC = r"D:\Home\Grok Bot\elementia\_wilayah"
OUT = r"D:\Home\Grok Bot\elementia\assets\data\wilayah"

# Samakan dengan label yang sudah dipakai situs & database (kompatibilitas alamat lama).
NAMA_PROV = {
    "Sumatra Utara": "Sumatera Utara",
    "Sumatra Barat": "Sumatera Barat",
    "Sumatra Selatan": "Sumatera Selatan",
    "Daerah Khusus Ibukota Jakarta": "DKI Jakarta",
    "Daerah Istimewa Yogyakarta": "DI Yogyakarta",
}


def rows(name):
    with io.open(os.path.join(SRC, name), encoding="utf-8-sig") as fh:
        return list(csv.DictReader(fh))


prov = rows("tbl_provinsi.csv")
kab = rows("tbl_kabkot.csv")
kec = rows("tbl_kecamatan.csv")
kel = rows("tbl_kelurahan.csv")

# kode pos per kecamatan (urut, unik)
kp = {}
for r in kel:
    kode = (r["kd_pos"] or "").strip()
    if len(kode) == 5 and kode.isdigit():
        kp.setdefault(int(r["kecamatan_id"]), set()).add(kode)

kec_by_kab = {}
for r in kec:
    kec_by_kab.setdefault(int(r["kabkot_id"]), []).append({
        "id": int(r["id"]),
        "nama": r["kecamatan"].strip(),
        "kodepos": sorted(kp.get(int(r["id"]), [])),
    })

kab_by_prov = {}
for r in kab:
    kab_by_prov.setdefault(int(r["provinsi_id"]), []).append({
        "id": int(r["id"]),
        "nama": r["kabupaten_kota"].strip(),
        "kecamatan": kec_by_kab.get(int(r["id"]), []),
    })

os.makedirs(OUT, exist_ok=True)

# Pemekaran Papua (UU 15/2022 & 29/2022): provinsi baru memakai kabupaten yang sudah ada.
SPLIT = {
    35: ("Papua Selatan", 33, ["Kabupaten Asmat", "Kabupaten Boven Digoel", "Kabupaten Mappi", "Kabupaten Merauke"]),
    36: ("Papua Tengah", 33, ["Kabupaten Deiyai (Deliyai)", "Kabupaten Dogiyai", "Kabupaten Intan Jaya",
                              "Kabupaten Mimika", "Kabupaten Nabire", "Kabupaten Paniai",
                              "Kabupaten Puncak", "Kabupaten Puncak Jaya"]),
    37: ("Papua Pegunungan", 33, ["Kabupaten Jayawijaya", "Kabupaten Lanny Jaya", "Kabupaten Mamberamo Tengah",
                                  "Kabupaten Nduga", "Kabupaten Pegunungan Bintang", "Kabupaten Tolikara",
                                  "Kabupaten Yahukimo", "Kabupaten Yalimo"]),
    38: ("Papua Barat Daya", 34, ["Kabupaten Maybrat", "Kabupaten Raja Ampat", "Kabupaten Sorong",
                                  "Kabupaten Sorong Selatan", "Kabupaten Tambrauw", "Kota Sorong"]),
}
for nid, (nama, parent, names) in SPLIT.items():
    src = kab_by_prov.get(parent, [])
    moved = [k for k in src if k["nama"] in names]
    kab_by_prov[parent] = [k for k in src if k["nama"] not in names]
    kab_by_prov[nid] = moved

order = [int(p["id"]) for p in prov]
order = order[:34] + [35, 36, 37, 38]
nama_map = {int(p["id"]): NAMA_PROV.get(p["provinsi"].strip(), p["provinsi"].strip()) for p in prov}
nama_map.update({n: v[0] for n, v in SPLIT.items()})

index = []
total_kec = total_kp = 0
for pid in order:
    body = {"id": pid, "nama": nama_map[pid], "kabkot": kab_by_prov.get(pid, [])}
    index.append({"id": pid, "nama": nama_map[pid]})
    for k in body["kabkot"]:
        total_kec += len(k["kecamatan"])
        total_kp += sum(len(x["kodepos"]) for x in k["kecamatan"])
    with io.open(os.path.join(OUT, "%d.json" % pid), "w", encoding="utf-8", newline="") as fh:
        json.dump(body, fh, ensure_ascii=False, separators=(",", ":"))

with io.open(os.path.join(OUT, "index.json"), "w", encoding="utf-8", newline="") as fh:
    json.dump({"provinsi": index}, fh, ensure_ascii=False, separators=(",", ":"))

print("provinsi", len(index), "kecamatan", total_kec, "kode-pos", total_kp)
print(" | ".join("%s(%d)" % (p["nama"], p["id"]) for p in index))
