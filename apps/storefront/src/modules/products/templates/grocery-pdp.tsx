"use client"

import { Suspense, useState, useMemo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { addToCart } from "@lib/data/cart"
import { formatGBP, formatUnitPrice, getWeightLabel } from "@lib/util/format-price"
import ImageGallery from "@modules/products/components/image-gallery"
import VariantChips from "@modules/products/components/variant-chips"
import AllergenSection from "@modules/products/components/allergen-section"
import ProductDetailsSection from "@modules/products/components/product-details-section"
import BrandSwitcher from "@modules/products/components/brand-switcher"
import FrequentlyBoughtTogether from "@modules/products/components/frequently-bought-together"
import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import Breadcrumb, { BreadcrumbItem } from "@modules/common/components/breadcrumb"
import { usePantry } from "@lib/context/pantry-context"
import type { Allergen } from "../../../types/product"

type GroceryPdpTemplateProps = {
  product: any
  region: any
  countryCode: string
  images: any[]
  breadcrumbs: BreadcrumbItem[]
  inventoryMap?: Record<string, { availability: number | null }>
}

export default function GroceryProductTemplate({
  product,
  region,
  countryCode,
  images,
  breadcrumbs,
  inventoryMap,
}: GroceryPdpTemplateProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialVariantId = searchParams.get("v_id") || undefined

  const meta = product.metadata || {}
  const variants = product.variants || []

  // Determine the default variant
  const defaultVariantId = useMemo(() => {
    if (initialVariantId && variants.some((v: any) => v.id === initialVariantId)) {
      return initialVariantId
    }
    // Best value variant, or first
    const best = variants.find((v: any) => v.metadata?.is_best_value)
    return best?.id || variants[0]?.id
  }, [variants, initialVariantId])

  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariantId)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  const selectedVariant = useMemo(
    () => variants.find((v: any) => v.id === selectedVariantId) || variants[0],
    [variants, selectedVariantId]
  )

  const vMeta = selectedVariant?.metadata || {}
  const price = selectedVariant?.calculated_price?.calculated_amount ?? 0
  const weightLabel = vMeta.weight_value
    ? getWeightLabel({
        id: selectedVariant?.id || "",
        title: selectedVariant?.title || "",
        metadata: vMeta,
      } as any)
    : selectedVariant?.title || ""
  const availability = inventoryMap?.[selectedVariant?.id]?.availability
  const inStock =
    !selectedVariant?.manage_inventory ||
    selectedVariant?.allow_backorder ||
    availability == null ||
    availability > 0

  // Extract brand
  const brand =
    (meta.brand_slug as string)
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase()) || null

  const handleVariantSelect = useCallback(
    (vId: string) => {
      setSelectedVariantId(vId)
      const params = new URLSearchParams(searchParams)
      params.set("v_id", vId)
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [searchParams, router]
  )

  const handleAddToCart = useCallback(async () => {
    if (!selectedVariantId || !inStock) return
    setAdding(true)
    try {
      await addToCart({
        variantId: selectedVariantId,
        quantity,
        countryCode,
      })
      window.dispatchEvent(new Event("cart-updated"))
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch {}
    setAdding(false)
  }, [selectedVariantId, quantity, countryCode, inStock])

  // Pantry
  const { isInPantry, addItem, removeItem } = usePantry()
  const inPantry = isInPantry(product.id)

  return (
    <div className="bg-stone-50 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <div className="py-3">
          <Breadcrumb items={breadcrumbs} />
        </div>

        {/* Main PDP Layout */}
        <div className="flex flex-col lg:flex-row gap-6 pb-8">
          {/* Left: Image Gallery */}
          <div className="lg:w-[480px] xl:w-[560px] flex-shrink-0">
            <div className="sticky top-24">
              <ImageGallery images={images.length > 0 ? images : product.images || product.thumbnail ? [{ url: product.thumbnail }] : []} />
            </div>
          </div>

          {/* Right: Product Info + Actions */}
          <div className="flex-1 min-w-0 lg:max-w-[480px]">
            {/* Collection link */}
            {product.collection && (
              <span className="text-[10px] text-brand-orange font-semibold uppercase tracking-widest mb-1 block">
                {product.collection.title}
              </span>
            )}

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 leading-tight mb-2">
              {product.title}
            </h1>

            {/* Brand badge */}
            {brand && (
              <span className="inline-block bg-stone-800/10 text-stone-600 text-[11px] font-semibold px-2.5 py-0.5 rounded uppercase tracking-wide mb-4">
                {brand}
              </span>
            )}

            {/* Description */}
            {product.description && (
              <p className="text-sm text-stone-500 mb-4 leading-relaxed line-clamp-3">
                {product.description}
              </p>
            )}

            {/* Weight Variant Chips */}
            <VariantChips
              product={product}
              selectedVariantId={selectedVariantId}
              onSelect={handleVariantSelect}
              inventoryMap={inventoryMap}
            />

            {/* Price Display */}
            <div className="mt-5 p-4 bg-white rounded-xl border border-stone-200">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-stone-900">
                  {formatGBP(price)}
                </span>
                {weightLabel && (
                  <span className="text-sm text-stone-500">/ {weightLabel}</span>
                )}
              </div>
              {vMeta.price_per_unit > 0 && (
                <p className="text-xs text-stone-400 mt-1">
                  {formatUnitPrice({
                    id: selectedVariant?.id || "",
                    title: selectedVariant?.title || "",
                    metadata: vMeta,
                  } as any)}
                </p>
              )}
            </div>

            {/* Stock status */}
            <div className="mt-2">
              {inStock ? (
                <span className="text-xs font-medium text-green-600">
                  ✓ In Stock
                </span>
              ) : (
                <span className="text-xs font-medium text-red-500">
                  Out of Stock — Notify Me
                </span>
              )}
            </div>

            {/* Add to Pantry */}
            <div className="mt-3">
              <button
                onClick={() => {
                  if (inPantry) {
                    removeItem(product.id)
                  } else if (selectedVariant) {
                    addItem({
                      productId: product.id,
                      title: product.title,
                      handle: product.handle,
                      variantId: selectedVariantId,
                      weight: weightLabel,
                      price,
                      thumbnail: product.thumbnail,
                    })
                  }
                }}
                className={`w-full py-2 text-xs font-semibold rounded-lg border transition-all ${
                  inPantry
                    ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                    : "border-stone-200 text-stone-500 hover:border-brand-orange/50 hover:text-brand-orange"
                }`}
              >
                {inPantry ? "✓ In Your Pantry" : "+ Add to Pantry"}
              </button>
            </div>

            {/* Add to Basket */}
            <div className="mt-4 flex items-center gap-3">
              {/* Quantity */}
              <div className="flex items-center border border-stone-200 rounded-lg bg-white overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={adding || !inStock}
                  className="w-10 h-10 flex items-center justify-center text-stone-500 hover:bg-stone-50 disabled:opacity-30"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))
                  }
                  className="w-12 h-10 text-center text-sm font-bold text-stone-800 border-x border-stone-200 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1"
                  max="99"
                  disabled={adding || !inStock}
                />
                <button
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  disabled={adding || !inStock}
                  className="w-10 h-10 flex items-center justify-center text-stone-500 hover:bg-stone-50 disabled:opacity-30"
                >
                  +
                </button>
              </div>

              {/* Add button */}
              <button
                onClick={handleAddToCart}
                disabled={!inStock || adding}
                className={`flex-1 h-11 text-sm font-bold text-white rounded-lg transition-all ${
                  added
                    ? "bg-green-600"
                    : "bg-brand-orange hover:bg-brand-orange/90 active:scale-[0.98]"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {!inStock
                  ? "Out of Stock"
                  : adding
                  ? "Adding..."
                  : added
                  ? "Added! ✓"
                  : `Add to Basket — ${formatGBP(price)}`}
              </button>
            </div>
          </div>
        </div>

        {/* Below the fold */}
        <div className="max-w-[860px] space-y-6 pb-12">
          {/* Brand Switcher — if product belongs to a product group */}
          {(product as any).brandAlternatives?.length > 1 && (
            <BrandSwitcher
              brands={(product as any).brandAlternatives}
              currentBrandSlug={(product.metadata as any)?.brand_slug || ""}
              currentWeightLabel={weightLabel}
            />
          )}

          {/* Allergen Section — visible, never collapsed */}
          <AllergenSection
            allergens={(meta.allergens || []) as Allergen[]}
            ingredients={(meta.ingredients || product.description || "") as string}
            dietaryFlags={(meta.dietary_flags || []) as string[]}
            countryOfOrigin={(meta.country_of_origin || "") as string}
          />

          {/* Frequently Bought Together */}
          <Suspense>
            <FrequentlyBoughtTogether
              products={((product as any).fbtProducts || []).map((p: any) => ({
                id: p.id,
                title: p.title,
                handle: p.handle,
                thumbnail: p.thumbnail,
                price: p.variants?.[0]?.calculated_price?.calculated_amount || 0,
                variantId: p.variants?.[0]?.id || "",
              }))}
              countryCode={countryCode}
            />
          </Suspense>

          {/* Product Details */}
          <ProductDetailsSection
            product={product}
            selectedVariant={selectedVariant}
          />

          {/* Related Products */}
          <div className="pt-4">
            <Suspense fallback={<SkeletonRelatedProducts />}>
              <RelatedProducts product={product} countryCode={countryCode} region={region} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
