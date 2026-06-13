/**
 * GAP ANALYSIS
 * Compares stable expected results (from expected-results.json) against
 * live MeiliSearch actuals. Produces a gap report showing exactly what
 * differs between expectation and reality.
 *
 * Does NOT modify expected-results.json. Reads it as the stable truth.
 *
 * Also produces a simple text summary for quick spot-checking.
 *
 * Usage:
 *   node catalogue/discoverability/gap-analysis.mjs
 * Output:
 *   catalogue/discoverability/gap-report.json     (full gap data)
 *   catalogue/discoverability/gap-report.txt      (human-readable summary)
 */
import { readFileSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const EXPECTED = resolve(__dirname, "expected-results.json")
const OUT_JSON = resolve(__dirname, "gap-report.json")
const OUT_TXT = resolve(__dirname, "gap-report.txt")

const MEILI = process.env.MEILISEARCH_HOST || "http://localhost:7700"

async function meiliSearch(query, categoryHandle) {
  const filterParts = []
  if (categoryHandle) filterParts.push(`category_handle = "${categoryHandle}"`)
  const body = { q: query, limit: 12, attributesToRetrieve: ["title"], showMatchesPosition: true }
  if (filterParts.length > 0) body.filter = filterParts.join(" AND ")
  const r = await fetch(`${MEILI}/indexes/products/search`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  })
  const data = await r.json()
  return (data.hits || []).map(h => h.title)
}

