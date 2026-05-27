/**
 * Search Intelligence Scraper
 *
 * Drip-feed extractor: BlinkIt + JioMart search data for our 283 products.
 * Rate: ~400 requests/hour during off-peak, ~2 hours for full catalog.
 *
 * Run: node data/search-intelligence/scraper.mjs [--dry-run] [--limit=5]
 *
 * --dry-run   Show what would be scraped without making requests
 * --limit=N   Only process N products (testing)
 */

import fs from "fs"
import { setTimeout as sleep } from "timers/promises"

const PK = "pk_72deb296139d27885561a0fa58b77cbed187d8c5912390c2dc1912cb477083d3"
const OUT_DIR = "data/search-intelligence/per-category"
const DELAY_MIN = 6000   // 6 seconds minimum between requests
const DELAY_MAX = 10000  // 10 seconds maximum (randomized)

// ── Helpers ──
function rand(min, max) { return Math.floor(Math.random() * (max - min) + min) }

async function get(url, headers = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(url, { headers, signal: controller.signal })
    const text = await res.text()
    clearTimeout(timeout)
    return { ok: res.ok, status: res.status, text }
  } catch (e) {
    clearTimeout(timeout)
    return { ok: false, status: 0, text: "", error: e.message }
  }
}

// ── Extract functions ──

function extractSearchSuggestions(html) {
  // Look for autocomplete/suggestion patterns in search page HTML
  const suggestions = []
  const regex = /"suggestion":\s*"([^"]+)"/g
  let m
  while ((m = regex.exec(html)) !== null) suggestions.push(m[1])
  return suggestions.slice(0, 10)
}

function extractBreadcrumb(html) {
  const regex = /"name":\s*"([^"]+)"[^}]*"@type":\s*"BreadcrumbList"/s
  const match = html.match(regex)
  if (match) return []
  // Fallback: extract from JSON-LD
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)
  if (ld) {
    for (const block of ld) {
      try {
        const data = JSON.parse(block.match(/<script[^>]*>([\s\S]*)<\/script>/)[1])
        if (data["@type"] === "BreadcrumbList") {
          return data.itemListElement.map((i) => i.item.name)
        }
      } catch {}
    }
  }
  return []
}

function extractProductTags(html) {
  const tags = []
  // Extract from meta keywords
  const meta = html.match(/<meta[^>]*name="keywords"[^>]*content="([^"]+)"/i)
  if (meta) tags.push(...meta[1].split(/,\s*/))
  // Extract from JSON-LD category
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)
  if (ld) {
    for (const block of ld) {
      try {
        const data = JSON.parse(block.match(/<script[^>]*>([\s\S]*)<\/script>/)[1])
        if (data.category) tags.push(data.category)
        if (data.keywords) tags.push(...(Array.isArray(data.keywords) ? data.keywords : [data.keywords]))
      } catch {}
    }
  }
  return [...new Set(tags)].slice(0, 20)
}

function extractTitlesFromHTML(html) {
  const titles = []
  // og:title
  const og = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)
  if (og) titles.push(og[1])
  // title tag
  const tt = html.match(/<title>([^<]+)<\/title>/i)
  if (tt) titles.push(tt[1])
  // h1
  const h1iter = html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi)
  for (const m of h1iter) titles.push(m[1])
  return [...new Set(titles)].slice(0, 5)
}

function extractJsonLdProduct(html) {
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)
  if (!ld) return {}
  for (const block of ld) {
    try {
      const data = JSON.parse(block.match(/<script[^>]*>([\s\S]*)<\/script>/)[1])
      if (data["@type"] === "Product") return data
    } catch {}
  }
  return {}
}

function extractRelatedSearches(html) {
  const terms = []
  const patterns = [
    /(?:People also search|Related searches|Customers also searched)[^<]*<[^>]*>([\s\S]*?)<\/(?:div|ul)>/gi,
    /"relatedSearch":\s*"([^"]+)"/gi,
    /"related_query":\s*"([^"]+)"/gi,
    /"also_searched":\s*\[([^\]]+)\]/gi,
  ]
  for (const regex of patterns) {
    let m
    while ((m = regex.exec(html)) !== null) {
      const text = m[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
      if (text.length > 2 && text.length < 100) terms.push(text)
    }
  }
  return [...new Set(terms)].slice(0, 15)
}

