"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface BrandTile {
  slug: string
  name: string
  productCount: number
}

export default function BrandTilesStrip({
  brands,
  activeBrand,
  onSelectBrand,
}: {
  brands: BrandTile[]
  activeBrand?: string
  onSelectBrand: (slug: string | null) => void
}) {
  if (!brands || brands.length === 0) return null

  return (
    <div className="bg-white border-b border-stone-200/40">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3">
        <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold mb-2">
          Shop by Brand
        </p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => onSelectBrand(null)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
              !activeBrand
                ? "bg-brand-orange text-white border-brand-orange"
                : "border-stone-200 text-stone-500 hover:border-brand-orange/50 bg-white"
            }`}
          >
            <span className="text-base">🏷️</span>
            All Brands
          </button>
          {brands.map((b) => {
            const isActive = b.slug === activeBrand
            return (
              <button
                key={b.slug}
                onClick={() =>
                  onSelectBrand(isActive ? null : b.slug)
                }
                className={`flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-xl border transition-all ${
                  isActive
                    ? "bg-brand-orange text-white border-brand-orange"
                    : "border-stone-200 text-stone-600 hover:border-brand-orange/40 bg-white"
                }`}
              >
                <span className="text-xs font-semibold whitespace-nowrap">
                  {b.name}
                </span>
                <span
                  className={`text-[10px] ${
                    isActive ? "text-white/70" : "text-stone-400"
                  }`}
                >
                  {b.productCount} products
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
