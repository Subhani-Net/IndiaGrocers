# IndiaGrocers — Data Pipeline Master Map

> **TEMP FILE — Step 1 of consolidation.** Maps every data script, its purpose,
> dependencies, execution order, and status. Review this, then proceed to Step 2
> (remove redundancy, merge duplicates, make efficient).
>
> Generated: June 2026

---

## PHASE 0 — Infrastructure

| # | Script | Purpose | Input | Output | Depends On |
|---|--------|---------|-------|--------|------------|
| 0.1 | `apps/backend/src/migration-scripts/initial-data-seed.ts` | Creates regions, categories (Natco tree), collections, shipping options, tax config | — | DB tables seeded | `npx medusa exec`|
| 0.2 | Docker: `docker compose up -d` | Starts Postgres, Redis, MeiliSearch | — | Running services | — |
| 0.3 | `npx medusa db:migrate` | Creates DB schema | — | Tables + relationships | 0.2 |

**Order:** 0.2 → 0.3 → 0.1

---

## PHASE 1 — Product Import

### 1A — Natco Products (357 products)

| # | Script | Purpose | Input | Output | Status |
|---|--------|---------|-------|--------|--------|
| 1A.1 | `scripts/import-from-shopify.mjs` | Imports Natco products from Shopify JSON export | Shopify JSON (external) | 357 products in DB | **Active** |
| 1A.2 | `apps/backend/src/seed/merge-product-variants.mjs` | Consolidates weight variants (e.g., "Cumin 500g" + "Cumin 1kg" → single product with variants) | Products from 1A.1 | 290→238 consolidated products | **Active** |

### 1B — TRS Products (50 products)

| # | Script | Purpose | Input | Output | Status |
|---|--------|---------|-------|--------|--------|
| 1B.1 | `scripts/import-trs-products.mjs` | Imports TRS brand products (spices, lentils, grains) | TRS product definitions | 50 TRS products in DB | **Active** |

### 1C — MVC Products (~99 products)

| # | Script | Purpose | Input | Output | Status |
|---|--------|---------|-------|--------|--------|
| 1C.1 | `scripts/mvc/import-round1.mjs` | MVC Round 1: Shan, MDH, Tilda, Kohinoor, Daawat, Lal Qilla, Falak, Elephant Atta, Pillsbury, Aashirvaad, etc. | MVC product definitions | ~99 products in DB | **Active** |
| 1C.2 | `scripts/mvc/import-missing-variants.mjs` | Imports variant-weight products missed in Round 1 | Missing variants list | Additional variants | **Active** |
| 1C.3 | `scripts/mvc/create-categories.mjs` | Creates ~23 MVC category handles (Shan Masalas, MDH Masalas, Loose Leaf Tea, etc.) | Category definitions | New category tree branches | **Active** |

### 1D — CSV Product Import (generic)

| # | Script | Purpose | Input | Output | Status |
|---|--------|---------|-------|--------|--------|
| 1D.1 | `apps/backend/src/seed/import-products-from-csv.mjs` | Generic CSV-to-product importer | CSV file | Products in DB | **Active** |

**Order:** 1A.1 → 1A.2 → 1B.1 → 1C.3 → 1C.1 → 1C.2

---

## PHASE 2 — Category Assignment

| # | Script | Purpose | Input | Output | Status |
|---|--------|---------|-------|--------|--------|
| 2.1 | `apps/backend/src/seed/migrate-to-natco-categories.mjs` | Maps imported products to the new Natco category tree (categories created in 0.1) | Products + category tree | Categories assigned | **Active** |
| 2.2 | `apps/backend/src/seed/assign-categories-from-titles.mjs` | Assigns categories based on product title keyword matching | Product titles | Category assignments | **Active** |
| 2.3 | `apps/backend/src/seed/assign-categories-to-children.mjs` | Assigns child categories to MVC products | Products + child categories | Child category assignments | **Active** |
| 2.4 | `apps/backend/src/seed/fix-category-handles.mjs` | Fixes old/incorrect category handles (legacy migration) | Products with old handles | Corrected handles | **Active** |
| 2.5 | `scripts/fix-tinned-products.mjs` | Fixes tinned product category assignments (were misassigned) | Tinned products | Correct categories | **Active** |
| 2.6 | `apps/backend/src/seed/reset-and-reassign.mjs` | Clears ALL category assignments and reassigns cleanly | All products | Clean category tree | **Active** |

