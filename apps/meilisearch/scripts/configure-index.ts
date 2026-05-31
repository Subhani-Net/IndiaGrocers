/**
 * MeiliSearch Index Configuration Script
 *
 * Creates/updates the "products" index with correct searchable,
 * filterable, and sortable attributes. Uploads the synonym dictionary.
 *
 * Run: npm run configure (from apps/meilisearch) or
 *      npx tsx apps/meilisearch/scripts/configure-index.ts (from root)
 */

import {
  getProductsIndex,
  buildMeiliSearchSynonyms,
  PRODUCTS_INDEX,
} from "../src/index"

async function main() {
  console.log(`Configuring MeiliSearch index: ${PRODUCTS_INDEX}\n`)

  const index = await getProductsIndex()

  // 1. Set searchable attributes
  console.log("Setting searchable attributes...")
  await index.updateSearchableAttributes([
    "title",
    "description",
    "handle",
    "subtitle",
    "category_name",
    "metadata.brand_slug",
    "metadata.synonyms",
    "metadata.allergens",
    "metadata.dietary_flags",
    "tags",
    "collection_title",
  ])
  console.log("  ✓ searchableAttributes updated")

  // 2. Set filterable attributes
  console.log("Setting filterable attributes...")
  await index.updateFilterableAttributes([
    "category_handle",
    "collection_handle",
    "tags",
    "metadata.dietary_flags",
    "metadata.allergens",
    "metadata.regional_tags",
    "metadata.velocity",
    "metadata.brand_slug",
    "metadata.vat_rate",
    "metadata.subscription_eligible",
    "metadata.eco_rating",
    "status",
  ])
  console.log("  ✓ filterableAttributes updated")

  // 3. Set sortable attributes
  console.log("Setting sortable attributes...")
  await index.updateSortableAttributes([
    "price_gbp",
    "created_at",
    "weight_grams",
    "metadata.velocity",
  ])
  console.log("  ✓ sortableAttributes updated")

  // 4. Set ranking rules
  console.log("Setting ranking rules...")
  await index.updateRankingRules([
    "words",
    "typo",
    "proximity",
    "attribute",
    "metadata.velocity:desc",
    "sort",
    "exactness",
  ])
  console.log("  ✓ rankingRules updated")

  // 5. Upload synonyms
  console.log("Uploading synonym dictionary...")
  const synonyms = buildMeiliSearchSynonyms()
  await index.updateSynonyms(synonyms)
  console.log(`  ✓ ${Object.keys(synonyms).length} synonym pairs uploaded\n`)

  console.log("✅ MeiliSearch index configured successfully.")
  console.log(`   Search at: ${process.env.MEILISEARCH_HOST || "http://localhost:7700"}`)
}

main().catch((err) => {
  console.error("❌ Configuration failed:", err.message)
  process.exit(1)
})
