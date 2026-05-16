import { readFile } from "fs/promises"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "http://127.0.0.1:9000"

const SEED_PARENT_HANDLES = [
  "rice-and-grains", "dals-and-lentils", "spices-and-masalas",
  "cooking-oils-and-ghee", "flours-and-grains", "snacks-and-namkeen",
  "beverages", "pickles-and-chutneys", "papads-and-fryums",
  "frozen-foods", "sweets-and-mithai", "noodles-and-pasta",
  "sauces-and-ketchup", "dairy-and-milk-products", "ready-to-eat",
  "fresh-vegetables",
]

const CATEGORY_MIGRATION_MAP = {
  "grains": "rice-and-grains",
  "rice": "rice-and-grains",
  "wheat-grains-couscous": "flours-and-grains",
  "lentils": "dals-and-lentils",
  "lentils-beans": "dals-and-lentils",
  "tinned-lentils-beans": "dals-and-lentils",
  "soya": "dals-and-lentils",
  "spices": "spices-and-masalas",
  "spices-herbs": "spices-and-masalas",
  "spice-jars": "spices-and-masalas",
  "food-colourings-essences": "spices-and-masalas",
  "nuts": "snacks-and-namkeen",
  "nuts-seeds": "snacks-and-namkeen",
  "seeds": "snacks-and-namkeen",
  "dried-fruit": "snacks-and-namkeen",
  "snacks": "snacks-and-namkeen",
  "pappadoms": "papads-and-fryums",
  "flour": "flours-and-grains",
  "corn": "flours-and-grains",
  "teas-drinks": "beverages",
  "vegetables": "fresh-vegetables",
  "coconut-products": "cooking-oils-and-ghee",
  "sugar": "sweets-and-mithai",
  "essentials": "cooking-oils-and-ghee",
  "all-products": null,
}

function isNatcoProduct(handle) {
  return /^\d/.test(handle) || handle.toLowerCase().includes("natco")
}

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  const { token } = await res.json()
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
}

async function main() {
  const headers = await login()
  console.log("Logged in")

  // 1. Fetch all products and categories
  console.log("1. Fetching products and categories...")
  const [prodRes, catRes] = await Promise.all([
    fetch(`${BASE}/admin/products?limit=500`, { headers }),
    fetch(`${BASE}/admin/product-categories?limit=100`, { headers }),
  ])
  const { products } = await prodRes.json()
  const { product_categories } = await catRes.json()
  console.log(`   Products: ${products.length}, Categories: ${product_categories.length}`)

  // Build lookup maps
  const catByHandle = {}
  const catById = {}
  for (const c of product_categories) {
    catByHandle[c.handle] = c
    catById[c.id] = c
  }

  // 2. Delete non-Natco products
  console.log("\n2. Deleting non-Natco products...")
  let deleted = 0, kept = 0
  for (const p of products) {
    if (!isNatcoProduct(p.handle)) {
      const del = await fetch(`${BASE}/admin/products/${p.id}`, { method: "DELETE", headers })
      if (del.ok) {
        deleted++
        if (deleted % 20 === 0) process.stdout.write(` ${deleted}`)
      } else {
        const e = await del.text()
        console.log(`\n   ❌ ${p.title}: ${e.slice(0, 80)}`)
      }
    } else {
      kept++
    }
  }
  console.log(`\n   Deleted ${deleted}, kept ${kept}`)

  // 3. Re-fetch products (to get updated category assignments)
  console.log("\n3. Reassigning Natco products to seed categories...")
  const { products: freshProducts } = await (await fetch(`${BASE}/admin/products?limit=5&fields=id,title,handle,categories`, { headers })).json()

  // Debug: show first 5 products
  for (const p of freshProducts) {
    const catNames = p.categories?.map(c => c.name).join(", ") || "NONE"
    console.log(`   DEBUG: ${p.title} — cats: ${catNames} (${p.categories?.length || 0})`)
  }

  // Now fetch all products for actual reassignment
  const { products: allFresh } = await (await fetch(`${BASE}/admin/products?limit=500&fields=id,title,handle,categories`, { headers })).json()

  let reassigned = 0
  for (const p of allFresh) {
    if (!p.categories?.length) continue
    if (!isNatcoProduct(p.handle)) continue

    const currentCatIds = p.categories.map(c => c.id)
    const newCatIds = new Set()
    let needsUpdate = false

    for (const catId of currentCatIds) {
      const cat = catById[catId]
      if (!cat) continue
      if (cat.parent_category_id) { newCatIds.add(catId); continue } // keep child categories

      const targetHandle = CATEGORY_MIGRATION_MAP[cat.handle]
      if (targetHandle) {
        const targetCat = catByHandle[targetHandle]
        if (targetCat) { newCatIds.add(targetCat.id); needsUpdate = true }
      } else if (targetHandle === null) {
        needsUpdate = true // skip "all-products"
      } else {
        newCatIds.add(catId) // keep unmapped categories
      }
    }

    if (!needsUpdate || newCatIds.size === 0) continue

    const updateRes = await fetch(`${BASE}/admin/products/${p.id}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ category_ids: [...newCatIds] }),
    })
    if (updateRes.ok) {
      reassigned++
      if (reassigned % 50 === 0) console.log(`   ${reassigned}...`)
    } else if (reassigned < 3) {
      const e = await updateRes.text()
      console.log(`   ❌ ${p.handle}: ${e.slice(0, 100)}`)
    }
  }
  console.log(`   Reassigned: ${reassigned}`)

  // 4. Delete empty flat categories (not seed parents, not children, no products)
  console.log("\n4. Deleting empty flat categories...")
  const { product_categories: finalCats } = await (await fetch(`${BASE}/admin/product-categories?limit=100&fields=id,name,handle,parent_category_id,products`, { headers })).json()

  let catsDeleted = 0, catsKept = 0
  for (const c of finalCats) {
    if (c.parent_category_id) { catsKept++; continue } // keep children
    if (SEED_PARENT_HANDLES.includes(c.handle)) { catsKept++; continue } // keep seed parents

    const hasProducts = c.products?.length > 0
    if (!hasProducts) {
      const del = await fetch(`${BASE}/admin/product-categories/${c.id}`, { method: "DELETE", headers })
      if (del.ok) catsDeleted++
    } else {
      catsKept++
    }
  }
  console.log(`   Deleted ${catsDeleted} empty categories, kept ${catsKept}`)

  // Summary
  console.log("\n========================================")
  console.log("  Cleanup Complete")
  console.log("========================================")
  console.log(`  Deleted: ${deleted} non-Natco products, ${catsDeleted} empty categories`)
  console.log(`  Reassigned: ${reassigned} products to seed categories`)
  console.log(`  Kept: ${kept} Natco products, ${catsKept} categories`)
}

main().catch(console.error)
