/**
 * Product normalizer — title stripping, weight extraction, brand detection,
 * barcode assignment, and variant grouping logic.
 */
import { BRAND_MAP, GEN_BARCODE_PREFIX, EAN_MIN_LENGTH } from "./constants.mjs"

// ═══════════════════════════════════════════════════════════
// TITLE + HANDLE NORMALIZATION
// ═══════════════════════════════════════════════════════════

/** Regex for weight suffix: "1kg", "500g", "1.5l", "250ml", "6pack", "100 bags", etc. */
const WEIGHT_RE = /\s+\d+(\.\d+)?\s*(g|kg|ml|l|pack|tin|bags|bag|box)\s*$/i

/** Regex for weight embedded in handle: "-500g", "_1kg", "-1.5l", etc. */
const HANDLE_WEIGHT_RE = /[-_](\d+\.?\d*)(g|kg|ml|l)\s*$/i

/**
 * Strip weight suffix from a product title.
 * "TRS - Toor Dal Oily 1kg" → "TRS - Toor Dal Oily"
 */
export function stripWeight(title) {
  return title.replace(WEIGHT_RE, "").trim()
}

/**
 * Strip brand prefix from a product title.
 * "TRS - Toor Dal Oily" → "Toor Dal Oily"
 */
export function stripBrand(title) {
  return title.replace(/^[^-]+\s*-\s*/, "").trim()
}

/**
 * Extract the "core" product name (no brand, no weight).
 * "TRS - Toor Dal Oily 1kg" → "toor dal oily"
 * "TRS Ginger Paste" → "ginger paste" (detects brand without dash)
 */
export function coreName(title) {
  if (!title) return ""
  let cleaned = title

  // First try dash-based brand removal ("Brand - Product")
  cleaned = stripBrand(cleaned)

  // If still has brand name at start (no dash), try word-by-word removal
  if (cleaned.length === title.length) {
    // The stripBrand didn't match — try removing known brand prefixes
    const lower = cleaned.toLowerCase()
    for (const [brandName] of Object.entries(BRAND_MAP).sort((a, b) => b[0].length - a[0].length)) {
      if (lower.startsWith(brandName + " ")) {
        cleaned = cleaned.slice(brandName.length).trim()
        break
      }
      // Handle multi-word brands like "east end", "brooke bond", etc.
      if (lower.startsWith(brandName)) {
        cleaned = cleaned.slice(brandName.length).trim()
        break
      }
    }
  }

  return stripWeight(cleaned).toLowerCase()
}

/**
 * Strip weight from a handle.
 * "trs-toor-dal-oily-1kg" → "trs-toor-dal-oily"
 * Non-matching handles returned as-is.
 */
export function stripHandleWeight(handle) {
  const m = handle.match(HANDLE_WEIGHT_RE)
  return m ? handle.slice(0, m.index) : handle
}

/**
 * Extract { value, unit } from a handle.
 * "trs-toor-dal-oily-1kg" → { value: "1", unit: "kg" }
 * Returns null if no weight found.
 */
export function parseWeightFromHandle(handle) {
  const m = handle.match(HANDLE_WEIGHT_RE)
  if (!m) return null
  return { value: m[1], unit: m[2].toLowerCase() }
}

/**
 * Extract { value, unit } from a product title.
 * "TRS - Toor Dal Oily 1kg" → { value: "1", unit: "kg" }
 */
export function parseWeightFromTitle(title) {
  const m = title.match(/(\d+\.?\d*)\s*(g|kg|ml|l)\b/i)
  if (!m) return null
  return { value: m[1], unit: m[2].toLowerCase() }
}

// ═══════════════════════════════════════════════════════════
// BRAND DETECTION
// ═══════════════════════════════════════════════════════════

/**
 * Auto-detect brand_slug from a product title or handle.
 * Falls back to "generic" if no match.
 * @param {string} titleOrHandle
 * @returns {string}
 */
export function detectBrand(titleOrHandle) {
  if (!titleOrHandle) return "generic"
  const lower = titleOrHandle.toLowerCase()
  // Check longer matches first (e.g. "brooke bond" before "bond")
  const entries = Object.entries(BRAND_MAP).sort((a, b) => b[0].length - a[0].length)
  for (const [name, slug] of entries) {
    if (lower.includes(name)) return slug
  }
  return "generic"
}

// ═══════════════════════════════════════════════════════════
// BARCODE ASSIGNMENT
// ═══════════════════════════════════════════════════════════

/**
 * Assign a barcode to a variant row.
 *
 * Rules (priority order):
 * 1. Real EAN-13 in variant_barcode column (12-13 digits) → use as-is
 * 2. Numeric handle that looks like EAN + product is single-variant → use handle
 * 3. Generate readable placeholder: GEN_{productHandle}_{weight}
 *
 * @param {Record<string,string>} row — CSV row
 * @param {string} productHandle — the product's handle (after weight stripping)
 * @param {number} variantCount — total variants in this product (1 = single-variant)
 * @returns {string} assigned barcode
 */