**Order:** 2.6 (optional reset) → 2.1 → 2.2 → 2.3 → 2.4 → 2.5

---

## PHASE 3 — Enrichment

| # | Script | Purpose | Input | Output | Status |
|---|--------|---------|-------|--------|--------|
| 3.1 | `scripts/enrich-from-csv.mjs` | Applies dietary flags, tags, allergens from CSV masters | `data-design/*-master.csv` | Metadata on products | **Active** |
| 3.2 | `apps/backend/src/seed/enrich-metadata.mjs` | Applies additional metadata enrichment | Products | Enriched metadata | **Active** |
| 3.3 | `scripts/mvc/pipeline.mjs` | **Master MVC pipeline**: descriptions, tags, dietary, allergens, synonyms, reindex (orchestrates 3.1 + 3.2 + reindex) | All products | Fully enriched catalog | **Active** (run with `--apply`) |
| 3.4 | `scripts/build-pseudo-queries.mjs` | Builds MeiliSearch pseudo-query tags for category ranking | Categories | Pseudo-query config | **Active** |
| 3.5 | `scripts/mvc/enable-pseudo-query.mjs` | Enables pseudo-query ranking in MeiliSearch | MeiliSearch index | Ranking config updated | **Active** |
| 3.6 | `scripts/sync-lentils-csv.mjs` | Syncs lentils data between CSV and DB | `data-design/lentils-master.csv` | Lentils data sync'd | **Active** |

**Order:** 3.1 → 3.2 → 3.3 (or just 3.3 `--apply` which does everything)

---

## PHASE 4 — Images

| # | Script | Purpose | Input | Output | Status |
|---|--------|---------|-------|--------|--------|
| 4.1 | `scripts/download-natco-images.mjs` | Downloads 357 Natco product images from veenas.com | Product list | `public/images/natco_*.jpg` | **Active** |
| 4.2 | `scripts/rename-trs-images.mjs` | Renames TRS images to `{brand}_{handle}.{ext}` format | Image files | Renamed images | **Active** |
| 4.3 | `scripts/fix-trs-images.mjs` | Fixes TRS image paths in DB | Products | Correct image URLs | **Active** |
| 4.4 | `scripts/mvc/assign-images.mjs` | Assigns images to MVC products | MVC products + image dir | Image URLs on products | **Active** |
| 4.5 | `apps/backend/src/seed/set-thumbnails.mjs` | Sets product thumbnails from images | Products | Thumbnail URLs set | **Active** |

**Order:** 4.1 → 4.2 → 4.3 → 4.4 → 4.5

---

## PHASE 5 — Inventory & Descriptions

| # | Script | Purpose | Input | Output | Status |
|---|--------|---------|-------|--------|--------|
| 5.1 | `apps/backend/src/seed/set-inventory.mjs` | Enables stock + sets inventory (disables inventory management) | Products | Inventory enabled | **Active** |
| 5.2 | `apps/backend/src/seed/set-descriptions.mjs` | Generates descriptions for products missing them | Products without descriptions | Descriptions set | **Active** |

