# IndiaGrocers — Implementation Plan & User Stories

> **Last Updated**: 2026-05-30  
> **Status**: Phase 1 complete — 358 products, 8 Natco categories, search + category browsing operational

---

## Epic 1: Product Catalog Foundation

### US-1.1: Catalog Completeness Verification
**As a** data architect, **I want** to verify that ALL Natco products are imported into Medusa **so that** no enrichment or search work happens on incomplete data.

**Acceptance Criteria**:
- [x] 358 products in Medusa DB matching Natco Shopify catalog (96% — 13 SKU duplicates acceptable)
- [x] `scripts/audit-catalog-completeness.mjs` passes with 0 critical gaps
- [ ] 323/323 products from data-design CSVs exist in DB (currently 310/323)
- [ ] Multi-brand: repeat for each catalog (Natco, TRS, Haldiram) independently, then combined audit

**Success Metric**: `audit-catalog-completeness.mjs` returns 0 missing products
**QA Gate**: Phase 1 — `scripts/data-pipeline/QA-GATES.md`
**Validation**: `scripts/audit-catalog-completeness.mjs`
**Snapshot**: `scripts/snapshot.js save "phase-1-catalog-complete"`

### US-1.2: Category Assignment
**As a** customer, **I want** products to be in the correct Natco categories **so that** browsing `/categories/spices` shows all spice products.

**Acceptance Criteria**:
- [x] All 8 Natco parent categories resolve to correct product counts (Spices: 134, Lentils: 47, etc.)
- [x] `scripts/validate-all-categories.mjs` parent-level: all pass
- [ ] Old category handles (seeds, staples-grains, etc.) removed from MeiliSearch
- [ ] Known limitation: child category pages may show partial counts due to `categories[0]` ordering in MeiliSearch. Parent pages are canonical.

**Success Metric**: `validate-all-categories.mjs` returns 0 ✗ failures
**Script**: `scripts/migrate-to-natco-categories.mjs`
**QA Gate**: Phase 2
**Validation**: `scripts/validate-all-categories.mjs`, `scripts/verify-data-health.mjs`
**Snapshot**: `scripts/snapshot.js save "phase-2-categories-assigned"`

### US-1.3: Product Enrichment
**As a** customer, **I want** dietary flags and product tags on every product **so that** I can filter by vegan/vegetarian/gluten-free and search with vernacular terms.

**Acceptance Criteria**:
- [x] 358 products have vegetarian flag
- [x] 39 products have vegan + gluten-free flags
- [ ] ≥50% products have tags from Natco Shopify source
- [ ] Tags indexed in MeiliSearch for search
- [ ] Multi-brand: enrichment rules apply per brand (Natco, TRS, Haldiram all get same dietary inference)

**Success Metric**: `verify-data-health.mjs` shows dietary flags on ≥80% of products
**Script**: `scripts/enrich-from-csv.mjs`
**QA Gate**: Phase 3
**Validation**: `scripts/verify-data-health.mjs`
**Snapshot**: `scripts/snapshot.js save "phase-3-enriched"`

### US-1.4: Product Images
**As a** customer, **I want** product images to display correctly on product cards **so that** I can visually identify products.

**Acceptance Criteria**:
- [x] 358 products have thumbnail images
- [x] Images follow naming convention: `natco_{product-handle}.{ext}`
- [x] Images stored in `apps/storefront/public/images/`
- [ ] Future catalogs (TRS, Haldiram) use same convention

**Script**: `scripts/download-natco-images.mjs`
**Convention**: AGENTS.md § Image Naming Convention

---

## Epic 2: Search & Category Browsing

### US-2.1: MeiliSearch as Search Index
**As a** developer, **I want** MeiliSearch to serve as the search relevance engine with Medusa as the product data source **so that** search and category browsing share the same ranking logic.

**Acceptance Criteria**:
- [x] Category page queries MeiliSearch for IDs, fetches full products from Medusa
- [x] Search page queries MeiliSearch for IDs, fetches full products from Medusa
- [x] `fetchProductsByIds()` preserves MeiliSearch sort order
- [x] Category browsing uses `resolveCategoryHandles()` for parent→child resolution

**Files**: `page.tsx`, `search/templates/index.tsx`, `lib/data/products.ts`

### US-2.2: Pseudo-Query Relevance (DP-01)
**As a** customer, **I want** products displayed in a relevant order when browsing categories **so that** I find what I'm looking for without scrolling randomly.

