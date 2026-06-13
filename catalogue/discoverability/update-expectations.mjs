/**
 * UPDATE EXPECTATIONS
 * Computes stable expected product titles for every search term and category.
 * Run ONLY when products are added/deleted/updated. The output is committed.
 *
 * The expected order is deterministic from the catalogue:
 *   1. Match quality (more search words matching title = higher rank)
 *   2. Brand priority (known brands ranked above generic)
 *   3. Price ascending within same brand/match tier
 *
 * Usage:
 *   node catalogue/discoverability/update-expectations.mjs
 * Output:
 *   catalogue/discoverability/expected-results.json (committed, stable)
 */
import { readFileSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "http://127.0.0.1:9000"
const CURATED = resolve(__dirname, "curated-search-terms.json")
const OUT = resolve(__dirname, "expected-results.json")

const STOP_WORDS = new Set(["the", "and", "for", "with", "all", "per", "of", "in", "a", "to", "is", "it", "on", "at", "or", "an", "be", "by", "no", "do", "so", "as", "if", "my", "he", "we", "go", "up", "us", "size", "bag", "pack", "case"])

const BRAND_PRIORITY = {
  "tilda": 10, "kohinoor": 9, "daawat": 8, "lal qilla": 7, "falak": 6,
  "aashirvaad": 10, "pillsbury": 9, "elephant": 8,
  "shan": 9, "mdh": 8, "haldiram's": 9, "bikaji": 7,
  "trs": 7, "patak's": 7, "lijjat": 6,
  "parle-g": 8, "parle": 7, "britannia": 7,
  "maggi": 8, "horlicks": 7, "bournvita": 7,
  "brooke bond": 7, "tata gold": 7, "wagh bakri": 7,
  "natco": 1,
}

function tokenize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w))
}

function matchScore(title, searchTokens) {
  const titleTokens = tokenize(title)
  let score = 0
  for (const st of searchTokens) {
    if (titleTokens.includes(st)) score += 2
    else if (title.toLowerCase().includes(st)) score += 1
  }
  return score
}

function brandScore(title) {
  const lower = title.toLowerCase()
  for (const [brand, priority] of Object.entries(BRAND_PRIORITY)) {
    if (lower.includes(brand)) return priority
  }
  return 0
}

function deriveExpectedTitles(products, searchTerm, limit = 12) {
  const searchTokens = tokenize(searchTerm)
  if (searchTokens.length === 0) return []

  const matching = products
    .map(p => ({ title: p.title, score: matchScore(p.title, searchTokens) }))
    .filter(p => p.score > 0)

  matching.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const ba = brandScore(a.title), bb = brandScore(b.title)
    if (bb !== ba) return bb - ba
    return a.title.localeCompare(b.title)
  })

  return matching.slice(0, limit).map(p => p.title)
}

async function main() {
  // 1. Fetch catalogue
  const loginRes = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  const { token } = await loginRes.json()
  const H = { Authorization: `Bearer ${token}` }

  console.log("Fetching catalogue...")
  const products = []
  for (let o = 0; ; o += 100) {
    const r = await fetch(`${BASE}/admin/products?limit=100&offset=${o}&fields=id,title`, { headers: H })
    const d = await r.json()
    products.push(...(d.products || []))
    if ((d.products || []).length < 100) break
  }

  // Fetch categories
  const cats = []
  for (let o = 0; ; o += 100) {
    const r = await fetch(`${BASE}/admin/product-categories?limit=100&offset=${o}&fields=id,handle,name,parent_category_id,products.id,products.title`, { headers: H })
    const d = await r.json()
    cats.push(...(d.product_categories || []))
    if ((d.product_categories || []).length < 100) break
  }

  console.log(`  ${products.length} products, ${cats.length} categories`)

  // 2. Build search term set: curated + auto-derived from product titles
  const curatedData = JSON.parse(readFileSync(CURATED, "utf8"))
  const searchTermSet = new Set()

  // Add curated terms
  for (const t of curatedData.terms) {
    searchTermSet.add(t.term)
  }

  // Auto-derive one term per product (core name without brand/weight)
  for (const p of products) {
    const core = p.title.includes(" - ") ? p.title.split(" - ").slice(1).join(" - ") : p.title
    const noWeight = core.replace(/\d+\.?\d*\s*(g|kg|ml|l|litre|oz|lb)/gi, "").trim()
    const tokens = tokenize(noWeight)
    if (tokens.length >= 2) {
      searchTermSet.add(tokens.slice(0, 3).join(" "))
    }
  }

  console.log(`  ${searchTermSet.size} search terms (${curatedData.terms.length} curated + auto-derived)`)

  // 3. Compute expected titles for each search term
  console.log("Computing expected titles...")
  const searchExpectations = {}
  for (const term of searchTermSet) {
    searchExpectations[term] = deriveExpectedTitles(products, term, 12)
  }

  // 4. Compute expected titles for each category with products
  console.log("Computing category expectations...")
  const categoryExpectations = {}
  const catWithProds = cats.filter(c => (c.products || []).length > 0)
  for (const cat of catWithProds) {
    const catProds = (cat.products || []).filter(p => p.title)
    const expected = catProds
      .sort((a, b) => {
        const ba = brandScore(a.title), bb = brandScore(b.title)
        if (bb !== ba) return bb - ba
        return (a.title || "").localeCompare(b.title || "")
      })
      .map(p => p.title)
      .slice(0, 12)

    // Also compute parent-level expectations (aggregate all children)
    let aggregate = null
    if (!cat.parent_category_id) {
      const childHandles = cats.filter(c => c.parent_category_id === cat.id).map(c => c.handle)
      const allChildProds = []
      for (const ch of childHandles) {
        const childCat = cats.find(c => c.handle === ch)
        if (childCat?.products) {
          allChildProds.push(...childCat.products.filter(p => p.title))
        }
      }
      if (allChildProds.length > 0) {
        aggregate = allChildProds
          .sort((a, b) => {
            const ba = brandScore(a.title), bb = brandScore(b.title)
            if (bb !== ba) return bb - ba
            return (a.title || "").localeCompare(b.title || "")
          })
          .map(p => p.title)
          .slice(0, 12)
      }
    }

    categoryExpectations[cat.handle] = {
      name: cat.name,
      isParent: !cat.parent_category_id,
      titles: expected,
      aggregateTitles: aggregate,
    }
  }

  // 5. Output
  const output = {
    _generated: new Date().toISOString(),
    _productCount: products.length,
    _searchTermCount: searchTermSet.size,
    _categoryCount: catWithProds.length,
    _instructions: "This file is the stable source of truth for expected search results. Regenerate with: node catalogue/discoverability/update-expectations.mjs",
    search: searchExpectations,
    categories: categoryExpectations,
  }

  writeFileSync(OUT, JSON.stringify(output, null, 2))

  const totalSearchTitles = Object.values(searchExpectations).reduce((s, t) => s + t.length, 0)
  const totalCatTitles = Object.values(categoryExpectations).reduce((s, c) => s + c.titles.length, 0)
  console.log(`\n${"=".repeat(60)}`)
  console.log(`  Expected results written: ${OUT}`)
  console.log(`  Search terms: ${Object.keys(searchExpectations).length}`)
  console.log(`  Search expectations: ${totalSearchTitles} titles total`)
  console.log(`  Category expectations: ${totalCatTitles} titles across ${Object.keys(categoryExpectations).length} categories`)
  console.log(`${"=".repeat(60)}`)
}

main().catch(e => { console.error(e); process.exit(1) })
