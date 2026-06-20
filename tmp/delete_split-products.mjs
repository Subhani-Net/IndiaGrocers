/**
 * Split products.csv → products-v2.csv + variants.csv
 * Uses proper CSV parsing (handles quoted fields)
 */
import { readFileSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..", "catalogue")
const input = resolve(ROOT, "products.csv")

const text = readFileSync(input, "utf8").replace(/\r\n/g, "\n")
const lines = text.trim().split("\n")
const header = lines[0].split(",").map(h => h.trim())

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

function get(vals, name) {
  const i = header.indexOf(name)
  return i >= 0 && i < vals.length ? (vals[i] || "").trim() : ""
}

function csvQuote(val) {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return '"' + val.replace(/"/g, '""') + '"'
  }
  return val
}

// Parent columns
const PARENT_HEADER = "handle,product_title,subtitle,description,brand,category_handle,collection_handle,dietary_flags,status,brand_slug,vat_rate,regional_tags,subscription_eligible,eco_rating,image_filenames"
const PARENT_COLS = ["handle","product_title","subtitle","description","brand","category_handle","collection_handle","dietary_flags","status","brand_slug","vat_rate","regional_tags","subscription_eligible","eco_rating","image_filenames"]

// Variant columns  
const VARIANT_HEADER = "product_handle,variant_sku,variant_barcode,variant_title,weight_value,weight_unit,thumbnail_url,velocity,tags,allergens,ingredients,storage,country_of_origin,variant_title_raw,variant_sku_raw"
const VARIANT_COLS = ["handle","variant_sku","variant_barcode","variant_title","weight_value","weight_unit","thumbnail_url","velocity","tags","allergens","ingredients","storage","country_of_origin","variant_title_raw","variant_sku_raw"]

const parents = new Map()
const variantLines = []

for (let i = 1; i < lines.length; i++) {
  const vals = parseCSVLine(lines[i])
  if (vals.length < 20) continue
  const handle = get(vals, "handle")
  if (!handle) continue

  // Parent: first occurrence per handle
  if (!parents.has(handle)) {
    // Fix vegetable products: force category_handle to fresh_veg
    let catHandle = csvQuote(get(vals, "category_handle"))
    if (["indian-onion","mud-potato","ginger","garlic","okra","green-chillies","bottle-gourd","bitter-gourd","drumsticks","tindora","curry-leaves","vine-tomato","green-lime","coconut","small-onion","green-plantains","cassava","arbi"].includes(handle)) {
      catHandle = "fresh_veg"
    }
    const parentRow = PARENT_COLS.map(col => {
      if (col === "category_handle") return catHandle
      return csvQuote(get(vals, col))
    }).join(",")
    parents.set(handle, parentRow)
  }

  // Variant: every row
  const variantRow = VARIANT_COLS.map(col => csvQuote(get(vals, col))).join(",")
  variantLines.push(variantRow)
}

// Write
writeFileSync(resolve(ROOT, "products-v2.csv"), [PARENT_HEADER, ...parents.values()].join("\n") + "\n", "utf8")
writeFileSync(resolve(ROOT, "variants.csv"), [VARIANT_HEADER, ...variantLines].join("\n") + "\n", "utf8")

console.log(`Parents: ${parents.size} → catalogue/products-v2.csv`)
console.log(`Variants: ${variantLines.length} → catalogue/variants.csv`)
