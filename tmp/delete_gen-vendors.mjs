/**
 * Normalize supplier_skus.csv → vendors.csv + vendor_handle FK
 */
import { readFileSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const dir = resolve(__dirname, "catalog-rebuild")

// ── Vendor definitions (one per unique name) ──────────────
const VENDOR_DEFAULTS = {
  "TRS Vibrant Brands": { handle: "trs_vibrant", depot: "depot_a", aisle: "A1-A4", lead: "3", qty: "6" },
  "Natco Foods Ltd": { handle: "natco_foods", depot: "depot_b", aisle: "B1-B3", lead: "3", qty: "6" },
  "Shan Foods Intl": { handle: "shan_foods", depot: "depot_b", aisle: "B1-B3", lead: "3", qty: "6" },
  "MDH Spices India": { handle: "mdh_spices", depot: "depot_b", aisle: "B1-B3", lead: "3", qty: "6" },
  "Everest Spices": { handle: "everest_spices", depot: "depot_b", aisle: "B1-B3", lead: "3", qty: "6" },
  "AB World Foods": { handle: "ab_world_foods", depot: "depot_a", aisle: "A1-A4", lead: "3", qty: "6" },
  "East End Foods": { handle: "east_end_foods", depot: "depot_a", aisle: "A1-A4", lead: "3", qty: "6" },
  "Ashoka Foods": { handle: "ashoka_foods", depot: "depot_c", aisle: "C1-C5", lead: "3", qty: "6" },
  "MTR Foods India": { handle: "mtr_foods", depot: "depot_c", aisle: "C1-C5", lead: "3", qty: "6" },
  "Haldiram Snacks Intl": { handle: "haldiram_snacks", depot: "depot_b", aisle: "B1-B3", lead: "3", qty: "6" },
  "Bikaji Foods Intl": { handle: "bikaji_foods", depot: "depot_b", aisle: "B1-B3", lead: "3", qty: "6" },
  "Britannia Industries": { handle: "britannia_ind", depot: "depot_c", aisle: "C1-C5", lead: "3", qty: "6" },
  "Mondelez India": { handle: "mondelez_india", depot: "depot_c", aisle: "C1-C5", lead: "3", qty: "6" },
  "Nestle India": { handle: "nestle_india", depot: "depot_c", aisle: "C1-C5", lead: "3", qty: "6" },
  "Parle Products": { handle: "parle_products", depot: "depot_c", aisle: "C1-C5", lead: "3", qty: "6" },
  "Laziza Foods Pakistan": { handle: "laziza_foods", depot: "depot_c", aisle: "C1-C5", lead: "3", qty: "6" },
  "Priya Foods India": { handle: "priya_foods", depot: "depot_c", aisle: "C1-C5", lead: "3", qty: "6" },
  "Aachi Foods Chennai": { handle: "aachi_foods", depot: "depot_c", aisle: "C1-C5", lead: "3", qty: "6" },
  "Shri Mahila Griha Udyog": { handle: "shri_mahila", depot: "depot_c", aisle: "C1-C5", lead: "5", qty: "12" },
  "London Produce Market": { handle: "london_produce", depot: "fresh_supplier", aisle: "F1-F2", lead: "1", qty: "5" },
  "Multiple Suppliers": { handle: "multiple_suppliers", depot: "default_depot", aisle: "G1-G8", lead: "4", qty: "6" },
}

// ── Write vendors.csv ─────────────────────────────────────
const vLines = ["vendor_handle,vendor_name,sourcing_depot,warehouse_aisle,lead_time_days,min_order_qty"]
for (const [name, def] of Object.entries(VENDOR_DEFAULTS)) {
  vLines.push(`${def.handle},${name.includes(",") ? '"' + name + '"' : name},${def.depot},${def.aisle},${def.lead},${def.qty}`)
}
writeFileSync(resolve(dir, "vendors.csv"), vLines.join("\n") + "\n", "utf8")
console.log(`vendors.csv: ${vLines.length - 1} vendors`)

// ── Rewrite supplier_skus.csv — vendor_name → vendor_handle ─
const suppText = readFileSync(resolve(dir, "supplier_skus.csv"), "utf8").replace(/\r\n/g, "\n")
const sLines = suppText.split("\n")
const sHdr = sLines[0].split(",").map(h => h.trim())
const nameIdx = sHdr.indexOf("vendor_name")
const depotIdx = sHdr.indexOf("sourcing_depot")
const aisleIdx = sHdr.indexOf("warehouse_aisle")
const leadIdx = sHdr.indexOf("lead_time_days")
const qtyIdx = sHdr.indexOf("min_order_qty")

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

// New header: replace vendor_name with vendor_handle
const newHdr = [...sHdr.slice(0, nameIdx), "vendor_handle", ...sHdr.slice(nameIdx + 1)]
const sOut = [newHdr.join(",")]
let mapped = 0

for (let i = 1; i < sLines.length; i++) {
  const line = sLines[i].trim()
  if (!line) { sOut.push(""); continue }
  const vals = parseCSVLine(line)
  const name = (vals[nameIdx] || "").trim().replace(/^"/, "").replace(/"$/, "")
  const def = VENDOR_DEFAULTS[name] || VENDOR_DEFAULTS["Multiple Suppliers"]

  // Replace vendor_name with vendor_handle at the same position
  const newVals = [...vals.slice(0, nameIdx), def.handle, ...vals.slice(nameIdx + 1)]

  // Inherit defaults from vendor if supplier_sku fields are empty
  if (!(newVals[depotIdx + 1] || "").trim()) newVals[depotIdx + 1] = def.depot
  if (!(newVals[aisleIdx + 1] || "").trim()) newVals[aisleIdx + 1] = def.aisle
  if (!(newVals[leadIdx + 1] || "").trim()) newVals[leadIdx + 1] = def.lead
  if (!(newVals[qtyIdx + 1] || "").trim()) newVals[qtyIdx + 1] = def.qty

  sOut.push(newVals.join(","))
  mapped++
}

writeFileSync(resolve(dir, "supplier_skus.csv"), sOut.join("\n") + "\n", "utf8")
console.log(`supplier_skus.csv: ${mapped} rows rewritten with vendor_handle FK`)
