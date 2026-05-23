import { notFound } from "next/navigation"
import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartSidebar from "@modules/layout/components/cart-sidebar"
import InlineSort from "@modules/store/components/inline-sort"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

export const categoryEmojis: Record<string, string> = {
  "Rice & Grains": "🌾", "Basmati Rice": "🌾", "Sona Masoori": "🌾",
  "Dals & Lentils": "🫘", "Toor Dal": "🫘", "Moong Dal": "🫘",
  "Spices & Masalas": "🌶️", "Turmeric": "🌶️", "Chilli Powder": "🌶️",
  "Cooking Oils & Ghee": "🫒",
  "Flours & Grains": "🌾",
  "Snacks & Namkeen": "🍿", "Bhujia": "🍿",
  "Beverages": "☕",
  "Pickles & Chutneys": "🥒",
  "Papads & Fryums": "🫓",
  "Frozen Foods": "❄️",
  "Sweets & Mithai": "🍬",
  "Noodles & Pasta": "🍜",
  "Sauces & Ketchup": "🥫",
  "Dairy & Milk Products": "🥛",
  "Ready to Eat": "🍛",
  "Fresh Vegetables": "🥗", "Onions": "🧅", "Potatoes": "🥔", "Tomatoes": "🍅",
}

function ChevronRight() {
  return (
    <svg className="w-3.5 h-3.5 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

export default function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  minPrice,
  maxPrice,
  brand,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  minPrice?: number
  maxPrice?: number
  brand?: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  const parents = [] as HttpTypes.StoreProductCategory[]
  const getParents = (cat: HttpTypes.StoreProductCategory) => {
    if (cat.parent_category) {
      parents.unshift(cat.parent_category)
      getParents(cat.parent_category)
    }
  }
  getParents(category)

  const emoji = categoryEmojis[category.name] || "🛍️"

  return (
    <div className="bg-stone-50 min-h-screen">
      <div className="bg-white border-b border-stone-200/60">
        <div className="max-w-[1440px] mx-auto px-6 py-5">
          <nav className="flex items-center gap-2 text-sm text-stone-500 mb-4">
            <LocalizedClientLink href="/" className="hover:text-brand-orange transition-colors">
              Home
            </LocalizedClientLink>
            <ChevronRight />
            <LocalizedClientLink href="/store" className="hover:text-brand-orange transition-colors">
              Store
            </LocalizedClientLink>
            {parents.map((parent) => (
              <span key={parent.id} className="flex items-center gap-2">
                <ChevronRight />
                <LocalizedClientLink
                  href={`/categories/${parent.handle}`}
                  className="hover:text-brand-orange transition-colors"
                >
                  {parent.name}
                </LocalizedClientLink>
              </span>
            ))}
            <ChevronRight />
            <span className="text-brand-orange font-semibold">{category.name}</span>
          </nav>

          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-3xl flex-shrink-0">
              {emoji}
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-900">{category.name}</h1>
              {category.description && (
                <p className="text-stone-500 mt-0.5">{category.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {category.category_children && category.category_children.length > 0 && (
        <div className="bg-white border-b border-stone-200/40">
          <div className="max-w-[1440px] mx-auto px-6 py-4 overflow-x-auto no-scrollbar">
            <div className="flex gap-2">
              {category.category_children.map((child) => (
                <LocalizedClientLink
                  key={child.id}
                  href={`/categories/${child.handle}`}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200/60
                             text-sm font-medium text-stone-600 hover:border-brand-orange/50 hover:text-brand-orange
                             hover:bg-brand-orange/5 transition-all duration-200 bg-stone-50/50"
                >
                  <span className="text-base">{categoryEmojis[child.name] || "•"}</span>
                  {child.name}
                </LocalizedClientLink>
              ))}
            </div>
          </div>
        </div>
      )}

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
                categoryId={category.id}
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
