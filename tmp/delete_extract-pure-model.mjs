/**
 * Extract Pure Model — reads current DB+CSVs, writes 7-file pure model to
 * tmp/catalog-rebuild-v3/.
 *
 * Produces:
 *   1. products.csv           — pure product identities (no brand column)
 *   2. variants.csv           — shared unit pool (type, value, label)
 *   3. product_brands.csv     — product × brand junction
 *   4. brand_product_variants.csv — sellable units (commerce layer)
 *   5. variant_vendor_prices.csv  — multi-vendor sourcing
 *   6. prices.csv             — retail prices (unchanged structure)
 *   7. brands.csv, vendors.csv, categories.csv — copies
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "http://127.0.0.1:9000"
const OUT = resolve(__dirname, "catalog-rebuild-v3")

for (const d of [OUT]) { if (!existsSync(d)) mkdirSync(d, { recursive: true }) }

// ─── CSV Helpers ───────────────────────────────────────────────────

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

function loadCSV(filePath) {
  const raw = readFileSync(filePath, "utf8").replace(/\r\n/g, "\n")
  const lines = raw.split("\n").filter(l => l.trim())
  if (lines.length === 0) return { header: [], rows: [] }
  const header = lines[0].split(",").map(h => h.trim())
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i])
    const row = {}
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = (vals[j] || "").trim()
    }
    rows.push(row)
  }
  return { header, rows }
}

function writeCSV(filePath, header, rows) {
  const lines = [header.join(",")]
  for (const row of rows) {
    const vals = header.map(h => {
      const v = String(row[h] ?? "")
      return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v
    })
    lines.push(vals.join(","))
  }
  writeFileSync(filePath, lines.join("\n") + "\n", "utf8")
  console.log(`  Wrote ${rows.length} rows → ${filePath}`)
}

// ─── Title Parsing ──────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function stripBrandPrefix(productTitle, brandName) {
  if (!brandName) return productTitle
  const bn = brandName.toLowerCase()
  let t = productTitle.trim()

  // Pattern 1: "BrandName - The rest"
  const dashPrefix = new RegExp(`^${escapeRegex(brandName)}\\s*-\\s*`, "i")
  if (dashPrefix.test(t)) {
    t = t.replace(dashPrefix, "").trim()
  }

  // Pattern 2: "BrandName The rest" (brand name as first word(s))
  const wordPrefix = new RegExp(`^${escapeRegex(brandName)}\\s+`, "i")
  if (wordPrefix.test(t)) {
    t = t.replace(wordPrefix, "").trim()
  }

  return t
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// ─── Unit Extraction ────────────────────────────────────────────────

function parseUnit(title) {
  const t = title.trim()
  if (!t) return null

  // ── Special cases ──
  // "Single" → each
  if (/^single$/i.test(t)) {
    return { unit_type: "each", unit_value: 1, unit_label: "piece", display_title: t }
  }

  // "4-Pack" / "8-Pack" → count of packs
  let m = t.match(/^(\d+)\s*-\s*pack$/i)
  if (m) {
    return { unit_type: "count", unit_value: parseFloat(m[1]), unit_label: "pack", display_title: t }
  }

  // "40-Piece Bag" → count of pieces
  m = t.match(/^(\d+)\s*-\s*piece\s*bag$/i)
  if (m) {
    return { unit_type: "count", unit_value: parseFloat(m[1]), unit_label: "piece", display_title: t }
  }

  // "12x50g" → multipack of 12 × 50g (treat as count: 12 packs)
  m = t.match(/^(\d+)\s*x\s*(\d+\.?\d*)\s*(g|kg|ml|l)\s*$/i)
  if (m) {
    return { unit_type: "count", unit_value: parseFloat(m[1]), unit_label: "multipack", display_title: t }
  }

  // "100 Teabags" / "100 teabags"
  m = t.match(/^(\d+)\s*teabags?$/i)
  if (m) {
    return { unit_type: "count", unit_value: parseFloat(m[1]), unit_label: "teabag", display_title: t }
  }

  // ── Standard : number + unit + optional suffix ──
  // "500g Pack" / "1kg" / "1.5L" / "725ml" / "6-pack" / "12-case"
  m = t.match(/^(\d+\.?\d*)\s*(g|kg|ml|l|litre|liter|pack|case|piece|bunch|tin|can|jar|bag|pcs|box|oz|lb|fl\.?oz)\b\s*(.*)$/i)
  if (!m) return null

  const rawValue = parseFloat(m[1])
  let rawUnit = m[2].toLowerCase()
  const suffix = (m[3] || "").trim()

  // Normalize unit
  if (["litre", "liter"].includes(rawUnit)) rawUnit = "l"
  if (rawUnit === "ml") rawUnit = "ml"
  if (["g"].includes(rawUnit)) rawUnit = "g"
  if (["kg"].includes(rawUnit)) rawUnit = "kg"
  if (["oz"].includes(rawUnit)) rawUnit = "oz"
  if (["lb"].includes(rawUnit)) rawUnit = "lb"
  if (["fl.oz", "floz"].includes(rawUnit)) rawUnit = "ml"

  // Determine unit_type
  let unitType = "weight"
  if (["l", "ml"].includes(rawUnit)) unitType = "volume"
  if (["pack", "case", "piece", "bunch", "tin", "can", "jar", "bag", "pcs", "box"].includes(rawUnit)) unitType = "count"
  if (rawUnit === "each") unitType = "each"

  // Convert volumes to standard units if needed
  let value = rawValue
  let label = rawUnit

  // Normalize: 1500ml → 1.5L
  if (rawUnit === "ml" && rawValue >= 1000) {
    value = rawValue / 1000
    label = "l"
  }

  return {
    unit_type: unitType,
    unit_value: value,
    unit_label: label,
    display_title: title,
  }
}

function unitKey(u) {
  return `${u.unit_type}:${u.unit_value}:${u.unit_label}`
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log("═".repeat(60))
  console.log("  Extract Pure Model — DB + CSV → 7-file pure CSV")
  console.log("═".repeat(60))

  // ═══ Load Source Files ═══
  const srcProducts = loadCSV(resolve(__dirname, "..", "catalogue", "products-v2.csv"))
  const srcVariants = loadCSV(resolve(__dirname, "catalog-rebuild", "variants.csv"))
  const srcBrands = loadCSV(resolve(__dirname, "catalog-rebuild", "brands.csv"))
  const srcCategories = loadCSV(resolve(__dirname, "..", "catalogue", "categories.csv"))
  const srcVendors = loadCSV(resolve(__dirname, "catalog-rebuild", "vendors.csv"))
  const srcSupplierSkus = loadCSV(resolve(__dirname, "catalog-rebuild", "supplier_skus.csv"))
  const srcPrices = loadCSV(resolve(__dirname, "..", "catalogue", "prices.csv"))

  console.log(`Loaded: ${srcProducts.rows.length} products, ${srcVariants.rows.length} variants, ${srcBrands.rows.length} brands, ${srcCategories.rows.length} categories, ${srcSupplierSkus.rows.length} supplier_skus, ${srcPrices.rows.length} prices`)

  // ═══ Build Lookup Maps ═══
  const brandMap = new Map(srcBrands.rows.map(r => [r.handle, r.brand_name]))
  const brandHandleToName = (h) => brandMap.get(h) || h

  // ═══ 1. EXTRACT PURE PRODUCTS ═══
  console.log("\n── 1. Extracting Pure Products ──")

  // Group CSV products by pure title + category to deduplicate
  const pureProductMap = new Map() // key: normalized_title::category → { handle, title, ... }
  const productTitleMap = new Map() // old_handle → pure_handle

  for (const row of srcProducts.rows) {
    const oldHandle = row.handle
    const productTitle = row.product_title || oldHandle
    const brandSlug = row.brand_slug || "generic"
    const brandName = brandHandleToName(brandSlug)
    const category = row.category_handle || ""
    const dietary = row.dietary_flags || ""
    const vatRate = row.vat_rate || "0"
    const status = row.status || "published"
    const description = row.description || ""
    const subtitle = row.subtitle || ""

    // Strip brand prefix from product_title
    let pureTitle = stripBrandPrefix(productTitle, brandName)

    // If pure title is empty after stripping, use original
    if (!pureTitle) pureTitle = productTitle

    // Skip "Default" variant-only placeholders
    if (pureTitle.toLowerCase() === "default") continue

    // Generate pure handle from cleaned title
    const pureHandle = slugify(pureTitle)

    // Normalize for deduplication
    const normTitle = pureTitle.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim()
    const key = `${normTitle}::${category}`

    if (!pureProductMap.has(key)) {
      pureProductMap.set(key, {
        handle: pureHandle,
        title: pureTitle,
        subtitle: subtitle,
        description: description,
        category_handle: category,
        dietary_flags: dietary,
        vat_rate: vatRate,
        status: status,
        // Track original titles for conflict resolution
        original_titles: new Set([productTitle]),
        original_brands: new Set([brandSlug]),
      })
    } else {
      const existing = pureProductMap.get(key)
      existing.original_titles.add(productTitle)
      existing.original_brands.add(brandSlug)
      // Use the longest description
      if (description.length > (existing.description || "").length) {
        existing.description = description
      }
      // Merge dietary flags
      if (dietary && dietary !== existing.dietary_flags) {
        const merged = new Set([
          ...(existing.dietary_flags || "").split(";").filter(Boolean),
          ...dietary.split(";").filter(Boolean),
        ])
        existing.dietary_flags = [...merged].join(";")
      }
    }

    // Map old handle → pure handle + brand
    // Use a composite key since one old_handle maps to one pure product + one brand
    productTitleMap.set(oldHandle, {
      pure_handle: pureHandle,
      pure_title: pureTitle,
      brand_slug: brandSlug,
      brand_name: brandName,
    })
  }

  console.log(`  ${srcProducts.rows.length} old products → ${pureProductMap.size} pure products`)

  // ─── Write products.csv ───
  const productsCSV = []
  const pureHandleSet = new Set()
  let handleCollisions = 0
  for (const [key, p] of pureProductMap) {
    let handle = p.handle
    // Handle collisions by appending category
    if (pureHandleSet.has(handle)) {
      handle = `${handle}-${p.category_handle.replace(/_/g, "-")}`
      handleCollisions++
    }
    pureHandleSet.add(handle)
    // Update the handle in the map
    p.handle = handle

    productsCSV.push({
      handle,
      title: p.title,
      subtitle: p.subtitle || "",
      description: p.description || "",
      category_handle: p.category_handle,
      dietary_flags: p.dietary_flags,
      vat_rate: p.vat_rate,
      status: p.status,
    })
  }
  writeCSV(resolve(OUT, "products.csv"), [
    "handle", "title", "subtitle", "description",
    "category_handle", "dietary_flags", "vat_rate", "status"
  ], productsCSV)
  console.log(`  Handle collisions resolved: ${handleCollisions}`)

  // Update productTitleMap with any handle changes
  for (const [oldHandle, mapping] of productTitleMap) {
    const key = `${mapping.pure_title.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim()}::${mapping.brand_slug}`
    const updated = [...pureProductMap.values()].find(
      p => p.original_titles.has(oldHandle)  // We need to find by original data association
    )
  }

  // Rebuild: old_handle → { pure_handle, brand_slug, brand_name, category_handle }
  const oldToPure = new Map()
  for (const row of srcProducts.rows) {
    const oldHandle = row.handle
    const productTitle = row.product_title || oldHandle
    const brandSlug = row.brand_slug || "generic"
    const brandName = brandHandleToName(brandSlug)
    let pureTitle = stripBrandPrefix(productTitle, brandName)
    if (!pureTitle || pureTitle.toLowerCase() === "default") pureTitle = productTitle
    const normTitle = pureTitle.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim()
    const key = `${normTitle}::${row.category_handle || ""}`

    const pureProduct = pureProductMap.get(key)
    if (pureProduct) {
      oldToPure.set(oldHandle, {
        pure_handle: pureProduct.handle,
        pure_title: pureProduct.title,
        brand_slug: brandSlug,
        brand_name: brandName,
        category_handle: row.category_handle || "",
        dietary_flags: row.dietary_flags || "",
        vat_rate: row.vat_rate || "0",
        description: row.description || "",
      })
    }
  }

  console.log(`  Old→Pure mappings: ${oldToPure.size}`)

  // ═══ 2. EXTRACT SHARED VARIANTS (unit pool) ═══
  console.log("\n── 2. Extracting Shared Variant Units ──")

  const unitMap = new Map() // unitKey → { unit_type, unit_value, unit_label, display_title }
  const variantTitleToHandle = new Map() // old variant_title → variant_handle

  for (const row of srcVariants.rows) {
    const wv = row.weight_value
    const wu = row.weight_unit
    const rawTitle = row.variant_title || row.variant_title_raw || ""

    let unit = null

    // Try parsing the raw title first (if not "Default")
    if (rawTitle && rawTitle.toLowerCase() !== "default") {
      unit = parseUnit(rawTitle)
    }

    // Fallback: construct from weight_value + weight_unit
    if (!unit && wv && wu) {
      unit = parseUnit(`${wv}${wu}`)
    }

    if (!unit) {
      if (rawTitle && rawTitle.toLowerCase() !== "default") {
        console.warn(`  ⚠ Could not parse unit: "${rawTitle}" (wv=${wv}, wu=${wu})`)
      }
      continue
    }

    const key = unitKey(unit)
    if (!unitMap.has(key)) {
      unitMap.set(key, unit)
    }
  }

  // Generate handles for each unique unit
  const unitHandleMap = new Map() // unitKey → handle
  for (const [key, u] of unitMap) {
    const rawHandle = `${u.unit_value}${u.unit_label}`
    let handle = rawHandle.replace(/\./g, "-")
    // Handle collisions
    if (unitHandleMap.has(handle)) {
      handle = `${handle}-${u.unit_type}`
    }
    unitHandleMap.set(key, handle)
  }

  // Map original variant titles to unit handles (for Section 4 lookup)
  for (const row of srcVariants.rows) {
    const wv = row.weight_value
    const wu = row.weight_unit
    const rawTitle = row.variant_title || row.variant_title_raw || ""

    // Determine the display title that will be in the DB variant
    let displayTitle = rawTitle
    if ((!displayTitle || displayTitle.toLowerCase() === "default") && wv && wu) {
      displayTitle = `${wv}${wu}`
    }
    if (!displayTitle || displayTitle.toLowerCase() === "default") continue

    let unit = parseUnit(displayTitle)
    if (!unit && wv && wu) {
      unit = parseUnit(`${wv}${wu}`)
    }
    if (!unit) continue

    const key = unitKey(unit)
    const handle = unitHandleMap.get(key)
    if (handle) {
      variantTitleToHandle.set(displayTitle, handle)
      // Also store by old variant data for lookup
      if (!variantTitleToHandle.has(`${row.product_handle}::${row.variant_sku}`)) {
        variantTitleToHandle.set(`${row.product_handle}::${row.variant_sku}`, handle)
      }
    }
  }

  console.log(`  ${srcVariants.rows.length} variant rows → ${unitMap.size} unique unit definitions`)

  // ─── Write variants.csv ───
  const variantsCSV = []
  for (const [key, u] of unitMap) {
    const handle = unitHandleMap.get(key) || key
    variantsCSV.push({
      handle,
      unit_type: u.unit_type,
      unit_value: u.unit_value,
      unit_label: u.unit_label,
      display_title: u.display_title || `${u.unit_value}${u.unit_label}`,
    })
  }
  writeCSV(resolve(OUT, "variants.csv"), [
    "handle", "unit_type", "unit_value", "unit_label", "display_title"
  ], variantsCSV)

  // ═══ 3. EXTRACT PRODUCT-BRAND MAPPINGS ═══
  console.log("\n── 3. Extracting Product-Brand Mappings ──")

  const productBrandMap = new Map() // "pure_handle::brand_slug" → { product_handle, brand_handle, shelf_weight_kg, status }
  const productBrandSet = new Set()

  for (const [oldHandle, mapping] of oldToPure) {
    const key = `${mapping.pure_handle}::${mapping.brand_slug}`
    if (!productBrandSet.has(key)) {
      productBrandSet.add(key)
      productBrandMap.set(key, {
        product_handle: mapping.pure_handle,
        brand_handle: mapping.brand_slug,
        shelf_weight_kg: "",  // not available in source data, can be added manually
        status: "published",
      })
    }
  }

  console.log(`  ${productBrandMap.size} unique product-brand pairings`)

  // ─── Write product_brands.csv ───
  const productBrandsCSV = [...productBrandMap.values()]
  writeCSV(resolve(OUT, "product_brands.csv"), [
    "product_handle", "brand_handle", "shelf_weight_kg", "status"
  ], productBrandsCSV)

  // ═══ 4. EXTRACT BRAND PRODUCT VARIANTS (sellable units) ═══
  console.log("\n── 4. Extracting Sellable Units (brand_product_variants) ──")

  // Query DB for variant data (barcodes, images, metadata)
  const token = await login()
  const H = { "Content-Type": "application/json", Authorization: `Bearer ${token}` }

  const sellableUnits = []
  let fetched = 0

  for (let offset = 0; ; offset += 50) {
    const url = `${BASE}/admin/products?limit=50&offset=${offset}&fields=id,handle,title,thumbnail,metadata,variants.id,variants.title,variants.sku,variants.barcode,variants.metadata`
    const r = await fetch(url, { headers: H })
    const d = await r.json()
    if (!d.products?.length) break

    for (const p of d.products) {
      const oldHandle = p.handle
      const mapping = oldToPure.get(oldHandle)
      if (!mapping) {
        console.warn(`  ⚠ No mapping for ${oldHandle}`)
        continue
      }

      const thumbnail = p.thumbnail || ""
      const imageFilename = (thumbnail || "").replace(/^\/uploads\//, "").replace(/^\/images\/products\//, "")

      for (const v of p.variants || []) {
        const variantTitle = v.title || "Default"
        if (variantTitle.toLowerCase() === "default") continue

        // Find variant handle from title
        let variantHandle = variantTitleToHandle.get(variantTitle)
        if (!variantHandle) {
          // Try parsing directly
          const unit = parseUnit(variantTitle)
          if (unit) {
            const key = unitKey(unit)
            variantHandle = unitHandleMap.get(key) || `${unit.unit_value}${unit.unit_label}`.replace(/\./g, "-")
          }
        }
        if (!variantHandle) {
          console.warn(`  ⚠ No unit mapping for variant "${variantTitle}" on ${oldHandle}`)
          continue
        }

        const bc = v.barcode || v.metadata?.barcode || ""
        const backupBc = v.metadata?.backup_barcodes || ""

        sellableUnits.push({
          product_handle: mapping.pure_handle,
          brand_handle: mapping.brand_slug,
          variant_handle: variantHandle,
          barcode: bc,
          backup_barcodes: backupBc,
          images: imageFilename,  // single image per variant for now
          thumbnail: imageFilename,
          is_active: "true",
        })
      }
      fetched++
      if (fetched % 100 === 0) console.log(`  Fetched ${fetched} products...`)
    }
  }

  console.log(`  ${sellableUnits.length} sellable units extracted`)

  // Deduplicate by (product_handle, brand_handle, variant_handle)
  const bpvMap = new Map()
  for (const su of sellableUnits) {
    const key = `${su.product_handle}::${su.brand_handle}::${su.variant_handle}`
    if (!bpvMap.has(key)) {
      bpvMap.set(key, su)
    } else {
      // Merge barcodes if different
      const existing = bpvMap.get(key)
      if (su.barcode && su.barcode !== existing.barcode) {
        const allBc = new Set([existing.barcode, su.barcode].filter(Boolean))
        existing.backup_barcodes = [...allBc].join(",")
      }
    }
  }

  const bpvRows = [...bpvMap.values()]
  console.log(`  ${bpvRows.length} unique sellable units (deduplicated)`)

  // ─── Write brand_product_variants.csv ───
  writeCSV(resolve(OUT, "brand_product_variants.csv"), [
    "product_handle", "brand_handle", "variant_handle",
    "barcode", "backup_barcodes", "images", "thumbnail", "is_active"
  ], bpvRows)

  // ═══ 5. EXTRACT VARIANT VENDOR PRICES ═══
  console.log("\n── 5. Extracting Variant Vendor Prices ──")

  // Map supplier_skus data to new composite keys
  const vvpRows = []

  for (const row of srcSupplierSkus.rows) {
    const variantHandle = (row.variant_handle || "").trim()
    if (!variantHandle) continue

    // Parse variant_handle: "product_handle__variant_sku"
    const [oldProductHandle, variantSku] = variantHandle.split("__")
    if (!oldProductHandle || !variantSku) continue

    const mapping = oldToPure.get(oldProductHandle.trim())
    if (!mapping) continue

    // Find variant_handle from variant_sku
    const titleFromVariants = variantTitleToHandle.get(`${oldProductHandle.trim()}::${variantSku.trim()}`)
    let vHandle = titleFromVariants || ""

    // If no direct mapping, try matching by variant SKU from DB
    if (!vHandle) continue

    vvpRows.push({
      product_handle: mapping.pure_handle,
      brand_handle: mapping.brand_slug,
      variant_handle: vHandle,
      vendor_handle: row.vendor_handle || "",
      vendor_sku: row.vendor_sku || "",
      cost_price_gbp: row.cost_price_gbp || "",
      is_primary: "true",
    })
  }

  console.log(`  ${vvpRows.length} vendor price mappings`)

  // ─── Write variant_vendor_prices.csv ───
  writeCSV(resolve(OUT, "variant_vendor_prices.csv"), [
    "product_handle", "brand_handle", "variant_handle",
    "vendor_handle", "vendor_sku", "cost_price_gbp", "is_primary"
  ], vvpRows)

  // ═══ 6. EXTRACT PRICES ═══
  console.log("\n── 6. Extracting Retail Prices ──")

  // Map old prices.csv (keyed by SKU) to new composite keys
  const newPrices = []

  // Build old SKU → (product_handle, brand_handle, variant_handle) map from DB
  for (let offset = 0; ; offset += 100) {
    const url = `${BASE}/admin/products?limit=100&offset=${offset}&fields=id,handle,variants.id,variants.sku,variants.title,variants.prices.amount`
    const r = await fetch(url, { headers: H })
    const d = await r.json()
    if (!d.products?.length) break

    for (const p of d.products) {
      const mapping = oldToPure.get(p.handle)
      if (!mapping) continue

      for (const v of p.variants || []) {
        const vt = v.title || "Default"
        if (vt.toLowerCase() === "default") continue

        let variantHandle = variantTitleToHandle.get(vt)
        if (!variantHandle) {
          const unit = parseUnit(vt)
          if (unit) {
            const key = unitKey(unit)
            variantHandle = unitHandleMap.get(key) || `${unit.unit_value}${unit.unit_label}`.replace(/\./g, "-")
          }
        }
        if (!variantHandle) continue

        const sku = v.sku || ""
        const priceAmount = (v.prices && v.prices.length > 0) ? v.prices[0].amount : null
        if (priceAmount != null && priceAmount > 0) {
          newPrices.push({
            product_handle: mapping.pure_handle,
            brand_handle: mapping.brand_slug,
            variant_handle: variantHandle,
            price_gbp: (priceAmount / 100).toFixed(2),
            currency: "gbp",
            old_sku: sku,
          })
        }
      }
    }
  }

  // Deduplicate prices by composite key
  const priceMap = new Map()
  for (const pr of newPrices) {
    const key = `${pr.product_handle}::${pr.brand_handle}::${pr.variant_handle}`
    if (!priceMap.has(key)) {
      priceMap.set(key, pr)
    }
  }
  const priceRows = [...priceMap.values()]
  console.log(`  ${priceRows.length} unique prices`)

  // ─── Write prices.csv ───
  writeCSV(resolve(OUT, "prices.csv"), [
    "product_handle", "brand_handle", "variant_handle",
    "price_gbp", "currency"
  ], priceRows.map(p => ({
    product_handle: p.product_handle,
    brand_handle: p.brand_handle,
    variant_handle: p.variant_handle,
    price_gbp: p.price_gbp,
    currency: p.currency,
  })))

  // ═══ 7. COPY REFERENCE FILES ═══
  console.log("\n── 7. Copying Reference Files ──")

  writeCSV(resolve(OUT, "brands.csv"), srcBrands.header, srcBrands.rows)
  writeCSV(resolve(OUT, "categories.csv"), srcCategories.header, srcCategories.rows)
  writeCSV(resolve(OUT, "vendors.csv"), srcVendors.header, srcVendors.rows)

  // ═══ SUMMARY ═══
  console.log("\n" + "═".repeat(60))
  console.log("  ✅ Extraction complete")
  console.log(`  Directory: ${OUT}`)
  console.log(`  products.csv:              ${productsCSV.length} rows`)
  console.log(`  variants.csv (units):      ${variantsCSV.length} rows`)
  console.log(`  product_brands.csv:        ${productBrandsCSV.length} rows`)
  console.log(`  brand_product_variants.csv:${bpvRows.length} rows`)
  console.log(`  variant_vendor_prices.csv: ${vvpRows.length} rows`)
  console.log(`  prices.csv:                ${priceRows.length} rows`)
  console.log("═".repeat(60))
}

// ─── Auth ───────────────────────────────────────────────────────────

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  const data = await res.json()
  if (!data.token) throw new Error(`Login failed: ${res.status}`)
  return data.token
}

main().catch(e => { console.error(`\nFATAL: ${e.message}`); console.error(e.stack); process.exit(1) })
