import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const revalidate = 60 // ISR: revalidate every 1 minute

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    minPrice?: string
    maxPrice?: string
    brand?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { sortBy, page, minPrice, maxPrice, brand } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      minPrice={minPrice ? parseFloat(minPrice) : undefined}
      maxPrice={maxPrice ? parseFloat(maxPrice) : undefined}
      brand={brand || undefined}
      countryCode={params.countryCode}
    />
  )
}
