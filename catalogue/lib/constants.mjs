/**
 * Shared constants + configuration for the catalogue seed pipeline.
 * Single source of truth for validation sets, brand maps, and API config.
 */

// ── API endpoints ──────────────────────────────────────────
/** @type {string} Medusa Admin API base URL */
export const BASE = "http://127.0.0.1:9000"

/** @type {string} MeiliSearch base URL */
export const MEILI = "http://localhost:7700"

/** @type {{ email: string, password: string }} Admin credentials */
export const ADMIN_CREDS = { email: "admin@example.com", password: "password123" }

// ── UK 14 Allergens (Food Information Regulations 2014) ────
export const UK_ALLERGENS = new Set([
  "celery", "gluten", "crustaceans", "eggs", "fish", "lupin",
  "milk", "molluscs", "mustard", "tree-nuts", "peanuts",
  "sesame", "soya", "sulphites",
])

// ── Allergen remapping (CSV uses "wheat" → must be "gluten") ─
/** @type {Record<string, string>} Mappings to canonical allergen names */
export const ALLERGEN_REMAP = {
  wheat: "gluten",
}

// ── Dietary flags ──────────────────────────────────────────
export const VALID_DIETARY_FLAGS = new Set([
  "vegetarian", "vegan", "gluten-free", "organic",
])

// ── Regional tags ──────────────────────────────────────────
export const VALID_REGIONAL_TAGS = new Set([
  "punjabi", "gujarati", "south-indian", "bengali", "east-african-asian",
])

// ── Brand auto-detection ───────────────────────────────────
/**
 * Maps title substrings → canonical brand_slug.
 * Order matters: longer matches checked first.
 */
export const BRAND_MAP = {
  "aashirvaad": "aashirvaad", "aachi": "aachi",
  "ashoka": "ashoka", "amul": "amul",
  "britannia": "britannia", "bikaji": "bikaji",
  "brooke bond": "brooke-bond", "bournvita": "bournvita",
  "chings": "chings-secret", "cadbury": "cadbury",
  "dabur": "dabur", "daawat": "daawat",
  "east end": "east-end", "east-end": "east-end",
  "everest": "everest", "elephant": "elephant",
  "falak": "falak", "frooti": "frooti",
  "girnar": "girnar", "glucon-d": "glucon-d",
  "haldiram": "haldirams", "haldiram's": "haldirams",
  "hamdard": "hamdard", "hajmola": "hajmola",
  "horlicks": "horlicks",
  "idhayam": "idhayam",
  "kohinoor": "kohinoor",
  "laziza": "laziza", "lal qilla": "lal-qilla",
  "lijjat": "lijjat",
  "mdh": "mdh", "maggi": "maggi", "mtr": "mtr", "maaza": "maaza",
  "natco": "natco", "national": "national-foods",
  "parle": "parle", "parle-g": "parle",
  "patak's": "pataks", "patak": "pataks",
  "pillsbury": "pillsbury", "priya": "priya",
  "shan": "shan",
  "trs": "trs", "tilda": "tilda",
  "tata gold": "tata-gold",
  "wagh bakri": "wagh-bakri",
}

// ── Barcode constants ──────────────────────────────────────
/** Prefix for generated placeholder barcodes (identifiable as non-EAN) */
export const GEN_BARCODE_PREFIX = "GEN_"

/** EAN-13 length (without check digit). 12-13 digit numeric strings are treated as real EANs. */
export const EAN_MIN_LENGTH = 12
