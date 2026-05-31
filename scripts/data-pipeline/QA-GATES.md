# QA Gate — Catalog Completeness Verification

> **Role**: QA Manager  
> **Purpose**: Prevent work on incomplete data. Must pass BEFORE any enrichment, category assignment, or search configuration begins.

---

## The Rule

**Never proceed to Phase 2 (enrichment, categories, search) until Phase 1 (catalog completeness) is verified and signed off.**

We wasted hours enriching 265 products with dietary flags and tags, only to discover at the end that 100+ Natco products were never imported. This gate prevents that.

---

## Phase 1 — Catalog Import Gate

### Step 1.1: Import all products
```
Source: Natco Shopify JSON (data-design/*.csv or direct Shopify API)
Target: Medusa DB
Method: scripts/import-from-shopify.mjs
```

### Step 1.2: Run completeness audit
```bash
node scripts/audit-catalog-completeness.mjs
```

### Step 1.3: Verify — ALL must pass

| Check | Target | Actual | Pass? |
|-------|--------|--------|-------|
| Products in DB | ≥ Shopify count | ___ | ☐ |
| Products with category | = Products in DB | ___ | ☐ |
| Products with thumbnail | ≥ 95% | ___ | ☐ |
| Products with price | = Products in DB | ___ | ☐ |
| No old category handles in MeiliSearch | 0 | ___ | ☐ |

### If ANY fails: STOP. Fix imports. Re-audit. Do NOT proceed.

---

## Phase 2 — Enrichment Gate

### Step 2.1: Apply enrichment
```bash
node scripts/enrich-from-csv.mjs --apply
```

### Step 2.2: Verify enrichment
```bash
node scripts/verify-data-health.mjs
```

| Check | Minimum | Actual | Pass? |
|-------|---------|--------|-------|
| Products with dietary flags | ≥ 80% of DB | ___ | ☐ |
| Products with tags | ≥ 50% of DB | ___ | ☐ |

### If ANY fails: Fix enrichment. Re-run. Do NOT proceed.

---

## Phase 3 — Category Assignment Gate

### Step 3.1: Assign categories
```bash
node scripts/assign-categories.mjs
```

### Step 3.2: Verify categories
```bash
node scripts/verify-data-health.mjs
```

| Check | Target | Actual | Pass? |
|-------|--------|--------|-------|
| Products with category_handle | = Products in DB | ___ | ☐ |
| No forbidden old handles | 0 | ___ | ☐ |
| Category count matches Shopify | Per-category match | ___ | ☐ |

### If ANY fails: Fix assignments. Re-index. Do NOT proceed.

---

## Phase 4 — Search Configuration Gate

### Step 4.1: Configure MeiliSearch
```bash
cd apps/meilisearch && npm run configure && npm run reindex
```

### Step 4.2: Verify search
```bash
node scripts/verify-data-health.mjs
```

| Check | Target | Actual | Pass? |
|-------|--------|--------|-------|
| MeiliSearch product count = DB count | Exact match | ___ | ☐ |
| Facet distribution shows only valid handles | 0 forbidden | ___ | ☐ |
| Search "jeera" returns results | > 0 | ___ | ☐ |
| Search "haldi" returns results | > 0 | ___ | ☐ |

### If ANY fails: Fix. Do NOT start storefront testing.

---

## Phase 5 — Storefront Validation

Only when ALL previous gates are GREEN.

### Step 5.1: Browse each category
```
/gb/categories/spices      → shows 60+ products, ordered by relevance
/gb/categories/lentils     → shows 40+ products
/gb/categories/grains      → shows 30+ products
/gb/categories/essentials  → shows oils, ghee, sugar
```

### Step 5.2: Search tests
```
"jeera"     → cumin products
"haldi"     → turmeric products
"chana"     → chickpea products
"basmati"   → rice products
"basan"     → besan (typo → gram flour)
```

### Step 5.3: Edge cases
```
/gb/categories/non-existent    → 404 page
/gb/search?q=                  → "Start typing" message
Empty cart                     → "Your cart is empty"
```

---

## Execution Flow

```
PHASE 1: Import → audit-catalog-completeness → ALL GREEN? → YES: proceed
                                                           → NO: fix imports, re-audit

PHASE 2: Enrich → verify-data-health → ALL GREEN? → YES: proceed
                                                      → NO: fix enrichment, re-run

PHASE 3: Categories → verify-data-health → ALL GREEN? → YES: proceed
                                                          → NO: fix assignments, re-index

PHASE 4: MeiliSearch → verify-data-health → ALL GREEN? → YES: proceed
                                                            → NO: fix, re-configure, re-index

PHASE 5: Storefront testing → per-category + per-search checks
```

---

## How This Scales to Larger Catalogs

| Catalog | Phase 1 duration | Phase 1 checks |
|---------|-----------------|----------------|
| Natco (~350 products) | 5 min import + 1 min audit | DB count = Shopify count |
| TRS (~50 products) | 1 min import + 30 sec audit | Same |
| Haldiram (~200+ products) | 5 min import + 1 min audit | Same |
| Multiple brands | Per-brand import + combined audit | DB count = sum of all Shopify counts |

Each brand is independently verifiable. The audit script becomes the single source of truth for "are we done?"

---

## Audit Script Spec

`scripts/audit-catalog-completeness.mjs` must:
1. Count products in DB via Medusa Admin API
2. Count products in each data-design/*.csv
3. Count products in MeiliSearch
4. Compare: DB vs CSV vs MeiliSearch
5. Report gaps per category
6. Return exit code 1 if ANY gap exists (so CI/CD can catch it)
