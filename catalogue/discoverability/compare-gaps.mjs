/**
 * COMPARE GAPS
 * Diffs the current gap report against the previous one.
 * Shows what improved, regressed, or stayed the same.
 *
 * Usage:
 *   node catalogue/discoverability/compare-gaps.mjs
 * Output:
 *   catalogue/discoverability/gap-trends.txt
 */
import { readFileSync, writeFileSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const CURRENT = resolve(__dirname, "gap-report.json")
const PREVIOUS = resolve(__dirname, "gap-report.prev.json")
const OUT = resolve(__dirname, "gap-trends.txt")

function loadIf(f) { return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null }

async function main() {
  const current = loadIf(CURRENT)
  const previous = loadIf(PREVIOUS)

  if (!current) {
    console.log("No current gap report found. Run gap-analysis.mjs first.")
    return
  }

  const lines = []
  lines.push("=".repeat(70))
  lines.push("  DISCOVERABILITY TRENDS")
  lines.push(`  Current:  ${current._generated}`)
  lines.push(`  Previous: ${previous?._generated || "none (first run)"}`)
  lines.push("=".repeat(70))
  lines.push("")

  // Summary comparison
  const cs = current._summary.search, ps = previous?._summary?.search
  const cc = current._summary.categories, pc = previous?._summary?.categories

  if (previous) {
    lines.push("SUMMARY CHANGES:")
    lines.push(`  Search:  ${ps.avgOverlap}→${cs.avgOverlap} overlap | ${ps.totalMissing}→${cs.totalMissing} missing | ${ps.clean}→${cs.clean} clean`)
    lines.push(`  Categories: ${pc.avgOverlap}→${cc.avgOverlap} overlap | ${pc.totalMissing}→${cc.totalMissing} missing | ${pc.clean}→${cc.clean} clean`)
    lines.push("")

    // Search regressions (overlap decreased)
    const prevSearch = {}
    previous.searchGaps.forEach(g => { prevSearch[g.term] = g.overlap })
    const regressed = current.searchGaps
      .filter(g => prevSearch[g.term] !== undefined && g.overlap < prevSearch[g.term])
      .sort((a, b) => (prevSearch[a.term] - a.overlap) - (prevSearch[b.term] - b.overlap))

    if (regressed.length > 0) {
      lines.push(`SEARCH REGRESSIONS (${regressed.length}):`)
      for (const g of regressed.slice(0, 20)) {
        const delta = prevSearch[g.term] - g.overlap
        lines.push(`  "${g.term}" ${prevSearch[g.term]}→${g.overlap} (${delta > 0 ? "-" : "+"}${Math.abs(delta)}) ${delta >= 3 ? "⚠️" : ""}`)
      }
      lines.push("")
    }

    // Search improvements (overlap increased)
    const improved = current.searchGaps
      .filter(g => prevSearch[g.term] !== undefined && g.overlap > prevSearch[g.term])
      .sort((a, b) => (b.overlap - prevSearch[b.term]) - (a.overlap - prevSearch[a.term]))

    if (improved.length > 0) {
      lines.push(`SEARCH IMPROVEMENTS (${improved.length}):`)
      for (const g of improved.slice(0, 20)) {
        const delta = g.overlap - prevSearch[g.term]
        lines.push(`  "${g.term}" ${prevSearch[g.term]}→${g.overlap} (+${delta}) ✓`)
      }
      lines.push("")
    }

    // New search terms (not in previous)
    const newTerms = current.searchGaps.filter(g => prevSearch[g.term] === undefined)
    if (newTerms.length > 0) {
      lines.push(`NEW SEARCH TERMS (${newTerms.length}):`)
      newTerms.slice(0, 10).forEach(g => lines.push(`  "${g.term}" — overlap: ${g.overlap}/${g.expectedCount}`))
      lines.push(`  ... and ${Math.max(0, newTerms.length - 10)} more`)
      lines.push("")
    }

    // Category regressions
    const prevCats = {}
    previous.categoryGaps.forEach(g => { prevCats[g.handle] = g.overlap })
    const catRegressed = current.categoryGaps
      .filter(g => prevCats[g.handle] !== undefined && g.overlap < prevCats[g.handle])
      .sort((a, b) => (prevCats[a.handle] - a.overlap) - (prevCats[b.handle] - b.overlap))

    if (catRegressed.length > 0) {
      lines.push(`CATEGORY REGRESSIONS (${catRegressed.length}):`)
      for (const g of catRegressed.slice(0, 15)) {
        const delta = prevCats[g.handle] - g.overlap
        lines.push(`  ${g.handle} (${g.name}) ${prevCats[g.handle]}→${g.overlap} (${delta > 0 ? "-" : "+"}${Math.abs(delta)}) ${delta >= 3 ? "⚠️" : ""}`)
      }
      lines.push("")
    }

    // Category improvements
    const catImproved = current.categoryGaps
      .filter(g => prevCats[g.handle] !== undefined && g.overlap > prevCats[g.handle])
      .sort((a, b) => (b.overlap - prevCats[b.handle]) - (a.overlap - prevCats[a.handle]))

    if (catImproved.length > 0) {
      lines.push(`CATEGORY IMPROVEMENTS (${catImproved.length}):`)
      for (const g of catImproved.slice(0, 15)) {
        const delta = g.overlap - prevCats[g.handle]
        lines.push(`  ${g.handle} (${g.name}) ${prevCats[g.handle]}→${g.overlap} (+${delta}) ✓`)
      }
      lines.push("")
    }
  } else {
    lines.push("First run — no previous data to compare. Save current report as baseline:")
    lines.push(`  cp gap-report.json gap-report.prev.json`)
    lines.push("")
    lines.push("Top search gaps in this baseline:")
    const worst = current.searchGaps
      .filter(g => g.missing.length > 0)
      .sort((a, b) => b.missing.length - a.missing.length)
      .slice(0, 10)
    for (const g of worst) {
      lines.push(`  "${g.term}" — ${g.overlap}/${g.expectedCount} overlap — missing: ${g.missing.slice(0, 2).join(" | ")}`)
    }
    lines.push("")
  }

  // Action items
  const actionItems = current.searchGaps.filter(g => g.overlap === 0)
  if (actionItems.length > 0) {
    lines.push(`ZERO-OVERLAP SEARCHES (${actionItems.length} — investigate immediately):`)
    actionItems.forEach(g => lines.push(`  "${g.term}" — expected ${g.expectedCount}, got 0`))
    lines.push("")
  }

  lines.push("=".repeat(70))
  lines.push("  Baseline: cp catalogue/discoverability/gap-report.json catalogue/discoverability/gap-report.prev.json")
  lines.push("=".repeat(70))

  const output = lines.join("\n")
  writeFileSync(OUT, output)
  console.log(output)
}

main().catch(e => { console.error(e); process.exit(1) })
