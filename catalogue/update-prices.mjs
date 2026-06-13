/**
 * WEEKLY PRICE UPDATE ENGINE
 *
 * Reads prices/current.csv and updates variant prices in Medusa DB.
 * Archives old prices to prices/history/YYYY-MM-DD.csv before updating.
 *
 * Usage:
 *   node catalogue/update-prices.mjs                    # Dry run
 *   node catalogue/update-prices.mjs --apply            # Apply price changes
 *
 * Price CSV format: variant_handle,price_gbp,effective_date
 */

import { readFileSync, copyFileSync, mkdirSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "http://127.0.0.1:9000"
const APPLY = process.argv.includes("--apply")
const CURRENT = resolve(__dirname, "prices", "current.csv")
const HISTORY = resolve(__dirname, "prices", "history")

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: `Bearer ${(await res.json()).token}`, "Content-Type": "application/json" }
}

async function main() {
  const H = await login()
  console.log("==============================")
  console.log("  Price Update Engine")
  console.log("  Mode:", APPLY ? "APPLY" : "DRY RUN")
  console.log("==============================\n")

  if (!existsSync(CURRENT)) {
    console.log("ERROR: prices/current.csv not found. Run generate-csvs.mjs first.")
    process.exit(1)
  }

  const text = readFileSync(CURRENT, "utf8")
  const lines = text.trim().split("\n").slice(1) // Skip header

  // Archive current prices
  const today = new Date().toISOString().slice(0, 10)
  if (APPLY) {
    mkdirSync(HISTORY, { recursive: true })
    copyFileSync(CURRENT, resolve(HISTORY, `${today}.csv`))
    console.log(`Archived: prices/history/${today}.csv\n`)
  }

  // Fetch current products
  console.log("Fetching products from DB...")
  const productMap = new Map()
  for (let offset = 0; ; offset += 50) {
    const res = await fetch(`${BASE}/admin/products?limit=50&offset=${offset}&fields=handle,variants.id,variants.prices.amount,variants.prices.currency_code,variants.prices.id`, { headers: H })
    const data = await res.json()
    for (const p of (data.products || [])) productMap.set(p.handle, p)
    if ((data.products || []).length < 50) break
  }
  console.log(`  ${productMap.size} products found\n`)

  let updated = 0, skipped = 0, notFound = 0, failed = 0

  for (const line of lines) {
    if (!line.trim()) continue
    const [handle, priceStr, dateStr] = line.split(",").map(s => (s || "").trim().replace(/^"|"$/g, ""))
    if (!handle || !priceStr) continue

    const priceGbp = parseFloat(priceStr)
    if (isNaN(priceGbp)) continue

    const product = productMap.get(handle)
    if (!product) { notFound++; continue }

    const variant = product.variants?.[0]
    if (!variant) { notFound++; continue }

    const currentPrice = (variant.prices || []).find(p => p.currency_code === "gbp")
    const currentAmount = currentPrice?.amount || 0
    const targetPence = Math.round(priceGbp * 100)

    if (currentAmount === targetPence) {
      skipped++
      continue
    }

    if (APPLY) {
      try {
        const res = await fetch(`${BASE}/admin/products/${product.id}/variants/${variant.id}`, {
          method: "POST", headers: H,
          body: JSON.stringify({ prices: [{ currency_code: "gbp", amount: targetPence, id: currentPrice?.id }] }),
        })
        if (res.ok) {
          updated++
          console.log(`  £${priceGbp} → ${handle}`)
        } else {
          console.log(`  FAIL: ${handle} — HTTP ${res.status}`)
          failed++
        }
      } catch (e) {
        failed++
        console.log(`  ERROR: ${handle} — ${e.message}`)
      }
    } else {
      updated++
      console.log(`  WOULD: £${(currentAmount/100).toFixed(2)} → £${priceGbp} | ${handle}`)
    }
  }

  console.log(`\n==============================`)
  console.log(`  Updated: ${updated} | Skipped: ${skipped} | Not Found: ${notFound} | Failed: ${failed}`)

  if (APPLY && updated > 0) {
    console.log(`\n  ⚠ Prices updated — reindex MeiliSearch to sync search results:`)
    console.log(`    cd apps/meilisearch && npm run reindex`)
  }

  if (!APPLY) console.log(`\n  DRY RUN — run with --apply to execute`)
}

main().catch(e => { console.error(e); process.exit(1) })
