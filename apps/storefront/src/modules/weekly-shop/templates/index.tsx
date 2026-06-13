"use client"

import { useState, useMemo, useCallback } from "react"
import { formatGBP, getWeightLabel } from "@lib/util/format-price"
import { addToCart } from "@lib/data/cart"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getImageUrl } from "@lib/util/images"
import BasketProgressBar from "@modules/cart/components/basket-progress-bar"

interface ShopItem {
  id: string
  title: string
  handle: string
  variantId: string
  weight: string
  currentPrice: number
  previousPrice?: number
  priceChanged: boolean
  thumbnail?: string
  quantity: number
  category: string
}

export default function WeeklyShopPage({
  lastOrderDate,
  preFilledItems,
  countryCode,
}: {
  lastOrderDate?: string
  preFilledItems: ShopItem[]
  countryCode: string
}) {
  const [items, setItems] = useState(preFilledItems)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.currentPrice * i.quantity, 0),
    [items]
  )

  // Group by category
  const grouped = useMemo(() => {
    const map: Record<string, ShopItem[]> = {}
    for (const item of items) {
      const cat = item.category || "Other"
      if (!map[cat]) map[cat] = []
      map[cat].push(item)
    }
    return map
  }, [items])

  const updateQty = useCallback(
    (id: string, delta: number) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        ).filter((i) => i.quantity > 0)
      )
    },
    []
  )

  const handleConfirmAndCheckout = async () => {
    setAdding(true)
    for (const item of items) {
      try {
        await addToCart({
          variantId: item.variantId,
          quantity: item.quantity,
          countryCode,
        })
      } catch {}
    }
    window.dispatchEvent(new Event("cart-updated"))
    setAdded(true)
    setAdding(false)
  }

  const dateStr = lastOrderDate
    ? new Date(lastOrderDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "your last order"

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-stone-900">Your Weekly Shop</h1>
          <LocalizedClientLink
            href="/cart"
            className="text-sm text-brand-orange font-medium hover:underline"
          >
            View Cart
          </LocalizedClientLink>
        </div>
        <p className="text-sm text-stone-500 mb-6">
          Based on {dateStr} — review and adjust quantities
        </p>

        {/* Progress Bar */}
        <div className="mb-6">
          <BasketProgressBar itemTotal={total} itemCount={items.length} />
        </div>

        {/* Grouped items */}
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, catItems]) => (
            <div key={category}>
              <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                {category} ({catItems.length})
              </h2>
              <div className="space-y-2">
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-stone-200 rounded-xl p-3 flex items-center gap-3"
                  >
                    <LocalizedClientLink
                      href={`/products/${item.handle}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-3">
                        {item.thumbnail && (
                          <img
                            src={getImageUrl(item.thumbnail)}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover bg-stone-100 flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-stone-800 truncate">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-stone-400">
                              {item.weight}
                            </span>
                            <span className="text-xs font-semibold text-stone-700">
                              {formatGBP(item.currentPrice)}
                            </span>
                            {item.priceChanged && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                                Price updated
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </LocalizedClientLink>

                    {/* Qty control */}
                    <div className="flex items-center border border-stone-200 rounded-lg bg-white overflow-hidden flex-shrink-0">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-stone-500 hover:bg-stone-50"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-stone-800 select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center text-brand-orange hover:bg-brand-orange/10 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => updateQty(item.id, -item.quantity)}
                      className="text-stone-300 hover:text-red-500 text-sm px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-16">
            <span className="text-4xl block mb-3">🛒</span>
            <h3 className="text-lg font-semibold text-stone-700">
              No items to review
            </h3>
            <p className="text-sm text-stone-500 mt-1">
              Add items to continue your weekly shop
            </p>
            <LocalizedClientLink href="/store">
              <button className="mt-4 px-6 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-orange/90">
                Browse Products
              </button>
            </LocalizedClientLink>
          </div>
        )}

        {/* Bottom CTA */}
        {items.length > 0 && (
          <div className="mt-8 sticky bottom-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-stone-500">
                    {items.length} item{items.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xl font-bold text-stone-900">
                    {formatGBP(total)}
                  </p>
                </div>
                <button
                  onClick={handleConfirmAndCheckout}
                  disabled={adding}
                  className={`px-6 py-3 text-sm font-bold rounded-xl transition-all ${
                    added
                      ? "bg-green-600 text-white"
                      : "bg-brand-orange text-white hover:bg-brand-orange/90 active:scale-[0.98]"
                  } disabled:opacity-50`}
                >
                  {adding ? "Adding to cart..." : added ? "Added! Go to Cart →" : "Confirm & Go to Checkout"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