function extractCategoryListings(html) {
  // Find which category pages list this product
  const categories = []
  const patterns = [
    /"category":\s*"([^"]+)"/gi,
    /"categoryName":\s*"([^"]+)"/gi,
    /itemprop="itemListElement"[^>]*>([\s\S]*?)<\/(?:li|span)>/gi,
  ]
  for (const regex of patterns) {
    let m
    while ((m = regex.exec(html)) !== null) {
      const text = m[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
      if (text.length > 2) categories.push(text)
    }
  }
  return [...new Set(categories)].slice(0, 10)
}

function extractProductRank(html, ourProductName) {
  // Estimate where our matched product appears in search results
  const productCards = html.match(/<a[^>]*class="[^"]*ProductCard[^"]*"/gi)
  if (!productCards) return { total_shown: 0, our_position: -1 }

  for (let i = 0; i < Math.min(productCards.length, 30); i++) {
    // Check next 200 chars for our product name
    const idx = html.indexOf(productCards[i])
    const snippet = html.substring(idx, idx + 300).toLowerCase()
    if (ourProductName.toLowerCase().split(" ").some((w) => w.length > 3 && snippet.includes(w))) {
      return { total_shown: productCards.length, our_position: i + 1 }
    }
  }
  return { total_shown: productCards.length, our_position: -1 }
}

function extractCrossSellProducts(html) {
  // Extract "Frequently Bought Together" / "Also bought" product titles
  const products = []
  const patterns = [
    /(?:Frequently Bought Together|Often bought with|Customers also purchased|Buy it with)[^<]*<[^>]*>([\s\S]*?)<\/(?:div|section)>/gi,
    /"also_bought":\s*\[([^\]]+)\]/gi,
    /"fbt":\s*\[([^\]]+)\]/gi,
    /"cross_sell":\s*\[([^\]]+)\]/gi,
  ]
  for (const regex of patterns) {
    let m
    while ((m = regex.exec(html)) !== null) {
      const section = m[1]
      const titles = section.match(/<a[^>]*>([^<]+)<\/a>/gi)
      if (titles) titles.forEach((a) => {
        const name = a.replace(/<[^>]*>/g, "").trim()
        if (name.length > 5 && name.length < 120) products.push(name)
      })
    }
  }
  return [...new Set(products)].slice(0, 10)
}

function extractPromotionalProducts(html) {
  // Extract sponsored/promoted product placements
  const products = []
  const patterns = [
    /(?:Sponsored|Promoted|Recommended for you)[^<]*<[^>]*>([\s\S]*?)<\/(?:div|section)>/gi,
    /"promoted":\s*true[^}]*"title":\s*"([^"]+)"/gi,
    /"sponsored":\s*true[^}]*"title":\s*"([^"]+)"/gi,
  ]
  for (const regex of patterns) {
    let m
    while ((m = regex.exec(html)) !== null) {
      const t = m[1]?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
      if (t && t.length > 5 && t.length < 120) products.push(t)
    }
  }
  return [...new Set(products)].slice(0, 8)
}

function extractPriceData(html) {
  const prices = []
  const patterns = [
    /"price":\s*(\d+[.]?\d*)/gi,
    /"mrp":\s*(\d+[.]?\d*)/gi,
    /"sellingPrice":\s*(\d+[.]?\d*)/gi,
    /"discount":\s*(\d+)/gi,
    /"offerPrice":\s*(\d+[.]?\d*)/gi,
  ]
  for (const regex of patterns) {
    let m
    while ((m = regex.exec(html)) !== null) prices.push(m[1])
  }
  return {
    raw_matches: prices.slice(0, 10),
    has_discount: html.match(/(\d+)%\s*off/i)?.[1] || null,
    has_mrp_strikethrough: /<del[^>]*>[^<]*\d+[^<]*<\/del>/i.test(html),
  }
}

