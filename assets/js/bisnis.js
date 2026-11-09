/* Form permintaan penawaran (HoReCa) — kirim ke /api/quote */
(function () {
  "use strict";
  var f = document.getElementById("quote-form");
  if (!f) return;
  var msg = document.getElementById("quote-msg");
  var btn = document.getElementById("quote-submit");

  function say(text, ok) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = "bk-form__msg " + (ok ? "is-ok" : "is-err");
  }

  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(f);
    var data = {
      name: (fd.get("name") || "").trim(),
      company: (fd.get("company") || "").trim(),
      role: (fd.get("role") || "").trim(),
      phone: (fd.get("phone") || "").trim(),
      email: (fd.get("email") || "").trim(),
      city: (fd.get("city") || "").trim(),
      volume: (fd.get("volume") || "").trim(),
      note: (fd.get("note") || "").trim(),
      komoditas: fd.getAll("komoditas")
    };
    if (!data.name || !data.company || !data.phone) {
      say("Nama, bisnis, dan WhatsApp wajib diisi.", false);
      return;
    }
    if (data.phone.replace(/\D/g, "").length < 9) {
      say("Nomor WhatsApp tampaknya belum lengkap.", false);
      return;
    }
    btn.disabled = true;
    btn.textContent = "Mengirim…";
    say("", true);

    fetch("/api/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data)
    }).then(function (r) {
      return r.text().then(function (t) {
        var d = null;
        try { d = JSON.parse(t); } catch (e) {}
        if (!d) {
          throw new Error(r.status === 404 || r.status === 501
            ? "Form ini butuh server API. Jalankan `node tools-dev.mjs` atau buka situs yang sudah di-deploy."
            : "Server tidak merespons dengan benar (HTTP " + r.status + ").");
        }
        return d;
      });
    }).then(function (d) {
      if (!d.ok) throw new Error(d.error || "Permintaan gagal dikirim.");
      f.reset();
      say("Terima kasih, " + (data.name.split(" ")[0] || "Bapak/Ibu") + ". Permintaan Anda sudah masuk — kami balas di hari kerja lewat WhatsApp atau email.", true);
    }).catch(function (err) {
      say(err.message || "Tidak bisa mengirim. Coba lagi, atau hubungi kami via WhatsApp.", false);
    }).then(function () {
      btn.disabled = false;
      btn.textContent = "Kirim permintaan";
    });
  });
})();
