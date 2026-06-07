/**
 * Product Price Loader
 *
 * Accepts a JSON or CSV pricelist and updates Medusa product variant prices.
 * Matches products by title, handle, or variant SKU.
 *
 * Usage:
 *   node scripts/pricing/load-pricelist.mjs <pricelist.json>              # Dry run
 *   node scripts/pricing/load-pricelist.mjs <pricelist.json> --apply      # Update prices
 *   node scripts/pricing/load-pricelist.mjs <pricelist.csv> --apply       # CSV format
 *
 * Pricelist formats:
 *
 * JSON:
 * [
 *   { "title": "Natco - Cumin Seeds 400g", "price_gbp": 3.49 },
 *   { "title": "Tilda Pure Basmati", "variant_title": "2kg", "price_gbp": 4.99 },
 *   { "handle": "shan-special-chicken-biryani-mix", "price_gbp": 1.49 },
 *   { "sku": "NATCO-CUMINSEEDS-400g", "price_gbp": 3.49 }
 * ]
 *
 * CSV (header row required):
 * title,variant_title,price_gbp
 * "Natco - Cumin Seeds 400g",Default,3.49
 * "Tilda Pure Basmati",2kg,4.99
 */

import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..", "..")
const BASE = "http://127.0.0.1:9000"

const APPLY = process.argv.includes("--apply")
const pricelistPath = process.argv[2]

if (!pricelistPath) {
  console.log("Usage: node scripts/pricing/load-pricelist.mjs <pricelist.json|csv> [--apply]")
  console.log("\nPricelist format (JSON):")
  console.log('  [ { "title": "Product Name", "price_gbp": 4.99 } ]')
  console.log("\nPricelist format (CSV):")
  console.log('  title,variant_title,price_gbp')
  console.log('  "Product Name",Default,4.99')
  process.exit(1)
}

// ─── PARSE PRICELIST ───

const raw = readFileSync(pricelistPath, "utf-8")
const isCSV = pricelistPath.toLowerCase().endsWith(".csv")

let priceEntries = []

if (isCSV) {
  const lines = raw.trim().split("\n")
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""))
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue
    const values = parseCSVLine(line)
    const entry = {}
    headers.forEach((h, i) => { entry[h] = values[i]?.trim() || "" })
    entry.price_gbp = parseFloat(entry.price_gbp) || 0
    if (entry.price_gbp > 0) priceEntries.push(entry)
  }
} else {
  priceEntries = JSON.parse(raw).filter(e => e.price_gbp > 0)
}

console.log(`Loaded ${priceEntries.length} price entries from ${pricelistPath}\n`)

function parseCSVLine(line) {
  const result = []
  let current = "", inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (ch === "," && !inQuotes) { result.push(current); current = ""; continue }
    current += ch
  }
  result.push(current)
  return result
}

// ─── LOGIN ───

async function login() {
  const res = await fetch(BASE + "/auth/user/emailpass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: "Bearer " + (await res.json()).token, "Content-Type": "application/json" }
}

// ─── FETCH ALL PRODUCTS ───

async function fetchAllProducts(headers) {
  const prods = []
  let off = 0
  while (true) {
    const r = await (await fetch(BASE + "/admin/products?limit=100&offset=" + off + "&fields=*variants", { headers })).json()
    if (!r.products?.length) break
    prods.push(...r.products)
    off += 100
  }
  return prods
}

// ─── MATCHING ───

function normalizeTitle(title) {
  return title.toLowerCase().replace(/&amp;/g, "&").replace(/\s+/g, " ").trim()
}

function matchProduct(entry, products) {
  const entryTitle = normalizeTitle(entry.title || entry.product_name || "")
  const entryHandle = (entry.handle || "").toLowerCase()
  const entrySKU = (entry.sku || "").toLowerCase()

  for (const p of products) {
    // Match by handle
    if (entryHandle && p.handle?.toLowerCase() === entryHandle) return p
    // Match by title (normalized)
    if (entryTitle && normalizeTitle(p.title) === entryTitle) return p
    // Match by SKU
    if (entrySKU) {
      for (const v of p.variants || []) {
        if (v.sku?.toLowerCase() === entrySKU) return p
      }
    }
  }
  return null
}

function findVariant(product, entry) {
  const variantTitle = entry.variant_title || entry.variant || "Default"
  const variants = product.variants || []
  // Match by variant title
  const byTitle = variants.find(v => v.title === variantTitle)
  if (byTitle) return byTitle
  // Fallback: first variant
  return variants[0]
}

// ─── MAIN ───

async function main() {
  console.log("=" .repeat(60))
  console.log("  Price Loader — " + (APPLY ? "APPLY MODE" : "DRY RUN"))
  console.log("=" .repeat(60) + "\n")

  const headers = await login()
  const products = await fetchAllProducts(headers)
  console.log(`Fetched ${products.length} products from DB\n`)

  let updated = 0, notFound = 0, skipped = 0
  const report = []

  for (const entry of priceEntries) {
    const product = matchProduct(entry, products)

    if (!product) {
      notFound++
      report.push({ status: "NOT_FOUND", entry: entry.title || entry.handle || entry.sku, price: entry.price_gbp })
      continue
    }

    const variant = findVariant(product, entry)
    if (!variant) {
      notFound++
      report.push({ status: "NO_VARIANT", product: product.title, price: entry.price_gbp })
      continue
    }

    const pricePence = Math.round(entry.price_gbp * 100)
    const currentPrice = variant.prices?.[0]?.amount || 0

    if (currentPrice === pricePence) {
      skipped++
      continue
    }

    if (!APPLY) {
      console.log(`  WOULD UPDATE: ${product.title} | ${variant.title} | £${currentPrice/100} → £${pricePence/100}`)
      report.push({ status: "WOULD_UPDATE", product: product.title, variant: variant.title, old: currentPrice, new: pricePence })
      continue
    }

    // Update price via variant endpoint
    const body = {
      prices: [{ currency_code: "gbp", amount: pricePence }],
    }

    try {
      const res = await fetch(BASE + "/admin/products/" + product.id + "/variants/" + variant.id, {
        method: "POST", headers,
        body: JSON.stringify(body),
      })

      if (res.ok) {
        updated++
        console.log(`  ✅ ${product.title} | ${variant.title} | £${currentPrice/100} → £${pricePence/100}`)
        report.push({ status: "UPDATED", product: product.title, variant: variant.title, old: currentPrice, new: pricePence })
      } else {
        const err = await res.text()
        console.log(`  ❌ ${product.title} — ${err.slice(0, 80)}`)
        report.push({ status: "FAILED", product: product.title, error: err.slice(0, 100) })
      }
    } catch (e) {
      console.log(`  ❌ ${product.title} — ${e.message}`)
      report.push({ status: "ERROR", product: product.title, error: e.message })
    }

    if (updated % 20 === 0) console.log(`  ...${updated} updated so far...`)
  }

  // ─── SUMMARY ───
  console.log("\n" + "=" .repeat(60))
  console.log(`  Updated: ${updated} | Not Found: ${notFound} | Skipped: ${skipped}`)
  console.log("=" .repeat(60))

  if (!APPLY) {
    console.log("\nDry run — run with --apply to write prices.")
  } else {
    console.log("\nNext: cd apps/meilisearch && npm run reindex")
    console.log("      (reindex updates price_gbp in MeiliSearch)")
  }
}

main().catch(console.error)
