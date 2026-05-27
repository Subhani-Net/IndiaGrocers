import { z } from "zod"

/**
 * Zod validation schema for VariantMetadata.
 * US-01-02
 */

export const variantMetadataSchema = z.object({
  weight_value: z
    .number()
    .positive("weight_value must be a positive number"),

  weight_unit: z.enum(["g", "kg", "ml", "l"]),

  weight_grams: z
    .number()
    .positive("weight_grams must be a positive number"),

  price_per_unit: z
    .number()
    .nonnegative("price_per_unit cannot be negative"),

  price_per_unit_label: z.string().min(1),

  is_best_value: z.boolean(),

  low_stock_threshold: z
    .number()
    .int()
    .nonnegative()
    .default(5),

  sourcing_note: z.string().optional(),
})

export type VariantMetadataInput = z.infer<typeof variantMetadataSchema>

export function validateVariantMetadata(raw: unknown) {
  return variantMetadataSchema.safeParse(raw)
}
