"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { HttpTypes } from "@medusajs/types"
import { Spinner } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import ProductCard from "@modules/products/components/product-preview/product-card"
import { useSearchParams } from "next/navigation"
import { searchProducts, autocompleteProducts } from "@lib/search-client"
import { fetchProductsByIds } from "@lib/data/products"

// Inline synonym detection (avoids cross-package import from meilisearch workspace)
const SYNONYM_MAP = {
  besan: "gram flour", "gram flour": "besan", "chickpea flour": "besan", "chana flour": "besan",
  hing: "asafoetida", asafoetida: "hing", heeng: "hing",
  sooji: "semolina", semolina: "sooji", rava: "sooji", suji: "sooji",
  jeera: "cumin seeds", "cumin seeds": "jeera", zeera: "jeera", cumin: "jeera",
  haldi: "turmeric", turmeric: "haldi",
  dhania: "coriander", coriander: "dhania",
  methi: "fenugreek", fenugreek: "methi",
  saunf: "fennel seeds", "fennel seeds": "saunf", fennel: "saunf",
  imli: "tamarind", tamarind: "imli",
  ghee: "clarified butter", paneer: "indian cheese",
  chana: "chickpeas", moong: "mung", masoor: "red lentils",
  urad: "black gram", toor: "pigeon pea",
}
function getResolvedTerm(q: string) { return (SYNONYM_MAP as any)[q.toLowerCase()] || null }

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
          className={`px-5 py-2 text-sm font-medium rounded-full border transition-all duration-200 press-scale ${
            activeBrand === brand
              ? "bg-brand-orange border-brand-orange text-white shadow-md"
              : "border-grey-30/80 text-grey-60 bg-white hover:border-brand-orange hover:text-brand-orange hover:shadow-sm"
          }`}
        >
          {brand} ({count})
        </button>
      ))}
    </div>
  )
}

export default function SearchTemplate({
  categoryChips,
  countryCode,
}: {
  categoryChips?: Array<{ name: string; handle: string }>
  countryCode: string
}) {
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

  const [appliedSynonym, setAppliedSynonym] = useState<string | null>(null)

  const performSearch = useCallback(async (searchQuery: string, pageNum: number = 1) => {
    if (!searchQuery.trim() && !hasFilters) {
      setProducts([]); setSearched(false); setTotalCount(0); setAppliedSynonym(null); return
    }
    setLoading(true); setSearched(true)
    try {
        const { products: hits, totalCount: count } = await searchProducts((searchQuery || "").trim(), { limit: 12, offset: (pageNum - 1) * 12 })
        const hitIds = hits.map((h: any) => h.id)
        const fullProducts = await fetchProductsByIds({ ids: hitIds, countryCode })
        setProducts(fullProducts as any[])
      setTotalCount(count)
      setPage(pageNum)
      const resolved = getResolvedTerm((searchQuery || "").trim())
      setAppliedSynonym(resolved)
    } catch { setProducts([]); setTotalCount(0) }
    setLoading(false)
  }, [hasFilters, countryCode])

  useEffect(() => {
    const timer = setTimeout(() => performSearch(query), 300)
    return () => clearTimeout(timer)
  }, [query, performSearch])

  useEffect(() => {
    if (!query.trim() || hasFilters) { setAutocompleteResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const hits = await autocompleteProducts(query)
        setAutocompleteResults(hits.map(h => ({ id: h.id, title: h.title, handle: h.handle, thumbnail: h.thumbnail, calculated_price: { calculated_amount: h.price_gbp } } as any)))
      } catch { setAutocompleteResults([]) }
    }, 200)
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
          <svg className="w-3 h-3 text-grey-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <LocalizedClientLink href="/brands" className="hover:text-brand-orange transition-colors">
            Brands
          </LocalizedClientLink>
          <svg className="w-3 h-3 text-grey-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-brand-orange font-semibold">{brandParam}</span>
        </nav>
      )}

      {brandParam && (
        <div className="bg-gradient-to-br from-brand-orange via-brand-orange-light to-brand-orange rounded-2xl p-8 mb-8 text-white shadow-xl">
          <h2 className="text-3xl font-bold tracking-tight">{brandParam}</h2>
          <p className="text-white/80 mt-1.5 text-sm">
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
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-grey-40">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
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
            className="w-full h-14 pl-12 pr-6 text-lg bg-grey-5 border-2 border-grey-20/80 rounded-2xl text-grey-90 placeholder-grey-40 outline-none transition-all duration-200 focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 focus:bg-white"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Spinner className="animate-spin text-brand-orange" />
            </div>
          )}

          {showAutocomplete && autocompleteResults.length > 0 && query.trim() && !loading && !hasFilters && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-grey-20/80 z-50 overflow-hidden"
            >
              {autocompleteResults.map((product) => {
                const { brand } = extractBrand(product.title)
                return (
                  <LocalizedClientLink
                    key={product.id}
                    href={`/products/${product.handle}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-brand-orange/5 transition-colors border-b border-grey-20/40 last:border-b-0"
                    onClick={() => setShowAutocomplete(false)}
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-grey-10 flex-shrink-0 border border-grey-10/60">
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
                      <span className="text-[10px] font-semibold text-brand-saffron bg-brand-saffron/10 px-2 py-0.5 rounded-full flex-shrink-0">
                        {brand}
                      </span>
                    )}
                  </LocalizedClientLink>
                )
              })}
              <LocalizedClientLink
                href={`/search?q=${encodeURIComponent(query)}`}
                className="block px-4 py-3.5 text-sm font-semibold text-brand-orange hover:bg-brand-orange/5 transition-colors text-center border-t border-grey-20/40 press-scale"
                onClick={() => setShowAutocomplete(false)}
              >
                View all results for &ldquo;{query}&rdquo;
              </LocalizedClientLink>
            </div>
          )}
        </div>

        {!brandParam && (
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {(categoryChips || []).map((cat) => (
              <LocalizedClientLink
                key={cat.handle}
                href={`/categories/${cat.handle}`}
                className="px-5 py-2 text-sm font-medium rounded-full border border-brand-orange/60 text-brand-orange bg-white hover:bg-brand-orange hover:text-white active:scale-95 transition-all duration-200 shadow-sm press-scale"
              >
                {cat.name}
              </LocalizedClientLink>
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
                className={`px-5 py-2 text-sm font-medium rounded-full border transition-all duration-200 press-scale ${
                  activeDietary === chip
                    ? "bg-brand-green border-brand-green text-white shadow-md"
                    : "border-grey-30/80 text-grey-60 bg-white hover:border-brand-green hover:text-brand-green hover:shadow-sm"
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
              {appliedSynonym && (
                <span className="text-brand-orange font-medium">
                  {" "}— showing results for "{appliedSynonym}"
                </span>
              )}
            </p>
            <div className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-3 sm:gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {products.length < totalCount && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => performSearch(query, page + 1)}
                  disabled={loadingMore}
                  className="px-10 py-3.5 bg-brand-orange text-white font-semibold rounded-xl hover:bg-brand-orange-dark active:scale-[0.97] transition-all duration-200 disabled:opacity-50 shadow-lg shadow-brand-orange/20 press-scale"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading...
                    </span>
                  ) : "Load More Products"}
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
