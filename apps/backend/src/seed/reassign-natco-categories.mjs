import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "http://127.0.0.1:9000"
const CSV_PATH = "C:\\IndiaGrocers\\Implementation\\natcofoods-import-backup\\natcofoods-catalog.csv"

const TYPE_TO_SEED = {
  "Rice": "rice-and-grains", "Flour": "flours-and-grains", "Corn": "flours-and-grains",
  "Couscous": "flours-and-grains", "Bread & Flour": "flours-and-grains", "Pasta": "noodles-and-pasta",
  "Soya": "dals-and-lentils", "Lentils": "dals-and-lentils", "Beans": "dals-and-lentils",
  "Tinned Lentils, Beans": "dals-and-lentils",
  "Ghee & Oils": "cooking-oils-and-ghee", "Ghee": "cooking-oils-and-ghee", "Oil": "cooking-oils-and-ghee",
  "Nuts": "snacks-and-namkeen", "Raw Nuts": "snacks-and-namkeen", "Flavoured Nuts": "snacks-and-namkeen",
  "Seeds": "snacks-and-namkeen", "seeds": "snacks-and-namkeen",
  "Dried Fruit": "snacks-and-namkeen", "Tinned Fruit": "sweets-and-mithai",
  "Snacks": "snacks-and-namkeen", "Namkeen & Lentil Snacks": "snacks-and-namkeen",
  "Daria Lentil Snack": "snacks-and-namkeen", "Lentil Snack": "snacks-and-namkeen",
  "Pappadoms": "papads-and-fryums", "Pappadom": "papads-and-fryums",
  "Chutneys, Pickles & Sauces": "pickles-and-chutneys",
  "Pickles": "pickles-and-chutneys", "Chutney": "pickles-and-chutneys",
  "Sauces": "sauces-and-ketchup", "Sauce": "sauces-and-ketchup", "Paste": "pickles-and-chutneys",
  "Spices": "spices-and-masalas", "Spice Jars": "spices-and-masalas",
  "Spice & Herb Jars": "spices-and-masalas", "Spice Blends and Mixes": "spices-and-masalas",
  "Seasoning": "spices-and-masalas", "Herbs": "spices-and-masalas", "Flavouring": "spices-and-masalas",
  "Food Colouring": "spices-and-masalas", "Food Colourings & Essences": "spices-and-masalas",
  "Sugar": "sweets-and-mithai", "Sugar & Jaggery": "sweets-and-mithai",
  "Teas & Drinks": "beverages", "Tea": "beverages", "Drinks": "beverages", "Drink": "beverages",
  "Coconut Products": "cooking-oils-and-ghee", "Coconut": "cooking-oils-and-ghee",
  "Tinned Coconut": "cooking-oils-and-ghee",
  "Vegetables": "fresh-vegetables", "vegetable": "fresh-vegetables", "Tinned Vegetables": "fresh-vegetables",
  "Dairy": "dairy-and-milk-products", "Milk Powder": "dairy-and-milk-products",
}

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: `Bearer ${(await res.json()).token}`, "Content-Type": "application/json" }
}

async function main() {
  const headers = await login()
  console.log("Logged in")

  // 1. Read CSV → title → type map
  const csv = readFileSync(CSV_PATH, "utf-8")
  const lines = csv.trim().split("\n").map(l => {
    const vals = [], chars = [...l]
    let cur = "", inQ = false
    for (const ch of chars) {
      if (ch === '"') { inQ = !inQ; continue }
      if (ch === "," && !inQ) { vals.push(cur.trim()); cur = ""; continue }
      cur += ch
    }
    vals.push(cur.trim())
    return vals
  })
  const rows = lines.slice(1).filter(r => r[0])
  const titleToType = {}
  for (const row of rows) {
    const t = row[1], ty = (row[8] || "").replace(/&amp;/g, "&")
    if (t && ty && !titleToType[t]) titleToType[t] = ty
    // Also map base name (strip weight) for merged products
    const base = t.replace(/\s+\d+\.?\d*\s*(g|kg|ml|l|litre|litres|ltr)s?$/i, "").trim()
    if (base && base !== t && !titleToType[base]) titleToType[base] = ty
  }
  console.log(`CSV: ${rows.length} rows, ${new Set(Object.values(titleToType)).size} types`)

  // 2. Fetch categories
  const { product_categories } = await (await fetch(`${BASE}/admin/product-categories?limit=100`, { headers })).json()
  const catByHandle = {}
  for (const c of product_categories) catByHandle[c.handle] = c

  // 3. Fetch products
  const { products } = await (await fetch(`${BASE}/admin/products?limit=500`, { headers })).json()

  // 4. Group products by seed category
  const byCategory = {}
  let skipped = 0, noType = 0
  const missingTypes = new Set()
  for (const p of products) {
    const type = titleToType[p.title]
    if (!type) { noType++; continue }
    const seedHandle = TYPE_TO_SEED[type]
    if (!seedHandle) { missingTypes.add(type); skipped++; continue }
    const seedCat = catByHandle[seedHandle]
    if (!seedCat) { skipped++; continue }
    if (!byCategory[seedCat.id]) byCategory[seedCat.id] = []
    byCategory[seedCat.id].push(p.id)
  }
  if (missingTypes.size) console.log(`Unmapped types: ${[...missingTypes].join(", ")}`)

  // 5. Batch assign via category-products endpoint
  console.log(`\nAssigning to ${Object.keys(byCategory).length} categories...`)
  let assigned = 0
  for (const [catId, prodIds] of Object.entries(byCategory)) {
    const cat = product_categories.find(c => c.id === catId)
    const name = cat?.name || catId
    const res = await fetch(`${BASE}/admin/product-categories/${catId}/products`, {
      method: "POST",
      headers,
      body: JSON.stringify({ add: prodIds }),
    })
    if (res.ok) {
      assigned += prodIds.length
      console.log(`  ✅ ${name}: ${prodIds.length}`)
    } else {
      const e = await res.text()
      console.log(`  ❌ ${name}: ${e.slice(0, 100)}`)
    }
  }

  console.log(`\nDone: ${assigned} assigned to categories, ${skipped} skipped, ${noType} no-type, 290 total`)
}

main().catch(console.error)
