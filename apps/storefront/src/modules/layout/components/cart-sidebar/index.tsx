"use client"

import { useState, useEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { retrieveCart, deleteLineItem } from "@lib/data/cart"

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(amount / 100)
}

export default function CartSidebar({ countryCode }: { countryCode: string }) {
  const [cart, setCart] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  const fetchCart = async () => {
    try {
      const c = await retrieveCart()
      setCart(c)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchCart() }, [])

  // Listen for cart updates from other components
  useEffect(() => {
    const onCartUpdate = () => fetchCart()
    window.addEventListener("cart-updated", onCartUpdate)
    return () => window.removeEventListener("cart-updated", onCartUpdate)
  }, [])

  const handleRemove = async (lineId: string) => {
    setRemoving(lineId)
    try {
      await deleteLineItem(lineId)
      await fetchCart()
      window.dispatchEvent(new Event("cart-updated"))
    } catch { }
    setRemoving(null)
  }

  const items = cart?.items || []
  const count = items.reduce((sum: number, i: any) => sum + i.quantity, 0)
  const total = cart?.subtotal || 0

  // Group items by category for categorised display
  const groupedItems: Record<string, any[]> = {}
  for (const item of items) {
    const cat = item.variant?.product?.categories?.[0]?.name || "Other"
    if (!groupedItems[cat]) groupedItems[cat] = []
    groupedItems[cat].push(item)
  }

  // Detect recently added items (last 10 seconds)
  const now = Date.now()
  const isNew = (item: any) => {
    if (!item.created_at) return false
    return now - new Date(item.created_at).getTime() < 10000
  }

  return (
    <div className="hidden xl:block w-60 flex-shrink-0">
      <div className="sticky top-16 bg-white rounded-xl border border-grey-20 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-grey-90">Your Basket</h3>
          <span className="text-xs text-grey-50">{count} {count === 1 ? "item" : "items"}</span>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-6">
            <svg className="w-10 h-10 text-grey-30 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <p className="text-sm text-grey-50">Your basket is empty</p>
            <LocalizedClientLink href="/store" className="text-xs text-brand-orange hover:underline mt-1 inline-block">
              Start shopping
            </LocalizedClientLink>
          </div>
        ) : (
          <>
            <div className="max-h-80 overflow-y-auto scrollbar-thin mb-3">
              {Object.entries(groupedItems).map(([category, catItems]) => (
                <div key={category} className="mb-2">
                  <p className="text-[10px] font-semibold text-grey-40 uppercase tracking-wider px-0.5 mb-1">{category}</p>
                  {catItems.map((item: any) => (
                    <div key={item.id} className="flex gap-2 text-xs mb-2 pl-0.5">
                      <div className="w-10 h-10 rounded bg-grey-10 flex-shrink-0 overflow-hidden relative">
                        {item.thumbnail && <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />}
                        {isNew(item) && (
                          <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-[7px] font-bold px-1 rounded-full">NEW</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-grey-80 leading-snug line-clamp-2">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-grey-50">Qty: {item.quantity}</span>
                          <button
                            onClick={() => handleRemove(item.id)}
                            disabled={removing === item.id}
                            className="text-brand-red hover:underline disabled:opacity-50"
                          >
                            {removing === item.id ? "..." : "Remove"}
                          </button>
                        </div>
                      </div>
                      <span className="font-semibold text-grey-80 flex-shrink-0">
                        {formatPrice(item.total || item.unit_price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="border-t border-grey-20 pt-2 flex items-center justify-between">
              <span className="text-sm font-bold text-grey-90">Total</span>
              <span className="text-sm font-bold text-grey-90">{formatPrice(total)}</span>
            </div>
            <LocalizedClientLink
              href="/cart"
              className="block w-full text-center text-sm font-semibold bg-brand-orange text-white rounded-lg py-2 mt-3 hover:bg-brand-orange-dark transition-colors"
            >
              View Basket
            </LocalizedClientLink>
          </>
        )}
      </div>
    </div>
  )
}
