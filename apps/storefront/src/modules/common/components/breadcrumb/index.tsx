"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export interface BreadcrumbItem {
  label: string
  href?: string
}

function ChevronRight() {
  return (
    <svg
      className="w-3 h-3 text-stone-300 flex-shrink-0"
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
  )
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (!items || items.length === 0) return null

  return (
    <nav
      className="flex items-center gap-1.5 flex-wrap text-xs text-stone-400 overflow-x-auto no-scrollbar py-1"
      aria-label="Breadcrumb"
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight />}
            {item.href && !isLast ? (
              <LocalizedClientLink
                href={item.href}
                className="hover:text-brand-orange transition-colors whitespace-nowrap"
              >
                {item.label}
              </LocalizedClientLink>
            ) : (
              <span
                className={`whitespace-nowrap ${
                  isLast
                    ? "text-brand-orange font-semibold"
                    : "text-stone-500"
                }`}
              >
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}

/**
 * Builds breadcrumb items from a category and its ancestors.
 */
export function buildCategoryBreadcrumbs(
  category: {
    name: string
    handle: string
    parent_category?: { name: string; handle: string } | null
  } | null
): BreadcrumbItem[] {
  if (!category) return []

  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "All Products", href: "/store" },
  ]

  // Walk up parent chain and collect ancestors
  const ancestors: { name: string; handle: string }[] = []
  let current = category.parent_category
  while (current) {
    ancestors.unshift(current)
    current = (current as any).parent_category ?? null
  }

  for (const a of ancestors) {
    items.push({ label: a.name, href: `/categories/${a.handle}` })
  }

  items.push({ label: category.name })

  return items
}
