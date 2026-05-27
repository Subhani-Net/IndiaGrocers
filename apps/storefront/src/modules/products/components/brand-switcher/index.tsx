"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { formatGBP } from "@lib/util/format-price"

interface BrandOption {
  slug: string
  name: string
  productHandle: string
  priceFrom: number
}

interface BrandSwitcherProps {
  brands: BrandOption[]
  currentBrandSlug: string
  currentWeightLabel?: string
}

export default function BrandSwitcher({
  brands,
  currentBrandSlug,
  currentWeightLabel,
}: BrandSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const currentBrand = brands.find((b) => b.slug === currentBrandSlug)
  const displayName = currentBrand?.name || currentBrandSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())

  const handleSelect = useCallback(
    (b: BrandOption) => {
      setOpen(false)
      // Build URL — try to preserve weight
      let url = `/products/${b.productHandle}`
      if (currentWeightLabel) {
        url += `?weight=${encodeURIComponent(currentWeightLabel)}`
      }
      router.push(url)
    },
    [currentWeightLabel, router]
  )

  if (brands.length <= 1) return null

  return (
    <div className="relative">
      <span className="text-[10px] text-stone-400 uppercase tracking-wider block mb-1">
        Also Available From
      </span>

      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium border border-stone-200 rounded-lg bg-white hover:border-brand-orange/50 transition-colors"
      >
        <span>
          <span className="text-stone-400">Brand: </span>
          <span className="text-stone-700 font-semibold">{displayName}</span>
        </span>
        <span className={`text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-20 overflow-hidden">
            {brands.map((b) => (
              <li key={b.slug}>
                <button
                  onClick={() => handleSelect(b)}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    b.slug === currentBrandSlug
                      ? "bg-brand-orange/5 text-brand-orange font-semibold"
                      : "text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <span className="block">{b.name}</span>
                  <span className="text-[10px] text-stone-400">
                    from {formatGBP(b.priceFrom)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
