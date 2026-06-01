/**
 * TRS Products Import Script
 * 
 * Reads Implementation/TRS_products/products.json, renames images
 * following convention {brand}_{handle}.{ext}, and imports products
 * into Medusa with correct category assignments.
 *
 * Usage:
 *   node scripts/import-trs-products.mjs            # Dry run
 *   node scripts/import-trs-products.mjs --apply    # Import to Medusa
 *
 * Prerequisites:
 *   Backend running on :9000
 *   Images renamed: scripts/rename-trs-images.mjs (run first)
 */

import { readFileSync, existsSync, mkdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const BASE = "http://127.0.0.1:9000"
const APPLY = process.argv.includes("--apply")
const IMG_DIR = resolve(ROOT, "apps/storefront/public/images")

const TRS_JSON = resolve(ROOT, "Implementation/TRS_products/products.json")

// ─── CATEGORY MAPPING ───

const CATEGORY_MAP = {
  "Spices": "spices-herbs",
  "Pulses": "dried-lentils-beans-peas",
  "Flours": "flours",
  "Rice": "rice-quinoa",
  "Condiments Sauces": "chutneys-pickles-sauces",
  "Dried Fruit Nuts": "raw-nuts",
  "Snacks": "namkeen-lentil-snacks",
  "Cans": "tinned-products-parent",
  "Speciality": "seeds",
}

function getSubcategory(name, trsCat) {
  const t = name.toLowerCase()
  // Spice blends override
  if (t.includes("garam masala") || t.includes("tandoori") || t.includes("chicken masala") ||
      t.includes("curry powder") || t.includes("curry") || t.includes("chana masala") ||
      t.includes("chaat masala") || t.includes("biryani") || t.includes("pav bhaji"))
    return "spice-blends-mixes"
  // Colourings override
  if (t.includes("food colour") || t.includes("essence") || t.includes("flavouring") || t.includes("rose water"))
    return "food-colourings-essences"
  // Soya override
  if (t.includes("soya") && !t.includes("soya bean")) return "soya-products"
  // Tinned override
  if (t.includes("boiled") || t.includes("tinned")) return "tinned-lentils-beans"
  // Pappadoms override
  if (t.includes("papad") || t.includes("pappad")) return "pappadoms"
  // Dried fruit override
  if (t.includes("dried") || t.includes("date") || t.includes("raisin")) return "dried-fruit"
  // Coconut override
  if (t.includes("coconut")) return "coconut-products"
  // Popcorn override
  if (t.includes("popcorn")) return "corn"
  // Tinned vegetable override
  if (t.includes("saag") || t.includes("mustard greens")) return "tinned-vegetables"
  // Default
  return CATEGORY_MAP[trsCat] || trsCat.toLowerCase().replace(/[^a-z0-9]+/g, "-")
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
  // 1. Read TRS products
  const raw = readFileSync(TRS_JSON, "utf-8")
  const trsProducts = JSON.parse(raw.replace(/^\uFEFF/, ""))
  console.log(`Loaded ${trsProducts.length} TRS products\n`)

  // 2. Check for existing products in DB
  const headers = await login()
  const allProds = []
  let off = 0
  while (true) {
    const r = await (await fetch(BASE + "/admin/products?limit=100&offset=" + off + "&fields=id,title,handle", { headers })).json()
    if (!r.products || !r.products.length) break
    allProds.push(...r.products)
    off += 100
  }
  const dbTitles = new Set(allProds.map(p => p.title))
  console.log(`${allProds.length} products in DB\n`)

  // 3. Build import list
  const toImport = []
  for (const trs of trsProducts) {
    const title = trs.product_name // Already has "TRS " prefix
    const handle = slugify(title)
    const subCat = getSubcategory(title, trs.category)

    if (dbTitles.has(title)) {
      console.log(`  SKIP (exists): ${title}`)
      continue
    }

    const v = trs.variants || ["Default"]
    const variantTitle = v[0] || "Default"
    const weight = variantTitle.match(/(\d+)/)?.[1] || "0"

    toImport.push({
      title,
      handle,
      subtitle: "",
      description: trs.description || "",
      category: subCat,
      tags: [], // Will be enriched later
      variants: v.map((vt, vi) => ({
        title: vt,
        sku: `${handle}-v${vi}`,
        manage_inventory: false,
        allow_backorder: true,
        prices: [{ currency_code: "gbp", amount: 99 + vi * 50 }], // Placeholder prices
        options: { "Weight/Size": vt },
      })),
      image: `/images/trs_${slugify(title.toLowerCase().replace(/^trs\s*/, ""))}.jpg`,
      metadata: {
        brand_slug: "trs",
        country_of_origin: "India",
        uk_food_business_operator: "TRS Foods Ltd",
        ingredients: title,
        allergens: [],
        dietary_flags: ["vegetarian"],
        vat_rate: 0,
        velocity: "B",
        sourcing_tier: "A",
        regional_tags: [],
        subscription_eligible: true,
        requires_fast_delivery: false,
        requires_cold_chain: false,
        synonyms: [],
      },
    })

    console.log(`  ${subCat.padEnd(35)} ← ${title}`)
  }

  console.log(`\n${toImport.length} products to import\n`)

  if (!APPLY) {
    console.log("Dry run complete. Run with --apply to import.")
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
      options: [{ title: "Weight/Size", values: p.variants.map(v => v.options["Weight/Size"]) }],
      variants: p.variants.map((v, vi) => ({
        title: v.title,
        sku: v.sku,
        manage_inventory: false,
        allow_backorder: true,
        prices: v.prices,
        options: { "Weight/Size": v.options["Weight/Size"] },
      })),
      metadata: p.metadata,
    }

    try {
      const r = await fetch(BASE + "/admin/products", {
        method: "POST", headers, body: JSON.stringify(payload),
      })
      if (r.ok) {
        created++
        if (created % 10 === 0) console.log(`  ${created}/${toImport.length}`)
      } else {
        const err = await r.text()
        console.log(`  FAIL: ${p.title} — ${err.slice(0, 80)}`)
        failed++
      }
    } catch (e) {
      console.log(`  ERROR: ${p.title} — ${e.message}`)
      failed++
    }
  }

  console.log(`\nCreated: ${created}, Failed: ${failed}`)

  // 5. Assign categories
  if (created > 0) {
    console.log("\nAssigning categories...")
    const cats = await (await fetch(BASE + "/admin/product-categories?limit=300&fields=id,handle", { headers })).json()
    const catByHandle = {}
    cats.product_categories.forEach(c => { catByHandle[c.handle] = c.id })

    // Re-fetch products for IDs
    const newProds = []
    off = 0
    while (true) {
      const r = await (await fetch(BASE + "/admin/products?limit=100&offset=" + off + "&fields=id,title", { headers })).json()
      if (!r.products || !r.products.length) break
      newProds.push(...r.products)
      off += 100
    }
    const titleToId = {}
    newProds.forEach(p => { titleToId[p.title] = p.id })

    let assigned = 0
    for (const p of toImport) {
      const catId = catByHandle[p.category]
      const prodId = titleToId[p.title]
      if (!catId || !prodId) continue
      try {
        await fetch(BASE + "/admin/product-categories/" + catId + "/products", {
          method: "POST", headers, body: JSON.stringify({ add: [prodId] }),
        })
        assigned++
      } catch (e) { /* skip */ }
    }
    console.log(`Categories assigned to ${assigned} products`)
  }

  console.log("\nNext steps:")
  console.log("  Reindex: cd apps/meilisearch && npm run reindex")
  console.log("  Verify: node scripts/verify-data-health.mjs")
  console.log("  Tests: cd apps/storefront && npx playwright test")
}

main().catch(console.error)
