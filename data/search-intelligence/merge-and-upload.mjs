/**
 * Merge Scraped Data → Build Dictionaries → Upload to MeiliSearch
 *
 * Reads all per-product JSON files from data/search-intelligence/per-category/
 * Extracts synonyms, regional terms, search patterns
 * Uploads expanded synonyms to MeiliSearch index
 *
 * Run: node data/search-intelligence/merge-and-upload.mjs
 */

import fs from "fs"
import path from "path"

const PER_CATEGORY_DIR = "data/search-intelligence/per-category"
const REGIONAL_TERMS = JSON.parse(fs.readFileSync("data/search-intelligence/regional-terms.json", "utf-8"))
const BRAND_ALIASES = JSON.parse(fs.readFileSync("data/search-intelligence/brand-aliases.json", "utf-8"))

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || "http://localhost:7700"

// ── Collect all synonyms ──

function collectAllSynonyms() {
  const allSyns = new Set()
  const perProduct = {}

  function walk(dir) {
    if (!fs.existsSync(dir)) return
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file)
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath)
      } else if (file.endsWith(".json")) {
        try {
          const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"))
          const handle = data.our_handle
          if (!handle) return

          const syns = new Set()

          // From autocomplete suggestions
          const intel = data.intelligence || {}
          const altNames = intel.alternate_names || {}
          const patterns = intel.search_patterns || {}
          const competitors = intel.competitor_ranking || {}

          if (altNames.blinkit_names) altNames.blinkit_names.forEach((s) => syns.add(s.toLowerCase()))
          if (altNames.jiomart_names) altNames.jiomart_names.forEach((s) => syns.add(s.toLowerCase()))
          if (altNames.autocomplete_suggestions) altNames.autocomplete_suggestions.forEach((s) => syns.add(s.toLowerCase()))
          if (patterns.autocomplete_terms) patterns.autocomplete_terms.forEach((s) => syns.add(s.toLowerCase()))
          if (competitors.top_blinkit) competitors.top_blinkit.forEach((s) => syns.add(s.toLowerCase()))
          if (competitors.top_jiomart) competitors.top_jiomart.forEach((s) => syns.add(s.toLowerCase()))

          perProduct[handle] = [...syns]
          syns.forEach((s) => allSyns.add(s))
        } catch {}
      }
    }
  }

  walk(PER_CATEGORY_DIR)
  return { allSynonyms: [...allSyns], perProduct }
}

// ── Collect cross-category intelligence ──

function collectCrossCategoryData() {
  const mapping = {}
  const competitorData = {}
  const tagData = {}

  function walk(dir) {
    if (!fs.existsSync(dir)) return
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file)
      if (fs.statSync(fullPath).isDirectory()) { walk(fullPath); continue }
      if (!file.endsWith(".json")) continue
      try {
        const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"))
        const intel = data.intelligence || {}
        const handle = data.our_handle

        // Cross-category mapping
        if (intel.cross_category) {
          mapping[handle] = intel.cross_category
        }
        // Competitor data
        if (intel.competitor_ranking) {
          competitorData[handle] = intel.competitor_ranking
        }
        // Platform tags
        if (intel.tags_from_platforms) {
          tagData[handle] = intel.tags_from_platforms
        }
      } catch {}
    }
  }

  walk(PER_CATEGORY_DIR)
  return { crossCategory: mapping, competitors: competitorData, tags: tagData }
}

// ── Collect cross-sell intelligence ──

function collectCrossSellData() {
  const fbt = {}
  const promoted = {}
  const related = {}

  function walk(dir) {
    if (!fs.existsSync(dir)) return
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file)
      if (fs.statSync(fullPath).isDirectory()) { walk(fullPath); continue }
      if (!file.endsWith(".json")) continue
      try {
        const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"))
        const intel = data.intelligence || {}
        const handle = data.our_handle

        if (intel.cross_sell) {
          fbt[handle] = intel.cross_sell.blinkit_fbt || []
          promoted[handle] = intel.cross_sell.blinkit_promoted || []
        }
        if (intel.reverse_intelligence) {
          related[handle] = [
            ...(intel.reverse_intelligence.blinkit_related_searches || []),
            ...(intel.reverse_intelligence.jiomart_related_searches || []),
          ]
        }
      } catch {}
    }
  }

  walk(PER_CATEGORY_DIR)
  return { fbt, promoted, relatedSearches: related }
}

