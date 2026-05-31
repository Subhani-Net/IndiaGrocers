/**
 * Import missing Natco products from Shopify JSON into Medusa.
 * Phase 1 gate — must pass catalog completeness audit before proceeding.
 *
 * Usage: node scripts/import-from-shopify.mjs [--dry]
 * Prerequisites: Backend running on :9000
 */

import { readFileSync, readdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "http://127.0.0.1:9000"
const DRY = process.argv.includes("--dry")

const SUBCATEGORY_MAP = {
  "Lentils": "dried-lentils-beans-peas",
  "Beans": "dried-lentils-beans-peas",
  "Soya": "soya-products",
  "Tinned Lentils, Beans": "tinned-lentils-beans",
  "Daria Lentil Snack": "namkeen-lentil-snacks",
  "Tinned Vegetables": "tinned-vegetables",
  "Tinned Coconut": "tinned-coconut",
  "Tinned Fruit": "tinned-fruit",
  "Spices": "spices-herbs",
  "Spice Jars": "spice-herb-jars",
  "Spice & Herb Jars": "spice-herb-jars",
  "Spice Blends and Mixes": "spice-blends-mixes",
  "Food Colouring": "food-colourings-essences",
  "Flavouring": "food-colourings-essences",
  "Herbs": "spices-herbs",
  "Rice": "rice-quinoa",
  "Flour": "flours",
  "Corn": "corn",
  "Sugar & Jaggery": "sugar",
  "Pappadoms": "pappadoms",
  "Pickles": "chutneys-pickles-sauces",
  "Chutney": "chutneys-pickles-sauces",
  "Sauce": "chutneys-pickles-sauces",
  "Flavoured Nuts": "flavoured-nuts-snacks",
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 80)
}

