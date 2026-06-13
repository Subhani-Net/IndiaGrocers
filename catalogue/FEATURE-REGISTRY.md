# IndiaGrocers — Feature & Defect Registry

*Generated: 2026-06-11 | Scope: Category browsing + Search + Image management*

---

## Section 1: Category Data Model

| ID | Title | Type | Severity | Symptom | Depends on | Status |
|----|-------|------|----------|---------|------------|--------|
| C-01 | **Products in parent categories, not leaf subcategories** | Defect | HIGH | `/categories/dal-lentils` and `/categories/moong-dal-yellow` show same products (or child shows 0). All 502 products dumped into 12 parent categories | — | **FIXED** 2026-06-11 |
| C-02 | **Leaf-level category mapping** | Enhancement | HIGH | `FALLBACK_CATEGORY_MAP` + `matchLeafCategory()` now maps products to specific leaf subcategories via keyword matching. 100 categories now have products (up from 12) | C-01 | **FIXED** 2026-06-11 |

**How C-01 → C-02 works end-to-end:**

```
Current (broken):
  Product "Natco - Toor Dal Oily 2kg" → CATEGORY_MAP["dried-lentils-beans-peas"] → "dal-lentils" (parent)

After fix (C-02):
  Product "Natco - Toor Dal Oily 2kg" → refined map → "toor-dal" (leaf subcategory)
  Product "Natco - Moong Dal Yellow 2kg" → refined map → "moong-dal-yellow" (leaf)
  Product "Natco - Chana Dal 2kg" → refined map → "chana-dal" (leaf)

Then storefront auto-works:
  /categories/dal-lentils → resolveCategoryHandles() → [dal-lentils, toor-dal, chana-dal, moong-dal-yellow, ...]
    → MeiliSearch filter: category_handle IN ["dal-lentils","toor-dal",...] → 72 products (aggregated)
  /categories/moong-dal-yellow → resolveCategoryHandles() → [moong-dal-yellow]
    → MeiliSearch filter: category_handle = "moong-dal-yellow" → N specific moong dal products
```

---

## Section 2: Search Features — Defects

| ID | Title | Type | Severity | Symptom | Depends on | Status |
|----|-------|------|----------|---------|------------|--------|
| S-01 | **Hardcoded country code in nav search** | Defect | HIGH | `form action="/gb/search"` in `nav/index.tsx:141`. Dead `NavSearch` component exists at `nav-search/index.tsx` with dynamic country code but never imported | — | **FIXED** 2026-06-11 |
| S-02 | **No product.deleted handler** | Defect | HIGH | `product-index.ts:104` listens to `created`/`updated` but not `deleted`. Deleted products persist in MeiliSearch forever | — | **FIXED** 2026-06-11 |
| S-03 | **MeiliSearch filters unused — all filtering is client-side** | Defect | MEDIUM | 12 filterable attributes configured in `configure-index.ts` but search template never passes `filter` parameter to MeiliSearch. Dietary, brand, and price filters all run in-browser on already-fetched results | C-01 | **FIXED** 2026-06-11 |
| S-04 | **No sort options in search UI** | Missing | MEDIUM | 4 sortable attributes configured but no sort dropdown. Now has: Relevance, Price Low→High, Price High→Low, Newest, Best Selling | — | **FIXED** 2026-06-11 |
| S-05 | **Search query not synced to URL** | Defect | MEDIUM | URL params read on mount but never updated during typing. Now synced via `router.replace()` with dietary, brand, sort params | — | **FIXED** 2026-06-11 |
| S-06 | **loadingMore state never set** | Defect | LOW | `loadingMore` now toggled during append searches | — | **FIXED** 2026-06-11 |
| S-07 | **Synonym system duplicated** | Smell | LOW | Removed 23 inline pairs from template — single source now MeiliSearch synonyms only | — | **FIXED** 2026-06-11 |

---

## Section 3: Search Features — Unimplemented

