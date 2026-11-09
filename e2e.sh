#!/usr/bin/env bash
# Uji end-to-end API toko. Pakai: ./e2e.sh BASE_URL ADMIN_PASSWORD_FILE
set -euo pipefail
B=${1:-http://127.0.0.1:8787}; APW=$(cat "${2:-/dev/null}" 2>/dev/null || echo "")
J=/tmp/bk_e2e_jar; A=/tmp/bk_e2e_admin; rm -f $J $A
EM="uji+$(date +%s)@contoh.id"; H=(-H 'content-type: application/json' -H "origin: $B")
step(){ echo; echo "== $1"; }
step "config";   curl -s $B/api/config; echo
step "register (ingat saya)"; curl -s -i -c $J "${H[@]}" -d "{\"name\":\"Uji Coba\",\"email\":\"$EM\",\"phone\":\"081234567890\",\"password\":\"RahasiaUji123\",\"remember\":true}" $B/api/register | grep -iE '^HTTP|^set-cookie|"ok"' | sed -E 's/bk_sess=[^;]+/bk_sess=<redacted>/'
step "logout";   curl -s -b $J -c $J "${H[@]}" -X POST -d '{}' $B/api/logout; echo
step "login salah"; curl -s "${H[@]}" -d "{\"email\":\"$EM\",\"password\":\"salah\"}" $B/api/login; echo
step "login + ingat saya"; curl -s -i -c $J "${H[@]}" -d "{\"email\":\"$EM\",\"password\":\"RahasiaUji123\",\"remember\":true}" $B/api/login | grep -iE '^HTTP|^set-cookie' | sed -E 's/bk_sess=[^;]+/bk_sess=<redacted>/'
step "login tanpa ingat saya (cookie sesi, tanpa Max-Age)"; curl -s -i "${H[@]}" -d "{\"email\":\"$EM\",\"password\":\"RahasiaUji123\"}" $B/api/login | grep -i '^set-cookie' | sed -E 's/bk_sess=[^;]+/bk_sess=<redacted>/'
step "me";       curl -s -b $J $B/api/me; echo
step "merge keranjang tamu"; curl -s -b $J "${H[@]}" -d '{"cart":{"ph-pouch-100:bubuk":2,"hi-grinder-50:butir":1,"palsu:x":5}}' $B/api/cart/merge; echo
step "ongkir";   curl -s -b $J "${H[@]}" -d '{"cart":{"ph-pouch-100:bubuk":2,"hi-grinder-50:butir":1},"provinsi":"DKI Jakarta","kode_pos":"12190"}' $B/api/shipping/rates; echo
step "checkout (total klien diabaikan)"
R=$(curl -s -b $J -c $J "${H[@]}" -d '{"cart":{"ph-pouch-100:bubuk":2,"hi-grinder-50:butir":1},"total":1000,"name":"Uji Coba","phone":"081234567890","email":"'$EM'","provinsi":"DKI Jakarta","kota":"Jakarta Selatan","kecamatan":"Kebayoran Baru","kode_pos":"12190","alamat":"Jl. Uji Coba No. 1","catatan":"tes","courier":"jne:reg","save_address":true}' $B/api/checkout); echo "$R"
OID=$(echo "$R" | python3 -c 'import sys,json;print(json.load(sys.stdin)["order_id"])'); TOK=$(echo "$R" | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
step "bayar simulasi"; curl -s "${H[@]}" -d "{\"order_id\":\"$OID\",\"token\":\"$TOK\",\"method\":\"qris\"}" $B/api/payment/mock; echo
step "bayar ulang (harus ditolak)"; curl -s "${H[@]}" -d "{\"order_id\":\"$OID\",\"token\":\"$TOK\"}" $B/api/payment/mock; echo
step "akun: riwayat pesanan"; curl -s -b $J $B/api/account/orders | python3 -c 'import sys,json;d=json.load(sys.stdin);[print(o["id"],o["status"],o["subtotal"],o["shipping_cost"],o["total"]) for o in d["orders"]]'
step "alamat tersimpan"; curl -s -b $J $B/api/me | python3 -c 'import sys,json;d=json.load(sys.stdin);print(len(d["addresses"]),"alamat;",d["addresses"][0]["alamat"] if d["addresses"] else "")'
step "admin tanpa login"; curl -s $B/api/admin/orders; echo
step "admin login"; curl -s -c $A "${H[@]}" -d "{\"password\":\"$APW\"}" $B/api/admin/login; echo
step "admin daftar"; curl -s -b $A $B/api/admin/orders | python3 -c 'import sys,json;d=json.load(sys.stdin);print(len(d["orders"]),"pesanan; terbaru:",d["orders"][0]["id"],d["orders"][0]["status"])'
step "admin ubah status dikirim + resi"; curl -s -b $A "${H[@]}" -d '{"status":"dikirim","resi":"JNE-UJI-0001"}' $B/api/admin/orders/$OID; echo
step "pelanggan lihat status"; curl -s -b $J $B/api/orders/$OID | python3 -c 'import sys,json;o=json.load(sys.stdin)["order"];print(o["id"],o["status"],o["resi"],o["total"])'
step "rate limit login (6x salah)"; for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w '%{http_code} ' "${H[@]}" -d "{\"email\":\"$EM\",\"password\":\"x\"}" $B/api/login; done; echo
echo "$OID" > /tmp/bk_e2e_oid; rm -f $J $A
