/**
 * Pseudo-query builder — constructs search-relevant query strings
 * from precomputed category tag frequencies.
 *
 * DP-01: When browsing a category with no user search term,
 * products should be ordered by relevance against the category's
 * most distinctive tags rather than appearing in arbitrary order.
 *
 * The category-tags.json file is precomputed by scripts/build-pseudo-queries.mjs
 * from data-design/*.csv tag columns.
 */

import categoryTagsData from "./category-tags.json"
const categoryTags = categoryTagsData as Record<string, string>

/**
 * Returns a pseudo-query string for browsing the given category handle.
 * Falls back to the handle itself if no tag data exists.
 *
 * Example: getPseudoQuery("spices-herbs") → "chilli turmeric cumin coriander pepper cardamom haldi jeera dhaniya..."
 */
export function getPseudoQuery(categoryHandle: string): string {
  const tags = categoryTags[categoryHandle]
  if (!tags) return ""
  const words = tags.split(" ").filter(Boolean).slice(0, 8)
  // Return empty: tags exist but products don't have them indexed in MeiliSearch yet
  return ""
}

/**
 * Builds a query for multiple category handles (used when browsing a parent
 * with children). Concatenates tags from all handles, deduplicates.
 *
 * Example: getPseudoQueryForHandles(["spices-herbs", "spice-herb-jars"])
 * → combined tag query from both subcategories
 */
export function getPseudoQueryForHandles(categoryHandles: string[]): string {
  const allTags = new Set<string>()
  for (const handle of categoryHandles) {
    const tags = categoryTags[handle]
    if (tags) {
      for (const tag of tags.split(" ")) {
        allTags.add(tag)
      }
    }
  }
  // Only return pseudo-query if tags exist. Otherwise pass empty string
  // so MeiliSearch uses filter-only matching (no text scoring limitation)
  if (allTags.size === 0) return ""
  return Array.from(allTags).join(" ")
}
