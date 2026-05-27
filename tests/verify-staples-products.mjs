/**
 * Product Data Verification — Staples & Grains
 *
 * Compares API data vs storefront-rendered data for a category page.
 */
import http from "http"

const CATEGORY = "staples-grains"
const CAT_ID = "pcat_01KRMC55Q8917D3QJKT26SRG8F"

function get(path, host = "localhost", port = 8000, extraHeaders = {}) {
  return new Promise((resolve) => {
    const headers = { Cookie: "_medusa_cache_id=test", ...extraHeaders }
    http.get({ hostname: host, port, path, headers }, (res) => {
      let d = ""
      res.on("data", (c) => (d += c))
      res.on("end", () => resolve(d))
    })
  })
}

async function main() {
  // 1. Get storefront-rendered page
  console.log(`Fetching storefront /${CATEGORY}...`)
  const html = await get(`/gb/categories/${CATEGORY}`)
  console.log(`  ${html.length} bytes`)

  // 2. Get API data
  const pk = "pk_72deb296139d27885561a0fa58b77cbed187d8c5912390c2dc1912cb477083d3"
  const regionsRaw = await get("/store/regions", "localhost", 9000, { "x-publishable-api-key": pk })
  const regionId = JSON.parse(regionsRaw).regions[0].id

  const apiRaw = await get(`/store/products?limit=200&category_id=${CAT_ID}&region_id=${regionId}&fields=title`, "localhost", 9000, { "x-publishable-api-key": pk })
  const apiProducts = JSON.parse(apiRaw).products || []

  // 3. Extract product titles from HTML
  const storefrontTitles = new Set()
  const regex = /Natco[^<]+/g
  let m
  while ((m = regex.exec(html)) !== null) {
    storefrontTitles.add(m[0].trim())
  }

  // Extract any other brand titles too (match patterns like "Brand Name Product")
  const brandRegex = /(\b[A-Z][a-z]+ (?:&amp; )?[A-Z][a-z]+\b[^<]{5,60})/g
  while ((m = brandRegex.exec(html)) !== null) {
    const t = m[1].replace(/&amp;/g, "&").trim()
    if (t.length > 10 && t.length < 100) storefrontTitles.add(t)
  }

  // 4. Compare
  const apiTitleSet = new Set(apiProducts.map((p) => p.title))
  const apiTitles = apiProducts.map((p) => p.title)

  console.log(`\nAPI returns: ${apiTitles.length} products`)
  console.log(`Storefront renders: ${storefrontTitles.size} product names\n`)

  // Print API products
  console.log("=== API Products ===")
  apiTitles.forEach((t, i) => console.log(`  ${(i + 1).toString().padStart(3)}. ${t}`))

  // Compare
  let matched = 0
  const onlyStorefront = []
  for (const t of storefrontTitles) {
    if (apiTitleSet.has(t)) {
      matched++
    } else {
      onlyStorefront.push(t)
    }
  }
  const onlyApi = apiTitles.filter((t) => !storefrontTitles.has(t))

  console.log(`\n=== Match: ${matched} of ${storefrontTitles.size} storefront titles found in API ===`)
  if (onlyStorefront.length > 0) {
    console.log(`\nOn storefront but NOT in API (${onlyStorefront.length}):`)
    onlyStorefront.slice(0, 10).forEach((t) => console.log(`  ${t}`))
  }
  if (onlyApi.length > 0) {
    console.log(`\nIn API but NOT on storefront (${onlyApi.length}):`)
    onlyApi.slice(0, 10).forEach((t) => console.log(`  ${t}`))
  }

  // 5. Basic checks
  console.log(`\n=== Checks ===`)
  console.log(apiTitles.length >= 10 ? "PASS" : "FAIL", `: >= 10 products in API`)
  console.log(storefrontTitles.size >= 5 ? "PASS" : "FAIL", `: >= 5 products rendered on storefront`)
  console.log(matched >= 3 ? "PASS" : "FAIL", `: >= 3 products match between API and storefront`)
}

main().catch((e) => console.error(e.message))
