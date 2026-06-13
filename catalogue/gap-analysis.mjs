/**
 * SEARCH GAP ANALYSIS
 * Compares catalogue expectations against MeiliSearch reality for every
 * search term and category. Produces a gap report for fine-tuning.
 *
 * Output: catalogue/expectation-vs-reality.json
 *   For each search term / category:
 *     expected: titles in catalogue-derived order (what should appear)
 *     actual:   titles in MeiliSearch-ranked order (what does appear)
 *     missing:  titles in expected but not in actual
 *     extra:    titles in actual but not in expected
 *     gaps:     positional differences for titles in both lists
 *
 * The expected order is deterministic from the catalogue:
 *   1. Brand priority (known brands ranked above generic)
 *   2. Match quality (more search words matching = higher rank)
 *   3. Price ascending within same match quality
 */
import { readFileSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, "expectation-vs-reality.json")

const BASE = "http://127.0.0.1:9000"
const MEILI = process.env.MEILISEARCH_HOST || "http://localhost:7700"

const STOP_WORDS = new Set(["the", "and", "for", "with", "all", "per", "of", "in", "a", "to", "is", "it", "on", "at", "or", "an", "be", "by", "no", "do", "so", "as", "if", "my", "he", "we", "go", "up", "us"])

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

function matchScore(productTitle, searchTerms) {
  const titleTokens = tokenize(productTitle)
  let score = 0
  for (const st of searchTerms) {
    if (titleTokens.includes(st)) score += 2
    else if (productTitle.toLowerCase().includes(st)) score += 1
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

function deriveExpectedOrder(products, searchTerm) {
  const searchTokens = tokenize(searchTerm)
  if (searchTokens.length === 0) return []

  // Filter products that match at least one search token
  const matching = products
    .map(p => ({ ...p, score: matchScore(p.title, searchTokens) }))
    .filter(p => p.score > 0)

  // Sort by: match score (desc), brand priority (desc), price (asc)
  matching.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const ba = brandScore(a.title), bb = brandScore(b.title)
    if (bb !== ba) return bb - ba
    return (a.price_gbp || 99999) - (b.price_gbp || 99999)
  })

  return matching.slice(0, 12).map(p => p.title)
}

async function meiliSearch(query, categoryHandle) {
  const filterParts = []
  if (categoryHandle) filterParts.push(`category_handle = "${categoryHandle}"`)
  const body = { q: query, limit: 12, attributesToRetrieve: ["title"], showMatchesPosition: true }
  if (filterParts.length > 0) body.filter = filterParts.join(" AND ")
  const r = await fetch(`${MEILI}/indexes/products/search`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  })
  const data = await r.json()
  return (data.hits || []).map(h => h.title)
}

