import { readFileSync, writeFileSync } from "fs"

function parseCSVLine(line) {
  const r = [], n = line.length
  let i = 0, c = "", q = false
  while (i < n) {
    const ch = line[i]
    if (q) {
      if (ch === '"') {
        if (i + 1 < n && line[i + 1] === '"') { c += '"'; i += 2; continue }
        else { q = false; i++; continue }
      }
      c += ch; i++
    } else {
      if (ch === '"') { q = true; i++; continue }
      if (ch === ",") { r.push(c.trim()); c = ""; i++; continue }
      c += ch; i++
    }
  }
  r.push(c.trim())
  return r
}

const dir = "../tmp/catalog-rebuild/"
const variants = readFileSync("../catalogue/variants.csv", "utf8").replace(/\r\n/g, "\n")
const products = readFileSync("../catalogue/products-v2.csv", "utf8").replace(/\r\n/g, "\n")

// Load products into map
const pLines = products.split("\n")
const pHdr = pLines[0].split(",").map(h => h.trim())
const pMap = new Map()
for (let i = 1; i < pLines.length; i++) {
  const vals = parseCSVLine(pLines[i].trim())
  if (!vals[0]) continue
  const obj = {}
  pHdr.forEach((h, j) => (obj[h] = vals[j] || ""))
  pMap.set(obj.handle, obj)
}

// Process variants
const vLines = variants.split("\n")
const vHdr = vLines[0].split(",").map(h => h.trim())
const phIdx = vHdr.indexOf("product_handle")
const tnIdx = vHdr.indexOf("thumbnail_url")

const newHdr = "product_handle,variant_sku,variant_barcode,variant_title,weight_value,weight_unit,thumbnail_url,image_filename,velocity,tags,allergens,ingredients,storage,country_of_origin,brand_handle,is_active,sourcing_depot,variant_title_raw,variant_sku_raw"
const out = [newHdr]

for (let i = 1; i < vLines.length; i++) {
  const v = parseCSVLine(vLines[i].trim())
  if (!v[phIdx]) continue
  const ph = v[phIdx].trim()
  const prod = pMap.get(ph) || {}
  const tn = (v[tnIdx] || "").trim()
  const imgFn = tn ? tn.split("/").pop() : ""
  const bs = prod.brand_slug || "generic"
  const active = prod.status === "draft" ? "false" : "true"
  const depot = bs === "trs" ? "depot_a" : bs === "natco" ? "depot_b" : bs === "shan" ? "depot_b" : bs === "generic" ? "fresh_supplier" : "default_depot"

  const row = [
    v[phIdx] || "", v[1] || "", v[2] || "", v[3] || "", v[4] || "", v[5] || "",
    tn, imgFn, v[7] || "", v[8] || "", v[9] || "", v[10] || "", v[11] || "", v[12] || "",
    bs, active, depot, v[13] || "", v[14] || ""
  ]
  out.push(row.join(","))
}

writeFileSync(dir + "variants.csv", out.join("\n") + "\n", "utf8")
console.log(`Enhanced variants: ${out.length - 1} rows with brand_handle, is_active, image_filename`)
