"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import Breadcrumb, {
  buildCategoryBreadcrumbs,
} from "@modules/common/components/breadcrumb"
import EmptyState from "@modules/common/components/empty-state"
import ProductCard from "@modules/products/components/product-preview/weight-heavy-card"
import CartSidebar from "@modules/layout/components/cart-sidebar"
import SubTypeChips from "@modules/store/components/sub-type-chips"
import FilterPanel from "@modules/store/components/filter-panel"
import InlineSort from "@modules/store/components/inline-sort"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { useLayover } from "@lib/context/layover-context"
import MobileFilterDrawer from "@modules/store/components/mobile-filter-drawer"
import ThreePaneLayout from "@modules/store/components/three-pane-layout"

interface StandardGridCategoryTemplateProps {
  category: HttpTypes.StoreProductCategory & {
    metadata?: Record<string, unknown>
    category_children?: HttpTypes.StoreProductCategory[]
  }
  initialProducts: any[]
  totalCount: number
  countryCode: string
  sortBy: SortOptions
  minPrice?: number
  maxPrice?: number
  brand?: string
  /** Category handle for VAT notice — shown on snacks-namkeen */
  categoryHandle?: string
}

export default function StandardGridCategoryTemplate({
  category,
  initialProducts,
  totalCount,
  countryCode,
  sortBy,
  minPrice,
  maxPrice,
  brand,
  categoryHandle,
}: StandardGridCategoryTemplateProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { openLayover } = useLayover()
  const [products] = useState(initialProducts)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const breadcrumbItems = buildCategoryBreadcrumbs(category as any)
  const childCategories = (category.category_children || []) as any[]
  const hasFilters =
    minPrice != null || maxPrice != null || brand != null
  const hasVAT = categoryHandle === "snacks-namkeen"

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-stone-200/60">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <Breadcrumb items={breadcrumbItems} />

          {hasVAT && (
            <div className="mt-2 mb-1 text-[11px] text-stone-400 bg-stone-50 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5">
              <span>💰</span>
              Prices include 20% VAT
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-4 mt-1">
            <span className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-xl sm:text-3xl flex-shrink-0">
              📦
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
        />
      )}

      {/* Product Grid + Filter */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Mobile Filter Button + Sort */}
        <div className="flex lg:hidden items-center justify-between mb-4 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="text-xs font-medium text-stone-600 border border-stone-200 rounded-lg px-3 py-1.5 hover:border-brand-orange/50"
            >
              {mobileFilterOpen ? "Hide Filters" : "Filter"}
            </button>
            <InlineSort sortBy={sortBy} />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-stone-500">
              {totalCount} product{totalCount !== 1 ? "s" : ""}
            </p>
            {hasFilters && (
              <button
                onClick={() => {
                  router.push(`/${countryCode}/categories/${category.handle}`)
                }}
                className="text-xs font-medium text-brand-orange hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        <MobileFilterDrawer
          isOpen={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
        >
          <FilterPanel
            categoryHandle={category.handle}
            countryCode={countryCode}
            compact
          />
        </MobileFilterDrawer>

        {/* Desktop: Tesco-style 3-Pane Layout (lg+) */}
        <ThreePaneLayout
          filterPanel={
            <FilterPanel
              categoryHandle={category.handle}
              countryCode={countryCode}
            />
          }
          cartSidebar={<CartSidebar countryCode={countryCode} className="!w-full" />}
          productCount={totalCount}
          sortDropdown={<InlineSort sortBy={sortBy} />}
          countryCode={countryCode}
        >
          {products.length === 0 ? (
            <EmptyState
              type={hasFilters ? "filter" : "category"}
              suggestedCategories={[
                { name: "Dairy", handle: "dairy" },
                { name: "Snacks & Namkeen", handle: "snacks-namkeen" },
                { name: "Pickles & Chutneys", handle: "pickles-chutneys" },
              ]}
            />
          ) : (
              products.map((p: any) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  countryCode={countryCode}
                  onProductClick={() => openLayover(p)}
                />
              ))
            )}
        </ThreePaneLayout>
      </div>
    </div>
  )
}
