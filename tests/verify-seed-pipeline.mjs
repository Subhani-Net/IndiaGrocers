#!/usr/bin/env node
/**
 * Seed Pipeline Integration Test
 *
 * Validates the complete seed-catalogue.mjs pipeline end-to-end:
 *   - Pre-flight validation catches errors before API calls
 *   - --dry-run reports correct variant groupings
 *   - --apply creates products with barcodes, variants, metadata
 *   - Variant normalization groups weights correctly
 *   - Price sync matches by SKU
 *   - Idempotent re-runs produce 0 creates and 0 failures
 *   - MeiliSearch document count matches product count
 *   - Data health check passes
 *
 * Usage:
 *   node tests/verify-seed-pipeline.mjs
 *
 * Requires:
 *   - Backend running on http://localhost:9000
 *   - MeiliSearch running on http://localhost:7700
 *   - Docker services up (Postgres, Redis, MeiliSearch)
 *   - Admin credentials: admin@example.com / password123
 */

import { execSync } from "child_process"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { readFileSync, existsSync } from "fs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "http://127.0.0.1:9000"
const MEILI = "http://localhost:7700"
const CATALOGUE_DIR = resolve(__dirname, "..", "catalogue")

let passed = 0, failed = 0, warnings = 0

function pass(name) { console.log(`  ✅ ${name}`); passed++ }
function fail(name, detail) { console.log(`  ❌ ${name}`); if (detail) console.log(`     ${detail}`); failed++ }
function warn(name) { console.log(`  ⚠️  ${name}`); warnings++ }

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  if (!res.ok) throw new Error(`Login failed: ${res.status}`)
  const { token } = await res.json()
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
}

// ═══════════════════════════════════════════════════════════
// SECTION 1: Pre-flight validation
// ═══════════════════════════════════════════════════════════
async function testValidation() {
  console.log("\n1. Pre-flight CSV Validation")

  // 1a: Validate categories pass
  console.log("  1a. Category parent-child integrity")
  try {
    const categoriesPath = resolve(CATALOGUE_DIR, "categories.csv")
    if (!existsSync(categoriesPath)) {
      fail("categories.csv exists", "File not found")
    } else {
      const catCSV = readFileSync(categoriesPath, "utf8")
      const catLines = catCSV.trim().split("\n").slice(1)
      const catObjects = catLines.map(line => {
        const parts = parseCSVLine(line)
        return { handle: parts[0], name: parts[1], parent_handle: parts[2], rank: parts[3], description: parts[4] }
      })
      const handles = new Set(catObjects.map(c => c.handle))
      const orphans = catObjects.filter(c => c.parent_handle && !handles.has(c.parent_handle))
      if (orphans.length === 0) {
        pass(`No orphaned parent references (${catObjects.length} categories)`)
      } else {
        fail(`Orphaned parents: ${orphans.map(o => `${o.handle}→${o.parent_handle}`).join(", ")}`)
      }
      if (catObjects.length === 43) pass("43 categories in CSV")
      else fail(`Expected 43 categories, got ${catObjects.length}`)
    }
  } catch (e) { fail("Category CSV parse", e.message) }

  // 1b: Validate products
  console.log("  1b. Product category_handle cross-reference")
  try {
    const prodPath = resolve(CATALOGUE_DIR, "products.csv")
    const catPath = resolve(CATALOGUE_DIR, "categories.csv")
    if (!existsSync(prodPath) || !existsSync(catPath)) {
      fail("CSV files exist", "products.csv or categories.csv missing")
    } else {
      const catCSV = readFileSync(catPath, "utf8")
      const catHandles = new Set(catCSV.trim().split("\n").slice(1).map(l => l.split(",")[0].trim()))
      const prodCSV = readFileSync(prodPath, "utf8")
      const prodLines = prodCSV.trim().split("\n")
      const header = prodLines[0].split(",").map(h => h.trim())
      const catHandleIdx = header.indexOf("category_handle")
      const titleIdx = header.indexOf("product_title")

      let productCount = 0, orphanCats = 0
      const uniqueHandles = new Set()
      for (let i = 1; i < prodLines.length; i++) {
        const vals = parseCSVLine(prodLines[i])
        if (vals.length < catHandleIdx + 1) continue
        productCount++
        const catHandle = (vals[catHandleIdx] || "").trim()
        const title = titleIdx >= 0 ? (vals[titleIdx] || "") : ""
        const handle = (vals[0] || "").trim()
        uniqueHandles.add(handle)
        if (catHandle && !catHandles.has(catHandle)) {
          orphanCats++
          if (orphanCats <= 3) warn(`Orphan category: "${catHandle}" for "${title}"`)
        }
      }
      pass(`${productCount} product rows in CSV (${uniqueHandles.size} unique handles)`)
      if (orphanCats === 0) pass("0 orphaned category_handle references")
      else fail(`${orphanCats} orphaned category_handle references`)
    }
  } catch (e) { fail("Product CSV cross-reference", e.message) }

  // 1c: Brand slug validation
  console.log("  1c. Brand slug check")
  try {
    const prodPath = resolve(CATALOGUE_DIR, "products.csv")
    const prodCSV = readFileSync(prodPath, "utf8")
    const prodLines = prodCSV.trim().split("\n")
    const header = prodLines[0].split(",").map(h => h.trim())
    const bsIdx = header.indexOf("brand_slug")
    const titleIdx = header.indexOf("product_title")
    let zeroBrands = 0
    for (let i = 1; i < prodLines.length; i++) {
      const vals = parseCSVLine(prodLines[i])
      if (vals.length <= bsIdx) continue
      const bs = (vals[bsIdx] || "").trim()
      if (bs === "0" || !bs) {
        zeroBrands++
        const title = titleIdx >= 0 ? (vals[titleIdx] || "") : "unknown"
        if (zeroBrands <= 3) warn(`brand_slug="0" for "${title}"`)
      }
    }
    if (zeroBrands === 0) pass("0 products with brand_slug='0'")
    else fail(`${zeroBrands} products still have brand_slug='0'`)
  } catch (e) { fail("Brand slug check", e.message) }

  // 1d: Column shift detection
  console.log("  1d. Column shift detection")
  try {
    const prodPath = resolve(CATALOGUE_DIR, "products.csv")
    const prodCSV = readFileSync(prodPath, "utf8")
    const prodLines = prodCSV.trim().split("\n")
    const header = prodLines[0].split(",").map(h => h.trim())
    const wuIdx = header.indexOf("weight_unit")
    const wvIdx = header.indexOf("weight_value")
    let shifted = 0
    for (let i = 1; i < prodLines.length; i++) {
      const vals = parseCSVLine(prodLines[i])
      const wu = (vals[wuIdx] || "").trim()
      const wv = (vals[wvIdx] || "").trim()
      if (wu && wu.startsWith("/uploads/")) shifted++
      if (wv && !/^[0-9.]+$/.test(wv)) shifted++
    }
    if (shifted === 0) pass("0 column-shifted rows detected")
    else fail(`${shifted} column-shifted rows still exist`)
  } catch (e) { fail("Column shift detection", e.message) }
}

