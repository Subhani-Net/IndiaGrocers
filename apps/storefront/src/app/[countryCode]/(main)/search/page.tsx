import { Metadata } from "next"
import { Suspense } from "react"
import { listCategories } from "@lib/data/categories"
import SearchTemplate from "@modules/search/templates"

export const metadata: Metadata = {
  title: "Search Products | IndiaGrocers",
  description: "Search for Indian groceries, spices, rice, dals and more",
}

export default async function SearchPage() {
  // Fetch categories dynamically for chips
  const categories = await listCategories().catch(() => [])

  // Extract parent category names for quick-filter chips
  const parentCategories = (Array.isArray(categories) ? categories : [])
    .filter((c: any) => !c.parent_category_id)
    .slice(0, 12)
    .map((c: any) => ({ name: c.name, handle: c.handle }))

  return (
    <Suspense>
      <SearchTemplate categoryChips={parentCategories} />
    </Suspense>
  )
}
