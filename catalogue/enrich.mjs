/**
 * CATALOGUE ENRICHMENT ENGINE — Unified Single Source of Truth
 *
 * Reads ALL CSV files from catalogue/ and applies every product attribute to
 * Medusa DB. One command for everything — fresh seeding AND incremental updates.
 *
 * Usage:
 *   node catalogue/enrich.mjs                        # Dry run — report only
 *   node catalogue/enrich.mjs --apply                # Apply all changes
 *   node catalogue/enrich.mjs --apply --reindex      # Apply + reindex MeiliSearch
 *   node catalogue/enrich.mjs --validate-only        # Compare CSV vs DB
 *
 * What it syncs:
 *   PRODUCTS:   create/update — title, subtitle, description, status, thumbnail, images[],
 *               variants (titles, SKUs, prices), tags, categories, collections, ALL metadata
 *   CATEGORIES: create/update — name, rank, description, parent, active status
 *   COLLECTIONS: create/update — title, active status
 *   MEILISEARCH: synonyms, filters, reindex trigger
 *   INFRA:     sales channel linking, publishable key auto-sync
 *
 * Idempotent — safe to run multiple times. CSV is the master.
 */
import { readFileSync, existsSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "http://127.0.0.1:9000"
const MEILI = "http://localhost:7700"
const APPLY = process.argv.includes("--apply")
const VALIDATE = process.argv.includes("--validate-only")
const REINDEX = process.argv.includes("--reindex")

function loadCSV(filename) {
  const path = resolve(__dirname, filename)
  if (!existsSync(path)) return []
  const text = readFileSync(path, "utf8")
  const lines = text.trim().split("\n")
  if (lines.length < 2) return []
  const headers = lines[0].split(",").map(h => h.trim())
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line)
    const obj = {}
    headers.forEach((h, i) => (obj[h] = vals[i] || ""))
    return obj
  })
}

function parseCSVLine(line) {
  const result = []
  let current = "", inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') { if (line[i + 1] === '"') { current += '"'; i++ } else inQuotes = false }
      else current += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ",") { result.push(current.trim()); current = "" }
      else current += ch
    }
  }
  result.push(current.trim())
  return result
}

function isActive(row) { const s = (row.status || "").toLowerCase(); return s !== "inactive" && s !== "draft" && s !== "deleted" }
function autoBrandSlug(title) {
  if (!title) return "generic"
  // Map known brand names to whitelisted slugs
  const brandMap = {
    "natco": "natco", "trs": "trs", "shan": "shan", "mdh": "mdh",
    "haldiram": "haldirams", "haldiram's": "haldirams", "bikaji": "bikaji",
    "aashirvaad": "aashirvaad", "pillsbury": "pillsbury", "elephant": "elephant",
    "tilda": "tilda", "kohinoor": "kohinoor", "daawat": "daawat",
    "lal qilla": "lal-qilla", "falak": "falak",
    "parle": "parle", "parle-g": "parle", "britannia": "britannia",
    "maggi": "maggi", "patak's": "pataks", "patak": "pataks",
    "lijjat": "lijjat", "horlicks": "horlicks", "bournvita": "bournvita",
    "dabur": "dabur", "glucon-d": "glucon-d", "maaza": "maaza", "frooti": "frooti",
    "brooke bond": "brooke-bond", "tata gold": "tata-gold", "wagh bakri": "wagh-bakri",
    "hamdard": "hamdard", "girnar": "girnar",
  }
  const lower = title.toLowerCase()
  for (const [name, slug] of Object.entries(brandMap)) {
    if (lower.includes(name)) return slug
  }
  return "generic"
}

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: `Bearer ${(await res.json()).token}`, "Content-Type": "application/json" }
}

