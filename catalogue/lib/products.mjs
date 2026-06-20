/**
 * Product sync pipeline with variant normalization and two-tier upsert.
 *
 * TWO-TIER MATCHING:
 *   Tier 1 — Product match: Look up by handle in DB
 *   Tier 2 — Variant match: Look up by variant_barcode within the product
 *
 * Each variant SKU gets a unique barcode (EAN-13 or GEN_ placeholder).
 */
import {
  fetchProducts, createProduct, updateProduct,
  fetchFirstSalesChannel, linkProductToSalesChannel,
  fetchFirstShippingProfile, fetchFirstStockLocation,
  createInventoryLevel, fetchProductVariants,
} from "./api.mjs"
import {
  UK_ALLERGENS, ALLERGEN_REMAP, VALID_DIETARY_FLAGS,
  VALID_REGIONAL_TAGS,
} from "./constants.mjs"
import { detectBrand, assignBarcode } from "./normalizer.mjs"

/**
 * Sync all product groups to Medusa DB.
 *
 * @param {Array<{handle:string, title:string, brand:string, category_handle:string, variants:Array<Record<string,string>>}>} groups
 * @param {Map<string,string>} catMap — handle → category_id
 * @param {Map<string,string>} colMap — handle → collection_id (optional)
 * @param {Map<string,Array<{amount:number}>>} priceMap — SKU → [{amount, currency}] (optional)
 * @returns {Promise<{ created: number, updated: number, skipped: number, failed: number }>}
 */
export async function syncProducts(groups, catMap, colMap = new Map(), priceMap = new Map()) {
  // Fetch infrastructure
  const dbProducts = await fetchProducts()
  const dbMap = new Map(dbProducts.map(p => [p.handle, p]))
  const shippingProfile = await fetchFirstShippingProfile()
  const salesChannel = await fetchFirstSalesChannel()
  const stockLocation = await fetchFirstStockLocation()

  let created = 0, updated = 0, skipped = 0, failed = 0

  for (const group of groups) {
    const dbProduct = dbMap.get(group.handle)

    try {
      if (!dbProduct) {
        // ══ CREATE ═════════════════════════════════════
        const res = await createProductFromGroup(group, catMap, colMap, shippingProfile)
        if (res.ok) {
          const data = await res.json()
          const newId = data.product?.id
          if (newId && salesChannel?.id) {
            await linkProductToSalesChannel(salesChannel.id, newId)
          }
          // Set inventory levels for all variants
          if (newId && stockLocation?.id) {
            const variants = await fetchProductVariants(newId)
            for (const v of variants) {
              const invItem = v.inventory_items?.[0]
              if (invItem?.inventory_item_id) {
                try {
                  await createInventoryLevel(invItem.inventory_item_id, stockLocation.id)
                } catch { /* inventory link may already exist */ }
              }
            }
          }
          created++
          if (created % 100 === 0) console.log(`  Created ${created} products...`)
        } else {
          const errBody = await res.json().catch(() => ({}))
          failed++
          console.error(`  ✗ CREATE ${group.handle} — ${errBody.message || res.status}`)
        }
      } else {
        // ══ UPDATE ═════════════════════════════════════
        const changes = buildUpdatePayload(group, dbProduct, catMap, colMap)
        if (Object.keys(changes).length > 0) {
          const res = await updateProduct(dbProduct.id, changes)
          if (res.ok) {
            updated++
          } else {
            const errBody = await res.json().catch(() => ({}))
            failed++
            console.error(`  ✗ UPDATE ${group.handle} — ${errBody.message || res.status}`)
          }
        } else {
          skipped++
        }
      }
    } catch (e) {
      failed++
      if (failed <= 10) console.error(`  ✗ ${group.handle} — ${e.message}`)
    }
  }

  return { created, updated, skipped, failed }
}

// ═══════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════

async function createProductFromGroup(group, catMap, colMap, shippingProfile) {
  const firstRow = group.variants[0]
  const hasVariants = group.variants.length > 1

  // Options
  const optionTitle = hasVariants ? "Weight / Size" : "Default"
  const optionValues = hasVariants
    ? group.variants.map(v => v.variant_title)
    : [group.variants[0].variant_title || "Default"]

  // Variants
  const variants = group.variants.map(v => ({
    title: v.variant_title || "Default",
    sku: v.variant_sku || undefined,
    prices: [],
    metadata: buildVariantMeta(v),
  }))

  // Categories
  const categories = []
  if (group.category_handle && catMap.has(group.category_handle)) {
    categories.push({ id: catMap.get(group.category_handle) })
  }

  const body = {
    title: group.title,
    handle: group.handle,
    shipping_profile_id: shippingProfile?.id || undefined,
    status: (firstRow.status === "published" || firstRow.status === "draft")
      ? firstRow.status : "published",
    description: firstRow.description || undefined,
    subtitle: firstRow.subtitle || undefined,
    thumbnail: firstRow.thumbnail_url || undefined,
    options: [{ title: optionTitle, values: optionValues }],
    variants,
    metadata: buildProductMeta(firstRow),
    categories,
  }

  // Images
  const imgs = buildImages(firstRow)
  if (imgs) body.images = imgs

  // Collection
  if (firstRow.collection_handle && colMap.has(firstRow.collection_handle)) {
    body.collection_id = colMap.get(firstRow.collection_handle)
  }

  return createProduct(body)
}

// ═══════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════

