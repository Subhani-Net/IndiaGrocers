import { readFileSync, writeFileSync } from "fs"

const HEADER = "handle,variant_id,variant_sku,variant_barcode,product_group,variant_title,product_title,subtitle,description,brand,category_handle,collection_handle,dietary_flags,tags,allergens,ingredients,storage,country_of_origin,weight_value,weight_unit,thumbnail_url,image_filenames,velocity,eco_rating,brand_slug,vat_rate,regional_tags,subscription_eligible,status,variant_title_raw,variant_sku_raw"

let stats = { deleted: 0, cs_deleted: 0, fixed_shifts: 0, merged_groups: 0, titles_stripped: 0, handles_stripped: 0 }

// ═══════════════════════════════════════════════════
// PARSE CSV
// ═══════════════════════════════════════════════════
const raw = readFileSync("products.csv", "utf-8")
const lines = raw.replace(/\r\n/g, "\n").split("\n")
const headerCols = lines[0].split(",")
console.log(`Columns: ${headerCols.length}`)
console.log(`Total rows (incl header): ${lines.length}`)

const rows = []
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim()
  if (!line) continue
  const vals = line.split(",")
  if (vals.length < 20) continue // malformed
  const row = {}
  for (let j = 0; j < headerCols.length; j++) {
    row[headerCols[j]] = vals[j] || ""
  }
  rows.push(row)
}
console.log(`Parsed rows: ${rows.length}`)

