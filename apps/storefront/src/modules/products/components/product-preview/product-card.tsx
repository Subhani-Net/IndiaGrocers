"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import { addToCart, deleteLineItem } from "@lib/data/cart"
import WishlistButton from "@modules/wishlist/components/wishlist-button"

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(amount / 100)
}

interface ProductCardProps {
  product: HttpTypes.StoreProduct
  region?: HttpTypes.StoreRegion
  countryCode?: string
  isFeatured?: boolean
  onProductClick?: () => void
}

export default function ProductCard({
  product,
  region,
  countryCode,
  onProductClick,
}: ProductCardProps) {
  const displayTitle = product.title || ""

  const variants = (product.variants || []).map((v: any) => ({
    id: v.id,
    title: v.title || "",
    price: v.calculated_price?.calculated_amount || 0,
  }))

  const firstVariant = variants[0]
  const weightText =
    firstVariant?.title && firstVariant.title !== "Default"
      ? firstVariant.title
      : ""
  const cc = countryCode || (region as any)?.countries?.[0]?.iso_2 || "gb"

  const [adding, setAdding] = useState(false)

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!firstVariant?.id || adding) return
    setAdding(true)
    try {
      await addToCart({ variantId: firstVariant.id, quantity: 1, countryCode: cc })
      window.dispatchEvent(new Event("cart-updated"))
    } catch {
      // silent
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="product-card h-full flex flex-col group relative">
      {/* MOBILE LAYOUT */}
      <div
        className="flex sm:hidden items-center gap-3 p-3 w-full"
        data-testid="product-card"
      >
        {onProductClick ? (
          <div role="button" tabIndex={0}
            onClick={onProductClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onProductClick() } }}
            className="flex items-center gap-3 flex-1 min-w-0 group text-left cursor-pointer"
          >
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
              </div>
            </div>
          </div>
        ) : (
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
              </div>
            </div>
          </LocalizedClientLink>
        )}
        <div className="flex-shrink-0">
          <button
            onClick={handleAdd}
            disabled={adding}
            className="text-xs font-semibold text-white bg-brand-orange rounded-lg px-3 py-1.5 hover:bg-brand-orange-dark active:scale-95 transition-all disabled:opacity-50"
            data-testid="add-to-cart-btn"
          >
            {adding ? "..." : "Add"}
          </button>
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden sm:flex flex-col flex-1 p-4">
        <span className="hidden" data-testid="product-full-title">
          {product.title}
        </span>
        {onProductClick ? (
          <div role="button" tabIndex={0} onClick={onProductClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onProductClick() } }}
            className="block group text-left w-full cursor-pointer">
            <div className="w-full aspect-square rounded-xl overflow-hidden bg-grey-5 border border-grey-10/60 relative mb-3">
              <Thumbnail
                thumbnail={product.thumbnail}
                images={product.images}
                size="square"
              />
              <WishlistButton productId={product.id} />
            </div>
            <h3
              data-testid="product-title"
              className="text-sm font-semibold text-grey-90 group-hover:text-brand-orange transition-colors line-clamp-2 h-10 leading-snug text-center"
            >
              {displayTitle}
            </h3>
          </div>
        ) : (
          <LocalizedClientLink
            href={`/products/${product.handle}`}
            className="block group"
          >
            <div className="w-full aspect-square rounded-xl overflow-hidden bg-grey-5 border border-grey-10/60 relative mb-3">
              <Thumbnail
                thumbnail={product.thumbnail}
                images={product.images}
                size="square"
              />
              <WishlistButton productId={product.id} />
            </div>
            <h3
              data-testid="product-title"
              className="text-sm font-semibold text-grey-90 group-hover:text-brand-orange transition-colors line-clamp-2 h-10 leading-snug text-center"
            >
              {displayTitle}
            </h3>
          </LocalizedClientLink>
        )}

        <div className="mt-auto pt-3 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-bold text-grey-90">
              {formatPrice(firstVariant?.price || 0)}
            </span>
            {weightText && (
              <span className="text-[11px] text-grey-50">{weightText}</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="w-full text-sm font-semibold text-white bg-brand-orange rounded-xl py-2.5 hover:bg-brand-orange-dark active:scale-[0.97] transition-all duration-200 disabled:opacity-50 press-scale"
            data-testid="add-to-cart-btn"
          >
            {adding ? "Adding..." : "Add to Basket"}
          </button>
        </div>
      </div>
    </div>
  )
}
