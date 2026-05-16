import { Metadata } from "next"
import { Suspense } from "react"
import SearchTemplate from "@modules/search/templates"

export const metadata: Metadata = {
  title: "Search Products | IndiaGrocers London",
  description: "Search for Indian groceries, spices, rice, dals and more",
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchTemplate />
    </Suspense>
  )
}
