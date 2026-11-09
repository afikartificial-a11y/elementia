"""Susun tabel tarif per provinsi (1 kg & 3 kg, harga tampil setelah diskon).

Resolusi provinsi memakai ID kelurahan dari ringkasan 1 kg (otoritatif), karena
beberapa record mentah punya label kota tertukar (mis. label "Palembang" berisi
ID Padang). Output: data/tarif-provinsi-2026-11.json
"""
import io, json, os, re

SRC = r"C:\Users\afikd\AccioWork\2026-11-05-16-00-21-425-a25f23c2\ref\kiriminaja"
OUT = r"D:\Home\Grok Bot\elementia\data\tarif-provinsi-2026-11.json"

KOTA_PROV = {
    "Banda Aceh": "Aceh", "Medan": "Sumatera Utara", "Padang": "Sumatera Barat",
    "Pekanbaru": "Riau", "Jambi": "Jambi", "Palembang": "Sumatera Selatan",
    "Bengkulu": "Bengkulu", "Bandar Lampung": "Lampung",
    "Pangkal Pinang": "Kepulauan Bangka Belitung", "PangkalPinang": "Kepulauan Bangka Belitung", "Batam": "Kepulauan Riau",
    "Jakarta Selatan": "DKI Jakarta", "Bandung": "Jawa Barat",
    "Semarang": "Jawa Tengah", "Yogyakarta": "DI Yogyakarta",
    "Surabaya": "Jawa Timur", "Serang": "Banten", "Denpasar": "Bali",
    "Mataram": "Nusa Tenggara Barat", "Kupang": "Nusa Tenggara Timur",
    "Pontianak": "Kalimantan Barat", "Palangka Raya": "Kalimantan Tengah",
    "Palangkaraya": "Kalimantan Tengah", "Banjarmasin": "Kalimantan Selatan",
    "Balikpapan": "Kalimantan Timur", "Tarakan": "Kalimantan Utara",
    "Manado": "Sulawesi Utara", "Palu": "Sulawesi Tengah",
    "Makassar": "Sulawesi Selatan", "Kendari": "Sulawesi Tenggara",
    "Gorontalo": "Gorontalo", "Mamuju": "Sulawesi Barat", "Ambon": "Maluku",
    "Ternate": "Maluku Utara", "Jayapura": "Papua", "Sorong": "Papua Barat",
}
KODE = {"jne": "jne:reg", "jnt": "jnt:ez", "sicepat": "sicepat:reg", "spx": "spx:std"}

# ---- 1. ID kelurahan -> provinsi (dari ringkasan 1 kg) ----
summ = json.load(io.open(os.path.join(SRC, "rates-2026-11-07-summary.json"), encoding="utf-8"))
ID2PROV = {}
for c in summ["data"]:
    parts = [p.strip() for p in c["destination"].split(",")]
    kota = parts[-2]
    prov = KOTA_PROV.get(kota)
    if prov:
        ID2PROV[str(c["destination_kelurahan_id"])] = prov
print("ID terverifikasi:", len(ID2PROV))


def pick(items, svc):
    """Ambil satu layanan inti -> (harga bersih, etd)."""
    cands = []
    for x in items:
        s = (x.get("service") or "").lower()
        n = (x.get("service_name") or "").strip()
        u = n.upper()
        if svc == "jne":
            ok = s == "jne" and ("REGULER" in u or "CITY TO CITY" in u) and "YES" not in u
        elif svc == "jnt":
            ok = s == "jnt" and (u == "J&T EZ" or u == "EZ")
        elif svc == "sicepat":
            ok = s == "sicepat" and "REGULER" in u and "CARGO" not in u
        else:
            ok = s == "spx" and "STANDARD" in u
        if not ok:
            continue
        disc = int((x.get("discount_campaign") or {}).get("discount") or 0)
        cost = int(x.get("cost") or 0) - disc
        if cost <= 0:
            continue
        cands.append((cost, (x.get("etd") or "").strip(), "CITY TO CITY" in u))
    if not cands:
        return None
    # JNE: utamakan Reguler, City to City hanya bila Reguler tidak ada
    cands.sort(key=lambda c: (c[2], c[0]))
    return cands[0][0], cands[0][1]


