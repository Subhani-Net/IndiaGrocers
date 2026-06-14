"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useCallback, useMemo } from "react"

import SortProducts, {
  SortOptions,
} from "@modules/store/components/refinement-list/sort-products"
import FilterAccordion from "@modules/store/components/filter-accordion"

type FilterPanelProps = {
  sortBy: SortOptions
  categoryHandle?: string
  countryCode?: string
  search?: boolean
  compact?: boolean
  "data-testid"?: string
}

export default function FilterPanel({
  sortBy,
  categoryHandle,
  countryCode: _cc,
  compact = false,
  "data-testid": dataTestId,
}: FilterPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "")
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "")
  const [brand, setBrand] = useState(searchParams.get("brand") || "")
  const [weight, setWeight] = useState(searchParams.get("weight") || "")
  const [dietary, setDietary] = useState(
    (searchParams.get("dietary") || "").split(",").filter(Boolean)
  )
  const [inStockOnly, setInStockOnly] = useState(
    searchParams.get("inStock") === "true"
  )

  const minPriceFromUrl = searchParams.get("minPrice") || ""
  const maxPriceFromUrl = searchParams.get("maxPrice") || ""
  const brandFromUrl = searchParams.get("brand") || ""
  const weightFromUrl = searchParams.get("weight") || ""
  const dietaryFromUrl = searchParams.get("dietary") || ""
  const inStockFromUrl = searchParams.get("inStock") === "true"

  useEffect(() => {
    setMinPrice(minPriceFromUrl)
    setMaxPrice(maxPriceFromUrl)
    setBrand(brandFromUrl)
    setWeight(weightFromUrl)
    setDietary(dietaryFromUrl.split(",").filter(Boolean))
    setInStockOnly(inStockFromUrl)
  }, [minPriceFromUrl, maxPriceFromUrl, brandFromUrl, weightFromUrl, dietaryFromUrl, inStockFromUrl])

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams)
      // Reset page when filters change
      params.delete("page")
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      return params.toString()
    },
    [searchParams]
  )

  const pushFilters = (updates: Record<string, string | null>) => {
    const query = createQueryString(updates)
    router.push(`${pathname}?${query}`)
  }

  const handleBrandChange = (newBrand: string) => {
    setBrand(newBrand)
    pushFilters({ brand: newBrand || null })
  }

  const handleWeightChange = (newWeight: string) => {
    setWeight(newWeight)
    pushFilters({ weight: newWeight || null })
  }

  const handleDietaryToggle = (flag: string) => {
    const next = dietary.includes(flag)
      ? dietary.filter((d) => d !== flag)
      : [...dietary, flag]
    setDietary(next)
    pushFilters({ dietary: next.length > 0 ? next.join(",") : null })
  }

  const handlePriceApply = () => {
    pushFilters({
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
    })
  }

  const handleInStockToggle = () => {
    const next = !inStockOnly
    setInStockOnly(next)
    pushFilters({ inStock: next ? "true" : null })
  }

  const hasActiveFilters = useMemo(
    () => minPrice || maxPrice || brand || weight || dietary.length > 0,
    [minPrice, maxPrice, brand, weight, dietary]
  )

  const COMMON_WEIGHTS = ["100g", "200g", "250g", "500g", "1kg", "2kg", "5kg", "10kg", "20kg"]
  const DIETARY_FLAGS = [
    { value: "vegetarian", label: "Vegetarian" },
    { value: "vegan", label: "Vegan" },
    { value: "gluten-free", label: "Gluten-Free" },
    { value: "organic", label: "Organic" },
  ]

  const accordionSections = [
    {
      id: "sort",
      title: "Sort By",
      children: (
        <SortProducts
          sortBy={sortBy}
          setQueryParams={(name, value) =>
            pushFilters({ [name]: value })
          }
          data-testid={dataTestId}
        />
      ),
    },
    {
      id: "stock",
      title: "Stock Status",
      children: (
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs text-stone-600">In Stock Only</span>
          <button
            onClick={handleInStockToggle}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              inStockOnly ? "bg-brand-orange" : "bg-stone-200"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                inStockOnly ? "translate-x-4" : ""
              }`}
            />
          </button>
        </label>
      ),
    },
    {
      id: "weight",
      title: "Weight",
      badge: weight || undefined,
      children: (
        <div className="flex flex-wrap gap-1.5">
          {COMMON_WEIGHTS.map((w) => (
            <button
              key={w}
              onClick={() => handleWeightChange(w === weight ? "" : w)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                weight === w
                  ? "bg-brand-orange text-white border-brand-orange"
                  : "border-stone-200 text-stone-500 hover:border-brand-orange/50"
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      ),
    },
    {
      id: "brand",
      title: "Brand",
      badge: brand || undefined,
      children: (
        <>
          <input
            type="text"
            placeholder="Type a brand name..."
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            onBlur={() => handleBrandChange(brand)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleBrandChange(brand)
              if (e.key === "Escape") handleBrandChange("")
            }}
            className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg outline-none focus:border-brand-orange transition-colors"
          />
          {brand && (
            <p className="text-[10px] text-stone-400 mt-1">
              Press Enter to apply, Esc to clear
            </p>
          )}
        </>
      ),
    },
    {
      id: "dietary",
      title: "Dietary",
      badge: dietary.length || undefined,
      children: (
        <div className="flex flex-col gap-1.5">
          {DIETARY_FLAGS.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-2 cursor-pointer text-xs text-stone-600 hover:text-stone-800"
            >
              <input
                type="checkbox"
                checked={dietary.includes(value)}
                onChange={() => handleDietaryToggle(value)}
                className="w-3.5 h-3.5 rounded border-stone-300 text-brand-orange focus:ring-brand-orange/30 accent-brand-orange"
              />
              {label}
            </label>
          ))}
        </div>
      ),
    },
    {
      id: "price",
      title: "Price Range",
      badge: minPrice || maxPrice ? "£" : undefined,
      children: (
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={handlePriceApply}
            onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
            className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg outline-none focus:border-brand-orange"
            min="0"
            step="0.01"
          />
          <span className="text-stone-300 text-xs">–</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={handlePriceApply}
            onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
            className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg outline-none focus:border-brand-orange"
            min="0"
            step="0.01"
          />
        </div>
      ),
    },
  ]

  const sectionClassName = compact
    ? "" // Accordion provides the container style
    : "bg-white rounded-xl border border-stone-200 p-3.5"
  const sectionTitleClassName = compact
    ? "hidden" // Title is rendered by accordion trigger
    : "text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2"

  const allSectionIds = accordionSections.map((s) => s.id)

  return (
    <div className="flex flex-col gap-4">
      {/* Active filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5">
          {brand && (
            <button
              onClick={() => handleBrandChange("")}
              className="text-[11px] bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded-full hover:bg-brand-orange/20"
            >
              Brand: {brand} ✕
            </button>
          )}
          {weight && (
            <button
              onClick={() => handleWeightChange("")}
              className="text-[11px] bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded-full hover:bg-brand-orange/20"
            >
              Weight: {weight} ✕
            </button>
          )}
          {dietary.map((d) => (
            <button
              key={d}
              onClick={() => handleDietaryToggle(d)}
              className="text-[11px] bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded-full hover:bg-brand-orange/20 capitalize"
            >
              {d.replace(/-/g, " ")} ✕
            </button>
          ))}
          <button
            onClick={() => {
              pushFilters({
                brand: null,
                weight: null,
                dietary: null,
                minPrice: null,
                maxPrice: null,
              })
            }}
            className="text-[11px] text-stone-400 underline hover:text-stone-600"
          >
            Clear all
          </button>
        </div>
      )}

      {compact ? (
        <FilterAccordion
          sections={accordionSections}
          defaultValue={[]}
        />
      ) : (
        accordionSections.map((section) => (
          <div key={section.id} className={sectionClassName}>
            <h3 className={sectionTitleClassName}>{section.title}</h3>
            {section.children}
          </div>
        ))
      )}
    </div>
  )
}
