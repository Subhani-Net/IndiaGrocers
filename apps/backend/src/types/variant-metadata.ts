/**
 * VariantMetadata — custom fields stored on every Medusa product variant's
 * `metadata` object. Each variant represents one weight/size SKU.
 *
 * US-01-02: Extend Product Variant Metadata for Weight and Unit Pricing
 */

export type WeightUnit = "g" | "kg" | "ml" | "l"

export interface VariantMetadata {
  /** Numeric weight value (e.g. 500, 1, 5) */
  weight_value: number
  weight_unit: WeightUnit
  /** Weight normalised to grams for price-per-unit calculation */
  weight_grams: number
  /** Calculated price-per-unit in pence — stored for fast retrieval */
  price_per_unit: number
  /** Human-readable unit label: "per kg", "per 100g", "per 100ml" */
  price_per_unit_label: string
  /** True on exactly one variant per product — the lowest price-per-unit */
  is_best_value: boolean
  /** Unit count below which "Only X left" badge shows on storefront */
  low_stock_threshold: number
  /** Optional ops note (e.g. C&C source, supplier code) */
  sourcing_note?: string
}