**Acceptance Criteria**:
- [x] Category pages use tag-based pseudo-query instead of empty search
- [x] `data-design/category-tags.json` contains top 15 tags per subcategory
- [x] `lib/util/pseudo-query.ts` builds queries from category handles
- [ ] Velocity ranking (`metadata.velocity:desc`) configured in MeiliSearch

**Script**: `scripts/build-pseudo-queries.mjs`
**Design**: `data-design/SEARCH-ORDERING-PSEUDO-QUERY.md`

### US-2.3: Default Sort Option
**As a** customer, **I want** a "Default (Relevance)" sort option **so that** I can see products in their natural relevance order without forcing a specific sort.

**Acceptance Criteria**:
- [x] InlineSort dropdown shows "Default (Relevance)" as first option
- [x] Category page passes "default" as sortBy when no user selection
- [x] No sort parameter sent to MeiliSearch when "default" selected

**Files**: `inline-sort/index.tsx`, `refinement-list/sort-products/index.tsx`

### US-2.4: MeiliSearch Schema
**As a** developer, **I want** MeiliSearch configured with category_handle, tags, dietary_flags, allergens, eco_rating as filterable/searchable **so that** customers can filter and search by these attributes.

**Acceptance Criteria**:
- [x] `category_handle` — filterable
- [x] `tags` — searchable + filterable
- [x] `metadata.dietary_flags` — searchable + filterable
- [x] `metadata.allergens` — filterable
- [x] `metadata.eco_rating` — filterable
- [x] `weight_grams` — sortable

**Script**: `apps/meilisearch/scripts/configure-index.ts`

---

## Epic 3: Quality Assurance

### US-3.1: Data Health Verification
**As a** QA engineer, **I want** automated data quality checks after every data operation **so that** stale handles, missing products, and sync gaps are caught immediately.

**Acceptance Criteria**:
- [x] `scripts/verify-data-health.mjs` checks: forbidden handles, product counts, dietary flags
- [x] `scripts/audit-catalog-completeness.mjs` checks: Shopify vs DB product counts per category
- [x] `scripts/validate-all-categories.mjs` checks: parent/child resolved counts vs expected
- [x] All checks return clear pass/warn/fail status

### US-3.2: QA Gates Pipeline
**As a** project manager, **I want** a gated pipeline that prevents work on incomplete data **so that** enrichment, categorization, and search configuration only happen on verified complete catalogs.

**Acceptance Criteria**:
- [x] Phase 1 gate: Catalog completeness audit
- [x] Phase 2 gate: Enrichment verification
- [x] Phase 3 gate: Category assignment verification
- [x] Phase 4 gate: MeiliSearch configuration verification
- [ ] Phase 5 gate: Storefront browse + search validation

**Document**: `scripts/data-pipeline/QA-GATES.md`

---

## Epic 4: TRS Products (Phase 2)

### US-4.1: TRS Product Import
**As a** customer, **I want** TRS Foods products available alongside Natco **so that** I can browse and search across both brands seamlessly.

**Acceptance Criteria**:
- [x] 50 TRS products identified in `Implementation/TRS_products/products.json`
- [x] 48/50 images renamed to `trs_{product-handle}.{ext}` convention
- [x] All 9 TRS categories mapped to existing Natco subcategories (0 new categories needed)
- [x] Import script ready: `scripts/import-trs-products.mjs`
- [ ] 50 TRS products imported to Medusa with "TRS - " title prefix
- [ ] Category assignments verified via `verify-data-health.mjs`
- [ ] Images served correctly from `apps/storefront/public/images/`

**Script**: `scripts/import-trs-products.mjs`
**Images**: `scripts/rename-trs-images.mjs` (already run)
**QA Gate**: Phase 6 — TRS catalog completeness

### US-4.2: TRS Tag Enrichment
**As a** customer, **I want** TRS products to have Hindi/English search terms **so that** searching "jeera" finds TRS Cumin Seeds alongside Natco products.

**Acceptance Criteria**:
- [ ] ≥80% of TRS products have tags (inferred from product name + category)
- [ ] Tags indexed in MeiliSearch
- [ ] Search "jeera" returns TRS Cumin Seeds + Natco Cumin Seeds
- [ ] Search "haldi" returns TRS Turmeric Powder + Natco Turmeric
- [ ] Search "TRS" returns only TRS products (brand filtering)

**Script**: `scripts/enrich-from-csv.mjs` (extend for TRS)
**Dependency**: US-4.1
**QA Gate**: Phase 6 — tag coverage audit

### US-4.3: TRS Dietary + Allergen Enrichment
**As a** customer, **I want** to filter TRS products by dietary needs **so that** vegan/vegetarian/gluten-free filters work across both brands.

