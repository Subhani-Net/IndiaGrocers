import { Metadata } from "next"
import { Suspense } from "react"
import OffersTemplate from "@modules/offers/templates"

export const metadata: Metadata = {
  title: "Special Offers | IndiaGrocers London",
  description:
    "Save money with our special offers — Under £5, Under £10, and more",
}

export default function OffersPage() {
  return (
    <Suspense>
      <OffersTemplate />
    </Suspense>
  )
}
