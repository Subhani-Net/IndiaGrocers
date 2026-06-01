/**
 * MVC Round 1 Brand Import Script
 *
 * Imports products from Implementation/MVC_products/round1-products.json
 * into Medusa. Assigns to existing and new MVC categories.
 *
 * Usage:
 *   node scripts/mvc/import-round1.mjs              # Dry run
 *   node scripts/mvc/import-round1.mjs --apply      # Import
 */

import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..", "..")
const BASE = "http://127.0.0.1:9000"
const APPLY = process.argv.includes("--apply")
const JSON_PATH = resolve(ROOT, "Implementation/MVC_products/round1-products.json")

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

  // 1. Read products
  const raw = readFileSync(JSON_PATH, "utf-8")
  const products = JSON.parse(raw)
  console.log("Loaded " + products.length + " products from round1-products.json\n")

  // 2. Check existing products in DB
  console.log("Checking for existing products...")
  const allProds = []
  let off = 0
  while (true) {
    const r = await (await fetch(BASE + "/admin/products?limit=100&offset=" + off + "&fields=id,title", { headers })).json()
    if (!r.products || !r.products.length) break
    allProds.push(...r.products)
    off += 100
  }
  const dbTitles = new Set(allProds.map(p => p.title))
  console.log("  " + allProds.length + " products in DB\n")

  // 3. Build import list (skip existing)
  const toImport = []
  let skipped = 0
  for (const p of products) {
    // Build full title: "Brand Product Name"
    const title = p.product_name

    if (dbTitles.has(title)) {
      console.log("  SKIP (exists): " + title)
      skipped++
      continue
    }

    const variants = (p.variants || ["Standard"]).filter(v => v && v !== "Standard")
    const variantList = variants.length > 0 ? variants : ["Standard"]
    const firstVariant = variantList[0]
    // Include weight in handle to avoid collisions (e.g., Tilda 2kg vs Tilda 5kg)
    const weightSlug = firstVariant.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
    const handle = slugify(title + "-" + weightSlug).slice(0, 80)

    toImport.push({
      title,
      handle,
      brand: p.brand || "generic",
      category: p.category || "all-essentials",
      variants: variantList.map((v, vi) => ({
        title: v === "Standard" ? "Default" : v,
        sku: `MVC-${slugify(p.brand)}-${handle}-v${vi}`.slice(0, 80),
        price: p.price_gbp || 299,
      })),
      description: p.description || "",
    })
  }

  console.log("\n" + skipped + " skipped, " + toImport.length + " to import\n")

  if (!APPLY) {
    console.log("DRY RUN — showing first 10 products:\n")
    for (const p of toImport.slice(0, 10)) {
      console.log("  " + p.title + " → " + p.category)
    }
    console.log("\nRun with --apply to import " + toImport.length + " products")
    return
  }

  // 4. Fetch category IDs
  console.log("Fetching category IDs...")
  const catsRes = await (await fetch(BASE + "/admin/product-categories?limit=200&fields=id,handle", { headers })).json()
  const catByHandle = {}
  catsRes.product_categories.forEach(c => { catByHandle[c.handle] = c.id })
  console.log("  " + Object.keys(catByHandle).length + " categories\n")

  // 5. Import products
  console.log("Importing products...")
  let created = 0, failed = 0

  for (const p of toImport) {
    const variantList = p.variants.map((v, vi) => ({
      title: v.title,
      sku: v.sku,
      manage_inventory: false,
      allow_backorder: true,
      prices: [{ currency_code: "gbp", amount: v.price }],
      options: { "Weight/Size": v.title },
    }))

    const options = [{ title: "Weight/Size", values: variantList.map(v => v.options["Weight/Size"]) }]

    const payload = {
      title: p.title,
      handle: p.handle,
      status: "published",
      description: p.description,
      options,
      variants: variantList,
      metadata: {
        brand_slug: "generic",
        country_of_origin: "India",
        uk_food_business_operator: "Imported by IndiaGrocers Ltd, London",
        dietary_flags: ["vegetarian"],
        allergens: [],
        vat_rate: 0,
        velocity: "B",
        sourcing_tier: "B",
        ingredients: "See product packaging for full ingredients list",
        best_before_guidance: "See product packaging",
        synonyms: [],
        regional_tags: [],
        subscription_eligible: true,
        requires_fast_delivery: false,
        requires_cold_chain: false,
        mvc_round: "1",
      },
    }

    try {
      const res = await fetch(BASE + "/admin/products", {
        method: "POST", headers,
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const { product } = await res.json()
        created++

        // Assign category
        const catId = catByHandle[p.category]
        if (catId) {
          await fetch(BASE + "/admin/product-categories/" + catId + "/products", {
            method: "POST", headers,
            body: JSON.stringify({ add: [product.id] }),
          })
        }

        if (created % 20 === 0) console.log("  " + created + "/" + toImport.length)
      } else {
        const err = await res.text()
        console.log("  FAIL: " + p.title + " — " + err.slice(0, 100))
        failed++
      }
    } catch (e) {
      console.log("  ERROR: " + p.title + " — " + e.message)
      failed++
    }
  }

  console.log("\nDone: " + created + " created, " + failed + " failed")

  if (created > 0) {
    console.log("\nNext steps:")
    console.log("  Enrich:  node scripts/mvc/pipeline.mjs --apply")
    console.log("  Reindex: cd apps/meilisearch && npm run reindex")
    console.log("  Verify:  node scripts/verify-data-health.mjs")
  }
}

main().catch(console.error)
