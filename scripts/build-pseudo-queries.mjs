/**
 * Build category → top-tags mapping for pseudo-query construction.
 * Reads all data-design/*.csv files, computes top 15 most frequent tags
 * per natco_subcategory, writes to data-design/category-tags.json
 *
 * Usage: node scripts/build-pseudo-queries.mjs
 */
import { readFileSync, readdirSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const DATA_DIR = resolve(ROOT, "data-design")
const OUTPUT = resolve(DATA_DIR, "category-tags.json")

const csvFiles = readdirSync(DATA_DIR).filter(f => f.endsWith("-master.csv"))

// { subcategory → { tag → count } }
const catTags = {}

for (const file of csvFiles) {
  const csv = readFileSync(resolve(DATA_DIR, file), "utf-8")
  const lines = csv.trim().split("\n")
  const hdrs = lines[0].split(",").map(h => h.replace(/"/g, "").trim())
  const catIdx = hdrs.indexOf("natco_subcategory")
  const tagsIdx = hdrs.indexOf("tags")

  if (catIdx < 0) continue

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",")
    const cat = (cols[catIdx] || "").replace(/"/g, "").trim()
    if (!cat) continue

    if (!catTags[cat]) catTags[cat] = {}

    if (tagsIdx >= 0 && cols[tagsIdx]) {
      const tags = cols[tagsIdx].replace(/"/g, "").split(";").map(t => t.trim()).filter(Boolean)
      for (const tag of tags) {
        if (!tag || tag === "0") continue
        // Skip BEST year tags, seasonal, generic low-value
        if (tag.match(/^\d{4}BEST$/)) continue
        if (tag === "new" || tag === "offer" || tag === "reduced" || tag === "best") continue
        catTags[cat][tag] = (catTags[cat][tag] || 0) + 1
      }
    }
  }
}

// Build output: { category_handle → "tag1 tag2 ... tag15" }
const queries = {}
for (const [cat, tags] of Object.entries(catTags)) {
  const sorted = Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag]) => tag)
  queries[cat] = sorted.join(" ")

  console.log(`  ${cat.padEnd(35)} ${sorted.length} tags → "${sorted.slice(0, 5).join(", ")}..."`)
}

writeFileSync(OUTPUT, JSON.stringify(queries, null, 2))
console.log(`\nWritten to ${OUTPUT}`)
console.log(`${Object.keys(queries).length} categories with tag queries`)
