import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import PaginatedProducts from "@modules/store/templates/paginated-products"
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
    <div className="flex flex-col small:flex-row small:items-start py-6 content-container">
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <h1>All products</h1>
        </div>
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
    </div>
  )
}

export default StoreTemplate