export function assignBarcode(row, productHandle, variantCount) {
  // Rule 1: Existing real barcode
  const existing = (row.variant_barcode || "").trim()
  if (existing && /^\d{12,13}$/.test(existing) && existing !== "0") {
    return existing
  }

  // Rule 2: Numeric handle is likely an EAN-13 (single-variant only)
  if (variantCount === 1 && /^\d{12,13}$/.test(row.handle)) {
    return row.handle
  }

  // Rule 3: Generate placeholder
  const weight = (row.weight_value || "0") + (row.weight_unit || "")
  return `${GEN_BARCODE_PREFIX}${productHandle}_${weight}`
}

/**
 * Check if a barcode is a generated placeholder (not a real EAN-13).
 */
export function isGeneratedBarcode(barcode) {
  return barcode && barcode.startsWith(GEN_BARCODE_PREFIX)
}

// ═══════════════════════════════════════════════════════════
// VARIANT GROUPING
// ═══════════════════════════════════════════════════════════

/**
 * Normalize product rows into variant groups.
 *
 * Each group has:
 *   - handle: shared product handle (weight stripped)
 *   - title: shared product title (weight stripped)
 *   - brand: normalized brand name
 *   - category_handle: shared category
 *   - variants: array of variant rows with individual weight + barcode
 *
 * @param {Array<Record<string,string>>} rows — all CSV product rows
 * @returns {Array<{ handle: string, title: string, brand: string, category_handle: string, variants: Array<Record<string,string>> }>}
 */
export function groupVariants(rows) {
  // Group by (brand, coreName, category)
  const groups = new Map()

  for (const row of rows) {
    const brand = detectBrand(row.product_title || row.handle)
    const core = coreName(row.product_title || row.handle)
    const cat = (row.category_handle || "").trim()
    const key = `${brand}||${core}||${cat}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }

  const result = []

  for (const [, group] of groups) {
    if (group.length === 0) continue

    // Dedupe same-weight rows (keep first)
    const uniqueWeights = new Map()
    for (const row of group) {
      const wKey = `${row.weight_value}${row.weight_unit}`
      if (!uniqueWeights.has(wKey)) {
        uniqueWeights.set(wKey, row)
      }
    }
    const deduped = [...uniqueWeights.values()]
    deduped.sort((a, b) => {
      const wa = parseFloat(a.weight_value) || 0
      const wb = parseFloat(b.weight_value) || 0
      return wa - wb
    })

    // Determine shared handle + title
    const baseHandle = stripHandleWeight(group[0].handle)
    const baseTitle = stripWeight(group[0].product_title || "")
    const brand = detectBrand(baseTitle || group[0].handle)

    // Set variant_title on each row
    for (const row of deduped) {
      row.handle = baseHandle
      row.product_title = baseTitle
      row.variant_title = `${row.weight_value}${row.weight_unit}`
    }

    // Assign barcodes (one unique barcode per variant)
    for (const row of deduped) {
      row.variant_barcode = assignBarcode(row, baseHandle, deduped.length)
    }

    result.push({
      handle: baseHandle,
      title: baseTitle,
      brand,
      category_handle: group[0].category_handle,
      variants: deduped,
    })
  }

  // Post-processing: merge groups with the same handle (cross-source duplicates)
  const mergedResult = []
  const handleGroups = new Map()
  for (const g of result) {
    if (!handleGroups.has(g.handle)) handleGroups.set(g.handle, [])
    handleGroups.get(g.handle).push(g)
  }
  for (const [, groupsWithSameHandle] of handleGroups) {
    if (groupsWithSameHandle.length === 1) {
      mergedResult.push(groupsWithSameHandle[0])
    } else {
      // Merge all variants from all groups into one
      const allVariants = groupsWithSameHandle.flatMap(g => g.variants)
      // Dedupe by weight
      const uniqueMap = new Map()
      for (const v of allVariants) {
        const wKey = `${v.weight_value}${v.weight_unit}`
        if (!uniqueMap.has(wKey)) uniqueMap.set(wKey, v)
      }
      const bestGroup = groupsWithSameHandle[0]
      const mergedVariants = [...uniqueMap.values()]
      mergedVariants.sort((a, b) => (parseFloat(a.weight_value) || 0) - (parseFloat(b.weight_value) || 0))
      // Reassign barcodes to ensure uniqueness
      for (const v of mergedVariants) {
        v.variant_barcode = assignBarcode(v, bestGroup.handle, mergedVariants.length)
      }
      mergedResult.push({
        handle: bestGroup.handle,
        title: bestGroup.title,
        brand: bestGroup.brand,
        category_handle: bestGroup.category_handle,
        variants: mergedVariants,
      })
    }
  }

  return mergedResult
}
