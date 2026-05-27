"use client"

import { Suspense, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import Breadcrumb, { buildCategoryBreadcrumbs } from "@modules/common/components/breadcrumb"
import EmptyState from "@modules/common/components/empty-state"
import WeightHeavyProductCard from "@modules/products/components/product-preview/weight-heavy-card"
import CartSidebar from "@modules/layout/components/cart-sidebar"
import SubTypeChips from "@modules/store/components/sub-type-chips"
import FilterPanel from "@modules/store/components/filter-panel"
import InlineSort from "@modules/store/components/inline-sort"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCTS_PER_PAGE = 12

interface WeightHeavyCategoryTemplateProps {
  category: HttpTypes.StoreProductCategory & {
    metadata?: Record<string, unknown>
    category_children?: HttpTypes.StoreProductCategory[]
  }
  initialProducts: any[]
  totalCount: number
  countryCode: string
  sortBy: SortOptions
  page: number
  minPrice?: number
  maxPrice?: number
  brand?: string
}

export default function WeightHeavyCategoryTemplate({
  category,
  initialProducts,
  totalCount,
  countryCode,
  sortBy,
  page: _page,
  minPrice,
  maxPrice,
  brand,
}: WeightHeavyCategoryTemplateProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState(initialProducts)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const breadcrumbItems = buildCategoryBreadcrumbs(category as any)
  const childCategories = (category.category_children || []) as any[]
  const hasFilters = minPrice != null || maxPrice != null || brand != null

  const handleLoadMore = useCallback(async () => {
    // Placeholder — will be replaced by infinite scroll
  }, [])

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-stone-200/60">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <Breadcrumb items={breadcrumbItems} />

          <div className="flex items-center gap-3 sm:gap-4 mt-2">
            <span className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-xl sm:text-3xl flex-shrink-0">
              ⚖️
            </span>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-stone-900 truncate">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-stone-500 text-sm mt-0.5 line-clamp-2">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Type Chips */}
      {childCategories.length > 0 && (
        <SubTypeChips
          categories={childCategories.map((c: any) => ({
            id: c.id,
            name: c.name,
            handle: c.handle,
          }))}
          activeHandle={category.handle}
        />
      )}

      {/* Product Grid + Filter */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <p className="text-sm text-stone-500">
              {totalCount} product{totalCount !== 1 ? "s" : ""}
            </p>
            {hasFilters && (
              <button
                onClick={() => {
                  router.push(
                    `/${countryCode}/categories/${category.handle}`
                  )
                }}
                className="text-xs font-medium text-brand-orange hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="sm:hidden text-xs font-medium text-stone-600 border border-stone-200 rounded-lg px-3 py-1.5 hover:border-brand-orange/50"
            >
              {mobileFilterOpen ? "Hide Filters" : "Filter"}
            </button>
            <InlineSort sortBy={sortBy} />
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop Filter Panel */}
          <aside className="hidden sm:block w-56 flex-shrink-0">
            <FilterPanel
              sortBy={sortBy}
              categoryHandle={category.handle}
              countryCode={countryCode}
            />
          </aside>

          {/* Mobile Filter Drawer */}
          {mobileFilterOpen && (
            <div className="sm:hidden fixed inset-0 z-40 flex">
              <div
                className="absolute inset-0 bg-black/30"
                onClick={() => setMobileFilterOpen(false)}
              />
              <div className="relative ml-auto w-72 bg-white h-full overflow-y-auto shadow-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-stone-800">Filters</h3>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    ✕
                  </button>
                </div>
                <FilterPanel
                  sortBy={sortBy}
                  categoryHandle={category.handle}
                  countryCode={countryCode}
                />
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {products.length === 0 ? (
              <EmptyState
                type={hasFilters ? "filter" : "category"}
                suggestedCategories={[
                  { name: "Staples & Grains", handle: "staples-grains" },
                  { name: "Atta & Flours", handle: "atta-flours" },
                  { name: "Dal & Lentils", handle: "dal-lentils" },
                ]}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {products.map((product: any) => (
                  <WeightHeavyProductCard
                    key={product.id}
                    product={product}
                    countryCode={countryCode}
                  />
                ))}
              </div>
            )}

            {/* Load More */}
            {products.length > 0 && products.length < totalCount && (
              <div className="flex flex-col items-center mt-8 gap-2">
                <p className="text-sm text-stone-400">
                  Showing {products.length} of {totalCount} products
                </p>
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-8 py-2.5 text-sm font-semibold border border-brand-orange text-brand-orange rounded-lg hover:bg-brand-orange hover:text-white transition-colors disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load More Products"}
                </button>
              </div>
            )}
          </div>

          {/* Cart Sidebar (xl+) */}
          <div className="hidden xl:block w-[340px] flex-shrink-0">
            <Suspense>
              <CartSidebar countryCode={countryCode} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
