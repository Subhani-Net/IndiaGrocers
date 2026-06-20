/**
 * SEED CATALOGUE — 5-File Relational B2B Logistics Model v4
 *
 * Files ingested:
 *   1. categories.csv   — taxonomy with parent-child rank order
 *   2. products.csv     — parent profiles (vat_rate, dietary_flags at this level)
 *   3. brands.csv       — brand definitions (handle → brand_name)
 *   4. variants.csv     — child specs (is_active, image_filename, product_handle, brand_handle,
 *                         variant_barcode, backup_barcodes)
 *   5. supplier_skus.csv — procurement mapping (variant_handle → vendor_handle, vendor_sku, cost)
 *   6. vendors.csv       — vendor profiles (handle → name, depot, aisle, lead time, min qty)
 *
 * Usage:
 *   node catalogue/seed-catalogue.mjs --validate-only            # Validate files only
 *   node catalogue/seed-catalogue.mjs --dry-run                  # Full rebuild preview
 *   node catalogue/seed-catalogue.mjs --apply --reindex          # Full destructive rebuild
 *   node catalogue/seed-catalogue.mjs --upsert --reindex         # Incremental upsert (new + changed)
 *   node catalogue/seed-catalogue.mjs --upsert --dry-run         # Preview incremental changes
 *
 * All intermediate work in /tmp/catalog-rebuild/
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from "fs"
import { resolve, dirname, basename, extname, join } from "path"
import { fileURLToPath } from "url"
import { z } from "zod"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "http://127.0.0.1:9000"
const APPLY = process.argv.includes("--apply")
const UPSERT = process.argv.includes("--upsert")
const VALIDATE = process.argv.includes("--validate-only")
const DRY_RUN = process.argv.includes("--dry-run")
const REINDEX = process.argv.includes("--reindex")

// Working directories
const TMP = resolve(__dirname, "..", "tmp", "catalog-rebuild")
const PUBLIC_IMG = resolve(__dirname, "..", "apps", "storefront", "public", "images", "products")
const UPLOADS = resolve(__dirname, "..", "apps", "backend", "uploads")
const MVP_IMG = resolve(__dirname, "mvp", "images")

// Source files
const CAT_CSV = resolve(__dirname, "categories.csv")
const PROD_CSV = resolve(__dirname, "products-v2.csv")
const VAR_CSV = resolve(TMP, "variants.csv")
const BRAND_CSV = resolve(TMP, "brands.csv")
const PRICE_CSV = resolve(__dirname, "prices.csv")
const SUPPLIER_CSV = resolve(TMP, "supplier_skus.csv")
const VENDOR_CSV = resolve(TMP, "vendors.csv")

for (const d of [TMP, PUBLIC_IMG]) { if (!existsSync(d)) mkdirSync(d, { recursive: true }) }

// ═══════════════════════════════════════════════════════════
// CSV UTILITIES
// ═══════════════════════════════════════════════════════════
function parseCSVLine(line) {
  const r = [], n = line.length
  let i = 0, c = "", q = false
  while (i < n) {
    const ch = line[i]
    if (q) {
      if (ch === '"') {
        if (i + 1 < n && line[i + 1] === '"') { c += '"'; i += 2; continue }
        else { q = false; i++; continue }
      }
      c += ch; i++
    } else {
      if (ch === '"') { q = true; i++; continue }
      if (ch === ",") { r.push(c.trim()); c = ""; i++; continue }
      c += ch; i++
    }
  }
  r.push(c.trim())
  return r
}

function loadCSV(filepath) {
  if (!existsSync(filepath)) return { header: [], rows: [] }
  const text = readFileSync(filepath, "utf8").replace(/\r\n/g, "\n")
  const lines = text.trim().split("\n")
  if (lines.length < 2) return { header: [], rows: [] }
  const header = lines[0].split(",").map(h => h.trim())
  const rows = lines.slice(1).map(line => {
    const vals = parseCSVLine(line)
    if (vals.length < header.length) return null
    const obj = {}
    header.forEach((h, i) => (obj[h] = vals[i] || ""))
    return obj
  }).filter(Boolean)
  return { header, rows }
}

function scanImages(dir) {
  if (!existsSync(dir)) return new Map()
  const map = new Map()
  function walk(d) {
    for (const f of readdirSync(d)) {
      const full = join(d, f)
      if (statSync(full).isDirectory()) { walk(full); continue }
      if (/\.(jpg|jpeg|png|webp)$/i.test(f)) map.set(basename(f, extname(f)), full)
    }
  }
  walk(dir)
  return map
}

// Build image inventory — check uploads, mvp/images, and public/images/products
const imageInventory = new Map()
for (const d of [UPLOADS, MVP_IMG, PUBLIC_IMG]) scanImages(d).forEach((v, k) => imageInventory.set(k, v))

// ═══════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════
let H = null
async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  if (!res.ok) throw new Error(`Login failed: ${res.status}`)
  const { token } = await res.json()
  H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
}

// ═══════════════════════════════════════════════════════════
// VALIDATE ONLY
// ═══════════════════════════════════════════════════════════
async function validateOnly() {
  const cats = loadCSV(CAT_CSV)
  const prods = loadCSV(PROD_CSV)
  const vars = loadCSV(VAR_CSV)
  const brands = loadCSV(BRAND_CSV)
  const suppliers = loadCSV(SUPPLIER_CSV)
  const vendors = loadCSV(VENDOR_CSV)

  // Build in-memory maps
  const catMap = new Map(cats.rows.map(r => [r.handle, r]))
  const prodMap = new Map(prods.rows.map(r => [r.handle, r]))
  const brandMap = new Map(brands.rows.map(r => [r.handle, r.brand_name]))
  const supplierMap = new Map(suppliers.rows.map(r => [r.variant_handle.trim(), r]))
  const vendorMap = new Map(vendors.rows.map(r => [r.vendor_handle.trim(), r]))

  console.log(`\nLoaded: ${catMap.size} cats | ${prodMap.size} prods | ${brandMap.size} brands | ${vendorMap.size} vendors | ${vars.rows.length} variants | ${supplierMap.size} supplier_skus`)

  // Filter active variants only
  const activeVariants = vars.rows.filter(r => r.is_active === "true")
  console.log(`Active variants: ${activeVariants.length}/${vars.rows.length}`)

  // ═════════════════════════════════════════════════════════
  // VALIDATE: image files exist for all active variants
  // ═════════════════════════════════════════════════════════
  console.log(`\n── Image Gatekeeper ──`)
  let imageErrors = 0
  for (const [i, v] of activeVariants.entries()) {
    const line = i + 2
    const imgFile = (v.image_filename || "").trim()
    const thumbFile = (v.thumbnail_url || "").trim()
    const pubPath = join(PUBLIC_IMG, imgFile)
    const upPath = join(UPLOADS, imgFile)

    if (!imgFile && !thumbFile) {
      console.error(`  ✗ Row ${line}: no image_filename or thumbnail_url`)
      imageErrors++
      continue
    }
    if (imgFile && !existsSync(pubPath) && !existsSync(upPath)) {
      console.error(`  ✗ Row ${line}: image "${imgFile}" not found`)
      imageErrors++
    }
  }

  if (imageErrors > 0) {
    console.warn(`\n  ⚠ ${imageErrors} products have no images — they will load with empty thumbnails`)
  } else {
    console.log(`  ✓ All ${activeVariants.length} active variants have valid images`)
  }

  console.log(`\n── Validate-only complete. No API calls made.`)
}

// ═══════════════════════════════════════════════════════════
// MAIN — APPLY / DRY-RUN
// ═══════════════════════════════════════════════════════════
async function main() {
  console.log("=".repeat(60))
  console.log("  Seed Catalogue — 6-File Relational")
  console.log(`${APPLY ? "  Mode: APPLY (destructive)" : UPSERT ? "  Mode: UPSERT (incremental)" : DRY_RUN ? "  Mode: DRY RUN" : "  Mode: VALIDATE"}${REINDEX ? " + REINDEX" : ""}`)
  console.log("=".repeat(60))

  if (VALIDATE) { await validateOnly(); return }

  // Load data
  const cats = loadCSV(CAT_CSV)
  const prods = loadCSV(PROD_CSV)
  const vars = loadCSV(VAR_CSV)
  const brands = loadCSV(BRAND_CSV)
  const suppliers = loadCSV(SUPPLIER_CSV)
  const vendors = loadCSV(VENDOR_CSV)
  const catMap = new Map(cats.rows.map(r => [r.handle, r]))
  const prodMap = new Map(prods.rows.map(r => [r.handle, r]))
  const brandMap = new Map(brands.rows.map(r => [r.handle, r.brand_name]))
  const supplierMap = new Map(suppliers.rows.map(r => [r.variant_handle.trim(), r]))
  const vendorMap = new Map(vendors.rows.map(r => [r.vendor_handle.trim(), r]))

  console.log(`\nLoaded: ${catMap.size} cats | ${prodMap.size} prods | ${brandMap.size} brands | ${vendorMap.size} vendors | ${vars.rows.length} variants | ${supplierMap.size} supplier_skus`)

  const activeVariants = vars.rows.filter(r => r.is_active === "true")

  if (DRY_RUN) {
    // Group variants by product_handle + brand_handle
    const groups = new Map()
    for (const v of activeVariants) {
      const key = `${v.product_handle}||${v.brand_handle}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(v)
    }
    console.log(`\n── Dry Run Summary ──`)
    console.log(`  Product-brand groups: ${groups.size}`)
    console.log(`  Active variants: ${activeVariants.length}`)
    console.log(`  Products referenced: ${new Set(activeVariants.map(v => v.product_handle)).size}`)
    console.log(`  Brands referenced: ${new Set(activeVariants.map(v => v.brand_handle)).size}`)
    return
  }

  if (!APPLY && !UPSERT) return
  await login()

  if (APPLY) {
    // ═══════════════════════════════════════════════════════
    // FULL DESTRUCTIVE REBUILD (existing behavior)
    // ═══════════════════════════════════════════════════════
  // ═════════════════════════════════════════════════════════
  console.log(`\n── Destructive Reset ──`)
  for (let off = 0; ; off += 100) {
    const r = await fetch(`${BASE}/admin/products?limit=100&offset=${off}&fields=id`, { headers: H })
    const d = await r.json()
    if (!d.products?.length) break
    for (const p of d.products) await fetch(`${BASE}/admin/products/${p.id}`, { method: "DELETE", headers: H })
  }
  for (let off = 0; ; off += 100) {
    const r = await fetch(`${BASE}/admin/product-categories?limit=100&offset=${off}&fields=id`, { headers: H })
    const d = await r.json()
    if (!d.product_categories?.length) break
    for (const c of d.product_categories) await fetch(`${BASE}/admin/product-categories/${c.id}`, { method: "DELETE", headers: H })
  }
  console.log(`  ✓ DB wiped`)

  // Infrastructure
  const scRes = await fetch(`${BASE}/admin/sales-channels?limit=1&fields=id`, { headers: H })
  const salesChannelId = (await scRes.json()).sales_channels?.[0]?.id
  const spRes = await fetch(`${BASE}/admin/shipping-profiles?limit=1&fields=id`, { headers: H })
  const shippingProfileId = (await spRes.json()).shipping_profiles?.[0]?.id

  // ═════════════════════════════════════════════════════════
  // SEED CATEGORIES
  // ═════════════════════════════════════════════════════════
  console.log(`\n── Seeding Categories ──`)
  const sorted = [...cats.rows].sort((a, b) => {
    const ap = a.parent_handle?.trim(), bp = b.parent_handle?.trim()
    if (!ap && bp) return -1; if (ap && !bp) return 1; return 0
  })
  const catIdMap = new Map()
  for (const c of sorted) {
    const body = { handle: c.handle, name: c.name || c.handle, is_active: true }
    if (c.parent_handle?.trim() && catIdMap.has(c.parent_handle)) body.parent_category_id = catIdMap.get(c.parent_handle)
    if (c.rank) body.rank = parseInt(c.rank, 10)
    if (c.description) body.description = c.description
    const r = await fetch(`${BASE}/admin/product-categories`, { method: "POST", headers: H, body: JSON.stringify(body) })
    if (r.ok) { const id = (await r.json()).product_category?.id; if (id) catIdMap.set(c.handle, id) }
  }
  console.log(`  ✓ ${catIdMap.size} categories`)

  // ═════════════════════════════════════════════════════════
  // SEED PRODUCTS + VARIANTS
  // ═════════════════════════════════════════════════════════
  console.log(`\n── Seeding Products + Variants ──`)

  // Group by product_handle + brand_handle
  const groups = new Map()
  for (const v of activeVariants) {
    const key = `${v.product_handle}||${v.brand_handle}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(v)
  }

  let created = 0, variantsBound = 0
  const seededProductIds = new Map() // product_handle → DB id

  for (const [key, groupedVariants] of groups) {
    const [productHandle, brandHandle] = key.split("||")
    const parent = prodMap.get(productHandle)
    const brandName = brandMap.get(brandHandle) || brandHandle
    if (!parent) continue

    // Title: Brand.brand_name + ' - ' + Product.title
    const title = `${brandName} - ${parent.product_title || productHandle}`

    // Variant payloads — parse barcodes + cross-ref supplier_skus
    const variantPayloads = groupedVariants.map(v => {
      const primaryBc = (v.variant_barcode || "").trim()
      const backupBc = (v.backup_barcodes || "").trim()
      const allBarcodes = [primaryBc]
      if (backupBc && backupBc !== primaryBc) {
        backupBc.split(",").filter(Boolean).map(b => b.trim()).forEach(b => {
          if (!allBarcodes.includes(b)) allBarcodes.push(b)
        })
      }

      // Cross-reference supplier_skus by variant_handle, inherit vendor defaults
      const ph = (v.product_handle || "").trim()
      const sku = (v.variant_sku || "").trim()
      const vh = `${ph}__${sku}`
      const supp = supplierMap.get(vh) || {}
      const vendor = vendorMap.get(supp.vendor_handle) || {}

      return {
        title: v.variant_title || `${v.weight_value}${v.weight_unit}` || "Default",
        sku: sku || undefined,
        prices: [],
        metadata: {
          barcode: primaryBc,
          backup_barcodes: allBarcodes.join(";"),
          all_barcodes: allBarcodes.join(";"),
          sku: sku || "",
          weight_value: v.weight_value ? parseFloat(v.weight_value) : undefined,
          weight_unit: v.weight_unit || undefined,
          sourcing_depot: supp.sourcing_depot || vendor.sourcing_depot || v.sourcing_depot || "",
          brand_handle: brandHandle,
          // Procurement metadata — supplier_sku overrides, vendor is fallback
          vendor_handle: supp.vendor_handle || "",
          vendor_name: vendor.vendor_name || "",
          vendor_sku: supp.vendor_sku || "",
          cost_price_gbp: supp.cost_price_gbp || "",
          warehouse_aisle: supp.warehouse_aisle || vendor.warehouse_aisle || "",
          lead_time_days: supp.lead_time_days || vendor.lead_time_days || "",
          min_order_qty: supp.min_order_qty || vendor.min_order_qty || "",
        },
      }
    })

    const optTitle = variantPayloads.length > 1 ? "Weight / Size" : "Default"
    const thumbnail = groupedVariants[0]?.thumbnail_url?.trim() || groupedVariants[0]?.image_filename?.trim()

    const body = {
      handle: productHandle,
      title,
      subtitle: parent.subtitle || undefined,
      description: parent.description || undefined,
      status: "published",
      shipping_profile_id: shippingProfileId,
      options: [{ title: optTitle, values: variantPayloads.map(v => v.title) }],
      variants: variantPayloads,
      categories: catIdMap.has(parent.category_handle) ? [{ id: catIdMap.get(parent.category_handle) }] : [],
      metadata: {
        country_of_origin: "India",
        uk_food_business_operator: "IndiaGrocers London",
        ingredients: "See product packaging",
        allergens: [],
        vat_rate: parseFloat(parent.vat_rate) || 0,
        velocity: parent.velocity || "B",
        sourcing_tier: "B",
        dietary_flags: (parent.dietary_flags || "").split(";").filter(Boolean).map(f => f.trim()).filter(f => ["vegetarian","vegan","gluten-free","organic"].includes(f)),
        regional_tags: [],
        subscription_eligible: parent.subscription_eligible === "true",
        requires_fast_delivery: false,
        requires_cold_chain: false,
        brand_slug: brandHandle,
        priority_rank: parent.velocity === "A" ? "1" : parent.velocity === "B" ? "2" : "3",
        synonyms: [],
      },
      ...(thumbnail ? { thumbnail: thumbnail.startsWith("http") || thumbnail.startsWith("/") ? thumbnail : `/uploads/${thumbnail}` } : {}),
    }

    const res = await fetch(`${BASE}/admin/products`, { method: "POST", headers: H, body: JSON.stringify(body) })
    if (res.ok) {
      const data = await res.json()
      if (data.product?.id) {
        seededProductIds.set(productHandle, data.product.id)
        created++
        if (salesChannelId) await fetch(`${BASE}/admin/sales-channels/${salesChannelId}/products`, { method: "POST", headers: H, body: JSON.stringify({ add: [data.product.id] }) })
        variantsBound += groupedVariants.length
        if (created % 100 === 0) console.log(`  Created ${created} products...`)
      }
    } else {
      const err = await res.json().catch(() => ({}))
      console.error(`  ✗ ${productHandle} — ${err.message || res.status}`)
    }
  }

  console.log(`  ✓ ${created} products, ${variantsBound} variants`)

  // ═════════════════════════════════════════════════════════
  // PRICES
  // ═════════════════════════════════════════════════════════
  console.log(`\n── Applying Prices ──`)
  const prices = loadCSV(PRICE_CSV).rows
  let pApplied = 0
  for (const pr of prices) {
    if (!pr.price_gbp || !pr.sku) continue
    const target = Math.round(parseFloat(pr.price_gbp) * 100)
    // Find variant by SKU across all seeded products
    for (const [handle, pid] of seededProductIds) {
      const vRes = await fetch(`${BASE}/admin/products/${pid}?fields=variants.id,variants.sku,variants.metadata`, { headers: H })
      const vData = await vRes.json()
      const variant = (vData.product?.variants || []).find(v => (v.metadata?.sku || v.sku) === pr.sku.trim())
      if (variant) {
        await fetch(`${BASE}/admin/products/${pid}/variants/${variant.id}`, {
          method: "POST", headers: H,
          body: JSON.stringify({ prices: [{ currency_code: "gbp", amount: target }] }),
        })
        pApplied++
        break
      }
    }
  }
  console.log(`  ✓ ${pApplied} prices`)

  // ═════════════════════════════════════════════════════════
  // REINDEX
  // ═════════════════════════════════════════════════════════
  if (REINDEX) {
    console.log(`\n── Reindexing MeiliSearch ──`)
    try {
      await fetch("http://localhost:7700/indexes/products/documents", { method: "DELETE" })
      const docs = []
      for (const [handle, pid] of seededProductIds) {
        const p = prodMap.get(handle)
        // Collect all barcodes from variants of this product
        const groupKey = [...groups.keys()].find(k => k.startsWith(handle + "||"))
        const gVariants = groupKey ? groups.get(groupKey) || [] : []
        const allBarcodes = new Set()
        for (const v of gVariants) {
          const bc = (v.variant_barcode || "").trim()
          if (bc) allBarcodes.add(bc)
          const backup = (v.backup_barcodes || "").trim()
          if (backup) backup.split(",").forEach(b => { const t = b.trim(); if (t) allBarcodes.add(t) })
        }
        docs.push({
          id: pid, handle, title: (brandMap.get(p?.brand_slug || "") || "") + " - " + (p?.product_title || handle),
          description: p?.description || "", status: "published",
          category_handle: p?.category_handle || "",
          brand_slug: p?.brand_slug || "generic",
          dietary_flags: (p?.dietary_flags || "").split(";").filter(Boolean).map(f => f.trim()),
          priority_rank: parseInt(p?.velocity === "A" ? "1" : p?.velocity === "B" ? "2" : "3") || 0,
          all_barcodes: [...allBarcodes].join(";"),
        })
      }
      await fetch("http://localhost:7700/indexes/products/documents", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(docs),
      })
      console.log(`  ✓ ${docs.length} documents indexed`)
    } catch (e) { console.error(`  ✗ Reindex: ${e.message}`) }
  }

  // Publishable key sync
  try {
    const kRes = await fetch(`${BASE}/admin/api-keys?limit=1&type=publishable&fields=token`, { headers: H })
    const pk = (await kRes.json()).api_keys?.[0]?.token
    if (pk) {
      const envPath = resolve(__dirname, "..", "apps", "storefront", ".env")
      if (existsSync(envPath)) writeFileSync(envPath, readFileSync(envPath, "utf8").replace(/NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=.*/, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${pk}`))
    }
  } catch { }

  console.log(`\n${"=".repeat(60)}`)
  console.log(`  ✅ COMPLETE — ${created} products, ${variantsBound} variants, ${catIdMap.size} categories`)
  console.log(`${"=".repeat(60)}`)

} else if (UPSERT) {
  // ═══════════════════════════════════════════════════════
  // INCREMENTAL UPSERT (creates new, updates changed, skips unchanged)
  // ═══════════════════════════════════════════════════════
  console.log(`\n── Incremental Upsert ──`)
  
  // Fetch existing DB state
  const existingProds = new Map()
  const existingVariants = new Map() // SKU → { id, product_id, prices, metadata }
  for (let off = 0; ; off += 50) {
    const r = await fetch(`${BASE}/admin/products?limit=50&offset=${off}&fields=handle,id,title,description,subtitle,thumbnail,status,metadata,categories.handle,variants.id,variants.sku,variants.title,variants.metadata,variants.prices.amount,variants.prices.currency_code`, { headers: H })
    const d = await r.json()
    if (!d.products?.length) break
    for (const p of d.products) {
      existingProds.set(p.handle, p)
      for (const v of (p.variants || [])) {
        const sku = v.metadata?.sku || v.sku
        if (sku) existingVariants.set(sku, { ...v, product_id: p.id })
      }
    }
  }
  console.log(`  Existing: ${existingProds.size} products, ${existingVariants.size} variants`)

  // Infrastructure
  const scRes = await fetch(`${BASE}/admin/sales-channels?limit=1&fields=id`, { headers: H })
  const salesChannelId = (await scRes.json()).sales_channels?.[0]?.id
  const spRes = await fetch(`${BASE}/admin/shipping-profiles?limit=1&fields=id`, { headers: H })
  const shippingProfileId = (await spRes.json()).shipping_profiles?.[0]?.id

  // Upsert categories
  let catsCreated = 0, catsUpdated = 0
  const existingCats = new Map()
  for (let off = 0; ; off += 100) {
    const r = await fetch(`${BASE}/admin/product-categories?limit=100&offset=${off}&fields=id,handle,name,rank,description`, { headers: H })
    const d = await r.json()
    if (!d.product_categories?.length) break
    for (const c of d.product_categories) existingCats.set(c.handle, c)
  }
  const catIdMap = new Map()
  for (const [h, cat] of catMap) {
    if (existingCats.has(h)) { catIdMap.set(h, existingCats.get(h).id); catsUpdated++; continue }
    const body = { handle: cat.handle, name: cat.name || cat.handle, is_active: true }
    if (cat.parent_handle && catIdMap.has(cat.parent_handle)) body.parent_category_id = catIdMap.get(cat.parent_handle)
    if (cat.rank) body.rank = parseInt(cat.rank, 10)
    if (cat.description) body.description = cat.description
    const r = await fetch(`${BASE}/admin/product-categories`, { method: "POST", headers: H, body: JSON.stringify(body) })
    if (r.ok) { const id = (await r.json()).product_category?.id; if (id) { catIdMap.set(h, id); catsCreated++ } }
  }
  console.log(`  Categories: C=${catsCreated} U=${catsUpdated}`)

  // Upsert products + variants — group by product_handle + brand_handle
  const groups = new Map()
  for (const v of activeVariants) {
    const key = `${v.product_handle}||${v.brand_handle}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(v)
  }

  let pCreated = 0, pUpdated = 0, pSkipped = 0, vBound = 0
  const seededIds = new Map()

  for (const [key, gVariants] of groups) {
    const [productHandle, brandHandle] = key.split("||")
    const parent = prodMap.get(productHandle)
    const brandName = brandMap.get(brandHandle) || brandHandle
    if (!parent) continue
    const title = `${brandName} - ${parent.product_title || productHandle}`

    const existing = existingProds.get(productHandle)

    if (!existing) {
      // ── CREATE new product with variants ────────
      const variantPayloads = buildVariantPayloads(gVariants, brandHandle, supplierMap, vendorMap)
      const optTitle = variantPayloads.length > 1 ? "Weight / Size" : "Default"
      const thumbnail = gVariants[0]?.thumbnail_url || gVariants[0]?.image_filename
      const body = {
        handle: productHandle, title, subtitle: parent.subtitle || undefined,
        description: parent.description || undefined, status: "published",
        shipping_profile_id: shippingProfileId,
        options: [{ title: optTitle, values: variantPayloads.map(v => v.title) }],
        variants: variantPayloads,
        categories: catIdMap.has(parent.category_handle) ? [{ id: catIdMap.get(parent.category_handle) }] : [],
        metadata: buildMetadata(parent, brandHandle),
        ...(thumbnail ? { thumbnail: thumbnail.startsWith("http") || thumbnail.startsWith("/") ? thumbnail : `/uploads/${thumbnail}` } : {}),
      }
      const res = await fetch(`${BASE}/admin/products`, { method: "POST", headers: H, body: JSON.stringify(body) })
      if (res.ok) {
        const data = await res.json()
        if (data.product?.id) {
          seededIds.set(productHandle, data.product.id)
          pCreated++
          if (salesChannelId) await fetch(`${BASE}/admin/sales-channels/${salesChannelId}/products`, { method: "POST", headers: H, body: JSON.stringify({ add: [data.product.id] }) })
          vBound += gVariants.length
        }
      }
    } else {
      // ── UPDATE — check for changes ─────────────
      const changes = {}
      if (title !== existing.title) changes.title = title
      if ((parent.subtitle || "") !== (existing.subtitle || "")) changes.subtitle = parent.subtitle || undefined
      if ((parent.description || "") !== (existing.description || "")) changes.description = parent.description || undefined
      const existingCatIds = (existing.categories || []).map(c => c.handle)
      const targetCatId = catIdMap.get(parent.category_handle)
      if (targetCatId && !existingCatIds.includes(parent.category_handle)) changes.categories = [{ id: targetCatId }]

      // Check metadata changes
      const newMeta = buildMetadata(parent, brandHandle)
      const oldMeta = existing.metadata || {}
      const metaChanged = Object.keys(newMeta).some(k => JSON.stringify(newMeta[k]) !== JSON.stringify(oldMeta[k]))
      if (metaChanged) changes.metadata = newMeta

      if (Object.keys(changes).length > 0) {
        await fetch(`${BASE}/admin/products/${existing.id}`, { method: "POST", headers: H, body: JSON.stringify(changes) })
        pUpdated++
      } else {
        pSkipped++
      }
      seededIds.set(productHandle, existing.id)
    }
  }
  console.log(`  Products: C=${pCreated} U=${pUpdated} S=${pSkipped}`)

  // Upsert prices
  const prices = loadCSV(PRICE_CSV).rows
  let pApplied = 0, pSkippedPrice = 0
  for (const pr of prices) {
    if (!pr.price_gbp || !pr.sku) continue
    const target = Math.round(parseFloat(pr.price_gbp) * 100)
    const sku = pr.sku.trim()
    const dbV = existingVariants.get(sku)
    if (!dbV) continue
    const currentPrice = (dbV.prices || []).find(p => p.currency_code === "gbp")?.amount
    if (currentPrice === target) { pSkippedPrice++; continue }
    try {
      await fetch(`${BASE}/admin/products/${dbV.product_id}/variants/${dbV.id}`, {
        method: "POST", headers: H, body: JSON.stringify({ prices: [{ currency_code: "gbp", amount: target }] }),
      })
      pApplied++
    } catch { }
  }
  console.log(`  Prices: applied=${pApplied} skipped=${pSkippedPrice}`)

  // Reindex
  if (REINDEX) {
    console.log(`\n── Reindexing MeiliSearch ──`)
    try {
      await fetch("http://localhost:7700/indexes/products/documents", { method: "DELETE" })
      const docs = []
      for (const [handle, pid] of seededIds) {
        const p = prodMap.get(handle)
        docs.push({ id: pid, handle, title: (brandMap.get(p?.brand_slug || "") || "") + " - " + (p?.product_title || handle),
          description: p?.description || "", status: "published",
          category_handle: p?.category_handle || "", brand_slug: p?.brand_slug || "generic",
          dietary_flags: (p?.dietary_flags || "").split(";").filter(Boolean).map(f => f.trim()),
          priority_rank: parseInt(p?.velocity === "A" ? "1" : p?.velocity === "B" ? "2" : "3") || 0 })
      }
      await fetch("http://localhost:7700/indexes/products/documents", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(docs) })
      console.log(`  ✓ ${docs.length} documents indexed`)
    } catch (e) { console.error(`  ✗ Reindex: ${e.message}`) }
  }

  // Publishable key sync
  try {
    const kRes = await fetch(`${BASE}/admin/api-keys?limit=1&type=publishable&fields=token`, { headers: H })
    const pk = (await kRes.json()).api_keys?.[0]?.token
    if (pk) {
      const envPath = resolve(__dirname, "..", "apps", "storefront", ".env")
      if (existsSync(envPath)) writeFileSync(envPath, readFileSync(envPath, "utf8").replace(/NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=.*/, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${pk}`))
    }
  } catch { }

  console.log(`\n${"=".repeat(60)}`)
  console.log(`  ✅ UPSERT COMPLETE — C=${pCreated} U=${pUpdated} S=${pSkipped} products`)
  console.log(`${"=".repeat(60)}`)
}
}

// ═══════════════════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════════════════
function buildMetadata(parent, brandHandle) {
  return {
    country_of_origin: "India",
    uk_food_business_operator: "IndiaGrocers London",
    ingredients: "See product packaging",
    allergens: [],
    vat_rate: parseFloat(parent.vat_rate) || 0,
    velocity: parent.velocity || "B",
    sourcing_tier: "B",
    dietary_flags: (parent.dietary_flags || "").split(";").filter(Boolean).map(f => f.trim()).filter(f => ["vegetarian","vegan","gluten-free","organic"].includes(f)),
    regional_tags: [],
    subscription_eligible: parent.subscription_eligible === "true",
    requires_fast_delivery: false,
    requires_cold_chain: false,
    brand_slug: brandHandle,
    priority_rank: parent.velocity === "A" ? "1" : parent.velocity === "B" ? "2" : "3",
    synonyms: [],
  }
}

function buildVariantPayloads(gVariants, brandHandle, supplierMap, vendorMap) {
  return gVariants.map(v => {
    const primaryBc = (v.variant_barcode || "").trim()
    const backupBc = (v.backup_barcodes || "").trim()
    const allBarcodes = [primaryBc]
    if (backupBc && backupBc !== primaryBc) {
      backupBc.split(",").filter(Boolean).map(b => b.trim()).forEach(b => {
        if (!allBarcodes.includes(b)) allBarcodes.push(b)
      })
    }
    const ph = (v.product_handle || "").trim()
    const sku = (v.variant_sku || "").trim()
    const vh = `${ph}__${sku}`
    const supp = supplierMap.get(vh) || {}
    const vendor = vendorMap.get(supp.vendor_handle) || {}
    return {
      title: v.variant_title || `${v.weight_value}${v.weight_unit}` || "Default",
      sku: sku || undefined,
      prices: [],
      metadata: {
        barcode: primaryBc,
        backup_barcodes: allBarcodes.join(";"),
        all_barcodes: allBarcodes.join(";"),
        sku: sku || "", weight_value: v.weight_value ? parseFloat(v.weight_value) : undefined,
        weight_unit: v.weight_unit || undefined,
        sourcing_depot: supp.sourcing_depot || vendor.sourcing_depot || v.sourcing_depot || "",
        brand_handle: brandHandle, vendor_handle: supp.vendor_handle || "",
        vendor_name: vendor.vendor_name || "", vendor_sku: supp.vendor_sku || "",
        cost_price_gbp: supp.cost_price_gbp || "",
        warehouse_aisle: supp.warehouse_aisle || vendor.warehouse_aisle || "",
        lead_time_days: supp.lead_time_days || vendor.lead_time_days || "",
        min_order_qty: supp.min_order_qty || vendor.min_order_qty || "",
      },
    }
  })
}

main().catch(e => { console.error(`\nFATAL: ${e.message}`); process.exit(1) })
