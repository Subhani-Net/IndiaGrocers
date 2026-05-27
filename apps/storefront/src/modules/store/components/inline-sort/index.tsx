"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

export type SortOptions =
  | "price_asc"
  | "price_desc"
  | "created_at"
  | "title_asc"
  | "title_desc"
  | "weight_desc"

type InlineSortProps = {
  sortBy: SortOptions
}

const sortLabels: Record<SortOptions, string> = {
  created_at: "Latest Arrivals",
  price_asc: "Price: Low → High",
  price_desc: "Price: High → Low",
  title_asc: "Name: A → Z",
  title_desc: "Name: Z → A",
  weight_desc: "Weight: Largest First",
}

const InlineSort = ({ sortBy }: InlineSortProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sortBy", value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="sort-select" className="text-grey-50 flex-shrink-0">
        Sort:
      </label>
      <select
        id="sort-select"
        value={sortBy}
        onChange={(e) => handleChange(e.target.value)}
        className="h-9 px-3 text-sm border border-gray-300 rounded-lg bg-white text-grey-90 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange cursor-pointer"
      >
        {Object.entries(sortLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default InlineSort
