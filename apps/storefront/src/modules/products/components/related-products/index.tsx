import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const queryParams: HttpTypes.StoreProductListParams = {}
  if (region?.id) {
    queryParams.region_id = region.id
  }
  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }
  if (product.tags) {
    queryParams.tag_id = product.tags
      .map((t) => t.id)
      .filter(Boolean) as string[]
  }
  queryParams.is_giftcard = false

  const products = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) => {
    return response.products.filter(
      (responseProduct) => responseProduct.id !== product.id
    )
  })

  if (!products.length) {
    return null
  }

  return (
    <div className="product-page-constraint">
      <div className="flex flex-col text-center mb-8">
        <h2 className="section-title section-title-accent text-2xl font-bold text-grey-90">
          Customers also bought
        </h2>
        <p className="text-grey-50 mt-4 max-w-lg mx-auto">
          You might also want to check out these products.
        </p>
      </div>

      {/* Mobile: horizontal scroll, Desktop: grid */}
      <div className="overflow-x-auto no-scrollbar small:overflow-visible">
        <ul className="flex gap-4 small:grid small:grid-cols-3 medium:grid-cols-4 small:gap-x-6 small:gap-y-8 w-max small:w-full px-1 pb-2 small:pb-0">
          {products.map((product) => (
            <li key={product.id} className="w-[200px] small:w-auto flex-shrink-0 small:flex-shrink">
              <Product region={region} product={product} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
