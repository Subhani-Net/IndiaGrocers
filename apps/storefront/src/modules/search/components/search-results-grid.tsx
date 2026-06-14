"use client"

import { HttpTypes } from "@medusajs/types"
import { Spinner } from "@medusajs/icons"
import { useSearch } from "@lib/context/search-context"
import { useLayover } from "@lib/context/layover-context"
import WeightHeavyProductCard from "@modules/products/components/product-preview/weight-heavy-card"
import CartSidebar from "@modules/layout/components/cart-sidebar"
import ThreePaneLayout from "@modules/store/components/three-pane-layout"

export default function SearchResultsGrid() {
  const { searchQuery, searchResults, isLoading, totalCount, countryCode } =
    useSearch()
  const { openLayover } = useLayover()

  return (
    <div className="bg-stone-50 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <ThreePaneLayout
          filterPanel={null}
          cartSidebar={
            <CartSidebar countryCode={countryCode} className="!w-full" />
          }
          productCount={totalCount}
          showFilterPane={false}
          countryCode={countryCode}
        >
          {/* Loading skeleton */}
          {isLoading && searchResults.length === 0 &&
            Array.from({ length: 8 }).map((_, i) => (
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

          {/* Product cards — ThreePaneLayout wraps them in dynamic grid */}
          {searchResults.length > 0 &&
            searchResults.map((product: HttpTypes.StoreProduct) => (
              <WeightHeavyProductCard
                key={product.id}
                product={product}
                countryCode={countryCode}
                onProductClick={() => openLayover(product)}
              />
            ))}

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
        </ThreePaneLayout>
      </div>
    </div>
  )
}