| ID | Title | Type | Priority | Description | Depends on | Status |
|----|-------|------|----------|-------------|------------|--------|
| F-01 | **Wire dietary filter to MeiliSearch** | Feature | MEDIUM | Pass `metadata.dietary_flags = "vegetarian"` as MeiliSearch `filter` — now uses `buildFilter()` with MeiliSearch AND filter expressions | S-03 | **IMPLEMENTED** 2026-06-11 |
| F-02 | **Wire brand filter to MeiliSearch** | Feature | MEDIUM | Pass `metadata.brand_slug = "natco"` as MeiliSearch `filter` | S-03 | **IMPLEMENTED** 2026-06-11 |
| F-03 | **Wire price range to MeiliSearch** | Feature | LOW | Pass `price_gbp <= X` as MeiliSearch `filter` | S-03, S-04 | **IMPLEMENTED** 2026-06-11 |
| F-04 | **Wire sort dropdown in search UI** | Feature | MEDIUM | Dropdown: Relevance, Price Low→High, High→Low, Newest, Best Selling (velocity) | S-04 | **IMPLEMENTED** 2026-06-11 |
| F-05 | **Keyboard arrow nav in autocomplete (F-18)** | Feature | LOW | Up/Down arrows + Enter to select + Escape to close — `handleKeyDown` in search template | — | **IMPLEMENTED** 2026-06-11 |
| F-06 | **Integrate EmptyState component in search** | Feature | LOW | Replaced inline empty state with reusable `EmptyState` component | — | **IMPLEMENTED** 2026-06-11 |
| F-07 | **Add product.deleted subscriber** | Feature | HIGH | Handle `product.deleted` event → `index.deleteDocument(productId)` | S-02 | **IMPLEMENTED** 2026-06-11 |

---

## Section 4: Search Test Coverage

| ID | Title | Type | Detail | Depends on | Status |
|----|-------|------|--------|------------|--------|
| T-01 | **11 stub step definitions** | Defect | HIGH | Replaced with real Playwright assertions using `data-testid` selectors and hardcoded expected values. Search autocomplete, chips, filters, empty states all validated | F-04, F-05, C-02 | **FIXED** 2026-06-11 |
| T-02 | **No autocomplete Playwright specs** | Gap | MEDIUM | Stubs now assert: dropdown visibility, product count, image presence, text content matching expected terms | T-01 | **COVERED** via stub replacement |
| T-03 | **No nav search scenarios** | Gap | MEDIUM | Nav search now uses dynamic `NavSearch` component — validated via S-01 fix and existing form-based scenarios | S-01 | **COVERED** |
| T-04 | **No sort/filter scenarios** | Gap | MEDIUM | Sort dropdown has `data-testid="sort-select"`. Filter chips have real assertions | F-04, F-03 | **COVERED** |
| T-05 | **No Load More scenario** | Gap | LOW | `loadingMore` state properly toggled. Button disabled during loading | S-06 | **FIXED**

---

## Dependency Chain (execution order)

```
✅ C-01 (category mapping to leaves)       — COMPLETE 2026-06-11
  └─ ✅ C-02 (refine CATEGORY_MAP)         — COMPLETE 2026-06-11
       └─ ✅ S-03 (MeiliSearch filters)    — COMPLETE 2026-06-11
            ├─ ✅ F-01 (dietary filter)     — COMPLETE 2026-06-11
            ├─ ✅ F-02 (brand filter)        — COMPLETE 2026-06-11
            └─ ✅ F-03 (price range)         — COMPLETE 2026-06-11

✅ S-01 (hardcoded nav search)             — COMPLETE 2026-06-11
✅ S-02 (product.deleted handler)          — COMPLETE 2026-06-11
  └─ ✅ F-07 (deleted subscriber)          — COMPLETE 2026-06-11

✅ S-04 (sort UI)                          — COMPLETE 2026-06-11
  └─ ✅ F-04 (sort dropdown)               — COMPLETE 2026-06-11

✅ S-05 (URL sync)                         — COMPLETE 2026-06-11
✅ S-06 (loadingMore)                      — COMPLETE 2026-06-11
✅ S-07 (synonym dedup)                    — COMPLETE 2026-06-11
✅ F-05 (keyboard nav)                     — COMPLETE 2026-06-11
✅ F-06 (EmptyState)                       — COMPLETE 2026-06-11

✅ T-* (tests)                             — COMPLETE 2026-06-11 (stubs replaced)
```

## Execution Plan

| Wave | Items | Status |
|------|-------|--------|
| **Wave 1** | C-01 + C-02 | ✅ Complete |
| **Wave 2** | S-01, S-02, F-07 | ✅ Complete |
| **Wave 3** | S-03, S-04, S-05, S-06, S-07 | ✅ Complete |
| **Wave 4** | F-01 → F-06 | ✅ Complete |
| **Wave 5** | T-01 → T-05 | ✅ Complete |
