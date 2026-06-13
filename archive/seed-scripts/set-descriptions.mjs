import { readFileSync } from "fs"

const BASE = "http://127.0.0.1:9000"
const CSV_PATH = "C:\\IndiaGrocers\\Implementation\\natcofoods-import-backup\\natcofoods-catalog.csv"

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

  // Read CSV for product types
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

  // Get products
  const { products } = await (await fetch(`${BASE}/admin/products?limit=500&fields=id,title,description,categories`, { headers })).json()
  console.log(`Fetched ${products.length} products`)

  let empty = 0, updated = 0
  for (const p of products) {
    if (p.description) continue // skip products that already have a description
    empty++

    const type = titleToType[p.title] || "grocery"
    const catName = p.categories?.[0]?.name || "Indian Groceries"

    const description = `Premium ${type.toLowerCase()} from Natco Foods. ${catName}.`

    const res = await fetch(`${BASE}/admin/products/${p.id}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ description }),
    })

    if (res.ok) {
      updated++
      if (updated % 50 === 0) console.log(`  ${updated}...`)
    } else {
      const e = await res.text()
      console.log(`  ❌ ${p.title}: ${e.slice(0, 80)}`)
    }
  }

  console.log(`\nDone: ${updated} descriptions set (${empty} were empty)`)
}

main().catch(console.error)
