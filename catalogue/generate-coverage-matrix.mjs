/**
 * PRODUCT COVERAGE MATRIX GENERATOR
 * Auto-generates search quality tests for every product and category
 * from the live MeiliSearch index. Run after each DB seed.
 *
 * Usage: node catalogue/generate-coverage-matrix.mjs
 * Output: catalogue/product-coverage-matrix.json (committed)
 *
 * Three test types per product:
 *   1. Core name search (e.g., "toor dal oily")
 *   2. Brand + core search (e.g., "natco toor dal")
 *   3. Weight-specified search (e.g., "toor dal 2kg") [if weight exists]
 *
 * One test per leaf category with products.
 *
 * Synonym expansion: if a product's core term matches a known synonym,
 * generate a cross-language test.
 */
import { readFileSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, "product-coverage-matrix.json")

const BASE = "http://127.0.0.1:9000"
const MEILI = process.env.MEILISEARCH_HOST || "http://localhost:7700"

const KNOWN_BRANDS = [
  "Natco", "TRS", "Shan", "MDH", "Haldiram's", "Bikaji", "Aashirvaad",
  "Tilda", "Kohinoor", "Daawat", "Lal Qilla", "Falak", "Elephant",
  "Pillsbury", "Parle-G", "Parle", "Britannia", "Maggi", "Patak's",
  "Lijjat", "Brooke Bond", "Tata Gold", "Wagh Bakri", "Girnar",
  "Dabur", "Glucon-D", "Maaza", "Frooti", "Horlicks", "Bournvita",
  "Hamdard",
]

const WEIGHT_RE = /(\d+\.?\d*\s*(g|kg|ml|l|ml|litre|oz|lb))/gi

function parseTitle(title) {
  let brand = "", core = "", weight = ""
  if (!title) return { brand, core, weight }

  // Strip weight/size
  const weightMatch = title.match(WEIGHT_RE)
  if (weightMatch) weight = weightMatch[0].toLowerCase()

  let clean = title.replace(WEIGHT_RE, "").replace(/\s+/g, " ").trim()

  // Check "Natco - X" pattern
  const dashIdx = clean.indexOf(" - ")
  if (dashIdx > 0) {
    brand = clean.slice(0, dashIdx).trim()
    core = clean.slice(dashIdx + 3).trim()
  } else {
    // Try known brand prefixes
    for (const b of KNOWN_BRANDS) {
      if (clean.toLowerCase().startsWith(b.toLowerCase())) {
        brand = b
        core = clean.slice(b.length).trim()
        break
      }
    }
    if (!brand) core = clean
  }

  return { brand, core, weight }
}

function extractTokenizedCore(core) {
  // Remove punctuation, lowercase, take first 3 meaningful words
  const tokens = core
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !["the", "and", "for", "with", "all", "per", "bag", "pack", "case", "size"].includes(w))

  return tokens.slice(0, 3).join(" ")
}

function safeCore(core) {
  // Return a substring-safe slice of the core (not truncated mid-word)
  // Used for expectedTitles where we need a reliable substring match
  if (!core) return ""
  // Find first 3-5 whole words
  const words = core.split(/\s+/).filter(w => w.length > 0)
  const first = words.slice(0, Math.min(4, words.length)).join(" ")
  // Avoid trailing partial words
  if (first.length > 30) return first.slice(0, 30).trim()
  return first
}

