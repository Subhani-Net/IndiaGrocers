/**
 * Data Quality Verification Script
 * Run after ANY data operation to confirm MeiliSearch state is correct.
 *
 * Usage: node scripts/verify-data-health.mjs
 */

const BASE = "http://127.0.0.1:9000"
const MEILI = "http://localhost:7700"

// Expected category handles (from categories.csv — 36 handles matching JSON)
const VALID_HANDLES = new Set([
  "rice_grains", "basmati_rice", "everyday_rice", "sona_masuri_rice", "speciality_rice_poha",
  "atta_flours", "atta_chapati_flour", "gram_flour_besan", "semolina_rava", "speciality_flours_grains_pasta", "coconut_staples",
  "dals_lentils_pulses", "lentils_dals", "beans_peas_pulses",
  "spices_masalas_herbs", "whole_spices_seeds", "powdered_spices", "masalas_spice_blends", "herbs_dried_leaves",
  "chutneys_pickles_pastes", "pickles", "chutneys_spreads", "cooking_pastes_table_sauces",
  "oils_ghee", "cooking_oils_ghee",
  "snacks_sweets_bakery", "savouries_papadoms", "sweets_confectionery", "biscuits_crackers", "nuts_seeds_pub_cards",
  "beverages_pantry", "beverages_drinks", "ayurveda_wellness", "sweeteners", "baking_essences_waters", "canned_veg_tamarind_meat_alts",
])

// Old handles that should NEVER appear in MeiliSearch (from the 140-category tree, now retired)
const FORBIDDEN_HANDLES = new Set([
  "staples-grains", "atta-flours", "dal-lentils", "oils-ghee",
  "spices-whole", "spices-ground", "spice-blends", "dairy", "beverages",
  "snacks-namkeen", "pickles-chutneys", "frozen", "fresh", "ready-to-cook", "condiments",
  "pooja", "household", "regional",
  "basmati-rice", "sona-masoori-rice", "idli-rice", "brown-rice", "poha-flattened-rice",
  "semolina-sooji-rava", "chapatti-flour-atta", "besan-gram-flour", "plain-flour-maida",
  "rice-flour", "ragi-finger-millet-flour", "suji-coarse-semolina",
  "toor-dal", "chana-dal", "moong-dal-yellow", "whole-moong-green",
  "masoor-dal-red-lentils", "urad-dal-split", "whole-urad-black",
  "rajma-kidney-beans", "chana-whole-chickpeas", "kala-chana-black-chickpeas", "lobhia-black-eye-beans",
])

// Handles that should NEVER appear in MeiliSearch (old system, now migrated away)
const FORBIDDEN_HANDLES = new Set([
  "sambar-powder", "tamarind-chutney",
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

  // 2. Check Medusa product count (via admin API — no hardcoded key)
  console.log("\n2. Medusa product count...")
  try {
    const loginRes = await fetch(`${BASE}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
    })
    const { token } = await loginRes.json()
    const r = await fetch(`${BASE}/admin/products?limit=1&fields=id`, {
      headers: { Authorization: `Bearer ${token}` },
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