async function main() {
  const H = await login()
  console.log("=".repeat(60))
  console.log("  Catalogue Enrichment Engine — Unified")
  console.log("  Mode:", APPLY ? "APPLY" + (REINDEX ? " + REINDEX" : "") : VALIDATE ? "VALIDATE" : "DRY RUN")
  console.log("=".repeat(60))

  const products = loadCSV("products.csv")
  const categories = loadCSV("categories.csv")
  const collections = loadCSV("collections.csv")
  const synonyms = loadCSV("meilisearch/synonyms.csv")
  const filters = loadCSV("meilisearch/filters.csv")
  const prices = loadCSV("prices.csv")
  const productCollections = loadCSV("products-collections.csv")

  // Load category assignment JSON
  let catAssignment = null
  const catAssignPath = resolve(__dirname, "category-assignment.json")
  if (existsSync(catAssignPath)) catAssignment = JSON.parse(readFileSync(catAssignPath, "utf8"))

  console.log(`\nCSVs: ${products.length} products | ${categories.length} categories | ${collections.length} collections | ${prices.length} prices | ${synonyms.length} synonyms`)
  if (catAssignment) console.log(`  category-assignment.json: ${Object.keys(catAssignment.mappings || {}).length} mappings`)
  console.log("")

  let created = 0, updated = 0, skipped = 0, failed = 0
  let catsCreated = 0, catsUpdated = 0
  let colsCreated = 0, colsUpdated = 0
  let salesChannelId = null

  // ════════════════════════════════════════════════════
  // 1. CATEGORY SYNC
  // ════════════════════════════════════════════════════
  if (categories.length > 0) {
    // Sort: parents first (no parent_handle), then children
    const sortedCats = [...categories].sort((a, b) => {
      if (!a.parent_handle && b.parent_handle) return -1
      if (a.parent_handle && !b.parent_handle) return 1
      return 0
    })

    const dbCats = new Map()
    for (let off = 0; ; off += 100) {
      const res = await fetch(`${BASE}/admin/product-categories?limit=100&offset=${off}&fields=id,handle,name,is_active,rank,description,parent_category_id`, { headers: H })
      const data = await res.json()
      for (const c of (data.product_categories || [])) dbCats.set(c.handle, c)
      if ((data.product_categories || []).length < 100) break
    }

    for (const row of sortedCats) {
      if (!row.handle) continue
      const dbCat = dbCats.get(row.handle)
      if (VALIDATE) { if (!dbCat) console.log(`  NEW category: ${row.handle}`); continue }
      if (!APPLY) { if (!dbCat) catsCreated++; else if (row.name && row.name !== dbCat.name) catsUpdated++; continue }
      try {
        if (!dbCat) {
          if (!isActive(row)) continue
          const body = { handle: row.handle, name: row.name || row.handle, is_active: true }
          if (row.parent_handle) {
            // Parent must already exist in dbCats (parents created first)
            const pid = dbCats.get(row.parent_handle)?.id
            if (pid) body.parent_category_id = pid
          }
          if (row.rank) body.rank = parseInt(row.rank)
          if (row.description) body.description = row.description
          const res = await fetch(`${BASE}/admin/product-categories`, { method: "POST", headers: H, body: JSON.stringify(body) })
          if (res.ok) {
            const newCat = await res.json()
            // Add newly created category to dbCats so children can reference it
            if (newCat.product_category?.id) {
              dbCats.set(row.handle, { id: newCat.product_category.id, handle: row.handle })
            }
            catsCreated++
          } else { failed++; console.log(`  ✗ cat ${row.handle} — ${res.status}`) }
        } else {
          const u = {}
          if (row.name && row.name !== dbCat.name) u.name = row.name
          if (row.rank) { const r = parseInt(row.rank); if (r !== dbCat.rank) u.rank = r }
          if (row.description !== undefined && row.description !== (dbCat.description || "")) u.description = row.description
          if (!isActive(row) && dbCat.is_active) u.is_active = false
          if (isActive(row) && dbCat.is_active === false) u.is_active = true
          if (Object.keys(u).length > 0) {
            await fetch(`${BASE}/admin/product-categories/${dbCat.id}`, { method: "POST", headers: H, body: JSON.stringify(u) })
            catsUpdated++
          }
        }
      } catch (e) { failed++; console.log(`  ✗ cat ${row.handle} — ${e.message}`) }
    }
  }

  // ════════════════════════════════════════════════════
  // 2. COLLECTION SYNC
  // ════════════════════════════════════════════════════
  if (collections.length > 0) {
    const dbCols = new Map()
    for (let off = 0; ; off += 100) {
      const res = await fetch(`${BASE}/admin/collections?limit=100&offset=${off}&fields=id,handle,title`, { headers: H })
      const data = await res.json()
      for (const c of (data.collections || [])) dbCols.set(c.handle, c)
      if ((data.collections || []).length < 100) break
    }
    for (const row of collections) {
      if (!row.handle) continue
      const dbCol = dbCols.get(row.handle)
      if (VALIDATE) { if (!dbCol) console.log(`  NEW collection: ${row.handle}`); continue }
      if (!APPLY) { if (!dbCol) colsCreated++; else if (row.title && row.title !== dbCol.title) colsUpdated++; continue }
      try {
        if (!dbCol) {
          if (!isActive(row)) continue
          const res = await fetch(`${BASE}/admin/collections`, { method: "POST", headers: H, body: JSON.stringify({ handle: row.handle, title: row.title || row.handle }) })
          if (res.ok) colsCreated++; else { failed++; console.log(`  ✗ col ${row.handle} — ${res.status}`) }
        } else {
          const u = {}
          if (row.title && row.title !== dbCol.title) u.title = row.title
          if (Object.keys(u).length > 0) {
            await fetch(`${BASE}/admin/collections/${dbCol.id}`, { method: "POST", headers: H, body: JSON.stringify(u) })
            colsUpdated++
          }
        }
      } catch (e) { failed++; console.log(`  ✗ col ${row.handle} — ${e.message}`) }
    }
  }

  // ════════════════════════════════════════════════════
  // 3. PRODUCT SYNC — Grouped by Handle (multi-variant)
  // ════════════════════════════════════════════════════
  // Fetch existing DB data
  const dbProducts = new Map()
  const dbProductVariants = new Map()
  for (let off = 0; ; off += 50) {
    const res = await fetch(`${BASE}/admin/products?limit=50&offset=${off}&fields=handle,id,title,description,subtitle,thumbnail,status,metadata,categories.id,categories.handle,collection.handle,collection.id,tags.value,variants.id,variants.title,variants.sku,variants.prices.amount,variants.prices.currency_code`, { headers: H })
    const data = await res.json()
    for (const p of (data.products || [])) {
      dbProducts.set(p.handle, p)
      for (const v of (p.variants || [])) {
        if (!dbProductVariants.has(p.handle)) dbProductVariants.set(p.handle, [])
        dbProductVariants.get(p.handle).push(v)
      }
    }
    if ((data.products || []).length < 50) break
  }

  const catMap = new Map()
  for (let off = 0; ; off += 100) {
    const res = await fetch(`${BASE}/admin/product-categories?limit=100&offset=${off}&fields=id,handle`, { headers: H })
    const data = await res.json()
    for (const c of (data.product_categories || [])) catMap.set(c.handle, c.id)
    if ((data.product_categories || []).length < 100) break
  }

  // Fetch existing collections
  const dbCollections = new Map()
  for (let off = 0; ; off += 100) {
    const res = await fetch(`${BASE}/admin/collections?limit=100&offset=${off}&fields=id,handle`, { headers: H })
    const data = await res.json()
    for (const c of (data.collections || [])) dbCollections.set(c.handle, c.id)
    if ((data.collections || []).length < 100) break
  }

  // Group CSV rows by handle to build multi-variant payloads
  const groups = new Map()
  for (const row of products) {
    const h = row.handle
    if (!h) continue
    if (!groups.has(h)) groups.set(h, [])
    groups.get(h).push(row)
  }

  // Get sales channel
  if (APPLY) {
    const scRes = await fetch(`${BASE}/admin/sales-channels?limit=1&fields=id`, { headers: H })
    const scData = await scRes.json()
    salesChannelId = (scData.sales_channels || [])[0]?.id
  }

  // Get default shipping profile (all products must link to one for cart.complete())
  let shippingProfileId = null
  if (APPLY) {
    const spRes = await fetch(`${BASE}/admin/shipping-profiles?limit=1&fields=id`, { headers: H })
    const spData = await spRes.json()
    shippingProfileId = (spData.shipping_profiles || [])[0]?.id
    if (shippingProfileId) console.log(`  Shipping profile: ${shippingProfileId}`)
    else console.warn("  ⚠ No shipping profile found — products will be created without one. Run 'npx medusa db:migrate' first.")
  }

  let leafAssigned = 0, fallbackAssigned = 0

  for (const [handle, rows] of groups) {
    const dbProduct = dbProducts.get(handle)
    const firstRow = rows[0]

    if (VALIDATE) {
      if (!dbProduct) { console.log(`  NEW: ${handle} (${rows.length} variants)`); continue }
      continue
    }

    if (APPLY) {
      try {
        // ══ CREATE ══
        if (!dbProduct) {
          if (!isActive(firstRow)) continue
          const title = firstRow.product_title || handle
          const variants = rows.map(r => ({
            title: r.variant_title || "Default",
            sku: r.variant_sku || undefined,
            prices: [],
            metadata: buildVariantMeta(r),
          }))
          const optionsTitle = variants.length > 1 ? "Weight / Size" : "Default"
          const optionsValues = variants.length > 1 ? variants.map(v => v.title) : [variants[0].title]

          const body = {
            title,
            handle,
            shipping_profile_id: shippingProfileId || undefined,
            status: (firstRow.status === "published" || firstRow.status === "draft") ? firstRow.status : "published",
            description: firstRow.description || undefined,
            subtitle: firstRow.subtitle || undefined,
            thumbnail: firstRow.thumbnail_url || undefined,
            options: [{ title: optionsTitle, values: optionsValues }],
            variants,
            metadata: buildProductMeta(firstRow, {}),
            categories: resolveCategory(firstRow, catMap, catAssignment),
          }
          
          const imgs = buildImages(firstRow)
          if (imgs) body.images = imgs
          const tgs = buildTags(firstRow)
          if (tgs) body.tags = tgs
          if (firstRow.collection_handle) {
            const colId = dbCollections.get(firstRow.collection_handle)
            if (colId) body.collection_id = colId
          }

          const res = await fetch(`${BASE}/admin/products`, { method: "POST", headers: H, body: JSON.stringify(body) })
          if (res.ok) {
            const newProduct = await res.json()
            const newId = newProduct.product?.id
            if (newId && salesChannelId) {
              await fetch(`${BASE}/admin/sales-channels/${salesChannelId}/products`, { method: "POST", headers: H, body: JSON.stringify({ add: [newId] }) })
            }
            created++
            if (created % 100 === 0) console.log(`  Created ${created} products...`)
          } else {
            const err = await res.json().catch(() => ({}))
            failed++
            if (failed <= 5) console.log(`  ✗ ${handle} — ${err.message || res.status}`)
          }
        } else {
          // ══ UPDATE ══
          const updates = {}

          // Status
          if (!isActive(firstRow) && dbProduct.status === "published") updates.status = "draft"
          if (isActive(firstRow) && dbProduct.status === "draft") updates.status = "published"

          // Title
          if (firstRow.product_title && firstRow.product_title !== dbProduct.title) updates.title = firstRow.product_title

          // Description
          if (firstRow.description !== undefined && firstRow.description !== (dbProduct.description || "")) updates.description = firstRow.description

          // Subtitle
          if (firstRow.subtitle !== undefined && firstRow.subtitle !== (dbProduct.subtitle || "")) updates.subtitle = firstRow.subtitle

          // Thumbnail
          if (firstRow.thumbnail_url && firstRow.thumbnail_url !== (dbProduct.thumbnail || "")) updates.thumbnail = firstRow.thumbnail_url

          // Images
          const newImages = buildImages(firstRow)
          const currentImageUrls = (dbProduct.images || []).map(i => i.url).sort().join(",")
          const newImageUrls = newImages.map(i => i.url).sort().join(",")
          if (newImageUrls !== currentImageUrls && newImageUrls) updates.images = newImages

          // Tags
          const newTags = buildTags(firstRow)
          const currentTags = (dbProduct.tags || []).map(t => t.value).sort().join(",")
          if (newTags.map(t => t.value).sort().join(",") !== currentTags) updates.tags = newTags

          // Metadata
          const dbMeta = dbProduct.metadata || {}
          const newMeta = buildProductMeta(firstRow, dbMeta)
          const metaChanged = Object.keys(newMeta).some(k => JSON.stringify(newMeta[k]) !== JSON.stringify(dbMeta[k]))
          if (metaChanged) updates.metadata = newMeta

          // Category (set only if currently empty)
          const catRes = resolveCategory(firstRow, catMap, catAssignment)
          const currentCatIds = (dbProduct.categories || []).map(c => c.id)
          if (catRes.length > 0 && currentCatIds.length === 0) updates.categories = catRes

          // Collection (set if different)
          if (firstRow.collection_handle) {
            const colId = dbCollections.get(firstRow.collection_handle)
            if (colId && (!dbProduct.collection || dbProduct.collection.id !== colId)) updates.collection_id = colId
          }

          // Variant price updates — from prices.csv, matched by SKU
          const priceUpdates = []
          const dbVariants = dbProductVariants.get(handle) || []
          for (const pRow of prices) {
            if (!pRow.price_gbp) continue
            const sku = pRow.sku || ""
            if (!sku) continue
            const targetPrice = Math.round(parseFloat(pRow.price_gbp) * 100)
            const dbVariant = dbVariants.find(v => (v.metadata || {}).sku === sku)
            if (!dbVariant) continue
            const currentPrice = (dbVariant.prices || []).find(p => p.currency_code === "gbp")
            if (!currentPrice || currentPrice.amount !== targetPrice) {
              priceUpdates.push({ variantId: dbVariant.id, amount: targetPrice })
            }
          }
          for (const pu of priceUpdates) {
            try {
              await fetch(`${BASE}/admin/products/${dbProduct.id}/variants/${pu.variantId}`, {
                method: "POST", headers: H, body: JSON.stringify({ prices: [{ currency_code: "gbp", amount: pu.amount }] })
              })
            } catch {}
          }

          if (Object.keys(updates).length > 0 || priceUpdates.length > 0) {
            if (Object.keys(updates).length > 0) {
              const res = await fetch(`${BASE}/admin/products/${dbProduct.id}`, { method: "POST", headers: H, body: JSON.stringify(updates) })
              if (!res.ok) { failed++; console.log(`  ✗ ${handle} update — ${res.status}`) }
            }
            updated++
          } else { skipped++ }
        }
      } catch (e) { failed++; if (failed <= 3) console.log(`  ✗ ${handle} — ${e.message}`) }
    } else {
      // DRY RUN
      if (!dbProduct) created++
      else {
        const changes = []
        if (!isActive(firstRow)) changes.push("deactivate")
        if (firstRow.product_title && firstRow.product_title !== dbProduct.title) changes.push("title")
        if (changes.length > 0) updated++
        else skipped++
      }
    }
  }

  // ════════════════════════════════════════════════════
  // 4. PRICE APPLICATION (from prices.csv)
  // ════════════════════════════════════════════════════
  if (prices.length > 0 && APPLY) {
    // Refetch products with variant data (new variant IDs created above)
    const freshProducts = new Map()
    const freshVariants = new Map()
    for (let off = 0; ; off += 50) {
      const res = await fetch(`${BASE}/admin/products?limit=50&offset=${off}&fields=handle,id,variants.id,variants.title,variants.prices.amount,variants.prices.currency_code,variants.metadata`, { headers: H })
      const data = await res.json()
      for (const p of (data.products || [])) {
        freshProducts.set(p.handle, p)
        for (const v of (p.variants || [])) {
          if (!freshVariants.has(p.handle)) freshVariants.set(p.handle, [])
          freshVariants.get(p.handle).push(v)
        }
      }
      if ((data.products || []).length < 50) break
    }

    let priceApplied = 0
    for (const pRow of prices) {
      if (!pRow.price_gbp) continue
      const targetPrice = Math.round(parseFloat(pRow.price_gbp) * 100)
      const sku = pRow.sku || pRow.handle || ""
      if (!sku) continue

      // Lookup variant by SKU in metadata
      let dbVariant = null, dbProduct = null
      for (const [handle, variants] of freshVariants) {
        const found = variants.find(v => v.metadata?.sku === sku)
        if (found) { dbVariant = found; dbProduct = freshProducts.get(handle); break }
      }

      if (!dbVariant || !dbProduct) continue
      const currentPrice = (dbVariant.prices || []).find(p => p.currency_code === "gbp")
      if (!currentPrice || currentPrice.amount !== targetPrice) {
        try {
          await fetch(`${BASE}/admin/products/${dbProduct.id}/variants/${dbVariant.id}`, {
            method: "POST", headers: H, body: JSON.stringify({ prices: [{ currency_code: "gbp", amount: targetPrice }] })
          })
          priceApplied++
        } catch {}
      }
    }
    if (priceApplied > 0) console.log(`  Prices applied: ${priceApplied}`)
  }

  // ════════════════════════════════════════════════════
  // 5. COLLECTION ASSIGNMENT (from products-collections.csv)
  // ════════════════════════════════════════════════════
  if (productCollections.length > 0 && APPLY) {
    let colAssigned = 0
    for (const pc of productCollections) {
      const h = pc.product_handle || pc.handle
      if (!h) continue
      const dbProduct = dbProducts.get(h)
      if (!dbProduct) continue
      const colHandle = pc.collection_handle
      if (!colHandle) continue
      const colId = dbCollections.get(colHandle)
      if (!colId) continue
      if (!dbProduct.collection || dbProduct.collection.id !== colId) {
        try {
          await fetch(`${BASE}/admin/products/${dbProduct.id}`, {
            method: "POST", headers: H, body: JSON.stringify({ collection_id: colId })
          })
          colAssigned++
        } catch {}
      }
    }
    if (colAssigned > 0) console.log(`  Collections assigned: ${colAssigned}`)
  }

  // ════════════════════════════════════════════════════
  // 6. INVENTORY SETUP — link variants to stock location
  // ════════════════════════════════════════════════════
  if (APPLY) {
    try {
      const locRes = await fetch(`${BASE}/admin/stock-locations?limit=1&fields=id,name`, { headers: H })
      const locData = await locRes.json()
      const locationId = (locData.stock_locations || [])[0]?.id

      if (locationId) {
        // Fetch all products with variant inventory items
        let levelsCreated = 0
        let itemsProcessed = 0
        for (let off = 0; ; off += 50) {
          const res = await fetch(`${BASE}/admin/products?limit=50&offset=${off}&fields=variants.id,variants.title,variants.inventory_items.inventory_item_id`, { headers: H })
          const data = await res.json()
          for (const p of (data.products || [])) {
            for (const v of (p.variants || [])) {
              const invId = (v.inventory_items || [])[0]?.inventory_item_id
              if (!invId) continue
              itemsProcessed++
              try {
                await fetch(`${BASE}/admin/inventory-items/${invId}/location-levels`, {
                  method: "POST",
                  headers: { ...H, "Content-Type": "application/json" },
                  body: JSON.stringify({ location_id: locationId, stocked_quantity: 1000000 }),
                })
                levelsCreated++
              } catch {}
            }
          }
          if ((data.products || []).length < 50) break
        }
        if (levelsCreated > 0) console.log(`  Inventory levels created: ${levelsCreated}/${itemsProcessed}`)
      }
    } catch (e) {
      console.log(`  ⚠ Inventory setup skipped: ${e.message}`)
    }
  }

  // ════════════════════════════════════════════════════
  // 8. MEILISEARCH
  // ════════════════════════════════════════════════════
  if (!VALIDATE) {
    try {
      const synMap = {}
      for (const s of synonyms) { if (s.term && s.synonyms) synMap[s.term] = s.synonyms.split(";").map(x => x.trim()) }
      if (APPLY && Object.keys(synMap).length > 0) {
        await fetch(`${MEILI}/indexes/products/settings/synonyms`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(synMap) })
      }

      const filterList = filters.map(f => f.attribute).filter(Boolean)
      if (APPLY && filterList.length > 0) {
        await fetch(`${MEILI}/indexes/products/settings/filterable-attributes`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(filterList) })
      }

      if (APPLY && REINDEX) {
        // Trigger reindex by fetching all products and re-indexing
        console.log("\n  Triggering MeiliSearch reindex...")
        const { execSync } = await import("child_process")
        try {
          execSync("npm run reindex", { cwd: resolve(__dirname, "..", "apps", "meilisearch"), stdio: "pipe" })
          console.log("  ✓ Reindex triggered")
        } catch { console.log("  ⚠ Reindex failed — run manually: cd apps/meilisearch && npm run reindex") }
      }

      if (APPLY) console.log(`  MeiliSearch: ${Object.keys(synMap).length} synonyms, ${filterList.length} filters synced`)
    } catch (e) { console.log(`  ⚠ MeiliSearch unavailable: ${e.message}`) }
  }

  // ════════════════════════════════════════════════════
  // 9. PUBLISHABLE KEY AUTO-SYNC
  // ════════════════════════════════════════════════════
  if (APPLY && created > 0) {
    try {
      const keyRes = await fetch(`${BASE}/admin/api-keys?limit=1&type=publishable&fields=token`, { headers: H })
      const keyData = await keyRes.json()
      const pk = (keyData.api_keys || [])[0]?.token
      if (pk) {
        const envPath = resolve(__dirname, "..", "apps", "storefront", ".env")
        if (existsSync(envPath)) {
          let content = readFileSync(envPath, "utf8")
          content = content.replace(/NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=.*/, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${pk}`)
          writeFileSync(envPath, content)
        }
      }
    } catch {}
  }

  // ════════════════════════════════════════════════════
  // REPORT
  // ════════════════════════════════════════════════════
  console.log(`\n${"=".repeat(60)}`)
  console.log(`  Products:   C=${created} U=${updated} S=${skipped} F=${failed}`)
  if (categories.length > 0) console.log(`  Categories: C=${catsCreated} U=${catsUpdated}`)
  if (collections.length > 0) console.log(`  Collections: C=${colsCreated} U=${colsUpdated}`)
  if (!APPLY && !VALIDATE) console.log(`\n  DRY RUN — run with --apply`)
  console.log(`${"=".repeat(60)}`)
}

// ════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════
function buildProductMeta(row, dbMeta) {
  // Required by Medusa v2 product metadata Zod schema
  const meta = {
    country_of_origin: dbMeta.country_of_origin || row.country_of_origin || "India",
    uk_food_business_operator: dbMeta.uk_food_business_operator || "IndiaGrocers London",
    ingredients: dbMeta.ingredients || row.ingredients || "See product packaging",
    allergens: dbMeta.allergens || (row.allergens ? row.allergens.split(";").filter(Boolean) : []),
    vat_rate: dbMeta.vat_rate ?? (row.vat_rate ? parseFloat(row.vat_rate) : 0),
    velocity: dbMeta.velocity || "B",
    sourcing_tier: dbMeta.sourcing_tier || "B",
    dietary_flags: row.dietary_flags ? row.dietary_flags.split(";").filter(Boolean) : (dbMeta.dietary_flags || []),
    regional_tags: row.regional_tags ? row.regional_tags.split(";").filter(Boolean) : (dbMeta.regional_tags || []),
    subscription_eligible: dbMeta.subscription_eligible ?? (row.subscription_eligible === "true"),
    requires_fast_delivery: dbMeta.requires_fast_delivery ?? false,
    requires_cold_chain: dbMeta.requires_cold_chain ?? false,
    brand_slug: row.brand_slug || dbMeta.brand_slug || autoBrandSlug(row.product_title || ""),
    synonyms: dbMeta.synonyms || [],
  }

  // Optional overrides from CSV (only if present)
  if (row.ingredients && row.ingredients !== "See product packaging") meta.ingredients = row.ingredients
  if (row.storage) meta.storage = row.storage
  if (row.weight_value) meta.weight_value = parseFloat(row.weight_value)
  if (row.weight_unit) meta.weight_unit = row.weight_unit
  if (row.eco_rating) meta.eco_rating = row.eco_rating

  return meta
}

function resolveCategory(row, catMap, catAssignment) {
  // First: use category_handle from CSV if present
  if (row.category_handle && catMap.has(row.category_handle)) {
    return [{ id: catMap.get(row.category_handle) }]
  }
  // Fallback: look up in category-assignment.json (keys now match DB handles directly)
  if (catAssignment && row.product_title) {
    const dbHandle = catAssignment.mappings?.[row.product_title]
    if (dbHandle && catMap.has(dbHandle)) {
      return [{ id: catMap.get(dbHandle) }]
    }
  }
  return []
}

function buildVariantMeta(row) {
  const meta = {}
  if (row.weight_value) meta.weight_value = parseFloat(row.weight_value)
  if (row.weight_unit) meta.weight_unit = row.weight_unit
  if (row.variant_sku) meta.sku = row.variant_sku
  if (row.variant_barcode) meta.barcode = row.variant_barcode
  return Object.keys(meta).length > 0 ? meta : undefined
}

function buildImages(row) {
  if (!row.image_filenames || typeof row.image_filenames !== "string" || !row.image_filenames.trim()) return undefined
  const filenames = row.image_filenames.split(";").filter(Boolean)
  if (filenames.length === 0) return undefined
  return filenames.map(fn => ({ url: `/uploads/${fn}` }))
}

function buildTags(row) {
  if (!row.tags || typeof row.tags !== "string" || !row.tags.trim()) return undefined
  return row.tags.split(";").filter(Boolean).map(v => ({ value: v.trim() }))
}

main().catch(e => { console.error(e); process.exit(1) })
