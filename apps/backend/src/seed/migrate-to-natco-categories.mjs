/**
 * Migrate categories to match Natco Foods taxonomy (shop.natcofoods.com).
 * Deletes existing product→category links, creates new categories,
 * and reassigns products using CSV Product Type column.
 *
 * Usage: node src/seed/migrate-to-natco-categories.mjs
 */

import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "http://127.0.0.1:9000"
const CSV_PATH = resolve(__dirname, "../../../../Implementation/Natcofoods/natcofoods-import-backup/natcofoods-catalog.csv")

// ─── NATCO FOODS TAXONOMY (from shop.natcofoods.com) ───

const TAXONOMY = {
  "Spices": {
    handle: "spices",
    children: {
      "All Spices & Herbs": "spices-herbs",
      "Spice & Herb Jars": "spice-herb-jars",
      "Spice Blends & Mixes": "spice-blends-mixes",
      "Food Colourings & Essences": "food-colourings-essences",
      "Sugar": "sugar",
    }
  },
  "Essentials": {
    handle: "essentials",
    children: {
      "All Essentials": "all-essentials",
      "Tinned Products": "tinned-products",
      "Ghee & Oils": "ghee-oils",
      "Teas & Drinks": "teas-drinks",
      "Vegetables": "vegetables",
      "Flour": "flour-essentials",
    }
  },
  "Lentils": {
    handle: "lentils",
    children: {
      "All Lentils & Beans": "all-lentils-beans",
      "Dried Lentils, Beans & Peas": "dried-lentils-beans-peas",
      "Soya Products": "soya-products",
      "Tinned Lentils & Beans": "tinned-lentils-beans",
    }
  },
  "Nuts & Seeds": {
    handle: "nuts-seeds",
    children: {
      "All Nuts & Seeds": "all-nuts-seeds",
      "Raw Nuts": "raw-nuts",
      "Flavoured Nuts": "flavoured-nuts",
      "Seeds": "seeds",
      "Coconut Products": "coconut-products",
      "Dried Fruit": "dried-fruit",
      "Nut & Seed Oils": "nut-seed-oils",
    }
  },
  "Snacks": {
    handle: "snacks",
    children: {
      "All Snacks": "all-snacks",
      "Pappadoms": "pappadoms",
      "Chutneys, Pickles & Sauces": "chutneys-pickles-sauces",
      "Namkeen & Lentil Snacks": "namkeen-lentil-snacks",
      "Flavoured Nuts (Snacks)": "flavoured-nuts-snacks",
      "Raisins": "raisins-snacks",
    }
  },
  "Grains": {
    handle: "grains",
    children: {
      "All Grains": "all-grains",
      "Rice & Quinoa": "rice-quinoa",
      "Flour & Milk Powder": "flour-milk-powder",
      "Wheat Grains & Couscous": "wheat-grains-couscous",
      "Corn": "corn",
      "Soya": "soya-grains",
    }
  },
  // Promoted subcategories — shown as top-level in Natco nav
  "Flours": {
    handle: "flours",
    children: {}  // No children — standalone
  },
  "Tinned Products": {
    handle: "tinned-products-parent",
    children: {}  // No children — standalone
  },
}

// ─── CSV PRODUCT TYPE → NATCO SUBCATEGORY HANDLE ───