**Acceptance Criteria**:
- [ ] TRS spices/pulses get vegan, vegetarian, gluten-free, dairy-free flags
- [ ] Allergen data inferred from product type (same rules as Natco)
- [ ] Dietary flags indexed in MeiliSearch
- [ ] Filter "Vegan" returns TRS + Natco products

**Script**: Same rules engine as Natco (`enrich-from-csv.mjs`)
**Dependency**: US-4.1

### US-4.4: Combined Catalog Audit
**As a** QA engineer, **I want** combined Natco (357) + TRS (50) catalog verified **so that** no products are missing or misclassified across brands.

**Acceptance Criteria**:
- [ ] 407 total products in DB (357 Natco + 50 TRS)
- [ ] `audit-catalog-completeness.mjs` passes for combined catalog
- [ ] `verify-data-health.mjs` shows 0 forbidden handles
- [ ] No category handle conflicts between brands
- [ ] Search "basmati" finds both brands (if applicable)

**Validation**: `scripts/audit-catalog-completeness.mjs`, `scripts/verify-data-health.mjs`

### US-4.5: Rebuild Pseudo-Queries with TRS Tags
**As a** customer, **I want** relevance ordering for category browsing to include TRS products **so that** spices, lentils, and grains show both brands in relevance order.

**Acceptance Criteria**:
- [ ] `category-tags.json` rebuilt with TRS tag data included
- [ ] Pseudo-query enabled (tags enriched → MeiliSearch → DP-01 active)
- [ ] Browsing `/categories/spices-herbs` shows relevance-ordered TRS + Natco

**Script**: `scripts/build-pseudo-queries.mjs` (re-run with TRS data)
**Dependency**: US-4.2
**Design**: `data-design/SEARCH-ORDERING-PSEUDO-QUERY.md`

### US-4.6: TRS Integration Tests
**As a** QA engineer, **I want** automated tests for TRS category browsing and search **so that** multi-brand regressions are caught immediately.

**Acceptance Criteria**:
- [ ] 5 new tests: TRS Spices, TRS Pulses, TRS Flours, Search "TRS", Combined spice search
- [ ] All 27 tests pass (22 existing + 5 TRS)
- [ ] TRS product cards render with correct images and prices

**Files**: `e2e/categories/trs-spices.spec.ts`, `e2e/search/trs-search.spec.ts`

---

## Implementation Order — TRS Phase

## Implementation Order (from scratch)

```
PHASE 1 — CATALOG
  □ 1.1 Docker: docker compose -f docker-compose.yml up -d
  □ 1.2 Install: npm install && cd apps/storefront && yarn install
  □ 1.3 Backend .env: DATABASE_URL, REDIS_URL
  □ 1.4 Storefront .env: NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY, MEILISEARCH_HOST
  □ 1.5 Migrate: npx medusa db:migrate
  □ 1.6 Create admin: npx medusa user -e admin@example.com -p password123
  □ 1.7 Start backend: npx medusa develop
  □ 1.8 Seed infrastructure: npx medusa exec src/migration-scripts/initial-data-seed.ts
  □ 1.9 Import from CSV: node src/seed/import-products-from-csv.mjs
  □ 1.10 Import from Shopify: node scripts/import-from-shopify.mjs
  □ 1.11 AUDIT: node scripts/audit-catalog-completeness.mjs
  □ 1.12 SNAPSHOT: node scripts/snapshot.js save "phase-1-catalog-complete"

PHASE 2 — CATEGORIES (run BEFORE enrichment)
  □ 2.1 Migrate to Natco taxonomy: node src/seed/migrate-to-natco-categories.mjs
  □ 2.2 Clean old handles: (script inline — remove from products with forbidden category IDs)
  □ 2.3 AUDIT: node scripts/validate-all-categories.mjs
  □ 2.4 SNAPSHOT: node scripts/snapshot.js save "phase-2-categories-assigned"

PHASE 3 — ENRICHMENT
  □ 3.1 Enrich metadata: node src/seed/enrich-metadata.mjs
  □ 3.2 Enrich from CSVs (tags + dietary): node scripts/enrich-from-csv.mjs --apply
  □ 3.3 AUDIT: node scripts/verify-data-health.mjs
  □ 3.4 SNAPSHOT: node scripts/snapshot.js save "phase-3-enriched"

PHASE 4 — SEARCH
  □ 4.1 Configure MeiliSearch: cd apps/meilisearch && npm run configure
  □ 4.2 Build pseudo-queries: node scripts/build-pseudo-queries.mjs
  □ 4.3 Copy category-tags.json: cp data-design/category-tags.json apps/storefront/src/lib/util/
  □ 4.4 Reindex: cd apps/meilisearch && npm run reindex
  □ 4.5 AUDIT: node scripts/verify-data-health.mjs
  □ 4.6 SNAPSHOT: node scripts/snapshot.js save "phase-4-search-configured"

PHASE 5 — IMAGES + STOREFRONT VALIDATION
  □ 5.1 Download images: node scripts/download-natco-images.mjs
  □ 5.2 Reindex: cd apps/meilisearch && npm run reindex
  □ 5.3 Start storefront: cd apps/storefront && yarn dev
  □ 5.4 VALIDATE: node scripts/validate-storefront.mjs
  □ 5.5 SNAPSHOT: node scripts/snapshot.js save "phase-5-complete"
```

