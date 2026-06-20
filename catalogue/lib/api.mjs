/**
 * Medusa Admin API client.
 * Handles authentication, paginated fetches, create, update, and MeiliSearch triggers.
 */
import { BASE, ADMIN_CREDS } from "./constants.mjs"
import { execSync } from "child_process"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

let _headers = null

/**
 * Authenticate with Medusa Admin API and cache the token.
 * @returns {Promise<Record<string, string>>} Auth headers
 */
export async function getHeaders() {
  if (_headers) return _headers
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ADMIN_CREDS),
  })
  if (!res.ok) throw new Error(`Login failed: ${res.status}`)
  const { token } = await res.json()
  _headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
  return _headers
}

/** @returns {Record<string, string>} Cached headers (throws if not yet authenticated) */
export function headers() {
  if (!_headers) throw new Error("Not authenticated — call getHeaders() first")
  return _headers
}

// ── Generic fetch helpers ──────────────────────────────────

/** Fetch all pages of a paginated endpoint. */
export async function fetchAll(path, { limit = 100, fieldKey, extraParams = "" } = {}) {
  const H = headers()
  const all = []
  let offset = 0
  while (true) {
    const url = `${BASE}${path}?limit=${limit}&offset=${offset}${extraParams}`
    const res = await fetch(url, { headers: H })
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`)
    const data = await res.json()
    const items = fieldKey ? (data[fieldKey] || []) : data
    all.push(...items)
    if (!fieldKey) break
    if (items.length < limit) break
    offset += limit
  }
  return all
}

// ── Categories ─────────────────────────────────────────────

export async function fetchCategories() {
  return fetchAll("/admin/product-categories", {
    fieldKey: "product_categories",
    extraParams: "&fields=id,handle,name,is_active,rank,description,parent_category_id",
  })
}

export async function createCategory(body) {
  const res = await fetch(`${BASE}/admin/product-categories`, {
    method: "POST", headers: headers(), body: JSON.stringify(body),
  })
  return res
}

export async function updateCategory(id, body) {
  const res = await fetch(`${BASE}/admin/product-categories/${id}`, {
    method: "POST", headers: headers(), body: JSON.stringify(body),
  })
  return res
}

// ── Products ───────────────────────────────────────────────

export async function fetchProducts() {
  return fetchAll("/admin/products", {
    fieldKey: "products",
    extraParams:
      "&fields=handle,id,title,description,subtitle,thumbnail,status,metadata," +
      "categories.id,categories.handle,collection.handle,collection.id," +
      "options.id,options.title,options.values," +
      "variants.id,variants.title,variants.sku,variants.metadata," +
      "variants.prices.amount,variants.prices.currency_code",
  })
}

export async function createProduct(body) {
  const res = await fetch(`${BASE}/admin/products`, {
    method: "POST", headers: headers(), body: JSON.stringify(body),
  })
  return res
}

export async function updateProduct(id, body) {
  const res = await fetch(`${BASE}/admin/products/${id}`, {
    method: "POST", headers: headers(), body: JSON.stringify(body),
  })
  return res
}

export async function updateVariantPrice(productId, variantId, amount) {
  const res = await fetch(`${BASE}/admin/products/${productId}/variants/${variantId}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ prices: [{ currency_code: "gbp", amount }] }),
  })
  return res
}

// ── Sales channels ─────────────────────────────────────────

export async function fetchFirstSalesChannel() {
  const res = await fetch(`${BASE}/admin/sales-channels?limit=1&fields=id`, { headers: headers() })
  const data = await res.json()
  return data.sales_channels?.[0]
}

export async function linkProductToSalesChannel(salesChannelId, productId) {
  await fetch(`${BASE}/admin/sales-channels/${salesChannelId}/products`, {
    method: "POST", headers: headers(), body: JSON.stringify({ add: [productId] }),
  })
}

// ── Shipping profiles ──────────────────────────────────────

export async function fetchFirstShippingProfile() {
  const res = await fetch(`${BASE}/admin/shipping-profiles?limit=1&fields=id`, { headers: headers() })
  const data = await res.json()
  return data.shipping_profiles?.[0]
}

// ── Inventory ──────────────────────────────────────────────

export async function fetchFirstStockLocation() {
  const res = await fetch(`${BASE}/admin/stock-locations?limit=1&fields=id,name`, { headers: headers() })
  const data = await res.json()
  return data.stock_locations?.[0]
}

export async function createInventoryLevel(inventoryItemId, locationId, quantity = 1_000_000) {
  await fetch(`${BASE}/admin/inventory-items/${inventoryItemId}/location-levels`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ location_id: locationId, stocked_quantity: quantity }),
  })
}

/** Fetch product variants with inventory_item_ids (for inventory setup). */
export async function fetchProductVariants(productId) {
  const res = await fetch(
    `${BASE}/admin/products/${productId}?fields=variants.id,variants.inventory_items.inventory_item_id`,
    { headers: headers() }
  )
  const data = await res.json()
  return data.product?.variants || []
}

// ── Publishable API key ───────────────────────────────────

/** Fetch the first publishable API key token for storefront auto-sync. */
export async function fetchPublishableKey() {
  const res = await fetch(`${BASE}/admin/api-keys?limit=1&type=publishable&fields=token`, { headers: headers() })
  const data = await res.json()
  return (data.api_keys || [])[0]?.token || null
}

// ── Collections ────────────────────────────────────────────

export async function fetchCollections() {
  return fetchAll("/admin/collections", {
    fieldKey: "collections",
    extraParams: "&fields=id,handle,title",
  })
}

export async function createCollection(body) {
  const res = await fetch(`${BASE}/admin/collections`, {
    method: "POST", headers: headers(), body: JSON.stringify(body),
  })
  return res
}

export async function updateCollection(id, body) {
  const res = await fetch(`${BASE}/admin/collections/${id}`, {
    method: "POST", headers: headers(), body: JSON.stringify(body),
  })
  return res
}

// ── MeiliSearch reindex ────────────────────────────────────

export function triggerReindex() {
  execSync("npm run reindex", {
    cwd: resolve(__dirname, "..", "..", "apps", "meilisearch"),
    stdio: "pipe",
  })
}
