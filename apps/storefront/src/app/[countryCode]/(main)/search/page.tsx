import { Metadata } from "next"
import { Suspense } from "react"
import { listCategories } from "@lib/data/categories"
import { searchProducts } from "@lib/search-client"
import { fetchProductsByIds } from "@lib/data/products"
import SearchTemplate from "@modules/search/templates"
import { HttpTypes } from "@medusajs/types"

export const metadata: Metadata = {
  title: "Search Products | IndiaGrocers",
  description: "Search for Indian groceries, spices, rice, dals and more",
}

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SearchPage(props: Props) {
  const { countryCode } = await props.params
  const searchParams = await props.searchParams

  const q = (searchParams?.q as string)?.trim() || ""
  const dietary = searchParams?.dietary as string | undefined
  const brand = searchParams?.brand as string | undefined
  const sort = searchParams?.sort as string | undefined
  const maxPrice = searchParams?.maxPrice as string | undefined
  const page = parseInt((searchParams?.page as string) || "1", 10) || 1

  // Build MeiliSearch filter from URL params
  const filterParts: string[] = []
  if (dietary) filterParts.push(`metadata.dietary_flags = "${dietary}"`)
  if (brand) filterParts.push(`metadata.brand_slug = "${brand.toLowerCase()}"`)
  if (maxPrice) filterParts.push(`price_gbp <= ${parseFloat(maxPrice) * 100}`)
  const filter = filterParts.join(" AND ")

  // Fetch categories for chips (always needed)
  const categories = await listCategories().catch(() => [])

  const parentCategories = (Array.isArray(categories) ? categories : [])
    .filter((c: any) => !c.parent_category_id)
    .slice(0, 12)
    .map((c: any) => ({ name: c.name, handle: c.handle }))

  // Fetch search results (only when query is present)
  let initialResults: HttpTypes.StoreProduct[] = []
  let initialTotal = 0

  if (q) {
    try {
      const limit = 12
      const offset = (page - 1) * limit

      const options: any = { limit, offset }
      if (filter) options.filter = filter
      if (sort) options.sort = [sort]

      const { products: hits, totalCount } = await searchProducts(q, options)

      if (hits.length) {
        const hitIds = hits.map((h: any) => h.id)
        initialResults = await fetchProductsByIds({ ids: hitIds, countryCode })
        initialTotal = totalCount
      }
    } catch {
      // Silent fallback — empty results rendered
    }
  }

  return (
    <Suspense>
      <SearchTemplate
        categoryChips={parentCategories}
        countryCode={countryCode}
        initialResults={initialResults}
        initialTotal={initialTotal}
        initialQuery={q}
        initialPage={page}
        initialDietary={dietary || null}
        initialBrand={brand || null}
        initialSort={sort || ""}
      />
    </Suspense>
  )
}