bucket = {}   # prov -> weight -> svc -> (harga, etd, jumlah_layanan)
for fn in ["rates-2026-11-07.json", "rates-3kg-2026-11-07.json",
           "rates-extra-2026-11-07.json", "rates-3kg-extra-2026-11-07.json"]:
    for r in json.load(io.open(os.path.join(SRC, fn), encoding="utf-8")):
        body = r.get("req") or {}
        if not isinstance(body, dict):
            try:
                body = json.loads(body)
            except Exception:
                continue
        weight = int(body.get("weight") or 0)
        if weight not in (1000, 3000):
            continue
        thru = str(body.get("thru") or "")
        label = re.sub(r"-\d{4}$", "", (r.get("dest") or "").strip())
        prov = ID2PROV.get(thru) or KOTA_PROV.get(label)
        if not prov:
            continue
        items = r["json"].get("data") or []
        for svc in KODE:
            got = pick(items, svc)
            if not got:
                continue
            slot = bucket.setdefault(prov, {}).setdefault(weight, {})
            cur = slot.get(svc)
            if cur is None or len(items) > cur[2]:
                slot[svc] = (got[0], got[1], len(items))

# ---- 2. 1 kg dari snapshot awal (hanya untuk 6 kota zona) ----
snap = json.load(io.open(r"D:\Home\Grok Bot\elementia\data\kiriminaja-parcel-2026-11-07.json", encoding="utf-8"))
for t in snap["tujuan"]:
    prov = KOTA_PROV.get(t["kota"])
    if not prov:
        continue
    items = []
    for l in t["layanan"]:
        eks = (l.get("ekspedisi") or "").lower()
        eks = "jnt" if eks in ("j&t", "jnt") else ("spx" if "spx" in eks or "shopee" in eks else eks)
        items.append({"service": eks, "service_name": "%s %s" % (l.get("ekspedisi"), l.get("layanan")),
                      "cost": l.get("harga"), "etd": (l.get("etd") or "").replace(" Hari", ""),
                      "discount_campaign": {"discount": 0}})
    slot = bucket.setdefault(prov, {}).setdefault(1000, {})
    for svc in KODE:
        if svc in slot:
            continue
        got = pick(items, svc)
        if got:
            slot[svc] = (got[0], got[1], 99)

# ---- 3. rakit tabel ----
out = {"sumber": "https://kiriminaja.com/cekaja",
       "asal": "Tegalluar, Bojongsoang, Bandung 40288", "tanggal": "2026-11-08",
       "catatan": "harga = tarif tampil (setelah diskon kampanye); r1 = 1 kg, r3 = 3 kg, inc = biaya tiap kg tambahan",
       "provinsi": {}}
for prov, w in sorted(bucket.items()):
    p1, p3 = w.get(1000, {}), w.get(3000, {})
    rates = {}
    for svc, code in KODE.items():
        if svc not in p1:
            continue
        r1, e1 = p1[svc][0], p1[svc][1]
        if svc in p3 and p3[svc][0] > r1:
            r3 = p3[svc][0]
            inc = int(round((r3 - r1) / 2 / 50.0) * 50)
            est = False
        else:
            r3 = None
            inc = int(round(r1 / 50.0) * 50)   # tanpa data 3 kg: linear per kg
            est = True
        rates[code] = {"r1": r1, "r3": r3, "inc": inc, "etd": e1, "est": est}
    if rates:
        out["provinsi"][prov] = {"kota_uji": (p1 and None) or None, "rates": rates}

json.dump(out, io.open(OUT, "w", encoding="utf-8", newline=""), ensure_ascii=False, indent=1)

print("provinsi terisi: %d/34" % len(out["provinsi"]))
print("%-26s %-34s %-22s" % ("PROVINSI", "JNE 1kg/3kg/inc", "J&T / SiCepat / SPX (1kg)"))
for prov, v in out["provinsi"].items():
    r = v["rates"]
    j = r.get("jne:reg") or {}
    g = lambda c: (r[c]["r1"] if c in r else "-")
    print("%-26s %6s %6s %6s %-3s | %6s %6s %6s" % (
        prov[:26], j.get("r1", "-"), j.get("r3", "-"), j.get("inc", "-"), "est" if j.get("est") else "",
        g("jnt:ez"), g("sicepat:reg"), g("spx:std")))
print("belum terisi:", [p for p in KOTA_PROV.values() if p not in out["provinsi"]])
