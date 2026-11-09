// Label pengiriman PDF (server-side, pdf-lib + Code128 buatan sendiri). Ukuran: 100x150 (default), a6, a4 (4 label/lembar).
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { LOGO_B64 } from "./logo-label.b64.js";
const MM = 72 / 25.4;
export const SIZES = { "100x150": [100, 150], a6: [105, 148], a4: [210, 297] };
export const SENDER = { name: "ELEMENTIA — PT Origin Eka Manufaktur", phone: "0800-0000-0000", addr: "Kawasan Industri De Prima Terra Blok A1 No. 1A, Kel. Tegalluar, Kec. Bojongsoang, Kab. Bandung 40288", placeholder: false };

// ---- Code128 (set B, dengan checksum) ----
const C128 = "212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 114131 311141 411131 211412 211214 211232 2331112".split(" ");
export function code128B(text) {
  const codes = [104]; for (const ch of text) { const c = ch.charCodeAt(0) - 32; if (c < 0 || c > 94) throw new Error("char"); codes.push(c); }
  let sum = codes[0]; for (let i = 1; i < codes.length; i++) sum += codes[i] * i; codes.push(sum % 103, 106);
  const mods = []; for (const c of codes) for (const d of C128[c]) mods.push(+d); return mods; // lebar bar/spasi bergantian, dimulai bar
}
// WinAnsi aman untuk font standar
const clean = v => String(v == null ? "" : v).replace(/[–—]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/±/g, "+/-").normalize("NFKD").replace(/[^\x20-\x7E\xA0-\xFF]/g, "").replace(/\s+/g, " ").trim();
function wrap(font, text, size, maxW) {
  const out = []; for (const para of String(text).split("\n")) { let line = "";
    for (const w of clean(para).split(" ")) { const t = line ? line + " " + w : w;
      if (font.widthOfTextAtSize(t, size) <= maxW) { line = t; continue; }
      if (line) out.push(line);
      let x = w; while (font.widthOfTextAtSize(x, size) > maxW) { let k = x.length; while (k > 1 && font.widthOfTextAtSize(x.slice(0, k), size) > maxW) k--; out.push(x.slice(0, k)); x = x.slice(k); }
      line = x; }
    if (line) out.push(line); }
  return out;
}
const fmtRp = n => "Rp " + Number(n || 0).toLocaleString("id-ID").replace(/,/g, ".");
const fmtKg = g => (g >= 1000 ? (Math.round(g / 10) / 100).toString().replace(".", ",") + " kg" : g + " g");
const tgl = s => new Date((s + 7 * 3600) * 1000).toISOString().slice(0, 16).replace("T", " ") + " WIB";
function shipText(o) {
  if (o.courier === "langsung:elementia") return "Diantar langsung oleh Elementia";
  if (o.channel === "whatsapp") return "Sesuai kesepakatan WA";
  return o.courier_service || o.courier || "-";
}

