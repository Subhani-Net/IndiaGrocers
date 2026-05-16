import { Metadata } from "next"
import BrandsTemplate from "@modules/brands/templates"

export const metadata: Metadata = {
  title: "Brands | IndiaGrocers London",
  description: "Browse Indian grocery brands A-Z — Aachi, Haldiram, Tata, Daawat, Deepak and more",
}

export default function BrandsPage() {
  return <BrandsTemplate />
}