// ═══════════════════════════════════════════════════
// PHASE 1: Delete duplicate rows
// ═══════════════════════════════════════════════════
function dedupeRows(rows) {
  // Group by (handle, weight_value, weight_unit)
  const groups = new Map()
  for (const r of rows) {
    const key = `${r.handle}||${r.weight_value}||${r.weight_unit}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(r)
  }

  const kept = []
  for (const [, group] of groups) {
    if (group.length === 1) {
      kept.push(group[0])
      continue
    }
    // Duplicates: keep cleanest SKU (shortest, no doubled prefix)
    // MVC dupes have sku like "bikaji-bikaji-khatta-meetha-200g"
    // Clean ones have sku like "bikaji-khatta-meetha-200g"
    group.sort((a, b) => {
      const aClean = !a.variant_sku.includes(a.brand_slug + "-" + a.brand_slug)
      const bClean = !b.variant_sku.includes(b.brand_slug + "-" + b.brand_slug)
      if (aClean && !bClean) return -1
      if (!aClean && bClean) return 1
      return a.variant_sku.length - b.variant_sku.length
    })
    const best = group[0]
    kept.push(best)
    if (group.length > 1) {
      stats.deleted += (group.length - 1)
      console.log(`  ✂ ${best.handle} — deleted ${group.length - 1} duplicate(s), kept SKU=${best.variant_sku}`)
    }
  }
  return kept
}

let cleaned = dedupeRows(rows)

// ═══════════════════════════════════════════════════
// PHASE 1b: Cross-source duplicates (MVC pipeline vs new pipeline)
// ═══════════════════════════════════════════════════
function isMVCRow(row) {
  return row.variant_id.startsWith("variant_01KSZ")
}

function normalizeBrand(row) {
  // Try from handle prefix first — most reliable
  const h = row.handle.toLowerCase()
  const prefixes = [
    ["brooke-bond", "brooke bond"],
    ["hamdard", "hamdard"],
    ["shan-", "shan"],
    ["mdh-", "mdh"],
    ["bikaji-", "bikaji"],
    ["bournvita", "bournvita"],
    ["horlicks", "horlicks"],
    ["wagh-bakri", "wagh bakri"],
    ["tata-gold", "tata gold"],
    ["bovonto", "bovonto"],
    ["girnar", "girnar"],
    ["nescafe", "nescafe"],
    ["bru", "bru"],
    ["leo-coffee", "leo coffee"],
    ["udhayam", "udhayam"],
    ["frooti", "frooti"],
    ["rasna", "rasna"],
    ["parachute", "parachute"],
    ["trs-", "trs"],
    ["east-end", "east end"],
    ["natco", "natco"],
    ["haldirams", "haldirams"],
    ["amul", "amul"],
    ["dabur", "dabur"],
    ["glucon-d", "glucon-d"],
  ]
  for (const [prefix, result] of prefixes) {
    if (h.startsWith(prefix)) return result
  }
  const b = (row.brand || "").trim().toLowerCase()
  if (b) return b
  return "generic"
}

function dedupeCrossSource(rows) {
  const mvcRows = rows.filter(r => isMVCRow(r))
  const newRows = rows.filter(r => !isMVCRow(r))

  // Build lookup: new rows keyed by (brand, category, weight)
  const newLookup = new Map()
  for (const r of newRows) {
    const brand = normalizeBrand(r)
    const key = `${brand}||${r.category_handle}||${r.weight_value}${r.weight_unit}`
    if (!newLookup.has(key)) newLookup.set(key, [])
    newLookup.get(key).push(r)
  }

  const toDelete = new Set()
  for (const r of mvcRows) {
    const brand = normalizeBrand(r)
    const key = `${brand}||${r.category_handle}||${r.weight_value}${r.weight_unit}`
    if (newLookup.has(key)) {
      toDelete.add(r)
      console.log(`  ✂ CS: ${r.handle} (MVC) → kept new version [${newLookup.get(key).map(n => n.handle)}]`)
    }
  }

  stats.cs_deleted += toDelete.size
  return rows.filter(r => !toDelete.has(r))
}

cleaned = dedupeCrossSource(cleaned)

// ═══════════════════════════════════════════════════
// PHASE 2: Fix column-shifted rows
// ═══════════════════════════════════════════════════
function detectShift(row) {
  // weight_value is non-numeric (like "g", "kg", "ml", "l") OR empty
  // AND weight_unit looks like an image path
  const wv = row.weight_value.trim()
  const wu = row.weight_unit.trim()
  if (wu && wu.startsWith("/uploads/")) {
    // weight_unit is an image — column is definitely shifted
    return true
  }
  if (wv && !/^[0-9.]+$/.test(wv)) {
    // weight_value is non-numeric — shifted
    return true
  }
  return false
}

function parseWeightFromHandle(handle) {
  // e.g., "trs-toor-dal-oily-1kg" → {value: "1", unit: "kg"}
  // e.g., "trs-red-split-lentils-500g" → {value: "500", unit: "g"}
  // e.g., "brooke-bond-red-label-500g" → {value: "500", unit: "g"}
  const m = handle.match(/[-_](\d+\.?\d*)(g|kg|ml|l)\s*$/i)
  if (m) return { value: m[1], unit: m[2].toLowerCase() }
  return null
}

function fixShiftedRow(row) {
  // Column shift: weight_unit is actually the thumbnail
  const shiftedThumb = row.weight_unit.trim()

  // Move values
  if (shiftedThumb && shiftedThumb.startsWith("/uploads/")) {
    row.thumbnail_url = shiftedThumb
  }
  row.weight_unit = ""

  // Parse weight from handle
  const w = parseWeightFromHandle(row.handle)
  if (w) {
    row.weight_value = w.value
    row.weight_unit = w.unit
    console.log(`  ↻ ${row.handle} → weight=${w.value}${w.unit}, thumb=${shiftedThumb}`)
  } else {
    // Fallback: try from product_title
    const tm = row.product_title.match(/(\d+\.?\d*)\s*(g|kg|ml|l)\b/i)
    if (tm) {
      row.weight_value = tm[1]
      row.weight_unit = tm[2].toLowerCase()
      console.log(`  ↻ ${row.handle} → weight=${tm[1]}${tm[2]} (from title), thumb=${shiftedThumb}`)
    } else {
      console.log(`  ⚠ ${row.handle} — cannot parse weight`)
    }
  }
  stats.fixed_shifts++
}

for (let i = cleaned.length - 1; i >= 0; i--) {
  if (detectShift(cleaned[i])) {
    fixShiftedRow(cleaned[i])
  }
}

// ═══════════════════════════════════════════════════
// HELPER: extract core product name (no brand, no weight)
// ═══════════════════════════════════════════════════
function stripWeight(title) {
  return title.replace(/\s+\d+(\.\d+)?\s*(g|kg|ml|l|pack|tin|6pack|4pack|8pack)\s*$/i, "").trim()
}

function stripBrand(title) {
  // Brand is typically "BrandName - " prefix
  return title.replace(/^[^-]+\s*-\s*/, "").trim()
}

// ═══════════════════════════════════════════════════
// PHASE 3: Merge sibling weight variants (same brand, same core product)
// ═══════════════════════════════════════════════════
function mergeSiblingVariants(rows) {
  // Group by (brand, core_product_name, category_handle)
  const groups = new Map()
  for (const r of rows) {
    const brand = r.brand.trim() || "generic"
    const coreName = stripWeight(stripBrand(r.product_title)).toLowerCase()
    const key = `${brand}||${coreName}||${r.category_handle}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(r)
  }

  const merged = []
  for (const [, group] of groups) {
    if (group.length === 1) {
      merged.push(group[0])
      continue
    }

    // Check if all rows have different weights
    const weights = group.map(r => `${r.weight_value}${r.weight_unit}`)
    const uniqueWeights = new Set(weights)
    if (uniqueWeights.size < 2) {
      // Same weight → already handled by dedupe, just keep one
      merged.push(group[0])
      continue
    }

    // Merge: all rows become variants under one handle
    const baseHandle = stripWeightFromHandle(group[0].handle)
    const baseTitle = stripWeight(group[0].product_title)

    console.log(`  ⟐ Merging ${group.length} variants: ${baseHandle} [${weights.join(", ")}]`)
    stats.merged_groups++

    for (let i = 0; i < group.length; i++) {
      const r = group[i]
      r.handle = baseHandle
      r.product_title = baseTitle
      // Variant title should be the weight, not "Default" from variant_title_raw
      const w = r.weight_value && r.weight_unit ? `${r.weight_value}${r.weight_unit}` : (r.variant_title || "Default")
      r.variant_title = w
      merged.push(r)
    }
  }
  return merged
}