// Gambar satu label di kotak (x,y = kiri-bawah, w,h dalam pt). Skala font mengikuti lebar kotak.
function drawLabel(page, F, B, logo, o, x, y, w, h, opt) {
  const k = w / (100 * MM), pad = 4 * MM * k, X = x + pad, W = w - 2 * pad; let cy = y + h - pad;
  const black = rgb(0, 0, 0), grey = rgb(0.35, 0.35, 0.35);
  const text = (t, sz, f = F, col = black, dx = 0) => { page.drawText(clean(t), { x: X + dx, y: cy - sz, size: sz, font: f, color: col }); cy -= sz * 1.22; };
  const para = (t, sz, f = F, maxLines = 99, col = black) => { const L = wrap(f, t, sz, W); L.slice(0, maxLines).forEach((l, i) => text(i === maxLines - 1 && L.length > maxLines ? l.replace(/.{0,3}$/, "...") : l, sz, f, col)); };
  const rule = (g = 1.2) => { cy -= 1.2 * k; page.drawLine({ start: { x: X, y: cy }, end: { x: X + W, y: cy }, thickness: 0.8 * k }); cy -= g * MM * k; };
  page.drawRectangle({ x: x + 1.5 * MM * k, y: y + 1.5 * MM * k, width: w - 3 * MM * k, height: h - 3 * MM * k, borderWidth: 1.2 * k, borderColor: black });
  // header: logo + perusahaan + no pesanan
  const lh = 11 * MM * k, lw = lh * logo.width / logo.height; page.drawImage(logo, { x: X, y: cy - lh, width: lw, height: lh });
  const hx = lw + 3 * MM * k; const top = cy;
  page.drawText("PT Origin Eka Manufaktur", { x: X + hx, y: cy - 8 * k, size: 7.5 * k, font: B });
  page.drawText(clean("Tgl pesanan: " + tgl(o.created_at)), { x: X + hx, y: cy - 17 * k, size: 6.5 * k, font: F, color: grey });
  page.drawText(clean(o.channel === "whatsapp" ? "Pesanan via WhatsApp" : "Pesanan web"), { x: X + hx, y: cy - 25 * k, size: 6.5 * k, font: F, color: grey });
  cy = top - lh - 1.5 * MM * k; rule();
  // nomor pesanan besar + barcode
  text(o.id, 15 * k, B);
  const mods = code128B(o.id), total = mods.reduce((a, b) => a + b, 0), bh = 13 * MM * k, mw = Math.min(W / (total + 20), 0.5 * MM * k * 2);
  let bx = X + (W - total * mw) / 2; cy -= 1 * MM * k;
  mods.forEach((m, i) => { if (i % 2 === 0) page.drawRectangle({ x: bx, y: cy - bh, width: m * mw, height: bh, color: black }); bx += m * mw; });
  cy -= bh + 1.5 * MM * k; rule();
  // penerima
  text("PENERIMA", 7 * k, B, grey);
  para(o.penerima || o.name, 14 * k, B, 2);
  text("HP: " + (o.hp_penerima || o.phone), 11 * k, B);
  para(`${o.alamat}, Kec. ${o.kecamatan}, ${o.kota}, ${o.provinsi} ${o.kode_pos}`, 10 * k, F, 6);
  if (o.catatan) para("Catatan: " + o.catatan, 8 * k, F, 3, grey);
  cy -= 0.5 * MM * k; rule();
  // pengirim
  text("PENGIRIM", 7 * k, B, grey);
  text(SENDER.name + "  ·  HP " + SENDER.phone, 8 * k, B);
  para(SENDER.addr + (SENDER.placeholder ? " [ALAMAT ASAL BELUM DIISI]" : ""), 7.5 * k, F, 2);
  rule();
  // pengiriman
  text("PENGIRIMAN: " + shipText(o), 9 * k, B);
  text("No. resi: " + (o.resi || "-"), 8.5 * k, F);
  rule();
  // isi paket
  text(`ISI PAKET  ·  Total berat: ${fmtKg(o.weight_g)}`, 7.5 * k, B);
  const floor = y + pad + 5 * k; const items = o.items || [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i], line = `${it.qty} x ${it.name}${it.variant ? " (" + it.variant + ")" : ""}${opt.harga ? "  = " + fmtRp(it.line_total) : ""}`;
    const L = wrap(F, "- " + line, 7.5 * k, W);
    if (cy - L.length * 7.5 * k * 1.22 < floor + (opt.harga ? 10 * k : 0)) { text(`+ ${items.length - i} item lainnya`, 7.5 * k, B); break; }
    L.forEach(l => text(l, 7.5 * k));
  }
  if (opt.harga) text("Subtotal: " + fmtRp(o.subtotal) + (o.shipping_cost ? "  ·  Ongkir: " + fmtRp(o.shipping_cost) : ""), 7.5 * k, B);
}

export async function buildLabelsPdf(orders, { size = "100x150", harga = false } = {}) {
  const doc = await PDFDocument.create(); doc.setTitle("Label pengiriman ELEMENTIA"); doc.setProducer("ELEMENTIA");
  const F = await doc.embedFont(StandardFonts.Helvetica), B = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await doc.embedPng(Uint8Array.from(atob(LOGO_B64), c => c.charCodeAt(0)));
  const [pw, ph] = (SIZES[size] || SIZES["100x150"]).map(v => v * MM), opt = { harga };
  if (size === "a4") { // 2x2 per lembar + garis potong
    for (let i = 0; i < orders.length; i += 4) {
      const page = doc.addPage([pw, ph]), cw = pw / 2, ch = ph / 2;
      orders.slice(i, i + 4).forEach((o, j) => drawLabel(page, F, B, logo, o, (j % 2) * cw, ph - (Math.floor(j / 2) + 1) * ch, cw, ch, opt));
      const dash = { thickness: 0.5, dashArray: [4, 3], color: rgb(0.5, 0.5, 0.5) };
      page.drawLine({ start: { x: cw, y: 0 }, end: { x: cw, y: ph }, ...dash }); page.drawLine({ start: { x: 0, y: ch }, end: { x: pw, y: ch }, ...dash });
      page.drawText("- - gunting di garis putus-putus - -", { x: cw + 4, y: ch + 2, size: 5, font: F, color: rgb(0.5, 0.5, 0.5) });
    }
  } else for (const o of orders) drawLabel(doc.addPage([pw, ph]), F, B, logo, o, 0, 0, pw, ph, opt);
  return await doc.save();
}