### Multi-Brand Repeat

For each additional catalog (TRS, Haldiram, etc.):

### PHASE 6 — TRS PRODUCTS

```
  □ 6.1 Rename images: node scripts/rename-trs-images.mjs
  □ 6.2 Dry run: node scripts/import-trs-products.mjs
  □ 6.3 Import products: node scripts/import-trs-products.mjs --apply
  □ 6.4 Assign categories: (automatic — included in import script)
  □ 6.5 Enrich tags + dietary: node scripts/enrich-from-csv.mjs --apply
  □ 6.6 AUDIT: node scripts/audit-catalog-completeness.mjs
  □ 6.7 SNAPSHOT: node scripts/snapshot.js save "phase-6-trs-imported"
  □ 6.8 Rebuild pseudo-queries: node scripts/build-pseudo-queries.mjs
  □ 6.9 Reindex: cd apps/meilisearch && npm run reindex
  □ 6.10 AUDIT: node scripts/verify-data-health.mjs
  □ 6.11 Tests: cd apps/storefront && npx playwright test
```
```
1. Fetch brand Shopify JSON → data-design/{brand}-master.csv
2. Repeat Phase 1.9-1.11 (import + audit per brand)
3. Phase 2-3: categories + enrichment apply to all brands using same taxonomy
4. Phase 4: re-run build-pseudo-queries (includes new brand's tags)
5. Phase 5: download-{brand}-images.mjs with {brand}_ prefix
```

---

## Scripts Index

| Script | Purpose | Phase |
|--------|---------|-------|
| `scripts/setup.ps1` | Automated developer machine setup | Pre |
| `scripts/import-from-shopify.mjs` | Import products from Shopify JSON | 1 |
| `scripts/audit-catalog-completeness.mjs` | Count Shopify vs DB vs MeiliSearch | 1 (gate) |
| `scripts/migrate-to-natco-categories.mjs` | Assign Natco taxonomy categories | 2 |
| `scripts/enrich-from-csv.mjs` | Apply tags + dietary from data-design CSVs | 3 |
| `scripts/build-pseudo-queries.mjs` | Build category-tags.json for DP-01 | 4 |
| `scripts/download-natco-images.mjs` | Download + name images per convention | 5 |
| `scripts/verify-data-health.mjs` | Check handles, counts, dietary flags | All |
| `scripts/validate-all-categories.mjs` | Compare per-category MeiliSearch vs expected | 2-4 |
| `scripts/validate-storefront.mjs` | Browse + search + dietary filter validation | 5 (gate) |
| `scripts/snapshot.js` | Save/restore data-design snapshots | All |
| `scripts/audit-crossref.js` | Cross-reference tool for CSVs | Analysis |
| `scripts/import-trs-products.mjs` | Import TRS products from JSON | 6 |
| `scripts/rename-trs-images.mjs` | Rename TRS images to convention | 6 |

---

## Design Documents

| Document | Content |
|----------|---------|
| `data-design/ENRICHMENT-ARCHITECTURE.md` | Complete enrichment pipeline + design principles |
| `data-design/SEARCH-ORDERING-PSEUDO-QUERY.md` | DP-01: Pseudo-query for category relevance |
| `data-design/SEARCH-CATEGORY-ARCHITECTURE.md` | Search vs category data flow |
| `data-design/DATA-ANALYSIS-MASTER.md` | Combined product analysis |
| `data-design/spices-herbs-comparison.md` | Natco vs local comparison |
| `data-design/QA-GATES.md` | 5-phase QA gate pipeline |
| `AGENTS.md` | Repo conventions, image naming, setup steps |