const TYPE_TO_CHILD = {
  // Spices
  "Spices": "spices-herbs",
  "Spice Jars": "spice-herb-jars",
  "Spice &amp; Herb Jars": "spice-herb-jars",
  "Spice &amp; Herb Jars": "spice-herb-jars",
  "Spice & Herb Jars": "spice-herb-jars",
  "Spice Blends and Mixes": "spice-blends-mixes",
  "Spice Blends & Mixes": "spice-blends-mixes",
  "Herbs": "spices-herbs",
  "Flavouring": "food-colourings-essences",
  "Food Colouring": "food-colourings-essences",
  "Sugar &amp; Jaggery": "sugar",
  "Sugar & Jaggery": "sugar",

  // Essentials
  "Tinned Vegetables": "tinned-products",
  "Tinned Lentils, Beans": "tinned-products",
  "Tinned Lentils": "tinned-products",
  "\"Tinned Lentils": "tinned-products",
  "Tinned Coconut": "tinned-products",
  "Tinned Fruit": "tinned-products",
  "Ghee &amp; Oils": "ghee-oils",
  "Ghee & Oils": "ghee-oils",
  "Ghee": "ghee-oils",
  "Oil": "ghee-oils",
  "Teas & Drinks": "teas-drinks",
  "Tea": "teas-drinks",
  "Coffee": "teas-drinks",
  "Drink": "teas-drinks",
  "Drinks": "teas-drinks",
  "vegetable": "vegetables",
  "Vegetables": "vegetables",

  // Lentils
  "Lentils": "dried-lentils-beans-peas",
  "Beans": "dried-lentils-beans-peas",
  "Soya": "soya-products",

  // Nuts & Seeds
  "Nuts": "raw-nuts",
  "Raw Nuts": "raw-nuts",
  "Flavoured Nuts": "flavoured-nuts",
  "Seeds": "seeds",
  "seeds": "seeds",
  "sesame": "seeds",
  "peanuts": "raw-nuts",
  "Coconut Products": "coconut-products",
  "Dried Fruit": "dried-fruit",
  "Nut and Seed Oils": "nut-seed-oils",

  // Snacks
  "Snacks": "all-snacks",
  "Namkeen & Lentil Snacks": "namkeen-lentil-snacks",
  "Daria Lentil Snack": "namkeen-lentil-snacks",
  "Lentil Snack": "namkeen-lentil-snacks",
  "Pappadoms": "pappadoms",
  "Pappadom": "pappadoms",
  "Chutneys, Pickles & Sauces": "chutneys-pickles-sauces",
  "Pickles": "chutneys-pickles-sauces",
  "Chutney": "chutneys-pickles-sauces",
  "Sauces": "chutneys-pickles-sauces",
  "Sauce": "chutneys-pickles-sauces",
  "Paste": "chutneys-pickles-sauces",

  // Grains
  "Rice": "rice-quinoa",
  "Corn": "corn",
  "Couscous": "wheat-grains-couscous",
  "Bread &amp; Flour": "flours",
  "Bread & Flour": "flours",
  "Pasta": "wheat-grains-couscous",
  "Grains": "wheat-grains-couscous",
  "Milk Powder": "flour-milk-powder",
  // Promoted top-level
  "Flour": "flours",
  "Tinned Vegetables": "tinned-products-parent",
  "\"Tinned Lentils": "tinned-products-parent",
  "Tinned Lentils": "tinned-products-parent",
  "Tinned Lentils, Beans": "tinned-products-parent",
  "Tinned Coconut": "tinned-products-parent",
  "Tinned Fruit": "tinned-products-parent",
}

// ─── HELPERS ───

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/[\s]+/g, "-").replace(/-+/g, "-")
}

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: `Bearer ${(await res.json()).token}`, "Content-Type": "application/json" }
}

// ─── MAIN ───

