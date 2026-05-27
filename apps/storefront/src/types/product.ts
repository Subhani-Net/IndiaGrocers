/**
 * Extended product types for the IndiaGrocers storefront.
 * Mirrors the backend ProductMetadata / VariantMetadata interfaces
 * defined in apps/backend/src/types/.
 *
 * US-01-06
 */

// ---------------------------------------------------------------------------
// Grocery-specific metadata shapes
// ---------------------------------------------------------------------------

export type Allergen =
  | "celery"
  | "gluten"
  | "crustaceans"
  | "eggs"
  | "fish"
  | "lupin"
  | "milk"
  | "molluscs"
  | "mustard"
  | "tree-nuts"
  | "peanuts"
  | "sesame"
  | "soya"
  | "sulphites"

export type VatRate = 0 | 0.2

export type WeightUnit = "g" | "kg" | "ml" | "l"

export type DietaryFlag = "vegetarian" | "vegan" | "gluten-free" | "organic"

export type RegionalTag =
  | "punjabi"
  | "gujarati"
  | "south-indian"
  | "bengali"
  | "east-african-asian"

export type VelocityClass = "A" | "B" | "C"

export interface GroceryProductMetadata {
  allergens: Allergen[]
  vat_rate: VatRate
  country_of_origin: string
  uk_food_business_operator: string
  best_before_guidance?: string
  ingredients: string
  dietary_flags: DietaryFlag[]
  velocity: VelocityClass
  sourcing_tier: "A" | "B" | "C" | "D"
  regional_tags: RegionalTag[]
  subscription_eligible: boolean
  requires_fast_delivery: boolean
  requires_cold_chain: boolean
  brand_slug: string
  synonyms: string[]
}

export interface GroceryVariantMetadata {
  weight_value: number
  weight_unit: WeightUnit
  weight_grams: number
  /** Price per unit in pence */
  price_per_unit: number
  /** Human-readable label: "per kg", "per 100g", "per 100ml" */
  price_per_unit_label: string
  /** True on the variant with the lowest price-per-unit in its product */
  is_best_value: boolean
  low_stock_threshold: number
}

// ---------------------------------------------------------------------------
// Extended Medusa types
// ---------------------------------------------------------------------------

/**
 * A Medusa product with our grocery-specific metadata typed correctly.
 * Use this type wherever product data is consumed in the storefront.
 */
export type GroceryProduct = {
  id: string
  title: string
  handle: string
  description?: string | null
  thumbnail?: string | null
  images?: { id: string; url: string }[]
  tags?: { id: string; value: string }[]
  collection?: { id: string; handle: string; title: string } | null
  categories?: { id: string; handle: string; name: string }[]
  variants: GroceryVariant[]
  metadata: GroceryProductMetadata
  created_at: string
  updated_at: string
}

export type GroceryVariant = {
  id: string
  title: string
  sku?: string | null
  inventory_quantity?: number
  allow_backorder?: boolean
  calculated_price?: {
    calculated_amount: number
    original_amount: number
    currency_code: string
  } | null
  options?: { id: string; value: string; option?: { title: string } }[]
  metadata: GroceryVariantMetadata
}
