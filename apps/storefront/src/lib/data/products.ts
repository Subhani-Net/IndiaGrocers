"use server"

import { sdk } from "@lib/config"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode?: string
  regionId?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = { ...(await getAuthHeaders()) }
  const next = { ...(await getCacheOptions("products")) }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      "/store/products",
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region?.id,
          fields:
            "*variants.calculated_price,categories.id,categories.name,+variants.inventory_quantity,*variants.images,+metadata,+tags,+thumbnail,+description,",
          ...queryParams,
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null
      return {
        response: { products, count },
        nextPage,
        queryParams,
      }
    })
}

export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
  minPrice,
  maxPrice,
  brand,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
  minPrice?: number
  maxPrice?: number
  brand?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 12

  const { response: { products, count } } = await listProducts({
    pageParam: 0,
    queryParams: { ...queryParams, limit: 100 },
    countryCode,
  })

  let filteredProducts = [...products]

  if (minPrice != null) {
    const minVal = minPrice * 100
    filteredProducts = filteredProducts.filter((product) =>
      product.variants?.some(
        (v) =>
          v.calculated_price?.calculated_amount != null &&
          v.calculated_price.calculated_amount >= minVal
      )
    )
  }

  if (maxPrice != null) {
    const maxVal = maxPrice * 100
    filteredProducts = filteredProducts.filter((product) =>
      product.variants?.some(
        (v) =>
          v.calculated_price?.calculated_amount != null &&
          v.calculated_price.calculated_amount <= maxVal
      )
    )
  }

  if (brand) {
    filteredProducts = filteredProducts.filter((product) =>
      product.title.toLowerCase().includes(brand.toLowerCase())
    )
  }

  const sortedProducts = sortProducts(filteredProducts, sortBy)
  const pageParam = (page - 1) * limit
  const filteredCount = sortedProducts.length
  const nextPage = filteredCount > pageParam + limit ? pageParam + limit : null
  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: { products: paginatedProducts, count: filteredCount },
    nextPage,
    queryParams,
  }
}

/**
 * Server action for Load More: fetch a single page of products
 */
export async function fetchProductsPage({
  page,
  countryCode,
  collectionId,
  categoryId,
  searchQuery,
  limit: customLimit,
}: {
  page: number
  countryCode: string
  collectionId?: string
  categoryId?: string
  searchQuery?: string
  limit?: number
}): Promise<{ products: HttpTypes.StoreProduct[]; count: number; page: number }> {
  const limit = customLimit || 12
  const offset = (page - 1) * limit

  const queryParams: any = { limit, offset }
  if (collectionId) queryParams.collection_id = [collectionId]
  if (categoryId) queryParams.category_id = [categoryId]
  if (searchQuery) queryParams.q = searchQuery

  const region = await getRegion(countryCode)
  if (!region) return { products: [], count: 0, page }

  const headers = { ...(await getAuthHeaders()) }
  const next = { ...(await getCacheOptions("products")) }

  const { products, count } = await sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>("/store/products", {
      method: "GET",
      query: {
        limit,
        offset,
        region_id: region.id,
        fields: "title,*variants.calculated_price,*variants.metadata,variants.title,variants.id,categories.id,categories.name,+variants.inventory_quantity,*variants.images,*metadata,*tags,*thumbnail,*description,",
        ...queryParams,
      },
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ products, count }) => ({ products, count }))

  return { products, count, page }
}

/**
 * Fetch full products by their Medusa IDs, preserving sort order from MeiliSearch.
 * Used after MeiliSearch returns ranked IDs — fetches full variant/pricing/image data.
 */
export async function fetchProductsByIds({
  ids,
  countryCode,
}: {
  ids: string[]
  countryCode: string
}): Promise<HttpTypes.StoreProduct[]> {
  if (!ids.length) return []

  const region = await getRegion(countryCode)
  if (!region) return []

  const headers = { ...(await getAuthHeaders()) }
  const next = { ...(await getCacheOptions("products")) }

  const { products } = await sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[] }>("/store/products", {
      method: "GET",
      query: {
        id: ids,
        region_id: region.id,
        limit: ids.length,
        fields: "title,*variants.calculated_price,*variants.metadata,variants.title,variants.id,categories.id,categories.name,+variants.inventory_quantity,*variants.images,*metadata,*tags,*thumbnail,*description,",
      },
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ products }) => ({ products }))

  // Re-sort products to match the MeiliSearch ID order
  const productMap = new Map((products || []).map((p: any) => [p.id, p]))
  return ids.map((id) => productMap.get(id)).filter(Boolean) as HttpTypes.StoreProduct[]
}
