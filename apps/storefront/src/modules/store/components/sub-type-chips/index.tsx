"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface SubTypeChip {
  id: string
  name: string
  handle: string
}

export default function SubTypeChips({
  categories,
  activeHandle,
}: {
  categories: SubTypeChip[]
  activeHandle?: string
}) {
  if (!categories || categories.length === 0) return null

  return (
    <div className="bg-white border-b border-stone-200/40">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth" data-testid="subcategory-chips">
          <LocalizedClientLink
            href="."
            scroll={false}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
              !activeHandle
                ? "bg-brand-orange text-white border-brand-orange"
                : "border-stone-200 text-stone-500 hover:border-brand-orange/50 hover:text-brand-orange bg-white"
            }`}
          >
            All
          </LocalizedClientLink>
          {categories.map((cat) => {
            const isActive = cat.handle === activeHandle
            return (
              <LocalizedClientLink
                key={cat.id}
                href={`/categories/${cat.handle}`}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  isActive
                    ? "bg-brand-orange text-white border-brand-orange"
                    : "border-stone-200 text-stone-500 hover:border-brand-orange/50 hover:text-brand-orange bg-white"
                }`}
              >
                {cat.name}
              </LocalizedClientLink>
            )
          })}
        </div>
      </div>
    </div>
  )
}
