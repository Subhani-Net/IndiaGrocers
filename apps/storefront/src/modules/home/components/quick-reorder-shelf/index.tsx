"use client"

import { useState } from "react"
import { usePantry } from "@lib/context/pantry-context"
import { addToCart } from "@lib/data/cart"
import { formatGBP } from "@lib/util/format-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getImageUrl } from "@lib/util/images"

export default function QuickReorderShelf() {
  const { items, runningLow } = usePantry()
  const [addingAll, setAddingAll] = useState(false)

  const shelfItems = [...runningLow, ...items.filter((i) => i.status !== "running-low")].slice(0, 8)

  if (shelfItems.length === 0) return null

  const handleAddAll = async () => {
    setAddingAll(true)
    for (const item of shelfItems) {
      try {
        await addToCart({ variantId: item.variantId, quantity: 1, countryCode: "" })
      } catch {}
    }
    window.dispatchEvent(new Event("cart-updated"))
    setAddingAll(false)
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-stone-800">Your Regulars</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Quick reorder from your pantry
          </p>
        </div>
        <button
          onClick={handleAddAll}
          disabled={addingAll}
          className="text-xs font-semibold text-brand-orange hover:underline disabled:opacity-50"
        >
          {addingAll ? "Adding..." : `Add All (${formatGBP(shelfItems.reduce((s, i) => s + i.price, 0))})`}
        </button>
      </div>
      <div className="px-4 py-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-3">
          {shelfItems.map((item) => (
            <div
              key={item.productId}
              className="flex-shrink-0 w-[140px] bg-stone-50 rounded-lg border border-stone-100 overflow-hidden"
            >
              <LocalizedClientLink href={`/products/${item.handle}`}>
                <div className="w-full aspect-square bg-stone-100 flex items-center justify-center text-2xl">
                  {item.thumbnail ? (
                    <img src={getImageUrl(item.thumbnail)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    "🛍️"
                  )}
                </div>
              </LocalizedClientLink>
              <div className="p-2">
                <LocalizedClientLink href={`/products/${item.handle}`}>
                  <h4 className="text-[11px] font-medium text-stone-700 line-clamp-2 leading-tight h-[30px]">
                    {item.title}
                  </h4>
                </LocalizedClientLink>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-bold text-stone-800">{formatGBP(item.price)}</span>
                  {item.status === "running-low" && (
                    <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded-full font-medium">
                      Low
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
