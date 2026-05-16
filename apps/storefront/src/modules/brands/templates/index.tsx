"use client"

import { useState, useEffect, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import { sdk } from "@lib/config"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

function extractBrand(title: string): string | null {
  const separators = [" - ", " – ", " — "]
  for (const sep of separators) {
    const idx = title.lastIndexOf(sep)
    if (idx > 0) {
      return title.slice(idx + sep.length).trim()
    }
  }
  return null
}

interface BrandEntry {
  name: string
  count: number
}

export default function BrandsTemplate() {
  const [brands, setBrands] = useState<BrandEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLetter, setActiveLetter] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBrands() {
      setLoading(true)
      try {
        const { products } = await sdk.client.fetch<{
          products: HttpTypes.StoreProduct[]
        }>(`/store/products`, {
          method: "GET",
          query: { limit: 9999, fields: "title" },
        })

        const brandCounts: Record<string, number> = {}
        for (const product of products) {
          const brand = extractBrand(product.title)
          if (brand) {
            brandCounts[brand] = (brandCounts[brand] || 0) + 1
          }
        }

        const entries = Object.entries(brandCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => a.name.localeCompare(b.name))

        setBrands(entries)
      } catch {
        setBrands([])
      } finally {
        setLoading(false)
      }
    }

    fetchBrands()
  }, [])

  const grouped = useMemo(() => {
    const map: Record<string, BrandEntry[]> = {}
    for (const brand of brands) {
      const letter = brand.name.charAt(0).toUpperCase()
      if (!map[letter]) map[letter] = []
      map[letter].push(brand)
    }
    return map
  }, [brands])

  const availableLetters = useMemo(
    () => ALPHABET.filter((l) => grouped[l]?.length),
    [grouped]
  )

  const scrollToLetter = (letter: string) => {
    setActiveLetter(letter)
    const el = document.getElementById(`brand-letter-${letter}`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="bg-grey-5 min-h-screen">
      <div className="bg-white border-b border-grey-20">
        <div className="max-w-[1440px] mx-auto px-6 py-8">
          <h1 className="section-title section-title-accent">Shop by Brand</h1>
          <p className="section-subtitle mt-6">
            Browse your favourite Indian grocery brands
          </p>
        </div>
      </div>

      <div className="sticky top-0 z-40 bg-white border-b border-grey-20 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 py-3 overflow-x-auto no-scrollbar">
          <div className="flex gap-1.5 min-w-max">
            {ALPHABET.map((letter) => {
              const hasBrands = availableLetters.includes(letter)
              return (
                <button
                  key={letter}
                  onClick={() => hasBrands && scrollToLetter(letter)}
                  disabled={!hasBrands}
                  className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all duration-200
                    ${
                      activeLetter === letter
                        ? "bg-brand-orange text-white"
                        : hasBrands
                          ? "border border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white"
                          : "border border-grey-20 text-grey-30 cursor-not-allowed"
                    }`}
                >
                  {letter}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && brands.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg font-semibold text-grey-70">No brands found</p>
            <p className="text-grey-50 mt-2">Unable to load brand information.</p>
          </div>
        )}

        {!loading &&
          ALPHABET.map((letter) => {
            const letterBrands = grouped[letter]
            if (!letterBrands) return null

            return (
              <section key={letter} id={`brand-letter-${letter}`} className="mb-10">
                <h2 className="text-2xl font-bold text-grey-90 mb-4 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-lg bg-brand-orange text-white flex items-center justify-center text-lg">
                    {letter}
                  </span>
                  <span className="h-px flex-1 bg-grey-20" />
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {letterBrands.map((brand) => (
                    <LocalizedClientLink
                      key={brand.name}
                      href={`/search?brand=${encodeURIComponent(brand.name)}`}
                      className="block bg-white rounded-lg border border-grey-20 p-5 hover:shadow-lg hover:shadow-brand-orange/10 hover:border-brand-orange/30 transition-all duration-200 group"
                    >
                      <p className="font-bold text-grey-90 group-hover:text-brand-orange transition-colors">
                        {brand.name}
                      </p>
                      <p className="text-sm text-grey-50 mt-1">
                        {brand.count} product{brand.count !== 1 ? "s" : ""}
                      </p>
                    </LocalizedClientLink>
                  ))}
                </div>
              </section>
            )
          })}
      </div>
    </div>
  )
}
