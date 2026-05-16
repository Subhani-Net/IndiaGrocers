import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import WishlistButton from "@modules/wishlist/components/wishlist-button"

function extractBrand(title: string): { brand: string | null; cleanTitle: string } {
  const separators = [" - ", " – ", " — "]
  for (const sep of separators) {
    const idx = title.lastIndexOf(sep)
    if (idx > 0) {
      return {
        brand: title.slice(idx + sep.length).trim(),
        cleanTitle: title.slice(0, idx).trim(),
      }
    }
  }
  return { brand: null, cleanTitle: title }
}

function formatPrice(amount: number, currency: string = "gbp"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100)
}

function getStockInfo(product: HttpTypes.StoreProduct): { type: "out" | "low" | "in"; quantity?: number } {
  const variants = product.variants || []
  if (variants.length === 0) return { type: "in" }

  const allOut = variants.every(
    (v) => v.manage_inventory && (v.inventory_quantity || 0) === 0
  )
  if (allOut) return { type: "out" }

  const lowStock = variants.find(
    (v) => v.manage_inventory && (v.inventory_quantity || 0) <= 5
  )
  if (lowStock) return { type: "low", quantity: lowStock.inventory_quantity || 0 }

  return { type: "in" }
}

function getCategoryBadges(product: HttpTypes.StoreProduct, cleanTitle: string): { fresh: boolean; frozen: boolean } {
  const titleLower = cleanTitle.toLowerCase()
  const cats = (product.categories || []).map((c: any) => (c.name || c.handle || "").toLowerCase())
  const tags = (product.tags || []).map((t: any) => (t.value || "").toLowerCase())

  const fresh =
    titleLower.includes("fresh") ||
    cats.some((c: string) => c.includes("fresh") || c.includes("vegetables")) ||
    tags.some((t: string) => t.includes("fresh"))

  const frozen =
    titleLower.includes("frozen") ||
    cats.some((c: string) => c.includes("frozen")) ||
    tags.some((t: string) => t.includes("frozen"))

  return { fresh, frozen }
}

export default async function ProductPreview({
  product,
  region,
  isFeatured,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  isFeatured?: boolean
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const { brand, cleanTitle } = extractBrand(product.title)
  const firstOption = product.options?.[0]
  const optionValues = firstOption
    ? [...new Set(product.variants?.map((v: any) => v.options?.[firstOption.title]))]
    : []
  const minPrice = cheapestPrice?.calculated_price_number
  const stockInfo = getStockInfo(product)
  const { fresh, frozen } = getCategoryBadges(product, cleanTitle)

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block"
    >
      <div className="product-card" data-testid="product-wrapper">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-grey-10">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="square"
          />
          {brand && (
            <span className="absolute top-2 left-2 bg-brand-orange text-white text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide">
              {brand}
            </span>
          )}
          {fresh && (
            <span className="absolute top-8 left-2 bg-green-100 text-green-800 text-[10px] font-semibold px-2 py-0.5 rounded">
              🥬 Fresh
            </span>
          )}
          {frozen && !fresh && (
            <span className="absolute top-8 left-2 bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded">
              ❄️ Frozen
            </span>
          )}
          {stockInfo.type === "out" && (
            <span className="absolute bottom-2 left-2 bg-brand-red text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              Out of Stock
            </span>
          )}
          {stockInfo.type === "low" && (
            <span className="absolute bottom-2 left-2 bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded">
              Only {stockInfo.quantity} left
            </span>
          )}
          <WishlistButton productId={product.id} />
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-sm font-semibold text-grey-90 leading-tight line-clamp-2 group-hover:text-brand-orange transition-colors min-h-[2.5rem]">
            {cleanTitle}
          </h3>

          {/* Price */}
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-brand-red">
              {minPrice ? `From ${formatPrice(minPrice)}` : "—"}
            </span>
          </div>

          {/* Variant options */}
          {optionValues.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {optionValues.slice(0, 4).map((val: string) => (
                <span
                  key={val}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-grey-20 text-grey-60"
                >
                  {val}
                </span>
              ))}
              {optionValues.length > 4 && (
                <span className="text-[10px] text-grey-40">
                  +{optionValues.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Add button */}
          <div className="mt-3">
            <span className="block w-full text-center text-xs font-semibold text-brand-orange border border-brand-orange rounded-lg py-1.5 group-hover:bg-brand-orange group-hover:text-white transition-all duration-200">
              Add
            </span>
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
