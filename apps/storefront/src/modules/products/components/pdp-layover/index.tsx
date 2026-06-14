"use client"

import { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import Thumbnail from "@modules/products/components/thumbnail"
import { addToCart } from "@lib/data/cart"

// ─── Helpers ───

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(amount / 100)
}

function formatUnitPrice(amount: number): string {
  const pounds = amount / 100
  if (pounds < 0.01) return ""
  if (pounds < 1) return `${(pounds * 100).toFixed(0)}p/100g`
  return `£${pounds.toFixed(2)}/unit`
}

function extractWeight(title: string): { weight: number; unit: string } | null {
  const match = title.match(/(\d+\.?\d*)\s*(g|kg|ml|l|L)/i)
  if (!match) return null
  const weight = parseFloat(match[1])
  const unit = match[2].toLowerCase()
  return { weight, unit }
}

function computeUnitPrice(
  price: number,
  variantTitle: string
): string {
  const extracted = extractWeight(variantTitle)
  if (!extracted) return ""

  let weightInKg: number
  if (extracted.unit === "kg" || extracted.unit === "l") {
    weightInKg = extracted.weight
  } else {
    weightInKg = extracted.weight / 1000
  }
  if (weightInKg <= 0) return ""

  const pricePerKg = price / weightInKg
  const priceInPounds = pricePerKg / 100

  if (priceInPounds < 1) {
    return `${(priceInPounds * 100).toFixed(0)}p/100g`
  }
  return `£${priceInPounds.toFixed(2)}/kg`
}

// ─── Component ───

interface PdpLayoverProps {
  product: HttpTypes.StoreProduct
  countryCode: string
  onClose: () => void
}

export default function PdpLayover({
  product,
  countryCode,
  onClose,
}: PdpLayoverProps) {
  const variants = (product.variants || []).map((v: any) => ({
    id: v.id,
    title: v.title || "",
    price: v.calculated_price?.calculated_amount || 0,
    metadata: v.metadata || {},
  }))

  const hasVariants = variants.length > 1
  const displayVariants = hasVariants
    ? variants
    : variants.filter((v) => v.title !== "Default")

  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [adding, setAdding] = useState(false)
  const [closing, setClosing] = useState(false)

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  // ESC key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [])

  const handleClose = () => {
    setClosing(true)
    setTimeout(onClose, 200)
  }

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0)
  const totalPrice = variants.reduce(
    (sum, v) => sum + (quantities[v.id] || 0) * v.price,
    0
  )

  const handleQuantity = (variantId: string, delta: number) => {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[variantId] || 0) + delta)
      return { ...prev, [variantId]: next }
    })
  }

  const handleAddAll = async () => {
    if (totalItems === 0 || adding) return
    setAdding(true)
    try {
      for (const [variantId, qty] of Object.entries(quantities)) {
        if (qty > 0) {
          await addToCart({ variantId, quantity: qty, countryCode })
        }
      }
      window.dispatchEvent(new Event("cart-updated"))
      handleClose()
    } catch {
      // silent
    } finally {
      setAdding(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          closing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed z-[61] bg-white flex flex-col transition-transform duration-250 ease-fluid-out
          sm:inset-x-4 sm:top-1/2 sm:-translate-y-1/2 sm:max-w-2xl sm:mx-auto sm:rounded-2xl sm:max-h-[85vh]
          inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh]
          ${closing ? "translate-y-full sm:translate-y-1/2 sm:opacity-0" : "translate-y-0 sm:opacity-100"}
        `}
      >
        {/* Drag handle (mobile only) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-grey-30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-4 p-4 sm:p-6 border-b border-grey-20/60 flex-shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-grey-10 border border-grey-10/60">
            <Thumbnail
              thumbnail={product.thumbnail}
              images={product.images}
              size="square"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-grey-90 leading-snug line-clamp-2">
              {product.title}
            </h2>
            {product.metadata && (product.metadata as any)?.brand && (
              <p className="text-xs font-semibold text-brand-saffron mt-1">
                {(product.metadata as any).brand}
              </p>
            )}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-grey-10 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-grey-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Variant list */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3">
          {displayVariants.length === 0 ? (
            <p className="text-sm text-grey-40 text-center py-8">
              No variants available
            </p>
          ) : (
            <div className="space-y-1">
              {displayVariants.map((v) => {
                const qty = quantities[v.id] || 0
                const unitPrice = computeUnitPrice(v.price, v.title)
                const isActive = qty > 0

                return (
                  <div
                    key={v.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      isActive ? "bg-brand-orange/5 border border-brand-orange/20" : "border border-transparent"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-grey-80">
                        {v.title}
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-sm font-bold text-grey-90">
                          {formatPrice(v.price)}
                        </span>
                        {unitPrice && (
                          <span className="text-[11px] text-grey-40">
                            {unitPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity stepper */}
                    <div className="flex items-center gap-0 flex-shrink-0">
                      <button
                        onClick={() => handleQuantity(v.id, -1)}
                        disabled={qty === 0}
                        className="w-9 h-9 flex items-center justify-center text-base font-medium text-grey-50 hover:bg-grey-10 rounded-lg transition-colors disabled:opacity-20"
                      >
                        −
                      </button>
                      <span className="w-9 text-center text-sm font-semibold text-grey-90 tabular-nums">
                        {qty}
                      </span>
                      <button
                        onClick={() => handleQuantity(v.id, 1)}
                        className="w-9 h-9 flex items-center justify-center text-base font-medium text-brand-orange hover:bg-brand-orange/10 rounded-lg transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer: total + add button */}
        <div className="p-4 sm:p-6 border-t border-grey-20/60 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-grey-50">
              {totalItems} item{totalItems !== 1 ? "s" : ""}
            </span>
            <span className="text-lg font-bold text-grey-90">
              {formatPrice(totalPrice)}
            </span>
          </div>
          <button
            onClick={handleAddAll}
            disabled={totalItems === 0 || adding}
            className="w-full py-3 bg-brand-orange text-white font-semibold rounded-xl hover:bg-brand-orange-dark active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed press-scale"
          >
            {adding ? "Adding..." : "Add to Basket"}
          </button>
        </div>
      </div>
    </>
  )
}
