# usage: upload.sh <result-file-with-jwt-and-buckets>
F=$1; J=$(python3 -c "import re;print(re.search(r'cfwau_[A-Za-z0-9._-]+',open('$F').read()).group(0))")
python3 - "$F" > /tmp/up_args <<'PY'
import json,re,sys
t=open(sys.argv[1]).read(); h2f=json.load(open('/tmp/hash2file.json'))
for h in re.findall(r'"([0-9a-f]{32})"',t): print(h, h2f[h])
PY
ARGS=(); while read h f; do case "$f" in *.css) T=text/css;; *.js) T=application/javascript;; *.html) T=text/html;; *.svg) T=image/svg+xml;; *.png) T=image/png;; *.webp) T=image/webp;; *.jpg|*.jpeg) T=image/jpeg;; *.json) T=application/json;; *.txt) T=text/plain;; *.xml) T=application/xml;; *.woff2) T=font/woff2;; *) T=application/octet-stream;; esac
 base64 -w0 ${PUBLIC_DIR:-./dist/public}$f > /tmp/b64_$h; ARGS+=(-F "$h=</tmp/b64_$h;type=$T"); echo "$f $T"; done < /tmp/up_args
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID:?set CF_ACCOUNT_ID}/workers/assets/upload?base64=true" -H "Authorization: Bearer $J" "${ARGS[@]}" | python3 -c "import sys,json;print('upload success',json.load(sys.stdin)['success'])"