async function main() {
  // 1. Fetch all products from admin API (catalogue source of truth)
  const loginRes = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  const { token } = await loginRes.json()
  const H = { Authorization: `Bearer ${token}` }

  console.log("Fetching products...")
  const products = []
  for (let o = 0; ; o += 100) {
    const r = await fetch(`${BASE}/admin/products?limit=100&offset=${o}&fields=id,title`, { headers: H })
    const d = await r.json()
    for (const p of (d.products || [])) {
      products.push({ id: p.id, title: p.title, price_gbp: 0 })
    }
    if ((d.products || []).length < 100) break
  }
  console.log(`  ${products.length} products`)

  // 2. Fetch all categories
  console.log("Fetching categories...")
  const cats = []
  for (let o = 0; ; o += 100) {
    const r = await fetch(`${BASE}/admin/product-categories?limit=100&offset=${o}&fields=id,handle,name,parent_category_id,products.id,products.title`, { headers: H })
    const d = await r.json()
    cats.push(...(d.product_categories || []))
    if ((d.product_categories || []).length < 100) break
  }

  // 3. Build search terms from product titles (one per unique core product)
  const searchTermSet = new Set()

  // Add curated high-value search terms
  const CURATED_TERMS = [
    "basmati rice", "basmati rice 5kg", "toor dal", "toor dal 2kg",
    "chana dal", "moong dal", "masoor dal", "urad dal", "rajma",
    "chickpeas", "black eye beans", "kidney beans", "brown lentils",
    "turmeric", "haldi", "cumin seeds", "jeera", "coriander", "dhania",
    "chilli powder", "mirchi", "garam masala", "chana masala", "biryani masala",
    "tandoori masala", "kitchen king", "pav bhaji", "chicken masala",
    "methi", "fenugreek", "fennel", "saunf", "ajwain", "cardamom",
    "cinnamon", "cloves", "black pepper", "star anise", "nutmeg", "bay leaves",
    "asafoetida", "hing", "amchoor", "tamarind", "kala namak",
    "mustard oil", "coconut oil", "sunflower oil", "olive oil", "ghee",
    "atta", "wheat flour", "gram flour", "besan", "rice flour", "maida",
    "semolina", "sooji", "ragi flour", "chapati flour",
    "paneer", "coconut milk", "jaggery", "pickle", "chutney",
    "haldiram", "bikaji", "bhujia", "sev", "parle", "britannia",
    "maggi", "shan", "mdh masala", "trs", "natco",
    "tea", "chai", "coffee", "horlicks", "bournvita",
    "aashirvaad atta", "tilda basmati", "kohinoor basmati",
    "almonds", "cashew", "pistachio", "walnut", "peanuts",
    "mango pickle", "lime pickle", "mixed pickle",
    "papad", "pappadoms", "poha", "idli rice", "sona masuri",
    "popcorn", "couscous", "vermicelli",
    "food colouring", "coconut water", "rose syrup", "rooh afza",
  ]
  CURATED_TERMS.forEach(t => searchTermSet.add(t))

  // Add auto-derived core terms from all products
  for (const p of products) {
    const title = p.title
    // Strip brand prefix (e.g. "Natco - ")
    const core = title.includes(" - ") ? title.split(" - ").slice(1).join(" - ") : title
    // Strip weight
    const noWeight = core.replace(/\d+\.?\d*\s*(g|kg|ml|l|litre|oz|lb)/gi, "").trim()
    // Take meaningful words
    const tokens = tokenize(noWeight)
    if (tokens.length >= 2) {
      searchTermSet.add(tokens.slice(0, 3).join(" "))
    }
  }

  console.log(`Search terms: ${searchTermSet.size}`)

  // 4. For each search term, record expected vs actual
  const report = {
    generated: new Date().toISOString(),
    productCount: products.length,
    searchTermCount: searchTermSet.size,
    categoryCount: cats.length,
    searchGaps: [],
    categoryGaps: [],
  }

  console.log("Running search term gap analysis...")
  let done = 0
  for (const term of searchTermSet) {
    const expected = deriveExpectedOrder(products, term)
    const actual = await meiliSearch(term)
    const expectedSet = new Set(expected)
    const actualSet = new Set(actual)
    const missing = expected.filter(t => !actualSet.has(t))
    const extra = actual.filter(t => !expectedSet.has(t))
    const gaps = []
    for (let i = 0; i < Math.min(expected.length, actual.length); i++) {
      if (expected[i] !== actual[i]) {
        gaps.push({ position: i, expected: expected[i], actual: actual[i] })
      }
    }

    report.searchGaps.push({
      searchTerm: term,
      expected,
      actual,
      expectedCount: expected.length,
      actualCount: actual.length,
      overlap: expected.filter(t => actualSet.has(t)).length,
      missing: missing.slice(0, 10),
      extra: extra.slice(0, 10),
      positionalGaps: gaps.slice(0, 5),
    })

    done++
    if (done % 100 === 0) console.log(`  ${done}/${searchTermSet.size}`)
  }

  // 5. For each category with products, record expected vs actual
  console.log(`\nRunning category gap analysis...`)
  const catWithProds = cats.filter(c => (c.products || []).length > 0)
  done = 0
  for (const cat of catWithProds) {
    const catProds = (cat.products || []).filter(p => p.title)
    // Expected: products in this category, ordered by brand priority then price
    const expected = catProds
      .sort((a, b) => {
        const ba = brandScore(a.title), bb = brandScore(b.title)
        if (bb !== ba) return bb - ba
        const pa = products.find(p => p.id === a.id)?.price_gbp || 99999
        const pb = products.find(p => p.id === b.id)?.price_gbp || 99999
        return pa - pb
      })
      .map(p => p.title)
      .slice(0, 12)

    const actual = await meiliSearch("", cat.handle)
    const expectedSet = new Set(expected)
    const actualSet = new Set(actual)
    const missing = expected.filter(t => !actualSet.has(t))
    const extra = actual.filter(t => !expectedSet.has(t))
    const gaps = []
    for (let i = 0; i < Math.min(expected.length, actual.length); i++) {
      if (expected[i] !== actual[i]) {
        gaps.push({ position: i, expected: expected[i], actual: actual[i] })
      }
    }

    report.categoryGaps.push({
      categoryHandle: cat.handle,
      categoryName: cat.name,
      isParent: !cat.parent_category_id,
      expected,
      actual,
      expectedCount: expected.length,
      actualCount: actual.length,
      overlap: expected.filter(t => actualSet.has(t)).length,
      missing: missing.slice(0, 10),
      extra: extra.slice(0, 10),
      positionalGaps: gaps.slice(0, 5),
    })

    done++
    if (done % 25 === 0) console.log(`  ${done}/${catWithProds.length}`)
  }

  writeFileSync(OUT, JSON.stringify(report, null, 2))

  // Summary
  const searchOverlapAvg = report.searchGaps.reduce((s, g) => s + g.overlap, 0) / report.searchGaps.length
  const categoryOverlapAvg = report.categoryGaps.reduce((s, g) => s + g.overlap, 0) / report.categoryGaps.length
  const searchMissingCount = report.searchGaps.reduce((s, g) => s + g.missing.length, 0)
  const catMissingCount = report.categoryGaps.reduce((s, g) => s + g.missing.length, 0)

  console.log(`\n${"=".repeat(60)}`)
  console.log(`  GAP ANALYSIS COMPLETE`)
  console.log(`${"=".repeat(60)}`)
  console.log(`  Search terms analyzed:     ${report.searchTermCount}`)
  console.log(`  Categories analyzed:       ${report.categoryGaps.length}`)
  console.log(`  Avg search overlap:        ${searchOverlapAvg.toFixed(1)} products`)
  console.log(`  Avg category overlap:      ${categoryOverlapAvg.toFixed(1)} products`)
  console.log(`  Total search mismatches:   ${searchMissingCount}`)
  console.log(`  Total category mismatches: ${catMissingCount}`)
  console.log(`  Report: ${OUT}`)
  console.log(`${"=".repeat(60)}`)
}

main().catch(e => { console.error(e); process.exit(1) })
