import { MeiliSearch } from "meilisearch"

const MEILISEARCH_HOST =
  process.env.MEILISEARCH_HOST || "http://localhost:7700"

const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY || undefined

const MEILISEARCH_SEARCH_KEY = process.env.MEILISEARCH_SEARCH_KEY || undefined

/**
 * Admin client — used by backend scripts and subscribers for:
 * - Creating/updating the products index
 * - Uploading synonyms
 * - Bulk indexing/reindexing products
 *
 * Requires MEILISEARCH_API_KEY (the private master key) in production,
 * or no key in local development.
 */
export const meiliAdmin = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_API_KEY,
})

/**
 * Search-only client — used by the storefront for:
 * - Instant search suggestions
 * - Full search results
 *
 * Uses MEILISEARCH_SEARCH_KEY (a restricted API key with search-only
 * permissions) in production. Falls back to admin client if not set.
 */
export const meiliSearchClient = MEILISEARCH_SEARCH_KEY
  ? new MeiliSearch({
      host: MEILISEARCH_HOST,
      apiKey: MEILISEARCH_SEARCH_KEY,
    })
  : meiliAdmin

const PRODUCTS_INDEX = "products"

/**
 * Get or create the products index.
 */
export async function getProductsIndex() {
  try {
    await meiliAdmin.getIndex(PRODUCTS_INDEX)
    return meiliAdmin.index(PRODUCTS_INDEX)
  } catch {
    // Create the index if it doesn't exist
    await meiliAdmin.createIndex(PRODUCTS_INDEX, { primaryKey: "id" })
    return meiliAdmin.index(PRODUCTS_INDEX)
  }
}

export { PRODUCTS_INDEX }
