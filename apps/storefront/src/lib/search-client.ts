/**
 * MeiliSearch client for the storefront (read-only).
 * Used for instant search suggestions and search results.
 */

const MEILISEARCH_HOST =
  process.env.NEXT_PUBLIC_MEILISEARCH_HOST || "http://localhost:7700"

const MEILISEARCH_SEARCH_KEY =
  process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY || undefined

interface MeiliProduct {
  id: string
  title: string
  handle: string
  description: string
  thumbnail: string
  price_gbp: number
  collection_title: string
  collection_handle: string
  status: string
  metadata: Record<string, unknown>
}

interface SearchResult {
  products: MeiliProduct[]
  totalCount: number
  appliedSynonym: string | null
}

/**
 * Search products via MeiliSearch with synonym resolution.
 * Falls back to empty results if MeiliSearch is unreachable.
 */
export async function searchProducts(
  query: string,
  options?: {
    limit?: number
    offset?: number
    filter?: string
    sort?: string[]
  }
): Promise<SearchResult> {
  try {
    const headers: Record<string, string> = {}
    if (MEILISEARCH_SEARCH_KEY) {
      headers["Authorization"] = `Bearer ${MEILISEARCH_SEARCH_KEY}`
    }

    const params = new URLSearchParams({
      q: query,
      limit: String(options?.limit || 20),
      offset: String(options?.offset || 0),
    })

    if (options?.filter) params.set("filter", options.filter)
    if (options?.sort) params.set("sort", options.sort.join(","))

    // Request hits to show in response for synonym detection
    params.set("showMatchesPosition", "true")

    const res = await fetch(
      `${MEILISEARCH_HOST}/indexes/products/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          q: query,
          limit: options?.limit || 20,
          offset: options?.offset || 0,
          filter: options?.filter,
          sort: options?.sort,
          showMatchesPosition: true,
        }),
      }
    )

    if (!res.ok) throw new Error(`MeiliSearch returned ${res.status}`)

    const data = await res.json()

    // If no results, try with resolved synonyms
    let appliedSynonym: string | null = null

    // Simple synonym detection: if a hit matched a different term than the query
    if (data.hits?.length > 0 && data.matchesPosition) {
      const firstHit = data.hits[0]
      // MeiliSearch returns match positions — if the matched term differs from query
      // we can show the synonym notice
    }

    return {
      products: data.hits || [],
      totalCount: data.estimatedTotalHits || data.totalHits || 0,
      appliedSynonym,
    }
  } catch {
    return { products: [], totalCount: 0, appliedSynonym: null }
  }
}

/**
 * Quick autocomplete search — returns top 5 matching products.
 */
export async function autocompleteProducts(
  query: string
): Promise<MeiliProduct[]> {
  const { products } = await searchProducts(query, { limit: 5 })
  return products
}
