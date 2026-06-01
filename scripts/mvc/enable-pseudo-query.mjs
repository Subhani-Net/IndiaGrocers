/**
 * Minimum Viable Catalogue — Pseudo-Query Builder & Enabler
 *
 * After tags are in MeiliSearch, this script:
 * 1. Rebuilds category-tags.json from MeiliSearch facet data
 * 2. Enables getPseudoQuery() in pseudo-query.ts
 *
 * Usage: node scripts/mvc/enable-pseudo-query.mjs
 */

import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { writeFileSync, readFileSync } from "fs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..", "..")
const MEILI = "http://localhost:7700"
const DATA_DESIGN = resolve(ROOT, "data-design")
const STOREFRONT = resolve(ROOT, "apps/storefront/src/lib/util")

async function main() {
  console.log("Pseudo-Query Builder & Enabler\n")

  // Step 1: Fetch tag distribution by category from MeiliSearch
  console.log("Step 1: Fetching tag distribution from MeiliSearch...")
  const res = await (await fetch(MEILI + "/indexes/products/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: "",
      limit: 0,
      facets: ["category_handle", "tags"],
      facetDistribution: ["category_handle", "tags"],
    }),
  })).json()

  // Step 2: Get all product tag frequencies
  console.log("Step 2: Analyzing tag frequencies...")
  const allDocs = await (await fetch(MEILI + "/indexes/products/documents?limit=500&fields=category_handle,tags")).json()
  const catTags = {}

  for (const doc of allDocs.results) {
    const cat = doc.category_handle
    const tags = doc.tags || []
    if (!cat || tags.length === 0) continue
    if (!catTags[cat]) catTags[cat] = {}
    for (const tag of tags) {
      catTags[cat][tag] = (catTags[cat][tag] || 0) + 1
    }
  }

  // Step 3: Build top-15 tags per category
  console.log("Step 3: Building category -> top tags map...")
  const categoryTags = {}
  for (const [cat, tagFreq] of Object.entries(catTags)) {
    const sorted = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 15)
    categoryTags[cat] = sorted.map(([tag]) => tag).join(" ")
    console.log("  " + cat + ": " + sorted.length + " tags")
  }

  // Step 4: Write category-tags.json
  writeFileSync(resolve(DATA_DESIGN, "category-tags.json"), JSON.stringify(categoryTags, null, 2))
  writeFileSync(resolve(STOREFRONT, "category-tags.json"), JSON.stringify(categoryTags, null, 2))
  console.log("\n  category-tags.json written to:")
  console.log("    " + resolve(DATA_DESIGN, "category-tags.json"))
  console.log("    " + resolve(STOREFRONT, "category-tags.json"))

  // Step 5: Enable pseudo-query in pseudo-query.ts
  console.log("\nStep 4: Enabling pseudo-query in pseudo-query.ts...")
  const pqPath = resolve(STOREFRONT, "pseudo-query.ts")
  let content = readFileSync(pqPath, "utf-8")

  if (content.includes("return \"\"")) {
    // Enable it: replace return "" with the actual logic
    content = content.replace(
      '  return ""',
      '  const tags = CATEGORY_TAGS[handle]\n  if (!tags) return ""\n  return tags'
    )
    writeFileSync(pqPath, content)
    console.log("  ✓ getPseudoQuery() ENABLED")
  } else if (content.includes("return tags")) {
    console.log("  Already enabled")
  }

  console.log("\nDone. Pseudo-query is now enabled for category browsing.")
  console.log("Category pages will use top-tag pseudo-queries for relevance ranking.")
}

main().catch(console.error)
