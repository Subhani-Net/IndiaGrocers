/**
 * Source of truth for valid regional cuisine tags.
 * US-01-04
 *
 * Used by:
 * - ProductMetadata Zod validator (validates regional_tags values)
 * - Admin API GET /admin/reference/regional-tags
 * - Storefront filter chips on category/search pages
 */

export const REGIONAL_TAGS = [
  "punjabi",
  "gujarati",
  "south-indian",
  "bengali",
  "east-african-asian",
] as const

export type RegionalTagValue = (typeof REGIONAL_TAGS)[number]

export const REGIONAL_TAG_LABELS: Record<RegionalTagValue, string> = {
  punjabi: "Punjabi",
  gujarati: "Gujarati",
  "south-indian": "South Indian",
  bengali: "Bengali",
  "east-african-asian": "East African Asian",
}
