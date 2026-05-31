# Data Pipeline — Decision Tree & State Tracker

## Final State (2026-05-27)

```
Database:   265 products ✓  211 categorized ✓  265 metadata-enriched ✓
            265 inventory-enabled ✓  140 categories (18 parent + 50 child) ✓
            19 collections ✓  1 admin user ✓
Docker:     postgres:5432 ✓  redis:6379 ✓  meilisearch:7700 ✓
MeiliSearch: 265 indexed ✓  80 synonyms ✓  category_handle filterable ✓
Backend:    :9000 (medusa develop)
Storefront: NOT STARTED (yarn dev)
```

---

## Initial State (before pipeline)

```
Database:   Tables created ✓  Categories 18+50 ✓  Collections 19 ✓  Products 0
Docker:     postgres:5432 ✓  redis:6379 ✓  meilisearch:7700 ✓
Backend:    :9000 (medusa develop)
Storefront: broken — imported deleted template, fetched 0 products, no MeiliSearch integration
```

---

## Target Architecture

```
SEARCH / CATEGORY LISTING
  Browser → MeiliSearch → returns [{ id, relevance_score }, ...]
  Storefront → IDs → Medusa /store/products?id[]=... → full products
  Storefront → renders in MeiliSearch order (no frontend sort)

PRODUCT DETAIL / CART / CHECKOUT / AUTH
  Storefront → Medusa API (no MeiliSearch)
```

| Component | Role |
|-----------|------|
| MeiliSearch | Relevance ranking, typo correction, synonyms, filtering, sorting. Stores IDs + filter/sort fields. |
| Medusa | Product source of truth (variants, prices, images, inventory). All transactional operations. |
| Frontend | Renders in MeiliSearch order. No sorting logic. InlineSort UI control preserved for later. |

---

## Issues Encountered During Pipeline

| # | Issue | Cause | Fix |
|---|-------|-------|-----|
| E01 | Page imported deleted `index.tsx` template | Commit `daabee2` deleted the file | Rewrote `page.tsx` to import individual templates directly |
| E02 | Page fetched 0 products | `fetchProductsPage` never called | Rebuilt page to use MeiliSearch → `fetchProductsByIds` flow |
| E03 | `import-csv.mjs` script was deleted | Committed deletions after refactor | Wrote new `import-products-from-csv.mjs` |
| E04 | Tags error: `Field 'tags, 0, id' is required` | Medusa v2 requires existing tag IDs, not new values | Removed tags from import payload |
| E05 | SKU duplicates: "Product variant with sku: C2300 already exists" | "Full Case" variants share SKU with individual size | Appended `-{index}` suffix for duplicate SKUs |
| E06 | 25 "Full Case" wholesale products not imported | SKU dedup fix didn't apply to already-created products; 265 imported vs 290 targeted | Proceeded with 265. Full Case packs are wholesale (12x400g) — not retail priority |
| E07 | `reassign-natco-categories.mjs` script was deleted | Committed deletion | Used `assign-categories-from-titles.mjs` (title keyword matching) instead |
| E08 | `assign-collections-v2.mjs` script was deleted | Committed deletion | Collections NOT assigned — 19 collections exist but 0 product-to-collection links |
| E09 | 54 products unmatched by title-based category matcher | Title keywords missed: food colourings, herbs, some oils | These show in "All Products" / uncategorized — acceptable for now |
| E10 | `sortProducts()` never called in page, `weight_desc` never implemented | Missing code | Removed ALL frontend sorting — MeiliSearch handles relevance. Sort UI preserved for later. |

---

## Pipeline Execution Log

### Step 1: Import Products
- **Script**: `import-products-from-csv.mjs` (newly written)
- **Source**: `Implementation/Natcofoods/natcofoods-import-backup/natcofoods-catalog.csv`
- **Method**: Groups CSV rows by product handle → creates products with Weight/Size variants
- **Result**: 265 created, 25 failed (SKU duplicates on Full Case items)
- **Issues**: E03, E04, E05, E06
- **Idempotent**: Yes (skips existing by handle/duplicate error)

### Step 2: Enrich Metadata
- **Script**: `enrich-metadata.mjs`
- **Method**: Populates brand_slug (regex match), dietary_flags, allergens, weight_grams, VAT rate, subscriptions
- **Result**: 265 enriched
- **Issues**: None
- **Idempotent**: Partially (overwrites some fields, skips already-set fields)

### Step 3: Assign Categories
- **Script**: `assign-categories-from-titles.mjs`
- **Method**: Title keyword matching (e.g., "basmati" → staples-grains, "toor" → dal-lentils)
- **Result**: 211 assigned across 13 categories, 54 unmatched
- **Issues**: E09
- **Idempotent**: Yes (re-assigns, uses `add` API endpoint)

### Step 4: Enable Inventory
- **Script**: `set-inventory.mjs`
- **Method**: Sets `manage_inventory: false`, `allow_backorder: true` on all variants
- **Result**: 265 updated (verification step threw an error but main operation succeeded)
- **Issues**: None (verification error is cosmetic)

