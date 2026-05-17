import { notFound } from "next/navigation"
import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartSidebar from "@modules/layout/components/cart-sidebar"
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
    <div className="bg-grey-5 min-h-screen">
      <div className="bg-white border-b border-grey-20">
        <div className="max-w-[1440px] mx-auto px-6 py-6">
          <nav className="flex items-center gap-2 text-sm text-grey-50 mb-4">
            <LocalizedClientLink href="/store" className="hover:text-brand-orange transition-colors">
              All Products
            </LocalizedClientLink>
            {parents.map((parent) => (
              <span key={parent.id} className="flex items-center gap-2">
                <span className="text-grey-30">/</span>
                <LocalizedClientLink
                  href={`/categories/${parent.handle}`}
                  className="hover:text-brand-orange transition-colors"
                >
                  {parent.name}
                </LocalizedClientLink>
              </span>
            ))}
            <span className="text-grey-30">/</span>
            <span className="text-brand-orange font-semibold">{category.name}</span>
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-4xl">{emoji}</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-grey-90">{category.name}</h1>
              {category.description && (
                <p className="text-grey-50 mt-1">{category.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {category.category_children && category.category_children.length > 0 && (
        <div className="bg-white border-b border-grey-20">
          <div className="max-w-[1440px] mx-auto px-6 py-4 overflow-x-auto no-scrollbar">
            <div className="flex gap-2">
              {category.category_children.map((child) => (
                <LocalizedClientLink
                  key={child.id}
                  href={`/categories/${child.handle}`}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border border-grey-20 
                             text-sm text-grey-70 hover:border-brand-orange hover:text-brand-orange 
                             hover:bg-brand-orange/5 transition-all duration-200"
                >
                  <span>{categoryEmojis[child.name] || "•"}</span>
                  {child.name}
                </LocalizedClientLink>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-6 py-8">
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