function buildUpdatePayload(group, dbProduct, catMap, colMap) {
  const firstRow = group.variants[0]
  const changes = {}

  // Status
  if (firstRow.status && firstRow.status !== dbProduct.status) changes.status = firstRow.status

  // Title
  if (group.title && group.title !== dbProduct.title) changes.title = group.title

  // Description
  if (firstRow.description !== undefined && firstRow.description !== (dbProduct.description || "")) {
    changes.description = firstRow.description
  }

  // Subtitle
  if (firstRow.subtitle !== undefined && firstRow.subtitle !== (dbProduct.subtitle || "")) {
    changes.subtitle = firstRow.subtitle
  }

  // Thumbnail
  if (firstRow.thumbnail_url && firstRow.thumbnail_url !== (dbProduct.thumbnail || "")) {
    changes.thumbnail = firstRow.thumbnail_url
  }

  // Images
  const newImages = buildImages(firstRow)
  const currentImageUrls = (dbProduct.images || []).map(i => i.url).sort().join(",")
  const newImageUrls = newImages ? newImages.map(i => i.url).sort().join(",") : ""
  if (newImages && newImageUrls !== currentImageUrls) {
    changes.images = newImages
  }

  // Metadata
  const dbMeta = dbProduct.metadata || {}
  const newMeta = buildProductMeta(firstRow, dbMeta)
  const metaChanged = Object.keys(newMeta).some(
    k => JSON.stringify(newMeta[k]) !== JSON.stringify(dbMeta[k])
  )
  if (metaChanged) changes.metadata = newMeta

  // Categories (set only if currently empty)
  if (group.category_handle && catMap.has(group.category_handle)) {
    const currentCatIds = (dbProduct.categories || []).map(c => c.id)
    if (currentCatIds.length === 0) {
      changes.categories = [{ id: catMap.get(group.category_handle) }]
    }
  }

  // Collection
  if (firstRow.collection_handle && colMap.has(firstRow.collection_handle)) {
    const colId = colMap.get(firstRow.collection_handle)
    if (!dbProduct.collection || dbProduct.collection.id !== colId) {
      changes.collection_id = colId
    }
  }

  return changes
}

// ═══════════════════════════════════════════════════════════
// METADATA BUILDERS
// ═══════════════════════════════════════════════════════════

/**
 * Build product-level metadata matching the backend Zod schema.
 */
export function buildProductMeta(row, dbMeta = {}) {
  return {
    country_of_origin: dbMeta.country_of_origin || row.country_of_origin || "India",
    uk_food_business_operator: dbMeta.uk_food_business_operator || "IndiaGrocers London",
    ingredients: dbMeta.ingredients || row.ingredients || "See product packaging",
    allergens: dbMeta.allergens || parseAllergens(row.allergens),
    vat_rate: dbMeta.vat_rate ?? (row.vat_rate ? parseFloat(row.vat_rate) : 0),
    velocity: dbMeta.velocity || "B",
    sourcing_tier: dbMeta.sourcing_tier || "B",
    dietary_flags: parseDietaryFlags(row.dietary_flags, dbMeta.dietary_flags),
    regional_tags: parseRegionalTags(row.regional_tags, dbMeta.regional_tags),
    subscription_eligible: dbMeta.subscription_eligible ?? (row.subscription_eligible === "true"),
    requires_fast_delivery: dbMeta.requires_fast_delivery ?? false,
    requires_cold_chain: dbMeta.requires_cold_chain ?? false,
    brand_slug: resolveBrandSlug(row, dbMeta),
    synonyms: dbMeta.synonyms || [],
    // Optional overrides from CSV
    ...(row.storage ? { storage: row.storage } : {}),
    ...(row.weight_value ? { weight_value: parseFloat(row.weight_value) } : {}),
    ...(row.weight_unit ? { weight_unit: row.weight_unit } : {}),
    ...(row.eco_rating ? { eco_rating: row.eco_rating } : {}),
  }
}

/**
 * Build variant-level metadata.
 */
function buildVariantMeta(row) {
  const meta = {}
  if (row.weight_value) meta.weight_value = parseFloat(row.weight_value)
  if (row.weight_unit) meta.weight_unit = row.weight_unit
  if (row.variant_sku) meta.sku = row.variant_sku
  if (row.variant_barcode) meta.barcode = row.variant_barcode
  return Object.keys(meta).length > 0 ? meta : undefined
}

function resolveBrandSlug(row, dbMeta) {
  // Use CSV brand_slug if valid (not "0" or empty)
  const csvBrand = (row.brand_slug || "").trim()
  if (csvBrand && csvBrand !== "0") return csvBrand
  // Use existing DB brand_slug
  if (dbMeta.brand_slug) return dbMeta.brand_slug
  // Auto-detect from title
  return detectBrand(row.product_title || "")
}

function parseAllergens(raw) {
  if (!raw || typeof raw !== "string" || !raw.trim()) return []
  return raw.split(";")
    .map(a => a.trim())
    .filter(Boolean)
    .map(a => ALLERGEN_REMAP[a] || a)
    .filter(a => UK_ALLERGENS.has(a))
}

function parseDietaryFlags(raw, dbFlags) {
  if (raw && typeof raw === "string" && raw.trim()) {
    return raw.split(";").map(f => f.trim()).filter(Boolean).filter(f => VALID_DIETARY_FLAGS.has(f))
  }
  return dbFlags || []
}

function parseRegionalTags(raw, dbTags) {
  if (raw && typeof raw === "string" && raw.trim()) {
    return raw.split(";").map(t => t.trim()).filter(Boolean).filter(t => VALID_REGIONAL_TAGS.has(t))
  }
  return dbTags || []
}

function buildImages(row) {
  if (!row.image_filenames || typeof row.image_filenames !== "string" || !row.image_filenames.trim()) return undefined
  const filenames = row.image_filenames.split(";").filter(Boolean)
  if (filenames.length === 0) return undefined
  return filenames.map(fn => ({ url: `/uploads/${fn}` }))
}
