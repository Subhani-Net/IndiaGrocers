"use client"

import { Suspense } from "react"
import Breadcrumb from "@modules/common/components/breadcrumb"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import WeightHeavyProductCard from "@modules/products/components/product-preview/weight-heavy-card"
import CartSidebar from "@modules/layout/components/cart-sidebar"

interface RegionalCollectionProps {
  regionName: string
  regionDescription: string
  countryCode: string
  initialProducts: Record<string, any[]>
}

const REGION_LABELS: Record<string, string> = {
  punjabi: "Punjabi / North Indian",
  gujarati: "Gujarati",
  "south-indian": "South Indian",
  bengali: "Bengali",
  "east-african-asian": "East African Asian",
}

const SHELF_LABELS = [
  "Staples",
  "Spices & Blends",
  "Oils",
  "Snacks & Specialties",
]

export default function RegionalCollectionTemplate({
  regionName,
  regionDescription,
  countryCode,
  initialProducts,
}: RegionalCollectionProps) {
  const displayName = REGION_LABELS[regionName] || regionName.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())

  const shelves = Object.entries(initialProducts || {}).filter(
    ([, items]) => items.length > 0
  )

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Hero Header */}
      <div
        className="bg-gradient-to-br from-orange-50 via-stone-50 to-amber-50 border-b border-stone-200/60"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Regional", href: "/store" },
              { label: displayName },
            ]}
          />

          <div className="mt-4 max-w-2xl">
            <span className="text-[11px] text-brand-orange font-bold uppercase tracking-widest mb-2 block">
              Regional Collection
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 mb-3">
              {displayName} Groceries
            </h1>
            <p className="text-stone-500 text-sm sm:text-base leading-relaxed">
              {regionDescription ||
                `Curated essentials for ${displayName} cooking — from atta and rice to regional spice blends and specialty pickles.`}
            </p>
          </div>
        </div>
      </div>

      {/* Shelves */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {shelves.map(([shelf, items], i) => {
              const label = SHELF_LABELS[i] || shelf
              return (
                <section key={shelf} className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-stone-800">
                      {label}
                    </h2>
                    {items.length > 4 && (
                      <span className="text-xs text-stone-400">
                        {items.length} products
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {items.slice(0, 8).map((product: any) => (
                      <WeightHeavyProductCard
                        key={product.id}
                        product={product}
                        countryCode={countryCode}
                      />
                    ))}
                  </div>

                  {items.length > 8 && (
                    <p className="text-xs text-stone-400 mt-3 text-center">
                      +{items.length - 8} more items
                    </p>
                  )}
                </section>
              )
            })}

            {/* Cross-links */}
            <div className="mt-8 pt-6 border-t border-stone-200">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                Browse by Category
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: "Staples & Grains", handle: "staples-grains" },
                  { name: "Atta & Flours", handle: "atta-flours" },
                  { name: "Dal & Lentils", handle: "dal-lentils" },
                  { name: "Oils & Ghee", handle: "oils-ghee" },
                  { name: "Spices — Whole", handle: "spices-whole" },
                  { name: "Spices — Ground", handle: "spices-ground" },
                  { name: "Spice Blends", handle: "spice-blends" },
                  { name: "Pickles & Chutneys", handle: "pickles-chutneys" },
                ].map((cat) => (
                  <LocalizedClientLink
                    key={cat.handle}
                    href={`/categories/${cat.handle}`}
                    className="text-xs font-medium text-stone-600 bg-white border border-stone-200 rounded-full px-3 py-1.5 hover:border-brand-orange/50 hover:text-brand-orange transition-colors"
                  >
                    {cat.name} →
                  </LocalizedClientLink>
                ))}
              </div>
            </div>
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
