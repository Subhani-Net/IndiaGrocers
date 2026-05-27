"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { HttpTypes } from "@medusajs/types"
import { fetchProductsPage } from "@lib/data/products"

const PRODUCTS_PER_PAGE = 12

type LoadMoreParams = {
  collectionId?: string
  categoryId?: string
}

export default function InfiniteScrollProductGrid({
  initialProducts,
  totalCount,
  region,
  countryCode,
  loadMoreParams,
  renderProduct,
}: {
  initialProducts: HttpTypes.StoreProduct[]
  totalCount: number
  region: HttpTypes.StoreRegion
  countryCode: string
  loadMoreParams: LoadMoreParams
  renderProduct: (product: HttpTypes.StoreProduct) => React.ReactNode
}) {
  const [products, setProducts] = useState(initialProducts)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(products.length < totalCount)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const nextPage = page + 1
      const result = await fetchProductsPage({
        page: nextPage,
        countryCode,
        collectionId: loadMoreParams.collectionId,
        categoryId: loadMoreParams.categoryId,
      })
      if (result.products.length > 0) {
        setProducts((prev) => [...prev, ...result.products])
        setPage(nextPage)
        setHasMore(
          products.length + result.products.length < result.count
        )
      } else {
        setHasMore(false)
      }
    } catch {
      // Retry available via manual button
    }
    setLoading(false)
  }, [loading, hasMore, page, countryCode, loadMoreParams, products.length])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: "200px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 text-stone-500">
        <p className="text-lg">No products found</p>
      </div>
    )
  }

  return (
    <>
      <ul
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
        data-testid="products-list"
      >
        {products.map((p) => (
          <li key={p.id} className="h-full">
            {renderProduct(p)}
          </li>
        ))}
      </ul>

      {/* Scroll sentinel */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="flex flex-col items-center mt-8 gap-2"
        >
          <p className="text-xs text-stone-400">
            Showing {products.length} of {totalCount} products
          </p>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-stone-400">
              <svg
                className="animate-spin w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Loading more...
            </div>
          )}
          {!loading && (
            <button
              onClick={loadMore}
              className="text-xs font-medium text-brand-orange hover:underline"
            >
              Load more
            </button>
          )}
        </div>
      )}

      {!hasMore && products.length > 0 && (
        <p className="text-center text-xs text-stone-400 mt-6">
          All {products.length} products loaded
        </p>
      )}
    </>
  )
}
