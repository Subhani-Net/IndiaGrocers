"use client"

import { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import Thumbnail from "@modules/products/components/thumbnail"
import { addToCart } from "@lib/data/cart"

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(amount / 100)
}

export default function ProductOverlay({
  product,
  region,
  open,
  onClose,
  onAdded,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  open: boolean
  onClose: () => void
  onAdded?: (qty: Record<string, number>) => void
}) {
  const countryCode = (region as any)?.countries?.[0]?.iso_2 || "gb"
  const brandMatch = (product.title || "").match(/\s+-\s+(.+)$/)
  const cleanTitle = brandMatch ? (product.title || "").slice(0, brandMatch.index) : (product.title || "")

  const variants = (product.variants || []).map((v: any) => ({
    id: v.id,
    title: v.title || "",
    price: v.calculated_price?.calculated_amount || 0,
  })).filter((v: any) => v.title !== "Default")

  const initQty: Record<string, number> = {}
  for (const v of variants) initQty[v.id] = 0
  const [quantities, setQuantities] = useState(initQty)
  const [adding, setAdding] = useState(false)

  // ESC key to close + lock scroll
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  const setQty = (id: string, qty: number) => setQuantities((prev) => ({ ...prev, [id]: Math.max(0, qty) }))
  const totalQty = Object.values(quantities).reduce((a, b) => a + b, 0)
  const totalPrice = variants.reduce((sum, v: any) => sum + v.price * (quantities[v.id] || 0), 0)

  const handleAddToCart = async () => {
    if (totalQty === 0) return
    setAdding(true)
    for (const v of variants) {
      const qty = quantities[v.id] || 0
      if (qty > 0) {
        try { await addToCart({ variantId: v.id, quantity: qty, countryCode }) } catch {}
      }
    }
    window.dispatchEvent(new Event("cart-updated"))
    if (onAdded) onAdded({ ...quantities })
    setAdding(false)
    const reset: Record<string, number> = {}
    for (const v of variants) reset[v.id] = 0
    setQuantities(reset)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />
      {/* Panel */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col sm:flex-row" style={{ maxHeight: "calc(100vh - 32px)" }} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow hover:bg-grey-10 transition-colors">
          <svg className="w-4 h-4 text-grey-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Product image */}
        <div className="sm:w-[40%] flex-shrink-0 aspect-square sm:aspect-auto bg-grey-10 overflow-hidden">
          <Thumbnail thumbnail={product.thumbnail} images={product.images} size="full" />
        </div>

        <div className="p-4 flex flex-col flex-1 min-h-0 sm:overflow-y-auto">
          <h2 className="text-lg font-bold text-grey-90">{cleanTitle}</h2>
          {product.description && (
            <p className="mt-1 text-sm text-grey-50 leading-snug line-clamp-2">{product.description}</p>
          )}

          {/* Variant selectors */}
          <div className="mt-3">
            <p className="text-sm font-semibold text-grey-70 mb-2">Select size</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v: any) => {
                const qty = quantities[v.id] || 0
                return (
                  <div key={v.id} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border min-w-[80px] ${qty > 0 ? "border-brand-green bg-green-50 shadow-[0_0_4px_rgba(34,197,94,0.3)]" : "border-grey-20 bg-white"}`}>
                    <span className="text-sm font-semibold text-grey-80">{v.title}</span>
                    <span className="text-xs font-bold text-grey-60">{formatPrice(v.price)}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => setQty(v.id, qty - 1)} className="w-6 h-6 flex items-center justify-center rounded bg-grey-20 text-grey-60 hover:bg-grey-30 text-sm">−</button>
                      <span className="text-sm font-semibold min-w-[20px] text-center">{qty}</span>
                      <button onClick={() => setQty(v.id, qty + 1)} className="w-6 h-6 flex items-center justify-center rounded bg-brand-orange text-white hover:bg-brand-orange-dark text-sm">+</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Total + Add to Cart — always at bottom */}
          {totalQty > 0 && (
            <div className="mt-3 pt-3 border-t border-grey-20 flex items-center justify-between flex-shrink-0">
              <span className="text-sm font-semibold text-grey-80">{totalQty} items · {formatPrice(totalPrice)}</span>
              <button onClick={handleAddToCart} disabled={adding} className="px-6 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-orange-dark disabled:opacity-50 transition-colors">
                {adding ? "Adding..." : "Add to Cart"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
