import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getBulkInventory } from "@lib/data/inventory"
import { getCategoryByHandle } from "@lib/data/categories"
import { getRegion, listRegions } from "@lib/data/regions"
import GroceryProductTemplate from "@modules/products/templates/grocery-pdp"
import { HttpTypes } from "@medusajs/types"
import { BreadcrumbItem } from "@modules/common/components/breadcrumb"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )
    if (!countryCodes) return []

    const promises = countryCodes.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })
      return { country, products: response.products }
    })

    const countryProducts = await Promise.all(promises)
    return countryProducts
      .flatMap((cd) =>
        cd.products.map((p) => ({
          countryCode: cd.country,
          handle: p.handle,
        }))
      )
      .filter((p) => p.handle)
  } catch {
    return []
  }
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  if (!selectedVariantId || !product.variants) return product.images
  const variant = product.variants.find((v) => v.id === selectedVariantId)
  if (!variant?.images?.length) return product.images ?? null
  const imageIdsMap = new Map(variant.images.map((i) => [i.id, true as const]))
  return product.images?.filter((i) => imageIdsMap.has(i.id))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const searchParams = await props.searchParams
  const region = await getRegion(params.countryCode)
  if (!region) notFound()

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle },
  }).then(({ response }) => response.products[0])

  if (!product) notFound()

  const meta = product.metadata as Record<string, unknown> | undefined
  const brand = (meta?.brand_slug as string)
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase())

  const title = brand
    ? `${product.title} by ${brand} | IndiaGrocers`
    : `${product.title} | IndiaGrocers`

  const description =
    (product.description?.slice(0, 155) || `${product.title} — fresh Indian groceries delivered in London.`)

  const variantId = searchParams.v_id
  const canonical = variantId
    ? `/${params.countryCode}/products/${params.handle}?v_id=${variantId}`
    : `/${params.countryCode}/products/${params.handle}`

  // JSON-LD structured data for Google Shopping
  const firstVariant = product.variants?.[0]
  const price = firstVariant?.calculated_price?.calculated_amount

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.thumbnail,
    description: product.description,
    sku: firstVariant?.sku,
    brand: brand ? { "@type": "Brand", name: brand } : undefined,
    offers: price
      ? {
          "@type": "Offer",
          price: (price / 100).toFixed(2),
          priceCurrency: "GBP",
          availability: inventoryMap?.[firstVariant?.id]?.availability != null
            ? "https://schema.org/InStock"
            : "https://schema.org/InStock",
        }
      : undefined,
  }

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      images: product.thumbnail ? [product.thumbnail] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
    other: {
      "script:ld+json": JSON.stringify(jsonLd),
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const region = await getRegion(params.countryCode)

  if (!region) notFound()

  const pricedProduct = await listProducts({
    countryCode: params.countryCode,
    queryParams: {
      handle: params.handle,
      fields:
        "*variants.calculated_price,*variants.metadata,categories.id,categories.name,categories.handle,*variants.images,*metadata,*tags,*thumbnail,*description,*collection",
    },
  }).then(({ response }) => response.products[0])

  if (!pricedProduct) notFound()

  const variantIds = (pricedProduct.variants ?? []).map((v: any) => v.id)
  const inventoryMap = await getBulkInventory(variantIds)

  const images =
    getImagesForVariant(pricedProduct, searchParams.v_id) ??
    pricedProduct.images ??
    []

  // Build breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
  ]

  // Try to get primary category for breadcrumbs
  const primaryCategory = pricedProduct.categories?.[0]
  if (primaryCategory) {
    try {
      const cat = await getCategoryByHandle([primaryCategory.handle ?? ""])
      if (cat) {
        // Walk parent chain
        const ancestors: { name: string; handle: string }[] = []
        let current: any = cat.parent_category
        while (current) {
          ancestors.unshift(current)
          current = current.parent_category ?? null
        }
        breadcrumbs.push({ label: "Store", href: "/store" })
        for (const a of ancestors) {
          breadcrumbs.push({ label: a.name, href: `/categories/${a.handle}` })
        }
        breadcrumbs.push({
          label: cat.name,
          href: `/categories/${cat.handle}`,
        })
      }
    } catch {}
  }

  breadcrumbs.push({ label: pricedProduct.title })

  return (
    <GroceryProductTemplate
      product={pricedProduct}
      region={region}
      inventoryMap={inventoryMap}
      countryCode={params.countryCode}
      images={images}
      breadcrumbs={breadcrumbs}
    />
  )
}
