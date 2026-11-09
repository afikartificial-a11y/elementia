#!/usr/bin/env node
// Server MCP (Model Context Protocol) untuk proyek ini — stdio, JSON-RPC 2.0, tanpa dependensi.
// Daftarkan di klien MCP mana pun:
//   { "mcpServers": { "elementia": { "command": "node", "args": ["<akar-proyek>/tools/mcp-server.mjs"] } } }
import * as core from "./lib/elementia-core.mjs";

const VERSION = "2024-11-05";
const SERVER = { name: "elementia-project", version: "1.0.0" };

const TOOLS = [
  {
    name: "project_info",
    description: "Ringkasan proyek: merek, kontak, gudang asal, jumlah SKU & provinsi, daftar perintah.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: async () => core.projectInfo(),
  },
  {
    name: "catalog_search",
    description: "Cari SKU katalog berdasarkan nama, jenis komoditas, bentuk, atau kemasan.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Kata kunci, mis. 'lada bubuk'" }, limit: { type: "integer", default: 20 } },
      required: ["query"], additionalProperties: false,
    },
    run: async ({ query, limit }) => core.searchCatalog(query, limit || 20),
  },
  {
    name: "catalog_get",
    description: "Ambil satu SKU lengkap: harga, berat netto, berat bruto, foto.",
    inputSchema: { type: "object", properties: { sku: { type: "string" } }, required: ["sku"], additionalProperties: false },
    run: async ({ sku }) => core.getSku(sku),
  },
  {
    name: "shipping_rates",
    description: "Hitung ongkir per kurir untuk satu tujuan. Berat paket = berat bruto (netto + 10%) x jumlah, dibulatkan per kg.",
    inputSchema: {
      type: "object",
      properties: {
        provinsi: { type: "string", description: "Nama provinsi resmi, mis. 'Jawa Barat'" },
        kode_pos: { type: "string", description: "5 angka, mis. '40288'" },
        items: {
          type: "array",
          description: "Daftar item; kosongkan untuk contoh 1 botol grinder 55 g.",
          items: {
            type: "object",
            properties: { sku: { type: "string" }, qty: { type: "integer", default: 1 } },
            required: ["sku"], additionalProperties: false,
          },
        },
      },
      required: ["provinsi", "kode_pos"], additionalProperties: false,
    },
    run: async ({ provinsi, kode_pos, items }) => core.shippingRates({ provinsi, kodePos: kode_pos, items }),
  },
  {
    name: "wilayah_lookup",
    description: "Telusuri wilayah bertingkat: provinsi -> kabupaten/kota -> kecamatan -> kode pos.",
    inputSchema: {
      type: "object",
      properties: {
        provinsi: { type: "string" }, kabupaten: { type: "string" }, kecamatan: { type: "string" },
      },
      required: ["provinsi"], additionalProperties: false,
    },
    run: async (a) => core.resolveWilayah(a),
  },
  {
    name: "wilayah_search",
    description: "Cari nama provinsi/kabupaten/kecamatan dan dapatkan kode posnya.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" }, limit: { type: "integer", default: 25 } },
      required: ["query"], additionalProperties: false,
    },
    run: async ({ query, limit }) => core.searchWilayah(query, limit || 25),
  },
  {
    name: "orders_list",
    description: "Baca pesanan terakhir dari database lokal (baca-saja, tidak mengubah data).",
    inputSchema: {
      type: "object",
      properties: { status: { type: "string", description: "mis. baru, dibayar, dikirim" }, limit: { type: "integer", default: 20 } },
      additionalProperties: false,
    },
    run: async ({ status, limit }) => core.listOrders({ status, limit: limit || 20 }),
  },
];

function send(msg) { process.stdout.write(JSON.stringify(msg) + "\n"); }
function ok(id, result) { send({ jsonrpc: "2.0", id, result }); }
function err(id, code, message) { send({ jsonrpc: "2.0", id, error: { code, message } }); }

async function handle(msg) {
  const { id, method, params } = msg;
  if (method === "initialize") {
    return ok(id, {
      protocolVersion: VERSION,
      capabilities: { tools: { listChanged: false } },
      serverInfo: SERVER,
      instructions: "Proyek toko Elementia: katalog rempah tumpangsari, ongkir per provinsi, dan pesanan lokal.",
    });
  }
  if (method === "notifications/initialized" || method === "initialized") return;
  if (method === "ping") return ok(id, {});
  if (method === "tools/list") {
    return ok(id, { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
  }
  if (method === "tools/call") {
    const tool = TOOLS.find(t => t.name === params?.name);
    if (!tool) return err(id, -32602, `Tool tidak dikenal: ${params?.name}`);
    try {
      const result = await tool.run(params?.arguments || {});
      return ok(id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], isError: false });
    } catch (e) {
      return ok(id, { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true });
    }
  }
  return err(id, -32601, `Metode tidak didukung: ${method}`);
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { err(null, -32700, "JSON tidak valid"); continue; }
    handle(msg).catch(e => err(msg?.id ?? null, -32603, e.message));
  }
});
process.stdin.on("end", () => process.exit(0));
