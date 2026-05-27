"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface CategoryReminderStripProps {
  categories: Array<{ name: string; handle: string }>
  cartCategoryHandles: Set<string>
  /** Whether to show this — only for authenticated users with order history */
  show: boolean
}

export default function CategoryReminderStrip({
  categories,
  cartCategoryHandles,
  show,
}: CategoryReminderStripProps) {
  if (!show || !categories || categories.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-100">
        <h2 className="text-sm font-bold text-stone-800">
          Have you got everything?
        </h2>
        <p className="text-xs text-stone-400 mt-0.5">
          Based on your usual shop — tap to browse
        </p>
      </div>

      <div className="px-4 py-3 flex flex-wrap gap-2">
        {categories.map((cat) => {
          const inCart = cartCategoryHandles.has(cat.handle)
          return (
            <LocalizedClientLink
              key={cat.handle}
              href={`/categories/${cat.handle}`}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                inCart
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "border-stone-200 text-stone-500 hover:border-brand-orange/50 hover:text-brand-orange"
              }`}
            >
              {inCart ? `${cat.name} ✓` : `${cat.name} →`}
            </LocalizedClientLink>
          )
        })}
      </div>
    </div>
  )
}
