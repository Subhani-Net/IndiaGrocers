/**
 * Pre-flight validators for categories and products.
 * All checks run BEFORE any API calls — fail-fast with explicit error messages.
 *
 * Now with Zod schema enforcement on every CSV row + variant uniformity checks.
 */
import { z } from "zod"
import {
  UK_ALLERGENS, ALLERGEN_REMAP, VALID_DIETARY_FLAGS,
  VALID_REGIONAL_TAGS, EAN_MIN_LENGTH, GEN_BARCODE_PREFIX,
} from "./constants.mjs"
import { detectBrand } from "./normalizer.mjs"

// ═══════════════════════════════════════════════════════════
// ZOD SCHEMA — csvProductRowSchema
// ═══════════════════════════════════════════════════════════

/**
 * Zod schema for a single products.csv row.
 * Enforces types, lengths, and format rules at the cell level.
 *
 * Requirements:
 *  1. category_handle: lowercase alphanumeric + underscores only
 *  2. variant_barcode: exactly 13 digits, starts with GEN_, or empty
 *  3. status: must be published, draft, proposed, or rejected
 *  4. brand_slug: cannot be "0"
 *  5. weight_value: numeric or empty
 *  6. weight_unit: must not look like an image path (column shift guard)
 *  7. handle: URL-safe characters only
 */ 
export const csvProductRowSchema = z.object({
  handle: z.string().min(1, "handle is required")
    .regex(/^[a-z0-9_-]+$/, "handle must contain only lowercase letters, numbers, hyphens, and underscores"),
  variant_id: z.string(),
  variant_sku: z.string(),
  variant_barcode: z.string().refine(
    (bc) => {
      if (!bc || bc === "") return true                         // empty is ok (will be generated)
      if (bc.startsWith(GEN_BARCODE_PREFIX)) return true         // generated placeholder
      if (bc.startsWith("VEG_")) return true                     // vegetable placeholder
      return /^\d{13}$/.test(bc)                                 // exactly 13-digit EAN-13
    },
    { message: `variant_barcode must be exactly 13 digits, start with "${GEN_BARCODE_PREFIX}" or "VEG_", or be empty` }
  ),
  product_group: z.string(),
  variant_title: z.string(),
  product_title: z.string().min(1, "product_title is required"),
  subtitle: z.string(),
  description: z.string(),
  brand: z.string(),
  category_handle: z.string().min(1, "category_handle is required")
    .regex(/^[a-z0-9_]+$/, "category_handle must be lowercase alphanumeric with underscores only"),
  collection_handle: z.string(),
  dietary_flags: z.string(),
  tags: z.string(),
  allergens: z.string(),
  ingredients: z.string(),
  storage: z.string(),
  country_of_origin: z.string(),
  weight_value: z.string().regex(/^[0-9.]*$/, "weight_value must be numeric or empty"),
  weight_unit: z.string().refine(
    (wu) => !wu || !wu.startsWith("/uploads/"),
    { message: "weight_unit looks like an image path — column may be shifted. Expected: g, kg, ml, l" }
  ),
  thumbnail_url: z.string(),
  image_filenames: z.string(),
  velocity: z.string(),
  eco_rating: z.string(),
  brand_slug: z.string().min(1, "brand_slug is required")
    .refine((s) => s !== "0", { message: "brand_slug cannot be '0' — fix the value or auto-detection will apply" }),
  vat_rate: z.string(),
  regional_tags: z.string(),
  subscription_eligible: z.string(),
  status: z.string().refine(
    (val) => !val || ["published", "draft", "proposed", "rejected"].includes(val),
    (val) => ({ message: `status must be one of: published, draft, proposed, rejected (got "${val || '(empty)'}")` })
  ),
  variant_title_raw: z.string(),
  variant_sku_raw: z.string(),
})

/** @typedef {z.infer<typeof csvProductRowSchema>} CsvProductRow */

// ═══════════════════════════════════════════════════════════
// VALIDATE CATEGORIES
// ═══════════════════════════════════════════════════════════

/**
 * Validate categories CSV — checks parent-child integrity and duplicates.
 * @param {Array<Record<string,string>>} categories
 * @returns {{ errors: string[] }}
 */
export function validateCategories(categories) {
  const errors = []
  const handleSet = new Set()

  for (const [i, cat] of categories.entries()) {
    const line = i + 2
    if (!cat.handle || !cat.handle.trim()) {
      errors.push(`categories.csv row ${line}: missing handle`)
      continue
    }
    if (handleSet.has(cat.handle)) {
      errors.push(`categories.csv row ${line}: duplicate handle "${cat.handle}"`)
    }
    handleSet.add(cat.handle)
  }

  for (const [i, cat] of categories.entries()) {
    const line = i + 2
    if (cat.parent_handle && cat.parent_handle.trim()) {
      if (!handleSet.has(cat.parent_handle)) {
        errors.push(
          `categories.csv row ${line}: parent_handle "${cat.parent_handle}" not found — ` +
          `category "${cat.handle}" has an orphaned parent reference`
        )
      }
    }
  }

  return { errors }
}