async function login() {
  const res = await fetch(BASE + "/auth/user/emailpass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: "Bearer " + (await res.json()).token, "Content-Type": "application/json" }
}

async function main() {
  const headers = await login()
  console.log("Shopify JSON → Medusa Import\n")

  // 1. Collect all Shopify products from JSON files
  // Source files are from tool output — let me collect them
  const OUTFILES = [
    "tool_e727f970c001iGsCnPszJ3NkKU",  // All Lentils
    "tool_e750f76cb0019fUhhV7LBFuwFu",  // Tinned Products
    "tool_e75d8b59f0019D2TM1pzEYOeLt",  // Spices & Herbs
    "tool_e75d890d000115TlXZap7AGYuu",  // Spice Jars
    "tool_e75f3ebef001domtF9anGMeYc4",  // Snacks
    "tool_e75f3ee6f001f27S3a4SdPylpe",  // Grains
    "tool_e75f3f12a001LLcb35JzMhO3Kw",  // Essentials
    "tool_e75f4128f001BzAJlfR8i1swIE",  // Raw Nuts
  ]
  
  const TOOL_DIR = "C:/Users/Subhani/.local/share/opencode/tool-output"
  const shopifyProducts = {}
  let filesLoaded = 0

  for (const f of OUTFILES) {
    const fp = resolve(TOOL_DIR, f)
    try {
      const raw = readFileSync(fp, "utf-8")
      const data = JSON.parse(raw)
      if (!data.products) continue
      
      for (const p of data.products) {
        if (!p.title || !p.handle) continue
        // Skip case/full-case products
        if (p.title.toLowerCase().includes("full case") || p.title.toLowerCase().includes("12x")) continue
        
        // Deduplicate by handle
        if (shopifyProducts[p.handle]) continue
        
        const v = p.variants?.[0] || {}
        shopifyProducts[p.handle] = {
          handle: p.handle,
          title: p.title,
          subtitle: "",
          description: (p.body_html || "").replace(/<[^>]+>/g, "").trim().slice(0, 500),
          vendor: p.vendor || "Natco Foods",
          type: p.product_type,
          tags: (p.tags || []).filter(t => !t.match(/^\d{4}BEST$/) && t !== "0" && t !== "haldiram" && t !== "bikaji"),
          price: parseFloat(v.price || "0") || 0,
          sku: v.sku || p.handle,
          grams: v.grams || 0,
          image: p.images?.[0]?.src || "",
        }
      }
      filesLoaded++
    } catch (e) {
      // File not found or parse error — skip
    }
  }

  console.log(`Loaded ${Object.keys(shopifyProducts).length} products from ${filesLoaded} Shopify JSON files\n`)

  // 2. Fetch existing DB products
  console.log("Fetching existing products from DB...")
  const dbTitles = new Set()
  let off = 0
  while (true) {
    const r = await (await fetch(BASE + "/admin/products?limit=100&offset=" + off + "&fields=title", { headers })).json()
    if (!r.products?.length) break
    r.products.forEach(p => dbTitles.add(p.title))
    off += 100
  }
  console.log(`  ${dbTitles.size} products in DB\n`)

  // 3. Find missing products
  const toImport = []
  for (const [, p] of Object.entries(shopifyProducts)) {
    if (!dbTitles.has(p.title)) {
      toImport.push(p)
    }
  }
  console.log(`${toImport.length} products to import\n`)

  if (toImport.length === 0) {
    console.log("✅ Catalog is complete — no products missing")
    return
  }

  if (DRY) {
    console.log("DRY RUN — would import:")
    toImport.slice(0, 10).forEach(p => console.log("  " + p.title))
    if (toImport.length > 10) console.log("  ... and " + (toImport.length - 10) + " more")
    return
  }

  // 4. Import products
  console.log("Importing...")
  let created = 0, failed = 0

  for (const p of toImport) {
    const payload = {
      title: p.title,
      handle: p.handle,
      subtitle: p.subtitle || undefined,
      description: p.description || undefined,
      status: "published",
      options: [{ title: "Weight/Size", values: ["Default"] }],
      variants: [{
        title: "Default",
        sku: p.sku,
        barcode: p.sku,
        manage_inventory: false,
        allow_backorder: true,
        prices: [{ currency_code: "gbp", amount: Math.round(p.price * 100) }],
        options: { "Weight/Size": "Default" },
      }],
      metadata: {
        allergens: [],
        vat_rate: 0,
        country_of_origin: "India",
        uk_food_business_operator: "Natco Foods Ltd, Buckingham, UK",
        ingredients: p.title,
        dietary_flags: ["vegetarian"],
        velocity: "B",
        sourcing_tier: "A",
        brand_slug: "natco",
        subscription_eligible: true,
        requires_fast_delivery: false,
        requires_cold_chain: false,
        synonyms: [],
        regional_tags: [],
      },
    }

    try {
      const r = await fetch(BASE + "/admin/products", {
        method: "POST", headers, body: JSON.stringify(payload),
      })
      if (r.ok) {
        created++
        if (created % 25 === 0) console.log("  " + created + "/" + toImport.length)
      } else {
        const err = await r.text()
        console.log("  FAIL: " + p.title + " — " + err.slice(0, 80))
        failed++
      }
    } catch (e) {
      console.log("  ERROR: " + p.title + " — " + e.message)
      failed++
    }
  }

  console.log("\nDone: " + created + " created, " + failed + " failed")

  // 5. Assign categories to new products
  if (created > 0) {
    console.log("\nAssigning categories...")
    const cats = await (await fetch(BASE + "/admin/product-categories?limit=300&fields=id,handle", { headers })).json()
    const catByHandle = {}
    cats.product_categories.forEach(c => catByHandle[c.handle] = c.id)

    // Fetch all products again (to get IDs for the newly created ones)
    const allProds = {}
    off = 0
    while (true) {
      const r = await (await fetch(BASE + "/admin/products?limit=100&offset=" + off + "&fields=id,title", { headers })).json()
      if (!r.products?.length) break
      r.products.forEach(p => allProds[p.title] = p.id)
      off += 100
    }

    let assigned = 0
    for (const p of toImport) {
      const catHandle = SUBCATEGORY_MAP[p.type] || "spices-herbs"
      const catId = catByHandle[catHandle]
      const prodId = allProds[p.title]
      if (!catId || !prodId) { console.log("  SKIP: " + p.title + " — no cat or prod"); continue }
      try {
        const r = await fetch(BASE + "/admin/product-categories/" + catId + "/products", {
          method: "POST", headers, body: JSON.stringify({ add: [prodId] }),
        })
        if (r.ok) assigned++
      } catch (e) { console.log("  CAT FAIL: " + p.title) }
    }
    console.log("  Categories assigned to " + assigned + " products")
  }

  // 6. Run enrichment on new products
  console.log("\nNext: node scripts/enrich-from-csv.mjs --apply")
  console.log("Then: cd apps/meilisearch && npm run reindex")
  console.log("Verify: node scripts/verify-data-health.mjs")
}

main().catch(console.error)