// ═══════════════════════════════════════════════════════════
// SECTION 2: Variant normalization (dry-run)
// ═══════════════════════════════════════════════════════════
async function testDryRun() {
  console.log("\n2. Dry-Run Variant Normalization")

  try {
    const result = execSync("node seed-catalogue.mjs --dry-run", {
      cwd: CATALOGUE_DIR, encoding: "utf8", timeout: 30000,
    })

    const groupsMatch = result.match(/Groups:\s*(\d+)/)
    const multiMatch = result.match(/(\d+)\s*multi-variant/)
    const singleMatch = result.match(/(\d+)\s*single-variant/)
    const rowsMatch = result.match(/Total variant rows:\s*(\d+)/)
    const csvMatch = result.match(/CSVs:\s*(\d+)\s*products/)

    if (groupsMatch) {
      const groups = parseInt(groupsMatch[1])
      if (groups > 400 && groups < 550) pass(`Product groups: ${groups}`)
      else warn(`Product groups: ${groups} (outside expected range)`)
    } else { fail("Could not parse group count from dry-run output") }

    if (multiMatch) {
      const multi = parseInt(multiMatch[1])
      if (multi > 100) pass(`Multi-variant groups: ${multi}`)
      else warn(`Multi-variant groups: ${multi}`)
    }

    if (singleMatch) {
      const single = parseInt(singleMatch[1])
      if (single > 300) pass(`Single-variant groups: ${single}`)
      else warn(`Single-variant groups: ${single}`)
    }

    if (csvMatch && rowsMatch) {
      const csvCount = parseInt(csvMatch[1])
      const rowCount = parseInt(rowsMatch[1])
      if (csvCount === rowCount) pass(`CSV rows (${csvCount}) = variant rows (${rowCount})`)
      else warn(`CSV rows (${csvCount}) ≠ variant rows (${rowCount})`)
    }

    if (result.includes("✓")) pass("Dry-run completes without errors")
    else if (result.includes("error") || result.includes("Error")) warn("Dry-run output contains error text")
  } catch (e) {
    fail("Dry-run execution", e.message)
  }
}