async function main() {
  const expected = JSON.parse(readFileSync(EXPECTED, "utf8"))
  console.log(`Loaded: ${Object.keys(expected.search).length} search terms, ${Object.keys(expected.categories).length} categories`)
  console.log(`Generated: ${expected._generated} | Products: ${expected._productCount}`)
  console.log(`\nRunning gap analysis against MeiliSearch at ${MEILI}...`)

  // Search gaps
  const searchGaps = []
  let searchDone = 0
  for (const [term, expTitles] of Object.entries(expected.search)) {
    if (expTitles.length === 0) continue
    const actual = await meiliSearch(term)
    const expSet = new Set(expTitles)
    const actSet = new Set(actual)

    const missing = expTitles.filter(t => !actSet.has(t))
    const extra = actual.filter(t => !expSet.has(t))
    const posGaps = []
    for (let i = 0; i < Math.min(expTitles.length, actual.length); i++) {
      if (expTitles[i] !== actual[i]) {
        posGaps.push({ pos: i, expected: expTitles[i], actual: actual[i] })
      }
    }

    searchGaps.push({
      term,
      overlap: expTitles.filter(t => actSet.has(t)).length,
      expectedCount: expTitles.length,
      actualCount: actual.length,
      missing: missing.slice(0, 10),
      extra: extra.slice(0, 10),
      posDiffs: posGaps.slice(0, 5),
    })

    searchDone++
    if (searchDone % 100 === 0) console.log(`  Search: ${searchDone}/${Object.keys(expected.search).length}`)
  }

  // Category gaps
  const categoryGaps = []
  let catDone = 0
  for (const [handle, cat] of Object.entries(expected.categories)) {
    const titles = (cat.aggregateTitles || cat.titles).filter(Boolean)
    if (titles.length === 0) continue

    const actual = await meiliSearch("", handle)
    const expSet = new Set(titles)
    const actSet = new Set(actual)

    const missing = titles.filter(t => !actSet.has(t))
    const extra = actual.filter(t => !expSet.has(t))
    const posGaps = []
    for (let i = 0; i < Math.min(titles.length, actual.length); i++) {
      if (titles[i] !== actual[i]) {
        posGaps.push({ pos: i, expected: titles[i], actual: actual[i] })
      }
    }

    categoryGaps.push({
      handle,
      name: cat.name,
      isParent: cat.isParent,
      overlap: titles.filter(t => actSet.has(t)).length,
      expectedCount: titles.length,
      actualCount: actual.length,
      missing: missing.slice(0, 10),
      extra: extra.slice(0, 10),
      posDiffs: posGaps.slice(0, 5),
    })

    catDone++
    if (catDone % 25 === 0) console.log(`  Categories: ${catDone}/${Object.keys(expected.categories).length}`)
  }

  const report = {
    _generated: new Date().toISOString(),
    _expectedSnapshot: expected._generated,
    _productCount: expected._productCount,
    searchGaps,
    categoryGaps,
    _summary: {
      search: {
        total: searchGaps.length,
        avgOverlap: (searchGaps.reduce((s, g) => s + g.overlap, 0) / Math.max(1, searchGaps.length)).toFixed(1),
        totalMissing: searchGaps.reduce((s, g) => s + g.missing.length, 0),
        clean: searchGaps.filter(g => g.missing.length === 0).length,
        broken: searchGaps.filter(g => g.missing.length > 0).length,
      },
      categories: {
        total: categoryGaps.length,
        avgOverlap: (categoryGaps.reduce((s, g) => s + g.overlap, 0) / Math.max(1, categoryGaps.length)).toFixed(1),
        totalMissing: categoryGaps.reduce((s, g) => s + g.missing.length, 0),
        clean: categoryGaps.filter(g => g.missing.length === 0).length,
        broken: categoryGaps.filter(g => g.missing.length > 0).length,
      },
    },
  }

  writeFileSync(OUT_JSON, JSON.stringify(report, null, 2))

  // Generate human-readable summary
  const s = report._summary
  const lines = []
  lines.push("=".repeat(70))
  lines.push(`  DISCOVERABILITY GAP REPORT — ${report._generated}`)
  lines.push(`  Expected snapshot: ${report._expectedSnapshot}`)
  lines.push(`  Products: ${report._productCount}`)
  lines.push("=".repeat(70))
  lines.push("")
  lines.push(`SEARCH: ${s.search.total} terms | avg overlap ${s.search.avgOverlap} | ${s.search.totalMissing} missing | ${s.search.clean} clean | ${s.search.broken} with gaps`)
  lines.push("")

  // Top 10 worst search gaps
  const worstSearch = searchGaps
    .filter(g => g.missing.length > 0)
    .sort((a, b) => b.missing.length - a.missing.length)
    .slice(0, 10)

  if (worstSearch.length > 0) {
    lines.push("Top search gaps (most missing):")
    for (const g of worstSearch) {
      lines.push(`  "${g.term}" — ${g.overlap}/${g.expectedCount} overlap — missing: ${g.missing.slice(0, 3).join(" | ")}`)
    }
    lines.push("")
  }

  lines.push(`CATEGORIES: ${s.categories.total} categories | avg overlap ${s.categories.avgOverlap} | ${s.categories.totalMissing} missing | ${s.categories.clean} clean | ${s.categories.broken} with gaps`)
  lines.push("")

  // Top 10 worst category gaps
  const worstCats = categoryGaps
    .filter(g => g.missing.length > 0)
    .sort((a, b) => b.missing.length - a.missing.length)
    .slice(0, 10)

  if (worstCats.length > 0) {
    lines.push("Top category gaps (most missing):")
    for (const g of worstCats) {
      const type = g.isParent ? "[parent]" : "[leaf]"
      lines.push(`  ${type} ${g.handle} (${g.name}) — ${g.overlap}/${g.expectedCount} overlap — missing: ${g.missing.slice(0, 3).join(" | ")}`)
    }
    lines.push("")
  }

  // Clean categories (no gaps — good!)
  const cleanCats = categoryGaps.filter(g => g.missing.length === 0)
  if (cleanCats.length > 0) {
    lines.push(`Clean categories (no gaps): ${cleanCats.length}`)
    lines.push(`  ${cleanCats.map(c => c.handle).join(", ")}`)
    lines.push("")
  }

  lines.push("=".repeat(70))
  lines.push(`  Full JSON: ${OUT_JSON}`)
  lines.push("=".repeat(70))

  const summary = lines.join("\n")
  writeFileSync(OUT_TXT, summary)
  console.log(`\n${summary}`)
}

main().catch(e => { console.error(e); process.exit(1) })
