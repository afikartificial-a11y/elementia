/* Galeri foto PDP — minimal 3 foto per produk: tombol, thumbnail, geser, panah keyboard. */
(function () {
  "use strict";
  var roots = Array.prototype.slice.call(document.querySelectorAll("[data-gal]"));
  roots.forEach(function (root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll(".bk-gal__slide"));
    var thumbs = Array.prototype.slice.call(root.querySelectorAll("[data-gal-to]"));
    var count = root.querySelector("[data-gal-count]");
    var i = 0;
    if (!slides.length) return;

    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, x) {
        s.classList.toggle("is-on", x === i);
        s.setAttribute("aria-hidden", x === i ? "false" : "true");
      });
      thumbs.forEach(function (t, x) {
        t.classList.toggle("is-on", x === i);
        t.setAttribute("aria-selected", x === i ? "true" : "false");
      });
      if (count) count.textContent = i + 1 + " / " + slides.length;
    }

    var prev = root.querySelector("[data-gal-prev]");
    var next = root.querySelector("[data-gal-next]");
    if (prev) prev.addEventListener("click", function () { go(i - 1); });
    if (next) next.addEventListener("click", function () { go(i + 1); });
    thumbs.forEach(function (t) {
      t.addEventListener("click", function () { go(parseInt(t.getAttribute("data-gal-to"), 10) || 0); });
    });

    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); }
    });

    // geser di layar sentuh
    var x0 = null;
    root.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button")) return;
      x0 = e.clientX;
    });
    root.addEventListener("pointerup", function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
    });

    go(0);
  });
})();