async function main() {
  const headers = await login()
  console.log("Logged in\n")

  // ─── 1. Create/fetch parent categories ───
  console.log("Creating Natco Food parent categories...")
  const parentIds = {}
  for (const [name, config] of Object.entries(TAXONOMY)) {
    const res = await fetch(`${BASE}/admin/product-categories`, {
      method: "POST", headers,
      body: JSON.stringify({
        name, handle: config.handle, is_active: true,
        metadata: { nav_visible: true, phase: 1, source: "natco-taxonomy" },
      }),
    })
    if (res.ok) {
      const data = await res.json()
      parentIds[config.handle] = data.product_category.id
      console.log(`  ✓ ${name} (${config.handle})`)
    } else {
      // Might already exist — fetch by handle
      const fetchRes = await fetch(`${BASE}/admin/product-categories?handle=${config.handle}`, { headers })
      const fetchData = await fetchRes.json()
      if (fetchData.product_categories?.length) {
        parentIds[config.handle] = fetchData.product_categories[0].id
        console.log(`  • ${name} (${config.handle}) — exists`)
      } else {
        console.log(`  ✗ ${name}: ${await res.text().then(t => t.slice(0, 80))}`)
      }
    }
  }

  // ─── 2. Create/fetch child subcategories ───
  console.log("\nCreating child subcategories...")
  const childIdByHandle = {}
  for (const [parentName, config] of Object.entries(TAXONOMY)) {
    const parentId = parentIds[config.handle]
    if (!parentId) { console.log(`  Skipping children of ${parentName} — no parent`); continue }
    for (const [childName, childHandle] of Object.entries(config.children)) {
      const res = await fetch(`${BASE}/admin/product-categories`, {
        method: "POST", headers,
        body: JSON.stringify({
          name: childName, handle: childHandle, is_active: true,
          parent_category_id: parentId,
          metadata: { phase: 1, source: "natco-taxonomy" },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        childIdByHandle[childHandle] = data.product_category.id
        console.log(`  ✓ ${parentName} > ${childName} (${childHandle})`)
      } else {
        const fetchRes = await fetch(`${BASE}/admin/product-categories?handle=${childHandle}`, { headers })
        const fetchData = await fetchRes.json()
        if (fetchData.product_categories?.length) {
          childIdByHandle[childHandle] = fetchData.product_categories[0].id
          console.log(`  • ${childName} — exists`)
        } else {
          console.log(`  ✗ ${childName}: ${await res.text().then(t => t.slice(0, 80))}`)
        }
      }
    }
  }

  // ─── 3. Build product→subcategory map from CSV ───
  console.log("\nReading CSV for product→type mapping...")
  const csv = readFileSync(CSV_PATH, "utf-8")
  const lines = csv.trim().split("\n").slice(1)
  const handleToType = {}
  for (const line of lines) {
    const vals = line.split(",")
    const handle = vals[0]?.trim()
    const type = (vals[8] || "").trim()
      .replace(/^"/, "").replace(/"$/, "")
      .replace(/&amp;/g, "&")
      .replace(/&amp;/g, "&")
    const title = vals[1]?.trim().replace(/^"/, "").replace(/"$/, "")
    if (handle && type) handleToType[handle] = { type, title }
  }
  console.log(`  ${Object.keys(handleToType).length} products mapped`)

  // ─── 4. Fetch all products ───
  console.log("\nFetching products...")
  const allProducts = []
  let offset = 0
  while (true) {
    const { products } = await fetch(
      `${BASE}/admin/products?limit=100&offset=${offset}&fields=id,title,handle`,
      { headers }
    ).then(r => r.json())
    if (!products?.length) break
    allProducts.push(...products)
    offset += 100
  }
  console.log(`  ${allProducts.length} products`)

  // ─── 5. Build assignments ───
  console.log("\nBuilding assignments...")
  const allIdsByHandle = { ...childIdByHandle, ...parentIds }
  const byChild = {}
  const unmatched = []

  for (const product of allProducts) {
    const info = handleToType[product.handle]
    let childHandle = info ? TYPE_TO_CHILD[info.type] : null

    // Title-based overrides for spice blends (Product Type is just "Spices")
    if (!childHandle || childHandle === "spices-herbs") {
      const t = product.title.toLowerCase()
      if (t.includes("garam masala") || t.includes("chaat masala") || t.includes("chana masala") ||
          t.includes("rajma masala") || t.includes("biryani masala") || t.includes("sambar") ||
          t.includes("rasam") || t.includes("pav bhaji") || t.includes("kitchen king") ||
          t.includes("tandoori masala") || t.includes("meat masala") || t.includes("fish masala") ||
          t.includes("chicken masala") || t.includes("paneer masala") || t.includes("pulao masala") ||
          t.includes("all purpose seasoning") || t.includes("anardana powder") || t.includes("pickle masala") ||
          t.includes("mixed masala")) {
        childHandle = "spice-blends-mixes"
      }
    }

    // Beverages title override
    if (!childHandle && (product.title.toLowerCase().includes("tea") || product.title.toLowerCase().includes("coffee") ||
        product.title.toLowerCase().includes("horlicks") || product.title.toLowerCase().includes("bournvita") ||
        product.title.toLowerCase().includes("rooh afza") || product.title.toLowerCase().includes("rose syrup"))) {
      childHandle = "teas-drinks"
    }

    // Flour/milk powder override
    if (!childHandle) {
      const t = product.title.toLowerCase()
      if (t.includes("milk powder") || t.includes("ground rice") || t.includes("rice flour")) 
        childHandle = "flour-milk-powder"
    }

    if (childHandle && allIdsByHandle[childHandle]) {
      if (!byChild[childHandle]) byChild[childHandle] = []
      byChild[childHandle].push(product.id)
    } else {
      unmatched.push(`${product.title} → type: ${info?.type || '?'} → ${childHandle || 'no match'}`)
    }
  }

  const totalAssign = Object.values(byChild).reduce((sum, arr) => sum + arr.length, 0)
  console.log(`  ${totalAssign} assigned, ${unmatched.length} unmatched`)

  // ─── 6. Apply assignments ───
  console.log("\nApplying assignments...")
  // Build handle→name lookup (children + parents)
  const handleToName = {}
  for (const [parentName, config] of Object.entries(TAXONOMY)) {
    handleToName[config.handle] = parentName
    for (const [childName, childHandle] of Object.entries(config.children)) {
      handleToName[childHandle] = `${parentName} > ${childName}`
    }
  }

  let assigned = 0
  for (const [childHandle, prodIds] of Object.entries(byChild)) {
    const name = handleToName[childHandle] || childHandle
    try {
      const res = await fetch(`${BASE}/admin/product-categories/${allIdsByHandle[childHandle]}/products`, {
        method: "POST", headers, body: JSON.stringify({ add: prodIds }),
      })
      if (res.ok) {
        assigned += prodIds.length
        console.log(`  ${name}: ${prodIds.length}`)
      } else {
        const e = await res.text()
        console.log(`  ${name}: FAIL — ${e.slice(0, 80)}`)
      }
    } catch (e) {
      console.log(`  ${name}: ERROR — ${e.cause?.message || e.message}`)
    }
  }

  console.log(`\nDone: ${assigned} assigned to Natco taxonomy categories`)

  if (unmatched.length > 0 && unmatched.length < 30) {
    console.log(`\nUnmatched (${unmatched.length}):`)
    unmatched.forEach(u => console.log(`  ${u}`))
  }

  console.log("\nNext steps:")
  console.log("  1. Update storefront page.tsx category handle sets")
  console.log("  2. Reindex MeiliSearch: cd apps/meilisearch && npm run reindex")
}

main().catch(console.error)