// ── Collect market intelligence ──

function collectMarketData() {
  const pricing = {}
  const popularity = {}
  const variants = {}
  const searchVolume = {}
  const seasonal = {}

  function walk(dir) {
    if (!fs.existsSync(dir)) return
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file)
      if (fs.statSync(fullPath).isDirectory()) { walk(fullPath); continue }
      if (!file.endsWith(".json")) continue
      try {
        const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"))
        const intel = data.intelligence || {}
        const handle = data.our_handle
        const market = intel.market || {}

        if (Object.keys(market.blinkit_pricing || {}).length > 0 || Object.keys(market.jiomart_pricing || {}).length > 0) {
          pricing[handle] = { blinkit: market.blinkit_pricing, jiomart: market.jiomart_pricing }
        }
        if (market.blinkit_popularity || market.jiomart_popularity) {
          popularity[handle] = { blinkit: market.blinkit_popularity, jiomart: market.jiomart_popularity }
        }
        if (market.variant_sizes && market.variant_sizes.length > 0) variants[handle] = market.variant_sizes
        if (market.blinkit_search_volume || market.jiomart_search_volume) {
          searchVolume[handle] = { blinkit: market.blinkit_search_volume, jiomart: market.jiomart_search_volume }
        }
        if (market.seasonal_tags && market.seasonal_tags.length > 0) seasonal[handle] = market.seasonal_tags
      } catch {}
    }
  }

  walk(PER_CATEGORY_DIR)
  return { pricing, popularity, variants, searchVolume, seasonal }
}

// ── Build MeiliSearch synonym pairs ──

function buildMeiliSearchSynonyms(allSynonyms) {
  const pairs = {}

  // 1. From regional-terms.json
  const langs = REGIONAL_TERMS.languages || {}
  for (const [, terms] of Object.entries(langs)) {
    for (const [regional, english] of Object.entries(terms)) {
      const key = english.toLowerCase()
      if (!pairs[key]) pairs[key] = new Set()
      pairs[key].add(regional.toLowerCase())
      // Bidirectional
      const rk = regional.toLowerCase()
      if (!pairs[rk]) pairs[rk] = new Set()
      pairs[rk].add(english.toLowerCase())
    }
  }

  // 2. From brand-aliases
  const brands = BRAND_ALIASES.brands || {}
  for (const [, brand] of Object.entries(brands)) {
    const main = brand.name.toLowerCase()
    for (const v of (brand.variants || [])) {
      if (!pairs[main]) pairs[main] = new Set()
      pairs[main].add(v.toLowerCase())
      if (!pairs[v.toLowerCase()]) pairs[v.toLowerCase()] = new Set()
      pairs[v.toLowerCase()].add(main)
    }
  }

  // 3. From scraped data
  for (const syn of allSynonyms) {
    if (syn.length < 3) continue
    // Clean: remove stop words, special chars
    const clean = syn.replace(/[^a-z0-9\s]/g, "").trim()
    if (clean.length < 3) continue
  }

  // Convert Sets to arrays
  const result = {}
  for (const [key, val] of Object.entries(pairs)) {
    result[key] = [...val]
  }
  return result
}

// ── Upload to MeiliSearch ──

async function uploadToMeiliSearch(synonyms) {
  const headers = { "Content-Type": "application/json" }

  console.log(`Uploading ${Object.keys(synonyms).length} synonym pairs to MeiliSearch...`)

  try {
    const res = await fetch(`${MEILISEARCH_HOST}/indexes/products/settings/synonyms`, {
      method: "PUT",
      headers,
      body: JSON.stringify(synonyms),
    })

    if (res.ok) {
      console.log("  ✅ Synonyms uploaded successfully")
      return true
    } else {
      console.log(`  ❌ Failed: ${res.status} ${await res.text().catch(() => "")}`)
      return false
    }
  } catch (e) {
    console.log(`  ❌ MeiliSearch not reachable: ${e.message}`)
    return false
  }
}

// ── Main ──

