/* Pengganti ringan untuk perilaku offcanvas Blocksy (data-toggle-panel) + filter produk */
(function(){
  var body=document.body,panel=document.getElementById('offcanvas'),last=null;
  function open(){if(!panel)return;last=document.activeElement;panel.removeAttribute('inert');panel.classList.add('active');body.dataset.panel='in:right';
    document.querySelectorAll('[data-toggle-panel]').forEach(function(t){t.setAttribute('aria-expanded','true')});
    var c=panel.querySelector('.ct-toggle-close');c&&c.focus();}
  function close(){if(!panel||!panel.classList.contains('active'))return;body.dataset.panel='out';
    document.querySelectorAll('[data-toggle-panel]').forEach(function(t){t.setAttribute('aria-expanded','false')});
    setTimeout(function(){panel.classList.remove('active');panel.setAttribute('inert','');delete body.dataset.panel;last&&last.focus();},250);}
  document.querySelectorAll('[data-toggle-panel]').forEach(function(t){t.addEventListener('click',function(e){e.preventDefault();open();})});
  if(panel){panel.querySelector('.ct-toggle-close').addEventListener('click',close);
    panel.addEventListener('click',function(e){if(e.target===panel)close();});
    panel.querySelectorAll('a').forEach(function(a){a.addEventListener('click',close)});}
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
  // Back to top (markup Blocksy .ct-back-to-top)
  var btt=document.querySelector('.ct-back-to-top');
  if(btt){var onS=function(){btt.classList.toggle('ct-show',window.scrollY>600)};window.addEventListener('scroll',onS,{passive:true});onS();
    btt.addEventListener('click',function(e){e.preventDefault();window.scrollTo({top:0,behavior:'smooth'})});}
  // Reveal
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('is-in');io.unobserve(x.target)}})},{rootMargin:'0px 0px -8% 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});}
  else document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('is-in')});
  // Filter produk
  document.querySelectorAll('[data-filter]').forEach(function(g){
    var chips=g.querySelectorAll('.bk-chip'),items=document.querySelectorAll(g.getAttribute('data-filter'));
    chips.forEach(function(c){c.addEventListener('click',function(){
      chips.forEach(function(x){x.setAttribute('aria-pressed','false')});c.setAttribute('aria-pressed','true');
      var f=c.dataset.f;items.forEach(function(p){p.hidden=!(f==='all'||(' '+p.dataset.tags+' ').indexOf(' '+f+' ')>-1)});
      document.querySelectorAll('[data-cat-head]').forEach(function(h){var any=document.querySelectorAll('#'+h.dataset.catHead+' .bk-prod:not([hidden])').length;h.hidden=!any;document.getElementById(h.dataset.catHead).hidden=!any;});
    })});
  });
  var y=document.getElementById('year');if(y)y.textContent=new Date().getFullYear();
})();

/* Badge angka pada pintasan keranjang mengambang (semua halaman) */
(function () {
  function sum() {
    try {
      var c = JSON.parse(localStorage.getItem("bk_cart_v1")) || {}, n = 0;
      for (var k in c) { if (Object.prototype.hasOwnProperty.call(c, k)) n += Number(c[k]) || 0; }
      return n;
    } catch (e) { return 0; }
  }
  function paint() {
    var n = sum();
    Array.prototype.forEach.call(document.querySelectorAll("[data-cart-count]"), function (b) {
      b.textContent = n;
      b.hidden = !n;
    });
  }
  document.addEventListener("DOMContentLoaded", paint);
  window.addEventListener("storage", paint);
  document.addEventListener("bk:cart", paint);
  paint();
})();

/* Pembesaran foto produk (tabel kemasan & harga) */
(function () {
  "use strict";
  var ov = null;
  function close() {
    if (!ov) return;
    ov.classList.remove("is-on");
    document.body.style.overflow = "";
  }
  function open(src, cap, alt) {
    if (!ov) {
      ov = document.createElement("div");
      ov.className = "bk-zoom";
      ov.setAttribute("role", "dialog");
      ov.setAttribute("aria-modal", "true");
      ov.setAttribute("aria-label", "Foto produk diperbesar");
      ov.innerHTML = '<button type="button" class="bk-zoom__close" aria-label="Tutup">&times;</button><figure><img alt=""><figcaption></figcaption></figure>';
      document.body.appendChild(ov);
      ov.addEventListener("click", function (e) {
        if (e.target === ov || e.target.closest(".bk-zoom__close")) close();
      });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    }
    var img = ov.querySelector("img");
    img.src = src; img.alt = alt || "";
    ov.querySelector("figcaption").textContent = cap || "";
    ov.classList.add("is-on");
    document.body.style.overflow = "hidden";
    ov.querySelector(".bk-zoom__close").focus();
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-zoom]");
    if (!b) return;
    e.preventDefault();
    open(b.getAttribute("data-src"), b.getAttribute("data-cap"), b.getAttribute("aria-label"));
  });
})();
