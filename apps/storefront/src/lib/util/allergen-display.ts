/**
 * Allergen display utilities for the IndiaGrocers storefront.
 * UK Food Information Regulations 2014 require all 14 major allergens to
 * be clearly highlighted in the ingredients list.
 *
 * US-01-06
 */

import { Allergen } from "../../types/product"

// ---------------------------------------------------------------------------
// Allergen label map — code → human-readable display name
// ---------------------------------------------------------------------------

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  celery: "Celery",
  gluten: "Gluten (Wheat)",
  crustaceans: "Crustaceans",
  eggs: "Eggs",
  fish: "Fish",
  lupin: "Lupin",
  milk: "Milk",
  molluscs: "Molluscs",
  mustard: "Mustard",
  "tree-nuts": "Tree Nuts",
  peanuts: "Peanuts",
  sesame: "Sesame",
  soya: "Soya",
  sulphites: "Sulphur Dioxide/Sulphites",
}

/**
 * Formats an allergen array into a UK-compliant display string.
 *
 * formatAllergens(["gluten", "sesame"])
 * → "Contains: Gluten (Wheat), Sesame"
 *
 * formatAllergens([])
 * → "No allergens declared"
 */
export function formatAllergens(allergens: Allergen[]): string {
  if (!allergens || allergens.length === 0) {
    return "No allergens declared"
  }
  const labels = allergens.map((a) => ALLERGEN_LABELS[a] ?? a)
  return `Contains: ${labels.join(", ")}`
}

/**
 * Returns true if the product contains any of the given allergens.
 * Used to power allergen filter on search/category pages.
 */
export function containsAllergen(
  productAllergens: Allergen[],
  check: Allergen[]
): boolean {
  return check.some((a) => productAllergens.includes(a))
}

/**
 * Dietary flag display labels.
 */
export const DIETARY_FLAG_LABELS: Record<string, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  "gluten-free": "Gluten Free",
  organic: "Organic",
}

/**
 * Maps dietary flag codes to badge display objects.
 */
export function getDietaryBadges(
  flags: string[]
): { label: string; color: string }[] {
  const colorMap: Record<string, string> = {
    vegetarian: "green",
    vegan: "emerald",
    "gluten-free": "amber",
    organic: "lime",
  }
  return flags.map((f) => ({
    label: DIETARY_FLAG_LABELS[f] ?? f,
    color: colorMap[f] ?? "gray",
  }))
}