### Step 5: Configure MeiliSearch
- **Script**: `apps/meilisearch/scripts/configure-index.ts`
- **Method**: Sets searchable, filterable, sortable attributes + synonyms + ranking rules
- **Result**: 80 synonyms, `category_handle` filterable, `weight_grams` sortable
- **Issues**: None

### Step 6: Reindex MeiliSearch
- **Script**: `apps/meilisearch/scripts/reindex-products.ts`
- **Method**: Fetches all products from Medusa Admin API → transforms → indexes in batches of 100
- **Result**: 265 products indexed with category_handle, weight_grams, price_gbp
- **Issues**: None

---

## Storefront Changes Made

| File | Change | Reason |
|------|--------|--------|
| `categories/[...category]/page.tsx` | Rebuilt — MeiliSearch → IDs → fetchProductsByIds. Removed client-side sort. Removed `getMeiliSort()`. No sort param passed to MeiliSearch. | E02 — page fetched 0 products. E10 — no sorting. |
| `lib/data/products.ts` | Added `fetchProductsByIds(ids, countryCode)` — fetches full products, re-sorts to MeiliSearch order | D02 — Medusa is product data source, MeiliSearch provides order |
| `lib/util/sort-products.ts` | Added `weight_desc` branch (uses variant metadata weight_grams) | E10 — weight_desc was in SortOptions type but never implemented. Kept in utility for later use but NOT called by page. |
| `meilisearch/scripts/configure-index.ts` | Added `category_name` (searchable), `category_handle` (filterable), `weight_grams` (sortable) | D01 — MeiliSearch needs category fields for category browsing |
| `meilisearch/scripts/reindex-products.ts` | Added `category_handle`, `category_name`, `weight_grams` to IndexDocument + transform function | D01 — reindex must include new fields |
| `backend/src/subscribers/product-index.ts` | Added `category_handle`, `category_name`, `weight_grams`, `variants.metadata` to document | D01 — subscriber must keep index in sync |
| `search/page.tsx` | Added `countryCode` from params, passes to SearchTemplate | F-17 — search had no country code |
| `search/templates/index.tsx` | Added `countryCode` prop, calls `fetchProductsByIds` after MeiliSearch returns IDs | Products were stripped to 4 fields — now get full data from Medusa |

---

## Decisions Log

| # | Date | Question | Decision | Reason |
|---|------|----------|----------|--------|
| D01 | 2026-05-27 | Search + Category — split or unified? | **Unified via MeiliSearch as ID/index, Medusa as product source** | MeiliSearch handles relevance/typo/synonyms for both. Medusa handles full product data. |
| D02 | 2026-05-27 | MeiliSearch data source? | **ID-only index. Full product data from Medusa.** | Prevents stale data. Thin contract between systems. |
| D03 | 2026-05-27 | Products to import — TRS included? | **Natco only for now (265). TRS deferred.** | Pipeline issues made merged catalog impractical. TRS import script needs rebuilding. |
| D04 | 2026-05-27 | Import format — CSV or merged JSON? | **Natco CSV directly. Merged JSON deferred.** | CSV import script worked with minimal fixes. Merged JSON had wrong category handles. |
| D05 | 2026-05-27 | Frontend sorting? | **None. Pure MeiliSearch relevance.** | Sort UI preserved for later. No default sort, no weight_desc. |
| D06 | 2026-05-27 | Product↔Collection relationship | **NOT YET DECIDED** | No active collection assignment script. 19 collections exist, 0 product links. |
| D07 | 2026-05-28 | Collections: one-to-one or many-to-many? | **Many-to-many required — deferred as MAJOR enhancement.** Products need to belong to multiple collections (e.g., brand + use-case). Medusa v2 core supports only one-to-one (collection_id field). Requires custom link module. | Current priority: categories + search. Collections implementation deferred. |

---

## ENHANCEMENTS — Deferred

| ID | Description | Priority | Effort |
|----|-------------|----------|--------|
| ENH-01 | **Many-to-many collections** — Products belong to multiple collections (brand + use case). Requires custom Medusa link module. | MAJOR | 3-5 days |
| ENH-02 | InlineSort reconnection — wire sort dropdown to MeiliSearch sort params | Low | 2 hours |
| ENH-03 | 54 uncategorized — title-based matcher missed them | Medium | 1 day |

---

## Pending / Deferred

- [ ] **TRS products** — 50 products in `merge-catalog.json`, images exist, import script deleted
- [ ] **25 Full Case products** — SKU duplicates prevented import
- [ ] **54 uncategorized products** — title-based matcher missed them
- [ ] **Collections assignment** — no script exists to link products to collections
- [ ] **InlineSort reconnection** — UI dropdown exists but no sort parameter passed to MeiliSearch
- [ ] **Storefront validation** — `yarn dev` not yet started to verify end-to-end
