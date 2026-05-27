"use client"

import { useState, useCallback } from "react"
import { addToCart } from "@lib/data/cart"
import { formatGBP } from "@lib/util/format-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

interface FBTProduct {
  id: string
  title: string
  handle: string
  thumbnail?: string
  price: number
  variantId: string
  weight?: string
}

interface FrequentlyBoughtTogetherProps {
  products: FBTProduct[]
  countryCode: string
}

export default function FrequentlyBoughtTogether({
  products,
  countryCode,
}: FrequentlyBoughtTogetherProps) {
  const [addingAll, setAddingAll] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)

  if (!products || products.length === 0) return null

  const handleAddSingle = useCallback(
    async (p: FBTProduct) => {
      setAddingId(p.variantId)
      try {
        await addToCart({
          variantId: p.variantId,
          quantity: 1,
          countryCode,
        })
        window.dispatchEvent(new Event("cart-updated"))
      } catch {}
      setAddingId(null)
    },
    [countryCode]
  )

  const handleAddAll = useCallback(async () => {
    setAddingAll(true)
    try {
      for (const p of products) {
        await addToCart({
          variantId: p.variantId,
          quantity: 1,
          countryCode,
        })
      }
      window.dispatchEvent(new Event("cart-updated"))
    } catch {}
    setAddingAll(false)
  }, [products, countryCode])

  const totalPrice = products.reduce((sum, p) => sum + p.price, 0)

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-stone-800">
          Often Bought With This
        </h2>
        <button
          onClick={handleAddAll}
          disabled={addingAll}
          className="text-xs font-semibold text-brand-orange hover:text-brand-orange-dark disabled:opacity-50"
        >
          {addingAll
            ? "Adding..."
            : `Add All (${formatGBP(totalPrice)})`}
        </button>
      </div>

      <div className="px-4 py-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-3">
          {products.slice(0, 6).map((p) => (
            <div
              key={p.variantId}
              className="flex-shrink-0 w-[140px] bg-stone-50 rounded-lg border border-stone-100 overflow-hidden"
            >
              <LocalizedClientLink href={`/products/${p.handle}`}>
                <div className="w-full aspect-square bg-stone-100">
                  <Thumbnail
                    thumbnail={p.thumbnail}
                    images={undefined}
                    size="square"
                  />
                </div>
              </LocalizedClientLink>
              <div className="p-2">
                <LocalizedClientLink href={`/products/${p.handle}`}>
                  <h4 className="text-[11px] font-medium text-stone-700 line-clamp-2 leading-tight mb-1">
                    {p.title}
                  </h4>
                </LocalizedClientLink>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">
                    {formatGBP(p.price)}
                  </span>
                  <button
                    onClick={() => handleAddSingle(p)}
                    disabled={addingId === p.variantId}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-brand-orange text-white text-sm font-bold hover:bg-brand-orange/90 active:scale-90 transition-all disabled:opacity-50"
                  >
                    {addingId === p.variantId ? "..." : "+"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
