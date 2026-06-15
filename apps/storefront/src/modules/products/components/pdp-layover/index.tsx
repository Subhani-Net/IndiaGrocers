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

function extractWeight(title: string): { weight: number; unit: string } | null {
  const match = title.match(/(\d+\.?\d*)\s*(g|kg|ml|l|L)/i)
  if (!match) return null
  return { weight: parseFloat(match[1]), unit: match[2].toLowerCase() }
}

function computeUnitPrice(price: number, variantTitle: string): string {
  const extracted = extractWeight(variantTitle)
  if (!extracted) return ""
  const weightInKg =
    extracted.unit === "kg" || extracted.unit === "l"
      ? extracted.weight
      : extracted.weight / 1000
  if (weightInKg <= 0) return ""
  const pricePerKg = price / weightInKg
  const priceInPounds = pricePerKg / 100
  if (priceInPounds < 1) return `${(priceInPounds * 100).toFixed(0)}p/100g`
  return `£${priceInPounds.toFixed(2)}/kg`
}

function getWeightLabel(title: string): string {
  const match = title.match(/(\d+\.?\d*\s*(?:g|kg|ml|l|L))/i)
  return match ? match[1] : title
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

  const displayVariants = variants.filter((v) => v.title !== "Default")

  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [adding, setAdding] = useState(false)
  const [closing, setClosing] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState(
    displayVariants.length > 0 ? displayVariants[0] : variants[0] || null
  )

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
  const brand = (product.metadata as any)?.brand

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

  const selectedPrice = selectedVariant?.price || 0
  const selectedUnitPrice =
    selectedVariant && computeUnitPrice(selectedVariant.price, selectedVariant.title)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          closing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      {/* ═══ DESKTOP: Centered Modal, 2-column horizontal ═══ */}
      <div
        className={`hidden sm:block fixed z-[61] inset-x-4 top-1/2 -translate-y-1/2 max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto transition-all duration-200 ${
          closing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-grey-10 shadow-sm transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-grey-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 2-Column Grid */}
        <div className="flex">
          {/* ─── LEFT: Image (40%) ─── */}
          <div className="w-[40%] flex-shrink-0 p-6">
            <div className="aspect-square rounded-xl overflow-hidden bg-grey-10 border border-grey-10/60">
              <Thumbnail
                thumbnail={product.thumbnail}
                images={product.images}
                size="square"
              />
            </div>
          </div>

          {/* ─── RIGHT: Info (60%) ─── */}
          <div className="w-[60%] flex flex-col p-6 pl-0">
            {/* Brand + Title */}
            {brand && (
              <span className="text-xs font-semibold text-brand-saffron uppercase tracking-wider">
                {brand}
              </span>
            )}
            <h2 className="text-lg font-bold text-stone-900 leading-snug mt-0.5">
              {product.title}
            </h2>

            {/* Weight / Pack Size Chips */}
            {displayVariants.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {displayVariants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-all ${
                      selectedVariant?.id === v.id
                        ? "bg-brand-orange text-white border-brand-orange"
                        : "bg-stone-100 border-stone-200 text-stone-600 hover:border-brand-orange/50"
                    }`}
                  >
                    {getWeightLabel(v.title)}
                  </button>
                ))}
              </div>
            )}

            {/* Price Block */}
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-stone-900">
                  {formatPrice(selectedPrice)}
                </span>
                {selectedUnitPrice && (
                  <span className="text-sm text-stone-400">
                    {selectedUnitPrice}
                  </span>
                )}
              </div>
            </div>

            {/* Variant List with Qty Selectors */}
            <div className="mt-4 space-y-1.5 overflow-y-auto max-h-[30vh]">
              {displayVariants.map((v) => {
                const qty = quantities[v.id] || 0
                const unitPrice = computeUnitPrice(v.price, v.title)
                return (
                  <div
                    key={v.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      qty > 0
                        ? "bg-brand-orange/5 border border-brand-orange/20"
                        : "border border-transparent"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-stone-700">
                        {v.title}
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-sm font-bold text-stone-900">
                          {formatPrice(v.price)}
                        </span>
                        {unitPrice && (
                          <span className="text-[11px] text-stone-400">
                            {unitPrice}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0 flex-shrink-0">
                      <button
                        onClick={() => handleQuantity(v.id, -1)}
                        disabled={qty === 0}
                        className="w-8 h-8 flex items-center justify-center text-sm font-medium text-stone-500 hover:bg-stone-100 rounded-md transition-colors disabled:opacity-20"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-stone-900 tabular-nums">
                        {qty}
                      </span>
                      <button
                        onClick={() => handleQuantity(v.id, 1)}
                        className="w-8 h-8 flex items-center justify-center text-sm font-medium text-brand-orange hover:bg-brand-orange/10 rounded-md transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer: Total + Add to Basket */}
            <div className="mt-auto pt-4 border-t border-stone-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-stone-500">
                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                </span>
                <span className="text-lg font-bold text-stone-900">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <button
                onClick={handleAddAll}
                disabled={totalItems === 0 || adding}
                className="w-full py-3 bg-brand-orange text-white font-semibold rounded-xl hover:bg-brand-orange-dark active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? "Adding..." : "Add to Basket"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MOBILE: Bottom Sheet ═══ */}
      <div
        className={`sm:hidden fixed z-[61] inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col transition-transform duration-250 ease-fluid-out ${
          closing ? "translate-y-full" : "translate-y-0"
        }`}
      >
        {/* Grab bar */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-stone-300 rounded-full" />
        </div>

        {/* Top: Image + Title + Chips */}
        <div className="flex items-start gap-3 px-4 py-3 border-b border-stone-100 flex-shrink-0">
          <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-stone-50 border border-stone-100">
            <Thumbnail
              thumbnail={product.thumbnail}
              images={product.images}
              size="square"
            />
          </div>
          <div className="flex-1 min-w-0">
            {brand && (
              <span className="text-[11px] font-semibold text-brand-saffron uppercase tracking-wider">
                {brand}
              </span>
            )}
            <h2 className="text-sm font-bold text-stone-900 leading-snug line-clamp-2 mt-0.5">
              {product.title}
            </h2>
            {displayVariants.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {displayVariants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                      selectedVariant?.id === v.id
                        ? "bg-brand-orange text-white border-brand-orange"
                        : "bg-stone-100 border-stone-200 text-stone-500"
                    }`}
                  >
                    {getWeightLabel(v.title)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors flex-shrink-0"
            style={{ minHeight: 48 }}
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Price Display */}
        <div className="px-4 py-3 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-stone-900">
              {formatPrice(selectedPrice)}
            </span>
            {selectedUnitPrice && (
              <span className="text-sm text-stone-400">{selectedUnitPrice}</span>
            )}
          </div>
        </div>

        {/* Variant List */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="space-y-1">
            {displayVariants.map((v) => {
              const qty = quantities[v.id] || 0
              const unitPrice = computeUnitPrice(v.price, v.title)
              return (
                <div
                  key={v.id}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                    qty > 0
                      ? "bg-brand-orange/5 border border-brand-orange/20"
                      : "border border-transparent"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-stone-700">
                      {v.title}
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-sm font-bold text-stone-900">
                        {formatPrice(v.price)}
                      </span>
                      {unitPrice && (
                        <span className="text-[11px] text-stone-400">
                          {unitPrice}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0 flex-shrink-0">
                    <button
                      onClick={() => handleQuantity(v.id, -1)}
                      disabled={qty === 0}
                      className="w-9 h-9 flex items-center justify-center text-base font-medium text-stone-500 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-20"
                      style={{ minHeight: 48 }}
                    >
                      −
                    </button>
                    <span className="w-9 text-center text-sm font-semibold text-stone-900 tabular-nums">
                      {qty}
                    </span>
                    <button
                      onClick={() => handleQuantity(v.id, 1)}
                      className="w-9 h-9 flex items-center justify-center text-base font-medium text-brand-orange hover:bg-brand-orange/10 rounded-lg transition-colors"
                      style={{ minHeight: 48 }}
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sticky Footer: Total + Add to Basket */}
        <div className="px-4 py-3 border-t border-stone-100 flex-shrink-0 bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-stone-500">
              {totalItems} item{totalItems !== 1 ? "s" : ""}
            </span>
            <span className="text-lg font-bold text-stone-900">
              {formatPrice(totalPrice)}
            </span>
          </div>
          <button
            onClick={handleAddAll}
            disabled={totalItems === 0 || adding}
            className="w-full py-3.5 bg-brand-orange text-white font-semibold rounded-xl hover:bg-brand-orange-dark active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: 48 }}
          >
            {adding ? "Adding..." : "Add to Basket"}
          </button>
        </div>
      </div>
    </>
  )
}
