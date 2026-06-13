"use client"

import { useState, useRef, useCallback } from "react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import { addToCart, updateLineItem, deleteLineItem } from "@lib/data/cart"
import ProductOverlay from "./product-overlay"
import WishlistButton from "@modules/wishlist/components/wishlist-button"

function formatPrice(amount: number): string {
    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 2
    }).format(amount / 100)
}

export default function ProductCard({
    product,
    region,
}: {
    product: HttpTypes.StoreProduct
    region?: HttpTypes.StoreRegion
    isFeatured?: boolean
}) {
    const displayTitle = product.title || ""

    const variants = (product.variants || []).map((v: any) => ({
        id: v.id,
        title: v.title || "",
        price: v.calculated_price?.calculated_amount || 0,
    }))

    const firstVariant = variants[0]
    const variantTitles = variants.map(v => v.title).filter(t => t && t !== "Default")
    const hasVariants = variantTitles.length > 1
    const weightText = firstVariant?.title && firstVariant.title !== "Default" ? firstVariant.title : ""
    const countryCode = (region as any)?.countries?.[0]?.iso_2 || "gb"

    const [showOverlay, setShowOverlay] = useState(false)
    const [qtyCounts, setQtyCounts] = useState<Record<string, number>>({})
    const [lineItemMap, setLineItemMap] = useState<Record<string, string>>({})

    const cardRef = useRef<HTMLDivElement>(null)
    const handleClose = useCallback(() => setShowOverlay(false), [])

    // Lazy-populate line item IDs from cart on first use
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

    const handleQuantityChange = async (variantId: string, delta: number) => {
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
                    // Lazy-load line IDs after first add
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
    }

    const handleAdd = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation()
        if (!firstVariant?.id) return
        await handleQuantityChange(firstVariant.id, 1)
    }

    return (
        <>
            <div ref={cardRef} className="product-card h-full flex flex-col group relative">

                {/* MOBILE LAYOUT */}
                <div className="flex sm:hidden items-center gap-3 p-3 w-full" data-testid="product-card">
                    <LocalizedClientLink href={`/products/${product.handle}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                        <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-grey-10 border border-grey-10 relative">
                            <Thumbnail thumbnail={product.thumbnail} images={product.images} size="square" />
                            <WishlistButton productId={product.id} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="hidden" data-testid="product-full-title">{product.title}</span>
                            <h3 data-testid="product-title" className="text-sm font-semibold text-grey-90 leading-tight line-clamp-2">{displayTitle}</h3>
                            <div className="flex items-center mt-1.5">
                                <span className="text-sm font-bold text-grey-90">{formatPrice(firstVariant?.price || 0)}</span>
                                {weightText && <span className="text-[11px] text-grey-50 ml-2">{weightText}</span>}
                                {hasVariants && <span className="text-[11px] text-grey-50 ml-2">{variantTitles.length} sizes</span>}
                            </div>
                        </div>
                    </LocalizedClientLink>
                    <div className="flex-shrink-0">
                        {hasVariants ? (
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowOverlay(true) }}
                                className="text-xs font-semibold text-brand-orange border border-brand-orange rounded-lg px-3 py-1.5 hover:bg-brand-orange hover:text-white active:scale-95 transition-all"
                            >
                                Options
                            </button>
                        ) : qtyCounts[firstVariant?.id || ''] > 0 ? (
                            <div className="flex items-center border border-grey-30 rounded-lg bg-white shadow-sm h-8" data-testid="qty-controls">
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuantityChange(firstVariant.id, -1) }}
                                    className="w-8 h-full flex items-center justify-center text-sm font-bold text-grey-50 hover:bg-grey-10 active:bg-grey-20 transition-colors"
                                    data-testid="qty-decrement"
                                >
                                    −
                                </button>
                                <span className="w-7 text-center text-xs font-bold text-grey-90 select-none" data-testid="qty-count">
                                    {qtyCounts[firstVariant.id]}
                                </span>
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuantityChange(firstVariant.id, 1) }}
                                    className="w-8 h-full flex items-center justify-center text-sm font-bold text-brand-orange hover:bg-brand-orange/10 active:bg-brand-orange/20 transition-colors"
                                    data-testid="qty-increment"
                                >
                                    +
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleAdd}
                                className="text-xs font-semibold text-white bg-brand-orange rounded-lg px-3 py-1.5 hover:bg-brand-orange-dark active:scale-95 transition-all z-10 relative"
                                data-testid="add-to-cart-btn"
                            >
                                Add
                            </button>
                        )}
                    </div>
                </div>

                {/* DESKTOP LAYOUT */}
                <div className="hidden sm:flex flex-col flex-1 p-4">
                    <span className="hidden" data-testid="product-full-title">{product.title}</span>
                    <LocalizedClientLink href={`/products/${product.handle}`} className="block group">
                        <div className="w-full aspect-square rounded-xl overflow-hidden bg-grey-5 border border-grey-10/60 relative mb-3">
                            <Thumbnail thumbnail={product.thumbnail} images={product.images} size="square" />
                            <WishlistButton productId={product.id} />
                        </div>
                        <h3 data-testid="product-title" className="text-sm font-semibold text-grey-90 group-hover:text-brand-orange transition-colors line-clamp-2 h-10 leading-snug text-center">
                            {displayTitle}
                        </h3>
                    </LocalizedClientLink>

                    <div className="mt-auto pt-3">
                        <div className="border border-stone-200/80 rounded-xl overflow-hidden bg-white">
                            {variants.map((v) => {
                                const itemQty = qtyCounts[v.id] || 0
                                return (
                                    <div
                                        key={v.id}
                                        className={`flex items-center justify-between px-3 py-2 border-b border-stone-100 last:border-b-0 transition-all duration-200 ease-fluid-out ${itemQty > 0 ? 'bg-stone-50' : 'bg-transparent'}`}
                                    >
                                        <div className="flex flex-col min-w-0">
                                            <span className={`text-xs ${itemQty > 0 ? 'font-bold text-stone-900' : 'font-normal text-stone-600'}`}>
                                                {v.title}
                                            </span>
                                            <span className="text-[11px] font-semibold text-stone-500">{formatPrice(v.price)}</span>
                                        </div>
                                        <div className="flex items-center border border-grey-30 rounded-lg bg-white overflow-hidden shadow-sm h-8 flex-shrink-0" data-testid="qty-controls">
                                            <button
                                                onClick={() => handleQuantityChange(v.id, -1)}
                                                disabled={itemQty === 0}
                                                className="w-8 h-full flex items-center justify-center text-sm font-bold text-grey-50 hover:bg-grey-10 disabled:opacity-20 active:bg-grey-20 transition-colors press-scale"
                                                data-testid="qty-decrement"
                                            >
                                                –
                                            </button>
                                            <span className="w-7 text-center text-xs font-bold text-grey-90 select-none tabular-nums" data-testid="qty-count">
                                                {itemQty}
                                            </span>
                                            <button
                                                onClick={() => handleQuantityChange(v.id, 1)}
                                                className="w-8 h-full flex items-center justify-center text-sm font-bold text-brand-orange hover:bg-brand-orange/10 active:bg-brand-orange/20 transition-colors press-scale"
                                                data-testid="qty-increment"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {(product.description || variants.length > 1) && (
                            <button
                                onClick={() => setShowOverlay(true)}
                                className="mt-2.5 w-full text-xs font-medium text-stone-400 hover:text-brand-orange transition-colors text-center block py-1.5 rounded-lg hover:bg-brand-orange/5"
                            >
                                Product details & sizes
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showOverlay && (
                <ProductOverlay
                    product={product}
                    region={region}
                    open={showOverlay}
                    onClose={handleClose}
                    cardRef={cardRef}
                />
            )}
        </>
    )
}
