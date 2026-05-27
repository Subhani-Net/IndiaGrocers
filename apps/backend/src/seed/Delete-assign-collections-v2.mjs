import { readFileSync } from "fs"

const BASE = "http://127.0.0.1:9000"
const CSV_PATH = "C:\\IndiaGrocers\\Implementation\\Natcofoods\\natcofoods-import\\natcofoods-catalog.csv"

const TYPE_TO_COLLECTION = {
  "Rice": "staples-grains", "Flour": "atta-flours", "Corn": "staples-grains",
  "Couscous": "staples-grains", "Bread & Flour": "atta-flours", "Pasta": "ready-to-cook",
  "Soya": "dal-lentils", "Lentils": "dal-lentils", "Beans": "dal-lentils",
  "Tinned Lentils, Beans": "dal-lentils",
  "Ghee & Oils": "oils-ghee", "Ghee": "oils-ghee", "Oil": "oils-ghee",
  "Nuts": "snacks-namkeen", "Raw Nuts": "snacks-namkeen", "Flavoured Nuts": "snacks-namkeen",
  "Seeds": "snacks-namkeen", "seeds": "snacks-namkeen",
  "Dried Fruit": "snacks-namkeen", "Tinned Fruit": "snacks-namkeen",
  "Snacks": "snacks-namkeen", "Namkeen & Lentil Snacks": "snacks-namkeen",
  "Daria Lentil Snack": "snacks-namkeen", "Lentil Snack": "snacks-namkeen",
  "Pappadoms": "snacks-namkeen", "Pappadom": "snacks-namkeen",
  "Chutneys, Pickles & Sauces": "pickles-chutneys",
  "Pickles": "pickles-chutneys", "Chutney": "pickles-chutneys",
  "Sauces": "condiments", "Sauce": "condiments", "Paste": "pickles-chutneys",
  "Spices": "spices-ground", "Spice Jars": "spices-ground",
  "Spice & Herb Jars": "spices-ground",
  "Spice Blends and Mixes": "spice-blends",
  "Seasoning": "spice-blends", "Herbs": "spices-ground", "Flavouring": "spice-blends",
  "Food Colouring": "spices-ground", "Food Colourings & Essences": "spices-ground",
  "Sugar": "staples-grains", "Sugar & Jaggery": "condiments",
  "Teas & Drinks": "beverages", "Tea": "beverages", "Drinks": "beverages", "Drink": "beverages",
  "Coconut Products": "oils-ghee", "Coconut": "oils-ghee", "Tinned Coconut": "oils-ghee",
  "Vegetables": "fresh", "vegetable": "fresh", "Tinned Vegetables": "fresh",
  "Dairy": "dairy", "Milk Powder": "dairy",
  // TRS categories
  "Pulses": "dal-lentils", "Condiments Sauces": "pickles-chutneys",
  "Cans": "fresh", "Speciality": "staples-grains",
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

  // Read CSV
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
    const base = t.replace(/\s+\d+\.?\d*\s*(g|kg|ml|l|litre|litres|ltr)s?$/i, "").replace(/\s+[Ff]ull\s+[Cc]ase.*$/, "").trim()
    if (base && base !== t && !titleToType[base]) titleToType[base] = ty
  }

  // Also read TRS JSON for TRS product type mappings
  const TRS_PATH = "C:\\IndiaGrocers\\Implementation\\TRS_products\\products.json"
  const trsProducts = JSON.parse(readFileSync(TRS_PATH, "utf-8").replace(/^\uFEFF/, ""))
  for (const p of trsProducts) {
    const name = (p.product_name || "").replace(/^TRS\s+/, "")
    if (name && p.category && !titleToType[name]) titleToType[name] = p.category
  }
  console.log(`  CSV + TRS: ${Object.keys(titleToType).length} product-type mappings`)

  // Get collections
  const { collections } = await (await fetch(`${BASE}/admin/collections?limit=20`, { headers })).json()
  const colByHandle = {}
  for (const c of collections) colByHandle[c.handle] = c

  // Get products
  const { products } = await (await fetch(`${BASE}/admin/products?limit=500&fields=id,title,collection_id`, { headers })).json()
  console.log(`Products: ${products.length}`)

  // Assign via product update
  let assigned = 0, skipped = 0
  for (const p of products) {
    if (p.collection_id) { skipped++; continue }

    const type = titleToType[p.title]
    if (!type) { skipped++; continue }

    const colHandle = TYPE_TO_COLLECTION[type]
    if (!colHandle) { skipped++; continue }

    const col = colByHandle[colHandle]
    if (!col) { skipped++; continue }

    const res = await fetch(`${BASE}/admin/products/${p.id}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ collection_id: col.id }),
    })

    if (res.ok) {
      assigned++
      if (assigned % 50 === 0) console.log(`  ${assigned}...`)
    } else {
      const e = await res.text()
      console.log(`  ❌ ${p.title}: ${e.slice(0, 80)}`)
    }
  }

  console.log(`\nDone: ${assigned} assigned, ${skipped} skipped/unchanged`)
}

main().catch(console.error)
