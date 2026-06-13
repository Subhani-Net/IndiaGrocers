import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface EmptyStateProps {
  type: "category" | "search" | "filter" | "wishlist" | "orders"
  /** Custom subtitle below the main message */
  subtitle?: string
  /** Search query for search-type empty state */
  query?: string
  /** Categories to suggest browsing */
  suggestedCategories?: { name: string; handle: string }[]
  /** Synonyms to suggest trying */
  suggestedTerms?: string[]
}

function PackageIcon() {
  return (
    <svg
      className="w-12 h-12 text-stone-300 mx-auto mb-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  )
}

export default function EmptyState({
  type,
  query,
  suggestedCategories,
  suggestedTerms,
  subtitle,
}: EmptyStateProps) {
  const config: Record<
    string,
    { title: string; message: string; showCategories?: boolean }
  > = {
    category: {
      title: "No products yet",
      message:
        "We're stocking this category soon. Check back or browse other categories.",
      showCategories: true,
    },
    search: {
      title: query ? `No results for "${query}"` : "No results found",
      message: "Try a different search term or browse by category.",
      showCategories: true,
    },
    filter: {
      title: "No matching products",
      message:
        "Try removing some filters or adjusting your price range.",
      showCategories: false,
    },
    wishlist: {
      title: "Your wishlist is empty",
      message: "Start saving your favourite products.",
      showCategories: true,
    },
    orders: {
      title: "No orders yet",
      message: "Your order history will appear here.",
      showCategories: false,
    },
  }

  const c = config[type] ?? config.search

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <PackageIcon />
      <h3 className="text-lg font-semibold text-stone-700 mb-1">
        {c.title}
      </h3>
      <p className="text-sm text-stone-500 max-w-sm mb-6">{c.message}</p>

      {subtitle && <p className="text-xs text-stone-400 max-w-sm mb-6 -mt-4">{subtitle}</p>}

      {suggestedTerms && suggestedTerms.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-stone-400 mb-2">Try searching for:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestedTerms.map((t) => (
              <LocalizedClientLink
                key={t}
                href={`/search?q=${encodeURIComponent(t)}`}
                className="px-3 py-1 text-xs font-medium border border-stone-200 rounded-full text-stone-600 hover:border-brand-orange/50 hover:text-brand-orange transition-colors"
              >
                {t}
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      )}

      {c.showCategories && suggestedCategories && suggestedCategories.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-stone-400 mb-2">Or browse:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestedCategories.map((cat) => (
              <LocalizedClientLink
                key={cat.handle}
                href={`/categories/${cat.handle}`}
                className="px-3 py-1 text-xs font-medium border border-stone-200 rounded-full text-stone-600 hover:border-brand-orange/50 hover:text-brand-orange transition-colors"
              >
                {cat.name} →
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      )}

      <LocalizedClientLink
        href="/store"
        className="text-sm font-semibold text-brand-orange hover:underline"
      >
        Explore all products
      </LocalizedClientLink>
    </div>
  )
}
