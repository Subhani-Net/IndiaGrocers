"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import { addToCart } from "@lib/data/cart"
import ProductOverlay from "./product-overlay"

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(amount / 100)
}

export default function ProductCard({
  product,
  region,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
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

  const cheapestPrice = variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : 0
  const firstVariant = variants[0]
  const variantTitles = variants.map(v => v.title).filter(t => t && t !== "Default")
  const hasVariants = variantTitles.length > 1
  const weightText = firstVariant?.title && firstVariant.title !== "Default" ? firstVariant.title : ""
  const countryCode = (region as any)?.countries?.[0]?.iso_2 || "gb"
  const [adding, setAdding] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [variantBadges, setVariantBadges] = useState<Record<string, number>>({})

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!firstVariant?.id) return
    setAdding(true)
    try { await addToCart({ variantId: firstVariant.id, quantity: 1, countryCode }); window.dispatchEvent(new Event("cart-updated")) } catch {}
    setAdding(false)
  }

  return (
    <>
      <LocalizedClientLink href={`/products/${product.handle}`} className="block group h-full">
      {/* Mobile: horizontal card */}
      <div className="flex sm:hidden items-center gap-3 bg-white rounded-xl border border-grey-20 p-2.5">
        <div className="w-[30%] flex-shrink-0 aspect-square rounded-lg overflow-hidden bg-grey-10">
          <Thumbnail thumbnail={product.thumbnail} images={product.images} size="square" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-grey-90 leading-snug line-clamp-2">{cleanTitle}</h3>
          {brand && <span className="text-[10px] text-brand-orange font-medium uppercase block mt-0.5">{brand}</span>}
          {!hasVariants && <p className="text-xs text-grey-50 mt-0.5">{weightText}</p>}
          {hasVariants && (
            <div className="flex flex-wrap gap-1 mt-1 items-end">
              {variants.filter(v => v.title !== "Default").map((v: any) => (
                <div key={v.id} className="flex flex-col items-center px-1.5 py-1 rounded border border-grey-20 min-w-[48px]">
                  <span className="text-[10px] font-bold text-grey-80">{v.title}</span>
                  <span className="text-[10px] font-bold text-grey-60">{formatPrice(v.price)}</span>
                </div>
              ))}
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowOverlay(true) }} className="ml-auto text-xs font-semibold text-brand-orange border border-brand-orange rounded-lg px-3 py-1">
                Options
              </button>
            </div>
          )}
          {!hasVariants && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-base font-bold text-grey-90">{formatPrice(cheapestPrice)}</span>
              <button onClick={handleAdd} disabled={adding} className="text-xs font-semibold text-brand-orange border border-brand-orange rounded-lg px-3 py-1 hover:bg-brand-orange hover:text-white disabled:opacity-50 transition-all">
                {adding ? "..." : "Add"}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Desktop: vertical card */}
      <div className="hidden sm:block bg-white rounded-xl border border-grey-20 hover:shadow-lg transition-shadow">
        <div className="relative aspect-square overflow-hidden bg-grey-10">
          <Thumbnail thumbnail={product.thumbnail} images={product.images} size="square" />
          {brand && <span className="absolute top-2 left-2 bg-brand-orange text-white text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide">{brand}</span>}
        </div>
        <div className="p-3">
          <h3 className="text-sm font-semibold text-grey-90 leading-snug line-clamp-2 min-h-[2.5rem]">{cleanTitle}</h3>
          {hasVariants && <p className="text-xs font-medium text-grey-70 mt-0.5">{variantTitles.length} sizes available</p>}
          {!hasVariants && <p className="text-xs text-grey-50 mt-0.5">{weightText}</p>}
          {hasVariants ? (
            <VariantOptionsRow variants={variants.filter(v => v.title !== "Default")} onOptionsClick={() => setShowOverlay(true)} formatPrice={formatPrice} badges={variantBadges} />
          ) : (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-base font-bold text-grey-90">{formatPrice(cheapestPrice)}</span>
              <button onClick={handleAdd} disabled={adding} className="text-xs font-semibold text-brand-orange border border-brand-orange rounded-lg px-3 py-1 hover:bg-brand-orange hover:text-white disabled:opacity-50 transition-all">{adding ? "..." : "Add"}</button>
            </div>
          )}
        </div>
      </div>
    </LocalizedClientLink>
    <ProductOverlay product={product} region={region} open={showOverlay} onClose={() => setShowOverlay(false)} onAdded={(qty: Record<string, number>) => setVariantBadges((prev) => ({ ...prev, ...qty }))} />
  </>
  )
}

function VariantOptionsRow({ variants, onOptionsClick, formatPrice, badges }: any) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5 items-end">
      {variants.map((v: any) => {
        const count = badges?.[v.id] || 0
        return (
          <div key={v.id} className="relative flex flex-col items-center px-2 py-1.5 rounded-lg border border-grey-20 min-w-[56px]">
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-orange text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
            <span className="text-xs font-semibold text-grey-80">{v.title}</span>
            <span className="text-[10px] font-bold text-grey-60 mt-0.5">{formatPrice(v.price)}</span>
          </div>
        )
      })}
      <button
        onClick={(e: any) => { e.preventDefault(); e.stopPropagation(); onOptionsClick() }}
        className="text-xs font-semibold text-brand-orange border border-brand-orange rounded-lg px-3 py-1.5 hover:bg-brand-orange hover:text-white transition-all ml-auto"
      >
        Options
      </button>
    </div>
  )
}
