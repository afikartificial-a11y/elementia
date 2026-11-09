#!/usr/bin/env node
// CLI proyek: dipakai manusia maupun agen AI. Semua keluaran JSON (kecuali --pretty).
// Contoh: node tools/agent-cli.mjs catalog search lada --limit 3
import * as core from "./lib/elementia-core.mjs";

const argv = process.argv.slice(2);
const flag = (name, def) => {
  const i = argv.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (i < 0) return def;
  const a = argv[i];
  if (a.includes("=")) return a.split("=").slice(1).join("=");
  const v = argv[i + 1];
  return v && !v.startsWith("--") ? v : true;
};
// Argumen posisi saja — nilai milik flag (mis. "3" pada --limit 3) tidak ikut dihitung.
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) {
    if (!a.includes("=") && argv[i + 1] && !argv[i + 1].startsWith("--")) i++;
    continue;
  }
  positional.push(a);
}

const HELP = `Elementia project CLI

  info                                   ringkasan proyek (merek, jumlah SKU, perintah)
  catalog search <kata> [--limit N]      cari SKU (nama, jenis, bentuk, kemasan)
  catalog get <sku>                      detail satu SKU
  wilayah --list                         daftar provinsi
  wilayah --provinsi <nama> [--kabupaten <nama>] [--kecamatan <nama>]
  wilayah search <kata> [--limit N]      cari provinsi/kabupaten/kecamatan
  rates --provinsi <nama> --kode-pos <5 digit> [--items sku:qty,sku:qty]
                                         hitung ongkir (berat bruto = netto + 10%)
  orders [--status baru] [--limit N]     pesanan terakhir dari database lokal (baca-saja)
  brand                                  identitas merek dari site.config.json

Opsi global: --pretty (keluaran terbaca), --help`;

function out(obj) {
  process.stdout.write(JSON.stringify(obj, null, flag("pretty") ? 2 : 0) + "\n");
}
function fail(msg) {
  out({ ok: false, error: msg });
  process.exit(1);
}

async function main() {
  const [cmd, sub, ...args] = positional;
  if (!cmd || flag("help") || cmd === "help") { process.stdout.write(HELP + "\n"); return; }

  switch (cmd) {
    case "info":
      return out({ ok: true, ...core.projectInfo() });

    case "brand":
      return out({ ok: true, ...core.projectInfo().brand, contact: core.projectInfo().contact });

    case "catalog": {
      if (sub === "search") {
        const q = args.join(" ");
        if (!q) return fail("Kata kunci kosong. Contoh: catalog search lada");
        return out({ ok: true, ...core.searchCatalog(q, +(flag("limit", 20))) });
      }
      if (sub === "get") {
        const sku = args[0] || flag("sku");
        if (!sku) return fail("Sebutkan SKU. Contoh: catalog get lada-putih-butir-botol-grinder-55g");
        return out({ ok: true, item: core.getSku(sku) });
      }
      return fail("Subperintah katalog: search | get");
    }

    case "wilayah": {
      if (flag("list")) return out({ ok: true, total: core.provinsiList().length, provinsi: core.provinsiList() });
      if (sub === "search") {
        const q = args.join(" ");
        if (!q) return fail("Kata kunci kosong. Contoh: wilayah search cibiru");
        return out({ ok: true, ...core.searchWilayah(q, +(flag("limit", 25))) });
      }
      if (flag("provinsi")) {
        return out({ ok: true, ...core.resolveWilayah({ provinsi: flag("provinsi"), kabupaten: flag("kabupaten"), kecamatan: flag("kecamatan") }) });
      }
      return fail("Pakai --list, --provinsi <nama>, atau subperintah search.");
    }

    case "rates": {
      const items = String(flag("items", "") || "").split(",").filter(Boolean).map(s => {
        const [sku, qty] = s.split(":");
        return { sku, qty: +(qty || 1) };
      });
      return out({ ok: true, ...core.shippingRates({ provinsi: flag("provinsi"), kodePos: flag("kode-pos"), items }) });
    }

    case "orders":
      return out({ ok: true, ...(await core.listOrders({ status: flag("status"), limit: +(flag("limit", 20)) })) });

    default:
      return fail(`Perintah tidak dikenal: ${cmd}. Lihat --help.`);
  }
}

main().catch(e => fail(e.message));
