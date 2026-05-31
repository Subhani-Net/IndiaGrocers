import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { fetchProductsByIds } from "@lib/data/products"
import { listRegions } from "@lib/data/regions"
import { searchProducts } from "@lib/search-client"
import { StoreRegion } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import WeightHeavyCategoryTemplate from "@modules/categories/templates/weight-heavy"
import BrandShowcaseCategoryTemplate from "@modules/categories/templates/brand-showcase"
import StandardGridCategoryTemplate from "@modules/categories/templates/standard-grid"
import ComingSoonPage from "@modules/categories/templates/coming-soon"
import { getCategoryPhase } from "@lib/util/category-phase"
import { getPseudoQuery } from "@lib/util/pseudo-query"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    minPrice?: string
    maxPrice?: string
    brand?: string
  }>
}

export const revalidate = 300

export async function generateStaticParams() {
  const product_categories = await listCategories()
  if (!product_categories) return []

  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
  )

  const categoryHandles = product_categories.map((c: any) => c.handle)
  return countryCodes
    ?.map((countryCode: string | undefined) =>
      categoryHandles.map((handle: any) => ({
        countryCode,
        category: [handle],
      }))
    )
    .flat()
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)
    const title = `${productCategory.name} | IndiaGrocers`
    const description = productCategory.description ?? `${productCategory.name} — fresh Indian groceries delivered in London.`
    return {
      title,
      description,
      alternates: { canonical: `${params.category.join("/")}` },
    }
  } catch {
    notFound()
  }
}

const WEIGHT_HEAVY_HANDLES = new Set([
  "grains",
  "lentils",
  "flours",
])

const BRAND_SHOWCASE_HANDLES = new Set([
  "spices",
])

function getTemplateType(handle: string): "weight-heavy" | "brand-showcase" | "standard" {
  if (WEIGHT_HEAVY_HANDLES.has(handle)) return "weight-heavy"
  if (BRAND_SHOWCASE_HANDLES.has(handle)) return "brand-showcase"
  return "standard"
}

/**
 * Resolve a category + all its descendant child handles.
 * Used to build MeiliSearch IN filter so browsing a parent shows
 * products from all its subcategories.
 */
function resolveCategoryHandles(category: any): string[] {
  const handles = [category.handle]
  const children = category.category_children || []
  for (const child of children) {
    handles.push(...resolveCategoryHandles(child))
  }
  return handles
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page, minPrice, maxPrice, brand } = searchParams

  const productCategory = await getCategoryByHandle(params.category)
  if (!productCategory) notFound()

  const countryCode = params.countryCode

  // Resolve current category + all child subcategory handles
  const resolvedHandles = resolveCategoryHandles(productCategory)

  // Build MeiliSearch filter — IN for multiple handles, = for single leaf
  const categoryFilter = resolvedHandles.length > 1
    ? `category_handle IN [${resolvedHandles.map((h) => `"${h}"`).join(", ")}]`
    : `category_handle = "${resolvedHandles[0]}"`

  // Build pseudo-query: use current category's tags, or fallback to first child's
  let pseudoQuery = getPseudoQuery(productCategory.handle)
  if (!pseudoQuery && resolvedHandles.length > 1) {
    // Parent has no tags — try children
    for (const handle of resolvedHandles.slice(1)) {
      pseudoQuery = getPseudoQuery(handle)
      if (pseudoQuery) break
    }
  }

  // 1. Query MeiliSearch for product IDs by category relevance
  const { products: meiliHits, totalCount } = await searchProducts(pseudoQuery, {
    limit: 200,
    filter: categoryFilter,
  })

  // 2. Fetch full product data from Medusa by IDs (preserving MeiliSearch sort order)
  const productIds = meiliHits.map((h: any) => h.id)
  let products = await fetchProductsByIds({ ids: productIds, countryCode })
  let count = totalCount

  // Safety fallback: if tree resolution found nothing, re-fetch parent category
  if (products.length === 0 && productCategory.parent_category) {
    const parentHandle = (productCategory.parent_category as any).handle
    const parent = await getCategoryByHandle([parentHandle])
    if (parent) {
      const parentHandles = resolveCategoryHandles(parent)
      const parentFilter = parentHandles.length > 1
        ? `category_handle IN [${parentHandles.map((h) => `"${h}"`).join(", ")}]`
        : `category_handle = "${parentHandles[0]}"`
      const { products: fallbackHits, totalCount: fallbackCount } = await searchProducts(pseudoQuery, {
        limit: 200,
        filter: parentFilter,
      })
      const fallbackIds = fallbackHits.map((h: any) => h.id)
      products = await fetchProductsByIds({ ids: fallbackIds, countryCode })
      count = fallbackCount
    }
  }

  let filteredProducts = products
  const minP = minPrice ? parseFloat(minPrice) * 100 : undefined
  const maxP = maxPrice ? parseFloat(maxPrice) * 100 : undefined

  if (minP != null) {
    filteredProducts = filteredProducts.filter((p: any) =>
      p.variants?.some(
        (v: any) =>
          v.calculated_price?.calculated_amount != null &&
          v.calculated_price.calculated_amount >= minP
      )
    )
  }
  if (maxP != null) {
    filteredProducts = filteredProducts.filter((p: any) =>
      p.variants?.some(
        (v: any) =>
          v.calculated_price?.calculated_amount != null &&
          v.calculated_price.calculated_amount <= maxP
      )
    )
  }
  if (brand) {
    filteredProducts = filteredProducts.filter(
      (p: any) =>
        (p.metadata as any)?.brand_slug === brand ||
        (p.title || "").toLowerCase().includes(brand.toLowerCase())
    )
  }

  const phase = getCategoryPhase(params.category[0] || productCategory.handle || "")
  if (phase === 2 || phase === 3) {
    return (
      <ComingSoonPage
        categoryName={productCategory.name}
        categoryDescription={productCategory.description}
        phase={phase}
      />
    )
  }

  const templateType = getTemplateType(params.category[0] || productCategory.handle || "")

  const sharedProps = {
    category: productCategory as any,
    initialProducts: filteredProducts as any[],
    totalCount: filteredProducts.length,
    countryCode,
    page: 1,
    sortBy: sortBy || "default" as SortOptions,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    brand: brand || undefined,
  }

  switch (templateType) {
    case "weight-heavy":
      return <Suspense><WeightHeavyCategoryTemplate {...sharedProps} /></Suspense>
    case "brand-showcase":
      return <Suspense><BrandShowcaseCategoryTemplate {...sharedProps} /></Suspense>
    default:
      return <Suspense><StandardGridCategoryTemplate {...sharedProps} categoryHandle={productCategory.handle} /></Suspense>
  }
}
