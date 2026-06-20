/**
 * FINALIZE MVP ASSETS — Production Launch Pipeline
 *
 * 5-step sequential asset merge:
 *   1. ASSET FILTERING  — Strip products without verified images
 *   2. TAXONOMY VALIDATION — Verify category handles + variant uniformity
 *   3. CODES & METADATA — Validate barcodes, inject sourcing_depot tags
 *   4. DATABASE MERGE  — Upsert by barcode, write clean products.csv
 *   5. PHYSICAL TRANSFER — Copy images to public/images/products/
 *
 * Usage:
 *   node catalogue/mvp/finalize-mvp-assets.mjs --dry-run     # Preview only
 *   node catalogue/mvp/finalize-mvp-assets.mjs --apply       # Execute all 5 steps
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from "fs"
import { resolve, dirname, basename, extname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..", "..")
const MVP_DIR = __dirname
const IMG_DIR = resolve(MVP_DIR, "images")
const VEG_IMG_DIR = resolve(IMG_DIR, "vegetables")
const CSV_PATH = resolve(__dirname, "..", "products.csv")
const CAT_PATH = resolve(__dirname, "..", "categories.csv")
const PRICE_PATH = resolve(__dirname, "..", "prices.csv")
const VEG_JSON = resolve(MVP_DIR, "vegetablesMVP-seed.json")
const PUBLIC_IMG = resolve(ROOT, "apps", "storefront", "public", "images", "products")
const UPLOADS = resolve(ROOT, "apps", "backend", "uploads")
const DRY_RUN = process.argv.includes("--dry-run")
const APPLY = process.argv.includes("--apply")

// ── Depots (brand-agnostic codes only) ────────────────────
const DEPOT_MAP = {
  trs: { depot: "wholesale_depot_a", tier: "A" },
  "east-end": { depot: "wholesale_depot_a", tier: "A" },
  natco: { depot: "wholesale_depot_b", tier: "A" },
  shan: { depot: "wholesale_depot_b", tier: "B" },
  mdh: { depot: "wholesale_depot_b", tier: "B" },
  everest: { depot: "wholesale_depot_b", tier: "B" },
  pataks: { depot: "wholesale_depot_a", tier: "A" },
  mtr: { depot: "wholesale_depot_c", tier: "B" },
  ashoka: { depot: "wholesale_depot_c", tier: "B" },
  generic: { depot: "fresh_produce_supplier", tier: "A" },
}

// ── Utilities ─────────────────────────────────────────────
function parseCSVLine(line) {
  const result = []
  let current = "", inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') { if (line[i + 1] === '"') { current += '"'; i++ } else inQuotes = false }
      else current += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ",") { result.push(current.trim()); current = "" }
      else current += ch
    }
  }
  result.push(current.trim())
  return result
}

function loadCSV(filepath) {
  if (!existsSync(filepath)) return { header: [], rows: [] }
  const text = readFileSync(filepath, "utf8").replace(/\r\n/g, "\n")
  const lines = text.trim().split("\n")
  if (lines.length < 2) return { header: [], rows: [] }
  const header = lines[0].split(",").map(h => h.trim())
  const rows = lines.slice(1).map(line => {
    const vals = parseCSVLine(line)
    if (vals.length < header.length) return null
    const obj = {}
    header.forEach((h, i) => (obj[h] = vals[i] || ""))
    return obj
  }).filter(Boolean)
  return { header, rows }
}

function quoteCSV(val) {
  const s = (val || "").toString()
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function writeCSV(filepath, header, rows) {
  const lines = [header.map(h => quoteCSV(h)).join(",")]
  for (const r of rows) {
    lines.push(header.map(h => quoteCSV(r[h] || "")).join(","))
  }
  writeFileSync(filepath, lines.join("\n") + "\n", "utf8")
}

function scanImages(dir) {
  if (!existsSync(dir)) return []
  const results = []
  try {
    for (const file of readdirSync(dir)) {
      const full = join(dir, file)
      if (statSync(full).isDirectory()) {
        results.push(...scanImages(full))
      } else if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
        results.push({ name: file, path: full, handle: basename(file, extname(file)), size: statSync(full).size })
      }
    }
  } catch { }
  return results
}

function extractBrand(title) {
  const m = title.match(/^([a-z0-9'.\- ]+?)(?:\s+-\s+|\s{2,})/i)
  if (m) return m[1].toLowerCase().trim()
  return title.split(" ")[0].toLowerCase().trim()
}

function norm(s) { return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim() }

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

console.log("=".repeat(60))
console.log("  MVP Asset Finalizer — Production Pipeline")
console.log("  Mode: " + (APPLY ? "APPLY" : "DRY RUN"))
console.log("=".repeat(60))

// ── Gather image handles ──────────────────────────────────
const allImages = [...scanImages(IMG_DIR), ...scanImages(VEG_IMG_DIR)]
const imageHandles = new Set(allImages.map(i => i.handle))
console.log(`\n📷 Images found: ${allImages.length} (${imageHandles.size} unique handles)`)

// ── Load existing data ────────────────────────────────────
const existingProducts = loadCSV(CSV_PATH)
const existingPrices = loadCSV(PRICE_PATH)
const existingCategories = loadCSV(CAT_PATH)
console.log(`📦 Existing products.csv: ${existingProducts.rows.length} rows, ${new Set(existingProducts.rows.map(r => r.handle)).size} handles`)
console.log(`🏷️  Existing categories.csv: ${existingCategories.rows.length} rows`)

// ── Load MVP products ─────────────────────────────────────
// From JSON: vegetables (18)
let jsonVeg = []
try {
  jsonVeg = JSON.parse(readFileSync(VEG_JSON, "utf8"))
  console.log(`🥬 Vegetable JSON: ${jsonVeg.length} products`)
} catch (e) { console.log("⚠️ Vegetable JSON not found, skipping") }

// Convert JSON vegetable products to CSV rows
function vegToCSV(prod, index) {
  const variant = prod.variants[0] || {}
  return {
    handle: prod.handle,
    variant_id: `variant_01MV_VEG_${(index + 1).toString().padStart(3, "0")}`,
    variant_sku: variant.sku || `${prod.handle}`,
    variant_barcode: variant.metadata?.barcode || "",
    product_group: "",
    variant_title: variant.title || "Default",
    product_title: prod.title,
    subtitle: prod.subtitle || "",
    description: prod.description || "",
    brand: "",
    category_handle: prod.metadata?.category_handle || "fresh_veg",
    collection_handle: "",
    dietary_flags: (prod.metadata?.dietary_flags || []).join(";"),
    tags: "",
    allergens: (prod.metadata?.allergens || []).join(";"),
    ingredients: prod.metadata?.ingredients || "",
    storage: prod.metadata?.storage || "",
    country_of_origin: prod.metadata?.country_of_origin || "",
    weight_value: variant.metadata?.weight_value?.toString() || "",
    weight_unit: variant.metadata?.weight_unit || "",
    thumbnail_url: prod.thumbnail || "",
    image_filenames: "",
    velocity: prod.metadata?.velocity || "B",
    eco_rating: "",
    brand_slug: prod.metadata?.brand_slug || "generic",
    vat_rate: (prod.metadata?.vat_rate || 0).toString(),
    regional_tags: (prod.metadata?.regional_tags || []).join(";"),
    subscription_eligible: prod.metadata?.subscription_eligible ? "true" : "false",
    status: prod.status || "published",
    variant_title_raw: variant.title || "",
    variant_sku_raw: variant.sku || "",
  }
}

const vegCSVRows = jsonVeg.map((p, i) => vegToCSV(p, i))

// ── Build full launch list ────────────────────────────────
// Combine: existing products that have images + new vegetable products
const allExistingHandles = new Set(existingProducts.rows.map(r => r.handle))
const allProdImages = new Map()
allImages.forEach(i => allProdImages.set(i.handle, i))

// For existing products: only include those with images
const launchProducts = existingProducts.rows.filter(r => imageHandles.has(r.handle))

// For vegetables: include all 18
for (const veg of vegCSVRows) {
  if (!allExistingHandles.has(veg.handle)) {
    launchProducts.push(veg)
  }
}

// ═══════════════════════════════════════════════════════════
// STEP 1: ASSET FILTERING
// ═══════════════════════════════════════════════════════════
console.log(`\n${"─".repeat(40)}\n  STEP 1: Asset Filtering\n${"─".repeat(40)}`)

const stripped = []
const valid = []

for (const r of launchProducts) {
  const h = r.handle
  const img = allProdImages.get(h)
  if (!img) {
    stripped.push(r)
  } else {
    valid.push(r)
  }
}

console.log(`  ✓ Pass (have images): ${valid.length}`)
console.log(`  ✗ Stripped (no images): ${stripped.length}`)
if (stripped.length > 0) {
  console.log(`  Stripped products: ${stripped.map(r => r.product_title || r.handle).join(", ")}`)
}

// ═══════════════════════════════════════════════════════════
// STEP 2: TAXONOMY VALIDATION
// ═══════════════════════════════════════════════════════════
console.log(`\n${"─".repeat(40)}\n  STEP 2: Taxonomy Validation\n${"─".repeat(40)}`)

// Build category handle set (existing + fresh_veg if needed)
const catHandles = new Set(existingCategories.rows.map(r => r.handle))
let catNeedsFreshVeg = false

const taxonomyErrors = []
for (const r of valid) {
  const ch = (r.category_handle || "").trim()
  if (!catHandles.has(ch)) {
    if (ch === "fresh_veg") {
      catNeedsFreshVeg = true
    } else {
      taxonomyErrors.push(`${r.handle}: category_handle "${ch}" not found in categories.csv — product: ${r.product_title || r.handle}`)
    }
  }
}

// Variant uniformity
const handleGroups = new Map()
for (const r of valid) {
  const h = r.handle
  if (!handleGroups.has(h)) handleGroups.set(h, [])
  handleGroups.get(h).push(r)
}

const STRICT_FIELDS = ["category_handle", "brand_slug", "status", "dietary_flags", "vat_rate"]
for (const [handle, group] of handleGroups) {
  if (group.length < 2) continue
  for (const field of STRICT_FIELDS) {
    const vals = new Set(group.map(r => (r[field] || "").trim()).filter(v => v))
    if (vals.size > 1) {
      taxonomyErrors.push(`${handle}: variant uniformity — "${field}" has ${vals.size} values: ${[...vals].join(", ")}`)
    }
  }
}

if (catNeedsFreshVeg) console.log(`  ⚠️  Category "fresh_veg" not in categories.csv — will be appended`)
if (taxonomyErrors.length > 0) {
  console.log(`  ❌ ${taxonomyErrors.length} errors:`)
  taxonomyErrors.forEach(e => console.log(`    ${e}`))
  if (APPLY) process.exit(1)
} else {
  console.log(`  ✓ All category handles valid`)
  console.log(`  ✓ No variant uniformity conflicts`)
}

// ═══════════════════════════════════════════════════════════
// STEP 3: CODES & METADATA ENRICHMENT
// ═══════════════════════════════════════════════════════════
console.log(`\n${"─".repeat(40)}\n  STEP 3: Codes & Metadata\n${"─".repeat(40)}`)

let barcodesValid = 0, barcodesFixed = 0
const enriched = valid.map(r => {
  const bc = (r.variant_barcode || "").trim()
  const handle = r.handle
  const weight = `${r.weight_value || ""}${r.weight_unit || ""}`

  // Validate barcode
  if (!bc || bc === "0") {
    if (handle.startsWith("veg-") || r.category_handle === "fresh_veg") {
      r.variant_barcode = `VEG_${handle.replace(/^veg-/, "").toUpperCase()}_${weight.toUpperCase()}`
    } else {
      r.variant_barcode = `GEN_${handle}_${weight}`
    }
    barcodesFixed++
  } else if (/^\d{13}$/.test(bc) || bc.startsWith("GEN_") || bc.startsWith("VEG_")) {
    barcodesValid++
  } else {
    r.variant_barcode = `GEN_${handle}_${weight}`
    barcodesFixed++
  }

  // Inject sourcing_depot
  const brand = extractBrand(r.product_title || r.handle)
  const depot = DEPOT_MAP[brand] || DEPOT_MAP["generic"]
  r._sourcing_depot = depot.depot
  r._sourcing_tier = depot.tier

  return r
})

console.log(`  Barcodes valid: ${barcodesValid}`)
console.log(`  Barcodes auto-assigned: ${barcodesFixed}`)
console.log(`  Sourcing depots injected: ${enriched.filter(r => r._sourcing_depot).length}`)
console.log(`  Sample depots: ${[...new Set(enriched.map(r => r._sourcing_depot))].join(", ")}`)

// ═══════════════════════════════════════════════════════════
// STEP 4: DATABASE MERGE
// ═══════════════════════════════════════════════════════════
console.log(`\n${"─".repeat(40)}\n  STEP 4: Database Merge\n${"─".repeat(40)}`)

// Build barcode → existing row lookup
const barcodeMap = new Map()
existingProducts.rows.forEach(r => {
  const bc = (r.variant_barcode || "").trim()
  if (bc) barcodeMap.set(bc, r)
})

// Build barcode → enriched row lookup
const enrichedBarcodeMap = new Map()
enriched.forEach(r => {
  const bc = (r.variant_barcode || "").trim()
  if (bc) enrichedBarcodeMap.set(bc, r)
})

let inserts = 0, updates = 0
const mergedRows = [...existingProducts.rows]

// Clean up sourcing_depot columns before writing
const header = existingProducts.header

// First pass: identify vegetable handles from JSON
const vegHandles = new Set(jsonVeg.map(p => p.handle))

for (const [barcode, newRow] of enrichedBarcodeMap) {
  // Remove temp fields
  delete newRow._sourcing_depot
  delete newRow._sourcing_tier

  // Set thumbnail_url from image file for ALL products
  const img = allProdImages.get(newRow.handle)
  if (img) {
    const ext = extname(img.name)
    newRow.thumbnail_url = `/images/products/${newRow.handle}${ext}`
  }

  // For vegetable products, force category_handle to fresh_veg
  if (vegHandles.has(newRow.handle)) {
    newRow.category_handle = "fresh_veg"
  }

  if (barcodeMap.has(barcode)) {
    // UPDATE existing row in-place
    const existingRow = barcodeMap.get(barcode)
    const idx = mergedRows.indexOf(existingRow)
    if (idx >= 0) {
      mergedRows[idx] = newRow
      updates++
    }
  } else {
    // INSERT new row
    mergedRows.push(newRow)
    inserts++
  }
}

console.log(`  INSERT: ${inserts} | UPDATE: ${updates}`)
console.log(`  Before: ${existingProducts.rows.length} rows → After: ${mergedRows.length} rows`)

// Vegetable price merge
let priceInserts = 0
const mergedPrices = [...existingPrices.rows]
const existingSKUs = new Set(existingPrices.rows.map(r => r.sku))
for (const prod of jsonVeg) {
  const variant = prod.variants[0]
  if (!variant?.sku || !variant?.prices?.[0]) continue
  const sku = variant.sku
  const priceGbp = (variant.prices[0].amount / 100).toFixed(2)
  if (!existingSKUs.has(sku)) {
    mergedPrices.push({ sku, price_gbp: priceGbp })
    priceInserts++
  }
}
console.log(`  Prices: ${priceInserts} new entries`)

// ═══════════════════════════════════════════════════════════
// STEP 5: PHYSICAL TRANSFER
// ═══════════════════════════════════════════════════════════
console.log(`\n${"─".repeat(40)}\n  STEP 5: Physical Transfer\n${"─".repeat(40)}`)

let copies = 0, copySize = 0
const filesToCopy = []

for (const r of enriched) {
  const img = allProdImages.get(r.handle)
  if (!img) continue
  const ext = extname(img.name)
  const dest = join(PUBLIC_IMG, `${r.handle}${ext}`)
  filesToCopy.push({ src: img.path, dest, name: `${r.handle}${ext}`, size: img.size })
}

console.log(`  Files to copy: ${filesToCopy.length} (${(filesToCopy.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1)} MB)`)
console.log(`  Source: ${IMG_DIR}`)
console.log(`  Dest:   ${PUBLIC_IMG}`)

filesToCopy.slice(0, 5).forEach(f => console.log(`    ${basename(f.src)} → ${f.name} (${(f.size / 1024).toFixed(1)} KB)`))
if (filesToCopy.length > 5) console.log(`    ... and ${filesToCopy.length - 5} more`)

// ═══════════════════════════════════════════════════════════
// EXECUTE (--apply mode)
// ═══════════════════════════════════════════════════════════
if (!APPLY) {
  console.log(`\n${"=".repeat(60)}`)
  console.log(`  DRY RUN COMPLETE — no changes made.`)
  console.log(`  Add --apply to execute the merge.`)
  console.log(`${"=".repeat(60)}`)
  process.exit(0)
}

console.log(`\n${"=".repeat(60)}`)
console.log("  APPLYING CHANGES...")
console.log(`${"=".repeat(60)}`)

// 4a: Write categories.csv (append fresh_veg if needed)
if (catNeedsFreshVeg) {
  const freshVegRow = { handle: "fresh_veg", name: "Fresh Vegetables", parent_handle: "", rank: "81", description: "Weekly fresh Indian & Sri Lankan vegetables. Sourced daily for peak freshness." }
  existingCategories.rows.push(freshVegRow)
  writeCSV(CAT_PATH, existingCategories.header, existingCategories.rows)
  console.log(`  ✓ categories.csv: appended fresh_veg (${existingCategories.rows.length} rows)`)
}

// 4b: Write products.csv
writeCSV(CSV_PATH, header, mergedRows)
console.log(`  ✓ products.csv: ${mergedRows.length} rows written`)

// 4c: Write prices.csv
writeCSV(PRICE_PATH, existingPrices.header, mergedPrices)
console.log(`  ✓ prices.csv: ${mergedPrices.length} entries`)

// 5: Copy images
if (!existsSync(PUBLIC_IMG)) mkdirSync(PUBLIC_IMG, { recursive: true })
for (const f of filesToCopy) {
  copyFileSync(f.src, f.dest)
  copies++
  copySize += f.size
}
console.log(`  ✓ Images copied: ${copies} files → ${PUBLIC_IMG} (${(copySize / 1024 / 1024).toFixed(1)} MB)`)

// Also copy to backend uploads
for (const f of filesToCopy) {
  const uploadDest = join(UPLOADS, basename(f.dest))
  if (!existsSync(uploadDest)) {
    copyFileSync(f.src, uploadDest)
  }
}
console.log(`  ✓ Images synced to backend uploads/`)

console.log(`\n${"=".repeat(60)}`)
console.log(`  ✅ MVP ASSETS FINALIZED`)
console.log(`  Products: ${mergedRows.length} rows`)
console.log(`  Categories: ${existingCategories.rows.length} rows`)
console.log(`  Images transferred: ${copies}`)
console.log(`${"=".repeat(60)}`)
