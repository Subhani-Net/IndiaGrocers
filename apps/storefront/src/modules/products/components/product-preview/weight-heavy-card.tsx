"use client"

import { useState, useCallback } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { addToCart, updateLineItem, deleteLineItem } from "@lib/data/cart"
import WishlistButton from "@modules/wishlist/components/wishlist-button"
import { formatGBP, formatUnitPrice, getWeightLabel } from "@lib/util/format-price"
import type { GroceryVariantMetadata } from "../../../../types/product"

interface VariantChip {
  id: string
  title: string
  weightLabel: string
  price: number
  pricePerUnit: number
  pricePerUnitLabel: string
  isBestValue: boolean
  inventoryQuantity?: number
}

export default function WeightHeavyProductCard({
  product,
  countryCode,
  onProductClick,
}: {
  product: any
  countryCode: string
  onProductClick?: () => void
}) {
  // Extract brand from subtitle or metadata
  const brand =
    (product.metadata as any)?.brand_slug
      ? (product.metadata as any).brand_slug
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase())
      : null

  const cleanTitle = product.title || ""
  const handle = product.handle || ""

  // Build variant chips from product variants with GroceryVariantMetadata
  const variants: VariantChip[] = (product.variants || [])
    .map((v: any) => {
      const meta = (v.metadata || {}) as GroceryVariantMetadata
      const price = v.calculated_price?.calculated_amount ?? 0
      return {
        id: v.id,
        title: v.title || "",
        weightLabel: meta.weight_value
          ? getWeightLabel({
              id: v.id,
              title: v.title,
              metadata: meta,
            } as any)
          : v.title || "",
        price,
        pricePerUnit: meta.price_per_unit || 0,
        pricePerUnitLabel: meta.price_per_unit_label || "",
        isBestValue: meta.is_best_value || false,
        inventoryQuantity: v.inventory_quantity,
      }
    })
    .filter((v: VariantChip) => v.weightLabel)

  // Default to first variant if no weight metadata
  const firstVariant =
    variants.length > 0
      ? variants[0]
      : product.variants?.[0]
      ? {
          id: product.variants[0].id,
          title: product.variants[0].title || "",
          weightLabel: product.variants[0].title || "",
          price:
            product.variants[0].calculated_price?.calculated_amount ?? 0,
          pricePerUnit: 0,
          pricePerUnitLabel: "",
          isBestValue: false,
        }
      : null

  const [selectedVariant, setSelectedVariant] = useState<VariantChip | null>(
    firstVariant
  )
  const [qtyCounts, setQtyCounts] = useState<Record<string, number>>({})
  const [lineItemMap, setLineItemMap] = useState<Record<string, string>>({})

  const activeVariant = selectedVariant || firstVariant
  // If no variant data at all, product card cannot render interactions
  if (!activeVariant) {
    return (
      <div className="flex flex-col bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="p-3 text-center text-xs text-stone-400">No variants available</div>
      </div>
    )
  }
  const visibleChips = variants.slice(0, 3)
  const hasMore = variants.length > 3

  // Lazy-populate line IDs from cart on first use
  const ensureLineIds = useCallback(async () => {
    try {
      const { retrieveCart } = await import("@lib/data/cart")
      const c = await retrieveCart()
      const items = c?.items || []
      const ids: Record<string, string> = {}
      for (const item of items) {
        const vid = item.variant_id || item.variant?.id
        if (vid && item.id) ids[vid] = item.id
      }
      setLineItemMap(ids)
      return ids
    } catch { return lineItemMap }
  }, [lineItemMap])

  const handleQuantityChange = useCallback(
    async (variantId: string, delta: number) => {
      const current = qtyCounts[variantId] || 0
      const next = Math.max(0, current + delta)
      setQtyCounts(prev => ({ ...prev, [variantId]: next }))
      try {
        if (next === 0) {
          const lineId = lineItemMap[variantId]
          if (lineId) await deleteLineItem(lineId)
          setLineItemMap(prev => { const m = { ...prev }; delete m[variantId]; return m })
          window.dispatchEvent(new Event("cart-updated"))
        } else if (delta > 0) {
          await addToCart({ variantId, quantity: 1, countryCode })
          if (current === 0) {
            window.dispatchEvent(new Event("cart-updated"))
            ensureLineIds()
          }
        } else {
          let ids = lineItemMap
          if (!ids[variantId]) ids = await ensureLineIds()
          const lineId = ids[variantId]
          if (lineId) await updateLineItem({ lineId, quantity: next })
        }
      } catch {
        setQtyCounts(prev => ({ ...prev, [variantId]: current }))
      }
    },
    [countryCode, qtyCounts, lineItemMap, ensureLineIds]
  )

  const handleAdd = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation()
      if (!activeVariant?.id) return
      await handleQuantityChange(activeVariant.id, 1)
    },
    [activeVariant?.id, handleQuantityChange]
  )

  return (
    <div className="product-card h-full flex flex-col group relative bg-white rounded-xl border border-stone-200/60 overflow-hidden hover:shadow-md transition-shadow">
      {/* MOBILE LAYOUT */}
      <div className="flex sm:hidden items-center gap-3 p-3 w-full">
        <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-stone-50 border border-stone-100 relative">
          {onProductClick ? (
            <div role="button" tabIndex={0} onClick={onProductClick}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onProductClick() } }}
              className="w-full h-full cursor-pointer">
              <Thumbnail thumbnail={product.thumbnail} images={product.images} size="square" />
            </div>
          ) : (
            <LocalizedClientLink href={`/products/${handle}`}>
              <Thumbnail thumbnail={product.thumbnail} images={product.images} size="square" />
            </LocalizedClientLink>
          )}
          <WishlistButton productId={product.id} />
        </div>
        <div className="flex-1 min-w-0">
          {brand && (
            <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block mb-0.5 truncate">
              {brand}
            </span>
          )}
          {onProductClick ? (
            <div role="button" tabIndex={0} onClick={onProductClick}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onProductClick() } }}
              className="text-left cursor-pointer">
              <h3 data-testid="product-title" className="text-sm font-semibold text-stone-800 leading-tight line-clamp-2">
                {cleanTitle}
              </h3>
            </div>
          ) : (
            <LocalizedClientLink href={`/products/${handle}`}>
              <h3 data-testid="product-title" className="text-sm font-semibold text-stone-800 leading-tight line-clamp-2">
                {cleanTitle}
              </h3>
            </LocalizedClientLink>
          )}

          {/* Weight chips - mobile */}
          {visibleChips.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {visibleChips.map((chip) => (
                <button
                  key={chip.id}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSelectedVariant(chip)
                  }}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all ${
                    activeVariant?.id === chip.id
                      ? "bg-brand-orange text-white border-brand-orange"
                      : chip.isBestValue
                      ? "border-amber-400 text-amber-700 bg-amber-50"
                      : "border-stone-200 text-stone-500 hover:border-brand-orange/50"
                  }`}
                >
                  {chip.weightLabel}
                  {chip.isBestValue && (
                    <span className="ml-0.5 text-[9px]">★</span>
                  )}
                </button>
              ))}
              {hasMore && (
                <span className="text-[10px] text-stone-400 self-center">
                  +{variants.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Price + unit price - mobile */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold text-stone-800">
              {formatGBP(activeVariant?.price || 0)}
            </span>
            {activeVariant?.pricePerUnitLabel && (
              <span className="text-[10px] text-stone-400">
                {formatUnitPrice({
                  id: activeVariant.id,
                  title: activeVariant.title,
                  metadata: {
                    price_per_unit: activeVariant.pricePerUnit,
                    price_per_unit_label: activeVariant.pricePerUnitLabel,
                  },
                } as any)}
              </span>
            )}
          </div>

          {/* Add/Quantity - mobile */}
          {qtyCounts[activeVariant.id] > 0 ? (
            <div className="flex items-center border border-grey-30 rounded-lg bg-white shadow-sm h-8 flex-shrink-0 mt-1.5" data-testid="qty-controls">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuantityChange(activeVariant.id, -1) }}
                className="w-8 h-full flex items-center justify-center text-sm font-bold text-grey-50 hover:bg-grey-10 active:bg-grey-20 transition-colors"
                data-testid="qty-decrement"
              >
                −
              </button>
              <span className="w-7 text-center text-xs font-bold text-grey-90 select-none" data-testid="qty-count">
                {qtyCounts[activeVariant.id] || 0}
              </span>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuantityChange(activeVariant.id, 1) }}
                className="w-8 h-full flex items-center justify-center text-sm font-bold text-brand-orange hover:bg-brand-orange/10 active:bg-brand-orange/20 transition-colors"
                data-testid="qty-increment"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={!activeVariant}
              className="mt-1.5 text-xs font-semibold text-white bg-brand-orange rounded-lg px-4 py-1.5 hover:bg-brand-orange/90 active:scale-95 disabled:opacity-50 transition-all"
              data-testid="add-to-cart-btn"
            >
              Add
            </button>
          )}
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden sm:flex flex-col flex-1">
        {onProductClick ? (
          <div role="button" tabIndex={0} onClick={onProductClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onProductClick() } }}
            className="block group text-left w-full cursor-pointer">
            <div className="w-full aspect-square rounded-t-xl overflow-hidden bg-stone-50 border-b border-stone-100 relative">
              <Thumbnail thumbnail={product.thumbnail} images={product.images} size="square" />
              <WishlistButton productId={product.id} />
              {brand && (
                <span className="absolute top-2.5 left-2.5 bg-stone-800/80 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  {brand}
                </span>
              )}
              {activeVariant?.isBestValue && (
                <span className="absolute top-2.5 right-2.5 bg-amber-400 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  Best Value
                </span>
              )}
            </div>
          </div>
        ) : (
          <LocalizedClientLink href={`/products/${handle}`} className="block group">
            <div className="w-full aspect-square rounded-t-xl overflow-hidden bg-stone-50 border-b border-stone-100 relative">
              <Thumbnail thumbnail={product.thumbnail} images={product.images} size="square" />
              <WishlistButton productId={product.id} />
              {brand && (
                <span className="absolute top-2.5 left-2.5 bg-stone-800/80 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  {brand}
                </span>
              )}
              {activeVariant?.isBestValue && (
                <span className="absolute top-2.5 right-2.5 bg-amber-400 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  Best Value
                </span>
              )}
            </div>
          </LocalizedClientLink>
        )}

        <div className="flex-1 flex flex-col p-3.5">
          {onProductClick ? (
            <div role="button" tabIndex={0} onClick={onProductClick}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onProductClick() } }}
              className="text-left w-full cursor-pointer">
              <h3 data-testid="product-title" className="text-sm font-semibold text-stone-800 group-hover:text-brand-orange transition-colors line-clamp-2 leading-snug min-h-[2.5rem]">
                {cleanTitle}
              </h3>
            </div>
          ) : (
            <LocalizedClientLink href={`/products/${handle}`}>
              <h3 data-testid="product-title" className="text-sm font-semibold text-stone-800 group-hover:text-brand-orange transition-colors line-clamp-2 leading-snug min-h-[2.5rem]">
                {cleanTitle}
              </h3>
            </LocalizedClientLink>
          )}

          {/* Weight chips */}
          {visibleChips.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {visibleChips.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setSelectedVariant(chip)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                    activeVariant?.id === chip.id
                      ? "bg-brand-orange text-white border-brand-orange"
                      : chip.isBestValue
                      ? "border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100"
                      : "border-stone-200 text-stone-500 hover:border-brand-orange/50 hover:text-brand-orange"
                  }`}
                >
                  {chip.weightLabel}
                  {chip.isBestValue && (
                    <span className="ml-0.5 text-[10px]">★</span>
                  )}
                </button>
              ))}
              {hasMore && (
                onProductClick ? (
                  <div role="button" tabIndex={0} onClick={onProductClick}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onProductClick() } }}
                    className="text-[11px] text-stone-400 hover:text-brand-orange self-center px-1 cursor-pointer">
                    +{variants.length - 3}
                  </div>
                ) : (
                  <LocalizedClientLink
                    href={`/products/${handle}`}
                    className="text-[11px] text-stone-400 hover:text-brand-orange self-center px-1"
                  >
                    +{variants.length - 3}
                  </LocalizedClientLink>
                )
              )}
            </div>
          )}

          {/* Price + unit price */}
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-stone-800">
                {formatGBP(activeVariant?.price || 0)}
              </span>
              <span className="text-xs text-stone-500">
                / {activeVariant?.weightLabel || ""}
              </span>
            </div>
            {activeVariant && activeVariant.pricePerUnit > 0 && (() => {
              const av = activeVariant
              return (
              <p className="text-[11px] text-stone-400 mt-0.5">
                {formatUnitPrice({
                  id: av.id,
                  title: av.title,
                  metadata: {
                    price_per_unit: av.pricePerUnit,
                    price_per_unit_label: av.pricePerUnitLabel,
                  },
                } as any)}
              </p>
              )
            })()}
          </div>

          {/* Add to basket / Quantity */}
          {qtyCounts[activeVariant.id] > 0 ? (
            <div className="mt-auto pt-2.5 flex items-center justify-center border border-grey-30 rounded-lg bg-white shadow-sm h-10" data-testid="qty-controls">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuantityChange(activeVariant.id, -1) }}
                className="w-10 h-full flex items-center justify-center text-sm font-bold text-grey-50 hover:bg-grey-10 active:bg-grey-20 transition-colors"
                data-testid="qty-decrement"
              >
                −
              </button>
              <span className="w-10 text-center text-sm font-bold text-grey-90 select-none" data-testid="qty-count">
                {qtyCounts[activeVariant.id] || 0}
              </span>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuantityChange(activeVariant.id, 1) }}
                className="w-10 h-full flex items-center justify-center text-sm font-bold text-brand-orange hover:bg-brand-orange/10 active:bg-brand-orange/20 transition-colors"
                data-testid="qty-increment"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={!activeVariant}
              className="mt-auto pt-2.5 w-full text-sm font-semibold text-white bg-brand-orange rounded-lg py-2.5 hover:bg-brand-orange/90 active:scale-[0.97] disabled:opacity-50 transition-all"
              data-testid="add-to-cart-btn"
            >
              Add to Basket
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
