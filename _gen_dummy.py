import io, os

OUT = r"D:\Home\Grok Bot\elementia-v2\assets\img\produk"

# slug, label komoditas, varian, warna aksen
ITEMS = [
    ("kunyit-kering", "KUNYIT", "Kering", "#B8791B"),
    ("kunyit-bubuk", "KUNYIT", "Bubuk", "#B8791B"),
    ("sereh-kering", "SEREH", "Kering", "#5C7A32"),
    ("sereh-bubuk", "SEREH", "Bubuk", "#5C7A32"),
    ("daun-salam-kering", "DAUN SALAM", "Kering", "#2F5233"),
    ("daun-salam-bubuk", "DAUN SALAM", "Bubuk", "#2F5233"),
    ("gula-aren-balok", "GULA AREN", "Balok", "#7A4A22"),
    ("gula-aren-semut", "GULA AREN", "Semut", "#7A4A22"),
    ("gula-aren-cair", "GULA AREN", "Cair", "#7A4A22"),
    ("gula-kelapa-balok", "GULA KELAPA", "Balok", "#8A5A2B"),
    ("gula-kelapa-semut", "GULA KELAPA", "Semut", "#8A5A2B"),
    ("gula-kelapa-cair", "GULA KELAPA", "Cair", "#8A5A2B"),
    ("cabai-kasar", "CABAI", "Kasar", "#A3231E"),
    ("cabai-bubuk", "CABAI", "Bubuk", "#A3231E"),
]

TPL = """<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="Foto dummy {kom} {var}">
  <defs>
    <pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="40" height="40" fill="#F3EEE2"/>
      <circle cx="6" cy="6" r="2.2" fill="{aks}" opacity="0.16"/>
    </pattern>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FBF8F1"/><stop offset="1" stop-color="#EFE8D8"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <rect width="800" height="800" fill="url(#p)"/>
  <circle cx="400" cy="330" r="150" fill="none" stroke="{aks}" stroke-opacity="0.28" stroke-width="2"/>
  <circle cx="400" cy="330" r="112" fill="{aks}" fill-opacity="0.10"/>
  <text x="400" y="318" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="{aks}">ELEMENTIA</text>
  <text x="400" y="356" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#6B6252" letter-spacing="3">FOTO DUMMY</text>
  <text x="400" y="560" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="700" fill="#1F3A2A" letter-spacing="2">{kom}</text>
  <text x="400" y="606" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="{aks}" letter-spacing="6">{VAR}</text>
  <text x="400" y="690" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#8A8172">Foto produk menyusul</text>
</svg>
"""

n = 0
for slug, kom, var, aks in ITEMS:
    svg = TPL.format(kom=kom, VAR=var.upper(), var=var, aks=aks)
    path = os.path.join(OUT, "dummy-%s.svg" % slug)
    io.open(path, "w", encoding="utf-8", newline="").write(svg)
    n += 1
print("SVG dummy dibuat:", n)
