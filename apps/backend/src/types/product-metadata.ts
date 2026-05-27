/**
 * ProductMetadata — custom fields stored on every Medusa product's `metadata`
 * object. Required by UK Food Information Regulations 2014 and HMRC VAT rules.
 *
 * US-01-01: Extend Product Metadata Schema for UK Grocery Compliance
 */

export const UK_14_ALLERGENS = [
  "celery",
  "gluten",
  "crustaceans",
  "eggs",
  "fish",
  "lupin",
  "milk",
  "molluscs",
  "mustard",
  "tree-nuts",
  "peanuts",
  "sesame",
  "soya",
  "sulphites",
] as const

export type Allergen = (typeof UK_14_ALLERGENS)[number]

export type VatRate = 0 | 0.2

export type VelocityClass = "A" | "B" | "C"

export type SourcingTier = "A" | "B" | "C" | "D"

export type RegionalTag =
  | "punjabi"
  | "gujarati"
  | "south-indian"
  | "bengali"
  | "east-african-asian"

export type DietaryFlag =
  | "vegetarian"
  | "vegan"
  | "gluten-free"
  | "organic"

export interface ProductMetadata {
  /** UK 14-allergen list — subset that applies to this product */
  allergens: Allergen[]
  /** HMRC classification: 0 = zero-rated grocery, 0.20 = standard-rated (snacks) */
  vat_rate: VatRate
  country_of_origin: string
  /** Legal entity responsible per UK Food Information Regulations 2014 */
  uk_food_business_operator: string
  /** Optional guidance for spices/snacks (e.g. "Best before: see base") */
  best_before_guidance?: string
  /** Full ingredients list as printed on pack */
  ingredients: string
  dietary_flags: DietaryFlag[]
  /** Inventory velocity: A = fast-mover, B = mid, C = slow */
  velocity: VelocityClass
  sourcing_tier: SourcingTier
  regional_tags: RegionalTag[]
  subscription_eligible: boolean
  /** Fresh dairy — restrict to next-day delivery slots */
  requires_fast_delivery: boolean
  /** Frozen products — require cold-chain delivery */
  requires_cold_chain: boolean
  /** Reference to the brands master list slug */
  brand_slug: string
  /**
   * Per-product transliteration / alternate search terms.
   * Hindi/Urdu/Tamil/Bengali names a customer might type that are NOT
   * covered by the global synonym dictionary. Indexed in MeiliSearch
   * as `metadata.synonyms` and treated as searchable text.
   *
   * Example for "TRS Besan": ["besan", "gram flour", "chickpea flour"]
   * Example for "Tilda Basmati": ["chawal", "chaval", "biryani rice"]
   */
  synonyms: string[]
}
