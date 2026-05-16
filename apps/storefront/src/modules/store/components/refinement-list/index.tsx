"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useEffect } from "react"

import SortProducts, { SortOptions } from "./sort-products"

type RefinementListProps = {
  sortBy: SortOptions
  search?: boolean
  'data-testid'?: string
}

const RefinementList = ({ sortBy, 'data-testid': dataTestId }: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "")
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "")
  const [brand, setBrand] = useState(searchParams.get("brand") || "")

  useEffect(() => {
    setMinPrice(searchParams.get("minPrice") || "")
    setMaxPrice(searchParams.get("maxPrice") || "")
    setBrand(searchParams.get("brand") || "")
  }, [searchParams])

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    router.push(`${pathname}?${query}`)
  }

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams)
    if (minPrice) params.set("minPrice", minPrice)
    else params.delete("minPrice")
    if (maxPrice) params.set("maxPrice", maxPrice)
    else params.delete("maxPrice")
    if (brand) params.set("brand", brand)
    else params.delete("brand")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-xl border border-grey-20 p-4">
        <h3 className="text-sm font-semibold text-grey-90 mb-3">Sort By</h3>
        <SortProducts sortBy={sortBy} setQueryParams={setQueryParams} data-testid={dataTestId} />
      </div>

      <div className="bg-white rounded-xl border border-grey-20 p-4">
        <h3 className="text-sm font-semibold text-grey-90 mb-3">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min (£)"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={applyFilters}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="w-full px-3 py-1.5 text-sm border border-grey-20 rounded-lg outline-none focus:border-brand-orange"
            min="0"
            step="0.01"
          />
          <span className="text-grey-40">—</span>
          <input
            type="number"
            placeholder="Max (£)"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={applyFilters}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="w-full px-3 py-1.5 text-sm border border-grey-20 rounded-lg outline-none focus:border-brand-orange"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-grey-20 p-4">
        <h3 className="text-sm font-semibold text-grey-90 mb-3">Brand</h3>
        <input
          type="text"
          placeholder="Search brands..."
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          onBlur={applyFilters}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          className="w-full px-3 py-1.5 text-sm border border-grey-20 rounded-lg outline-none focus:border-brand-orange"
        />
      </div>
    </div>
  )
}

export default RefinementList
