/**
 * COMPREHENSIVE SEARCH & CATEGORY TEST MATRIX RUNNER
 *
 * Reads 4 test matrices and runs them against live MeiliSearch:
 *   1. search-test-matrix.json      — hand-curated linguistic/edge-case tests
 *   2. category-test-matrix.json    — hand-curated category structure tests
 *   3. product-coverage-matrix.json — auto-generated from DB (full catalog coverage)
 *   4. manual-test-overlay.json     — human-curated overrides/additions
 *
 * Supports: title substring matching, category_handle filters, position ordering.
 * Reports: pass rate per matrix, overall score, coverage metrics.
 *
 * Run from root: node catalogue/run-search-tests.mjs
 */
import { readFileSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const MEILI = process.env.MEILISEARCH_HOST || "http://localhost:7700"

const MATRIX_FILES = [
  "search-test-matrix.json",
  "category-test-matrix.json",
  "product-coverage-matrix.json",
  "manual-test-overlay.json",
]

async function search(query, categoryHandle) {
  const filterParts = []
  if (categoryHandle) filterParts.push(`category_handle = "${categoryHandle}"`)
  const body = {
    q: query,
    limit: 12,
    attributesToRetrieve: ["id", "title"],
    showMatchesPosition: true,
  }
  if (filterParts.length > 0) body.filter = filterParts.join(" AND ")
  const r = await fetch(`${MEILI}/indexes/products/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await r.json()
  return (data.hits || []).map(h => ({ id: h.id, title: h.title || "" }))
}

let totalPassed = 0, totalFailed = 0, totalSkipped = 0
const perMatrixStats = []

for (const fileName of MATRIX_FILES) {
  const matrixPath = resolve(__dirname, fileName)
  if (!existsSync(matrixPath)) {
    console.log(`  ⚠️  ${fileName} not found — skipping\n`)
    continue
  }

  const tests = JSON.parse(readFileSync(matrixPath, "utf8"))
  if (!Array.isArray(tests) || tests.length === 0) {
    console.log(`  ⏭  ${fileName} empty — skipping\n`)
    continue
  }

  const matrixName = fileName.replace(".json", "")
  console.log("=".repeat(70))
  console.log(`  ${matrixName}: ${tests.length} tests`)
  console.log("=".repeat(70))

  let passed = 0, failed = 0, skipped = 0

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i]
    if (t._comment) { skipped++; continue }

    const ctx = t.categoryHandle ? ` [cat:${t.categoryHandle}]` : ""
    const label = `[${i + 1}/${tests.length}] ${t.testGroup || "Unknown"}: "${t.searchTerm}"${ctx}`

    if (!t.expectedTitles || t.expectedTitles.length === 0) {
      skipped++
      continue
    }

    const min = Math.min(t.minExpected || 1, t.expectedTitles.length)

    try {
      const results = await search(t.searchTerm, t.categoryHandle || "")
      const top3 = results.slice(0, 3)
      const all12 = results.slice(0, 12)

      // Use top3 for search tests, all12 for category page tests
      const searchPool = t.categoryHandle && !t.searchTerm ? all12 : top3
      const matched = t.expectedTitles.filter(exp =>
        searchPool.some(hit => hit.title.toLowerCase().includes(exp.toLowerCase()))
      )

      // Check position ordering if specified
      let orderOk = true
      let orderDetail = ""
      if (t.expectedOrder && t.expectedOrder.length > 0) {
        for (let oi = 0; oi < t.expectedOrder.length; oi++) {
          const pos = t.expectedOrder[oi]
          const expTitle = t.expectedTitles[oi]
          if (pos < all12.length) {
            const actualTitle = all12[pos].title.toLowerCase()
            if (!actualTitle.includes(expTitle.toLowerCase())) {
              orderOk = false
              orderDetail += ` pos${pos} expected "${expTitle}" got "${all12[pos].title.slice(0, 40)}"`
            }
          } else {
            orderOk = false
            orderDetail += ` pos${pos} oob (${all12.length} results)`
          }
        }
      }

      if (matched.length >= min && orderOk) {
        passed++
        // Print compact: only show failures for auto-generated tests
        if (t.testGroup?.startsWith("Auto -")) continue
        const foundItems = matched.join(", ")
        const orderStr = t.expectedOrder ? " | order OK" : ""
        console.log(`${label}\n  ✅ PASS — ${matched.length}/${t.expectedTitles.length} [${foundItems}]${orderStr}`)
      } else {
        const titles = searchPool.map(h => h.title).join(" | ")
        const missing = t.expectedTitles.filter(exp =>
          !searchPool.some(hit => hit.title.toLowerCase().includes(exp.toLowerCase()))
        )
        console.log(`${label}\n  ❌ FAIL — matched ${matched.length}/${t.expectedTitles.length} (need >= ${min})`)
        console.log(`  Results: ${titles || "(none)"}`)
        console.log(`  Missing: ${missing.join(", ")}`)
        if (orderDetail) console.log(`  Ordering: ${orderDetail}`)
        console.log(`  Reason: ${t.failureReason || "Expected titles not in results"}\n`)
        failed++
      }
    } catch (e) {
      console.log(`${label}\n  ❌ ERROR: ${e.message}\n`)
      failed++
    }
  }

  const pct = ((passed / (passed + failed)) * 100).toFixed(1)
  perMatrixStats.push({ name: matrixName, total: tests.length, passed, failed, skipped, pct })
  console.log(`\n  ${matrixName}: ${passed} passed | ${failed} failed | ${skipped} skipped | ${pct}%\n`)
  totalPassed += passed
  totalFailed += failed
  totalSkipped += skipped
}

// Overall summary
const totalPct = ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)
console.log("=".repeat(70))
console.log("  COVERAGE SUMMARY")
console.log("=".repeat(70))
for (const s of perMatrixStats) {
  console.log(`  ${s.name.padEnd(35)} ${String(s.passed).padStart(4)} passed | ${String(s.failed).padStart(4)} failed | ${s.pct}%`)
}
console.log("  " + "-".repeat(60))
console.log(`  ${"OVERALL".padEnd(35)} ${String(totalPassed).padStart(4)} passed | ${String(totalFailed).padStart(4)} failed | ${totalPct}%`)
console.log(`  Skipped: ${totalSkipped}`)
console.log("=".repeat(70))

process.exit(totalFailed > 0 ? 1 : 0)