async function main() {
  console.log("Merge & Upload — Search Intelligence\n")

  // 1. Collect all synonyms from scraped data
  console.log("Collecting synonyms from scraped data...")
  const { allSynonyms, perProduct } = collectAllSynonyms()
  console.log(`  ${allSynonyms.length} unique synonyms from scraped data`)
  console.log(`  ${Object.keys(perProduct).length} products with extracted data\n`)

  // 2. Build MeiliSearch synonym pairs
  console.log("Building MeiliSearch synonym dictionary...")
  const synonyms = buildMeiliSearchSynonyms(allSynonyms)
  console.log(`  ${Object.keys(synonyms).length} synonym pairs (regional terms + brands)\n`)

  // 3. Show sample
  console.log("Sample synonyms:")
  const keys = Object.keys(synonyms).slice(0, 5)
  for (const k of keys) {
    console.log(`  ${k} → ${synonyms[k].slice(0, 3).join(", ")}`)
  }

  // 4. Collect cross-category intelligence
  console.log("\nCollecting cross-category intelligence...")
  const { crossCategory, competitors, tags } = collectCrossCategoryData()
  fs.writeFileSync("data/search-intelligence/cross-category.json", JSON.stringify(crossCategory, null, 2))
  fs.writeFileSync("data/search-intelligence/competitor-data.json", JSON.stringify(competitors, null, 2))
  fs.writeFileSync("data/search-intelligence/platform-tags.json", JSON.stringify(tags, null, 2))
  console.log(`  Cross-category: ${Object.keys(crossCategory).length} products`)
  console.log(`  Competitor data: ${Object.keys(competitors).length} products`)
  console.log(`  Platform tags: ${Object.keys(tags).length} products`)

  // 5. Collect cross-sell intelligence
  console.log("\nCollecting cross-sell intelligence...")
  const crossSell = collectCrossSellData()
  fs.writeFileSync("data/search-intelligence/cross-sell-fbt.json", JSON.stringify(crossSell.fbt, null, 2))
  fs.writeFileSync("data/search-intelligence/cross-sell-promoted.json", JSON.stringify(crossSell.promoted, null, 2))
  fs.writeFileSync("data/search-intelligence/related-searches.json", JSON.stringify(crossSell.relatedSearches, null, 2))
  console.log(`  FBT products: ${Object.keys(crossSell.fbt).length} products`)
  console.log(`  Promoted: ${Object.keys(crossSell.promoted).length} products`)
  console.log(`  Related searches: ${Object.keys(crossSell.relatedSearches).length} products`)

  // 6. Collect market intelligence
  console.log("\nCollecting market intelligence...")
  const market = collectMarketData()
  fs.writeFileSync("data/search-intelligence/market-pricing.json", JSON.stringify(market.pricing, null, 2))
  fs.writeFileSync("data/search-intelligence/market-popularity.json", JSON.stringify(market.popularity, null, 2))
  fs.writeFileSync("data/search-intelligence/market-variants.json", JSON.stringify(market.variants, null, 2))
  fs.writeFileSync("data/search-intelligence/market-volume.json", JSON.stringify(market.searchVolume, null, 2))
  fs.writeFileSync("data/search-intelligence/market-seasonal.json", JSON.stringify(market.seasonal, null, 2))
  console.log(`  Pricing data: ${Object.keys(market.pricing).length} products`)
  console.log(`  Popularity: ${Object.keys(market.popularity).length} products`)
  console.log(`  Variant sizes: ${Object.keys(market.variants).length} products`)
  console.log(`  Search volume: ${Object.keys(market.searchVolume).length} products`)
  console.log(`  Seasonal: ${Object.keys(market.seasonal).length} products`)

  // 4. Save to file
  const outputFile = "data/search-intelligence/synonyms-generated.json"
  fs.writeFileSync(outputFile, JSON.stringify(synonyms, null, 2))
  console.log(`\nSaved to ${outputFile}`)

  // 5. Upload to MeiliSearch
  console.log()
  await uploadToMeiliSearch(synonyms)

  // 6. Per-product synonyms — save for metadata enrichment
  const perProdFile = "data/search-intelligence/per-product-synonyms.json"
  fs.writeFileSync(perProdFile, JSON.stringify(perProduct, null, 2))
  console.log(`Per-product synonyms saved to ${perProdFile}`)
  console.log(`\nDone. ${Object.keys(synonyms).length} synonym pairs, ${Object.keys(perProduct).length} products enriched.`)
}

main().catch((e) => { console.error(e.message); process.exit(1) })
