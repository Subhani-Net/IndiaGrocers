"use client"

import { useState, useEffect, useRef, useMemo, useTransition } from "react"
import { HttpTypes } from "@medusajs/types"
import { Spinner } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import WeightHeavyProductCard from "@modules/products/components/product-preview/weight-heavy-card"
import { useSearchParams, useRouter } from "next/navigation"
import { autocompleteProducts } from "@lib/search-client"
import { getImageUrl } from "@lib/util/images"
import EmptyState from "@modules/common/components/empty-state"

const DIETARY_CHIPS = [
  { label: "Vegetarian", filter: "vegetarian" },
  { label: "Vegan", filter: "vegan" },
  { label: "Gluten-Free", filter: "gluten-free" },
  { label: "Halal", filter: "halal" },
  { label: "Organic", filter: "organic" },
]

const SORT_OPTIONS = [
  { label: "Relevance", value: "" },
  { label: "Price: Low to High", value: "price_gbp:asc" },
  { label: "Price: High to Low", value: "price_gbp:desc" },
  { label: "Newest", value: "created_at:desc" },
  { label: "Best Selling", value: "metadata.velocity:desc" },
]

function extractBrand(title: string): { brand: string | null; cleanTitle: string } {
  const separators = [" - ", " – ", " — "]
  for (const sep of separators) {
    const idx = title.lastIndexOf(sep)
    if (idx > 0) {
      return { brand: title.slice(idx + sep.length).trim(), cleanTitle: title.slice(0, idx).trim() }
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
  const brandCounts = useMemo(() => {
    const map = new Map<string, number>()
    products.forEach((p) => {
      const { brand } = extractBrand(p.title)
      if (brand) map.set(brand, (map.get(brand) || 0) + 1)
    })
    return map
  }, [products])
  const brands = [...brandCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  if (brands.length === 0) return null

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-3">
      {brands.map(([brand, count]) => (
        <button
          key={brand}
          onClick={() => setActiveBrand(activeBrand === brand ? null : brand)}
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
  initialResults,
  initialTotal,
  initialQuery,
  initialPage,
  initialDietary,
  initialBrand,
  initialSort,
}: {
  categoryChips?: Array<{ name: string; handle: string }>
  countryCode: string
  initialResults?: HttpTypes.StoreProduct[]
  initialTotal?: number
  initialQuery?: string
  initialPage?: number
  initialDietary?: string | null
  initialBrand?: string | null
  initialSort?: string
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const qParam = searchParams.get("q")
  const brandParam = searchParams.get("brand")
  const pageParam = parseInt(searchParams.get("page") || "1", 10) || 1

  // ─── State ───
  const [query, setQuery] = useState(initialQuery || "")
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>(initialResults || [])
  const [totalCount, setTotalCount] = useState(initialTotal || 0)
  const [searched, setSearched] = useState(!!initialQuery)
  const [currentPage, setCurrentPage] = useState(initialPage || 1)

  const [activeDietary, setActiveDietary] = useState<string | null>(initialDietary || null)
  const [activeBrand, setActiveBrand] = useState<string | null>(initialBrand || null)
  const [activeSort, setActiveSort] = useState(initialSort || "")

  const [autocompleteResults, setAutocompleteResults] = useState<HttpTypes.StoreProduct[]>([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteIndex, setAutocompleteIndex] = useState(-1)

  const inputContainerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ─── SSR results → state ───
  useEffect(() => {
    const isLoadMore = (initialPage || 1) > 1
    if (initialResults && initialResults.length > 0) {
      if (isLoadMore) {
        setProducts(prev => [...prev, ...initialResults])
      } else {
        setProducts(initialResults)
      }
      setTotalCount(initialTotal || 0)
      setSearched(true)
      setCurrentPage(initialPage || 1)
      if (initialQuery) setQuery(initialQuery)
    } else if (initialQuery && !isLoadMore) {
      // Server returned empty results — only clear on page 1
      setProducts([])
      setTotalCount(0)
      setSearched(true)
      setCurrentPage(initialPage || 1)
      setQuery(initialQuery)
    }
  }, [initialResults, initialTotal, initialQuery, initialPage])

  // Synced from SSR for active filter state
  useEffect(() => {
    if (initialDietary !== undefined) setActiveDietary(initialDietary)
  }, [initialDietary])

  useEffect(() => {
    if (initialBrand !== undefined) setActiveBrand(initialBrand)
  }, [initialBrand])

  useEffect(() => {
    if (initialSort !== undefined) setActiveSort(initialSort)
  }, [initialSort])

  // ─── Debounced URL sync (single source of truth for navigation) ───
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (query.trim()) params.set("q", query.trim())
      if (activeDietary) params.set("dietary", activeDietary)
      if (activeBrand) params.set("brand", activeBrand)
      if (activeSort) params.set("sort", activeSort)
      const url = `/${countryCode}/search${params.toString() ? "?" + params.toString() : ""}`
      startTransition(() => router.replace(url, { scroll: false }))
    }, 300)
    return () => clearTimeout(timer)
  }, [query, activeDietary, activeBrand, activeSort, countryCode])

  // ─── Autocomplete (client-side MeiliSearch only, no Medusa) ───
  useEffect(() => {
    if (!query.trim() || brandParam) { setAutocompleteResults([]); return }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const hits = await autocompleteProducts(query, controller.signal)
        if (controller.signal.aborted) return
        setAutocompleteResults(hits.map(h => ({ id: h.id, title: h.title, handle: h.handle, thumbnail: h.thumbnail, calculated_price: { calculated_amount: h.price_gbp } } as any)))
        setAutocompleteIndex(-1)
      } catch { setAutocompleteResults([]) }
    }, 200)
    return () => { clearTimeout(timer); controller.abort() }
  }, [query, brandParam])

  // ─── Click-outside closes autocomplete ───
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(target) && inputContainerRef.current && !inputContainerRef.current.contains(target)) {
        setShowAutocomplete(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // ─── Load More: navigate to next page ───
  const handleLoadMore = () => {
    const nextPage = currentPage + 1
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (activeDietary) params.set("dietary", activeDietary)
    if (activeBrand) params.set("brand", activeBrand)
    if (activeSort) params.set("sort", activeSort)
    params.set("page", String(nextPage))
    startTransition(() => router.push(`/${countryCode}/search?${params.toString()}`, { scroll: false }))
  }

  // ─── Keyboard nav for autocomplete ───
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showAutocomplete || autocompleteResults.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setAutocompleteIndex(prev => Math.min(prev + 1, autocompleteResults.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setAutocompleteIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === "Enter" && autocompleteIndex >= 0) {
      e.preventDefault()
      const selected = autocompleteResults[autocompleteIndex]
      if (selected) {
        setShowAutocomplete(false)
        inputRef.current?.blur()
      }
    } else if (e.key === "Escape") {
      setShowAutocomplete(false)
    }
  }

  // ─── Render ───
  return (
    <div className="content-container py-12">
      {brandParam && (
        <nav className="flex items-center gap-2 text-sm text-grey-50 mb-6">
          <LocalizedClientLink href="/" className="hover:text-brand-orange transition-colors">Home</LocalizedClientLink>
          <svg className="w-3 h-3 text-grey-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <LocalizedClientLink href="/brands" className="hover:text-brand-orange transition-colors">Brands</LocalizedClientLink>
          <svg className="w-3 h-3 text-grey-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-brand-orange font-semibold">{brandParam}</span>
        </nav>
      )}

      {brandParam && (
        <div className="bg-gradient-to-br from-brand-orange via-brand-orange-light to-brand-orange rounded-2xl p-8 mb-8 text-white shadow-xl">
          <h2 className="text-3xl font-bold tracking-tight">{brandParam}</h2>
          <p className="text-white/80 mt-1.5 text-sm">{products.length} product{products.length !== 1 ? "s" : ""}</p>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Search Products</h1>
        <p className="text-center text-ui-fg-subtle mb-8">Find your favourite Indian groceries</p>

        <div className="relative" ref={inputContainerRef}>
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-grey-40">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowAutocomplete(true) }}
            onFocus={() => { if (query.trim() && !brandParam) setShowAutocomplete(true) }}
            onKeyDown={handleKeyDown}
            placeholder="Search for rice, spices, dals, snacks..."
            className="w-full h-14 pl-12 pr-6 text-lg bg-grey-5 border-2 border-grey-20/80 rounded-2xl text-grey-90 placeholder-grey-40 outline-none transition-all duration-200 focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 focus:bg-white"
          />
          {isPending && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Spinner className="animate-spin text-brand-orange" /></div>}

          {showAutocomplete && autocompleteResults.length > 0 && query.trim() && !brandParam && (
            <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-grey-20/80 z-50 overflow-hidden">
              {autocompleteResults.map((product, idx) => {
                const { brand } = extractBrand(product.title)
                return (
                  <LocalizedClientLink
                    key={product.id}
                    href={`/products/${product.handle}`}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors border-b border-grey-20/40 last:border-b-0 ${idx === autocompleteIndex ? "bg-brand-orange/10" : "hover:bg-brand-orange/5"}`}
                    onClick={() => setShowAutocomplete(false)}
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-grey-10 flex-shrink-0 border border-grey-10/60">
                      {product.thumbnail && <img src={getImageUrl(product.thumbnail)} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-grey-90 truncate">{product.title}</p></div>
                    {brand && <span className="text-[10px] font-semibold text-brand-saffron bg-brand-saffron/10 px-2 py-0.5 rounded-full flex-shrink-0">{brand}</span>}
                  </LocalizedClientLink>
                )
              })}
              <LocalizedClientLink
                href={`/search?q=${encodeURIComponent(query)}`}
                className={`block px-4 py-3.5 text-sm font-semibold text-brand-orange hover:bg-brand-orange/5 transition-colors text-center border-t border-grey-20/40 press-scale ${autocompleteIndex === autocompleteResults.length ? "bg-brand-orange/10" : ""}`}
                onClick={() => setShowAutocomplete(false)}
              >
                View all results for &ldquo;{query}&rdquo;
              </LocalizedClientLink>
            </div>
          )}
        </div>

        {!brandParam && (
          <>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {(categoryChips || []).map((cat) => (
                <LocalizedClientLink key={cat.handle} href={`/categories/${cat.handle}`} className="px-5 py-2 text-sm font-medium rounded-full border border-brand-orange/60 text-brand-orange bg-white hover:bg-brand-orange hover:text-white active:scale-95 transition-all duration-200 shadow-sm press-scale">
                  {cat.name}
                </LocalizedClientLink>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {DIETARY_CHIPS.map((chip) => (
                <button
                  key={chip.filter}
                  onClick={() => setActiveDietary(activeDietary === chip.filter ? null : chip.filter)}
                  className={`px-5 py-2 text-sm font-medium rounded-full border transition-all duration-200 press-scale ${activeDietary === chip.filter ? "bg-brand-green border-brand-green text-white shadow-md" : "border-grey-30/80 text-grey-60 bg-white hover:border-brand-green hover:text-brand-green hover:shadow-sm"}`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <div className="flex justify-center mt-3">
              <select
                data-testid="sort-select"
                value={activeSort}
                onChange={(e) => setActiveSort(e.target.value)}
                className="px-4 py-2 text-sm border border-grey-20/80 rounded-full bg-white text-grey-60 focus:outline-none focus:border-brand-orange"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {!brandParam && products.length > 0 && (
          <BrandChips products={products} activeBrand={activeBrand} setActiveBrand={setActiveBrand} />
        )}
      </div>

      <div className="mt-12">
        {isPending && !products.length && (
          <div className="flex justify-center py-20"><Spinner className="animate-spin text-brand-orange w-8 h-8" /></div>
        )}

        {!isPending && searched && products.length === 0 && (
          <EmptyState type="search" suggestedTerms={["basmati rice", "jeera", "turmeric", "chickpeas"]} />
        )}

        {products.length > 0 && (
          <>
            <p className="text-ui-fg-subtle mb-4">
              {totalCount} result{totalCount !== 1 ? "s" : ""}
              {query ? ` for "${query}"` : ""}
            </p>
            <div className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-3 sm:gap-4">
              {products.map((product) => (
                <WeightHeavyProductCard key={product.id} product={product} countryCode={countryCode} />
              ))}
            </div>
            {products.length < totalCount && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={isPending}
                  className="px-10 py-3.5 bg-brand-orange text-white font-semibold rounded-xl hover:bg-brand-orange-dark active:scale-[0.97] transition-all duration-200 disabled:opacity-50 shadow-lg shadow-brand-orange/20 press-scale"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Loading...
                    </span>
                  ) : "Load More Products"}
                </button>
              </div>
            )}
          </>
        )}

        {!searched && !isPending && (
          <EmptyState type="search" subtitle="Start typing or select a category to find products" />
        )}
      </div>
    </div>
  )
}
