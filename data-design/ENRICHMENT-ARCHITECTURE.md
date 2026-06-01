# Holistic Enrichment Architecture

> **Role**: Data Architect  
> **Scope**: Complete data enrichment pipeline — from Natco Shopify source to MeiliSearch index to storefront experience  
> **Impact**: Search relevance, category display, dietary filtering, vernacular language support

---

## 1. Current State — What's Broken

```
NATCO SHOPIFY                    MEILISEARCH                       SEARCH BAR
─────────────────────────────────────────────────────────────────────────────
Spices: 134 products             265 documents indexed            User types "jeera"
  Tags: jeera, dhaniya,           Tags field: EMPTY               → 0 results
  haldi, mirch, kali mirch,     Dietary: EMPTY on most           → no synonym hint
  dalchini, laung, hing,        Eco rating: NOT INDEXED          → relevant product not found
  elaichi, saunf, amchur...

Lentils: 79 products             Dietary filters: NONE
  Tags: chana, rajma,            Synonym hints: NOT USED
  masoor, toor, moong...        Category relevance: MEDIOCRE
  Dietary: ALL are vegan,
  high-protein, gluten-free
```

**Root cause**: The data we collected from Natco (tags, dietary flags, eco ratings) stays in `data-design/*.csv` files. It never reaches the search index.

---