async function main() {
  // 1. Login to admin API
  const loginRes = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  const { token } = await loginRes.json()
  const H = { Authorization: `Bearer ${token}` }

  // 2. Fetch all products with categories
  console.log("Fetching products from Medusa...")
  const products = []
  for (let offset = 0; ; offset += 100) {
    const r = await fetch(`${BASE}/admin/products?limit=100&offset=${offset}&fields=id,title,categories.id,categories.handle,categories.name`, { headers: H })
    const d = await r.json()
    products.push(...(d.products || []))
    if ((d.products || []).length < 100) break
  }
  console.log(`  Fetched ${products.length} products`)

  // 3. Fetch all categories to build leaf list
  console.log("Fetching categories...")
  const cats = []
  for (let offset = 0; ; offset += 100) {
    const r = await fetch(`${BASE}/admin/product-categories?limit=100&offset=${offset}&fields=id,handle,name,parent_category_id,products.id,products.title`, { headers: H })
    const d = await r.json()
    cats.push(...(d.product_categories || []))
    if ((d.product_categories || []).length < 100) break
  }
  const leafCats = cats.filter(c => c.parent_category_id && (c.products || []).length > 0)
  console.log(`  Found ${leafCats.length} leaf categories with products`)

  // 4. Load synonym dictionary for cross-language test generation
  let synonymMap = {}
  try {
    const synPath = resolve(__dirname, "..", "apps", "meilisearch", "src", "search-synonyms.ts")
    const synSource = readFileSync(synPath, "utf8")
    // Extract synonym entries from TypeScript source
    const matches = synSource.matchAll(/\{\s*term:\s*"([^"]+)"\s*,\s*synonyms:\s*\[([^\]]+)\]/g)
    for (const m of matches) {
      const term = m[1]
      const syns = m[2].split(",").map(s => s.trim().replace(/"/g, ""))
      synonymMap[term] = syns
    }
    console.log(`  Loaded ${Object.keys(synonymMap).length} synonym entries`)
  } catch (e) {
    console.log("  No synonym dictionary found, skipping transliteration tests")
  }

  // 5. Generate product-level tests
  console.log(`Generating product tests...`)
  const productTests = []
  const coveredProducts = new Set()
  const coveredCategories = new Set()

  for (const p of products) {
    const { brand, core, weight } = parseTitle(p.title)
    const tokenCore = extractTokenizedCore(core)

    if (!tokenCore) continue

    // Test 1: Core name search
    productTests.push({
      testGroup: "Auto - Core Name",
      searchTerm: tokenCore,
      expectedTitles: [safeCore(core)],
      minExpected: 1,
      productId: p.id,
    })

    // Test 2: Brand + core search (if brand exists)
    if (brand && tokenCore) {
      const brandTokens = brand.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim()
      productTests.push({
        testGroup: "Auto - Brand + Core",
        searchTerm: brandTokens + " " + tokenCore.split(" ").slice(0, 2).join(" "),
        expectedTitles: [brand.slice(0, 15), safeCore(core)],
        minExpected: 1,
        productId: p.id,
      })
    }

    // Test 3: Weight-specified search
    if (weight && tokenCore) {
      productTests.push({
        testGroup: "Auto - Core + Weight",
        searchTerm: tokenCore + " " + weight,
        expectedTitles: [safeCore(core), weight],
        minExpected: 1,
        productId: p.id,
      })
    }

    // Test 4: Transliteration / synonym (if applicable)
    for (const [term, syns] of Object.entries(synonymMap)) {
      const allTerms = [term, ...syns]
      const tokenWords = tokenCore.split(" ")
      for (const tw of tokenWords) {
        if (allTerms.some(t => t.toLowerCase().includes(tw) || tw.includes(t.toLowerCase()))) {
          // Use the Hindi term as search query, expect English core in results
          const engTerm = term
          productTests.push({
            testGroup: "Auto - Synonym",
            searchTerm: engTerm,
            expectedTitles: [safeCore(core)],
            minExpected: 1,
            productId: p.id,
          })
          break
        }
      }
    }

    coveredProducts.add(p.id)

    // Assign category coverage
    const leafCatHandles = (p.categories || []).filter(c => cats.find(db => db.handle === c.handle && db.parent_category_id))
    for (const lc of leafCatHandles) {
      coveredCategories.add(lc.handle)
    }
  }

  // 6. Generate category-level tests for every leaf category
  console.log(`Generating category tests...`)
  const categoryTests = []

  for (const cat of leafCats) {
    const prods = (cat.products || []).filter(p => products.find(db => db.id === p.id))
    if (prods.length === 0) continue

    categoryTests.push({
      testGroup: "Auto - Category Page",
      searchTerm: "",
      categoryHandle: cat.handle,
      expectedTitles: prods.slice(0, 2).filter(p => p.title).map(p => {
        const { core } = parseTitle(p.title)
        return safeCore(core || p.title)
      }),
      minExpected: 1,
    })

    coveredCategories.add(cat.handle)
  }

  // 7. Deduplicate by searchTerm + categoryHandle
  const seen = new Set()
  const deduped = []
  for (const t of [...productTests, ...categoryTests]) {
    const key = `${t.searchTerm}||${t.categoryHandle || ""}`
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(t)
    }
  }

  // Remove productId from output (internal only)
  const output = deduped.map(({ productId, ...rest }) => rest)

  writeFileSync(OUT, JSON.stringify(output, null, 2))
  console.log(`\n${"=".repeat(60)}`)
  console.log(`  coverage-matrix.json written: ${output.length} tests`)
  console.log(`  Product coverage: ${coveredProducts.size}/${products.length} (${((coveredProducts.size / products.length) * 100).toFixed(1)}%)`)
  console.log(`  Category coverage: ${coveredCategories.size}/${leafCats.length} leaf cats`)
  console.log(`  Product tests: ${productTests.length} | Category tests: ${categoryTests.length}`)
  console.log(`  After dedup: ${output.length}`)
  console.log(`${"=".repeat(60)}`)
}

main().catch(e => { console.error(e); process.exit(1) })
