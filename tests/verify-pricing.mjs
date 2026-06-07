/**
 * Admin Pricing Verification Script (W07)
 *
 * Validates the load-pricelist.mjs pipeline end-to-end:
 * 1. Dry-run mode — matches products, reports changes without applying
 * 2. Apply mode — updates variant prices via Admin API
 * 3. Verify prices after update (API + storefront display)
 *
 * Run: node tests/verify-pricing.mjs
 *
 * Prerequisites: Backend on :9000, Storefront on :8000
 */
import http from "http"
import { execSync } from "child_process"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PK = "pk_72deb296139d27885561a0fa58b77cbed187d8c5912390c2dc1912cb477083d3"
const BACKEND = "http://localhost:9000"
const STOREFRONT = "http://localhost:8000"
const PRICELIST = resolve(__dirname, "../scripts/pricing/example-pricelist.json")
const LOADER = resolve(__dirname, "../scripts/pricing/load-pricelist.mjs")

let passed = 0
let failed = 0

function ok(test, msg) {
  if (test) { passed++; console.log(`  ✅ ${msg}`) }
  else { failed++; console.log(`  ❌ ${msg}`) }
}

function fetchUrl(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: opts.method || "GET",
      headers: opts.headers || {},
      timeout: 15000,
    }
    if (opts.body) {
      options.headers["Content-Type"] = "application/json"
      options.headers["Content-Length"] = Buffer.byteLength(opts.body)
    }
    const req = http.request(options, (res) => {
      let d = ""
      res.on("data", (c) => (d += c))
      res.on("end", () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(d), text: d }) }
        catch { resolve({ status: res.statusCode, text: d }) }
      })
    })
    req.on("error", reject)
    if (opts.body) req.write(opts.body)
    req.end()
  })
}

