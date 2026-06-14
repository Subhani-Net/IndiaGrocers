"use client"

import { Suspense, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import Breadcrumb, {
  buildCategoryBreadcrumbs,
} from "@modules/common/components/breadcrumb"
import EmptyState from "@modules/common/components/empty-state"
import ProductCard from "@modules/products/components/product-preview/weight-heavy-card"
import CartSidebar from "@modules/layout/components/cart-sidebar"
import SubTypeChips from "@modules/store/components/sub-type-chips"
import BrandTilesStrip from "@modules/store/components/brand-tiles-strip"
import FilterPanel from "@modules/store/components/filter-panel"
import InlineSort from "@modules/store/components/inline-sort"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { useLayover } from "@lib/context/layover-context"
import MobileFilterDrawer from "@modules/store/components/mobile-filter-drawer"

// Brand display names keyed by slug — subset for brand-showcase display
const BRAND_DISPLAY: Record<string, string> = {
  mdh: "MDH", everest: "Everest", shan: "Shan", mtr: "MTR", aachi: "Aachi",
  vandevi: "Vandevi", trs: "TRS", "east-end": "East End", heera: "Heera",
  natco: "Natco", ktc: "KTC", amul: "Amul", pataks: "Patak's",
  "mothers-recipe": "Mother's Recipe", priya: "Priya", nilons: "Nilon's",
  bedekar: "Bedekar", aashirvaad: "Aashirvaad", pillsbury: "Pillsbury",
  elephant: "Elephant", "india-gate": "India Gate", daawat: "Daawat",
  tilda: "Tilda", kohinoor: "Kohinoor", "lal-qilla": "Lal Qilla",
  haldirams: "Haldiram's", jabsons: "Jabsons", lijjat: "Lijjat",
  "wagh-bakri": "Wagh Bakri", "brooke-bond": "Brooke Bond", tetley: "Tetley",
  gits: "Gits", bambino: "Bambino",
}

interface BrandShowcaseCategoryTemplateProps {
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
}

// Build brand tiles from product metadata
function buildBrandTiles(products: any[]) {
  const brandCounts: Record<string, { name: string; count: number }> = {}
  for (const p of products) {
    const bSlug = (p.metadata as any)?.brand_slug as string | undefined
    if (!bSlug) continue
    if (!brandCounts[bSlug]) {
      brandCounts[bSlug] = {
        name: BRAND_DISPLAY[bSlug] ?? bSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        count: 0,
      }
    }
    brandCounts[bSlug].count++
  }
  return Object.entries(brandCounts)
    .map(([slug, { name, count }]) => ({ slug, name, productCount: count }))
    .sort((a, b) => b.productCount - a.productCount)
}

export default function BrandShowcaseCategoryTemplate({
  category,
  initialProducts,
  totalCount,
  countryCode,
  sortBy,
  minPrice,
  maxPrice,
  brand,
}: BrandShowcaseCategoryTemplateProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { openLayover } = useLayover()
  const [products] = useState(initialProducts)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const breadcrumbItems = buildCategoryBreadcrumbs(category as any)
  const childCategories = (category.category_children || []) as any[]
  const brandTiles = buildBrandTiles(products)
  const hasFilters =
    minPrice != null || maxPrice != null || brand != null

  const handleBrandSelect = (slug: string | null) => {
    const params = new URLSearchParams(searchParams)
    if (slug) {
      params.set("brand", slug)
    } else {
      params.delete("brand")
    }
    params.delete("page")
    router.push(
      `/${countryCode}/categories/${category.handle}?${params.toString()}`
    )
  }

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-stone-200/60">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <Breadcrumb items={breadcrumbItems} />

          <div className="flex items-center gap-3 sm:gap-4 mt-2">
            <span className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-xl sm:text-3xl flex-shrink-0">
              🏷️
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

      {/* Brand Tiles Strip */}
      <BrandTilesStrip
        brands={brandTiles}
        activeBrand={brand}
        onSelectBrand={handleBrandSelect}
      />

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
          {/* Desktop Filter */}
          <aside className="hidden sm:block w-56 flex-shrink-0">
            <FilterPanel
              sortBy={sortBy}
              categoryHandle={category.handle}
              countryCode={countryCode}
            />
          </aside>

          {/* Mobile Filter Drawer */}
          <MobileFilterDrawer
            isOpen={mobileFilterOpen}
            onClose={() => setMobileFilterOpen(false)}
          >
            <FilterPanel
              sortBy={sortBy}
              categoryHandle={category.handle}
              countryCode={countryCode}
              compact
            />
          </MobileFilterDrawer>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {products.length === 0 ? (
              <EmptyState
                type={hasFilters ? "filter" : "category"}
                suggestedCategories={[
                  { name: "Spices — Ground", handle: "spices-ground" },
                  { name: "Spices — Whole", handle: "spices-whole" },
                  { name: "Beverages", handle: "beverages" },
                ]}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {products.map((p: any) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    countryCode={countryCode}
                    onProductClick={() => openLayover(p)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
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
