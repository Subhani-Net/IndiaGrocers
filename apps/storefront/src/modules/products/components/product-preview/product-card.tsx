"use client"

import { useState, useRef, useCallback } from "react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import { addToCart } from "@lib/data/cart"
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
    const brandMatch = (product.title || "").match(/\s+-\s+(.+)$/)
    const brand = brandMatch ? brandMatch[1] : null
    const cleanTitle = brandMatch ? (product.title || "").slice(0, brandMatch.index) : (product.title || "")

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

    const [adding, setAdding] = useState<Record<string, boolean>>({})
    const [showOverlay, setShowOverlay] = useState(false)
    const [qtyCounts, setQtyCounts] = useState<Record<string, number>>({})

    const cardRef = useRef<HTMLDivElement>(null)
    const handleClose = useCallback(() => setShowOverlay(false), [])

    const handleQuantityChange = async (variantId: string, delta: number) => {
        const current = qtyCounts[variantId] || 0
        const next = Math.max(0, current + delta)
        setQtyCounts(prev => ({ ...prev, [variantId]: next }))
        setAdding(prev => ({ ...prev, [variantId]: true }))
        try {
            await addToCart({ variantId, quantity: delta > 0 ? 1 : -1, countryCode })
            window.dispatchEvent(new Event("cart-updated"))
        } catch (err) {
            setQtyCounts(prev => ({ ...prev, [variantId]: current }))
        } finally {
            setAdding(prev => ({ ...prev, [variantId]: false }))
        }
    }

    const handleAdd = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!firstVariant?.id) return
        setAdding(prev => ({ ...prev, [firstVariant.id]: true }))
        try {
            await addToCart({ variantId: firstVariant.id, quantity: 1, countryCode })
            window.dispatchEvent(new Event("cart-updated"))
        } catch {}
        setAdding(prev => ({ ...prev, [firstVariant.id]: false }))
    }

    return (
        <>
            <div ref={cardRef} className="product-card h-full flex flex-col group relative">

                {/* MOBILE LAYOUT */}
                <div className="flex sm:hidden items-center gap-3 p-3 w-full" data-testid="product-card">
                    <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-grey-10 border border-grey-10 relative">
                        <Thumbnail thumbnail={product.thumbnail} images={product.images} size="square" />
                        <WishlistButton productId={product.id} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="hidden" data-testid="product-full-title">{product.title}</span>
                        {brand && (
                            <span className="text-[10px] text-brand-saffron font-bold uppercase tracking-wider block mb-0.5 truncate">{brand}</span>
                        )}
                        <h3 data-testid="product-title" className="text-sm font-semibold text-grey-90 leading-tight line-clamp-2 text-center">{cleanTitle}</h3>
                        <div className="flex items-center justify-between mt-1.5">
                            <div>
                                <span className="text-sm font-bold text-grey-90">{formatPrice(firstVariant?.price || 0)}</span>
                                {weightText && <span className="text-[11px] text-grey-50 ml-2">{weightText}</span>}
                                {hasVariants && <span className="text-[11px] text-grey-50 ml-2">{variantTitles.length} sizes</span>}
                            </div>
                            {hasVariants ? (
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowOverlay(true) }}
                                    className="text-xs font-semibold text-brand-orange border border-brand-orange rounded-lg px-3 py-1.5 hover:bg-brand-orange hover:text-white active:scale-95 transition-all flex-shrink-0"
                                >
                                    Options
                                </button>
                            ) : (
                                <button
                                    onClick={handleAdd}
                                    disabled={!firstVariant || adding[firstVariant.id]}
                                    className="text-xs font-semibold text-white bg-brand-orange rounded-lg px-3 py-1.5 hover:bg-brand-orange-dark active:scale-95 disabled:opacity-50 transition-all flex-shrink-0"
                                >
                                    {adding[firstVariant?.id || ''] ? "..." : "Add"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* DESKTOP LAYOUT */}
                <div className="hidden sm:flex flex-col flex-1 p-4">
                    <span className="hidden" data-testid="product-title">{product.title}</span>
                    <LocalizedClientLink href={`/products/${product.handle}`} className="block group">
                        <div className="w-full aspect-square rounded-xl overflow-hidden bg-grey-5 border border-grey-10/60 relative mb-3">
                            <Thumbnail thumbnail={product.thumbnail} images={product.images} size="square" />
                            <WishlistButton productId={product.id} />
                            {brand && (
                                <span className="absolute top-2.5 left-2.5 bg-brand-saffron/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                                    {brand}
                                </span>
                            )}
                        </div>
                        <h3 data-testid="product-title" className="text-sm font-semibold text-grey-90 group-hover:text-brand-orange transition-colors line-clamp-2 h-10 leading-snug text-center">
                            {cleanTitle}
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
                                        <div className="flex items-center border border-grey-30 rounded-lg bg-white overflow-hidden shadow-sm h-8 flex-shrink-0">
                                            <button
                                                onClick={() => handleQuantityChange(v.id, -1)}
                                                disabled={itemQty === 0 || adding[v.id]}
                                                className="w-8 h-full flex items-center justify-center text-sm font-bold text-grey-50 hover:bg-grey-10 disabled:opacity-20 active:bg-grey-20 transition-colors press-scale"
                                            >
                                                –
                                            </button>
                                            <span className="w-7 text-center text-xs font-bold text-grey-90 select-none tabular-nums">
                                                {adding[v.id] ? "..." : itemQty}
                                            </span>
                                            <button
                                                onClick={() => handleQuantityChange(v.id, 1)}
                                                disabled={adding[v.id]}
                                                className="w-8 h-full flex items-center justify-center text-sm font-bold text-brand-orange hover:bg-brand-orange/10 active:bg-brand-orange/20 transition-colors press-scale"
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
