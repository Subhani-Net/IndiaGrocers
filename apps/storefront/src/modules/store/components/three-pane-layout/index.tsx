"use client"

import { useState, useEffect, useCallback, Suspense } from "react"

// ─── Quick-filter dietary chips (same as FilterPanel) ───
const DIETARY_CHIPS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "GF" },
  { value: "organic", label: "Organic" },
]

// ─── Types ───

interface ThreePaneLayoutProps {
  children: React.ReactNode
  filterPanel: React.ReactNode
  cartSidebar: React.ReactNode
  productCount: number
  sortDropdown?: React.ReactNode
  countryCode: string
  /** Hide the filter pane entirely (e.g., search results page) */
  showFilterPane?: boolean
}

export default function ThreePaneLayout({
  children,
  filterPanel,
  cartSidebar,
  productCount,
  sortDropdown,
  showFilterPane = true,
}: ThreePaneLayoutProps) {
  const [filterOpen, setFilterOpen] = useState(false)

  // ─── cart-updated → auto-close filter, show basket ───
  useEffect(() => {
    const handler = () => setFilterOpen(false)
    window.addEventListener("cart-updated", handler)
    return () => window.removeEventListener("cart-updated", handler)
  }, [])

  const toggleFilter = useCallback(() => {
    setFilterOpen((prev) => !prev)
  }, [])

  const closeFilter = useCallback(() => {
    setFilterOpen(false)
  }, [])

  // ─── Dynamic grid density ───
  const gridCols = filterOpen
    ? "lg:grid-cols-4"
    : "lg:grid-cols-4 xl:grid-cols-5"
  const gridClass = `grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-3 sm:gap-4`

  return (
    <>
      {/* ─── Horizontal quick-filter row (shown above grid when filter pane is hidden) ─── */}
      <div className="hidden lg:flex items-center justify-between flex-wrap gap-2 mb-4 border-b border-stone-100 pb-4">
        {/* Left: Actions */}
        <div className="flex items-center gap-3">
          {showFilterPane && (
            <button
              onClick={toggleFilter}
              className={`text-sm font-medium px-4 py-2 rounded-lg border transition-all ${
                filterOpen
                  ? "bg-brand-orange text-white border-brand-orange"
                  : "border-stone-200 text-stone-600 hover:border-brand-orange/50"
              }`}
            >
              {filterOpen ? "Hide Filters" : "All Filters"}
            </button>
          )}
          {sortDropdown}
        </div>

        {/* Right: Info + quick chips */}
        <div className="flex items-center gap-3">
          {/* Quick dietary chips */}
          <div className="flex items-center gap-1.5">
            {DIETARY_CHIPS.map((chip) => (
              <a
                key={chip.value}
                href={`?dietary=${chip.value}`}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-stone-200 text-stone-500 hover:border-brand-orange/50 hover:text-brand-orange transition-colors"
              >
                {chip.label}
              </a>
            ))}
          </div>

          <span className="text-sm text-stone-500">
            {productCount} product{productCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ─── Product Grid — mobile (<lg): full width, no sidebars ─── */}
      <div className="lg:hidden">
        <div className={gridClass}>{children}</div>
      </div>

      {/* ─── 3-Pane Layout — desktop (lg+) ─── */}
      <div className="hidden lg:flex lg:gap-6">
        {/* Left: Filter Pane */}
        {showFilterPane && filterOpen && (
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-stone-800">
                  Filters
                </h3>
                <button
                  onClick={closeFilter}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
                  aria-label="Close filters"
                >
                  <svg
                    className="w-4 h-4 text-stone-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {filterPanel}
            </div>
          </aside>
        )}

        {/* Center: Product Grid */}
        <div className="flex-1 min-w-0">
          <div className={gridClass}>{children}</div>
        </div>

        {/* Right: Basket Pane — shown when filter is closed */}
        {!filterOpen && (
          <aside className="w-80 flex-shrink-0">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <Suspense fallback={null}>{cartSidebar}</Suspense>
            </div>
          </aside>
        )}
      </div>
    </>
  )
}
