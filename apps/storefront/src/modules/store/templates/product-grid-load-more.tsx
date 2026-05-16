"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"

const PRODUCTS_PER_LOAD = 12

export default function ProductGridLoadMore({
  products,
  count,
  region,
}: {
  products: HttpTypes.StoreProduct[]
  count: number
  region: HttpTypes.StoreRegion
}) {
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_LOAD)

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 text-grey-50">
        <p className="text-lg">No products found</p>
      </div>
    )
  }

  const visibleProducts = products.slice(0, visibleCount)
  const hasMore = visibleCount < products.length

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {visibleProducts.map((p) => (
          <li key={p.id}>
            <ProductPreview product={p} region={region} />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="flex flex-col items-center mt-8 gap-2">
          <p className="text-sm text-grey-50">
            Showing {visibleCount} of {products.length} products
          </p>
          <button
            onClick={() => setVisibleCount((c) => c + PRODUCTS_PER_LOAD)}
            className="px-10 py-3 bg-brand-orange text-white font-semibold rounded-lg hover:bg-brand-orange-dark transition-colors"
          >
            Load More Products
          </button>
        </div>
      )}
    </>
  )
}
