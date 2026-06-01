/**
 * Minimum Viable Catalogue — Audit Dashboard
 *
 * Audits every product against MVC completeness criteria and reports gaps.
 *
 * MVC Criteria:
 *   Tier 1 (Essential): Title, Image, Price, Category, Description, Dietary, Allergens
 *   Tier 2 (Search):    Tags, Synonyms
 *   Tier 3 (Rich):      Regional Tags, Eco Rating, Nutritional Info
 *
 * Usage:
 *   node scripts/mvc/audit.mjs
 */

import { readdirSync, readFileSync } from "fs"
import { resolve, dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..", "..")
const BASE = "http://127.0.0.1:9000"
const MEILI = "http://localhost:7700"
const DATA_DESIGN = resolve(ROOT, "data-design")

async function login() {
  const res = await fetch(BASE + "/auth/user/emailpass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: "Bearer " + (await res.json()).token, "Content-Type": "application/json" }
}

async function main() {
  console.log("=".repeat(60))
  console.log("  Minimum Viable Catalogue — Audit Dashboard")
  console.log("=".repeat(60))

  const headers = await login()

  // ── Fetch all products from MeiliSearch ──
  const msRes = await (await fetch(MEILI + "/indexes/products/documents?limit=500&fields=title,description,tags,category_handle,thumbnail,metadata")).json()
  const docs = msRes.results
  const total = msRes.total

  // ── Read CSV enrichment data ──
  const csvFiles = readdirSync(DATA_DESIGN).filter(f => f.endsWith("-master.csv"))
  const csvProducts = new Map()
  for (const f of csvFiles) {
    const rows = readFileSync(join(DATA_DESIGN, f), "utf-8").split("\n").slice(1).filter(r => r.trim())
    for (const row of rows) {
      const cols = row.split(",").map(c => c.replace(/^"/, "").replace(/"$/, ""))
      const title = cols[1]?.trim()
      const tagStr = cols[5]?.trim()
      if (title && tagStr) csvProducts.set(title, tagStr)
    }
  }

  // ── Audit every product ──
  let metrics = {
    total,
    natco: 0,
    trs: 0,
    withImage: 0,
    withDescription: 0,
    withDietary: 0,
    withAllergens: 0,
    withTags: 0,
    withEcoRating: 0,
    withRegionalTags: 0,
    withSynonymData: 0,
    csvTagsAvailable: 0,
    noPrice: 0,
  }

  const gaps = { noDescription: [], noTags: [], noDietary: [], noAllergens: [], noImage: [] }

  for (const d of docs) {
    const title = d.title
    const isNatco = title.startsWith("Natco")
    const isTrs = title.startsWith("TRS")
    if (isNatco) metrics.natco++
    if (isTrs) metrics.trs++

    if (d.thumbnail) metrics.withImage++

    if (d.description) metrics.withDescription++
    else if (gaps.noDescription.length < 5) gaps.noDescription.push(title)

    const meta = d.metadata || {}
    const dietary = meta.dietary_flags || []
    const allergens = meta.allergens || []
    if (dietary.length > 0) metrics.withDietary++
    else if (gaps.noDietary.length < 3) gaps.noDietary.push(title)
    if (allergens.length > 0) metrics.withAllergens++
    else if (gaps.noAllergens.length < 3) gaps.noAllergens.push(title)

    if (d.tags && d.tags.length > 0) metrics.withTags++
    else if (gaps.noTags.length < 3) gaps.noTags.push(title)

    if (meta.eco_rating) metrics.withEcoRating++
    if (meta.regional_tags?.length > 0) metrics.withRegionalTags++

    // Check CSV tag availability
    const csvTags = csvProducts.get(title)
    if (csvTags) metrics.csvTagsAvailable++

    // Check synonym data
    if (isNatco && csvProducts.has(title)) metrics.withSynonymData++
  }

  // ── Print Report ──
  console.log("\n┌─ Catalogue Summary")
  console.log("│  Total products:  " + total)
  console.log("│  Natco:           " + metrics.natco)
  console.log("│  TRS:             " + metrics.trs)

  console.log("\n┌─ Tier 1 — Essential")
  printMetric("Image (thumbnail)", metrics.withImage, total)
  printMetric("Description", metrics.withDescription, total)
  printMetric("Dietary flags", metrics.withDietary, total)
  printMetric("Allergens", metrics.withAllergens, total)

  console.log("\n┌─ Tier 2 — Search & Discovery")
  printMetric("Tags (in MeiliSearch)", metrics.withTags, total)
  printMetric("CSV tag data available (not applied)", metrics.csvTagsAvailable, total, "Natco")

  console.log("\n┌─ Tier 3 — Rich Experience")
  printMetric("Eco rating", metrics.withEcoRating, total)
  printMetric("Regional tags", metrics.withRegionalTags, total)
  printMetric("Per-product synonym data (Natco)", metrics.withSynonymData, metrics.natco)

  console.log("\n┌─ Gaps (sample)")
  console.log("│  No description: " + (total - metrics.withDescription) + " products, e.g.:")
  gaps.noDescription.forEach(t => console.log("│    · " + t))
  console.log("│  No tags:        " + (total - metrics.withTags) + " products, e.g.:")
  gaps.noTags.forEach(t => console.log("│    · " + t))

  // ── MVC Readiness Score ──
  const tier1Score = ((metrics.withImage + metrics.withDescription + metrics.withDietary + metrics.withAllergens) / (total * 4) * 100).toFixed(0)
  const tier2Score = ((metrics.withTags) / total * 100).toFixed(0)
  console.log("\n┌─ MVC Readiness Score")
  console.log("│  Tier 1 (Essential): " + tier1Score + "%")
  console.log("│  Tier 2 (Search):    " + tier2Score + "%")
  console.log("│  Tier 3 (Rich):      " + (metrics.withEcoRating > 0 ? "Partial" : "Not started"))
  console.log("└" + "─".repeat(30))

  console.log("\nNext:")
  if (metrics.withTags === 0) console.log("  1. Run: node scripts/mvc/pipeline.mjs --apply  (applies all enrichment)")
  if (metrics.withDescription < total) console.log("  → " + (total - metrics.withDescription) + " descriptions will be generated")
  if (metrics.csvTagsAvailable > 0) console.log("  → " + metrics.csvTagsAvailable + " products have CSV tags to apply")
  console.log("  → " + metrics.trs + " TRS products need enrichment")
}

function printMetric(label, count, total, scope) {
  const pct = (count / (scope || total) * 100).toFixed(0)
  const bar = "█".repeat(Math.round(count / (scope || total) * 20)) + "░".repeat(20 - Math.round(count / (scope || total) * 20))
  const target = scope ? " / " + scope : ""
  console.log("│  " + label + ": " + count + target + " (" + pct + "%) " + bar)
}

main().catch(console.error)
