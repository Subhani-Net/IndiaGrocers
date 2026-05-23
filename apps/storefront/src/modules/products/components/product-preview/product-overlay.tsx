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
  cardRef,
}: {
  product: HttpTypes.StoreProduct
  region?: HttpTypes.StoreRegion
  open: boolean
  onClose: () => void
  onAdded?: (qty: Record<string, number>) => void
  cardRef?: { current: Element | null }
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
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [open])

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

  // IntersectionObserver — auto-close when parent card drops below 20% visibility
  useEffect(() => {
    if (!open || !cardRef?.current) return
    const el = cardRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 0.2) onClose()
      },
      { threshold: [0, 0.2] }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [open, cardRef, onClose])

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
    <div
      className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center transition-all duration-300 ease-out ${
        visible ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'
      }`}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className={`relative bg-white w-full sm:max-w-2xl sm:rounded-2xl sm:shadow-2xl overflow-hidden flex flex-col sm:flex-row transition-all duration-300 ease-out ${
          visible
            ? 'translate-y-0 sm:scale-100 opacity-100'
            : 'translate-y-full sm:translate-y-0 sm:scale-95 opacity-0'
        }`}
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-grey-30" />
        </div>

        {/* High-contrast sticky close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-stone-900 text-white shadow-lg hover:bg-stone-700 transition-colors press-scale text-base font-semibold"
        >
          &#x2715;
        </button>

        {/* Product image */}
        <div className="sm:w-[40%] flex-shrink-0 aspect-square sm:aspect-auto bg-grey-10 overflow-hidden">
          <Thumbnail thumbnail={product.thumbnail} images={product.images} size="full" />
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1 min-h-0 sm:overflow-y-auto">
          <h2 className="text-lg font-bold text-grey-90 leading-tight">{cleanTitle}</h2>
          {product.description && (
            <p className="mt-1.5 text-sm text-grey-50 leading-snug line-clamp-3">{product.description}</p>
          )}

          {/* Variant pills */}
          <div className="mt-4">
            <p className="text-sm font-semibold text-grey-70 mb-3">Select size/option</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v: any) => {
                const qty = quantities[v.id] || 0
                return (
                  <div
                    key={v.id}
                    className={`flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl border min-w-[90px] transition-all duration-150 ${
                      qty > 0
                        ? "border-brand-cardamom bg-brand-cardamom/5 shadow-[0_0_0_2px_rgba(46,111,64,0.15)]"
                        : "border-grey-20/80 bg-white hover:border-brand-orange/50 hover:shadow-sm"
                    }`}
                  >
                    <span className={`text-sm font-semibold ${qty > 0 ? 'text-brand-cardamom' : 'text-grey-80'}`}>
                      {v.title}
                    </span>
                    <span className="text-xs font-medium text-grey-50">{formatPrice(v.price)}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => setQty(v.id, qty - 1)}
                        disabled={qty === 0}
                        className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg bg-grey-10 text-grey-60 hover:bg-grey-20 disabled:opacity-30 text-base font-bold press-scale transition-colors"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold min-w-[24px] text-center tabular-nums text-grey-90">{qty}</span>
                      <button
                        onClick={() => setQty(v.id, qty + 1)}
                        className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg bg-brand-orange text-white hover:bg-brand-orange-dark text-base font-bold press-scale transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Total + Add to Cart footer */}
          <div className="mt-auto pt-4 flex-shrink-0">
            {totalQty > 0 && (
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-grey-70">{totalQty} item{totalQty > 1 ? 's' : ''} selected</span>
                <span className="text-base font-bold text-grey-90">{formatPrice(totalPrice)}</span>
              </div>
            )}
            <button
              onClick={handleAddToCart}
              disabled={totalQty === 0 || adding}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 press-scale ${
                totalQty > 0
                  ? 'bg-brand-orange text-white hover:bg-brand-orange-dark shadow-lg shadow-brand-orange/25'
                  : 'bg-grey-10 text-grey-40 cursor-default'
              }`}
            >
              {adding ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Adding...
                </span>
              ) : totalQty > 0 ? (
                `Add to Cart — ${formatPrice(totalPrice)}`
              ) : (
                'Select items to add'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
