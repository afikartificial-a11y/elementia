"""Rakit folder deploy: public/ (aset statis) + worker.js (API, katalog harga di-embed dari pricelist)."""
import os, shutil, json, glob, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "dist")
pub = os.path.join(OUT, "public")
shutil.rmtree(pub, ignore_errors=True); os.makedirs(pub)
for f in glob.glob(os.path.join(ROOT, "*.html")) + [os.path.join(ROOT, "robots.txt"), os.path.join(ROOT, "sitemap.xml")]:
    shutil.copy(f, pub)
shutil.copytree(os.path.join(ROOT, "assets"), os.path.join(pub, "assets"))
cat = json.load(open(os.path.join(ROOT, "assets", "data", "catalog.json")))
src = open(os.path.join(ROOT, "worker", "worker.src.js")).read()
src = src.replace("/* __CATALOG__ */", "const CATALOG = " + json.dumps(cat, ensure_ascii=False) + ";")
import subprocess
W = os.path.join(ROOT, "worker"); entry = os.path.join(W, "_entry.js"); open(entry, "w").write(src)
ESBUILD = os.path.join(W, "build", "node_modules", "esbuild", "bin", "esbuild")  # lewat node: portabel Windows/Linux
subprocess.run(["node", ESBUILD, entry, "--bundle", "--format=esm", "--platform=neutral", "--main-fields=module,main", "--minify-syntax", "--outfile=" + os.path.join(OUT, "worker.js"), "--log-level=warning"], check=True, env={**os.environ, "NODE_PATH": os.path.join(W, "build", "node_modules")})
os.remove(entry)
shutil.copy(os.path.join(ROOT, "worker", "schema.sql"), OUT)
shutil.copy(os.path.join(ROOT, "worker", "wrangler.jsonc"), OUT)
print("assembled ->", OUT)