function stripWeightFromHandle(handle) {
  // "trs-toor-dal-oily-1kg" → "trs-toor-dal-oily"
  // "east-end-chana-dal-2kg" → "east-end-chana-dal"
  // "trs-red-split-lentils-500g" → "trs-red-split-lentils"
  const m = handle.match(/^(.+?)[-_]\d+\.?\d*(g|kg|ml|l)$/i)
  if (m) return m[1]
  return handle
}

cleaned = mergeSiblingVariants(cleaned)

// ═══════════════════════════════════════════════════
// PHASE 4: Strip weight from ALL product titles
// ═══════════════════════════════════════════════════
for (const r of cleaned) {
  const original = r.product_title
  const stripped = stripWeight(original)
  if (stripped !== original) {
    r.product_title = stripped
    stats.titles_stripped++
  }

  // Strip weight from handle for single-variant products
  // (multi-variant handles are already stripped from Phase 3)
  const strippedHandle = stripWeightFromHandle(r.handle)
  if (strippedHandle !== r.handle) {
    // Only strip if this handle is truly single (not part of a multi-variant group)
    const sameHandle = cleaned.filter(r2 => r2.handle === r.handle)
    if (sameHandle.length === 1) {
      r.handle = strippedHandle
      stats.handles_stripped++
    }
  }
}

// ═══════════════════════════════════════════════════
// Final: Sort by brand, then handle
// ═══════════════════════════════════════════════════
cleaned.sort((a, b) => {
  const brandCmp = (a.brand || "").localeCompare(b.brand || "")
  if (brandCmp !== 0) return brandCmp
  return a.handle.localeCompare(b.handle)
})

// ═══════════════════════════════════════════════════
// FINAL PASS: Remove remaining cross-source duplicates
// Any product with variant_sku starting with "generic-" that has a counterpart
// with the same (category, weight, brand-normalized) is a dupe
// ═══════════════════════════════════════════════════
function finalCrossSourceDedupe(rows) {
  const generic = rows.filter(r => r.variant_sku.startsWith("generic-"))
  const nonGeneric = rows.filter(r => !r.variant_sku.startsWith("generic-"))

  // Build lookup: non-generic rows keyed by (brand, category, weight)
  const ngLookup = new Map()
  for (const r of nonGeneric) {
    const brand = normalizeBrand(r)
    const key = `${brand}||${r.category_handle}||${r.weight_value}${r.weight_unit}`
    if (!ngLookup.has(key)) ngLookup.set(key, [])
    ngLookup.get(key).push(r)
  }

  const toDelete = new Set()
  for (const r of generic) {
    const brand = normalizeBrand(r)
    const key = `${brand}||${r.category_handle}||${r.weight_value}${r.weight_unit}`
    if (ngLookup.has(key)) {
      toDelete.add(r)
      console.log(`  ✂ FINAL: ${r.handle} (generic SKU) → kept ${ngLookup.get(key).map(n => n.handle)[0]}`)
    }
  }

  stats.cs_deleted += toDelete.size
  return rows.filter(r => !toDelete.has(r))
}

cleaned = finalCrossSourceDedupe(cleaned)

// ═══════════════════════════════════════════════════
// WRITE CLEANED CSV
// ═══════════════════════════════════════════════════
const outLines = [HEADER]
for (const r of cleaned) {
  const vals = headerCols.map(col => r[col] || "")
  outLines.push(vals.join(","))
}
writeFileSync("products.csv.cleaned", outLines.join("\n") + "\n", "utf-8")

console.log(`\n${"=".repeat(60)}`)
console.log("CLEANUP SUMMARY")
console.log(`${"=".repeat(60)}`)
console.log(`  Deleted duplicate rows:      ${stats.deleted}`)
console.log(`  Cross-source MVC dupes:      ${stats.cs_deleted}`)
console.log(`  Fixed column-shifted rows:   ${stats.fixed_shifts}`)
console.log(`  Merged sibling groupings:    ${stats.merged_groups}`)
console.log(`  Titles stripped of weight:   ${stats.titles_stripped}`)
console.log(`  Handles stripped of weight:  ${stats.handles_stripped}`)
console.log(`  Final row count:             ${cleaned.length}`)
console.log(`  Unique handles:              ${new Set(cleaned.map(r => r.handle)).size}`)
console.log(`\n  Output: products.csv.cleaned`)
