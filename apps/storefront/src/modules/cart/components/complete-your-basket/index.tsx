"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { formatGBP } from "@lib/util/format-price"
import { addToCart } from "@lib/data/cart"
import Thumbnail from "@modules/products/components/thumbnail"

interface SuggestionProduct {
  id: string
  title: string
  handle: string
  thumbnail?: string
  price: number
  variantId: string
  weight?: string
}

interface CompleteYourBasketProps {
  products: SuggestionProduct[]
  countryCode: string
  show: boolean
}

export default function CompleteYourBasket({
  products,
  countryCode,
  show,
}: CompleteYourBasketProps) {
  const [adding, setAdding] = useState<string | null>(null)

  if (!show || !products || products.length === 0) return null

  const handleAdd = useCallback(
    async (p: SuggestionProduct) => {
      setAdding(p.variantId)
      try {
        await addToCart({ variantId: p.variantId, quantity: 1, countryCode })
        window.dispatchEvent(new Event("cart-updated"))
      } catch {}
      setAdding(null)
    },
    [countryCode]
  )

  return (
    <div className="bg-gradient-to-r from-brand-orange/5 to-amber-50 border border-brand-orange/20 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-brand-orange/10 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-stone-800">
            You&apos;re close — complete your basket!
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Add a few more items to unlock free delivery
          </p>
        </div>
      </div>

      <div className="px-4 py-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-3">
          {products.slice(0, 6).map((p) => (
            <div
              key={p.variantId}
              className="flex-shrink-0 w-[140px] bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-full aspect-square bg-stone-50 relative overflow-hidden">
                <Thumbnail
                  thumbnail={p.thumbnail}
                  images={undefined}
                  size="square"
                />
                <span className="absolute top-1 left-1 bg-brand-orange text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {formatGBP(p.price)}
                </span>
              </div>
              <div className="p-2">
                <h4 className="text-[11px] font-medium text-stone-700 line-clamp-2 leading-tight h-[32px]">
                  {p.title}
                </h4>
                <button
                  onClick={() => handleAdd(p)}
                  disabled={adding === p.variantId}
                  className="mt-2 w-full text-[11px] font-semibold text-brand-orange border border-brand-orange rounded-lg py-1.5 hover:bg-brand-orange hover:text-white active:scale-95 disabled:opacity-50 transition-all"
                >
                  {adding === p.variantId ? "Adding..." : "+ Add"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
