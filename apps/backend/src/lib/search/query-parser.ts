import { BRANDS, Brand } from "../../config/brands"
import { resolveSynonyms, SEARCH_SYNONYMS } from "@indiagrocers/meilisearch"

/**
 * ParsedSearchQuery — output of the natural-language search query parser.
 * US-05-02: Brand + Weight Query Parser
 */

export interface ParsedSearchQuery {
  /** The product/ingredient portion of the query after stripping brand/weight */
  product_term: string
  /** Original raw query */
  raw: string
  /** Matched brand slug, if a known brand was extracted */
  brand_slug?: string
  /** Matched brand object for display */
  brand?: Brand
  /** Human-readable weight string extracted from query: "1kg", "500g" */
  weight?: string
  /** Normalised weight in grams */
  weight_grams?: number
  /** Expanded search terms including synonyms */
  expanded_terms: string[]
  /** Whether a synonym was resolved (for "Showing results for..." notice) */
  synonym_applied: boolean
  /** The resolved primary term if a synonym was applied */
  resolved_term?: string
}

// ---------------------------------------------------------------------------
// Weight extraction regexes
// ---------------------------------------------------------------------------

interface WeightMatch {
  raw: string
  value: number
  unit: "g" | "kg" | "ml" | "l"
  /** Normalised to grams */
  grams: number
}

const WEIGHT_PATTERNS: { regex: RegExp; unit: "g" | "kg" | "ml" | "l" }[] = [
  // 500g, 500 g, 500 grams
  { regex: /(\d+\.?\d*)\s*(g|grams?)\b/i, unit: "g" },
  // 1kg, 1 kg, 1 kilogram, 1 kilo
  { regex: /(\d+\.?\d*)\s*(kg|kilo(?:gram)?s?)\b/i, unit: "kg" },
  // 500ml, 500 ml, 500 millilitre
  { regex: /(\d+\.?\d*)\s*(ml|millilitres?|milliliters?)\b/i, unit: "ml" },
  // 1l, 1 l, 1 litre, 1 liter
  { regex: /(\d+\.?\d*)\s*(l|litres?|liters?)\b/i, unit: "l" },
]

function toGrams(value: number, unit: "g" | "kg" | "ml" | "l"): number {
  switch (unit) {
    case "kg":
      return Math.round(value * 1000)
    case "l":
      return Math.round(value * 1000)
    case "ml":
      return Math.round(value)
    case "g":
    default:
      return Math.round(value)
  }
}

function extractWeight(raw: string): WeightMatch | null {
  for (const { regex, unit } of WEIGHT_PATTERNS) {
    const match = raw.match(regex)
    if (match) {
      const value = parseFloat(match[1])
      if (!isNaN(value) && value > 0) {
        return {
          raw: match[0],
          value,
          unit,
          grams: toGrams(value, unit),
        }
      }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Brand extraction
// ---------------------------------------------------------------------------

/**
 * Tries each word/phrase in the query against the brand master list.
 * Uses fuzzy matching with edit distance ≤ 1 (for typos like "Aashriwad").
 */
function extractBrand(raw: string, brands: Brand[]): { brand: Brand; word: string } | null {
  const lower = raw.toLowerCase()
  const words = lower.split(/\s+/)

  // Try whole query first (e.g., "east end")
  for (const brand of brands) {
    if (lower.includes(brand.slug) || lower.includes(brand.name.toLowerCase())) {
      return { brand, word: brand.name }
    }
  }

  // Try individual words with Levenshtein ≤ 1
  for (const word of words) {
    if (word.length < 3) continue
    for (const brand of brands) {
      const slug = brand.slug
      if (levenshtein(word, slug) <= 1) {
        return { brand, word: brand.name }
      }
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Levenshtein distance (edit distance)
// ---------------------------------------------------------------------------

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  )
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parses a natural-language Indian grocery search query.
 *
 * Examples:
 *   "MDH garam masala 100g" → product_term="garam masala", brand_slug="mdh", weight="100g"
 *   "5kg toor dal"          → product_term="toor dal", weight="5kg"
 *   "besan"                 → product_term="besan"
 */
export function parseSearchQuery(raw: string, brands: Brand[] = BRANDS): ParsedSearchQuery {
  let remaining = raw.trim().toLowerCase()
  let weight: string | undefined
  let weightGrams: number | undefined
  let brandSlug: string | undefined
  let brand: Brand | undefined

  // 1. Extract weight
  const weightMatch = extractWeight(remaining)
  if (weightMatch) {
    weight = weightMatch.raw
    weightGrams = weightMatch.grams
    remaining = remaining.replace(weightMatch.raw, "").trim()
  }

  // 2. Extract brand
  const brandMatch = extractBrand(remaining, brands)
  if (brandMatch) {
    brandSlug = brandMatch.brand.slug
    brand = brandMatch.brand
    // Remove brand words from remaining
    const brandWords = brandMatch.word.toLowerCase().split(/\s+/)
    for (const w of brandWords) {
      remaining = remaining.replace(w, "").trim()
    }
  }

  // 3. Clean up remaining — product term
  const productTerm = remaining.replace(/\s+/g, " ").trim()

  // 4. Resolve synonyms
  const expandedTerms = resolveSynonyms(productTerm || raw)

  // Determine if a synonym was applied (product_term differs from a known synonym key)
  const lowerProduct = productTerm.toLowerCase()
  let synonymApplied = false
  let resolvedTerm: string | undefined

  if (expandedTerms.length > 1) {
    // Find the canonical term if the user typed a synonym value
    for (const entry of SEARCH_SYNONYMS) {
      if (entry.synonyms.some((s: string) => s.toLowerCase() === lowerProduct)) {
        synonymApplied = true
        resolvedTerm = entry.term
        break
      }
    }
  }

  return {
    product_term: productTerm || raw,
    raw,
    brand_slug: brandSlug,
    brand,
    weight,
    weight_grams: weightGrams,
    expanded_terms: expandedTerms,
    synonym_applied: synonymApplied,
    resolved_term: resolvedTerm,
  }
}

/**
 * Builds MeiliSearch filter strings from the parsed query.
 * e.g. ["metadata.brand_slug = mdh", "variants.options.Weight = 100g"]
 */
export function buildFiltersFromQuery(
  parsed: ParsedSearchQuery
): { filters: string; appliedFilters: string[] } {
  const filters: string[] = []
  const applied: string[] = []

  if (parsed.brand_slug) {
    filters.push(`metadata.brand_slug = '${parsed.brand_slug}'`)
    applied.push(`Brand: ${parsed.brand?.name ?? parsed.brand_slug}`)
  }

  if (parsed.weight) {
    filters.push(`variants.options.Weight = '${parsed.weight}'`)
    applied.push(`Weight: ${parsed.weight}`)
  }

  return {
    filters: filters.join(" AND "),
    appliedFilters: applied,
  }
}
