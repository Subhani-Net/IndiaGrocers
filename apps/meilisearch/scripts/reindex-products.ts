/**
 * MeiliSearch Reindex Script
 *
 * Fetches ALL products from the Medusa backend (via Admin API)
 * and indexes them into the MeiliSearch "products" index.
 *
 * Prerequisites:
 * - Backend running on MEDUSA_BACKEND_URL (default: http://127.0.0.1:9000)
 * - Admin API credentials in env vars or .env file
 *
 * Usage:
 *   set MEDUSA_ADMIN_EMAIL=admin@example.com
 *   set MEDUSA_ADMIN_PASSWORD=password123
 *   npx tsx apps/meilisearch/scripts/reindex-products.ts
 */

import { getProductsIndex } from "../src/index"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://127.0.0.1:9000"
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL || "admin@example.com"
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || "password123"

interface MedusaProduct {
  id: string
  title: string
  handle: string
  subtitle?: string | null
  description?: string | null
  thumbnail?: string | null
  status: string
  created_at: string
  metadata?: Record<string, unknown>
  tags?: Array<{ value: string }>
  categories?: Array<{ id: string; name: string; handle: string }>
  collection?: { id: string; title: string; handle: string } | null
  variants?: Array<{
    id: string
    title: string
    sku?: string | null
    inventory_quantity?: number
    calculated_price?: {
      calculated_amount?: number
      currency_code?: string
    } | null
  }>
}

interface IndexDocument {
  id: string
  title: string
  handle: string
  subtitle: string
  description: string
  thumbnail: string
  status: string
  created_at: string
  price_gbp: number
  weight_grams: number
  category_name: string
  category_handle: string
  collection_title: string
  collection_handle: string
  tags: string[]
  metadata: Record<string, unknown>
  commodity_group: string
  brand_slug: string
}

async function login(): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })

  if (!res.ok) {
    throw new Error(
      `Login failed: ${res.status}. Check MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD`
    )
  }

  const { token } = await res.json()
  return token
}

async function fetchProducts(token: string): Promise<MedusaProduct[]> {
  const allProducts: MedusaProduct[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const res = await fetch(
      `${BACKEND_URL}/admin/products?limit=${limit}&offset=${offset}&fields=*variants,*categories,*collection,*tags,*metadata`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!res.ok) {
      throw new Error(
        `Failed to fetch products: ${res.status} ${res.statusText}`
      )
    }

    const data = await res.json()
    const products = data.products || []
    allProducts.push(...products)

    console.log(`  Fetched ${allProducts.length} of ${data.count || "?"} products...`)

    if (products.length < limit) break
    offset += limit
  }

  return allProducts
}

function transformProduct(p: MedusaProduct): IndexDocument {
  const meta = (p.metadata || {}) as Record<string, unknown>
  const price = p.variants?.[0]?.calculated_price?.calculated_amount || 0
  const maxWeight = Math.max(
    0,
    ...(p.variants || []).map(
      (v: any) => v.metadata?.weight_grams || v.metadata?.weight_value || 0
    )
  )
  const brandSlug = (meta.brand_slug as string) || ""

  // Compute commodity_group by stripping brand prefix from title
  // "Natco - Toor Dal Oily" → "Toor Dal Oily"
  // "Natco - Natco - Chick Peas" → "Chick Peas"
  // "Fresh Veg - Okra / Bhindi" → "Okra / Bhindi"
  let commodityGroup = p.title
  const dashIdx = p.title.indexOf(" - ")
  if (dashIdx > 0) {
    let stripped = p.title.slice(dashIdx + 3).trim()
    // Handle double-branded titles: "Natco - Natco - Chick Peas"
    const secondDash = stripped.indexOf(" - ")
    if (secondDash > 0) {
      stripped = stripped.slice(secondDash + 3).trim()
    }
    commodityGroup = stripped
  }

  return {
    id: p.id,
    title: p.title,
    handle: p.handle,
    subtitle: p.subtitle || "",
    description: p.description || "",
    thumbnail: p.thumbnail || "",
    status: p.status,
    created_at: p.created_at,
    price_gbp: price,
    weight_grams: maxWeight,
    category_name: p.categories?.[0]?.name || "",
    category_handle: p.categories?.[0]?.handle || "",
    collection_title: p.collection?.title || "",
    collection_handle: p.collection?.handle || "",
    tags: (p.tags || []).map((t) => t.value),
    metadata: {
      ...meta,
      brand_slug: brandSlug,
      synonyms_text: Array.isArray(meta.synonyms)
        ? (meta.synonyms as string[]).join(" ")
        : "",
    },
    commodity_group: commodityGroup,
    brand_slug: brandSlug,
  }
}

async function main() {
  console.log("MeiliSearch Product Reindex\n")

  // 1. Login to Medusa admin
  console.log("Logging into Medusa admin...")
  const token = await login()
  console.log("  ✓ Authenticated\n")

  // 2. Fetch all products
  console.log("Fetching products from Medusa...")
  const products = await fetchProducts(token)
  console.log(`  ✓ ${products.length} products fetched\n`)

  // 3. DELETE ALL existing documents — clean slate every reindex
  console.log("Clearing existing index...")
  const index = await getProductsIndex()
  try {
    await index.deleteAllDocuments()
    console.log("  ✓ Index cleared")
  } catch (e: any) {
    console.log("  ⚠ Could not clear index:", e.message)
  }

  // 4. Transform for MeiliSearch
  console.log("Transforming and indexing...")
  const documents = products.map(transformProduct)

  // 5. Index into MeiliSearch
  const batchSize = 100
  let indexed = 0

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize)
    await index.addDocuments(batch)
    indexed += batch.length
    console.log(`  Indexed ${indexed}/${documents.length} products...`)
  }

  console.log(`\n✅ Reindex complete: ${documents.length} products indexed.`)
}

main().catch((err) => {
  console.error("❌ Reindex failed:", err.message)
  process.exit(1)
})
