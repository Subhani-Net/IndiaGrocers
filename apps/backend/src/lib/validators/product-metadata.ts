import { z } from "zod"
import { UK_14_ALLERGENS } from "../../types/product-metadata"
import { REGIONAL_TAGS } from "../../config/regional-tags"
import { BRAND_SLUGS } from "../../config/brands"

/**
 * Zod validation schema for ProductMetadata.
 *
 * US-01-01 / US-01-04: Validates allergens against UK 14-allergen whitelist,
 * VAT rate to exactly 0 or 0.20, regional tags against the allowed list,
 * and brand_slug against the brands master list.
 */

const VALID_REGIONAL_TAGS = REGIONAL_TAGS

const VALID_DIETARY_FLAGS = [
  "vegetarian",
  "vegan",
  "gluten-free",
  "organic",
] as const

export const productMetadataSchema = z.object({
  allergens: z
    .array(z.enum(UK_14_ALLERGENS))
    .describe("Subset of UK 14 allergens present in this product"),

  vat_rate: z
    .union([z.literal(0), z.literal(0.2)])
    .describe("HMRC VAT rate: 0 for zero-rated grocery, 0.20 for standard-rated"),

  country_of_origin: z.string().min(1, "country_of_origin is required"),

  uk_food_business_operator: z
    .string()
    .min(1, "uk_food_business_operator is required"),

  best_before_guidance: z.string().optional(),

  ingredients: z.string().min(1, "ingredients is required"),

  dietary_flags: z.array(z.enum(VALID_DIETARY_FLAGS)).default([]),

  velocity: z.enum(["A", "B", "C"]),

  sourcing_tier: z.enum(["A", "B", "C", "D"]),

  regional_tags: z
    .array(z.enum(VALID_REGIONAL_TAGS))
    .describe("Regional cuisine tags from the allowed list"),

  subscription_eligible: z.boolean(),

  requires_fast_delivery: z.boolean(),

  requires_cold_chain: z.boolean(),

  brand_slug: z
    .string()
    .min(1, "brand_slug is required")
    .refine(
      (slug) => BRAND_SLUGS.has(slug),
      { message: "brand_slug is not a recognised brand slug. See GET /admin/reference/brands" }
    ),
})

export type ProductMetadataInput = z.infer<typeof productMetadataSchema>

/**
 * Validates a raw metadata object and returns typed result.
 * Returns { success: true, data } or { success: false, error: ZodError }.
 */
export function validateProductMetadata(raw: unknown) {
  return productMetadataSchema.safeParse(raw)
}
