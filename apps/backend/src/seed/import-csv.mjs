import { readFile } from "fs/promises"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "http://127.0.0.1:9000"
const CSV_PATH = resolve(__dirname, "indian-grocery-catalog.csv")

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

async function main() {
  // 1. Login
  const loginRes = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })

  if (!loginRes.ok) {
    console.error("Login failed:", await loginRes.text())
    process.exit(1)
  }

  const { token } = await loginRes.json()
  if (!token) {
    console.error("Login failed — no token in response")
    process.exit(1)
  }
  console.log("✅ Logged in")

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

  // 2. Read CSV
  const csv = await readFile(CSV_PATH, "utf-8")
  const lines = csv.trim().split("\n").map((l) => {
    const vals = []
    let current = ""
    let inQuotes = false
    for (const ch of l) {
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === "," && !inQuotes) { vals.push(current.trim()); current = ""; continue }
      current += ch
    }
    vals.push(current.trim())
    return vals
  })

  const header = lines[0]
  const rows = lines.slice(1).filter((r) => r[0])

  // 3. Group by Product Title
  const products = new Map()
  for (const row of rows) {
    const title = row[1] || ""
    const handle = slugify(title) || slugify(row[0])
    const key = handle
    if (!key) continue
    if (!products.has(key)) {
      const optionName = row[14] || "Weight"
      products.set(key, { title, handle, optionName, optionValues: new Set(), variants: [] })
    }
    const prod = products.get(key)
    prod.optionValues.add(row[15])
    prod.variants.push(row)
  }

  console.log(`📦 ${products.size} unique products from ${rows.length} variant rows`)

  // 4. Create each product
  let created = 0, errors = 0, skipped = 0
  let idx = 0
  for (const [handle, prod] of products) {
    idx++
    const optionName = prod.optionName
    const optionValues = [...prod.optionValues]

    const payload = {
      title: prod.title,
      handle,
      status: "published",
      discountable: true,
      options: [{ title: optionName, values: optionValues }],
      variants: prod.variants.map((v, vi) => ({
        title: v[9] || v[15] || `Variant ${vi + 1}`,
        sku: v[10] || `${handle}-${vi}`,
        barcode: v[11] || "",
        manage_inventory: (v[12] || "").toLowerCase() === "true",
        allow_backorder: (v[13] || "").toLowerCase() === "true",
        options: { [optionName]: v[15] },
        prices: [{ currency_code: "gbp", amount: Math.round(Number(v[16] || 0) * 100) }],
      })),
    }

    if (payload.variants.length === 0) { skipped++; continue }

    try {
      const res = await fetch(`${BASE}/admin/products`, {
        method: "POST", headers, body: JSON.stringify(payload),
      })
      if (res.ok) { created++; process.stdout.write(".") }
      else {
        const err = await res.json()
        if (err.type === "duplicate_error") { skipped++; process.stdout.write("s") }
        else { errors++; process.stdout.write("x") }
      }
    } catch {
      errors++; process.stdout.write("!")
    }
  }

  console.log(`\n\n✅ ${created} created, ${skipped} skipped, ${errors} errors`)
}

main().catch(console.error)