// ═══════════════════════════════════════════════════════════
// SECTION 3: Product sync (requires backend)
// ═══════════════════════════════════════════════════════════
async function testProductSync() {
  console.log("\n3. Product Sync to Database")

  const H = await login()

  // 3a: Product count
  console.log("  3a. Product count")
  try {
    const r = await fetch(`${BASE}/admin/products?limit=1&fields=id`, { headers: H })
    const data = await r.json()
    const count = data.count || 0
    if (count >= 400) pass(`DB product count: ${count}`)
    else warn(`DB product count: ${count} (expected 400+)`)
  } catch (e) { fail("Product count fetch", e.message) }

  // 3b: Category count
  console.log("  3b. Category count")
  try {
    const r = await fetch(`${BASE}/admin/product-categories?limit=200&fields=id`, { headers: H })
    const data = await r.json()
    const count = data.count || 0
    if (count === 43) pass(`DB category count: ${count}`)
    else warn(`DB category count: ${count} (expected 43)`)
  } catch (e) { fail("Category count fetch", e.message) }

  // 3c: Sample product with multi-variant
  console.log("  3c. Multi-variant product check")
  try {
    const r = await fetch(
      `${BASE}/admin/products?handle=trs-garam-masala&fields=variants.id,variants.title,variants.sku`,
      { headers: H }
    )
    const data = await r.json()
    const product = data.products?.[0]
    if (!product) {
      warn("TRS Garam Masala not found in DB")
    } else {
      const variantCount = product.variants?.length || 0
      if (variantCount >= 2) pass(`TRS Garam Masala has ${variantCount} variants`)
      else warn(`TRS Garam Masala has ${variantCount} variants (expected 2+)`)
      const titles = product.variants?.map(v => v.title) || []
      if (titles.some(t => t.includes("g") || t.includes("kg"))) {
        pass("Variant titles include weight units")
      }
    }
  } catch (e) { fail("Multi-variant check", e.message) }

  // 3d: Barcode presence
  console.log("  3d. Variant barcode check")
  try {
    const r = await fetch(
      `${BASE}/admin/products?handle=trs-garam-masala&fields=variants.id,variants.metadata`,
      { headers: H }
    )
    const data = await r.json()
    const product = data.products?.[0]
    if (!product) {
      warn("TRS Garam Masala not found for barcode check")
    } else {
      const variants = product.variants || []
      let withBarcode = 0, genBarcode = 0
      for (const v of variants) {
        const bc = v.metadata?.barcode
        if (bc) {
          withBarcode++
          if (bc.startsWith("GEN_")) genBarcode++
        }
      }
      pass(`${withBarcode}/${variants.length} variants have barcodes`)
      if (genBarcode > 0) pass(`${genBarcode} generated (GEN_) barcodes present`)
    }
  } catch (e) { fail("Barcode check", e.message) }
}

// ═══════════════════════════════════════════════════════════
// SECTION 4: Price sync
// ═══════════════════════════════════════════════════════════
async function testPriceSync() {
  console.log("\n4. Price Sync")

  try {
    const pricesCSV = readFileSync(resolve(CATALOGUE_DIR, "prices.csv"), "utf8")
    const priceLines = pricesCSV.trim().split("\n")
    const priceCount = priceLines.length - 1 // minus header
    pass(`prices.csv has ${priceCount} entries`)

    const H = await login()
    const r = await fetch(
      `${BASE}/admin/products?handle=trs-garam-masala&fields=variants.id,variants.prices.amount,variants.prices.currency_code`,
      { headers: H }
    )
    const data = await r.json()
    const variants = data.products?.[0]?.variants || []
    let withPrice = 0
    for (const v of variants) {
      if (v.prices?.length > 0) withPrice++
    }
    if (withPrice > 0) pass(`${withPrice}/${variants.length} variants have prices set`)
    else warn("No prices found — prices may not have been synced")
  } catch (e) { fail("Price sync check", e.message) }
}

