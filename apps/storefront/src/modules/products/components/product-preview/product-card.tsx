"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"

function formatPrice(amount: number, currency: string = "gbp"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100)
}

export default function ProductCard({
  product,
  region,
  isFeatured,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  isFeatured?: boolean
}) {
  const brandMatch = product.title.match(/\s+-\s+(.+)$/)
  const brand = brandMatch ? brandMatch[1] : null
  const cleanTitle = brandMatch ? product.title.slice(0, brandMatch.index) : product.title

  const firstVariant = product.variants?.[0]
  const price = firstVariant?.calculated_price?.calculated_amount || 0
  const optionValues = product.options?.[0]?.title
    ? Array.from(new Set(product.variants?.map((v: any) => v.options?.[product.options![0].title!]) || []))
    : []
  const hasVariants = optionValues.length > 1
  const [expanded, setExpanded] = useState(false)
  const hasDescription = !!product.description

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="block group">
      {/* Mobile: horizontal card */}
      <div className="flex sm:hidden items-center gap-3 bg-white rounded-xl border border-grey-20 hover:shadow-md transition-shadow p-2.5">
        <div className="w-[30%] flex-shrink-0 aspect-square rounded-lg overflow-hidden bg-grey-10">
          <Thumbnail thumbnail={product.thumbnail} images={product.images} size="square" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-grey-90 leading-snug line-clamp-2 group-hover:text-brand-orange transition-colors">
            {cleanTitle}
          </h3>
          {brand && <span className="text-[10px] text-brand-orange font-medium uppercase mt-0.5 block">{brand}</span>}
          <p className="text-xs text-grey-50 mt-0.5">{firstVariant?.title || ""}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-base font-bold text-grey-90">{formatPrice(price)}</span>
            <span className="text-xs font-semibold text-brand-orange border border-brand-orange rounded-lg px-3 py-1 group-hover:bg-brand-orange group-hover:text-white transition-all">Add</span>
          </div>
          {hasVariants && <p className="text-[10px] text-grey-40 mt-0.5">{optionValues.length} sizes</p>}

          {hasDescription && (
            <div className="mt-0.5" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(!expanded) }}
                className="text-[10px] text-brand-orange hover:underline text-left"
              >
                {expanded ? "▲ Hide" : "▼ Details"}
              </button>
              {expanded && (
                <p className="mt-0.5 text-[10px] text-grey-50 leading-relaxed line-clamp-3">
                  {product.description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: vertical card */}
      <div className="hidden sm:block bg-white rounded-xl border border-grey-20 hover:shadow-lg transition-shadow overflow-hidden">
        <div className="relative aspect-square overflow-hidden bg-grey-10">
          <Thumbnail thumbnail={product.thumbnail} images={product.images} size="square" />
          {brand && (
            <span className="absolute top-2 left-2 bg-brand-orange text-white text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide">
              {brand}
            </span>
          )}
        </div>
        <div className="p-3">
          <h3 className="text-sm font-semibold text-grey-90 leading-snug line-clamp-2 group-hover:text-brand-orange transition-colors min-h-[2.5rem]">
            {cleanTitle}
          </h3>
          <p className="text-xs text-grey-50 mt-0.5">{firstVariant?.title || ""}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-base font-bold text-grey-90">{formatPrice(price)}</span>
            <span className="text-xs font-semibold text-brand-orange border border-brand-orange rounded-lg px-3 py-1 group-hover:bg-brand-orange group-hover:text-white transition-all">
              Add
            </span>
          </div>
          {hasVariants && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {optionValues.slice(0, 4).map((val: string) => (
                <span key={val} className="text-[10px] px-1.5 py-0.5 rounded border border-grey-20 text-grey-50">{val}</span>
              ))}
              {optionValues.length > 4 && (
                <span className="text-[10px] text-grey-40">+{optionValues.length - 4}</span>
              )}
            </div>
          )}

          {hasDescription && (
            <div className="mt-1.5" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(!expanded) }}
                className="text-[10px] text-brand-orange hover:underline text-left"
              >
                {expanded ? "▲ Hide details" : "▼ More details"}
              </button>
              {expanded && (
                <p className="mt-1 text-[10px] text-grey-50 leading-relaxed line-clamp-3">
                  {product.description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </LocalizedClientLink>
  )
}
