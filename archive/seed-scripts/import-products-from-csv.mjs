/**
 * Import Natco Foods products from the CSV catalog into Medusa.
 * Backend must be running on http://127.0.0.1:9000
 * Usage: node src/seed/import-products-from-csv.mjs
 */
import { readFileSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "http://127.0.0.1:9000"

const CSV_PATH = resolve(__dirname, "../../../../Implementation/Natcofoods/natcofoods-import-backup/natcofoods-catalog.csv")

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
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
  if (!existsSync(CSV_PATH)) {
    console.error("CSV not found at:", CSV_PATH)
    process.exit(1)
  }

  const headers = await login()
  console.log("Logged in\n")

  const csv = readFileSync(CSV_PATH, "utf-8")
  const lines = csv.trim().split("\n").map(l => {
    const vals = []
    let current = "", inQuotes = false
    for (const ch of l) {
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === "," && !inQuotes) { vals.push(current.trim()); current = ""; continue }
      current += ch
    }
    vals.push(current.trim())
    return vals
  })

  const rows = lines.slice(1).filter(r => r[0] && r[1])

  // Group rows by product handle
  const products = new Map()
  for (const row of rows) {
    const handle = (row[0] || slugify(row[1])) .toLowerCase().slice(0, 80)
    if (!handle) continue

    if (!products.has(handle)) {
      products.set(handle, {
        title: row[1],
        handle,
        subtitle: row[2] || "",
        description: row[3] || "",
        status: (row[4] || "published").toLowerCase(),
        thumbnail: row[5] || "",
        weight: parseInt(row[6]) || 0,
        discountable: (row[7] || "TRUE").toUpperCase() === "TRUE",
        type: row[8] || "",
        tags: [row[9], row[10], row[11]].filter(Boolean),
        variants: [],
      })
    }

    const prod = products.get(handle)
    const variantTitle = row[12] || "Default"
    const priceGBP = parseFloat(row[19] || "0")
    const barcode = row[14]?.trim()
    const sku = row[13] || `${handle}-v${prod.variants.length}`
    prod.variants.push({
      title: variantTitle,
      sku: prod.variants.length > 0 ? `${sku}-${prod.variants.length}` : sku,
      barcode: barcode || undefined,
      manage_inventory: false,
      allow_backorder: true,
      options: { [row[17] || "Weight/Size"]: row[18] || variantTitle },
      prices: [{ currency_code: "gbp", amount: Math.round(priceGBP * 100) }],
    })
  }

  console.log(`${products.size} unique products from ${rows.length} CSV rows\n`)

  let created = 0, skipped = 0, errors = 0
  let i = 0
  for (const [, product] of products) {
    i++
    if (product.variants.length === 0) { skipped++; continue }

    const payload = {
      title: product.title,
      handle: product.handle,
      subtitle: product.subtitle || undefined,
      description: product.description || undefined,
      status: "published",
      discountable: product.discountable,
      tags: undefined,
      options: [{ title: "Weight/Size", values: [...new Set(product.variants.map(v => v.options["Weight/Size"] || v.title))] }],
      variants: product.variants.map((v, vi) => ({
        title: v.title,
        sku: v.sku,
        barcode: v.barcode,
        manage_inventory: false,
        allow_backorder: true,
        options: { "Weight/Size": v.options["Weight/Size"] || v.title },
        prices: v.prices,
      })),
    }

    try {
      const res = await fetch(`${BASE}/admin/products`, {
        method: "POST", headers, body: JSON.stringify(payload),
      })
      if (res.ok) {
        created++
        if (i % 20 === 0) process.stdout.write(`\n  ${i}/${products.size}`)
        else process.stdout.write(".")
      } else {
        const err = await res.json()
        if (err.type === "duplicate_error") { skipped++; process.stdout.write("d") }
        else { errors++; console.log(`\n  FAIL ${product.title}: ${err.message?.slice(0, 80)}`) }
      }
    } catch (e) {
      errors++; console.log(`\n  ERROR ${product.title}: ${e.message}`)
    }
  }

  console.log(`\n\nDone: ${created} created, ${skipped} skipped, ${errors} errors`)
}

main().catch(console.error)
