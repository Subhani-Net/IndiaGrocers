"use client"

import { HttpTypes } from "@medusajs/types"
import { Spinner } from "@medusajs/icons"
import { useSearch } from "@lib/context/search-context"
import { useLayover } from "@lib/context/layover-context"
import WeightHeavyProductCard from "@modules/products/components/product-preview/weight-heavy-card"

export default function SearchResultsGrid() {
  const { searchQuery, searchResults, isLoading, totalCount } = useSearch()
  const { openLayover } = useLayover()

  return (
    <div className="bg-stone-50 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-stone-500">
            {isLoading
              ? "Searching..."
              : totalCount > 0
              ? `${totalCount} result${totalCount !== 1 ? "s" : ""} for "${searchQuery}"`
              : searchQuery
              ? `No results for "${searchQuery}"`
              : "Start typing to search"}
          </p>
          {isLoading && (
            <Spinner className="animate-spin text-brand-orange w-5 h-5" />
          )}
        </div>

        {/* Loading skeleton */}
        {isLoading && searchResults.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-grey-20/60 overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-grey-10" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-grey-10 rounded w-1/2" />
                  <div className="h-4 bg-grey-10 rounded w-3/4" />
                  <div className="h-4 bg-grey-10 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product grid */}
        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {searchResults.map((product: HttpTypes.StoreProduct) => (
              <WeightHeavyProductCard
                key={product.id}
                product={product}
                countryCode="gb"
                onProductClick={() => openLayover(product)}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && searchQuery && searchResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              className="w-12 h-12 text-stone-300 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-stone-500 font-medium">
              No results found for &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="text-stone-400 text-sm mt-1">
              Try a different search term or browse categories
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
