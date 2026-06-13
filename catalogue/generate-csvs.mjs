/**
 * GENERATE CSVs FROM CURRENT DATABASE
 *
 * Reads the live Medusa DB via Admin API and generates the catalogue CSV
 * files. This is a ONE-TIME operation to bootstrap the catalogue system.
 * After this, CSVs are maintained manually.
 *
 * Usage:
 *   node catalogue/generate-csvs.mjs
 *
 * Output:
 *   catalogue/products.csv       — All products with variants, metadata
 *   catalogue/categories.csv     — Category tree
 *   catalogue/meilisearch/synonyms.csv
 *   catalogue/meilisearch/filters.csv
 *   catalogue/prices/current.csv
 */

import { writeFileSync, mkdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "http://127.0.0.1:9000"
const MEILI = "http://localhost:7700"
const OUT = resolve(__dirname)
mkdirSync(resolve(OUT, "prices"), { recursive: true })

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: `Bearer ${(await res.json()).token}`, "Content-Type": "application/json" }
}

async function main() {
  const H = await login()
  console.log("✓ Authenticated\n")

  // ────────────────────────────────────────────────────────
  // 1. PRODUCTS
  // ────────────────────────────────────────────────────────
  console.log("1. Exporting products...")
  const products = []
  for (let offset = 0; ; offset += 50) {
    const res = await fetch(
      `${BASE}/admin/products?limit=50&offset=${offset}&fields=handle,title,subtitle,description,thumbnail,metadata,tags.id,tags.value,categories.handle,categories.name,collection.handle,collection.title,variants.id,variants.title,variants.sku,variants.prices.amount,variants.prices.currency_code,variants.manage_inventory,variants.inventory_quantity,variants.allow_backorder,variants.metadata`,
      { headers: H }
    )
    const data = await res.json()
    const batch = data.products || []
    products.push(...batch)
    console.log(`  ${products.length} of ${data.count || "?"}`)
    if (batch.length < 50) break
  }

  // Build variant-based CSV rows
  const rows = []
  for (const p of products) {
    const prodTitle = makeProductTitle(p)
    const brand = extractBrand(p.title)
    const brandSlug = extractBrandSlug(brand)
    const tags = (p.tags || []).map(t => t.value).join(";")
    const dietary = extractDietary(p.metadata)
    const meta = p.metadata || {}
    const primaryCat = p.categories?.[0]?.handle || ""
    const collection = p.collection?.handle || ""

    for (const v of (p.variants || [])) {
      const vMeta = v.metadata || {}
      const gbp = (v.prices || []).find(pr => pr.currency_code === "gbp")
      const weightG = vMeta.weight_value || vMeta.weight_grams || ""
      const weightU = vMeta.weight_unit || ""

      rows.push(escapeCsv([
        p.handle,                                 // handle
        v.id,                                      // variant_id
        "",                                        // variant_sku
        "",                                        // variant_barcode
        extractProductGroup(p.handle, p.title),    // product_group
        v.title === "Default" ? "" : v.title,      // variant_title
        prodTitle,                                 // product_title (cleaned)
        p.subtitle || "",                          // subtitle
        (p.description || "").replace(/\n/g, " "), // description
        brand,                                     // brand
        primaryCat,                                // category_handle
        collection,                                // collection_handle
        dietary,                                   // dietary_flags
        tags,                                      // tags
        (fmtField(meta.allergens).replace(/,/g, ";")),  // allergens
        (fmtField(meta.ingredients).replace(/\n/g, " ").replace(/,/g, ";")), // ingredients
        (fmtField(meta.storage).replace(/,/g, ";")),   // storage
        (fmtField(meta.country_of_origin).replace(/,/g, ";")), // country_of_origin
        weightG,                                   // weight_value
        weightU,                                   // weight_unit
        gbp ? (gbp.amount / 100).toFixed(2) : "",  // price_gbp
        String(v.manage_inventory ?? false),        // manage_inventory
        p.thumbnail || "",                         // thumbnail_url
        fmtField(meta.image_filenames),            // image_filenames
        fmtField(meta.velocity),                   // velocity
        fmtField(meta.eco_rating),                 // eco_rating
        fmtField(brandSlug || meta.brand_slug),     // brand_slug (computed from brand name takes priority)
        fmtField(meta.vat_rate),                   // vat_rate
        fmtField(meta.regional_tags).replace(/,/g, ";"), // regional_tags
        fmtField(meta.subscription_eligible),      // subscription_eligible
        p.status || "published",                   // status
        v.title,                                   // variant_title_raw
        v.sku || "",                               // variant_sku_raw  
      ]))
    }
  }

  const csvHeader = "handle,variant_id,variant_sku,variant_barcode,product_group,variant_title,product_title,subtitle,description,brand,category_handle,collection_handle,dietary_flags,tags,allergens,ingredients,storage,country_of_origin,weight_value,weight_unit,price_gbp,manage_inventory,thumbnail_url,image_filenames,velocity,eco_rating,brand_slug,vat_rate,regional_tags,subscription_eligible,status,variant_title_raw,variant_sku_raw"
  writeFileSync(resolve(OUT, "products.csv"), csvHeader + "\n" + rows.join("\n"))
  console.log(`\n✓ products.csv: ${rows.length} rows (${products.length} products)\n`)

  // ────────────────────────────────────────────────────────
  // 2. CATEGORIES
  // ────────────────────────────────────────────────────────
  console.log("2. Exporting categories...")
  const cats = []
  for (let offset = 0; ; offset += 100) {
    const res = await fetch(`${BASE}/admin/product-categories?limit=100&offset=${offset}&fields=handle,name,parent_category.handle,parent_category_id,rank,metadata`, { headers: H })
    const data = await res.json()
    for (const c of (data.product_categories || [])) cats.push(c)
    if ((data.product_categories || []).length < 100) break
  }

  const catRows = cats.map(c => escapeCsv([
    c.handle,
    (c.name || ""),
    c.parent_category?.handle || "",
    c.rank || "",
    "",
  ]))
  const catHeader = "handle,name,parent_handle,rank,description"
  writeFileSync(resolve(OUT, "categories.csv"), catHeader + "\n" + catRows.join("\n"))
  console.log(`✓ categories.csv: ${catRows.length} categories\n`)

  // ────────────────────────────────────────────────────────
  // 3. PRICES
  // ────────────────────────────────────────────────────────
  console.log("3. Exporting prices...")
  const priceRows = []
  for (const p of products) {
    for (const v of (p.variants || [])) {
      const gbp = (v.prices || []).find(pr => pr.currency_code === "gbp")
      if (gbp) {
        const today = new Date().toISOString().slice(0, 10)
        priceRows.push(escapeCsv([p.handle, (gbp.amount / 100).toFixed(2), today]))
      }
    }
  }
  const priceHeader = "variant_handle,price_gbp,effective_date"
  writeFileSync(resolve(OUT, "prices", "current.csv"), priceHeader + "\n" + priceRows.join("\n"))
  console.log(`✓ prices/current.csv: ${priceRows.length} price entries\n`)

  // ────────────────────────────────────────────────────────
  // 4. MEILISEARCH
  // ────────────────────────────────────────────────────────
  console.log("4. Exporting MeiliSearch config...")
  try {
    // Synonyms
    const synRes = await fetch(`${MEILI}/indexes/products/settings/synonyms`)
    const synData = await synRes.json()
    const synRows = []
    for (const [term, synonyms] of Object.entries(synData || {})) {
      synRows.push(`"${term}","${Array.isArray(synonyms) ? synonyms.join(";") : synonyms}"`)
    }
    writeFileSync(resolve(OUT, "meilisearch", "synonyms.csv"), "term,synonyms\n" + synRows.join("\n"))
    console.log(`  ✓ meilisearch/synonyms.csv: ${synRows.length} entries`)
  } catch {
    console.log("  ⚠ MeiliSearch not available — synonyms.csv will be empty")
    writeFileSync(resolve(OUT, "meilisearch", "synonyms.csv"), "term,synonyms\n")
  }

  try {
    // Filterable attributes
    const filRes = await fetch(`${MEILI}/indexes/products/settings/filterable-attributes`)
    const filData = await filRes.json()
    writeFileSync(resolve(OUT, "meilisearch", "filters.csv"), "attribute\n" + (filData || []).join("\n"))
    console.log(`  ✓ meilisearch/filters.csv: ${(filData || []).length} attributes`)
  } catch {
    console.log("  ⚠ MeiliSearch not available — filters.csv will be empty")
    writeFileSync(resolve(OUT, "meilisearch", "filters.csv"), "attribute\nprice_gbp\ncategory_handle\nbrand\ndietary_flags\n")
  }

  // Ranking rules
  writeFileSync(resolve(OUT, "meilisearch", "ranking.csv"), "rule\nwords\ntypo\nproximity\nattribute\nsort\nexactness")

  console.log(`\n==================`)
  console.log(`  Generation complete`)
  console.log(`  Files: products.csv (${rows.length} rows), categories.csv (${cats.length}), prices/current.csv (${priceRows.length})`)
  console.log(`  Next: node catalogue/enrich.mjs --validate-only`)
}