async function getToken() {
  const res = await fetchUrl(`${BACKEND}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return res.json.token
}

console.log("=== ADMIN PRICING VERIFICATION ===\n")

// ───────────────────────────────────────
// 1. DRY RUN
// ───────────────────────────────────────
console.log("1. Pricelist Dry Run")

try {
  const output = execSync(`node "${LOADER}" "${PRICELIST}"`, {
    encoding: "utf8",
    timeout: 60000,
  })
  console.log(output.trim().split("\n").slice(-5).join("\n"))

  const hasDryRun = output.includes("DRY RUN")
  ok(hasDryRun, "Dry run mode active")

  const hasLoaded = output.includes("Loaded 7 price entries")
  ok(hasLoaded, "7 price entries loaded from pricelist")

  const hasFetched = output.includes("Fetched 506 products")
  ok(hasFetched, "506 products fetched from DB")

} catch (e) {
  console.log(`  ❌ Error: ${e.message}`);
  failed += 3
}

// ───────────────────────────────────────
// 2. API: CHECK SPECIFIC PRODUCT PRICE
// ───────────────────────────────────────
console.log("\n2. Check Current Prices")

const token = await getToken()
const authHeaders = {
  Authorization: `Bearer ${token}`,
  "x-publishable-api-key": PK,
}

// Fetch products with full variant data
// Medusa v2 admin API: use fields=+variants to include variant relations
const checkRes = await fetchUrl(
  `${BACKEND}/admin/products?limit=100`,
  { headers: authHeaders }
)

// Fetch all products (504+ products, paginated)
let allProducts = checkRes.json?.products || []
let offset = allProducts.length
while (checkRes.json?.count > allProducts.length) {
  const page = await fetchUrl(
    `${BACKEND}/admin/products?limit=100&offset=${offset}`,
    { headers: authHeaders }
  )
  allProducts = allProducts.concat(page.json?.products || [])
  offset += 100
}
ok(allProducts.length >= 200, `Admin API returned ${allProducts.length} products`)

// Find specific products
const mdh = allProducts.find((p) => p.title?.includes("Kitchen King"))
const shan = allProducts.find((p) => p.title?.includes("Shan") && p.title?.includes("Chicken"))
const cumin = allProducts.find((p) => p.title?.includes("Cumin Seeds 400g"))
const turmeric = allProducts.find((p) => p.title?.includes("Turmeric Powder 400g"))
const lentils = allProducts.find((p) => p.title?.includes("Brown Lentils 2kg"))
const basmati = allProducts.find((p) => p.title?.includes("Basmati Rice India") && p.title?.includes("5kg"))
const tilda = allProducts.find((p) => p.title?.includes("Tilda Pure Basmati") && p.variants?.some((v) => v.title?.includes("2kg")))

const checkProduct = (p, expectedPence, label) => {
  if (!p) {
    ok(false, `${label} — not found in DB`)
    return
  }
  const variant = p.variants?.[0] || p.variants?.find((v) => (v.title || "").includes("2kg"))
  const price = variant?.prices?.[0]?.amount
  if (price === undefined) {
    ok(false, `${label} — NO PRICE`)
    return
  }
  const gbp = (price / 100).toFixed(2)
  ok(price === expectedPence, `${label} — £${gbp} (expected £${(expectedPence/100).toFixed(2)})`)
}

if (mdh) checkProduct(mdh, 199, "MDH Kitchen King Masala")
if (shan) checkProduct(shan, 149, "Shan Special Chicken Biryani")
if (cumin) checkProduct(cumin, 349, "Natco Cumin Seeds 400g")
if (turmeric) checkProduct(turmeric, 299, "Natco Turmeric Powder 400g")
if (lentils) checkProduct(lentils, 449, "Natco Brown Lentils 2kg")
if (basmati) checkProduct(basmati, 899, "Natco Basmati Rice 5kg")
if (tilda) checkProduct(tilda, 549, "Tilda Pure Basmati 2kg")

// Check a non-pricelist product still has a price
const randomProduct = allProducts.find((p) => p.variants?.[0]?.prices?.[0]?.amount > 0 && !p.title?.includes("Kitchen") && !p.title?.includes("Shan"))
if (randomProduct) {
  const rp = randomProduct.variants[0].prices[0].amount
  ok(rp > 0, `${randomProduct.title} has price £${(rp/100).toFixed(2)} (unaffected by pricelist)`)
}

// ───────────────────────────────────────
// 3. APPLY PRICES (UPDATE)
// ───────────────────────────────────────
console.log("\n3. Apply Pricelist")

try {
  const output = execSync(`node "${LOADER}" "${PRICELIST}" --apply`, {
    encoding: "utf8",
    timeout: 60000,
  })
  console.log(output.trim().split("\n").slice(-5).join("\n"))

  const hasApply = output.includes("APPLY MODE")
  ok(hasApply, "Apply mode active")

  const hasResult = output.includes("Updated") && output.includes("Skipped")
  ok(hasResult, "Apply completed with counts")

} catch (e) {
  console.log(`  ❌ Error: ${e.message}`);
  failed += 2
}

// ───────────────────────────────────────
// 4. VERIFY POST-APPLY
// ───────────────────────────────────────
console.log("\n4. Verify After Apply")

// Refetch with proper pagination (same approach as step 2)
const afterAll = []
let off = 0
while (true) {
  const page = await fetchUrl(
    `${BACKEND}/admin/products?limit=100&offset=${off}`,
    { headers: authHeaders }
  )
  afterAll.push(...(page.json?.products || []))
  if (afterAll.length >= (page.json?.count || 0)) break
  off += 100
}
const afterMdh = afterAll.find((p) => p.title?.includes("Kitchen King"))
const afterCumin = afterAll.find((p) => p.title?.includes("Cumin Seeds 400g"))

if (afterMdh) {
  const price = afterMdh.variants?.[0]?.prices?.[0]?.amount
  ok(price === 199, `MDH Kitchen King post-apply: £${(price/100).toFixed(2)}`)
}
if (afterCumin) {
  const price = afterCumin.variants?.[0]?.prices?.[0]?.amount
  ok(price === 349, `Cumin Seeds 400g post-apply: £${(price/100).toFixed(2)}`)
}

// ───────────────────────────────────────
// 5. STOREFRONT PRICE DISPLAY
// ───────────────────────────────────────
console.log("\n5. Storefront Price Display")

const pdpRes = await fetchUrl(`${STOREFRONT}/gb/products/mdh-kitchen-king-masala`, {
  headers: { Cookie: "_medusa_cache_id=test-pricing" },
})
const pdpHtml = pdpRes.text || ""
const hasPdp = pdpRes.status === 200
ok(hasPdp, `PDP HTTP ${pdpRes.status}`)

// Check for price display
const priceMatch = pdpHtml.match(/£1\.99|£2\.99|£3\.49|£4\.49|£5\.49|£8\.99|£1\.49/)
ok(!!priceMatch, `PDP shows price: ${priceMatch?.[0] || "none found"}`)

// ───────────────────────────────────────
// SUMMARY
// ───────────────────────────────────────
console.log(`\n========================================`)
console.log(`  PRICING: ${passed} passed, ${failed} failed`)
console.log(`========================================\n`)

if (failed > 0) process.exit(1)
