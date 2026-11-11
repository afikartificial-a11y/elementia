/* elementia shop.js v20261111a */
/* ELEMENTIA toko: keranjang (localStorage + akun), checkout, akun, pembayaran simulasi, admin */
(function () {
  var KEY = 'bk_cart_v1', CAT = null, ME = undefined;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var rp = function (n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var STAT = { baru: 'Menunggu pembayaran', menunggu_wa: 'Menunggu konfirmasi WA', dibayar: 'Dibayar', dikirim: 'Dikirim', selesai: 'Selesai', batal: 'Dibatalkan' };
  var LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  // Pesan kegagalan yang bisa ditindaklanjuti. Dulu semua kegagalan non-JSON (404/501/5xx,
  // termasuk halaman dibuka dari server file statis) diringkas jadi "Respon tidak valid",
  // sehingga tidak jelas apakah salah isian, server mati, atau API tidak ada di alamat itu.
  function apiFail(status) {
    if (!status) return 'Tidak bisa menghubungi server. Periksa koneksi Anda, lalu coba lagi.';
    if (status === 404 || status === 405 || status === 410 || status === 501) {
      return LOCAL
        ? 'Server API tidak aktif di alamat ini (HTTP ' + status + '). Halaman sedang dibuka dari server file statis. Jalankan "node tools-dev.mjs" lalu buka http://127.0.0.1:8787, atau buka situs yang sudah di-deploy.'
        : 'Layanan pesanan belum aktif di alamat ini (HTTP ' + status + '). Silakan pesan lewat WhatsApp.';
    }
    if (status >= 500) return 'Server sedang bermasalah (HTTP ' + status + '). Coba lagi beberapa saat, atau pesan lewat WhatsApp.';
    return 'Respons server tidak dikenali (HTTP ' + status + '). Coba lagi, atau pesan lewat WhatsApp.';
  }
  function api(path, opt) {
    opt = opt || {}; var o = { method: opt.method || 'GET', credentials: 'same-origin', headers: {} };
    if (opt.body !== undefined) { o.headers['content-type'] = 'application/json'; o.body = JSON.stringify(opt.body); }
    return fetch(path, o).then(function (r) {
      return r.text().then(function (txt) {
        var d = null;
        try { d = JSON.parse(txt); } catch (e) { d = null; }
        if (!d || typeof d !== 'object') d = { ok: false, error: apiFail(r.status), _nonjson: true };
        d._status = r.status;
        return d;
      });
    }).catch(function () { return { ok: false, _status: 0, error: apiFail(0) }; });
  }
  function getCart() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function setCart(c, skipSync) {
    localStorage.setItem(KEY, JSON.stringify(c)); badge();
    if (!skipSync && ME && ME.user) api('/api/cart', { method: 'PUT', body: { cart: c } });
  }
  function count(c) { return Object.keys(c).reduce(function (a, k) { return a + c[k]; }, 0); }
  function badge() { var n = count(getCart()); $$('[data-cart-count]').forEach(function (b) { b.textContent = n; b.hidden = !n; }); document.dispatchEvent(new CustomEvent('bk:cart')); }
  function catalog() { return CAT || (CAT = fetch('assets/data/catalog.json').then(function (r) { return r.json(); }).then(function (d) { var m = {}; d.items.forEach(function (i) { m[i.sku] = i; }); return m; })); }
  function me() {
    if (ME !== undefined) return Promise.resolve(ME);
    return api('/api/me').then(function (d) {
      ME = d.ok ? d : { user: null };
      if (ME.user) {
        $$('[data-account-label]').forEach(function (l) { l.textContent = ME.user.name.split(' ')[0]; });
        var local = getCart();
        if (Object.keys(local).length) return api('/api/cart/merge', { method: 'POST', body: { cart: local } }).then(function (r) { if (r.ok) setCart(r.cart, true); return ME; });
        setCart(ME.cart || {}, true);
      }
      return ME;
    }).catch(function () { ME = { user: null }; return ME; });
  }
  function toast(msg) {
    var t = $('#bk-toast'); if (!t) { t = document.createElement('div'); t.id = 'bk-toast'; t.className = 'bk-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.innerHTML = msg; t.classList.add('is-on'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('is-on'); }, 3200);
  }
  // Tombol "Beli"
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add-sku]'); if (!b) return;
    var c = getCart(), k = b.getAttribute('data-add-sku'); c[k] = Math.min(99, (c[k] || 0) + 1); setCart(c);
    catalog().then(function (m) { toast('<strong>' + esc(m[k] ? m[k].nama : 'Produk') + '</strong> ditambahkan. <a href="keranjang.html">Lihat keranjang →</a>'); });
  });
  function waCart(m, c) {
    var lines = Object.keys(c).filter(function (k) { return m[k]; }).map(function (k) { return '- ' + m[k].nama + ' x' + c[k] + ' (' + rp(m[k].harga * c[k]) + ')'; });
    return 'https://wa.me/6289527358906?text=' + encodeURIComponent('Halo ELEMENTIA, saya ingin memesan:\n' + lines.join('\n') + '\nAlamat kirim: ...');
  }
  function lines(m, c) {
    var sub = 0, w = 0, rows = Object.keys(c).filter(function (k) { return m[k]; }).map(function (k) { var i = m[k]; sub += i.harga * c[k]; w += i.berat_g * c[k]; return { i: i, q: c[k] }; });
    return { rows: rows, sub: sub, w: w };
  }
  function fmtW(g) { return g >= 1000 ? (g / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' kg' : g + ' g'; }

  // ---------- Keranjang ----------
  function pageCart() {
    var root = $('#cart-list'); if (!root) return;
    function render() {
      catalog().then(function (m) {
        var c = getCart(), L = lines(m, c);
        if (!L.rows.length) { root.innerHTML = '<div class="bk-empty"><p>Keranjang Anda masih kosong.</p><a class="wp-block-button__link" href="produk.html">Lihat produk</a></div>'; $('#to-checkout').classList.add('is-disabled'); $('#to-checkout').setAttribute('aria-disabled', 'true'); }
        else { $('#to-checkout').classList.remove('is-disabled'); $('#to-checkout').removeAttribute('aria-disabled');
          root.innerHTML = '<ul class="bk-cart">' + L.rows.map(function (r) {
            return '<li class="bk-cart__row"><img src="' + esc(r.i.img) + '" alt="" width="80" height="80"><div class="bk-cart__info"><strong>' + esc(r.i.nama) + '</strong><small>' + esc(r.i.ukuran) + ' · ' + rp(r.i.harga) + '</small></div>' +
              '<div class="bk-qty" role="group" aria-label="Jumlah ' + esc(r.i.nama) + '"><button type="button" data-q="-1" data-k="' + r.i.sku + '" aria-label="Kurangi">−</button><input type="number" min="1" max="99" value="' + r.q + '" data-k="' + r.i.sku + '" aria-label="Jumlah"><button type="button" data-q="1" data-k="' + r.i.sku + '" aria-label="Tambah">+</button></div>' +
              '<div class="bk-cart__line">' + rp(r.i.harga * r.q) + '</div><button type="button" class="bk-cart__del" data-del="' + r.i.sku + '" aria-label="Hapus ' + esc(r.i.nama) + '">×</button></li>';
          }).join('') + '</ul>'; }
        $('#cart-subtotal').textContent = rp(L.sub); $('#cart-weight').textContent = fmtW(L.w);
        $('#cart-wa').href = L.rows.length ? waCart(m, c) : $('#cart-wa').href;
      });
    }
    root.addEventListener('click', function (e) {
      var c = getCart(), t = e.target;
      if (t.dataset.q) { var k = t.dataset.k; c[k] = Math.max(1, Math.min(99, (c[k] || 0) + (+t.dataset.q))); setCart(c); render(); }
      if (t.dataset.del) { delete c[t.dataset.del]; setCart(c); render(); }
    });
    root.addEventListener('change', function (e) { if (e.target.dataset.k) { var c = getCart(); c[e.target.dataset.k] = Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1)); setCart(c); render(); } });
    $('#to-checkout').addEventListener('click', function (e) { if (this.classList.contains('is-disabled')) e.preventDefault(); });
    me().then(render);
  }

  // ---------- Checkout ----------
  function pageCheckout() {
    var f = $('#checkout-form'); if (!f) return;
    var chosen = null, rates = [], subtotal = 0, M = null;
    function showErr(t) { var e = $('#co-error'); e.textContent = t || ''; e.hidden = !t; }
    function totals() { $('#co-subtotal').textContent = rp(subtotal); var r = rates.filter(function (x) { return x.code === chosen; })[0]; $('#co-ship').textContent = r ? rp(r.price) : '—'; $('#co-total').textContent = rp(subtotal + (r ? r.price : 0)); }
    function summary() {
      var c = getCart(), L = lines(M, c); subtotal = L.sub;
      if (!L.rows.length) { location.href = 'keranjang.html'; return; }
      $('#co-items').innerHTML = '<ul class="bk-mini">' + L.rows.map(function (r) { return '<li><span>' + esc(r.i.nama) + ' <small>×' + r.q + '</small></span><span>' + rp(r.i.harga * r.q) + '</span></li>'; }).join('') + '</ul><p class="bk-muted" style="font-size:13px">Berat kirim ± ' + fmtW(L.w) + '</p>';
      totals();
    }
    // ---- Wilayah bertingkat: provinsi -> kabupaten/kota -> kecamatan -> kode pos ----
    var WIL = {}, CUR = null;
    function optHtml(v, t) { return '<option value="' + esc(v) + '">' + esc(t) + '</option>'; }
    function resetSel(el, txt) { el.innerHTML = '<option value="">' + esc(txt) + '</option>'; el.disabled = true; }
    function fillSel(el, list, txt, valOf, labelOf) {
      el.innerHTML = '<option value="">' + esc(txt) + '</option>' + list.map(function (x) {
        return optHtml(valOf ? valOf(x) : x.nama, labelOf ? labelOf(x) : x.nama);
      }).join('');
      el.disabled = !list.length;
    }
    function provJson(id) {
      if (WIL[id]) return Promise.resolve(WIL[id]);
      return fetch('/assets/data/wilayah/' + id + '.json').then(function (r) {
        if (!r.ok) throw new Error('wilayah'); return r.json();
      }).then(function (d) { WIL[id] = d; return d; });
    }
    function provIdOf(nama) {
      var o = [].filter.call(f.provinsi.options, function (x) { return x.value.toLowerCase() === String(nama || '').trim().toLowerCase(); })[0];
      if (o) f.provinsi.value = o.value;
      return o ? o.getAttribute('data-id') : '';
    }
    function kabOf(nama) { return (CUR && CUR.kabkot.filter(function (x) { return x.nama === nama; })[0]) || null; }
    function kecOf(k, nama) { return (k && k.kecamatan.filter(function (x) { return x.nama === nama; })[0]) || null; }
    var WAIT_TXT = 'Pilih provinsi, kabupaten/kota, kecamatan, dan kode pos untuk melihat ongkir.';
    function clearRateState() {
      rates = []; chosen = null;
      $('#rates').innerHTML = '<p class="bk-muted">' + WAIT_TXT + '</p>';
      $('#rate-mode').textContent = '';
      totals();
    }
    function fillKp(c) {
      fillSel(f.kode_pos, c.kodepos.map(function (k) { return { nama: k }; }), 'Pilih kode pos');
      if (c.kodepos.length === 1) { f.kode_pos.value = c.kodepos[0]; loadRates(); }
      else if (c.kodepos.length > 1) { f.kode_pos.focus(); }
    }
    function onProv() {
      resetSel(f.kota, 'Memuat…'); resetSel(f.kecamatan, 'Pilih kabupaten dulu'); resetSel(f.kode_pos, 'Pilih kecamatan dulu');
      CUR = null; clearRateState();
      var o = f.provinsi.selectedOptions[0], id = o && o.getAttribute('data-id');
      if (!id) { resetSel(f.kota, 'Pilih provinsi dulu'); return; }
      provJson(id).then(function (d) { CUR = d; fillSel(f.kota, d.kabkot, 'Pilih kabupaten/kota'); })
        .catch(function () { resetSel(f.kota, 'Gagal memuat daftar wilayah'); showErr('Daftar wilayah gagal dimuat. Periksa koneksi lalu pilih provinsi lagi.'); });
    }
    var tmr;
    function loadRates() {
      var prov = f.provinsi.value, kp = f.kode_pos.value.trim();
      if (!prov || !/^\d{5}$/.test(kp)) { clearRateState(); return; }
      $('#rates').innerHTML = '<p class="bk-muted">Menghitung ongkir…</p>';
      api('/api/shipping/rates', { method: 'POST', body: { cart: getCart(), provinsi: prov, kode_pos: kp } }).then(function (d) {
        if (!d.ok) { $('#rates').innerHTML = '<p class="bk-error">' + esc(d.error) + '</p>'; return; }
        rates = d.rates; subtotal = d.subtotal;
        $('#rate-mode').innerHTML = d.mode === 'biteship'
      ? 'Tarif langsung dari kurir via Biteship. Berat dihitung ' + d.kg + ' kg.'
      : '<span class="bk-badge-sim">ACUAN</span> Tarif acuan KiriminAja (7 Nov 2026) — bukan tarif real-time, ongkir final dikonfirmasi admin. Berat dihitung ' + d.kg + ' kg.';
        rates = rates.filter(function (r) { return r.price != null || r.disabled; });
        if (!rates.some(function (r) { return r.code === chosen && !r.disabled; })) chosen = rates[0] && rates[0].code;
        var G = { kurir: 'Kurir reguler', cargo: 'Cargo — pesanan di atas 5 kg', langsung: 'Tanpa kurir' }, last = null;
        $('#rates').innerHTML = rates.map(function (r) {
          var h = '';
          if (r.group !== last && r.group !== 'kurir') h = '<div class="bk-rate-group">' + G[r.group] + (r.group === 'cargo' ? ' <span class="bk-badge-sim">PERKIRAAN</span>' : '') + '</div>';
          last = r.group;
          if (r.disabled) return h + '<label class="bk-rate is-disabled" data-wa-only title="Khusus pesanan via WhatsApp"><input type="radio" name="courier_x" disabled aria-disabled="true"><span><strong>' + esc(r.label) + '</strong><small class="bk-rate-note">' + esc(r.note) + '</small></span><b>Pesan via WA →</b></label>';
          return h + '<label class="bk-rate"><input type="radio" name="courier" value="' + esc(r.code) + '"' + (r.code === chosen ? ' checked' : '') + '><span><strong>' + esc(r.label) + '</strong><small>Estimasi ' + esc(r.etd) + (r.note ? ' · ' + esc(r.note) : '') + '</small></span><b>' + rp(r.price) + '</b></label>';
        }).join('');
        totals();
      });
    }
    f.addEventListener('change', function (e) { if (e.target.name === 'courier') { chosen = e.target.value; totals(); } });
    // ---- Pesan via WhatsApp (tanpa kurir/ongkir; tersimpan sebagai pesanan channel 'whatsapp') ----
    var ADDR = ['name', 'phone', 'email', 'provinsi', 'kota', 'kecamatan', 'kode_pos', 'alamat'];
    function waFlow(direct) {
      showErr('');
      for (var i = 0; i < ADDR.length; i++) { var el = f[ADDR[i]]; if (!el.value.trim() || !el.checkValidity()) { el.focus(); el.reportValidity && el.reportValidity(); showErr('Lengkapi kontak & alamat pengiriman sebelum memesan via WhatsApp.'); return; } }
      if (!/^\d{5}$/.test(f.kode_pos.value.trim())) { f.kode_pos.focus(); showErr('Kode pos harus 5 angka.'); return; }
      var b = { cart: getCart(), courier: direct ? 'langsung:elementia' : '' }; ADDR.concat(['catatan']).forEach(function (k) { b[k] = f[k].value; }); addAddrId(b);
      var btn = $('#co-wa'), w = null; try { w = window.open('', '_blank'); } catch (x) {}
      btn.disabled = true;
      api('/api/order-wa', { method: 'POST', body: b }).then(function (d) {
        btn.disabled = false;
        if (!d.ok) { if (w) w.close(); showErr(d.error); return; }
        localStorage.removeItem(KEY); badge();
        if (w && !w.closed) w.location.href = d.wa_url; else location.href = d.wa_url;
        $('#co-items').innerHTML = '<div class="bk-note"><strong>Pesanan ' + esc(d.order_id) + ' tercatat.</strong><br>Status: menunggu konfirmasi WA. Jika WhatsApp tidak terbuka, <a href="' + esc(d.wa_url) + '" target="_blank" rel="noopener">klik di sini</a>.</div>';
      });
    }
    $('#co-wa').addEventListener('click', function () { waFlow(false); });
    $('#rates').addEventListener('click', function (e) { if (e.target.closest('[data-wa-only]')) { e.preventDefault(); $('#co-wa').scrollIntoView({ behavior: 'smooth', block: 'center' }); waFlow(true); } });
    f.provinsi.addEventListener('change', function () { showErr(''); onProv(); });
    f.kota.addEventListener('change', function () {
      resetSel(f.kecamatan, 'Pilih kecamatan'); resetSel(f.kode_pos, 'Pilih kecamatan dulu'); clearRateState();
      var k = kabOf(f.kota.value);
      if (k) { fillSel(f.kecamatan, k.kecamatan, 'Pilih kecamatan'); if (k.kecamatan.length === 1) { f.kecamatan.value = k.kecamatan[0].nama; fillKp(k.kecamatan[0]); } }
    });
    f.kecamatan.addEventListener('change', function () {
      resetSel(f.kode_pos, 'Pilih kode pos'); clearRateState();
      var c = kecOf(kabOf(f.kota.value), f.kecamatan.value);
      if (c) fillKp(c);
    });
    f.kode_pos.addEventListener('change', function () { clearTimeout(tmr); tmr = setTimeout(loadRates, 150); });
    $('#create-account').addEventListener('change', function () { $('#create-acc-fields').hidden = !this.checked; f.password.required = this.checked; });
    // Cek lebih awal: kalau API tidak hidup, jangan biarkan pembeli mengisi formulir lalu gagal di akhir.
    api('/api/config').then(function (c) {
      if (c && c.ok) return;
      showErr(c.error || 'Layanan pesanan tidak aktif.');
      var sb = $('#co-submit'); if (sb) { sb.disabled = true; sb.textContent = 'Server pesanan tidak aktif'; }
      var acc = $('#create-account'); if (acc) acc.disabled = true;
    });
    var PICK = null; function addAddrId(b) { if (PICK && ['provinsi','kota','kecamatan','kode_pos','alamat'].every(function (k) { return f[k].value.trim() === String(PICK[k] || '').trim(); })) b.address_id = PICK.id; }
    function applyAddress(a) {
      PICK = a && a.id ? a : null;
      if (a.name) f.name.value = a.name;
      if (a.phone) f.phone.value = a.phone;
      f.alamat.value = a.alamat || ''; f.catatan.value = a.catatan || '';
      resetSel(f.kota, 'Memuat…'); resetSel(f.kecamatan, 'Pilih kabupaten dulu'); resetSel(f.kode_pos, 'Pilih kecamatan dulu');
      CUR = null; clearRateState();
      var id = provIdOf(a.provinsi);
      if (!id) { resetSel(f.kota, 'Pilih provinsi dulu'); if (a.provinsi) showErr('Provinsi "' + a.provinsi + '" tidak dikenali — pilih ulang wilayah pengiriman.'); return; }
      provJson(id).then(function (d) {
        CUR = d; fillSel(f.kota, d.kabkot, 'Pilih kabupaten/kota');
        var nm = function (s) { return String(s || '').trim().toLowerCase(); };
        var k = d.kabkot.filter(function (x) { return nm(x.nama) === nm(a.kota); })[0];
        if (!k) { showErr('Kabupaten/kota "' + (a.kota || '') + '" tidak ada di daftar — pilih ulang.'); return; }
        f.kota.value = k.nama; fillSel(f.kecamatan, k.kecamatan, 'Pilih kecamatan');
        var c = k.kecamatan.filter(function (x) { return nm(x.nama) === nm(a.kecamatan); })[0];
        if (!c) { showErr('Kecamatan "' + (a.kecamatan || '') + '" tidak ada di daftar — pilih ulang.'); return; }
        f.kecamatan.value = c.nama; fillSel(f.kode_pos, c.kodepos.map(function (v) { return { nama: v }; }), 'Pilih kode pos');
        var kp = String(a.kode_pos || '').trim();
        if (c.kodepos.indexOf(kp) >= 0) { f.kode_pos.value = kp; loadRates(); }
        else if (c.kodepos.length === 1) { f.kode_pos.value = c.kodepos[0]; loadRates(); }
        else showErr('Kode pos tersimpan tidak cocok dengan kecamatan ' + c.nama + ' — silakan pilih kode pos.');
      }).catch(function () { resetSel(f.kota, 'Gagal memuat wilayah'); });
    }
    Promise.all([catalog(), me()]).then(function (res) {
      M = res[0]; var u = res[1]; summary();
      if (u.user) {
        $('#co-login-hint').innerHTML = 'Masuk sebagai <strong>' + esc(u.user.name) + '</strong> (' + esc(u.user.email) + ').';
        f.name.value = u.user.name; f.email.value = u.user.email; f.phone.value = u.user.phone || '';
        $('#create-acc').hidden = true; $('#save-addr-wrap').hidden = false;
        if (u.addresses && u.addresses.length) {
          $('#saved-addr').hidden = false;
          $('#addr-select').innerHTML = u.addresses.map(function (a, i) { return '<option value="' + i + '">' + esc(a.alamat.slice(0, 40) + ', ' + a.kota + ' ' + a.kode_pos) + '</option>'; }).join('') + '<option value="new">+ Alamat baru</option>';
          $('#addr-select').addEventListener('change', function () { if (this.value === 'new') { applyAddress({ name: u.user.name, phone: u.user.phone }); f.save_address.checked = true; } else { applyAddress(u.addresses[+this.value]); f.save_address.checked = false; } });
          applyAddress(u.addresses[0]); f.save_address.checked = false;
        }
      }
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault(); showErr('');
      if (!f.checkValidity()) { f.reportValidity(); return; }
      if (!f.provinsi.value || !f.kota.value || !f.kecamatan.value || !/^\d{5}$/.test(f.kode_pos.value.trim())) {
        showErr('Lengkapi provinsi, kabupaten/kota, kecamatan, dan kode pos.'); return;
      }
      if (!chosen) { showErr('Pilih kurir pengiriman terlebih dahulu.'); return; }
      var b = { cart: getCart(), courier: chosen };
      ['name', 'phone', 'email', 'provinsi', 'kota', 'kecamatan', 'kode_pos', 'alamat', 'catatan', 'password'].forEach(function (k) { b[k] = f[k].value; });
      addAddrId(b); b.save_address = f.save_address.checked; b.create_account = !ME.user && f.create_account.checked; b.remember = f.remember.checked;
      var btn = $('#co-submit'); btn.disabled = true; btn.textContent = 'Memproses…';
      api('/api/checkout', { method: 'POST', body: b }).then(function (d) {
        if (!d.ok) { showErr(d.error); btn.disabled = false; btn.textContent = 'Buat pesanan & bayar'; return; }
        localStorage.removeItem(KEY); try { sessionStorage.setItem('bk_last_order', JSON.stringify({ id: d.order_id, t: d.token })); } catch (x) {}
        location.href = d.payment_url;
      });
    });
  }

  // ---------- Pembayaran ----------
  function orderSummary(o) {
    return '<div class="bk-panel"><div class="bk-order-head"><div><span class="bk-tag">No. pesanan</span><h2 class="bk-h3">' + esc(o.id) + '</h2></div><span class="bk-status is-' + o.status + '">' + STAT[o.status] + '</span></div>' +
      '<ul class="bk-mini">' + o.items.map(function (i) { return '<li><span>' + esc(i.name) + ' <small>×' + i.qty + '</small></span><span>' + rp(i.line_total) + '</span></li>'; }).join('') +
      '<li><span>Ongkir — ' + esc(o.courier_service) + (o.shipping_mode === 'simulasi' ? ' <span class="bk-badge-sim">SIMULASI</span>' : '') + '</span><span>' + rp(o.shipping_cost) + '</span></li><li class="bk-total"><span>Total</span><span>' + rp(o.total) + '</span></li></ul>' +
      '<p class="bk-muted" style="font-size:14px">Dikirim ke: ' + esc(o.name) + ' (' + esc(o.phone) + ') — ' + esc(o.alamat) + ', ' + esc(o.kecamatan) + ', ' + esc(o.kota) + ', ' + esc(o.provinsi) + ' ' + esc(o.kode_pos) + '</p>' +
      (o.resi ? '<p><strong>No. resi:</strong> ' + esc(o.resi) + '</p>' : '') + '</div>';
  }
  function pagePay() {
    var root = $('#pay-root'); if (!root) return;
    var q = new URLSearchParams(location.search), id = q.get('order'), t = q.get('t') || '';
    function load() {
      api('/api/orders/' + encodeURIComponent(id) + '?t=' + encodeURIComponent(t)).then(function (d) {
        if (!d.ok) { root.innerHTML = '<p class="bk-error">' + esc(d.error) + '</p>'; return; }
        var o = d.order, html = '<div class="bk-shop-grid">' + orderSummary(o);
        if (o.status === 'baru') {
          var M = [['qris', 'QRIS', 'Scan dengan aplikasi bank / e-wallet'], ['va_bca', 'Virtual Account BCA', ''], ['va_bni', 'Virtual Account BNI', ''], ['va_mandiri', 'Mandiri Bill Payment', ''], ['gopay', 'GoPay', ''], ['ovo', 'OVO', ''], ['shopeepay', 'ShopeePay', '']];
          html += '<form class="bk-panel bk-summary" id="pay-form"><h2 class="bk-h3">Pilih metode pembayaran</h2><p><span class="bk-badge-sim">Mode uji coba</span> Simulasi pembayaran — tidak ada dana yang ditarik.</p>' +
            M.map(function (x, i) { return '<label class="bk-rate"><input type="radio" name="method" value="' + x[0] + '"' + (i ? '' : ' checked') + '><span><strong>' + x[1] + '</strong>' + (x[2] ? '<small>' + x[2] + '</small>' : '') + '</span></label>'; }).join('') +
            '<div class="bk-sim-qr" aria-hidden="true">QRIS<br><small>SIMULASI</small></div><p class="bk-error" hidden role="alert"></p><div class="wp-block-button bk-block"><button class="wp-block-button__link" type="submit">Bayar ' + rp(o.total) + ' (simulasi)</button></div></form>';
        } else {
          html += '<div class="bk-panel bk-summary"><h2 class="bk-h3">' + (o.status === 'dibayar' ? 'Pembayaran berhasil ✓' : 'Status: ' + STAT[o.status]) + '</h2><p>Terima kasih! Pesanan Anda sedang kami siapkan. Kami akan mengabari Anda melalui email/WhatsApp ketika pesanan dikirim.</p>' +
            (o.payment_mode === 'simulasi' ? '<p class="bk-muted" style="font-size:13px">Dibayar melalui simulasi (' + esc(o.payment_method || '') + ').</p>' : '') +
            '<div class="wp-block-button bk-block"><a class="wp-block-button__link" href="akun.html">Lihat pesanan saya</a></div><p style="margin-top:12px"><a href="produk.html">Belanja lagi</a></p></div>';
        }
        root.innerHTML = html + '</div>';
        var pf = $('#pay-form'); if (pf) pf.addEventListener('submit', function (e) {
          e.preventDefault(); var btn = pf.querySelector('button'); btn.disabled = true; btn.textContent = 'Memproses…';
          api('/api/payment/mock', { method: 'POST', body: { order_id: id, token: t, method: pf.method.value } }).then(function (r) { if (!r.ok) { var el = pf.querySelector('.bk-error'); el.textContent = r.error; el.hidden = false; btn.disabled = false; return; } load(); });
        });
      });
    }
    if (!id) { root.innerHTML = '<p class="bk-error">Nomor pesanan tidak ditemukan.</p>'; return; }
    me().then(load);
  }

  // ---------- Masuk / daftar ----------
  function next() { var n = new URLSearchParams(location.search).get('next') || 'akun.html'; return /^[a-z0-9-]+\.html$/.test(n) ? n : 'akun.html'; }
  function authForm(sel, path, fields) {
    var f = $(sel); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var er = f.querySelector('.bk-error'); er.hidden = true;
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var b = { remember: f.remember.checked }; fields.forEach(function (k) { b[k] = f[k].value; }); if (path === '/api/register') b.cart = getCart();
      var btn = f.querySelector('button[type=submit]'); btn.disabled = true;
      api(path, { method: 'POST', body: b }).then(function (d) {
        btn.disabled = false;
        if (!d.ok) { er.textContent = d.error; er.hidden = false; return; }
        ME = undefined;
        // beri kesempatan password manager menyimpan kredensial
        if (window.PasswordCredential && b.password) { try { navigator.credentials.store(new PasswordCredential({ id: b.email, password: b.password, name: d.user.name })); } catch (x) {} }
        me().then(function () { location.href = next(); });
      });
    });
  }
  function pageAuth() { if (!$('#login-form')) return; me().then(function (u) { if (u.user) location.replace(next()); }); authForm('#login-form', '/api/login', ['email', 'password']); authForm('#register-form', '/api/register', ['name', 'email', 'phone', 'password']); }

  // ---------- Akun ----------
  function pageAccount() {
    var root = $('#acc-root'); if (!root) return;
    me().then(function (u) {
      if (!u.user) { location.replace('masuk.html?next=akun.html'); return; }
      api('/api/account/orders').then(function (d) {
        var orders = d.orders || [];
        root.innerHTML = '<div class="bk-shop-grid"><div class="bk-panel"><h2 class="bk-h3">Riwayat pesanan</h2>' +
          (orders.length ? orders.map(function (o) {
            return '<details class="bk-order"><summary><span><strong>' + esc(o.id) + '</strong><small>' + new Date(o.created_at * 1000).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + '</small></span><span class="bk-status is-' + o.status + '">' + STAT[o.status] + '</span><b>' + rp(o.total) + '</b></summary>' +
              '<ul class="bk-mini">' + o.items.map(function (i) { return '<li><span>' + esc(i.name) + ' <small>×' + i.qty + '</small></span><span>' + rp(i.line_total) + '</span></li>'; }).join('') + (o.channel === 'whatsapp' ? '<li><span>Pengiriman — ' + esc(o.courier_service) + ' <span class="bk-chan is-wa">via WA</span></span><span>—</span></li>' : '<li><span>Ongkir — ' + esc(o.courier_service) + '</span><span>' + rp(o.shipping_cost) + '</span></li>') + '</ul>' +
              (o.resi ? '<p>No. resi: <strong>' + esc(o.resi) + '</strong></p>' : '') + (o.status === 'baru' ? '<p><a href="bayar.html?order=' + o.id + '">Lanjutkan pembayaran →</a></p>' : '') + '</details>';
          }).join('') : '<p class="bk-muted">Belum ada pesanan. <a href="produk.html">Mulai belanja</a>.</p>') + '</div>' +
          '<aside class="bk-panel bk-summary"><h2 class="bk-h3">Profil</h2><p><strong>' + esc(u.user.name) + '</strong><br>' + esc(u.user.email) + '<br>' + esc(u.user.phone || '') + '</p>' +
          '<h3 class="bk-h4">Alamat tersimpan</h3>' + ((u.addresses || []).length ? '<ul class="bk-addr">' + u.addresses.map(function (a) { return '<li><span>' + esc(a.alamat) + ', ' + esc(a.kecamatan) + ', ' + esc(a.kota) + ', ' + esc(a.provinsi) + ' ' + esc(a.kode_pos) + '</span><button type="button" data-del-addr="' + a.id + '" aria-label="Hapus alamat">Hapus</button></li>'; }).join('') + '</ul>' : '<p class="bk-muted" style="font-size:14px">Alamat tersimpan otomatis saat checkout.</p>') +
          '<div class="wp-block-button is-style-outline bk-block"><button class="wp-block-button__link" type="button" id="logout">Keluar</button></div></aside></div>';
        $('#logout').addEventListener('click', function () { api('/api/logout', { method: 'POST', body: {} }).then(function () { localStorage.removeItem(KEY); location.href = 'masuk.html'; }); });
        $$('[data-del-addr]').forEach(function (b) { b.addEventListener('click', function () { api('/api/addresses/' + b.dataset.delAddr, { method: 'DELETE', body: {} }).then(function () { b.closest('li').remove(); }); }); });
      });
    });
  }

  // ---------- Admin ----------
  function pageAdmin() {
    var root = $('#admin-root'); if (!root) return;
    var WA = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>';
    var leadFilter = '';
    function list() {
      api('/api/admin/orders').then(function (d) {
        if (d._status === 401) return;
        var paid = d.orders.filter(function (o) { return o.status === 'dibayar'; }), waq = d.orders.filter(function (o) { return o.status === 'menunggu_wa'; });
        var ago = function (t) { var m = Math.floor((Date.now() / 1000 - t) / 60); return m < 60 ? m + ' menit lalu' : Math.floor(m / 60) + ' jam lalu'; };

        var alert = '<section class="bk-alert" role="alert" aria-live="polite"><h2 class="bk-h3">Pesanan dibayar — segera proses <span class="bk-alert-count">' + paid.length + '</span></h2>' +
          (paid.length ? '<ul>' + paid.map(function (o) { return '<li><span><a href="#' + o.id + '"><strong>' + esc(o.id) + '</strong></a> · ' + esc(o.name) + ' · <strong>' + rp(o.total) + '</strong><br><small>Dibayar ' + ago(o.paid_at || o.created_at) + ' · ' + esc(o.courier_service) + (o.reminder_count ? ' · pengingat ke-' + o.reminder_count : '') + '</small></span><span class="bk-acts"><a class="bk-wa-btn" target="_blank" rel="noopener" href="' + esc(o.wa_admin_url) + '">' + WA + ' Kirim ringkasan ke WA admin</a><a class="bk-wa-btn is-ghost" target="_blank" rel="noopener" href="' + esc(o.wa_buyer_url) + '">Chat pembeli</a></span></li>'; }).join('') + '</ul>' : '<p class="bk-muted" style="margin:0">Tidak ada pesanan dibayar yang menunggu diproses. 👍</p>') +
          '<p class="bk-muted" style="font-size:12px;margin:10px 0 0">Notifikasi WA otomatis ke ' + esc(d.admin_wa) + ': <strong>' + (d.wa_provider === 'mock' ? 'MODE UJI (mock — dicatat di log, belum terkirim)' : d.wa_provider) + '</strong>. Pengingat ulang tiap 2 jam selama status masih “dibayar”.</p></section>' +
          (waq.length ? '<section class="bk-alert is-wa"><h2 class="bk-h3">Pesanan via WhatsApp — menunggu konfirmasi <span class="bk-alert-count">' + waq.length + '</span></h2><ul>' + waq.map(function (o) { return '<li><span><a href="#' + o.id + '"><strong>' + esc(o.id) + '</strong></a> · ' + esc(o.name) + ' · ' + rp(o.subtotal) + ' (belum termasuk ongkir)<br><small>' + ago(o.created_at) + ' · ' + esc(o.courier_service) + '</small></span><span class="bk-acts"><a class="bk-wa-btn" target="_blank" rel="noopener" href="' + esc(o.wa_buyer_url) + '">' + WA + ' Chat pembeli</a></span></li>'; }).join('') + '</ul></section>' : '');
        document.title = (paid.length ? '(' + paid.length + ') ' : '') + 'Admin pesanan | ELEMENTIA';
        root.innerHTML = alert + '<div class="bk-admin-bar"><strong>' + d.orders.length + ' pesanan</strong><button type="button" class="bk-chip" id="adm-out">Keluar admin</button></div>' +
          '<div class="bk-panel bk-lbl-bar"><strong>Label pengiriman (PDF)</strong> <label>Ukuran <select id="lbl-size"><option value="100x150">Thermal 100×150 mm</option><option value="a6">A6 (105×148 mm)</option><option value="a4">A4 — 4 label/lembar</option></select></label> <label><input type="checkbox" id="lbl-harga"> Tampilkan harga</label> <button type="button" class="bk-chip" id="lbl-sel" disabled>Download label terpilih (<span id="lbl-n">0</span>)</button> <button type="button" class="bk-chip" id="lbl-paid">Cetak semua yang dibayar</button></div><div class="bk-admin">' + d.orders.map(function (o) {
          return '<form class="bk-panel bk-admin-row" id="' + o.id + '" data-id="' + o.id + '"><div><strong>' + esc(o.id) + '</strong> <span class="bk-status is-' + o.status + '">' + STAT[o.status] + '</span><span class="bk-chan' + (o.channel === 'whatsapp' ? ' is-wa">WA' : '">Web') + '</span><small>' + new Date(o.created_at * 1000).toLocaleString('id-ID') + ' · ' + esc(o.payment_mode) + (o.payment_method ? ' / ' + esc(o.payment_method) : '') + '</small>' +
            '<p>' + esc(o.name) + ' · ' + esc(o.phone) + ' · ' + esc(o.email) + '<br><strong>Kirim ke:</strong> ' + esc(o.penerima || o.name) + ' (' + esc(o.hp_penerima || o.phone) + ')<br>' + esc(o.alamat) + ', Kec. ' + esc(o.kecamatan) + ', ' + esc(o.kota) + ', ' + esc(o.provinsi) + ' ' + esc(o.kode_pos) + (o.catatan ? '<br><em>Catatan: ' + esc(o.catatan) + '</em>' : '') + '</p>' +
            '<p class="bk-muted">' + o.items.map(function (i) { return esc(i.name) + ' ×' + i.qty; }).join(', ') + '</p><p class="bk-muted" style="font-size:13px"><strong>Pengiriman:</strong> ' + esc(o.courier_service) + (o.channel === 'whatsapp' ? '' : ' — ' + rp(o.shipping_cost)) + ' · <strong>Total ' + rp(o.total) + '</strong>' + (o.channel === 'whatsapp' ? ' (ongkir disepakati via WA)' : '') + '</p></div>' +
            '<div class="bk-admin-ctl"><label class="bk-lbl-pick"><input type="checkbox" class="lbl-cb" value="' + esc(o.id) + '"> Pilih label</label><button type="button" class="bk-chip" data-lbl="' + esc(o.id) + '">Download label (PDF)</button><label>Status<select name="status">' + d.statuses.map(function (s) { return '<option value="' + s + '"' + (s === o.status ? ' selected' : '') + '>' + (d.labels[s] || s) + '</option>'; }).join('') + '</select></label><label>No. resi<input name="resi" value="' + esc(o.resi || '') + '"></label><button class="wp-block-button__link" type="submit">Simpan</button><span class="bk-saved" aria-live="polite"></span></div></form>';
        }).join('') + '</div>' + '<details class="bk-panel" style="margin-top:20px"><summary><strong>Log notifikasi WA admin</strong> (' + d.notifications.length + ')</summary><ul class="bk-notif">' + d.notifications.map(function (n) { return '<li><span>' + esc(n.order_id) + ' · ' + (n.kind === 'reminder' ? 'pengingat' : 'dibayar') + '</span><span>' + esc(n.provider) + ' / ' + esc(n.status) + (n.error ? ' — ' + esc(n.error) : '') + '</span><span>' + new Date(n.created_at * 1000).toLocaleString('id-ID') + '</span></li>'; }).join('') + '</ul></details>' +
          '<section class="bk-panel bk-leads" id="adm-leads" aria-live="polite"><p class="bk-muted" style="margin:0">Memuat permintaan penawaran…</p></section>';
        $('#adm-out').addEventListener('click', function () { api('/api/admin/logout', { method: 'POST', body: {} }).then(function () { location.reload(); }); });
        function lblUrl(q) { return '/api/admin/labels?' + q + '&size=' + $('#lbl-size').value + ($('#lbl-harga').checked ? '&harga=1' : ''); }
        function lblGo(q) { var a = document.createElement('a'); a.href = lblUrl(q); a.download = ''; document.body.appendChild(a); a.click(); a.remove(); }
        $$('[data-lbl]').forEach(function (b) { b.addEventListener('click', function () { lblGo('ids=' + encodeURIComponent(b.dataset.lbl)); }); });
        function lblSel() { return $$('.lbl-cb').filter(function (c) { return c.checked; }).map(function (c) { return c.value; }); }
        $$('.lbl-cb').forEach(function (c) { c.addEventListener('change', function () { var n = lblSel().length; $('#lbl-n').textContent = n; $('#lbl-sel').disabled = !n; }); });
        $('#lbl-sel').addEventListener('click', function () { lblGo('ids=' + encodeURIComponent(lblSel().join(','))); });
        $('#lbl-paid').addEventListener('click', function () { if (!d.orders.some(function (o) { return o.status === 'dibayar'; })) { alert('Belum ada pesanan berstatus Dibayar.'); return; } lblGo('status=dibayar'); });
         $$('.bk-admin-row').forEach(function (fr) { fr.addEventListener('submit', function (e) { e.preventDefault(); api('/api/admin/orders/' + fr.dataset.id, { method: 'POST', body: { status: fr.status.value, resi: fr.resi.value } }).then(function (r) { fr.querySelector('.bk-saved').textContent = r.ok ? 'Tersimpan ✓' : r.error; if (r.ok) setTimeout(list, 600); }); }); });
         leadsPanel(); // panel lead baru ada setelah kerangka di atas terpasang
       });
     }

     // Permintaan penawaran (form /bisnis.html). Dulu hanya masuk tabel D1 tanpa layar admin.
     function leadsPanel() {
       var box = $('#adm-leads'); if (!box) return;
       api('/api/admin/leads?limit=100' + (leadFilter ? '&status=' + encodeURIComponent(leadFilter) : '')).then(function (d) {
         if (!d.ok) { box.innerHTML = '<p class="bk-muted" style="margin:0">' + esc(d.error || 'Permintaan penawaran gagal dimuat.') + '</p>'; return; }
         var chips = ['semua'].concat(d.statuses).map(function (k) {
           var on = (leadFilter || 'semua') === k;
           return '<button type="button" class="bk-chip' + (on ? ' is-on' : '') + '" data-lf="' + (k === 'semua' ? '' : k) + '">' + esc(k === 'semua' ? 'Semua' : (d.labels[k] || k)) + ' (' + (d.counts[k] || 0) + ')</button>';
         }).join('');
         box.innerHTML = '<div class="bk-lead-head"><div><h2 class="bk-h3" style="margin:0">Permintaan penawaran (B2B)' +
           (d.counts.baru ? ' <span class="bk-alert-count">' + d.counts.baru + '</span>' : '') + '</h2>' +
           '<p class="bk-muted" style="font-size:13px;margin:6px 0 0">' + d.total + ' lead tersimpan · ' + d.leads.length + ' ditampilkan</p></div>' +
           '<a class="bk-chip" href="/api/admin/leads.csv' + (leadFilter ? '?status=' + encodeURIComponent(leadFilter) : '') + '">Unduh CSV</a></div>' +
           '<div class="bk-lead-filter">' + chips + '</div>' +
           (d.leads.length ? '<div class="bk-lead-list">' + d.leads.map(function (l) {
             return '<article class="bk-lead" data-id="' + l.id + '"><div>' +
               '<strong>' + esc(l.name) + '</strong> <span class="bk-status is-lead-' + esc(l.status) + '">' + esc(d.labels[l.status] || l.status) + '</span>' +
               '<small>' + esc(l.tanggal) + ' WIB · form ' + esc(l.source) + '</small>' +
               '<p><strong>' + esc(l.company) + '</strong>' + (l.role ? ' · ' + esc(l.role) : '') + '<br>' + esc(l.phone) + (l.email ? ' · ' + esc(l.email) : '') + (l.city ? ' · ' + esc(l.city) : '') + '</p>' +
               (l.commodities ? '<p class="bk-muted">Komoditas: ' + esc(l.commodities) + '</p>' : '') +
               (l.volume ? '<p class="bk-muted">Kebutuhan: ' + esc(l.volume) + '</p>' : '') +
               (l.note ? '<p class="bk-lead__note">“' + esc(l.note) + '”</p>' : '') +
               '</div><div class="bk-admin-ctl">' +
               (l.wa_url ? '<a class="bk-wa-btn" target="_blank" rel="noopener" href="' + esc(l.wa_url) + '">' + WA + ' Chat lead</a>' : '') +
               '<label>Status<select name="lead-status">' + d.statuses.map(function (k) { return '<option value="' + k + '"' + (k === l.status ? ' selected' : '') + '>' + esc(d.labels[k] || k) + '</option>'; }).join('') + '</select></label>' +
               '<button type="button" class="wp-block-button__link" data-lead-save="' + l.id + '">Simpan</button>' +
               '<span class="bk-saved" aria-live="polite"></span></div></article>';
           }).join('') + '</div>' : '<p class="bk-muted" style="margin:0">Belum ada permintaan penawaran' + (leadFilter ? ' berstatus ini' : '') + '.</p>');
         $$('[data-lf]', box).forEach(function (b) { b.addEventListener('click', function () { leadFilter = b.dataset.lf; leadsPanel(); }); });
         $$('[data-lead-save]', box).forEach(function (b) { b.addEventListener('click', function () {
           var row = b.closest('.bk-lead'), sel = row.querySelector('[name=lead-status]'), out = row.querySelector('.bk-saved');
           b.disabled = true; out.textContent = 'Menyimpan…';
           api('/api/admin/leads/' + b.dataset.leadSave, { method: 'POST', body: { status: sel.value } }).then(function (r) {
             b.disabled = false; out.textContent = r.ok ? 'Tersimpan ✓' : (r.error || 'Gagal menyimpan');
             if (r.ok) setTimeout(leadsPanel, 500);
           });
         }); });
       });
     }
    var f = $('#admin-login');
    f.addEventListener('submit', function (e) { e.preventDefault(); var er = f.querySelector('.bk-error'); er.hidden = true; api('/api/admin/login', { method: 'POST', body: { password: f.password.value } }).then(function (d) { if (!d.ok) { er.textContent = d.error; er.hidden = false; return; } list(); }); });
    list();
  }

  badge();
  if (!$('#login-form') && !$('#acc-root') && !$('#checkout-form') && !$('#cart-list') && !$('#pay-root')) me();
  pageCart(); pageCheckout(); pagePay(); pageAuth(); pageAccount(); pageAdmin();
})();