// ────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────
function fmtField(val) {
  if (val == null) return ""
  if (Array.isArray(val)) return val.join(";")
  return String(val)
}

function normalizeNatcoTitle(title) {
  title = (title || "").trim()
  const m = title.match(/^(.+?)\s*-\s*(Natco)\s*-\s*\1$/i)
  if (m) title = `${m[2]} - ${m[1]}`
  // Strip weight suffix for product_title (not for variant title)
  return title.replace(/\s+\d+\.?\d*\s*(g|kg|ml|l|litre|oz|lb)$/i, "").trim()
}

const BRAND_SLUG_MAP = {
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

function extractBrand(title) {
  // Try "Brand - Product" pattern first (normalized format)
  const norm = normalizeNatcoTitle(title)
  const dashIdx = norm.indexOf(" - ")
  if (dashIdx > 0) {
    const potentialBrand = norm.slice(0, dashIdx).trim()
    // Verify it matches a known brand
    const lower = potentialBrand.toLowerCase().replace(/['']/g, "'")
    for (const [name] of Object.entries(BRAND_SLUG_MAP)) {
      if (lower === name || lower.includes(name) || name.includes(lower)) {
        return potentialBrand
      }
    }
  }
  // Fallback: check if title starts with a known brand prefix
  const lower = title.toLowerCase().replace(/['']/g, "'")
  for (const [name] of Object.entries(BRAND_SLUG_MAP)) {
    if (lower.startsWith(name)) return name.charAt(0).toUpperCase() + name.slice(1)
  }
  return ""
}

function extractBrandSlug(brand) {
  if (!brand) return ""
  const lower = brand.toLowerCase().replace(/['']/g, "'")
  for (const [name, slug] of Object.entries(BRAND_SLUG_MAP)) {
    if (lower === name || lower.includes(name)) return slug
  }
  return ""
}

function makeProductTitle(p) {
  const brand = extractBrand(p.title)
  const cleanTitle = normalizeNatcoTitle(p.title)
  if (brand) {
    // If title already starts with brand, use as-is
    if (cleanTitle.toLowerCase().startsWith(brand.toLowerCase())) return cleanTitle
    return `${brand} - ${cleanTitle}`
  }
  return cleanTitle
}

function extractProductGroup(handle, title) {
  return handle.replace(/-([0-9]+(g|kg|ml|l)|jar|box|pack)/, "") || handle
}

function extractDietary(metadata) {
  if (!metadata?.dietary_flags) return ""
  const flags = Array.isArray(metadata.dietary_flags)
    ? metadata.dietary_flags
    : String(metadata.dietary_flags).split(",")
  return flags.map(f => String(f).trim()).filter(Boolean).join(";")
}

function escapeCsv(fields) {
  return fields.map(f => {
    const s = String(f || "")
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }).join(",")
}

main().catch(e => { console.error(e); process.exit(1) })