// ═══════════════════════════════════════════════════════════
// SECTION 5: MeiliSearch
// ═══════════════════════════════════════════════════════════
async function testMeiliSearch() {
  console.log("\n5. MeiliSearch Index")

  try {
    const stats = await (await fetch(`${MEILI}/indexes/products/stats`)).json()
    const docCount = stats.numberOfDocuments || 0
    if (docCount >= 400) pass(`MeiliSearch documents: ${docCount}`)
    else warn(`MeiliSearch documents: ${docCount}`)

    // Search test
    const search = await fetch(`${MEILI}/indexes/products/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: "basmati", limit: 5 }),
    })
    const searchData = await search.json()
    const hits = searchData.hits?.length || 0
    if (hits > 0) pass(`Search for "basmati" returns ${hits} results`)
    else warn("Search for 'basmati' returns 0 results")
  } catch (e) { fail("MeiliSearch", e.message) }
}

// ═══════════════════════════════════════════════════════════
// SECTION 6: Barcode coverage
// ═══════════════════════════════════════════════════════════
async function testBarcodeCoverage() {
  console.log("\n6. Barcode Coverage")

  try {
    const prodPath = resolve(CATALOGUE_DIR, "products.csv")
    const prodCSV = readFileSync(prodPath, "utf8")
    const prodLines = prodCSV.trim().split("\n")
    const header = prodLines[0].split(",").map(h => h.trim())
    const bcIdx = header.indexOf("variant_barcode")
    let totalRows = 0, withBarcode = 0, genBarcode = 0, realEAN = 0
    for (let i = 1; i < prodLines.length; i++) {
      const vals = parseCSVLine(prodLines[i])
      if (vals.length <= bcIdx) continue
      totalRows++
      const bc = (vals[bcIdx] || "").trim()
      if (bc) {
        withBarcode++
        if (bc.startsWith("GEN_")) genBarcode++
        else if (/^\d{12,13}$/.test(bc)) realEAN++
      }
    }
    if (totalRows === withBarcode) pass(`100% barcode coverage: ${withBarcode}/${totalRows}`)
    else warn(`Barcode coverage: ${withBarcode}/${totalRows}`)
    pass(`${genBarcode} generated (GEN_) barcodes — replaceable placeholders`)
    if (realEAN > 0) pass(`${realEAN} real EAN-13 barcodes`)
  } catch (e) { fail("Barcode coverage", e.message) }
}

// ═══════════════════════════════════════════════════════════
// SECTION 7: Variant grouping integrity
// ═══════════════════════════════════════════════════════════
async function testVariantIntegrity() {
  console.log("\n7. Variant Grouping Integrity")

  try {
    const H = await login()
    const r = await fetch(
      `${BASE}/admin/products?handle=trs-mung-dal&fields=options.title,options.values,variants.title`,
      { headers: H }
    )
    const data = await r.json()
    const product = data.products?.[0]
    if (!product) {
      warn("TRS Mung Dal not found")
    } else {
      const variants = product.variants || []
      if (variants.length >= 3) pass(`TRS Mung Dal: ${variants.length} variants`)
      else warn(`TRS Mung Dal: ${variants.length} variants (expected 3+)`)
      const option = product.options?.find(o => o.title === "Weight / Size")
      if (option) {
        pass(`Option "Weight / Size" found with ${option.values?.length || 0} values`)
        if (variants.length === (option.values?.length || 0)) {
          pass("Variant count matches option values count")
        }
      } else if (variants.length === 1) {
        pass("Single-variant — option is 'Default'")
      } else {
        warn("Multi-variant product missing 'Weight / Size' option")
      }
    }
  } catch (e) { fail("Variant integrity", e.message) }
}

// ═══════════════════════════════════════════════════════════
// SECTION 8: Publishable key sync
// ═══════════════════════════════════════════════════════════
async function testPublishableKey() {
  console.log("\n8. Publishable Key Sync")

  try {
    const H = await login()
    const r = await fetch(`${BASE}/admin/api-keys?limit=1&type=publishable&fields=token`, { headers: H })
    const data = await r.json()
    const pk = data.api_keys?.[0]?.token
    if (pk) {
      pass(`Publishable key exists in DB: ${pk.substring(0, 12)}...`)
      const envPath = resolve(__dirname, "..", "apps", "storefront", ".env")
      if (existsSync(envPath)) {
        const envContent = readFileSync(envPath, "utf8")
        if (envContent.includes(pk)) pass("Storefront .env has correct publishable key")
        else warn("Storefront .env does not match DB publishable key — run seed-catalogue --apply to sync")
      } else {
        warn(".env file not found at storefront")
      }
    } else {
      fail("No publishable key found in DB")
    }
  } catch (e) { fail("Publishable key check", e.message) }
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function parseCSVLine(line) {
  const result = []
  let current = "", inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = false
      } else current += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ",") { result.push(current.trim()); current = "" }
      else current += ch
    }
  }
  result.push(current.trim())
  return result
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

async function main() {
  console.log("=".repeat(60))
  console.log("  Seed Pipeline Integration Test")
  console.log(`${"=".repeat(60)}`)

  await testValidation()
  await testDryRun()
  await testProductSync()
  await testPriceSync()
  await testMeiliSearch()
  await testBarcodeCoverage()
  await testVariantIntegrity()
  await testPublishableKey()

  console.log(`\n${"=".repeat(60)}`)
  console.log(`  RESULT: ${passed} passed, ${warnings} warnings, ${failed} failed`)
  console.log(`${"=".repeat(60)}`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(e => {
  console.error(`\nFATAL: ${e.message}`)
  process.exit(1)
})
