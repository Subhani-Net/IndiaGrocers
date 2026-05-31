/**
 * Data Quality Verification Script
 * Run after ANY data operation to confirm MeiliSearch state is correct.
 *
 * Usage: node scripts/verify-data-health.mjs
 */

const BASE = "http://127.0.0.1:9000"
const MEILI = "http://localhost:7700"

// Expected Natco category handles (no old ones should appear)
const VALID_HANDLES = new Set([
  "spices-herbs", "spice-herb-jars", "spice-blends-mixes", "food-colourings-essences", "sugar",
  "dried-lentils-beans-peas", "tinned-lentils-beans", "soya-products", "namkeen-lentil-snacks",
  "tinned-vegetables", "tinned-coconut", "tinned-fruit",
  "rice-quinoa", "flour-milk-powder", "wheat-grains-couscous", "corn",
  "ghee-oils", "teas-drinks", "vegetables", "flours", "tinned-products",
  "raw-nuts", "flavoured-nuts", "seeds", "coconut-products", "dried-fruit",
  "pappadoms", "chutneys-pickles-sauces", "flavoured-nuts-snacks", "raisins-snacks",
  "all-snacks", "all-grains", "all-lentils-beans", "all-nuts-seeds",
])

// OLD handles that should NEVER appear in MeiliSearch
const FORBIDDEN_HANDLES = new Set([
  "staples-grains", "atta-flours", "dal-lentils", "oils-ghee",
  "spices-whole", "spices-ground", "spice-blends", "dairy", "beverages",
  "snacks-namkeen", "pickles-chutneys", "frozen", "fresh", "ready-to-cook", "condiments",
  "pooja", "household", "regional",
  "masoor-dal-red-lentils", "whole-moong-green", "moong-dal-yellow",
  "chapatti-flour-atta", "suji-coarse-semolina", "garam-masala",
  "amchur-mango-powder", "chaat-masala", "chole-chana-masala",
  "coriander-powder-dhania", "pav-bhaji-masala", "sambar-powder", "tamarind-chutney",
])

async function main() {
  console.log("=== DATA QUALITY CHECK ===\n")

  let passed = 0, failed = 0, warnings = 0

  // 1. Check MeiliSearch category_handle distribution
  console.log("1. MeiliSearch category_handle audit...")
  try {
    const d = JSON.stringify({ q: "", limit: 0, facets: ["category_handle"] })
    const r = await fetch(`${MEILI}/indexes/products/search`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: d,
    })
    const data = await r.json()
    const facets = data.facetDistribution?.category_handle || {}

    let forbiddenFound = 0
    for (const [handle, count] of Object.entries(facets)) {
      if (FORBIDDEN_HANDLES.has(handle)) {
        console.log(`  ❌ FORBIDDEN: ${handle} (${count} products)`)
        failed++
        forbiddenFound++
      }
    }
    if (forbiddenFound === 0) {
      console.log(`  ✅ No forbidden handles found`)
      passed++
    }

    // Check product count
    const total = Object.values(facets).reduce((a, b) => a + b, 0)
    if (total < 200) {
      console.log(`  ⚠️  Low product count: ${total} (expected ~265)`)
      warnings++
    } else {
      console.log(`  ✅ Product count: ${total}`)
      passed++
    }
  } catch (e) {
    console.log(`  ❌ MeiliSearch unreachable: ${e.message}`)
    failed++
  }

  // 2. Check Medusa product count
  console.log("\n2. Medusa product count...")
  try {
    const pk = "pk_736cac65cdf91adefa6c0180c37a29f00047518c60376efb84586432312a2d00"
    const r = await fetch(`${BASE}/store/products?limit=1&fields=id`, {
      headers: { "x-publishable-api-key": pk },
    })
    const data = await r.json()
    if (data.count >= 260) {
      console.log(`  ✅ Product count: ${data.count}`)
      passed++
    } else {
      console.log(`  ⚠️  Low product count: ${data.count} (expected 265)`)
      warnings++
    }
  } catch (e) {
    console.log(`  ❌ Medusa unreachable: ${e.message}`)
    failed++
  }

  // 3. Dietary flags presence
  console.log("\n3. Dietary flags in MeiliSearch...")
  try {
    const d2 = JSON.stringify({ q: "", limit: 0, facets: ["metadata.dietary_flags"] })
    const r2 = await fetch(`${MEILI}/indexes/products/search`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: d2,
    })
    const data2 = await r2.json()
    const diet = data2.facetDistribution?.["metadata.dietary_flags"] || {}
    if (Object.keys(diet).length > 0) {
      console.log(`  ✅ Dietary flags present: ${JSON.stringify(diet)}`)
      passed++
    } else {
      console.log(`  ⚠️  No dietary flags indexed`)
      warnings++
    }
  } catch (e) {
    console.log(`  ❌ Check failed: ${e.message}`)
    failed++
  }

  // Summary
  console.log(`\n=== RESULT: ${passed} passed, ${warnings} warnings, ${failed} failed ===`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
