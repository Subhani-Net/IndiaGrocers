import { Metadata } from "next"
import { Suspense } from "react"
import { listCategories } from "@lib/data/categories"
import SearchTemplate from "@modules/search/templates"

export const metadata: Metadata = {
  title: "Search Products | IndiaGrocers",
  description: "Search for Indian groceries, spices, rice, dals and more",
}

type Props = {
  params: Promise<{ countryCode: string }>
}

export default async function SearchPage(props: Props) {
  const { countryCode } = await props.params

  const categories = await listCategories().catch(() => [])

  const parentCategories = (Array.isArray(categories) ? categories : [])
    .filter((c: any) => !c.parent_category_id)
    .slice(0, 12)
    .map((c: any) => ({ name: c.name, handle: c.handle }))

  return (
    <Suspense>
      <SearchTemplate categoryChips={parentCategories} countryCode={countryCode} />
    </Suspense>
  )
}