## 2. Target Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        NATCO SHOPIFY                             │
│  (Source: all products, tags, dietary claims, eco ratings)       │
│  Collected into data-design/*.csv                                │
└────────────────────────┬─────────────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │  ENRICHMENT ENGINE  │
              │  (enrich.mjs)       │
              │                     │
              │  Reads CSV          │
              │  → Updates Medusa:  │
              │    • tags           │
              │    • dietary_flags  │
              │    • allergens      │
              │    • eco_ratings    │
              │    • categories     │
              └──────────┬──────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
  ┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
  │   MEDUSA     │ │MEILISEARCH│ │ SUBSCRIBER │
  │  (source of  │ │ (search   │ │ (auto-     │
  │   truth)     │ │  index)   │ │  reindex)  │
  │              │ │           │ │            │
  │ tags ✓       │ │ tags ✓    │ │ on update  │
  │ dietary ✓    │ │ dietary ✓ │ │ → reindex  │
  │ allergens ✓  │ │ allergens✓│ │            │
  │ eco ✓        │ │ eco ✓     │ │            │
  └──────────────┘ └────┬──────┘ └────────────┘
                        │
               ┌────────▼──────────┐
               │   STOREFRONT      │
               │                   │
               │ Search "jeera"    │
               │ → MeiliSearch     │
               │ → finds "cumin"   │
               │ → shows tag hint  │
               │                   │
               │ Filter: Vegan     │
               │ → dietary_flags   │
               │                   │
               │ Category display  │
               │ → relevance order │
               └───────────────────┘
```

---

## 3. Layer-by-Layer Changes

### Layer 1 — MeiliSearch Index Schema

**File**: `apps/meilisearch/scripts/configure-index.ts`

| Attribute | Type | Before | After |
|-----------|------|--------|-------|
| tags | **searchable** | Not indexed | ✓ Added |
| metadata.dietary_flags | **filterable** | Not indexed | ✓ Added |
| metadata.dietary_flags | **searchable** | Not indexed | ✓ Added |
| allergens | **filterable** | Not in index | ✓ Added |
| metadata.eco_rating | **filterable** | Not indexed | ✓ Added |

### Layer 2 — MeiliSearch Document

**Files**: `apps/meilisearch/scripts/reindex-products.ts`, `apps/backend/src/subscribers/product-index.ts`

New fields in `IndexDocument`:
```typescript
{
  // Existing
  id, title, handle, description, price_gbp, weight_grams,
  category_handle, category_name, collection_title, collection_handle,
  
  // NEW
  tags: string[],              // From product.tags[].value
  dietary_flags: string[],     // From metadata.dietary_flags
  allergens: string[],         // From metadata.allergens
  eco_rating: string,          // From metadata.eco_rating (e.g., "A", "B")
  eco_carbon: string,          // From metadata.eco_carbon
  eco_water: string,           // From metadata.eco_water
}
```

### Layer 3 — Enrichment Engine

**New file**: `scripts/enrich-from-csv.mjs`

What it does:
1. Reads `data-design/spices-master.csv` + `lentils-master.csv` + `tinned-products-master.csv`
2. For each product with `in_catalog=YES`:
   - Update tags in Medusa (from CSV's tags column)
   - Update dietary_flags in metadata (inferred from product type)
   - Update allergens in metadata
   - Assign to correct natco_subcategory
3. Idempotent — safe to re-run

**Dietary flag rules** (auto-inferred):
```
IF natco_type IN (Lentils, Beans, Spices, Herbs, Soya):
  dietary = [vegan, vegetarian, dairy-free, high-protein, high-fibre, low-fat, gluten-free, no-added-sugar, halal]

IF natco_type IN (Tinned Lentils, Tinned Vegetables, Tinned Fruit):
  dietary = [vegan, vegetarian, dairy-free, gluten-free, low-fat]

IF natco_type IN (Daria Lentil Snack):
  dietary = [vegan, vegetarian, high-protein, gluten-free]

EXCEPTIONS:
  Bhel Puri Kit → NOT gluten-free (contains wheat flour)
  Food Colourings → NOT natural (contains E-numbers)
```

### Layer 4 — Storefront Search

**File**: `apps/storefront/src/modules/search/templates/index.tsx`

Changes:
1. After MeiliSearch returns, check for synonym resolution
2. Show "Showing results for dhaniya (coriander)" hint
3. Show dietary filter chips (Vegan, High-Protein, Gluten-Free)
4. Show vernacular term matches in autocomplete results

### Layer 5 — Category Display

Already working. `resolveCategoryHandles` → MeiliSearch `IN` filter → products shown in relevance order. No changes needed here — the enrichment makes the data correct, category display follows.

---

## 4. Implementation Order

```
1. Expand MeiliSearch schema (configure-index.ts)
   └─ Add tags, dietary, allergens, eco to searchable/filterable

2. Update MeiliSearch document (reindex-products.ts + product-index.ts)
   └─ Include tags, dietary_flags, allergens, eco_rating in IndexDocument

3. Create enrichment engine (enrich-from-csv.mjs)
   └─ Reads data-design CSVs → applies tags, dietary, categories to Medusa

4. Run enrichment (trigger subscriber → auto-reindex to MeiliSearch)

5. Update storefront search template
   └─ Synonym hints, dietary filter chips

6. Validate end-to-end
   └─ Search "jeera" → finds cumin ✓
   └─ Filter "Vegan" → only plant-based products ✓
   └─ Browse categories → products grouped correctly ✓
```

---

## 5. Impact Assessment

| Data Layer | What Changes | Risk | Rollback |
|------------|-------------|------|----------|
| MeiliSearch config | New searchable/filterable attributes | Low — additive only | Re-run configure-index.ts with old fields |
| MeiliSearch documents | New fields per document | Low — additive | Re-run reindex with old fields |
| Medusa products | Tags, metadata updated | Medium — modifies product data | Restore from snapshot (scripts/snapshot.js restore) |
| Storefront search | UI changes for hints/filters | Low — UI only | Revert component |
| Category display | No changes | None | N/A |

---

## 6. Data Flow Verification

After implementation, verify each path:

```
TEST 1: Hinglish search
  Input: "jeera" → Expected: Cumin Seeds/cumin products found
  Input: "dhaniya powder" → Expected: Coriander Powder found
  Input: "haldi" → Expected: Turmeric Powder found
  Input: "chana" → Expected: Chick Peas products found

TEST 2: Dietary filter
  Filter: Vegan → Expected: No dairy/meat products
  Filter: Gluten-Free → Expected: No atta/noodle/bread products

TEST 3: Category browsing
  /categories/spices → All 138 spice products in relevance order
  /categories/spices-herbs → Only whole/ground spices (not jars)
  /categories/lentils → All lentils including tinned variants
  /categories/tinned-products-parent → Only tinned products

TEST 4: Synonym hints
  Search "basamti" → Results for "basmati" with typo correction notice
  Search "chana" → Results with "Also shows: chickpeas, garbanzo" hint
```

---

## 7. Design Principles & Features

### DP-01: Search Ordering via Pseudo-Query

**Document**: `data-design/SEARCH-ORDERING-PSEUDO-QUERY.md`

When browsing a category with no user search term, MeiliSearch receives a pseudo-query built from the top 15 most frequent tags across products in that category. Products matching more tags score higher → automatic, self-maintaining relevance ordering without manual curation.

Scales to multi-brand catalogs. Works for vernacular terms (haldi, jeera, chana) without language-specific logic.

### DP-02: Many-to-Many Collections

**Document**: `data-design/DECISION-TREE.md` (ENH-01)

Products can belong to multiple collections (brand + use-case + seasonal). Medusa v2 core supports only one-to-one (collection_id field). Requires custom link module. Deferred.

### DP-03: Variant Consolidation

Natco Shopify lists each weight as a separate product. In Medusa, same-base products should be consolidated as variants (500g, 1kg, 2kg under one parent). Reduces product count ~40%. Recorded in `data-design/lentils-master.csv`.

### DP-04: Eco-Rating Badges

29 products have Foundation Earth eco-impact data (A-E ratings across carbon, water, pollution, biodiversity dimensions). Data stored in product metadata. Storefront display not yet implemented.

### DP-05: Dietary Filter System

Vegan, vegetarian, gluten-free, organic flags inferred from product type + tags. Enriched into `metadata.dietary_flags`. MeiliSearch configured for filterable. Storefront filter chips not yet implemented.

### DP-06: Brand-Prefixed Titles

Product titles should include brand prefix ("Natco Basmati Rice 5kg" vs "Basmati Rice 5kg") for visual browsing distinction and implicit search filtering. ✅ Applied — all 357 Natco products prefixed "Natco - ".

### DP-07: Multi-Brand Catalog

Products from multiple brands (Natco, TRS, Haldiram) coexist under the same category taxonomy. Categories are brand-agnostic — browsing `/categories/spices-herbs` shows both Natco and TRS spices. Brand filtering via `brand_slug` metadata + title prefix search.

### DP-08: Shared Enrichment Rules

Dietary, allergen, and tag inference rules apply uniformly across brands. A TRS lentil gets the same vegan/high-protein flags as a Natco lentil. Rules engine (`enrich-from-csv.mjs`) operates on product type + title + category, not brand.

### DP-09: Brand-Segregated Images

Images follow `{brand}_{product-handle}.{ext}` convention. Natco = `natco_*.jpg`, TRS = `trs_*.png`. No filename collisions between brands. Image download/rename scripts are per-brand.

---

## 8. File Index

| Document | Purpose |
|----------|---------|
| `ENRICHMENT-ARCHITECTURE.md` | This file — complete pipeline overview |
| `SEARCH-ORDERING-PSEUDO-QUERY.md` | DP-01 — category browsing relevance design |
| `SEARCH-CATEGORY-ARCHITECTURE.md` | Search vs category data flow |
| `DATA-ANALYSIS-MASTER.md` | Combined Natco product analysis summary |
| `natco-product-attributes-analysis.md` | Deep dive: tags, dietary, eco, variants |
| `spices-collection-summary.md` | Spices collection tag frequencies |
| `*-master.csv` (7 files) | Per-collection product data |