// ═══════════════════════════════════════════════════════════
// VALIDATE PRODUCTS (Zod schema + cross-reference)
// ═══════════════════════════════════════════════════════════

/**
 * Validate all products.csv rows using Zod schema + relational checks.
 *
 * Also validates against the categories CSV (catMap) for orphaned handles,
 * detects duplicate rows, and enforces variant uniformity.
 *
 * @param {Array<Record<string,string>>} products — raw CSV row objects
 * @param {Map<string, string>} catMap — handle → category_name
 * @returns {{ errors: string[] }}
 */
export function validateProducts(products, catMap) {
  const errors = []

  // ── Phase 1: Zod schema validation per row ───────────
  for (const [i, row] of products.entries()) {
    const line = i + 2

    const result = csvProductRowSchema.safeParse(row)
    if (!result.success) {
      const issues = result.error.issues
      for (const issue of issues) {
        const field = issue.path.join(".")
        const value = JSON.stringify(row[field] ?? "(empty)")
        errors.push(
          `products.csv row ${line}: ${issue.message}` +
          `\n  Field: ${field}, Value: ${value}`
        )
      }
    }
  }

  // ── Phase 2: Category cross-reference ─────────────────
  for (const [i, row] of products.entries()) {
    const line = i + 2
    const ch = (row.category_handle || "").trim()
    if (!ch) continue // Zod already caught this
    if (!catMap.has(ch)) {
      const suggestions = [...catMap.keys()]
        .filter(k => k.includes(ch) || ch.includes(k))
        .slice(0, 3)
      errors.push(
        `products.csv row ${line}: category_handle "${ch}" not found in categories.csv ` +
        `— product "${row.product_title || row.handle}"` +
        (suggestions.length ? `\n  Did you mean: ${suggestions.join(", ")}?` : "")
      )
    }
  }

  // ── Phase 3: Brand slug detection ─────────────────────
  for (const [i, row] of products.entries()) {
    const line = i + 2
    const bs = (row.brand_slug || "").trim()
    if (!bs || bs === "0") {
      const autoDetected = detectBrand(row.product_title || row.handle || "")
      errors.push(
        `products.csv row ${line}: missing or invalid brand_slug "${bs}" ` +
        `— product "${row.product_title || row.handle}"` +
        `\n  Auto-detected: "${autoDetected}". Change brand_slug column to "${autoDetected}" or correct value.`
      )
    }
  }

  // ── Phase 4: Duplicate detection ──────────────────────
  const seen = new Map()
  for (const [i, row] of products.entries()) {
    const line = i + 2
    const dedupKey = `${row.handle}||${row.weight_value}${row.weight_unit}`
    if (seen.has(dedupKey)) {
      errors.push(
        `products.csv row ${line}: duplicate of row ${seen.get(dedupKey)} — ` +
        `same handle "${row.handle}" and weight "${row.weight_value}${row.weight_unit}"`
      )
    } else {
      seen.set(dedupKey, line)
    }
  }

  // ── Phase 5: Variant uniformity ───────────────────────
  const { errors: uniformityErrors, warnings: uniformityWarnings } = validateVariantUniformity(products)
  errors.push(...uniformityErrors)
  // Uniformity warnings are informational; add them as non-fatal
  // (prefixed with ☐ so the seed script can filter them from errors)
  uniformityWarnings.forEach(w => {
    errors.push(`☐ ${w}`)
  })

  return { errors }
}

// ═══════════════════════════════════════════════════════════
// VARIANT UNIFORMITY CHECK
// ═══════════════════════════════════════════════════════════

/**
 * Variant Uniformity Rule:
 * If multiple rows share the same parent product handle, certain parent-level
 * attributes must match identically (category_handle, brand, status, etc.) —
 * these are hard errors.
 *
 * Other attributes (thumbnail_url, description, country_of_origin) often vary
 * intentionally across weight variants (e.g., different product images per size)
 * and are reported as warnings instead of errors.
 *
 * @param {Array<Record<string,string>>} rows
 * @returns {string[]} errors + warnings
 */
