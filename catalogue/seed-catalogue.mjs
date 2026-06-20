/**
 * SEED CATALOGUE — Pure Model v3
 *
 * Pure model architecture:
 *   1. products.csv              — pure product identities (no brand column)
 *   2. variants.csv              — shared unit pool (type, value, label)
 *   3. product_brands.csv        — product × brand junction
 *   4. brand_product_variants.csv — sellable units (commerce layer)
 *   5. variant_vendor_prices.csv  — multi-vendor sourcing
 *   6. prices.csv                — retail prices (separate, ops-editable)
 *   7. brands.csv, vendors.csv, categories.csv — reference
 *
 * Usage:
 *   node catalogue/seed-catalogue.mjs --validate-only
 *   node catalogue/seed-catalogue.mjs --dry-run
 *   node catalogue/seed-catalogue.mjs --apply --reindex
 *   node catalogue/seed-catalogue.mjs --upsert --reindex
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { resolve, dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "http://127.0.0.1:9000"
const APPLY = process.argv.includes("--apply")
const UPSERT = process.argv.includes("--upsert")
const VALIDATE = process.argv.includes("--validate-only")
const DRY_RUN = process.argv.includes("--dry-run")
const REINDEX = process.argv.includes("--reindex")

const TMP = resolve(__dirname, "..", "tmp", "catalog-rebuild-v3")
const PUBLIC_IMG = resolve(__dirname, "..", "apps", "storefront", "public", "images", "products")
const UPLOADS = resolve(__dirname, "..", "apps", "backend", "uploads")

const PROD_CSV = resolve(TMP, "products.csv")
const VAR_CSV = resolve(TMP, "variants.csv")
const PB_CSV = resolve(TMP, "product_brands.csv")
const BPV_CSV = resolve(TMP, "brand_product_variants.csv")
const VVP_CSV = resolve(TMP, "variant_vendor_prices.csv")
const PRICE_CSV = resolve(TMP, "prices.csv")
const BRAND_CSV = resolve(TMP, "brands.csv")
const CAT_CSV = resolve(TMP, "categories.csv")
const VENDOR_CSV = resolve(TMP, "vendors.csv")

for (const d of [TMP, PUBLIC_IMG]) { if (!existsSync(d)) mkdirSync(d, { recursive: true }) }

// ─── Helpers ────────────────────────────────────────────────────────

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

function loadCSV(filePath) {
  const raw = readFileSync(filePath, "utf8").replace(/\r\n/g, "\n")
  const lines = raw.split("\n").filter(l => l.trim())
  if (lines.length === 0) return { header: [], rows: [] }
  const header = lines[0].split(",").map(h => h.trim())
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i])
    const row = {}
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = (vals[j] || "").trim()
    }
    rows.push(row)
  }
  return { header, rows }
}

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  const data = await res.json()
  if (!data.token) throw new Error(`Login failed: ${res.status}`)
  return data.token
}

// ─── Payload Builders ─────────────────────────────────────────────

function buildMetadata(product, brandHandle) {
  return {
    country_of_origin: "India",
    uk_food_business_operator: "IndiaGrocers London",
    ingredients: "See product packaging",
    allergens: [],
    vat_rate: parseFloat(product.vat_rate) || 0,
    velocity: "B",
    sourcing_tier: "B",
    dietary_flags: (product.dietary_flags || "").split(";").filter(Boolean).map(f => f.trim())
      .filter(f => ["vegetarian", "vegan", "gluten-free", "organic"].includes(f)),
    regional_tags: [],
    subscription_eligible: true,
    requires_fast_delivery: false,
    requires_cold_chain: false,
    brand_slug: brandHandle,
    priority_rank: "2",
    synonyms: [],
    images: [],
  }
}

function buildVariantMeta(bpv, varDef, vvpsForVar) {
  const vendors = vvpsForVar.map(vp => ({
    handle: vp.vendor_handle || "",
    sku: vp.vendor_sku || "",
    cost: vp.cost_price_gbp ? parseFloat(vp.cost_price_gbp) : undefined,
    is_primary: vp.is_primary === "true",
  }))
  const primary = vendors.find(v => v.is_primary) || vendors[0] || {}

  const barcodes = new Set()
  if (bpv.barcode) barcodes.add(bpv.barcode)
  if (bpv.backup_barcodes) {
    bpv.backup_barcodes.split(/[,;]/).filter(Boolean).map(b => b.trim()).forEach(b => barcodes.add(b))
  }

  return {
    unit_type: varDef.unit_type,
    unit_value: varDef.unit_value,
    unit_label: varDef.unit_label,
    display_title: varDef.display_title || `${varDef.unit_value}${varDef.unit_label}`,
    barcode: bpv.barcode || "",
    all_barcodes: [...barcodes].join(";"),
    vendor_handle: primary.handle || "",
    vendor_name: "",
    vendor_sku: primary.sku || "",
    cost_price_gbp: primary.cost?.toString() || "",
    vendors,
    shelf_weight_kg: undefined,
    images: (bpv.images || "").split(",").filter(Boolean).map(i => i.trim()),
  }
}

// ─── Validate ───────────────────────────────────────────────────────

async function validateOnly() {
  const prods = loadCSV(PROD_CSV)
  const vars = loadCSV(VAR_CSV)
  const pbs = loadCSV(PB_CSV)
  const bpvs = loadCSV(BPV_CSV)
  const vvps = loadCSV(VVP_CSV)
  const prices = loadCSV(PRICE_CSV)
  const brands = loadCSV(BRAND_CSV)
  const cats = loadCSV(CAT_CSV)
  const vendors = loadCSV(VENDOR_CSV)

  const prodSet = new Set(prods.rows.map(r => r.handle))
  const varSet = new Set(vars.rows.map(r => r.handle))
  const brandSet = new Set(brands.rows.map(r => r.handle))
  const catSet = new Set(cats.rows.map(r => r.handle))
  const vendorSet = new Set(vendors.rows.map(r => r.vendor_handle))

  console.log(`Loaded: ${prodSet.size} products | ${varSet.size} variants | ${brandSet.size} brands | ${catSet.size} categories | ${pbs.rows.length} product_brands | ${bpvs.rows.length} sellable units | ${vvps.rows.length} vendor prices | ${prices.rows.length} prices`)

  let errors = 0
  for (const [i, pb] of pbs.rows.entries()) {
    if (!prodSet.has(pb.product_handle)) { console.error(`  FK: pb[${i}]: product "${pb.product_handle}" missing`); errors++ }
    if (!brandSet.has(pb.brand_handle)) { console.error(`  FK: pb[${i}]: brand "${pb.brand_handle}" missing`); errors++ }
  }
  for (const [i, bpv] of bpvs.rows.entries()) {
    if (!prodSet.has(bpv.product_handle)) { console.error(`  FK: bpv[${i}]: product "${bpv.product_handle}" missing`); errors++ }
    if (!brandSet.has(bpv.brand_handle)) { console.error(`  FK: bpv[${i}]: brand "${bpv.brand_handle}" missing`); errors++ }
    if (!varSet.has(bpv.variant_handle)) { console.error(`  FK: bpv[${i}]: variant "${bpv.variant_handle}" missing`); errors++ }
  }
  for (const [i, pr] of prices.rows.entries()) {
    if (!prodSet.has(pr.product_handle)) { console.error(`  FK: prices[${i}]: product "${pr.product_handle}" missing`); errors++ }
    if (!brandSet.has(pr.brand_handle)) { console.error(`  FK: prices[${i}]: brand "${pr.brand_handle}" missing`); errors++ }
    if (!varSet.has(pr.variant_handle)) { console.error(`  FK: prices[${i}]: variant "${pr.variant_handle}" missing`); errors++ }
  }
  for (const p of prods.rows) {
    if (p.category_handle && !catSet.has(p.category_handle)) { console.error(`  FK: product "${p.handle}": category "${p.category_handle}" missing`); errors++ }
  }

  let imgErrors = 0
  for (const bpv of bpvs.rows) {
    const img = (bpv.images || "").trim()
    if (!img) { imgErrors++; continue }
    if (!existsSync(join(PUBLIC_IMG, img)) && !existsSync(join(UPLOADS, img))) imgErrors++
  }
  if (imgErrors) console.warn(`  ⚠ ${imgErrors} sellable units have no valid image`)
  else console.log(`  ✓ All images validated`)

  console.log(errors ? `\n  ❌ ${errors} FK errors` : `\n  ✅ All FK references valid`)
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log("═".repeat(60))
  console.log("  Seed Catalogue — Pure Model v3")
  console.log(`${APPLY ? "  Mode: APPLY (destructive)" : UPSERT ? "  Mode: UPSERT (incremental)" : DRY_RUN ? "  Mode: DRY RUN" : "  Mode: VALIDATE"}${REINDEX ? " + REINDEX" : ""}`)
  console.log("═".repeat(60))

  if (VALIDATE) { await validateOnly(); return }

  const prods = loadCSV(PROD_CSV)
  const vars = loadCSV(VAR_CSV)
  const pbs = loadCSV(PB_CSV)
  const bpvs = loadCSV(BPV_CSV)
  const vvps = loadCSV(VVP_CSV)
  const prices = loadCSV(PRICE_CSV)
  const brands = loadCSV(BRAND_CSV)
  const cats = loadCSV(CAT_CSV)
  const vendors = loadCSV(VENDOR_CSV)

  const prodMap = new Map(prods.rows.map(r => [r.handle, r]))
  const varMap = new Map(vars.rows.map(r => [r.handle, r]))
  const brandNameMap = new Map(brands.rows.map(r => [r.handle, r.brand_name]))
  const vendorMap = new Map(vendors.rows.map(r => [r.vendor_handle, r]))

  const vvpByKey = new Map()
  for (const vp of vvps.rows) {
    const k = `${vp.product_handle}::${vp.brand_handle}::${vp.variant_handle}`
    if (!vvpByKey.has(k)) vvpByKey.set(k, [])
    vvpByKey.get(k).push(vp)
  }

  const priceByKey = new Map()
  for (const pr of prices.rows) {
    const k = `${pr.product_handle}::${pr.brand_handle}::${pr.variant_handle}`
    priceByKey.set(k, parseFloat(pr.price_gbp) || 0)
  }

  console.log(`\nLoaded: ${prodMap.size} products | ${varMap.size} variants | ${pbs.rows.length} prod-brands | ${bpvs.rows.length} sellable units | ${vvps.rows.length} vendor prices | ${prices.rows.length} retail prices`)

  if (DRY_RUN) {
    console.log(`\n── Dry Run ──`)
    console.log(`  Pure products:      ${prodMap.size}`)
    console.log(`  Variant units:      ${varMap.size}`)
    console.log(`  Product-brand pairs:${pbs.rows.length}`)
    console.log(`  Sellable variants:  ${bpvs.rows.length}`)
    return
  }

  if (!APPLY && !UPSERT) return
  const token = await login()
  const H = { "Content-Type": "application/json", Authorization: `Bearer ${token}` }

  // ═══ DESTRUCTIVE RESET + CATEGORIES ═══
  let catIdMap = new Map()
  if (APPLY) {
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

    console.log(`\n── Seeding Categories ──`)
    const sorted = [...cats.rows].sort((a, b) => {
      const aP = a.parent_handle || ""
      const bP = b.parent_handle || ""
      if (aP && !bP) return 1
      if (!aP && bP) return -1
      return (parseInt(a.rank) || 0) - (parseInt(b.rank) || 0)
    })
    let cc = 0
    for (const cat of sorted) {
      const b = { name: cat.name, handle: cat.handle, description: (cat.description || "").slice(0, 255), is_active: true, is_internal: false, rank: parseInt(cat.rank) || 0 }
      if (cat.parent_handle && catIdMap.has(cat.parent_handle)) b.parent_category_id = catIdMap.get(cat.parent_handle)
      try {
        const r = await fetch(`${BASE}/admin/product-categories`, { method: "POST", headers: H, body: JSON.stringify(b) })
        const d = await r.json()
        if (d.product_category?.id) { catIdMap.set(cat.handle, d.product_category.id); cc++ }
      } catch (e) { console.warn(`  ⚠ Category "${cat.handle}": ${e.message}`) }
    }
    console.log(`  ✓ ${cc} categories`)
  }

  // ═══ SALES CHANNEL ═══
  const scRes = await fetch(`${BASE}/admin/sales-channels?limit=1&fields=id`, { headers: H })
  const salesChannelId = (await scRes.json()).sales_channels?.[0]?.id
  if (!salesChannelId) throw new Error("No sales channel found")

  // ═══ BUILD PRODUCTS ═══
  let pCreated = 0, pUpdated = 0, pSkipped = 0, pFailed = 0

  // Override catIdMap for UPSERT mode from existing DB
  if (UPSERT) {
    for (let off = 0; ; off += 100) {
      const r = await fetch(`${BASE}/admin/product-categories?limit=100&offset=${off}&fields=id,handle`, { headers: H })
      const d = await r.json()
      if (!d.product_categories?.length) break
      for (const c of d.product_categories) catIdMap.set(c.handle, c.id)
    }
  }

  // UPSERT: Load existing state
  const existingMap = new Map()
  if (UPSERT) {
    console.log(`\n── Loading Existing State ──`)
    for (let off = 0; ; off += 100) {
      const r = await fetch(`${BASE}/admin/products?limit=100&offset=${off}&fields=id,handle,title,description,subtitle,status,thumbnail,metadata,categories.handle,variants.id,variants.sku,variants.title,variants.barcode,variants.metadata,variants.prices.amount`, { headers: H })
      const d = await r.json()
      if (!d.products?.length) break
      for (const p of d.products) existingMap.set(p.handle, p)
    }
    console.log(`  Existing: ${existingMap.size} products`)
    console.log(`\n── Incremental Upsert ──`)
  }

  if (APPLY) console.log(`\n── Seeding Products + Variants ──`)

  // Iterate product_brands to create branded products
  for (const pb of pbs.rows) {
    const product = prodMap.get(pb.product_handle)
    if (!product) { pFailed++; continue }

    const brandName = brandNameMap.get(pb.brand_handle) || pb.brand_handle
    const title = `${brandName} - ${product.title}`
    // Medusa auto-generates handle from title. Compute it for upsert lookup.
    const autoHandle = title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")

    // Collect sellable units
    const bpvsForPB = bpvs.rows.filter(bv =>
      bv.product_handle === pb.product_handle && bv.brand_handle === pb.brand_handle
    )
    if (bpvsForPB.length === 0) { pFailed++; continue }

    // Build variant payloads
    const vPayloads = []
    const optionValues = []

    for (const bpv of bpvsForPB) {
      const varDef = varMap.get(bpv.variant_handle)
      if (!varDef) continue

      const vk = `${bpv.product_handle}::${bpv.brand_handle}::${bpv.variant_handle}`
      const vvpsForVar = vvpByKey.get(vk) || []
      const rPrice = priceByKey.get(vk)

      const vMeta = buildVariantMeta(bpv, varDef, vvpsForVar)

      // Enrich vendor name from vendorMap
      const pVendor = vvpsForVar.find(v => v.is_primary === "true") || vvpsForVar[0]
      if (pVendor?.vendor_handle && vendorMap.has(pVendor.vendor_handle)) {
        vMeta.vendor_name = vendorMap.get(pVendor.vendor_handle).vendor_name || ""
        vMeta.cost_price_gbp = pVendor.cost_price_gbp || ""
      } else {
        vMeta.cost_price_gbp = pVendor?.cost_price_gbp || ""
      }

      const vt = varDef.display_title || `${varDef.unit_value}${varDef.unit_label}`
      optionValues.push(vt)

      vPayloads.push({
        title: vt,
        sku: (pVendor?.vendor_sku || bpv.barcode || undefined),
        barcode: bpv.barcode || undefined,
        manage_inventory: false,
        allow_backorder: true,
        prices: rPrice ? [{ amount: Math.round(rPrice * 100), currency_code: "gbp" }] : [],
        metadata: vMeta,
      })
    }

    if (vPayloads.length === 0) { pFailed++; continue }

    const metadata = buildMetadata(product, pb.brand_handle)
    const firstImg = bpvsForPB[0]?.images?.split(",")[0]?.trim() || bpvsForPB[0]?.thumbnail || ""
    const thumb = firstImg ? (firstImg.startsWith("/") ? firstImg : `/uploads/${firstImg}`) : ""
    const ctgH = product.category_handle
    const catObj = ctgH && catIdMap.has(ctgH) ? [{ id: catIdMap.get(ctgH) }] : []

    // UPSERT: check if exists (by auto-generated handle from title)
    if (UPSERT && existingMap.has(autoHandle)) {
      const existing = existingMap.get(autoHandle)
      let changed = false
      if (title !== existing.title) changed = true
      if ((product.description || "") !== (existing.description || "")) changed = true
      if ((product.subtitle || "") !== (existing.subtitle || "")) changed = true
      const oldMeta = existing.metadata || {}
      for (const k of Object.keys(metadata)) {
        if (JSON.stringify(metadata[k]) !== JSON.stringify(oldMeta[k])) { changed = true; break }
      }
      if (changed) {
        try {
          await fetch(`${BASE}/admin/products/${existing.id}`, { method: "POST", headers: H, body: JSON.stringify({ title, description: product.description, subtitle: product.subtitle, metadata }) })
          pUpdated++
        } catch (e) { console.warn(`  ⚠ Update "${autoHandle}": ${e.message}`); pFailed++ }
      } else { pSkipped++ }
      continue
    }

    // CREATE new product (Medusa auto-generates handle from title)
    const body = {
      title,
      subtitle: product.subtitle || undefined,
      description: product.description || undefined,
      status: product.status || "published",
      thumbnail: thumb || undefined,
      metadata,
      categories: catObj,
      options: [{ title: "Weight / Size", values: optionValues }],
      variants: vPayloads,
    }

    try {
      const r = await fetch(`${BASE}/admin/products`, { method: "POST", headers: H, body: JSON.stringify(body) })
      const d = await r.json()
      if (d.product?.id) {
        await fetch(`${BASE}/admin/sales-channels/${salesChannelId}/products`, { method: "POST", headers: H, body: JSON.stringify({ add: [d.product.id] }) })
        pCreated++
      } else {
        const msg = d.message || ""
        if (msg.includes("metadata validation")) {
          console.warn(`  ✗ ${autoHandle} — Metadata validation: ${JSON.stringify(d.errors || {}).slice(0, 300)}`)
        } else {
          console.warn(`  ✗ ${autoHandle} — ${JSON.stringify(d).slice(0, 200)}`)
        }
        pFailed++
      }
    } catch (e) {
      console.warn(`  ✗ ${autoHandle} — ${e.message}`)
      pFailed++
    }

    if (pCreated % 100 === 0 && pCreated > 0) console.log(`  Created ${pCreated} products...`)
  }

  console.log(APPLY
    ? `  ✓ ${pCreated} created, ${pFailed} failed`
    : `  Products: C=${pCreated} U=${pUpdated} S=${pSkipped} F=${pFailed}`)

  // ═══ REINDEX ═══
  if (REINDEX) {
    console.log(`\n── Reindexing MeiliSearch ──`)
    try {
      await fetch("http://localhost:7700/indexes/products/documents", { method: "DELETE" })

      const docs = []
      for (let off = 0; ; off += 100) {
        const r = await fetch(`${BASE}/admin/products?limit=100&offset=${off}&fields=id,handle,title,description,status,metadata,categories.handle`, { headers: H })
        const d = await r.json()
        if (!d.products?.length) break
        for (const p of d.products) {
          docs.push({
            id: p.id, handle: p.handle, title: p.title,
            description: p.description || "", status: p.status,
            category_handle: p.categories?.[0]?.handle || "",
            brand_slug: p.metadata?.brand_slug || "",
            dietary_flags: p.metadata?.dietary_flags || [],
            priority_rank: p.metadata?.priority_rank || "2",
            all_barcodes: "",
          })
        }
      }

      for (const doc of docs) {
        try {
          const vr = await fetch(`${BASE}/admin/products/${doc.id}/variants?fields=metadata`, { headers: H })
          const vd = await vr.json()
          if (vd.variants?.length) {
            doc.all_barcodes = vd.variants.map(v => v.metadata?.all_barcodes || "").filter(Boolean).join(";")
          }
        } catch {}
      }

      await fetch("http://localhost:7700/indexes/products/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docs),
      })
      console.log(`  ✓ ${docs.length} documents indexed`)
    } catch (e) { console.warn(`  ⚠ Reindex failed: ${e.message}`) }
  }

  // ═══ SYNC PUBLISHABLE KEY ═══
  console.log(`\n── Syncing Publishable Key ──`)
  try {
    const pkr = await fetch(`${BASE}/admin/api-keys?limit=1&type=publishable&fields=token`, { headers: H })
    const pkd = await pkr.json()
    const key = pkd.api_keys?.[0]?.token
    if (key) {
      const envPath = resolve(__dirname, "..", "apps", "storefront", ".env")
      let content = ""
      try { content = readFileSync(envPath, "utf8") } catch {}
      const lines = content.split("\n")
      let found = false
      const nl = lines.map(l => {
        if (l.startsWith("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=")) { found = true; return `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${key}` }
        return l
      })
      if (!found) nl.push(`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${key}`)
      writeFileSync(envPath, nl.join("\n"), "utf8")
      console.log(`  ✓ Publishable key synced`)
    }
  } catch (e) { console.warn(`  ⚠ Key sync failed: ${e.message}`) }

  // ═══ COMPLETE ═══
  console.log(`\n${"═".repeat(60)}`)
  if (APPLY) console.log(`  ✅ APPLY COMPLETE — ${pCreated} created, ${pFailed} failed`)
  else if (UPSERT) console.log(`  ✅ UPSERT COMPLETE — C=${pCreated} U=${pUpdated} S=${pSkipped}`)
  console.log(`${"═".repeat(60)}`)
}

main().catch(e => { console.error(`\nFATAL: ${e.message}`); process.exit(1) })
