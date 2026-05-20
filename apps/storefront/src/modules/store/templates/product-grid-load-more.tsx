"use client"

import { useState, useTransition } from "react"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"
import { fetchProductsPage } from "@lib/data/products"

const PRODUCTS_PER_PAGE = 12

type LoadMoreParams = {
  collectionId?: string
  categoryId?: string
}

export default function ProductGridLoadMore({
  initialProducts,
  totalCount,
  region,
  countryCode,
  loadMoreParams,
}: {
  initialProducts: HttpTypes.StoreProduct[]
  totalCount: number
  region: HttpTypes.StoreRegion
  countryCode: string
  loadMoreParams: LoadMoreParams
}) {
  const [products, setProducts] = useState(initialProducts)
  const [page, setPage] = useState(1)
  const [isLoading, startLoading] = useTransition()

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 text-grey-50">
        <p className="text-lg">No products found</p>
      </div>
    )
  }

  const hasMore = products.length < totalCount

  const handleLoadMore = () => {
    startLoading(async () => {
      const nextPage = page + 1
      const result = await fetchProductsPage({
        page: nextPage,
        countryCode,
        collectionId: loadMoreParams.collectionId,
        categoryId: loadMoreParams.categoryId,
      })
      setProducts((prev) => [...prev, ...result.products])
      setPage(nextPage)
    })
  }

  return (
    <>
      <ul
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        data-testid="products-list"
      >
        {products.map((p) => (
          <li key={p.id} className="h-full">
            <ProductPreview product={p} region={region} />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="flex flex-col items-center mt-8 gap-2">
          <p className="text-sm text-grey-50">
            Showing {products.length} of {totalCount} products
          </p>
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-10 py-3 bg-brand-orange text-white font-semibold rounded-lg hover:bg-brand-orange-dark transition-colors disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Load More Products"}
          </button>
        </div>
      )}
    </>
  )
}
