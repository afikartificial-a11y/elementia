/* Katalog v3 — saring & cari tanpa memuat ulang halaman.
   Marketplace butuh beberapa klik dan reload; di sini satu ketikan, hasil muncul seketika. */
(function () {
  "use strict";
  var grid = document.querySelector("[data-kom-grid]");
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-kom]"));
  var chips = Array.prototype.slice.call(document.querySelectorAll("[data-kf]"));
  var input = document.querySelector("[data-kom-search]");
  var count = document.querySelector("[data-kom-count]");
  var empty = document.querySelector("[data-kom-empty]");
  var active = "all";

  function matches(card, q) {
    var okChip;
    if (active === "all") okChip = true;
    else if (active === "tersedia" || active === "segera") okChip = card.dataset.status === active;
    else okChip = card.dataset.kom === active;
    if (!okChip) return false;
    if (!q) return true;
    var hay = (card.dataset.text || "") + " " + (card.textContent || "").toLowerCase();
    return q.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
  }

  function apply() {
    var q = (input && input.value || "").trim().toLowerCase();
    var shown = 0;
    cards.forEach(function (c) {
      var ok = matches(c, q);
      c.hidden = !ok;
      if (ok) shown++;
    });
    if (count) { var rows = 0; cards.forEach(function (c) { if (!c.hidden) rows += c.querySelectorAll(".bk-varrow").length; }); count.textContent = shown + " komoditas · " + rows + " varian"; }
    if (empty) empty.hidden = shown !== 0;
    grid.hidden = shown === 0;
  }

  chips.forEach(function (btn) {
    btn.addEventListener("click", function () {
      active = btn.dataset.kf;
      chips.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      apply();
    });
  });
  if (input) {
    var t;
    input.addEventListener("input", function () { clearTimeout(t); t = setTimeout(apply, 90); });
    input.addEventListener("keydown", function (e) { if (e.key === "Escape") { input.value = ""; apply(); } });
  }
  apply();
})();
