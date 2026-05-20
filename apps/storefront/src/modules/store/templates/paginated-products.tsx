import { fetchProductsPage } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductGridLoadMore from "@modules/store/templates/product-grid-load-more"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type LoadMoreParams = {
  collectionId?: string
  categoryId?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  minPrice?: number
  maxPrice?: number
  brand?: string
}) {
  const region = await getRegion(countryCode)
  if (!region) return null

  const loadMoreParams: LoadMoreParams = {}
  if (collectionId) loadMoreParams.collectionId = collectionId
  if (categoryId) loadMoreParams.categoryId = categoryId

  const { products, count } = await fetchProductsPage({
    page: 1,
    countryCode,
    collectionId,
    categoryId,
  })

  return (
    <ProductGridLoadMore
      initialProducts={products}
      totalCount={count}
      region={region}
      countryCode={countryCode}
      loadMoreParams={loadMoreParams}
    />
  )
}
