#!/usr/bin/env bash
# Uji v4: notifikasi WA admin, pengingat cron, pesan via WA, cargo >5kg, tolak tanpa-kurir. Pakai: ./e2e-v4.sh BASE ADMIN_PW_FILE
set -uo pipefail
B=$1; APW=$(cat "$2"); A=/tmp/bk4_admin; rm -f $A
H=(-H 'content-type: application/json' -H "origin: $B")
ADDR='"name":"Uji WA","phone":"081234567890","email":"ujiwa@contoh.id","provinsi":"Jawa Tengah","kota":"Kota Semarang","kecamatan":"Tembalang","kode_pos":"50275","alamat":"Jl. Prof. Soedarto No. 10, RT 02/RW 05","catatan":"Pagar hijau"'
step(){ echo; echo "== $1"; }
codes(){ python3 -c 'import sys,json;d=json.load(sys.stdin);print("berat",d["weight_g"],"g ->",[(r["code"],r.get("price")) for r in d["rates"]])'; }
step "ongkir ±4,7 kg (cargo TIDAK muncul)"; curl -s "${H[@]}" -d '{"cart":{"ph-plastik-1kg:bubuk":4,"ph-pouch-100:bubuk":5},"provinsi":"Jawa Tengah","kode_pos":"50275"}' $B/api/shipping/rates | codes
step "ongkir 25 kg (cargo muncul)"; curl -s "${H[@]}" -d '{"cart":{"ph-25kg:butir":1,"ph-pouch-100:bubuk":1},"provinsi":"Jawa Tengah","kode_pos":"50275"}' $B/api/shipping/rates | codes
step "checkout online dgn 'langsung:bukara' (harus DITOLAK)"; curl -s -w ' [HTTP %{http_code}]' "${H[@]}" -d '{"cart":{"ph-pouch-100:bubuk":1},'"$ADDR"',"courier":"langsung:bukara"}' $B/api/checkout; echo
step "pesan via WA (alamat kosong -> ditolak)"; curl -s -w ' [HTTP %{http_code}]' "${H[@]}" -d '{"cart":{"ph-pouch-100:bubuk":1},"name":"X"}' $B/api/order-wa; echo
step "pesan via WA"; R=$(curl -s "${H[@]}" -d '{"cart":{"ph-pouch-100:bubuk":2,"ph-25kg:butir":1},'"$ADDR"'}' $B/api/order-wa)
echo "$R" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("order:",d["order_id"]);print("wa_url:",d["wa_url"][:60]+"...");print("--- pesan ---");print(d["message"]);import re;bad=[w for w in ["JNE","J&T","SiCepat","Cargo","Ongkos","ongkir","Kurir","kurir"] if w in d["message"]];print("--- kata kurir/ongkir ditemukan:",bad or "TIDAK ADA")' | tee /tmp/bk4_wamsg.txt
WOID=$(grep '^order:' /tmp/bk4_wamsg.txt | awk '{print $2}')
step "checkout online + bayar simulasi -> notifikasi 'paid'"
R=$(curl -s "${H[@]}" -d '{"cart":{"ph-25kg:butir":1},'"$ADDR"',"courier":"cargo:dakota"}' $B/api/checkout); echo "$R" | cut -c1-200
OID=$(echo "$R" | python3 -c 'import sys,json;print(json.load(sys.stdin)["order_id"])'); TOK=$(echo "$R" | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
curl -s "${H[@]}" -d "{\"order_id\":\"$OID\",\"token\":\"$TOK\",\"method\":\"qris\"}" $B/api/payment/mock; echo
step "admin login"; curl -s -c $A "${H[@]}" -d "{\"password\":\"$APW\"}" $B/api/admin/login; echo
step "log notifikasi untuk $OID"; curl -s -b $A $B/api/admin/notifications | python3 -c "import sys,json;d=json.load(sys.stdin);n=[x for x in d['notifications'] if x['order_id']=='$OID'];print(len(n),'notif');[print(x['kind'],x['provider'],x['status'],'->',x['target']) for x in n];print('--- pesan admin ---');print(n[-1]['message'])" | tee /tmp/bk4_adminmsg.txt
step "jalankan logika cron sekarang (baru dibayar -> tidak ada pengingat)"; curl -s -b $A "${H[@]}" -X POST -d '{}' $B/api/admin/reminders/run; echo
step "mundurkan waktu bayar 3 jam (khusus mode uji)"; curl -s -b $A "${H[@]}" -d "{\"id\":\"$OID\",\"hours\":3}" $B/api/admin/test/backdate; echo
step "jalankan logika cron -> pengingat terkirim (mock)"; curl -s -b $A "${H[@]}" -X POST -d '{}' $B/api/admin/reminders/run; echo
step "jalankan lagi -> tidak dobel (jeda 2 jam)"; curl -s -b $A "${H[@]}" -X POST -d '{}' $B/api/admin/reminders/run; echo
step "pesan pengingat"; curl -s -b $A $B/api/admin/notifications | python3 -c "import sys,json;d=json.load(sys.stdin);n=[x for x in d['notifications'] if x['order_id']=='$OID' and x['kind']=='reminder'];print(n[0]['message'].splitlines()[0])"
step "admin daftar: alert, channel, pengiriman"; curl -s -b $A $B/api/admin/orders | python3 -c "import sys,json;d=json.load(sys.stdin);print('provider:',d['wa_provider'],'| dibayar menunggu:',sum(o['status']=='dibayar' for o in d['orders']));[print(o['id'],o['channel'],o['status'],'|',o['courier_service'],'| wa_admin_url' if o.get('wa_admin_url') else '') for o in d['orders'] if o['id'] in ('$OID','$WOID')]"
step "admin proses -> dikirim (keluar dari alert & cron)"; curl -s -b $A "${H[@]}" -d '{"status":"dikirim","resi":"DAKOTA-UJI-01"}' $B/api/admin/orders/$OID; echo
curl -s -b $A "${H[@]}" -d "{\"id\":\"$OID\",\"hours\":5}" $B/api/admin/test/backdate; curl -s -b $A "${H[@]}" -X POST -d '{}' $B/api/admin/reminders/run; echo
rm -f $A