**Order:** 5.1 → 5.2 (order doesn't matter, independent)

---

## PHASE 6 — Search Index

| # | Script | Purpose | Input | Output | Status |
|---|--------|---------|-------|--------|--------|
| 6.1 | `cd apps/meilisearch && npm run configure` | Creates MeiliSearch index with synonyms, filters, ranking rules | MeiliSearch instance | Configured index | **Active** |
| 6.2 | `cd apps/meilisearch && npm run reindex` | Pushes all 506 products into MeiliSearch index | Medusa products | Searchable products | **Active** |

**Order:** 6.1 → 6.2

---

## PHASE 7 — Verification

| # | Script | Purpose | Input | Output | Status |
|---|--------|---------|-------|--------|--------|
| 7.1 | `node scripts/verify-data-health.mjs` | Checks MeiliSearch handles, product count, dietary flags | MeiliSearch + Medusa | Pass/Fail report | **Active** (run after every data change) |
| 7.2 | `node scripts/audit-catalog-completeness.mjs` | Verifies all products imported, have categories, thumbnails, prices | Products | Completeness report | **Active** |
| 7.3 | `node scripts/validate-storefront.mjs` | Validates category pages, search queries, dietary filters | Storefront HTTP | Validation report | **Active** |
| 7.4 | `node scripts/validate-all-categories.mjs` | Full category validation against CSV expected counts | Storefront + CSVs | Per-category report | **Active** |
| 7.5 | `node scripts/audit-crossref.mjs` | Cross-references products across data sources | Multiple sources | Cross-ref report | **Active** |
| 7.6 | `node scripts/mvc/audit.mjs` | MVC-specific audit after import | MVC products | MVC audit report | **Active** |

---

## PHASE 8 — Pricing

| # | Script | Purpose | Input | Output | Status |
|---|--------|---------|-------|--------|--------|
| 8.1 | `node scripts/pricing/load-pricelist.mjs` | Loads prices from JSON/CSV pricelist, updates variant prices | Pricelist file | Updated prices | **Active** |
| 8.2 | `node tests/verify-pricing.mjs` | Verifies prices after update | DB + Storefront | Price audit | **Active** |

---

## HISTORICAL / ARCHIVED SCRIPTS

These are in `apps/backend/src/seed/` with `Delete-` prefix. They were renamed
(not deleted) for traceability. They are NO LONGER used in the active pipeline.

| Script | Was used for | Replaced by |
|--------|-------------|-------------|
| `Delete-reassign-natco-categories.mjs` | Category reassignment | `migrate-to-natco-categories.mjs` |
| `Delete-assign-collections-v2.mjs` | Collection assignment | `assign-categories-from-titles.mjs` |
| `Delete-assign-collections.mjs` | V1 collection assignment | Removed |
| `Delete-create-collections.mjs` | Collection creation | `initial-data-seed.ts` |
| `Delete-migrate-category-handles.mjs` | Category handle migration | `fix-category-handles.mjs` |
| `Delete-cleanup-and-migrate.mjs` | Combined cleanup+migration | `reset-and-reassign.mjs` |
| `Delete-import-csv.mjs` | CSV import | `import-products-from-csv.mjs` |
| `Delete-import-merged-catalog.mjs` | Merged catalog import | Not needed (products already merged) |
| `Delete-generate-mapping.mjs` | Mapping generation | Not needed |
| `Delete-link-variants-sc.mjs` | Variant linking | Not needed |
| `Delete-fix-images.mjs` | Image fixes | `fix-trs-images.mjs` + `set-thumbnails.mjs` |
| `Delete-upload-all-images.mjs` | Bulk image upload | `download-natco-images.mjs` |
| `Delete-upload-by-mapping.mjs` | Mapping-based upload | Not needed |
| `Delete-upload-sample-images.mjs` | Sample image upload | Not needed |
| `Delete-upload-trs-images.mjs` | TRS image upload | `rename-trs-images.mjs` |

**Action:** These can be permanently deleted or moved to `scripts/archive/` after review.

---

## CSV DATA FILES

| File | Purpose | Used By |
|------|---------|---------|
| `data-design/lentils-master.csv` | Lentils product attributes (tags, dietary, allergens) | `enrich-from-csv.mjs`, `sync-lentils-csv.mjs` |
| `data-design/spices-master.csv` | Spices product attributes | `enrich-from-csv.mjs` |
| `data-design/grains-master.csv` | Grains product attributes | `enrich-from-csv.mjs` |
| `data-design/snacks-master.csv` | Snacks product attributes | `enrich-from-csv.mjs` |
| `data-design/essentials-master.csv` | Essentials product attributes | `enrich-from-csv.mjs` |
| `data-design/raw-nuts-master.csv` | Nuts product attributes | `enrich-from-csv.mjs` |
| `data-design/tinned-products-master.csv` | Tinned product attributes + category fixes | `fix-tinned-products.mjs` |

---

## EXECUTION ORDER — MASTER PIPELINE

For a fresh setup, run in this exact order:

```
Phase 0: Docker + DB + Infrastructure
  0.2  docker compose up -d
  0.3  npx medusa db:migrate
  0.1  npx medusa exec src/migration-scripts/initial-data-seed.ts

Phase 1: Products
  1A.1 scripts/import-from-shopify.mjs         (Natco 357)
  1A.2 apps/backend/src/seed/merge-product-variants.mjs  (consolidate)
  1B.1 scripts/import-trs-products.mjs          (TRS 50)
  1C.3 scripts/mvc/create-categories.mjs        (MVC categories)
  1C.1 scripts/mvc/import-round1.mjs            (MVC Round 1)
  1C.2 scripts/mvc/import-missing-variants.mjs  (missed variants)

Phase 2: Categories
  2.1  apps/backend/src/seed/migrate-to-natco-categories.mjs
  2.2  apps/backend/src/seed/assign-categories-from-titles.mjs
  2.3  apps/backend/src/seed/assign-categories-to-children.mjs
  2.4  apps/backend/src/seed/fix-category-handles.mjs
  2.5  scripts/fix-tinned-products.mjs

Phase 3: Enrichment
  3.3  scripts/mvc/pipeline.mjs --apply          (descriptions+tags+dietary+synonyms+reindex)

Phase 4: Images
  4.1  scripts/download-natco-images.mjs
  4.2  scripts/rename-trs-images.mjs
  4.3  scripts/fix-trs-images.mjs
  4.4  scripts/mvc/assign-images.mjs
  4.5  apps/backend/src/seed/set-thumbnails.mjs

Phase 5: Inventory + Descriptions
  5.1  apps/backend/src/seed/set-inventory.mjs
  5.2  apps/backend/src/seed/set-descriptions.mjs

Phase 6: Search
  6.1  cd apps/meilisearch && npm run configure
  6.2  cd apps/meilisearch && npm run reindex

Phase 7: Verify
  7.1  node scripts/verify-data-health.mjs
  7.6  node scripts/mvc/audit.mjs
```

---

## REDUNDANCY ANALYSIS (for Step 2 review)

| Issue | Detail |
|-------|--------|
| **15 archived scripts** | `Delete-*` in `src/seed/` — no longer used, taking space |
| **2 category assignment scripts** | `assign-categories-from-titles.mjs` and `assign-categories-to-children.mjs` — could be merged |
| **3 enrichment scripts** | `enrich-from-csv.mjs`, `enrich-metadata.mjs`, `pipeline.mjs` — `pipeline.mjs` orchestrates both, making standalone scripts redundant |
| **4 verification scripts** | `verify-data-health.mjs`, `audit-catalog-completeness.mjs`, `validate-storefront.mjs`, `validate-all-categories.mjs` — overlap in checks |
| **Missing master entry** | `scripts/setup.ps1` exists but doesn't run all phases |
| **Scattered locations** | Scripts in 5 directories: `src/seed/`, `scripts/`, `scripts/mvc/`, `scripts/pricing/`, `apps/meilisearch/` |
