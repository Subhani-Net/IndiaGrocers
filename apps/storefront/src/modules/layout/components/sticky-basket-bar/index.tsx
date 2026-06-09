"use client"

import { useEffect, useState, useCallback } from "react"
import { formatGBP } from "@lib/util/format-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const FREE_DELIVERY = 4500
const DELIVERY_COST = 399

export default function StickyBasketBar() {
  const [total, setTotal] = useState(0)
  const [count, setCount] = useState(0)
  const [visible, setVisible] = useState(false)

  const refreshCart = useCallback(async () => {
    try {
      const { retrieveCart } = await import("@lib/data/cart")
      const cart = await retrieveCart()
      if (cart) {
        setTotal(cart.item_total || 0)
        setCount(cart.items?.length || 0)
        setVisible((cart.items?.length || 0) > 0)
      }
    } catch {}
  }, [])

  useEffect(() => {
    refreshCart()
    window.addEventListener("cart-updated", refreshCart)
    return () => window.removeEventListener("cart-updated", refreshCart)
  }, [refreshCart])

  if (!visible) return null

  const remaining = Math.max(FREE_DELIVERY - total, 0)
  const reachedFree = total >= FREE_DELIVERY

  return (
    <div className="fixed bottom-14 left-0 right-0 z-40 lg:hidden">
      <div className={`px-4 py-2 border-t ${reachedFree ? "bg-green-50 border-green-200" : "bg-brand-orange/95 border-brand-orange"}`}>
        <LocalizedClientLink href="/cart" className="flex items-center justify-between">
          <span className={`text-xs font-semibold ${reachedFree ? "text-green-700" : "text-white"}`}>
            Basket: {formatGBP(total)} ({count} item{count !== 1 ? "s" : ""})
          </span>
          <span className={`text-xs font-bold ${reachedFree ? "text-green-700" : "text-white"}`}>
            {reachedFree ? "FREE delivery →" : `${formatGBP(remaining)} to free delivery →`}
          </span>
        </LocalizedClientLink>
      </div>
    </div>
  )
}
