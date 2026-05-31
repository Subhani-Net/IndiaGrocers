/**
 * Storefront Validation — Phase 5 Gate
 * Verifies all category pages return expected product counts
 * and search queries return results.
 *
 * Usage: node scripts/validate-storefront.mjs
 * Prerequisites: Storefront running on :8000, Backend on :9000, MeiliSearch on :7700
 */

const BASE = "http://localhost:8000/gb"

// Expected products per category (parent-level resolved counts)
const EXPECTED = {
  "/categories/spices": { min: 110, desc: "All spices" },
  "/categories/spices-herbs": { min: 50, desc: "Spices & Herbs child" },
  "/categories/lentils": { min: 35, desc: "All lentils" },
  "/categories/grains": { min: 12, desc: "All grains" },
  "/categories/essentials": { min: 15, desc: "Essentials" },
  "/categories/nuts-seeds": { min: 35, desc: "Nuts & Seeds" },
  "/categories/snacks": { min: 30, desc: "Snacks" },
  "/categories/flours": { min: 12, desc: "Flours" },
  "/categories/tinned-products-parent": { min: 15, desc: "Tinned Products" },
}

// Search queries that should return results
const SEARCHES = [
  { q: "jeera", desc: "jeera (cumin)" },
  { q: "haldi", desc: "haldi (turmeric)" },
  { q: "chana", desc: "chana (chickpea)" },
  { q: "basmati", desc: "basmati rice" },
  { q: "chilli", desc: "chilli powder" },
  { q: "atta", desc: "atta flour" },
  { q: "ghee", desc: "ghee" },
  { q: "papad", desc: "pappadoms" },
]

// Dietary filter tests
const DIETARY_TESTS = [
  { filter: "metadata.dietary_flags = vegan", desc: "Vegan products", min: 30 },
  { filter: "metadata.dietary_flags = vegetarian", desc: "Vegetarian products", min: 300 },
  { filter: "metadata.dietary_flags = gluten-free", desc: "Gluten-free products", min: 30 },
]

async function checkPage(url, expected) {
  try {
    const r = await fetch(BASE + url, { signal: AbortSignal.timeout(15000) })
    if (!r.ok) return { pass: false, reason: `HTTP ${r.status}`, count: 0 }
    const html = await r.text()
    // Count product cards — look for common patterns in the HTML
    const cardCount = (html.match(/product-card|weight-heavy-card|productCard/gi) || []).length
    // Alternative: look for product links within the grid
    const linkCount = (html.match(/\/products\//gi) || []).length
    const estCount = Math.max(cardCount, Math.floor(linkCount / 2))

    if (estCount >= expected.min) {
      return { pass: true, count: estCount, reason: "" }
    } else {
      return { pass: false, count: estCount, reason: `expected ≥${expected.min}, got ${estCount}` }
    }
  } catch (e) {
    return { pass: false, count: 0, reason: e.message }
  }
}

async function checkSearch(query, desc) {
  try {
    const d = JSON.stringify({ q: query, limit: 5 })
    const r = await fetch("http://localhost:7700/indexes/products/search", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: d,
      signal: AbortSignal.timeout(10000),
    })
    const data = await r.json()
    const count = data.estimatedTotalHits || data.hits?.length || 0
    if (count > 0) return { pass: true, count, reason: "" }
    return { pass: false, count, reason: "no results" }
  } catch (e) {
    return { pass: false, count: 0, reason: e.message }
  }
}

async function main() {
  console.log("=== STOREFRONT VALIDATION ===\n")
  let passed = 0, failed = 0

  // 1. Category pages
  console.log("--- Category Pages ---")
  for (const [url, exp] of Object.entries(EXPECTED)) {
    const result = await checkPage(url, exp)
    const status = result.pass ? "✓" : "✗"
    console.log(`  ${status} ${url.padEnd(42)} ${String(result.count).padStart(3)} products (min:${exp.min}) ${exp.desc}`)
    if (result.pass) passed++; else { failed++; console.log(`      Reason: ${result.reason}`) }
  }

  // 2. Search queries
  console.log("\n--- Search Queries ---")
  for (const s of SEARCHES) {
    const result = await checkSearch(s.q, s.desc)
    const status = result.pass ? "✓" : "✗"
    console.log(`  ${status} "${s.q}"`.padEnd(48) + ` ${result.count} results — ${s.desc}`)
    if (result.pass) passed++; else { failed++; console.log(`      Reason: ${result.reason}`) }
  }

  // 3. Dietary filters
  console.log("\n--- Dietary Filters ---")
  for (const d of DIETARY_TESTS) {
    const body = JSON.stringify({ q: "", limit: 1, filter: d.filter })
    try {
      const r = await fetch("http://localhost:7700/indexes/products/search", {
        method: "POST", headers: { "Content-Type": "application/json" }, body,
        signal: AbortSignal.timeout(10000),
      })
      const data = await r.json()
      const count = data.estimatedTotalHits || 0
      const pass = count >= d.min
      const status = pass ? "✓" : "✗"
      console.log(`  ${status} ${d.desc.padEnd(32)} ${count} results (min:${d.min})`)
      if (pass) passed++; else { failed++; console.log(`      Gap: ${d.min - count} short`) }
    } catch (e) { failed++; console.log(`  ✗ ${d.desc}: ${e.message}`) }
  }

  console.log(`\n=== RESULT: ${passed} passed, ${failed} failed ===`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(e => { console.log("ERROR: " + e.message); process.exit(1) })
