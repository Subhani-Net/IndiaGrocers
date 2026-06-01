/**
 * Fix Tinned Products Misassignment
 *
 * Problem:
 * - 20 products in "tinned-products-parent" handle instead of correct leaf categories
 * - tinned-vegetables, tinned-coconut, tinned-fruit are under wrong parent
 *
 * Fix: Reparent subcategories + reassign products by title keyword matching
 *
 * Usage: node scripts/fix-tinned-products.mjs --apply
 */

import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const BASE = "http://127.0.0.1:9000"
const APPLY = process.argv.includes("--apply")

function classifyTinned(title) {
  const t = title.toLowerCase()
  if (/coconut/.test(t)) return "tinned-coconut"
  if (/mango|fruit|pulp|slice/i.test(t)) return "tinned-fruit"
  if (/chick\s*pea|bean|lentil|chana|toovar/i.test(t)) return "tinned-lentils-beans"
  return "tinned-vegetables"
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

  // Fetch all categories
  const catsRes = await (await fetch(BASE + "/admin/product-categories?limit=200&fields=id,handle,parent_category_id", { headers })).json()
  const catByHandle = {}
  catsRes.product_categories.forEach(c => { catByHandle[c.handle] = c })

  const targetParent = catByHandle["tinned-products"]
  const oldParent = catByHandle["tinned-products-parent"]
  if (!targetParent || !oldParent) { console.log("ERROR: tinned categories not found"); return }

  console.log("tinned-products (under Essentials):", targetParent.id)
  console.log("tinned-products-parent (ROOT):", oldParent.id)

  // Step 1: Reparent subcategories
  console.log("\nStep 1: Reparenting subcategories...")
  const subCats = ["tinned-vegetables", "tinned-coconut", "tinned-fruit"]
  for (const handle of subCats) {
    const cat = catByHandle[handle]
    if (!cat) { console.log("  MISSING:", handle); continue }
    if (cat.parent_category_id === targetParent.id) {
      console.log("  SKIP:", handle, "(already correct parent)")
      continue
    }
    if (!APPLY) {
      console.log("  WOULD MOVE:", handle, "→ tinned-products")
      continue
    }
    const res = await fetch(BASE + "/admin/product-categories/" + cat.id, {
      method: "POST", headers,
      body: JSON.stringify({ parent_category_id: targetParent.id }),
    })
    console.log("  MOVED:", handle, res.ok ? "OK" : "FAILED")
  }

  // Step 2: Fetch ALL products and find tinned
  console.log("\nStep 2: Fetching products...")
  const allProds = []
  let off = 0
  while (true) {
    const r = await (await fetch(BASE + "/admin/products?limit=100&offset=" + off + "&fields=id,title,*categories", { headers })).json()
    if (!r.products || !r.products.length) break
    allProds.push(...r.products)
    off += 100
  }
  console.log("  Total products:", allProds.length)

  // Find products in tinned-products-parent
  const tinnedProds = allProds.filter(p => 
    p.categories?.some(c => c.handle === "tinned-products-parent")
  )
  console.log("  Products in tinned-products-parent:", tinnedProds.length)

  // Step 3: Classify and plan moves
  console.log("\nStep 3: Planning moves...")
  const moves = []
  for (const p of tinnedProds) {
    const targetHandle = classifyTinned(p.title)
    const targetCat = catByHandle[targetHandle]
    if (!targetCat) { console.log("  MISSING target category:", targetHandle); continue }

    moves.push({
      id: p.id,
      title: p.title,
      from: "tinned-products-parent",
      to: targetHandle,
      targetCatId: targetCat.id,
    })
    console.log("  " + p.title + " → " + targetHandle)
  }

  if (!APPLY) {
    console.log("\n" + moves.length + " products to move. Run with --apply to execute.")
    return
  }

  // Step 4: Execute moves
  console.log("\nStep 4: Executing moves...")
  let done = 0
  for (const m of moves) {
    // Add to target
    const addRes = await fetch(BASE + "/admin/product-categories/" + m.targetCatId + "/products", {
      method: "POST", headers,
      body: JSON.stringify({ add: [m.id] }),
    })
    // Remove from source
    const srcCat = catByHandle["tinned-products-parent"]
    const rmRes = await fetch(BASE + "/admin/product-categories/" + srcCat.id + "/products", {
      method: "POST", headers,
      body: JSON.stringify({ remove: [m.id] }),
    })

    if (addRes.ok && rmRes.ok) {
      console.log("  OK:", m.title, "→", m.to)
      done++
    } else {
      console.log("  FAIL:", m.title, "(add:", addRes.status, "rm:", rmRes.status, ")")
    }
  }

  console.log("\nDone:", done, "of", moves.length, "products moved")

  // Step 5: Clean up any products still in tinned-products (parent) handle
  console.log("\nStep 5: Cleaning tinned-products parent...")
  const tpCat = catByHandle["tinned-products"]
  // Re-fetch products to get updated categories
  const freshProds = []
  off = 0
  while (true) {
    const r = await (await fetch(BASE + "/admin/products?limit=100&offset=" + off + "&fields=id,title,*categories", { headers })).json()
    if (!r.products || !r.products.length) break
    freshProds.push(...r.products)
    off += 100
  }
  const tpProds = freshProds.filter(p =>
    p.categories?.some(c => c.handle === "tinned-products")
  )
  console.log("  Products in tinned-products:", tpProds.length)
  let cleaned = 0
  for (const p of tpProds) {
    const res = await fetch(BASE + "/admin/product-categories/" + tpCat.id + "/products", {
      method: "POST", headers,
      body: JSON.stringify({ remove: [p.id] }),
    })
    if (res.ok) {
      console.log("  REMOVED from tinned-products:", p.title)
      cleaned++
    }
  }
  console.log("  Cleaned:", cleaned)

  console.log("\nReindex: cd apps/meilisearch && npm run reindex")
}

main().catch(console.error)
