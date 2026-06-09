"use client"

import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"
import { useEffect, useState, useRef } from "react"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
  region?: any
}

export default function RelatedProducts({
  product,
  countryCode,
  region,
}: RelatedProductsProps) {
  const [relatedProducts, setRelatedProducts] = useState<HttpTypes.StoreProduct[]>([])
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    ;(async () => {
      const queryParams: HttpTypes.StoreProductListParams = {}
      if (region?.id) queryParams.region_id = region.id
      if (product.collection_id) queryParams.collection_id = [product.collection_id]
      if (product.tags) queryParams.tag_id = product.tags.map((t) => t.id).filter(Boolean) as string[]
      queryParams.is_giftcard = false

      const { response } = await listProducts({ queryParams, countryCode })
      if (!mounted.current) return
      setRelatedProducts(response.products.filter((p) => p.id !== product.id))
    })()
    return () => { mounted.current = false }
  }, [product.id, countryCode])

  if (!relatedProducts.length) return null

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

      <div className="overflow-x-auto no-scrollbar small:overflow-visible">
        <ul className="flex gap-4 small:grid small:grid-cols-3 medium:grid-cols-4 small:gap-x-6 small:gap-y-8 w-max small:w-full px-1 pb-2 small:pb-0">
          {relatedProducts.map((p) => (
            <li key={p.id} className="w-[200px] small:w-auto flex-shrink-0 small:flex-shrink">
              <Product region={region} product={p} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
