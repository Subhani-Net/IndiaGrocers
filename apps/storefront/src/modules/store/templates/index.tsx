import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import CartSidebar from "@modules/layout/components/cart-sidebar"
import InlineSort from "@modules/store/components/inline-sort"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
  minPrice,
  maxPrice,
  brand,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  minPrice?: number
  maxPrice?: number
  brand?: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div className="py-6 content-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-grey-90">All products</h1>
        <InlineSort sortBy={sort} />
      </div>
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <Suspense fallback={<SkeletonProductGrid />}>
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              countryCode={countryCode}
              minPrice={minPrice}
              maxPrice={maxPrice}
              brand={brand}
            />
          </Suspense>
        </div>
        <CartSidebar countryCode={countryCode} />
      </div>
    </div>
  )
}

export default StoreTemplate
