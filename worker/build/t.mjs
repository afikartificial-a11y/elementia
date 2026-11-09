import { buildLabelsPdf } from "../labels.js"; import fs from "fs";
const t = Math.floor(Date.now()/1000);
const long = { id:"BK-20261104-TESLBL", channel:"whatsapp", courier:"langsung:elementia", name:"TES LABEL", phone:"081200000001", penerima:"Bapak Muhammad Abdurrahman Wahyudiansyah Kusumanegara (Gudang Belakang)", hp_penerima:"081299998888",
 alamat:"Kawasan Industri De Prima Terra Blok A1 No. 1A, RT 001/RW 012, Desa Tegalluar, belakang pabrik tekstil, gerbang hijau sebelah pos satpam utama, masuk lewat jalur truk", kecamatan:"Bojongsoang", kota:"Kabupaten Bandung", provinsi:"Jawa Barat", kode_pos:"40288",
 catatan:"[TES SISTEM] Telepon dulu sebelum antar; terima barang jam 08.00-16.00", weight_g:25300, subtotal:4950000, created_at:t, items:[{qty:1,name:"Lada Putih Butir Plastik 25kg",variant:"Butir, Plastik 25kg",line_total:4950000}] };
const multi = { id:"BK-20261104-TESMLT", channel:"web", courier:"jne:reg", courier_service:"JNE Reguler (2-3 hari)", resi:"JNE1234567890", name:"TES MULTI", phone:"081200000002", alamat:"Jl. Uji Coba No. 1", kecamatan:"Coblong", kota:"Kota Bandung", provinsi:"Jawa Barat", kode_pos:"40132", catatan:"", weight_g:1840, subtotal:512000, shipping_cost:18000, created_at:t,
 items:Array.from({length:9},(_,i)=>({qty:i+1,name:["Lada Putih Bubuk Pouch 100g","Lada Hitam Butir Toples 250g","Lada Putih Butir Pouch 500g"][i%3],variant:["Bubuk, Pouch 100g","Butir, Toples 250g","Butir, Pouch 500g"][i%3],line_total:36000*(i+1)})) };
const out="/workspace/elementia-preview/samples/labels/";
fs.writeFileSync(out+"label-long-100x150.pdf", await buildLabelsPdf([long]));
fs.writeFileSync(out+"label-multi-100x150-harga.pdf", await buildLabelsPdf([multi],{harga:true}));
fs.writeFileSync(out+"label-a6.pdf", await buildLabelsPdf([long],{size:"a6"}));
fs.writeFileSync(out+"labels-a4-4perlembar.pdf", await buildLabelsPdf([long,multi,long,multi,long],{size:"a4"}));
