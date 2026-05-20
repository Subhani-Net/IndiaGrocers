import { HttpTypes } from "@medusajs/types"
import ProductCard from "./product-card"

export default function ProductPreview({
  product,
  region,
  isFeatured,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  isFeatured?: boolean
}) {
  return <ProductCard product={product} region={region} isFeatured={isFeatured} />
}
