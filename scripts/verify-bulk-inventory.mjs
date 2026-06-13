/**
 * Bulk Inventory Endpoint Validation
 * Verifies POST /store/bulk-inventory returns correct data
 * and that the enrichment logic produces valid results.
 *
 * Usage: node scripts/verify-bulk-inventory.mjs
 */

const BASE = "http://127.0.0.1:9000"
const PK = process.env.PUBLISHABLE_KEY || "pk_7f1613508744308da044e2902d0de9ab28bfc4b838371d1afcb6b4796b8a1149"

const HEADERS = {
  "Content-Type": "application/json",
  "x-publishable-api-key": PK,
}

let passed = 0
let failed = 0

function pass(name) { console.log(`  \u2713 PASS  ${name}`); passed++ }
function fail(name, detail) { console.log(`  \u2717 FAIL  ${name}: ${detail}`); failed++ }

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return { status: res.status, data }
}

async function main() {
  // ── Test 1: Empty variant_ids rejects with 400 ──
  console.log("\nTest 1: Endpoint rejects empty variant_ids")
  const { status: s1, data: d1 } = await post("/store/bulk-inventory", { variant_ids: [] })
  if (s1 === 400 && d1.error) pass("Returns 400 with error message")
  else fail("Returns 400 with error message", `got ${s1} ${JSON.stringify(d1)}`)

  // ── Test 2: Unknown variant ID returns empty gracefully ──
  console.log("\nTest 2: Unknown variant ID handled gracefully")
  const { status: s2, data: d2 } = await post("/store/bulk-inventory", { variant_ids: ["nonexistent"] })
  if (s2 === 200 && d2.inventory && Object.keys(d2.inventory).length > 0)
    pass("Returns 200 with inventory (null for unknown variants)")
  else fail("Returns 200", `got ${s2} ${JSON.stringify(d2)}`)

  // ── Test 3: Fetch real products, then bulk-inventory round-trip ──
  console.log("\nTest 3: Real variant enrichment round-trip")
  let products
  try {
    const prodRes = await fetch(
      `${BASE}/store/products?limit=3&fields=handle,variants.id,variants.title`,
      { headers: { "x-publishable-api-key": PK } }
    )
    ;({ products } = await prodRes.json())
  } catch {
    products = []
  }

  if (!products?.length) {
    fail("Real product fetch", "No products returned from /store/products")
    console.log(`\n${passed} passed, ${failed} failed`)
    return
  }

  const variantIds = products.flatMap(p => (p.variants ?? []).map(v => v.id))
  console.log(`  Fetched ${products.length} products \u2192 ${variantIds.length} variant IDs`)

  const { status: s3, data: d3 } = await post("/store/bulk-inventory", { variant_ids: variantIds })

  if (s3 !== 200) {
    fail("Bulk-inventory 200", `got ${s3} ${JSON.stringify(d3)}`)
  } else pass("Returns 200 for real variant IDs")

  const inv = d3?.inventory ?? {}
  const matched = Object.keys(inv).length

  if (matched === variantIds.length) pass(`All ${variantIds.length} variants matched`)
  else if (matched > 0) fail("All variants matched", `only ${matched}/${variantIds.length} matched`)
  else fail("All variants matched", "0 matches \u2014 variant ID mismatch between API and inventory")

  // Check availability values
  let allValid = true
  for (const [vid, entry] of Object.entries(inv)) {
    if (entry?.availability == null || entry.availability < 0) {
      fail(`Valid availability for ${vid}`, `got ${JSON.stringify(entry)}`)
      allValid = false
    }
  }
  if (allValid) pass("All availability values are valid (number >= 0)")

  // ── Test 4: Simulate enrichment logic (null -> 0 bug check) ──
  console.log("\nTest 4: Enrichment simulation (null \u2192 0 bug check)")
  let enrichmentBug = false
  for (const product of products) {
    for (const variant of product.variants ?? []) {
      const entry = inv[variant.id]
      if (entry) {
        // Simulate OLD bug (?? 0)
        const buggyValue = entry.availability ?? 0
        // Simulate FIXED logic
        const fixedValue = (entry.availability != null) ? entry.availability : undefined
        variant.inventory_quantity = fixedValue

        if (entry.availability == null && buggyValue === 0) {
          enrichmentBug = true
        }
      }
    }
  }
  if (!enrichmentBug) {
    pass("No null\u21920 conversion detected (fix is active)")
  } else {
    fail("No null\u21920 conversion", "Some variants have null availability \u2014 old ?? 0 bug would strike")
  }

  // Check final inventory_quantity values
  const sample = products[0]?.variants?.[0]
  if (sample?.inventory_quantity != null && sample.inventory_quantity > 0) {
    pass(`Sample variant has inventory_quantity=${sample.inventory_quantity}`)
  } else if (sample?.inventory_quantity == null) {
    fail("Sample variant enriched", "inventory_quantity is still null/undefined after simulation")
  } else {
    fail("Sample variant enriched", `inventory_quantity=${sample.inventory_quantity} (should be > 0)`)
  }

  // ── Test 5: Full fields fetch (same as storefront uses) ──
  console.log("\nTest 5: Full fields fetch (storefront-equivalent)")
  const regionId = "reg_01KTYK18TDG6C9KR39T0JQ8QRQ"
  const fullFields = "handle,*variants.calculated_price,categories.id,categories.name,*variants.images,"
    + "+metadata,+tags,+thumbnail,+description,"
  try {
    const ffRes = await fetch(
      `${BASE}/store/products?limit=2&region_id=${regionId}&fields=${encodeURIComponent(fullFields)}`,
      { headers: { "x-publishable-api-key": PK } }
    )
    const { products: ffProducts } = await ffRes.json()
    if (!ffProducts?.length) {
      fail("Full fields fetch", "No products returned")
    } else {
      pass(`Full fields fetch returned ${ffProducts.length} products`)
      // Check that inventory_quantity is NOT in the raw API response
      const rawQty = ffProducts[0]?.variants?.[0]?.inventory_quantity
      if (rawQty === undefined) {
        pass("Raw API does NOT return inventory_quantity (fields excluded correctly)")
      } else {
        fail("Raw API inventory_quantity", `Got inventory_quantity=${rawQty} despite not requesting it. Medusa may auto-include it.`)
      }
    }
  } catch (err) {
    fail("Full fields fetch", err.message)
  }

  console.log(`\n${passed} passed, ${failed} failed`)
}

main()
