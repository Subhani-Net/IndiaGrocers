/**
 * MVC Category Creator
 *
 * Creates the 26 new category handles needed for the Minimum Viable Catalogue.
 * Idempotent — skips categories that already exist.
 *
 * Usage: node scripts/mvc/create-categories.mjs
 *        node scripts/mvc/create-categories.mjs --apply
 *
 * Created in dry-run by default. Use --apply to create.
 */

import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..", "..")
const BASE = "http://127.0.0.1:9000"
const APPLY = process.argv.includes("--apply")

// ─── CATEGORY TREE DEFINITION ───
// parent: [child_handle, child_name, ...]

const NEW_PARENTS = {
  "masalas-dessert-mixes": {
    name: "Masalas & Dessert Mixes",
    description: "Brand-specific recipe masalas and dessert mixes",
    children: [
      ["shan-masalas", "Shan Masalas", "Complete Shan recipe masala range for Pakistani cuisine"],
      ["mdh-masalas", "MDH Masalas", "MDH spice blends for everyday Indian cooking"],
      ["everest-masalas", "Everest Masalas", "Everest masala range for regional Indian dishes"],
      ["dessert-mixes", "Dessert Mixes", "Instant dessert mixes for gulab jamun, kheer, and more"],
    ],
  },
  "ready-to-eat-instant": {
    name: "Ready-to-Eat & Instant",
    description: "Ready meals, instant mixes, and frozen foods",
    children: [
      ["frozen-breads", "Frozen Breads", "Frozen rotis, parathas, and naans"],
      ["ready-meals", "Ready Meals", "Ambient ready-to-eat curries and meals"],
      ["breakfast-mixes", "Breakfast Mixes", "Idli, dosa, upma, and other breakfast mixes"],
      ["instant-noodles", "Instant Noodles", "Maggi and other instant noodle varieties"],
      ["paneer-cheese", "Paneer & Cheese", "Fresh and frozen paneer"],
    ],
  },
  "confectionery-sweets": {
    name: "Confectionery & Sweets",
    description: "Indian sweets, chocolates, and mouth fresheners",
    children: [
      ["tinned-sweets", "Tinned Sweets", "Gulab jamun, rasgulla, and other tinned sweets"],
      ["indian-chocolate", "Indian Chocolate", "Indian-imported chocolates and candy bars"],
      ["mouth-fresheners", "Mouth Fresheners", "Mukhwas, digestive candies, and after-meal fresheners"],
      ["indian-candies", "Indian Candies", "Parle and other Indian candy varieties"],
    ],
  },
  "beverages-drinks": {
    name: "Beverages & Drinks",
    description: "Teas, coffees, soft drinks, and health drinks",
    children: [
      ["loose-leaf-tea", "Loose Leaf Tea", "Brooke Bond, Tata, Wagh Bakri, and other tea brands"],
      ["filter-coffee", "Filter Coffee", "South Indian filter coffee — Udhayam, Leo, Continental"],
      ["instant-coffee", "Instant Coffee", "Bru, Nescafe, and instant coffee varieties"],
      ["drinks-syrups", "Drinks & Syrups", "Rooh Afza, Maaza, Frooti, Bovonto, and concentrates"],
      ["health-drinks", "Health Drinks", "Bournvita, Horlicks, Chyawanprash, and malt drinks"],
    ],
  },
}

// Subcategories to add under EXISTING parent "snacks"
const NEW_SNACKS_CHILDREN = [
  ["haldiram-namkeens", "Haldiram Namkeens", "Haldiram's savoury snacks — bhujia, dal, and mixes"],
  ["bikaji-namkeens", "Bikaji Namkeens", "Bikaji savoury snacks and namkeen varieties"],
  ["indian-biscuits", "Indian Biscuits", "Parle-G, Britannia, Karachi Bakery, and other biscuits"],
]

const NEW_SNACKS_CHILDREN_HANDLES = NEW_SNACKS_CHILDREN.map(c => c[0])

// ─── HELPERS ───

async function login() {
  const res = await fetch(BASE + "/auth/user/emailpass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: "Bearer " + (await res.json()).token, "Content-Type": "application/json" }
}

function log(icon, msg) {
  console.log("  " + icon + " " + msg)
}

async function categoryExists(headers, handle) {
  const res = await fetch(BASE + "/admin/product-categories?handle=" + handle + "&limit=1&fields=id,handle", { headers })
  const data = await res.json()
  return data.product_categories?.length > 0
}

async function createCategory(headers, handle, name, description, parentId = null) {
  if (await categoryExists(headers, handle)) {
    log("•", handle + " — already exists, skipping")
    return null
  }

  if (!APPLY) {
    log("→", "WOULD CREATE " + handle + " (" + name + ")" + (parentId ? " under parent" : ""))
    return null
  }

  const body = { name, handle, description, is_active: true, is_internal: false }
  if (parentId) body.parent_category_id = parentId

  const res = await fetch(BASE + "/admin/product-categories", {
    method: "POST", headers,
    body: JSON.stringify(body),
  })

  if (res.ok) {
    const data = await res.json()
    log("✓", "CREATED " + handle)
    return data.product_category
  } else {
    const err = await res.text()
    log("✗", "FAILED " + handle + " — " + err.slice(0, 100))
    return null
  }
}

// ─── MAIN ───

async function main() {
  console.log("=".repeat(60))
  console.log("  MVC Category Creator — " + (APPLY ? "APPLY" : "DRY RUN"))
  console.log("=".repeat(60))

  const headers = await login()
  let created = 0, skipped = 0

  // Fetch existing categories to find parent IDs
  const catsRes = await (await fetch(BASE + "/admin/product-categories?limit=200&fields=id,handle", { headers })).json()
  const catByHandle = {}
  catsRes.product_categories.forEach(c => { catByHandle[c.handle] = c })

  // Step 1: Create new parent categories
  for (const [handle, def] of Object.entries(NEW_PARENTS)) {
    log("", "")
    log("━", def.name + " (" + handle + ")")

    const parent = await createCategory(headers, handle, def.name, def.description)
    if (parent) created++

    // Create children under this parent
    for (const [childHandle, childName, childDesc] of def.children) {
      const parentId = parent?.id || catByHandle[handle]?.id
      const child = await createCategory(headers, childHandle, childName, childDesc, parentId)
      if (child) created++
      else if (await categoryExists(headers, childHandle)) skipped++
    }
  }

  // Step 2: Create snack subcategories under existing "snacks" parent
  const snacksParent = catByHandle["snacks"]
  if (snacksParent) {
    log("", "")
    log("━", "New subcategories under SNACKS (" + snacksParent.id + ")")

    for (const [handle, name, desc] of NEW_SNACKS_CHILDREN) {
      const child = await createCategory(headers, handle, name, desc, snacksParent.id)
      if (child) created++
      else if (await categoryExists(headers, handle)) skipped++
    }
  } else {
    log("✗", "ERROR: 'snacks' parent not found — cannot create subcategories")
  }

  // ─── Summary ───
  console.log("\n" + "=".repeat(60))
  console.log("  Created: " + created + "  |  Skipped (exists): " + skipped)
  if (!APPLY) console.log("  DRY RUN — run with --apply to create")
  console.log("=".repeat(60))
}

main().catch(console.error)
