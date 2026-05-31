/**
 * Catalog Completeness Audit
 * 
 * Phase 1 gate: Verifies all Natco products from Shopify data-design CSVs
 * are present in Medusa DB. Must pass before enrichment/category/search work.
 *
 * Usage: node scripts/audit-catalog-completeness.mjs
 */
import { readFileSync, readdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const DATA_DIR = resolve(ROOT, "data-design")
const BASE = "http://127.0.0.1:9000"

async function main() {
  console.log("=== CATALOG COMPLETENESS AUDIT ===\n")
  
  // 1. Count products in data-design CSVs
  const csvFiles = readdirSync(DATA_DIR).filter(f => f.endsWith("-master.csv"))
  const csvProducts = new Set()
  const byCsv = {}
  const byCategory = {}

  for (const file of csvFiles) {
    const csv = readFileSync(resolve(DATA_DIR, file), "utf-8")
    const lines = csv.trim().split("\n")
    const hdrs = lines[0].split(",").map(h => h.replace(/"/g, "").trim())
    const catIdx = hdrs.indexOf("natco_subcategory")
    const titleIdx = hdrs.indexOf("title")
    if (titleIdx < 0) continue
    
    byCsv[file] = { total: lines.length - 1, byCat: {} }
    
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",")
      const title = (cols[titleIdx] || "").replace(/"/g, "").trim()
      if (!title) continue
      csvProducts.add(title)
      if (catIdx >= 0) {
        const cat = (cols[catIdx] || "").replace(/"/g, "").trim()
        if (cat) {
          byCsv[file].byCat[cat] = (byCsv[file].byCat[cat] || 0) + 1
          byCategory[cat] = (byCategory[cat] || 0) + 1
        }
      }
    }
  }

  console.log("1. SHOPIFY CATALOG (data-design CSVs)")
  console.log(`   Total unique products: ${csvProducts.size}`)
  for (const [file, data] of Object.entries(byCsv)) {
    console.log(`   ${file}: ${data.total} products, ${Object.keys(data.byCat).length} categories`)
  }

  // 2. Count products in Medusa DB
  console.log("\n2. MEDUSA DATABASE")
  try {
    const pk = "pk_736cac65cdf91adefa6c0180c37a29f00047518c60376efb84586432312a2d00"
    const r = await fetch(`${BASE}/store/products?limit=1&fields=id`, {
      headers: { "x-publishable-api-key": pk },
    })
    const data = await r.json()
    const dbCount = data.count || 0
    console.log(`   Products in DB: ${dbCount}`)

    // Cross-reference: how many CSV products are in DB?
    let offset = 0
    const dbTitles = new Set()
    while (true) {
      const r2 = await fetch(`${BASE}/store/products?limit=100&offset=${offset}&fields=title`, {
        headers: { "x-publishable-api-key": pk },
      })
      const d2 = await r2.json()
      if (!d2.products?.length) break
      for (const p of d2.products) {
        dbTitles.add(p.title)
      }
      offset += 100
    }

    let inDb = 0, missing = 0
    const missingTitles = []
    for (const title of csvProducts) {
      if (dbTitles.has(title)) inDb++
      else { missing++; if (missingTitles.length < 20) missingTitles.push(title) }
    }

    console.log(`   CSV products in DB: ${inDb}`)
    console.log(`   CSV products MISSING: ${missing}`)
    if (missingTitles.length > 0) {
      console.log(`\n   Sample missing (${Math.min(missingTitles.length, 20)} of ${missing}):`)
      missingTitles.forEach(t => console.log(`     - ${t}`))
    }
  } catch (e) {
    console.log(`   ❌ Medusa unreachable: ${e.message}`)
  }

  // 3. MeiliSearch sync check
  console.log("\n3. MEILISEARCH SYNC")
  try {
    const d = JSON.stringify({ q: "", limit: 0, facets: ["category_handle"] })
    const r = await fetch("http://localhost:7700/indexes/products/search", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: d,
    })
    const msData = await r.json()
    const msCount = msData.estimatedTotalHits || 0
    console.log(`   Products indexed: ${msCount}`)
    if (msCount !== dbCount) {
      console.log(`   ⚠️  MISMATCH: MeiliSearch (${msCount}) vs DB (${dbCount})`)
    } else {
      console.log(`   ✅ In sync with DB`)
    }
  } catch (e) {
    console.log(`   ❌ MeiliSearch unreachable: ${e.message}`)
  }

  // 4. Per-category gap
  console.log("\n4. PER-CATEGORY GAP (Shopify CSV vs MeiliSearch)")
  try {
    const d2 = JSON.stringify({ q: "", limit: 0, facets: ["category_handle"] })
    const r2 = await fetch("http://localhost:7700/indexes/products/search", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: d2,
    })
    const msFacets = (await r2.json()).facetDistribution?.category_handle || {}
    
    console.log("   Category".padEnd(35) + "Shopify".padEnd(10) + "MeiliSearch".padEnd(12) + "Gap")
    console.log("   " + "-".repeat(60))
    for (const [cat, csvCount] of Object.entries(byCategory).sort()) {
      const msCount = msFacets[cat] || 0
      const gap = typeof csvCount === 'number' ? csvCount - msCount : 0
      const status = gap === 0 ? "✓" : gap < 0 ? "?" : `-${gap}`
      console.log(`   ${cat.padEnd(35)} ${String(csvCount).padStart(5)} ${String(msCount).padStart(10)} ${String(gap).padStart(8)}`)
    }
  } catch (e) {
    console.log(`   ❌ MeiliSearch unreachable: ${e.message}`)
  }

  console.log("\n=== AUDIT COMPLETE ===")
}

main().catch(console.error)
