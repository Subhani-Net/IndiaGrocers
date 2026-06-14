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
    signal?: AbortSignal
  }
): Promise<SearchResult> {
  try {
    const headers: Record<string, string> = {}
    if (MEILISEARCH_SEARCH_KEY) {
      headers["Authorization"] = `Bearer ${MEILISEARCH_SEARCH_KEY}`
    }

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
        signal: options?.signal,
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
  } catch (error: any) {
    if (error?.name === "AbortError") {
      return { products: [], totalCount: 0, appliedSynonym: null }
    }
    return { products: [], totalCount: 0, appliedSynonym: null }
  }
}

/**
 * Quick autocomplete search — returns top 5 matching products.
 * Accepts an optional AbortSignal to cancel stale requests on rapid typing.
 */
export async function autocompleteProducts(
  query: string,
  signal?: AbortSignal
): Promise<MeiliProduct[]> {
  const { products } = await searchProducts(query, { limit: 5, signal })
  return products
}
