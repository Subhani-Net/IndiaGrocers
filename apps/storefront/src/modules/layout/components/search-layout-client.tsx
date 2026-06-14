"use client"

import { useSearch } from "@lib/context/search-context"
import SearchResultsGrid from "@modules/search/components/search-results-grid"

export default function SearchLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const { isSearchActive } = useSearch()

  if (isSearchActive) {
    return <SearchResultsGrid />
  }

  return <>{children}</>
}