function extractPopularitySignals(html) {
  return {
    is_bestseller: /bestseller/i.test(html),
    is_trending: /trending/i.test(html),
    is_new_arrival: /new arrival/i.test(html),
    rating_count: html.match(/\((\d[\d,]*)\s*ratings?\)/i)?.[1]?.replace(/,/g, "") || null,
    review_count: html.match(/(\d[\d,]*)\s*reviews?/i)?.[1]?.replace(/,/g, "") || null,
    star_rating: html.match(/(\d[.]?\d*)\s*★/)?.[1] || null,
  }
}

function extractVariantSizes(html) {
  const sizes = new Set()
  const patterns = [
    /"weight":\s*\[([^\]]+)\]/gi,
    /"size":\s*\[([^\]]+)\]/gi,
    /(\d+\.?\d*\s*(?:g|kg|ml|l))\b/gi,
  ]
  for (const regex of patterns) {
    let m
    while ((m = regex.exec(html)) !== null) {
      const val = m[1]?.toLowerCase().trim()
      if (val && val.length < 10) sizes.add(val)
    }
  }
  return [...sizes].slice(0, 15)
}

function extractSearchVolume(html) {
  const match = html.match(/(\d[\d,]*)\s*(?:results|products|items)/i)
  return match ? parseInt(match[1].replace(/,/g, "")) : null
}

function extractFilterRanges(html) {
  const filters = { brands: [], weights: [], price: {} }
  const brandRegex = /"brand":\s*\[([^\]]+)\]/gi
  const weightRegex = /"weight":\s*\[([^\]]+)\]/gi
  let m
  while ((m = brandRegex.exec(html)) !== null) {
    filters.brands.push(...m[1].match(/"([^"]+)"/g)?.map((s) => s.replace(/"/g, "")) || [])
  }
  while ((m = weightRegex.exec(html)) !== null) {
    filters.weights.push(...m[1].match(/"([^"]+)"/g)?.map((s) => s.replace(/"/g, "")) || [])
  }
  const priceMatch = html.match(/"price":\s*\{[^}]*"min":\s*(\d+)[^}]*"max":\s*(\d+)/i)
  if (priceMatch) filters.price = { min: priceMatch[1], max: priceMatch[2] }
  return filters
}

function extractSeasonalTags(html) {
  const tags = new Set()
  const seasonal = [/diwali/i, /ramadan/i, /eid/i, /navratri/i, /holi/i, /summer/i, /winter/i, /christmas/i, /ganesh/i, /pongal/i, /onam/i, /dussehra/i]
  for (const regex of seasonal) {
    if (regex.test(html)) tags.add(regex.source.replace(/\\/g, "").replace(/\/i$/, ""))
  }
  return [...tags]
}

// ── Main Scraper Functions ──

