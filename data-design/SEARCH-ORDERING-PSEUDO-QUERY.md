# Search Ordering — Pseudo-Query Design

> **Status**: Design principle — NOT IMPLEMENTED  
> **Category**: Search & Display Architecture  
> **Priority**: HIGH — blocks proper category browsing UX  
> **Date**: 2026-05-30

---

## Problem

When browsing a category (no user search term, `q=""`), MeiliSearch has no relevance signal to score products against. Products return in arbitrary/default insertion order. This creates a poor browsing experience — products appear randomly rather than in a relevant, organized sequence.

Traditional solutions (manual curation, alphabetical sort, weight sort) don't scale to multi-brand catalogs with thousands of products.

---

## Solution: Pseudo-Query from Category Tags

### Concept

Instead of sending `q=""` to MeiliSearch, construct a **pseudo-query** from the most frequent tags across all products in the browsed category. MeiliSearch scores each product against this pseudo-query — products matching more category-relevant tags rank higher.

### Signal Composition

| Signal | Weight | Source | How |
|--------|--------|--------|-----|
| **Category top tags** | Primary | `data-design/*.csv` tag columns | Top 15 most frequent tags in category → concatenated as pseudo-query |
| **Velocity** | Tiebreaker | `metadata.velocity` (A/B/C) | Fast-movers (A) rank above slow-movers (C) |
| **Title match** | Built-in | MeiliSearch `attribute` rule | Title matches score higher than tag/description matches |

### Example

```
Category: "Spices & Herbs" (spices-herbs)
Top tags by frequency: chilli(12), turmeric(10), cumin(8), coriander(8), pepper(6),
                       garam masala(5), cardamom(4), haldi(4), jeera(4), dhaniya(4),
                       cinnamon(3), cloves(3), hing(3), paprika(3), curry(3)

Pseudo-query: "chilli turmeric cumin coriander pepper garam masala cardamom haldi jeera dhaniya cinnamon cloves hing paprika"
```

**Result ordering:**
1. Products matching "turmeric" + "haldi" + "curcumin" → highest score (3+ matches)
2. Products matching "cumin" + "jeera" → high score
3. Products matching only "spices" or "herbs" → lower score
4. Food colourings (matching none) → lowest score (appear last, which is correct — they're a different sub-type)

### Why It Scales

| Property | Mechanism |
|----------|-----------|
| **Multi-brand** | "Natco Turmeric" and "TRS Turmeric" both have turmeric-related tags → both score well |
| **Multi-language** | Tags contain vernacular terms (haldi, jeera, dhaniya, mirch, kali mirch) → works for Hindi/English/Tamil transliterations |
| **Self-maintaining** | Add new products → tags match category terms → auto-ranks correctly. No manual curation. |
| **Dietary-aware** | Dietary tags (vegan, gluten-free) in pseudo-query → dietary-relevant products surface |
| **Category-specific** | Each category computes its own top tags → spices get spice tags, lentils get lentil tags |

---

## Implementation Plan

### Layer 1: MeiliSearch Ranking Rules

**File**: `apps/meilisearch/scripts/configure-index.ts`

Add velocity as a custom ranking tiebreaker after `attribute`:
```typescript
await index.updateRankingRules([
  "words",
  "typo",
  "proximity",
  "attribute",
  "metadata.velocity:desc",   // NEW: fast-movers before slow-movers
  "sort",
  "exactness",
])
```

### Layer 2: Storefront Category Page

**File**: `apps/storefront/src/app/[countryCode]/(main)/categories/[...category]/page.tsx`

When no user `sortBy` is set:
```typescript
// Compute category pseudo-query from top tags
const categoryQuery = buildPseudoQuery(productCategory, meiliHits)

// Pass as q instead of empty string
const { products: meiliHits } = await searchProducts(categoryQuery, {
  limit: 200,
  filter: categoryFilter,
})
```

### Layer 3: Pseudo-Query Builder

**New utility**: `apps/storefront/src/lib/util/pseudo-query.ts`

```typescript
function buildPseudoQuery(category, products) {
  // 1. Collect all tags from products in this category
  // 2. Count frequency
  // 3. Take top 15
  // 4. Return as space-separated string
  // Falls back to category name if no tags available
}
```

### Layer 4: Velocity Data

Velocity is already set by `enrich-metadata.mjs`:
- A = fast-mover (staples, high-demand items)
- B = mid (seasonal, specialty)
- C = slow (niche, infrequent purchase)

---

## Verification Tests

```
TEST 1: Browse "Spices & Herbs"
  Expected: Whole/ground spices appear first, food colourings/essences later
  Reason: Colourings/essences don't match spice/herb tags → lower score

TEST 2: Browse "Lentils"
  Expected: Chickpeas, lentils appear first, soya products later
  Reason: Lentil tags dominate pseudo-query → lentil/bean products score higher than soya

TEST 3: Browse "Grains"
  Expected: Rice products top, flours next, corn/popcorn last
  Reason: Rice tags most frequent in grains category

TEST 4: Add TRS products later
  Expected: TRS products rank alongside Natco equivalents
  Reason: Both share same tags → same relevance score → no brand bias
```

---

## Dependencies

| Dependency | State |
|-----------|-------|
| Tags in MeiliSearch | Tags field is indexed but tags data is empty on most products (enrichment not yet applied for tags) |
| Velocity in MeiliSearch | `metadata.velocity` is sortable in config, data exists from enrich-metadata |
| Storefront search | `searchProducts()` already accepts query parameter |
| Pseudo-query builder | **New** — needs implementation |

---

## References

- `data-design/ENRICHMENT-ARCHITECTURE.md` — overall enrichment pipeline
- `data-design/SEARCH-CATEGORY-ARCHITECTURE.md` — search/category data flow
- `data-design/spices-collection-summary.md` — tag frequencies for spices
- `apps/meilisearch/scripts/configure-index.ts` — ranking rules config
