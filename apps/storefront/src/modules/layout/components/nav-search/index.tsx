"use client"

import { useRouter, useParams } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { useSearch } from "@lib/context/search-context"
import { autocompleteProducts } from "@lib/search-client"
import { getImageUrl } from "@lib/util/images"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function NavSearch() {
  const router = useRouter()
  const params = useParams()
  const countryCode = (params?.countryCode as string) || "gb"

  const {
    searchQuery,
    setSearchActive,
    setSearchQuery,
    clearSearch,
    isSearchActive,
  } = useSearch()

  const [autocompleteResults, setAutocompleteResults] = useState<any[]>([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteIdx, setAutocompleteIdx] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // ─── Autocomplete: 200ms debounce, abortable ───
  useEffect(() => {
    if (!searchQuery.trim()) {
      setAutocompleteResults([])
      setShowAutocomplete(false)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const timer = setTimeout(async () => {
      try {
        const hits = await autocompleteProducts(searchQuery, controller.signal)
        if (controller.signal.aborted) return
        setAutocompleteResults(hits)
        setAutocompleteIdx(-1)
        setShowAutocomplete(true)
      } catch {
        if (!controller.signal.aborted) setAutocompleteResults([])
      }
    }, 200)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [searchQuery])

  // ─── Click-outside closes autocomplete ───
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {
        setShowAutocomplete(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // ─── Handlers ───
  const handleFocus = () => {
    setSearchActive(true)
    if (searchQuery.trim()) setShowAutocomplete(true)
  }

  const handleChange = (value: string) => {
    setSearchQuery(value)
    setShowAutocomplete(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showAutocomplete || autocompleteResults.length === 0) {
      if (e.key === "Enter" && searchQuery.trim()) {
        e.preventDefault()
        router.replace(
          `/${countryCode}/search?q=${encodeURIComponent(searchQuery.trim())}`
        )
      }
      if (e.key === "Escape") {
        clearSearch()
        inputRef.current?.blur()
      }
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setAutocompleteIdx((prev) =>
        Math.min(prev + 1, autocompleteResults.length)
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setAutocompleteIdx((prev) => Math.max(prev - 1, -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (
        autocompleteIdx >= 0 &&
        autocompleteIdx < autocompleteResults.length
      ) {
        const product = autocompleteResults[autocompleteIdx]
        if (product) {
          setShowAutocomplete(false)
          inputRef.current?.blur()
          router.push(`/${countryCode}/search?q=${encodeURIComponent(searchQuery.trim())}`)
        }
      } else {
        router.replace(
          `/${countryCode}/search?q=${encodeURIComponent(searchQuery.trim())}`
        )
      }
    } else if (e.key === "Escape") {
      clearSearch()
      setShowAutocomplete(false)
      inputRef.current?.blur()
    }
  }

  const handleSelectProduct = () => {
    setShowAutocomplete(false)
    inputRef.current?.blur()
    router.push(`/${countryCode}/search?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  const hasResults = autocompleteResults.length > 0 && showAutocomplete

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey-40 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search products..."
          className="w-full border border-grey-20 rounded-lg py-2 pl-9 pr-4 text-sm text-grey-90 placeholder-grey-40 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
        />
        {isSearchActive && searchQuery && (
          <button
            onClick={() => {
              clearSearch()
              setShowAutocomplete(false)
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-grey-40 hover:text-grey-70 transition-colors"
            aria-label="Clear search"
          >
            <svg
              className="w-3.5 h-3.5"
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
        )}
      </div>

      {/* Autocomplete dropdown */}
      {hasResults && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-grey-20/80 z-[60] overflow-hidden"
        >
          {autocompleteResults.map((product: any, idx: number) => (
            <button
              key={product.id}
              onClick={() => handleSelectProduct()}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-grey-20/40 last:border-b-0 ${
                idx === autocompleteIdx
                  ? "bg-brand-orange/10"
                  : "hover:bg-brand-orange/5"
              }`}
            >
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-grey-10 flex-shrink-0 border border-grey-10/60">
                {product.thumbnail && (
                  <img
                    src={getImageUrl(product.thumbnail)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <span className="text-sm text-grey-90 truncate flex-1">
                {product.title}
              </span>
              <span className="text-xs text-grey-40 flex-shrink-0">
                {product.price_gbp != null
                  ? `£${(product.price_gbp / 100).toFixed(2)}`
                  : ""}
              </span>
            </button>
          ))}
          <LocalizedClientLink
            href={`/search?q=${encodeURIComponent(searchQuery)}`}
            className="flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-semibold text-brand-orange hover:bg-brand-orange/5 transition-colors text-center"
            onClick={() => setShowAutocomplete(false)}
          >
            View all results for &ldquo;{searchQuery}&rdquo;
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </LocalizedClientLink>
        </div>
      )}
    </div>
  )
}