async function searchPlatform(query, platform) {
  const urls = {
    blinkit: `https://blinkit.com/s/?q=${encodeURIComponent(query)}`,
    jiomart: `https://www.jiomart.com/catalogsearch/result/?q=${encodeURIComponent(query)}`,
  }
  const res = await get(urls[platform], { "User-Agent": "Mozilla/5.0", Accept: "text/html" })
  if (!res.ok) return { query, suggestions: [], titles: [], status: res.status }

  const html = res.text

  // Extract competitor product titles from search results page
  const competitorTitles = []
  const titleRegex = /<a[^>]*class="[^"]*ProductCard[^"]*"[^>]* title="([^"]+)"|alt="([^"]+)"[^>]*Product/gis
  let tm
  while ((tm = titleRegex.exec(html)) !== null) {
    const t = tm[1] || tm[2]
    if (t) competitorTitles.push(t.trim())
  }

  return {
    query,
    suggestions: extractSearchSuggestions(html),
    competitor_titles: competitorTitles.slice(0, 10),
    titles: extractTitlesFromHTML(html),
    status: res.status,
    // Reverse intelligence
    related_searches: extractRelatedSearches(html),
    category_listings: extractCategoryListings(html),
    product_rank: extractProductRank(html, query),
    // Cross-sell intelligence
    cross_sell_products: extractCrossSellProducts(html),
    promotional_products: extractPromotionalProducts(html),
    // Market intelligence
    price_data: extractPriceData(html),
    popularity: extractPopularitySignals(html),
    variant_sizes: extractVariantSizes(html),
    search_volume: extractSearchVolume(html),
    filter_values: extractFilterRanges(html),
    seasonal_tags: extractSeasonalTags(html),
  }
}

async function getProductPage(slug, platform) {
  const urls = {
    blinkit: `https://blinkit.com/${slug}`,
    jiomart: `https://www.jiomart.com/p/${slug}`,
  }
  const res = await get(urls[platform], { "User-Agent": "Mozilla/5.0", Accept: "text/html" })
  if (!res.ok) return { breadcrumb: [], tags: [], titles: [], error: res.status }

  return {
    breadcrumb: extractBreadcrumb(res.text),
    tags: extractProductTags(res.text),
    titles: extractTitlesFromHTML(res.text),
    jsonld: extractJsonLdProduct(res.text),
    status: res.status,
  }
}

// ── Query cleaner: strip brand + weight for better matching ──

const KNOWN_BRANDS = [
  "Natco", "TRS", "East End", "Heera", "Swad", "KTC", "Amul", "MDH",
  "Everest", "Shan", "MTR", "Aachi", "Haldiram", "Haldiram's", "Jabsons",
  "Lijjat", "Priya", "Mother's Recipe", "Nilon's", "Bedekar", "Patak's",
  "Parle", "Britannia", "Maggi", "Nestle", "Cadbury", "PepsiCo",
  "Wagh Bakri", "Brooke Bond", "Tetley", "Taj Mahal", "Tata",
  "Aashirvaad", "Pillsbury", "Elephant", "India Gate", "Daawat",
  "Tilda", "Kohinoor", "Lal Qilla", "Falak", "Double Horse",
  "Laxmi", "Shakti Bhog", "24 Mantra", "Bru", "Nescafe",
  "Rooh Afza", "Maaza", "Nimbooz", "Yippee", "Top Ramen",
]

const WEIGHT_PATTERN = /\s+\d+\.?\d*\s*(g|kg|ml|l|litre|litres|grams|kilos?)\b/gi

function cleanQuery(title) {
  let q = title
  // Strip known brands
  for (const brand of KNOWN_BRANDS) {
    const regex = new RegExp(`\\b${brand.replace(/['.]/g, "['.]?")}\\b`, "gi")
    q = q.replace(regex, "").trim()
  }
  // Strip weight/size
  q = q.replace(WEIGHT_PATTERN, "").trim()
  // Strip common suffixes
  q = q.replace(/\s*\(.*?\)\s*/g, " ").trim()
  // Remove "Full Case", "Jar", etc. noise words
  q = q.replace(/\bFull Case\b/gi, "").trim()
  q = q.replace(/\bBoiled\b/gi, "").trim()
  // Collapse spaces
  q = q.replace(/\s+/g, " ").trim()
  return q || title
}

// ── Main Flow ──

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes("--dry-run")
  const limitArg = args.find((a) => a.startsWith("--limit="))
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : 999

  console.log("Search Intelligence Scraper\n")
  if (dryRun) console.log("[DRY RUN — no requests will be made]\n")

  // 1. Get our product catalog from store API
  console.log("Fetching product catalog from IndiaGrocers...")
  const regRaw = await get(`http://localhost:9000/store/regions`, { "x-publishable-api-key": PK })
  const regionId = JSON.parse(regRaw.text).regions[0].id

  const all = []
  let offset = 0
  while (true) {
    const { text } = await get(
      `http://localhost:9000/store/products?limit=100&offset=${offset}&region_id=${regionId}&fields=id,title,handle,categories.handle`,
      { "x-publishable-api-key": PK }
    )
    const { products } = JSON.parse(text)
    all.push(...(products || []))
    if ((products || []).length < 100) break
    offset += 100
  }
  console.log(`  ${all.length} products\n`)

  // 2. Process each product
  let processed = 0
  const toProcess = all.slice(0, limit)

  for (const product of toProcess) {
    const category = product.categories?.[0]?.handle || "uncategorized"
    const outFile = `${OUT_DIR}/${category}/${product.handle}.json`

    // Skip if already extracted
    if (fs.existsSync(outFile)) {
      processed++
      continue
    }

    console.log(`[${processed + 1}/${toProcess.length}] ${product.title}`)
    const query = cleanQuery(product.title)
    console.log(`  Searching: "${query}"`)

    if (dryRun) { processed++; console.log(""); continue }

    // Search both platforms
    const blinkit = await searchPlatform(query, "blinkit")
    await sleep(rand(DELAY_MIN, DELAY_MAX))

    const jiomart = await searchPlatform(query, "jiomart")
    await sleep(rand(DELAY_MIN, DELAY_MAX))

    // Build intelligence report
    const ourCategory = product.categories?.[0]?.handle || "uncategorized"

    const intelligence = {
      cross_category: {
        our_category: ourCategory,
        blinkit_category_path: blinkit.breadcrumb || [],
        jiomart_category_path: jiomart.breadcrumb || [],
        insight: "",
      },
      alternate_names: {
        our_spelling: product.title,
        blinkit_names: blinkit.titles,
        jiomart_names: jiomart.titles,
        autocomplete_suggestions: [...(blinkit.suggestions || []), ...(jiomart.suggestions || [])],
      },
      competitor_ranking: {
        top_blinkit: blinkit.competitor_titles || [],
        top_jiomart: jiomart.competitor_titles || [],
      },
      tags_from_platforms: {
        blinkit_tags: blinkit.tags || [],
        jiomart_tags: jiomart.tags || [],
      },
      search_patterns: {
        cleaned_query_used: query,
        autocomplete_terms: [...(blinkit.suggestions || []), ...(jiomart.suggestions || [])],
      },
      // Reverse intelligence — what OTHER searches/categories show this product
      reverse_intelligence: {
        blinkit_rank: blinkit.product_rank,
        jiomart_rank: jiomart.product_rank,
        blinkit_related_searches: blinkit.related_searches || [],
        jiomart_related_searches: jiomart.related_searches || [],
        blinkit_category_listings: blinkit.category_listings || [],
        jiomart_category_listings: jiomart.category_listings || [],
      },
      // Cross-sell intelligence
      cross_sell: {
        blinkit_fbt: blinkit.cross_sell_products || [],
        jiomart_fbt: jiomart.cross_sell_products || [],
        blinkit_promoted: blinkit.promotional_products || [],
        jiomart_promoted: jiomart.promotional_products || [],
      },
      // Market intelligence
      market: {
        blinkit_pricing: blinkit.price_data || {},
        jiomart_pricing: jiomart.price_data || {},
        blinkit_popularity: blinkit.popularity || {},
        jiomart_popularity: jiomart.popularity || {},
        variant_sizes: [...new Set([...(blinkit.variant_sizes || []), ...(jiomart.variant_sizes || [])])],
        blinkit_search_volume: blinkit.search_volume,
        jiomart_search_volume: jiomart.search_volume,
        blinkit_filters: blinkit.filter_values || {},
        jiomart_filters: jiomart.filter_values || {},
        seasonal_tags: [...new Set([...(blinkit.seasonal_tags || []), ...(jiomart.seasonal_tags || [])])],
      },
    }

    // Write
    const data = {
      our_handle: product.handle,
      our_title: product.title,
      cleaned_query: query,
      source: "blinkit+jiomart",
      extracted_at: new Date().toISOString(),
      intelligence,
    }

    // Write
    fs.mkdirSync(`${OUT_DIR}/${category}`, { recursive: true })
    fs.writeFileSync(outFile, JSON.stringify(data, null, 2))
    processed++

    console.log(`  → ${blinkit.suggestions.length} BlinkIt suggestions, ${jiomart.suggestions.length} JioMart`)
    await sleep(rand(DELAY_MIN, DELAY_MAX))
  }

  console.log(`\nDone: ${processed} products processed`)
}

main().catch((e) => { console.error(e.message); process.exit(1) })
