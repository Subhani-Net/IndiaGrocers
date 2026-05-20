import { notFound } from "next/navigation"
import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartSidebar from "@modules/layout/components/cart-sidebar"
import InlineSort from "@modules/store/components/inline-sort"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const collectionEmojis: Record<string, string> = {
  "Rice": "🌾",
  "Spices": "🌶️",
  "Oils": "🫒",
  "Snacks": "🍿",
  "Pooja": "🪔",
  "Beverages": "☕",
  "Dairy": "🥛",
  "Sweets": "🍬",
  "Pickles": "🥒",
}

export default function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
  minPrice,
  maxPrice,
  brand,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
  minPrice?: number
  maxPrice?: number
  brand?: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!collection || !countryCode) notFound()

  const emoji = collectionEmojis[collection.title] || "📦"

  return (
    <div className="bg-grey-5 min-h-screen">
      <div className="bg-white border-b border-grey-20">
        <div className="max-w-[1440px] mx-auto px-6 py-6">
          <nav className="flex items-center gap-2 text-sm text-grey-50 mb-4">
            <LocalizedClientLink href="/store" className="hover:text-brand-orange transition-colors">
              All Products
            </LocalizedClientLink>
            <span className="text-grey-30">/</span>
            <span className="text-brand-orange font-semibold">{collection.title}</span>
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-4xl">{emoji}</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-grey-90">{collection.title}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <InlineSort sortBy={sort} />
        </div>
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <Suspense fallback={<SkeletonProductGrid numberOfProducts={12} />}>
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                collectionId={collection.id}
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
    </div>
  )
}
