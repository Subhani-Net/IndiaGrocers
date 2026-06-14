"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react"
import { usePathname } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { searchProducts } from "@lib/search-client"
import { fetchProductsByIds } from "@lib/data/products"

// ─── Types ───

interface SearchContextValue {
  isSearchActive: boolean
  searchQuery: string
  searchResults: HttpTypes.StoreProduct[]
  isLoading: boolean
  totalCount: number
  setSearchActive: (active: boolean) => void
  setSearchQuery: (query: string) => void
  clearSearch: () => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

// ─── Hook ───

export function useSearch() {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error("useSearch must be used within SearchProvider")
  return ctx
}

// ─── Provider ───

export function SearchProvider({
  children,
  countryCode,
}: {
  children: React.ReactNode
  countryCode: string
}) {
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [searchQuery, setSearchQueryState] = useState("")
  const [searchResults, setSearchResults] = useState<
    HttpTypes.StoreProduct[]
  >([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const pathname = usePathname()

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const controllerRef = useRef<AbortController | null>(null)

  // ─── Debounced search effect ───
  useEffect(() => {
    if (debounceRef.current !== undefined) {
      clearTimeout(debounceRef.current)
    }

    if (!searchQuery.trim() || !isSearchActive) {
      setSearchResults([])
      setTotalCount(0)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    debounceRef.current = setTimeout(async () => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      try {
        const { products: hits, totalCount: count } = await searchProducts(
          searchQuery.trim(),
          { limit: 24, signal: controller.signal }
        )

        if (controller.signal.aborted) return
        if (!hits.length) {
          setSearchResults([])
          setTotalCount(0)
          setIsLoading(false)
          return
        }

        const hitIds = hits.map((h: any) => h.id)
        const fullProducts = await fetchProductsByIds({
          ids: hitIds,
          countryCode,
        })

        if (controller.signal.aborted) return

        setSearchResults(fullProducts as HttpTypes.StoreProduct[])
        setTotalCount(count)
      } catch (error: any) {
        if (error?.name === "AbortError") return
        setSearchResults([])
        setTotalCount(0)
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }, 300)

    return () => {
      if (debounceRef.current !== undefined) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchQuery, isSearchActive, countryCode])

  // ─── Cleanup on unmount ───
  useEffect(() => {
    return () => {
      controllerRef.current?.abort()
    }
  }, [])

  // ─── Clear search on navigation away from /search ───
  // Fire only on pathname changes (navigation), not on isSearchActive toggles (typing).
  useEffect(() => {
    if (isSearchActive && !pathname.includes("/search")) {
      setIsSearchActive(false)
      setSearchQueryState("")
      setSearchResults([])
      setTotalCount(0)
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const setSearchActive = useCallback((active: boolean) => {
    setIsSearchActive(active)
    if (!active) {
      setSearchQueryState("")
      setSearchResults([])
      setTotalCount(0)
      setIsLoading(false)
    }
  }, [])

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query)
    if (query.trim()) {
      setIsSearchActive(true)
    }
  }, [])

  const clearSearch = useCallback(() => {
    setIsSearchActive(false)
    setSearchQueryState("")
    setSearchResults([])
    setTotalCount(0)
    setIsLoading(false)
  }, [])

  return (
    <SearchContext.Provider
      value={{
        isSearchActive,
        searchQuery,
        searchResults,
        isLoading,
        totalCount,
        setSearchActive,
        setSearchQuery,
        clearSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}
