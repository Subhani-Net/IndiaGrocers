"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { HttpTypes } from "@medusajs/types"
import { Spinner } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { getProductPrice } from "@lib/util/get-product-price"
import { useSearchParams } from "next/navigation"
import { fetchProductsPage } from "@lib/data/products"

const CATEGORY_CHIPS = [
  "Rice",
  "Spices",
  "Dals",
  "Snacks",
  "Pickles",
  "Flours",
  "Oils & Ghee",
  "Tea & Coffee",
  "Pooja Items",
]

const DIETARY_CHIPS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Halal",
  "Organic",
]

function extractBrand(
  title: string
): { brand: string | null; cleanTitle: string } {
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

function SearchProductCard({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const { brand, cleanTitle } = extractBrand(product.title)
  const firstOption = product.options?.[0]
  const optionValues = firstOption
    ? Array.from(
        new Set(
          product.variants?.map(
            (v: any) => v.options?.[firstOption.title]
          )
        )
      )
    : []
  const minPrice = cheapestPrice?.calculated_price_number

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block"
    >
      <div className="product-card" data-testid="product-wrapper">
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
        </div>
        <div className="p-3">
          <h3 className="text-sm font-semibold text-grey-90 leading-tight line-clamp-2 group-hover:text-brand-orange transition-colors min-h-[2.5rem]">
            {cleanTitle}
          </h3>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-brand-red">
              {minPrice ? `From ${formatPrice(minPrice)}` : "—"}
            </span>
          </div>
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

function BrandChips({
  products,
  activeBrand,
  setActiveBrand,
}: {
  products: HttpTypes.StoreProduct[]
  activeBrand: string | null
  setActiveBrand: (brand: string | null) => void
}) {
  const brandCounts = new Map<string, number>()
  products.forEach((p) => {
    const { brand } = extractBrand(p.title)
    if (brand) {
      brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1)
    }
  })
  const brands = Array.from(brandCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  if (brands.length === 0) return null

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-3">
      {brands.map(([brand, count]) => (
        <button
          key={brand}
          onClick={() =>
            setActiveBrand(activeBrand === brand ? null : brand)
          }
          className={`px-4 py-1.5 text-sm rounded-full border transition-all duration-200 ${
            activeBrand === brand
              ? "bg-brand-orange border-brand-orange text-white"
              : "border-grey-30 text-grey-60 hover:border-brand-orange hover:text-brand-orange"
          }`}
        >
          {brand} ({count})
        </button>
      ))}
    </div>
  )
}

export default function SearchTemplate() {
  const searchParams = useSearchParams()
  const qParam = searchParams.get("q")
  const brandParam = searchParams.get("brand")
  const maxPriceParam = searchParams.get("maxPrice")

  const [query, setQuery] = useState(qParam || brandParam || "")
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searched, setSearched] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [autocompleteResults, setAutocompleteResults] = useState<HttpTypes.StoreProduct[]>([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [activeDietary, setActiveDietary] = useState<string | null>(null)
  const [activeBrand, setActiveBrand] = useState<string | null>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const hasFilters = !!(brandParam || maxPriceParam)

  const filterProducts = useCallback((products: HttpTypes.StoreProduct[]): HttpTypes.StoreProduct[] => {
    let filtered = products
    if (brandParam) {
      const brandLower = brandParam.toLowerCase()
      filtered = filtered.filter((p) =>
        p.title.toLowerCase().includes(brandLower)
      )
    }
    if (maxPriceParam) {
      const maxVal = parseFloat(maxPriceParam) * 100
      filtered = filtered.filter((p) =>
        p.variants?.some(
          (v) =>
            v.calculated_price?.calculated_amount != null &&
            v.calculated_price.calculated_amount <= maxVal
        )
      )
    }
    if (activeDietary) {
      const dietaryKey = activeDietary.toLowerCase().replace("-", " ")
      filtered = filtered.filter((p) =>
        p.tags?.some(
          (t) => t.value?.toLowerCase() === dietaryKey
        )
      )
    }
    if (activeBrand) {
      filtered = filtered.filter((p) => {
        const { brand } = extractBrand(p.title)
        return brand?.toLowerCase() === activeBrand.toLowerCase()
      })
    }
    return filtered
  }, [brandParam, maxPriceParam, activeDietary, activeBrand])

  const performSearch = useCallback(async (searchQuery: string, pageNum: number = 1) => {
    if (!searchQuery.trim() && !hasFilters) {
      setProducts([])
      setSearched(false)
      setTotalCount(0)
      return
    }

    const isLoadingFirst = pageNum === 1
    if (isLoadingFirst) {
      setLoading(true)
      setSearched(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const result = await fetchProductsPage({
        page: pageNum,
        countryCode: "gb",
        searchQuery: searchQuery.trim() || undefined,
      })

      if (isLoadingFirst) {
        setProducts(result.products)
        setTotalCount(result.count)
      } else {
        setProducts((prev) => [...prev, ...result.products])
      }
      setPage(pageNum)
    } catch {
      // silent
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [hasFilters])

  useEffect(() => {
    const timer = setTimeout(() => performSearch(query), 300)
    return () => clearTimeout(timer)
  }, [query, performSearch])

  useEffect(() => {
    if (!query.trim() || hasFilters) {
      setAutocompleteResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const result = await fetchProductsPage({
          page: 1,
          countryCode: "gb",
          searchQuery: query,
        })
        setAutocompleteResults(result.products.slice(0, 5))
      } catch {
        setAutocompleteResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, hasFilters])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        inputContainerRef.current &&
        !inputContainerRef.current.contains(target)
      ) {
        setShowAutocomplete(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleChipClick = (chip: string) => {
    setQuery(chip)
    performSearch(chip)
  }

  return (
    <div className="content-container py-12">
      {brandParam && (
        <nav className="flex items-center gap-2 text-sm text-grey-50 mb-6">
          <LocalizedClientLink href="/" className="hover:text-brand-orange transition-colors">
            Home
          </LocalizedClientLink>
          <span className="text-grey-30">/</span>
          <LocalizedClientLink href="/brands" className="hover:text-brand-orange transition-colors">
            Brands
          </LocalizedClientLink>
          <span className="text-grey-30">/</span>
          <span className="text-brand-orange font-semibold">{brandParam}</span>
        </nav>
      )}

      {brandParam && (
        <div className="bg-brand-orange rounded-xl p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold">{brandParam}</h2>
          <p className="text-white/80 mt-1">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">
          Search Products
        </h1>
        <p className="text-center text-ui-fg-subtle mb-8">
          Find your favourite Indian groceries
        </p>

        <div className="relative" ref={inputContainerRef}>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowAutocomplete(true)
            }}
            onFocus={() => {
              if (query.trim() && !hasFilters) setShowAutocomplete(true)
            }}
            placeholder="Search for rice, spices, dals, snacks..."
            className="w-full h-14 px-6 text-lg border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Spinner className="animate-spin text-brand-orange" />
            </div>
          )}

          {showAutocomplete && autocompleteResults.length > 0 && query.trim() && !loading && !hasFilters && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-grey-20 z-50 overflow-hidden"
            >
              {autocompleteResults.map((product) => {
                const { brand } = extractBrand(product.title)
                return (
                  <LocalizedClientLink
                    key={product.id}
                    href={`/products/${product.handle}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-grey-5 transition-colors border-b border-grey-10 last:border-b-0"
                    onClick={() => setShowAutocomplete(false)}
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-grey-10 flex-shrink-0">
                      {product.thumbnail && (
                        <img
                          src={product.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-grey-90 truncate">
                        {product.title}
                      </p>
                    </div>
                    {brand && (
                      <span className="text-[10px] font-semibold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded flex-shrink-0">
                        {brand}
                      </span>
                    )}
                  </LocalizedClientLink>
                )
              })}
              <LocalizedClientLink
                href={`/search?q=${encodeURIComponent(query)}`}
                className="block px-4 py-3 text-sm text-brand-orange font-semibold hover:bg-grey-5 transition-colors text-center border-t border-grey-10"
                onClick={() => setShowAutocomplete(false)}
              >
                View all results for &ldquo;{query}&rdquo;
              </LocalizedClientLink>
            </div>
          )}
        </div>

        {!brandParam && (
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {CATEGORY_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className="px-4 py-1.5 text-sm rounded-full border border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white transition-all duration-200"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {!brandParam && (
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {DIETARY_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() =>
                  setActiveDietary(
                    activeDietary === chip ? null : chip
                  )
                }
                className={`px-4 py-1.5 text-sm rounded-full border transition-all duration-200 ${
                  activeDietary === chip
                    ? "bg-brand-green border-brand-green text-white"
                    : "border-grey-30 text-grey-60 hover:border-brand-green hover:text-brand-green"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {!brandParam && products.length > 0 && (
          <BrandChips
            products={products}
            activeBrand={activeBrand}
            setActiveBrand={setActiveBrand}
          />
        )}
      </div>

      <div className="mt-12">
        {loading && (
          <div className="flex justify-center py-20">
            <Spinner className="animate-spin text-brand-orange w-8 h-8" />
          </div>
        )}

        {!loading && searched && products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl font-semibold text-gray-700">
              No results found
            </p>
            <p className="text-ui-fg-subtle mt-2">
              Try searching for a different product or browse our categories
              above.
            </p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <>
            <p className="text-ui-fg-subtle mb-4">
              {totalCount} result{totalCount !== 1 ? "s" : ""}
              {query
                ? ` for "${query}"`
                : brandParam
                  ? ""
                  : maxPriceParam
                    ? ` under £${maxPriceParam}`
                    : ""}
            </p>
            <div className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4">
              {products.map((product) => (
                <SearchProductCard key={product.id} product={product} />
              ))}
            </div>
            {products.length < totalCount && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => performSearch(query, page + 1)}
                  disabled={loadingMore}
                  className="px-10 py-3 bg-brand-orange text-white font-semibold rounded-lg hover:bg-brand-orange-dark transition-colors disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load More Products"}
                </button>
              </div>
            )}
          </>
        )}

        {!searched && !loading && (
          <div className="text-center py-20">
            <p className="text-lg text-ui-fg-subtle">
              Start typing or select a category to find products
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
