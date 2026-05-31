/**
 * Full category validation — checks every category against Natco expected counts.
 * 
 * Usage: node scripts/validate-all-categories.mjs
 * Prerequisites: Backend + MeiliSearch running
 */

import { readFileSync, readdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const DATA_DIR = resolve(ROOT, "data-design")

// ─── Expected counts from data-design CSVs ───
function getCsvExpected() {
  const expected = {}
  const files = readdirSync(DATA_DIR).filter(f => f.endsWith("-master.csv"))
  for (const f of files) {
    const csv = readFileSync(resolve(DATA_DIR, f), "utf-8")
    const lines = csv.trim().split("\n")
    const hdrs = lines[0].split(",").map(h => h.replace(/"/g, "").trim())
    const catIdx = hdrs.indexOf("natco_subcategory")
    if (catIdx < 0) continue
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",")
      const cat = (cols[catIdx] || "").replace(/"/g, "").trim()
      if (cat) expected[cat] = (expected[cat] || 0) + 1
    }
  }
  return expected
}

// ─── Parent → children mapping ───
const PARENTS = {
  "spices": ["spices-herbs", "spice-herb-jars", "spice-blends-mixes", "food-colourings-essences", "sugar"],
  "essentials": ["all-essentials", "tinned-products", "ghee-oils", "teas-drinks", "vegetables", "flour-essentials"],
  "lentils": ["all-lentils-beans", "dried-lentils-beans-peas", "soya-products", "tinned-lentils-beans"],
  "nuts-seeds": ["all-nuts-seeds", "raw-nuts", "flavoured-nuts", "seeds", "coconut-products", "dried-fruit", "nut-seed-oils"],
  "snacks": ["all-snacks", "pappadoms", "chutneys-pickles-sauces", "namkeen-lentil-snacks", "flavoured-nuts-snacks", "raisins-snacks"],
  "grains": ["all-grains", "rice-quinoa", "flour-milk-powder", "wheat-grains-couscous", "corn", "soya-grains"],
  "flours": [],
  "tinned-products-parent": ["tinned-vegetables", "tinned-coconut", "tinned-fruit", "tinned-lentils-beans"],
}

async function main() {
  const expected = getCsvExpected()
  console.log(`Loaded ${Object.keys(expected).length} expected subcategory counts\n`)

  // 1. Get MeiliSearch facet distribution
  let msFacets = {}
  try {
    const d = JSON.stringify({ q: "", limit: 0, facets: ["category_handle"] })
    const r = await fetch("http://localhost:7700/indexes/products/search", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: d,
    })
    msFacets = (await r.json()).facetDistribution?.category_handle || {}
  } catch (e) {
    console.log("❌ MeiliSearch unreachable: " + e.message)
    return
  }

  // 2. Get DB count
  let dbCount = 0
  try {
    const pk = "pk_736cac65cdf91adefa6c0180c37a29f00047518c60376efb84586432312a2d00"
    const r = await fetch("http://127.0.0.1:9000/store/products?limit=1&fields=id", {
      headers: { "x-publishable-api-key": pk },
    })
    dbCount = (await r.json()).count || 0
  } catch (e) { console.log("⚠️ DB unreachable") }

  // 3. Validate each category
  console.log(`DB: ${dbCount} | MeiliSearch: ${Object.values(msFacets).reduce((a,b) => a+b, 0)}\n`)

  let totalPass = 0, totalWarn = 0, totalFail = 0

  for (const [parent, children] of Object.entries(PARENTS)) {
    console.log(`=== ${parent.toUpperCase()} ===`)

    // Parent: resolve all children
    const parentMS = parent in msFacets ? msFacets[parent] : 0
    const resolvedMS = children.reduce((sum, c) => sum + (msFacets[c] || 0), parentMS)

    // Parent expected: sum of all child expected counts (from CSV)
    const resolvedExp = children.reduce((sum, c) => sum + (expected[c] || 0), 0)

    const parentStatus = resolvedMS >= resolvedExp * 0.7 ? "✓" : resolvedMS > 0 ? "⚠" : "✗"
    console.log(`  Parent: ${parentMS} direct | ${resolvedMS} resolved vs ${resolvedExp} expected ${parentStatus}`)

    for (const child of children) {
      const ms = msFacets[child] || 0
      const exp = expected[child] || 0
      const gap = ms - exp
      let status = "✓"
      if (exp === 0) status = "-"
      else if (gap === 0) { status = "✓"; totalPass++ }
      else if (Math.abs(gap) <= 3 && gap > -exp * 0.5) { status = "⚠"; totalWarn++ }
      else { status = "✗"; totalFail++ }

      const gapStr = gap === 0 ? "=" : gap > 0 ? `+${gap}` : `${gap}`
      if (exp > 0 || ms > 0) {
        console.log(`    ${child.padEnd(32)} MS:${String(ms).padStart(3)} Exp:${String(exp).padStart(3)} Gap:${gapStr.padStart(5)} ${status}`)
      }
    }
    console.log()
  }

  console.log(`=== OVERALL: ${totalPass} ✓ pass, ${totalWarn} ⚠ warn, ${totalFail} ✗ fail ===`)
  console.log(`\nLegend: ✓ = exact match, ⚠ = acceptable gap, ✗ = needs fixing`)
}

main().catch(console.error)
