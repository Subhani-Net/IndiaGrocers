import { readFileSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const dir = resolve(__dirname, "catalog-rebuild")
const variants = readFileSync(resolve(dir, "variants.csv"), "utf8").replace(/\r\n/g, "\n")
const vLines = variants.split("\n")
const vHdr = vLines[0].split(",").map(h => h.trim())
const phIdx = vHdr.indexOf("product_handle")
const skuIdx = vHdr.indexOf("variant_sku")
const brandIdx = vHdr.indexOf("brand_handle")
const depotIdx = vHdr.indexOf("sourcing_depot")

// Vendor/depot definitions
const DEPOT_MAP = {
  depot_a: { name: "Wholesale Depot A (Southall)", aisle: "A1-A4" },
  depot_b: { name: "Wholesale Depot B (Croydon)", aisle: "B1-B3" },
  depot_c: { name: "Wholesale Depot C (Wembley)", aisle: "C1-C5" },
  fresh_supplier: { name: "Fresh Produce Supplier (London)", aisle: "F1-F2" },
  default_depot: { name: "General Wholesale", aisle: "G1-G8" },
}

// Vendor mapping by brand
const BRAND_VENDORS = {
  trs: { vendor: "TRS Vibrant Brands", cost_multiplier: 1.0 },
  natco: { vendor: "Natco Foods Ltd", cost_multiplier: 1.0 },
  shan: { vendor: "Shan Foods Intl", cost_multiplier: 1.0 },
  mdh: { vendor: "MDH Spices India", cost_multiplier: 1.0 },
  everest: { vendor: "Everest Spices", cost_multiplier: 1.0 },
  pataks: { vendor: "AB World Foods", cost_multiplier: 1.0 },
  "east-end": { vendor: "East End Foods", cost_multiplier: 1.0 },
  ashoka: { vendor: "Ashoka Foods", cost_multiplier: 1.0 },
  mtr: { vendor: "MTR Foods India", cost_multiplier: 1.0 },
  haldirams: { vendor: "Haldiram Snacks Intl", cost_multiplier: 1.0 },
  bikaji: { vendor: "Bikaji Foods Intl", cost_multiplier: 1.0 },
  britannia: { vendor: "Britannia Industries", cost_multiplier: 1.0 },
  cadbury: { vendor: "Mondelez India", cost_multiplier: 1.0 },
  maggi: { vendor: "Nestle India", cost_multiplier: 1.0 },
  parle: { vendor: "Parle Products", cost_multiplier: 1.0 },
  laziza: { vendor: "Laziza Foods Pakistan", cost_multiplier: 1.0 },
  priya: { vendor: "Priya Foods India", cost_multiplier: 1.0 },
  aachi: { vendor: "Aachi Foods Chennai", cost_multiplier: 1.0 },
  lijjat: { vendor: "Shri Mahila Griha Udyog", cost_multiplier: 1.0 },
  generic: { vendor: "Multiple Suppliers", cost_multiplier: 1.0 },
  fresh_veg: { vendor: "London Produce Market", cost_multiplier: 1.0 },
}

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

const out = ["variant_handle,vendor_name,vendor_sku,cost_price_gbp,sourcing_depot,warehouse_aisle,lead_time_days,min_order_qty"]
let count = 0

for (let i = 1; i < vLines.length; i++) {
  const vals = parseCSVLine(vLines[i].trim())
  if (vals.length < brandIdx + 1) continue
  const ph = (vals[phIdx] || "").trim()
  const sku = (vals[skuIdx] || "").trim()
  const brand = (vals[brandIdx] || "").trim()
  const depot = (vals[depotIdx] || "").trim()
  if (!ph || !sku) continue

  const variantHandle = `${ph}__${sku}`
  const vendorInfo = BRAND_VENDORS[brand] || BRAND_VENDORS["generic"]
  const depotInfo = DEPOT_MAP[depot] || DEPOT_MAP["default_depot"]
  const vendorName = vendorInfo.vendor
  const vendorSku = sku.startsWith("veg-") ? sku : `${brand}-${sku}`
  const costPrice = "" // empty = not yet set
  const depotName = depot
  const aisle = depotInfo.aisle
  const leadTime = brand === "fresh_veg" ? "1" : "3"
  const minQty = brand === "fresh_veg" ? "5" : "6"

  out.push(`${variantHandle},"${vendorName}","${vendorSku}",${costPrice},${depotName},${aisle},${leadTime},${minQty}`)
  count++
}

writeFileSync(resolve(dir, "supplier_skus.csv"), out.join("\n") + "\n", "utf8")
console.log(`supplier_skus.csv: ${count} rows → ${dir}/supplier_skus.csv`)