function validateVariantUniformity(rows) {
  const errors = []
  const warnings = []

  // Group rows by handle
  const groups = new Map()
  for (let i = 0; i < rows.length; i++) {
    const handle = (rows[i].handle || "").trim()
    if (!handle) continue
    if (!groups.has(handle)) groups.set(handle, [])
    groups.get(handle).push({ index: i, row: rows[i] })
  }

  // Fields that MUST be identical (hard error)
  const STRICT_FIELDS = [
    "category_handle",
    "brand",
    "brand_slug",
    "status",
    "dietary_flags",
    "vat_rate",
    "collection_handle",
    "subscription_eligible",
  ]

  // Fields that are expected to vary per weight variant (warning only)
  const LOOSE_FIELDS = [
    "thumbnail_url",       // different sizes often have different images
    "description",         // variant-specific descriptions are common
    "country_of_origin",   // may differ for different pack sizes
    "product_title",       // may have weight in title on some rows
    "subtitle",
  ]

  for (const [handle, group] of groups) {
    if (group.length < 2) continue

    // ── Strict checks (errors) ──────────────────────────
    for (const field of STRICT_FIELDS) {
      const values = new Set(group.map(g => {
        const v = (g.row[field] || "").trim().toLowerCase()
        return v === "" ? null : v
      }))
      const nonEmpty = [...values].filter(v => v !== null)

      // Skip if all empty or only one non-empty value
      if (nonEmpty.length <= 1) continue

      if (nonEmpty.length > 1) {
        const lines = group.map(g => g.index + 2).join(", ")
        const uniqueVals = [...new Set(group.map(g => (g.row[field] || "").trim()).filter(v => v))].join(" vs ")
        errors.push(
          `VARIANT UNIFORMITY: handle "${handle}" has mismatched "${field}" across variant rows ` +
          `(rows ${lines}). ` +
          `Values: ${uniqueVals}. ` +
          `All variants of the same product MUST share the same ${field}.`
        )
      }
    }

    // ── Loose checks (warnings) ──────────────────────────
    for (const field of LOOSE_FIELDS) {
      const values = new Set(group.map(g => {
        const v = (g.row[field] || "").trim()
        return v === "" ? null : v
      }))
      const nonEmpty = [...values].filter(v => v !== null)

      if (nonEmpty.length > 1) {
        const lines = group.map(g => g.index + 2).join(", ")
        const uniqueVals = [...new Set(group.map(g => (g.row[field] || "").trim()).filter(v => v))].join(" vs ")
        warnings.push(
          `VARIANT UNIFORMITY (warning): handle "${handle}" has different "${field}" across rows ` +
          `(rows ${lines}). ` +
          `Values: ${uniqueVals}. ` +
          `This may be intentional (different weight images/descriptions).`
        )
      }
    }
  }

  // Warnings are informational, not blocking
  return { errors, warnings }
}

// ═══════════════════════════════════════════════════════════
// PRODUCT METADATA VALIDATION
// ═══════════════════════════════════════════════════════════

/**
 * Validate a single product's metadata for Zod schema compliance.
 * This mirrors the backend middleware at apps/backend/src/api/middlewares.ts.
 * @param {Record<string,any>} meta
 * @returns {{ errors: string[] }}
 */
export function validateProductMetadata(meta) {
  const errors = []

  if (!meta.country_of_origin || !meta.country_of_origin.toString().trim()) {
    errors.push("metadata.country_of_origin is required")
  }
  if (!meta.uk_food_business_operator || !meta.uk_food_business_operator.toString().trim()) {
    errors.push("metadata.uk_food_business_operator is required")
  }
  if (!meta.ingredients || !meta.ingredients.toString().trim()) {
    errors.push("metadata.ingredients is required")
  }
  if (meta.vat_rate !== 0 && meta.vat_rate !== 0.2) {
    errors.push(`metadata.vat_rate must be 0 or 0.2, got ${meta.vat_rate}`)
  }
  if (!["A", "B", "C"].includes(meta.velocity)) {
    errors.push(`metadata.velocity must be A, B, or C, got ${meta.velocity}`)
  }
  if (!["A", "B", "C", "D"].includes(meta.sourcing_tier)) {
    errors.push(`metadata.sourcing_tier must be A, B, C, or D, got ${meta.sourcing_tier}`)
  }
  if (typeof meta.subscription_eligible !== "boolean") {
    errors.push(`metadata.subscription_eligible must be boolean`)
  }
  if (typeof meta.requires_fast_delivery !== "boolean") {
    errors.push(`metadata.requires_fast_delivery must be boolean`)
  }
  if (typeof meta.requires_cold_chain !== "boolean") {
    errors.push(`metadata.requires_cold_chain must be boolean`)
  }

  if (Array.isArray(meta.allergens)) {
    for (const a of meta.allergens) {
      const mapped = ALLERGEN_REMAP[a] || a
      if (!UK_ALLERGENS.has(mapped)) {
        errors.push(`metadata.allergens: "${a}" is not a recognised UK 14 allergen`)
      }
    }
  }

  if (Array.isArray(meta.dietary_flags)) {
    for (const d of meta.dietary_flags) {
      if (!VALID_DIETARY_FLAGS.has(d)) {
        errors.push(`metadata.dietary_flags: "${d}" is not valid`)
      }
    }
  }

  if (Array.isArray(meta.regional_tags)) {
    for (const t of meta.regional_tags) {
      if (!VALID_REGIONAL_TAGS.has(t)) {
        errors.push(`metadata.regional_tags: "${t}" is not valid`)
      }
    }
  }

  if (!meta.brand_slug || !meta.brand_slug.toString().trim()) {
    errors.push("metadata.brand_slug is required")
  }

  return { errors }
}
