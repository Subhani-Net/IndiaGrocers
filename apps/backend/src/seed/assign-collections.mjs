import { readFileSync } from "fs"

const BASE = "http://127.0.0.1:9000"
const CSV_PATH = "C:\\IndiaGrocers\\Implementation\\natcofoods-import-backup\\natcofoods-catalog.csv"

// Map product type to collection handle
const TYPE_TO_COLLECTION = {
  "Rice": "rice-grains",
  "Flour": "rice-grains",
  "Corn": "rice-grains",
  "Couscous": "rice-grains",
  "Bread & Flour": "rice-grains",
  "Pasta": "noodles-pasta",
  "Soya": "dals-lentils",
  "Lentils": "dals-lentils",
  "Beans": "dals-lentils",
  "Tinned Lentils, Beans": "dals-lentils",
  "Ghee & Oils": "cooking-essentials",
  "Ghee": "cooking-essentials",
  "Oil": "cooking-essentials",
  "Nuts": "snacks-namkeen",
  "Raw Nuts": "snacks-namkeen",
  "Flavoured Nuts": "snacks-namkeen",
  "Seeds": "snacks-namkeen",
  "seeds": "snacks-namkeen",
  "Dried Fruit": "snacks-namkeen",
  "Tinned Fruit": "sweets-mithai",
  "Snacks": "snacks-namkeen",
  "Namkeen & Lentil Snacks": "snacks-namkeen",
  "Daria Lentil Snack": "snacks-namkeen",
  "Lentil Snack": "snacks-namkeen",
  "Pappadoms": "papads-fryums",
  "Pappadom": "papads-fryums",
  "Chutneys, Pickles & Sauces": "pickles-chutneys",
  "Pickles": "pickles-chutneys",
  "Chutney": "pickles-chutneys",
  "Sauces": "sauces-ketchup",
  "Sauce": "sauces-ketchup",
  "Paste": "pickles-chutneys",
  "Spices": "spices-masalas",
  "Spice Jars": "spices-masalas",
  "Spice & Herb Jars": "spices-masalas",
  "Spice Blends and Mixes": "spices-masalas",
  "Seasoning": "spices-masalas",
  "Herbs": "spices-masalas",
  "Flavouring": "spices-masalas",
  "Food Colouring": "spices-masalas",
  "Food Colourings & Essences": "spices-masalas",
  "Sugar": "sweets-mithai",
  "Sugar & Jaggery": "sweets-mithai",
  "Teas & Drinks": "beverages",
  "Tea": "beverages",
  "Drinks": "beverages",
  "Drink": "beverages",
  "Coconut Products": "cooking-essentials",
  "Coconut": "cooking-essentials",
  "Tinned Coconut": "cooking-essentials",
  "Vegetables": "fresh-vegetables",
  "vegetable": "fresh-vegetables",
  "Tinned Vegetables": "fresh-vegetables",
  "Dairy": "dairy",
  "Milk Powder": "dairy",
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

  // Read CSV → product type mapping
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
    // Also add base name (without weight) for merged products
    const base = t.replace(/\s+\d+\.?\d*\s*(g|kg|ml|l|litre|litres|ltr)s?$/i, "").replace(/\s+[Ff]ull\s+[Cc]ase.*$/, "").trim()
    if (base && base !== t && !titleToType[base]) titleToType[base] = ty
  }

  // Get collections
  console.log("Fetching collections...")
  const { collections } = await (await fetch(`${BASE}/admin/collections?limit=20`, { headers })).json()
  const colByHandle = {}
  for (const c of collections) colByHandle[c.handle] = c

  // Get all products
  console.log("Fetching products...")
  const { products } = await (await fetch(`${BASE}/admin/products?limit=500&fields=id,title,collection`, { headers })).json()
  console.log(`  ${products.length} products`)

  // Map products to collections
  const colToProductIds = {}
  let unmatched = 0, alreadyAssigned = 0

  for (const p of products) {
    if (p.collection) { alreadyAssigned++; continue }

    const type = titleToType[p.title]
    if (!type) { unmatched++; continue }

    const colHandle = TYPE_TO_COLLECTION[type]
    if (!colHandle) { unmatched++; continue }

    const col = colByHandle[colHandle]
    if (!col) { unmatched++; continue }

    if (!colToProductIds[col.id]) colToProductIds[col.id] = []
    colToProductIds[col.id].push(p.id)
  }

  console.log(`  ${alreadyAssigned} already in collections, ${unmatched} unmatched`)
  console.log(`  Assigning to ${Object.keys(colToProductIds).length} collections...`)

  for (const [colId, prodIds] of Object.entries(colToProductIds)) {
    const col = collections.find(c => c.id === colId)
    console.log(`    ${col?.title}: ${prodIds.length} products`)
  }

  // Assign
  console.log("\nAssigning...")
  let assigned = 0
  for (const [colId, prodIds] of Object.entries(colToProductIds)) {
    const col = collections.find(c => c.id === colId)
    const res = await fetch(`${BASE}/admin/collections/${colId}/products`, {
      method: "POST",
      headers,
      body: JSON.stringify({ add: prodIds }),
    })
    if (res.ok) {
      assigned += prodIds.length
      console.log(`  ✅ ${col?.title}: ${prodIds.length}`)
    } else {
      const e = await res.text()
      console.log(`  ❌ ${col?.title}: ${e.slice(0, 100)}`)
    }
  }

  console.log(`\nDone: ${assigned} products assigned to collections`)
}

main().catch(console.error)
