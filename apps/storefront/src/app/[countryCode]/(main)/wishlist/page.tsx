import { Metadata } from "next"
import WishlistTemplate from "@modules/wishlist/templates"

export const metadata: Metadata = {
  title: "Wishlist",
  description: "View your saved products",
}

export default function WishlistPage() {
  return <WishlistTemplate />
}
