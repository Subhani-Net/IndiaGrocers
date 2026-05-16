"use client"

import { clx } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function Pagination({
  page,
  totalPages,
  count,
  'data-testid': dataTestid
}: {
  page: number
  totalPages: number
  count?: number
  'data-testid'?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Helper function to generate an array of numbers within a range
  const arrayRange = (start: number, stop: number) =>
    Array.from({ length: stop - start + 1 }, (_, index) => start + index)

  // Function to handle page changes
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  // Function to render a page button
  const renderPageButton = (
    p: number,
    label: string | number,
    isCurrent: boolean
  ) => (
    <button
      key={p}
      className={clx(
        "w-9 h-9 rounded-full text-sm font-medium transition-all duration-200",
        {
          "bg-brand-orange text-white": isCurrent,
          "border border-grey-20 text-grey-60 hover:border-brand-orange hover:text-brand-orange": !isCurrent,
        }
      )}
      disabled={isCurrent}
      onClick={() => handlePageChange(p)}
    >
      {label}
    </button>
  )

  // Function to render ellipsis
  const renderEllipsis = (key: string) => (
    <span
      key={key}
      className="txt-xlarge-plus text-ui-fg-muted items-center cursor-default"
    >
      ...
    </span>
  )

  // Function to render page buttons based on the current page and total pages
  const renderPageButtons = () => {
    const buttons = []

    if (totalPages <= 7) {
      // Show all pages
      buttons.push(
        ...arrayRange(1, totalPages).map((p) =>
          renderPageButton(p, p, p === page)
        )
      )
    } else {
      // Handle different cases for displaying pages and ellipses
      if (page <= 4) {
        // Show 1, 2, 3, 4, 5, ..., lastpage
        buttons.push(
          ...arrayRange(1, 5).map((p) => renderPageButton(p, p, p === page))
        )
        buttons.push(renderEllipsis("ellipsis1"))
        buttons.push(
          renderPageButton(totalPages, totalPages, totalPages === page)
        )
      } else if (page >= totalPages - 3) {
        // Show 1, ..., lastpage - 4, lastpage - 3, lastpage - 2, lastpage - 1, lastpage
        buttons.push(renderPageButton(1, 1, 1 === page))
        buttons.push(renderEllipsis("ellipsis2"))
        buttons.push(
          ...arrayRange(totalPages - 4, totalPages).map((p) =>
            renderPageButton(p, p, p === page)
          )
        )
      } else {
        // Show 1, ..., page - 1, page, page + 1, ..., lastpage
        buttons.push(renderPageButton(1, 1, 1 === page))
        buttons.push(renderEllipsis("ellipsis3"))
        buttons.push(
          ...arrayRange(page - 1, page + 1).map((p) =>
            renderPageButton(p, p, p === page)
          )
        )
        buttons.push(renderEllipsis("ellipsis4"))
        buttons.push(
          renderPageButton(totalPages, totalPages, totalPages === page)
        )
      }
    }

    return buttons
  }

  // Render the component
  const startItem = count ? (page - 1) * 12 + 1 : 0
  const endItem = count ? Math.min(page * 12, count) : 0

  return (
    <div className="flex flex-col items-center w-full mt-12 gap-4" data-testid={dataTestid}>
      {count != null && count > 0 && (
        <p className="text-sm text-grey-50">
          Showing {startItem}&ndash;{endItem} of {count} products
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
          className={clx(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
            page <= 1
              ? "border-grey-20 text-grey-30 cursor-not-allowed"
              : "border-grey-20 text-grey-60 hover:border-brand-orange hover:text-brand-orange"
          )}
        >
          &larr; Previous
        </button>
        <div className="flex gap-1.5 items-center mx-2">{renderPageButtons()}</div>
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages}
          className={clx(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
            page >= totalPages
              ? "border-grey-20 text-grey-30 cursor-not-allowed"
              : "border-grey-20 text-grey-60 hover:border-brand-orange hover:text-brand-orange"
          )}
        >
          Next &rarr;
        </button>
      </div>
    </div>
  )
}
