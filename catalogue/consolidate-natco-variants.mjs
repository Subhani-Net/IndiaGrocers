/**
 * NATCO VARIANT CONSOLIDATION
 *
 * Reads weight + price data from backup snapshot, matches to current
 * CSV products by base name, and generates consolidated multi-variant rows.
 * Backup is used ONCE as a read-only data mine — never as a seed source.
 *
 * Usage:
 *   node catalogue/consolidate-natco-variants.mjs          # dry run
 *   node catalogue/consolidate-natco-variants.mjs --write  # update CSV
 */
import { readFileSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BACKUP = resolve(__dirname, "..", "scripts", "data-pipeline", "backups", "snapshot-20260610-2128.json")
const CSV_PATH = resolve(__dirname, "products.csv")
const WRITE = process.argv.includes("--write")

function parseCSVLine(line) {
  const result = []
  let current = "", inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') { if (line[i + 1] === '"') { current += '"'; i++ } else inQuotes = false }
      else current += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ",") { result.push(current.trim()); current = "" }
      else current += ch
    }
  }
  result.push(current.trim())
  return result
}

function escapeCsv(fields) {
  return fields.map(f => {
    const s = String(f || "")
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`
    return s
  }).join(",")
}

function normalizeBase(title) {
  // Strip "Natco - " prefix and trailing weight/size
  let base = title.replace(/^Natco\s*-\s*/, "").trim()
  base = base.replace(/\s+\d+\.?\d*\s*(g|kg|ml|l|oz|litre)/gi, "").trim()
  base = base.replace(/\s*-\s*Bag/, "").trim()
  base = base.replace(/\s*Full\s+Case\s+.*/, "").trim()
  base = base.replace(/&amp;/g, "&")
  return base.toLowerCase()
}

function parseWeightAndPrice(snapshotProducts) {
  const map = new Map()
  for (const p of snapshotProducts) {
    if (!p.title.includes("Natco")) continue
    const m = p.title.match(/^Natco\s*-\s*(.+?)\s+(\d+\.?\d*\s*(?:g|kg|ml|l|oz|litre)(?:\s*(?:Bag|Pack))?)?$/i)
    const base = m?.[1]?.trim() || ""
    const weight = (m?.[2] || "").trim()
    
    const gbp = (p.variants?.[0]?.prices || []).find(pr => pr.currency_code === "gbp")
    const price = gbp ? (gbp.amount / 100) : 0
    
    const key = base.toLowerCase()
    if (!map.has(key)) map.set(key, [])
    const existing = map.get(key)
    if (!existing.find(e => e.weight === weight)) {
      existing.push({ weight, price })
    }
  }
  return map
}

function parseWeightUnit(weightLabel) {
  const m = (weightLabel || "").match(/^(\d+\.?\d*)\s*(g|kg|ml|l|oz|litre)/i)
  if (!m) return { value: "", unit: "" }
  return { value: m[1], unit: m[2].toLowerCase() === "litre" ? "l" : m[2].toLowerCase() }
}

async function main() {
  // 1. Extract weights + prices from backup snapshot
  console.log("1. Extracting weights + prices from backup...")
  const snapshot = JSON.parse(readFileSync(BACKUP, "utf8"))
  const weightMap = parseWeightAndPrice(snapshot.products)
  
  let totalVariants = 0
  let groupsWithWeights = 0
  for (const [, variants] of weightMap) {
    if (variants.length > 1) { groupsWithWeights++; totalVariants += variants.length }
  }
  console.log(`   ${weightMap.size} unique base names, ${groupsWithWeights} groups with multi-weights, ${totalVariants} total variants\n`)

  // 2. Read current CSV
  console.log("2. Reading current products.csv...")
  const csvLines = readFileSync(CSV_PATH, "utf8").trim().split("\n")
  const csvHeader = csvLines[0]
  const csvHeaders = csvHeader.split(",").map(h => h.trim())
  const csvRows = csvLines.slice(1).map(parseCSVLine)
  
  const ti = csvHeaders.indexOf("product_title")
  const vtIdx = csvHeaders.indexOf("variant_title")
  const pi = csvHeaders.indexOf("price_gbp")
  const wvi = csvHeaders.indexOf("weight_value")
  const wui = csvHeaders.indexOf("weight_unit")
  const handleIdx = 0
  
  console.log(`   ${csvRows.length} rows\n`)

  // 3. Group Natco CSV rows by base name
  console.log("3. Grouping Natco products...")
  const groups = new Map()
  const allNatcoRows = csvRows.filter(r => (r[ti] || "").includes("Natco"))
  
  for (const row of allNatcoRows) {
    const title = row[ti] || ""
    const base = normalizeBase(title)
    if (!groups.has(base)) groups.set(base, { rows: [], baseName: base })
    groups.get(base).rows.push(row)
  }
  
  const multiGroups = [...groups.entries()].filter(([, g]) => g.rows.length > 1)
  console.log(`   ${multiGroups.length} multi-row groups, ${[...groups.entries()].filter(([, g]) => g.rows.length === 1).length} standalone\n`)

  // 4. Match backup weights to CSV groups
  console.log("4. Matching backup weights to CSV products...")
  let matched = 0, unmatched = 0
  
  for (const [base, group] of multiGroups) {
    const backupVariants = weightMap.get(base)
    if (!backupVariants || backupVariants.length < 2) {
      unmatched++
      console.log(`   ⚠ ${group.baseName}: no weights in backup (has ${group.rows.length} rows)`)
      continue
    }
    matched++
    
    // Sort variants by weight (ascending)
    backupVariants.sort((a, b) => {
      const wa = parseFloat(a.weight), wb = parseFloat(b.weight)
      if (a.weight.includes("ml") && b.weight.includes("g")) return 1
      if (b.weight.includes("ml") && a.weight.includes("g")) return -1
      return wa - wb
    })
    
    // Assign weights to CSV rows (sorted by price descending to maintain current order)
    const rows = group.rows.sort((a, b) => (parseFloat(b[pi]) || 0) - (parseFloat(a[pi]) || 0))
    
    // Map: higher price = larger weight (this is usually correct for Natco)
    const sortedWeights = backupVariants.sort((a, b) => (parseFloat(b.weight) || 0) - (parseFloat(a.weight) || 0))
    
    // Store weight labels on rows (price-highest gets largest weight)
    for (let i = 0; i < Math.min(rows.length, sortedWeights.length); i++) {
      rows[i]._weightLabel = sortedWeights[i].weight
      rows[i]._backupPrice = sortedWeights[i].price
    }
    
    if (WRITE && matched <= 10) {
      console.log(`   ${group.baseName}: ${backupVariants.map(v => v.weight).join(", ")}`)
    }
  }
  
  console.log(`   ${matched} matched, ${unmatched} unmatched\n`)

  // 5. Build output CSV
  if (!WRITE) {
    console.log("DRY RUN — use --write to update CSV")
    console.log(`   Would consolidate: ${matched} groups, ${matched * 2 + unmatched} products\n`)
    
    // Show sample of what CSV would look like
    let shown = 0
    for (const [base, group] of multiGroups) {
      if (shown >= 5 || !weightMap.get(base)) break
      shown++
      console.log(`\n   ${group.baseName}:`)
      group.rows.slice(0, 4).forEach(r => {
        const w = r._weightLabel || "???"
        const p = r._backupPrice || r[pi] || "?"
        console.log(`     variant="${w}" price=${typeof p === 'number' ? p.toFixed(2) : p}`)
      })
    }
    return
  }

  console.log("5. Building consolidated CSV...")
  
  // Build set of handles to delete (merged handles)
  const primaryHandles = new Set()
  const handlesToDelete = new Set()
  
  for (const [base, group] of multiGroups) {
    if (!weightMap.get(base) || weightMap.get(base).length < 2) continue
    // First row's handle becomes the primary product handle
    const primaryHandle = group.rows[0][handleIdx]
    primaryHandles.add(primaryHandle)
    // All other handles get deleted
    for (let i = 1; i < group.rows.length; i++) {
      handlesToDelete.add(group.rows[i][handleIdx])
    }
  }

  const outputRows = []
  const seenPrimary = new Set()
  
  for (const row of csvRows) {
    const h = row[handleIdx]
    
    // Skip merged handles
    if (handlesToDelete.has(h)) continue
    
    // Find if this is a primary handle for a consolidated product
    let group = null
    for (const [, g] of multiGroups) {
      if (g.rows[0][handleIdx] === h) { group = g; break }
    }
    
    if (group && !seenPrimary.has(h)) {
      seenPrimary.add(h)
      // Write one row per variant
      const backupVariants = weightMap.get(normalizeBase(group.rows[0][ti]))
      if (!backupVariants || backupVariants.length < 2) {
        outputRows.push(row.join(","))
        continue
      }
      
      for (const variant of backupVariants.sort((a, b) => {
        const wa = parseFloat(a.weight) || 0, wb = parseFloat(b.weight) || 0
        if (a.weight.includes("ml") && b.weight.includes("g")) return 1
        if (b.weight.includes("ml") && a.weight.includes("g")) return -1
        return wa - wb
      })) {
        const newRow = [...row]
        newRow[vtIdx] = variant.weight  // variant_title = weight label
        newRow[pi] = variant.price.toFixed(2)  // price_gbp
        const { value, unit } = parseWeightUnit(variant.weight)
        newRow[wvi] = value
        newRow[wui] = unit
        outputRows.push(escapeCsv(newRow))
      }
    } else if (!handlesToDelete.has(h)) {
      // Non-consolidated row: keep as-is
      outputRows.push(row.join(","))
    }
  }

  writeFileSync(CSV_PATH, csvHeader + "\n" + outputRows.join("\n"))
  
  console.log(`   CSV written: ${outputRows.length} rows (was ${csvRows.length})`)
  console.log(`   Handles deleted: ${handlesToDelete.size}`)
  console.log(`   Consolidated groups: ${seenPrimary.size}`)
  console.log(`\n   Next: node catalogue/enrich.mjs --apply --reindex`)
}

main().catch(e => { console.error(e); process.exit(1) })
