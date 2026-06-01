# Implementation Guide — IndiaGrocers

> **Purpose:** Single source of truth for setup, scripts, execution order, and
> current state. Read this before any data operation.
>
> **Last updated:** May 2026
>
> **Related:** `AGENTS.md` (repo setup), `catalogue-build/minimum-viable-catalogue.md` (target catalog)

---

## Fresh Setup

See `AGENTS.md` for detailed step-by-step. Condensed here:

```bash
# 1. Docker
docker compose -f docker-compose.yml up -d

# 2. Install (ORDER MATTERS)
npm install                              # root — links workspace packages
cd apps/storefront && yarn install && cd ../..  # storefront

# 3. Configure .env
cd apps/backend && cp .env.template .env && cd ../..

# 4. Migrate + create admin
cd apps/backend
npx medusa db:migrate
npx medusa user -e admin@example.com -p password123
cd ../..

# 5. Start backend (keep open)
cd apps/backend && npx medusa develop

# 6. Seed products (new terminal, backend running)
cd apps/backend
node src/seed/merge-product-variants.mjs      # NOT YET RUN — see G11
node src/seed/reassign-natco-categories.mjs
node src/seed/assign-collections-v2.mjs
node src/seed/set-inventory.mjs

# 7. Configure search
cd apps/meilisearch && npm run configure && npm run reindex

# 8. Verify
node scripts/verify-data-health.mjs

# 9. Start storefront
cd apps/storefront && yarn dev
```

---

## Script Index

### Data Import Scripts

| Script | Purpose | Run? |
|--------|---------|------|
| `scripts/import-from-shopify.mjs` | Import missing Natco products from Shopify JSON | ✅ Run |
| `scripts/import-trs-products.mjs` | Import 50 TRS products from `Implementation/TRS_products/products.json` | ✅ Run |
| `scripts/rename-trs-images.mjs` | Rename TRS images to `{brand}_{handle}.{ext}` convention | ✅ Run |

### Fix & Repair Scripts

| Script | Purpose | Run? |
|--------|---------|------|
| `scripts/fix-trs-images.mjs` | Link TRS product thumbnails to correct image files (were imported without images) | ✅ Run — 48 fixed, 2 fallbacks used |
| `scripts/fix-tinned-products.mjs` | Reparent tinned subcategories under `tinned-products` (Essentials) + reassign 28 misassigned tinned products to correct leaf categories | ✅ Run |

### Enrichment Scripts

| Script | Purpose | Run? |
|--------|---------|------|
| `scripts/mvc/pipeline.mjs` | Orchestrates all enrichment: descriptions, tags (CSV + inferred), dietary, allergens, synonyms | ✅ Run — 407 descriptions, 361 tags, dietary expanded |
| `scripts/mvc/audit.mjs` | Catalog health dashboard — reads MeiliSearch + CSV, reports gaps | ✅ Run — read-only |
| `scripts/mvc/enable-pseudo-query.mjs` | Rebuilds category-tags.json + enables DP-01 pseudo-query | ❌ Not run — needs approval |

### MVC Catalog Build Scripts

| Script | Purpose | Run? |
|--------|---------|------|
| `scripts/mvc/create-categories.mjs` | Create 23 new MVC category handles in Medusa | ✅ Run |
| `scripts/mvc/import-round1.mjs` | Import 100 products from `Implementation/MVC_products/round1-products.json` | ✅ Run |
| `scripts/mvc/import-missing-variants.mjs` | Import 17 missing weight variants with unique titles | ✅ Run |
| `scripts/mvc/scrape-images.py` | Scrape product images from veenas.com search + Shopify product pages (haldiramuk.com, etc.) via og:image meta tags | ✅ Run — 77 of 83 found |
| `scripts/mvc/assign-images.mjs` | Link scraped images to MVC products in Medusa (matches by slugified title, handles weight suffixes) | ✅ Run — 92 assigned |

### Validation Scripts

| Script | Purpose | Run? |
|--------|---------|------|
| `scripts/verify-data-health.mjs` | Validates MeiliSearch handles, product count, dietary flags | ✅ Run — 4/4 passing |
| `scripts/validate-all-categories.mjs` | Per-category parent/child product count validation | ✅ Run |
| `scripts/audit-catalog-completeness.mjs` | Cross-references CSV vs DB vs MeiliSearch | ✅ Run |
| `scripts/validate-storefront.mjs` | Phase 5 storefront validation | ✅ Run |

---

## Execution Log — What Was Done & Current State

### Phase 1: Foundation

| Step | Command | Result |
|------|---------|--------|
| Docker services | `docker compose up -d` | Postgres 16 + Redis 7 + MeiliSearch v1.12 |
| Dependencies | `npm install` + `yarn install` | Workspace packages linked |
| Migration | `npx medusa db:migrate` | Tables created, seed infrastructure |
| Admin user | `npx medusa user` | `admin@example.com` / `password123` |

### Phase 2: Product Import

| Step | Command | Result |
|------|---------|--------|
| Import Natco | `node src/seed/merge-product-variants.mjs` | **Not run** — consolidation deferred to G11 |
| Import Natco (Shopify) | `node scripts/import-from-shopify.mjs` | 290 Natco products imported |
| Import TRS | `node scripts/import-trs-products.mjs` | 50 TRS products imported |
| TRS images | `node scripts/rename-trs-images.mjs` | Images renamed to convention |
| Categorize Natco | `node src/seed/reassign-natco-categories.mjs` | All Natco products mapped to seed categories |
| Categorize TRS | Built into `import-trs-products.mjs` | TRS mapped via CATEGORY_MAP + title heuristics |
| Inventory | `node src/seed/set-inventory.mjs` | Inventory management disabled |
| MeiliSearch setup | `npm run configure && npm run reindex` | Index created with synonyms, filters, ranking |

### Phase 3: Data Fixes

| Step | Command | Result |
|------|---------|--------|
| Tinned products | `node scripts/fix-tinned-products.mjs --apply` | 28 products moved from `tinned-products-parent` → `tinned-vegetables`(13), `tinned-coconut`(3), `tinned-fruit`(3), `tinned-lentils-beans`(9). 3 subcategories reparented under `tinned-products` (Essentials) |
| TRS images | `node scripts/fix-trs-images.mjs --apply` | 48/50 TRS products got thumbnails (2 used fallback images) |
| Category cleanup | Various | `tinned-products-parent` now has 0 products. Old seed handles removed from index |

### Phase 4: MVC Enrichment

| Step | Command | Result |
|------|---------|--------|
| Descriptions | `node scripts/mvc/pipeline.mjs --apply` | 245 descriptions generated (all 407 now have descriptions) |
| Tags (Natco) | `node scripts/mvc/pipeline.mjs --apply --step tags` | 311/357 Natco get CSV tags (1,492 total assignments) |
| Tags (TRS) | `node scripts/mvc/pipeline.mjs --apply --step trs` | 50/50 TRS get title-inferred tags |
| Synonyms | Pipeline auto-inference | ~200 products get vernacular synonyms (jeera→cumin, etc.) |
| Dietary | Pipeline auto-inference | Expanded: 256 vegan, 231 gluten-free, 407 vegetarian |
| Allergens | Pipeline keyword scanning | ~300 products with specific allergens |

### Phase 5: MeiliSearch Reindex + Integration Tests

| Step | Command | Result |
|------|---------|--------|
| Reindex | `npm run reindex` (from `apps/meilisearch`) | 407 products indexed with tags, synonyms, dietary |
| Category tests | `npx playwright test e2e/categories/` | 8 spec files, 41 tests, exhaustive product assertions |
| Search baseline | `npx playwright test e2e/search/top-results.spec.ts` | 16 tests, 130 assertions — top-10 results for common terms |
| All tests | `npx playwright test e2e/` | **57/57 passing** |

### Phase 6: MVC Round 1 — Categories + Products + Images

| Step | Command | Result |
|------|---------|--------|
| Create categories | `node scripts/mvc/create-categories.mjs --apply` | 23 new handles (4 parents, 19 subs) |
| Import products | `node scripts/mvc/import-round1.mjs --apply` | 100 products imported, 39 failed (metadata schema) |
| Fix metadata | Updated import script with all required metadata fields | |
| Re-run import | `node scripts/mvc/import-round1.mjs --apply` | 44 more imported, 11 failed (SKU collision) |
| Re-run import | `node scripts/mvc/import-round1.mjs --apply` | All 100 now exist (83 created + 17 weight variants) |
| Fix categories | Inline node script | 31 products re-assigned to correct categories |
| Fix variant titles | `node scripts/mvc/import-missing-variants.mjs` | 17 missing weight variants imported with unique titles |
| Scrape images | `python scripts/mvc/scrape-images.py` | 75 of 83 products — images from veenas.com |
| Scrape missing | Manual: `__scrape_missing.py` uses Shopify product page og:image | Haldiram's Aloo Bhujia (135KB) + Mathri (113KB) from haldiramuk.com |
| Assign images | `node scripts/mvc/assign-images.mjs` | Run after each scrape — 92 total assigned |
| Reindex | `npm run reindex` | 507 products indexed |
| Enrich | `node scripts/mvc/pipeline.mjs --apply` | Existing Natco/TRS re-enriched |
| MVC tests | New test file `e2e/categories/mvc-products.spec.ts` | 18 tests, 150+ assertions |
| All tests | `npx playwright test e2e/` | **74/74 passing** |

---

## Current State — Production Catalog

| Metric | Value |
|--------|-------|
| Total products | **506** |
| Original (Natco + TRS) | 407 |
| MVC Round 1 | 99 |
| Category handles | 49 active (26 original + 23 new) |
| Brands | 31 (Natco, TRS, Shan, MDH, Haldiram's, Parle, Britannia, Patak's, Tilda, Kohinoor, Lal Qilla, Daawat, Falak, Elephant, Pillsbury, Aashirvaad, Lijjat, Bikaji, Maggi, Brooke Bond, Tata, Wagh Bakri, Girnar, Hamdard, Maaza, Frooti, Bournvita, Horlicks, Dabur, Glucon-D, TRS extended) |
| Descriptions | 507/507 (100%) |
| Images | **504/507** (99.4%) — 3 missing, see `catalogue-build/images-not-found.md` |
| Tags in MeiliSearch | 361/407 original (89%), new MVC use auto-inference |
| Integration tests | **74/74 passing** |

### Category Hierarchy (Current)

```
SPICES → spices-herbs (101), spice-herb-jars (18), spice-blends-mixes (19),
         food-colourings-essences (19), sugar (4)

GRAINS → rice-quinoa (17), flour-milk-powder (27), wheat-grains-couscous (2),
         corn (3), flours (5)

LENTILS → dried-lentils-beans-peas (59), soya-products (5), tinned-lentils-beans (9)

NUTS-SEEDS → raw-nuts (21), seeds (14), coconut-products (8), dried-fruit (2),
             flavoured-nuts (0), flavoured-nuts-snacks (11)

SNACKS → pappadoms (9), chutneys-pickles-sauces (20), namkeen-lentil-snacks (6),
         flavoured-nuts-snacks (11), haldiram-namkeens (7), bikaji-namkeens (3),
         indian-biscuits (7)

ESSENTIALS → all-essentials (5), ghee-oils (16), teas-drinks (3), vegetables (2),
             tinned-products → tinned-vegetables (13), tinned-coconut (3), tinned-fruit (3)

FLOURS (leaf)

MASALAS-DESSERT-MIXES → shan-masalas (18), mdh-masalas (10),
                        everest-masalas (0), dessert-mixes (0)

READY-TO-EAT-INSTANT → frozen-breads (0), ready-meals (0),
                       breakfast-mixes (0), instant-noodles (2), paneer-cheese (0)

CONFECTIONERY-SWEETS → tinned-sweets (5), indian-chocolate (0),
                       mouth-fresheners (0), indian-candies (2)

BEVERAGES-DRINKS → loose-leaf-tea (5), filter-coffee (0), instant-coffee (0),
                   drinks-syrups (3), health-drinks (4)
```

### MVC Data Files

| File | Purpose |
|------|---------|
| `catalogue-build/minimum-viable-catalogue.md` | Target 242-SKU catalog definition |
| `catalogue-build/tasks/G11-natco-variant-consolidation.md` | Mandatory go-live task |
| `catalogue-build/products-with-noimages.md` | List of 83 products needing images |
| `catalogue-build/images-not-found.md` | 8 products not found on veenas |
| `Implementation/MVC_products/round1-products.json` | Source data for 100 imported products |

### MeiliSearch Configuration

| Setting | Value |
|---------|-------|
| Index name | `products` |
| Searchable attributes | `title`, `description`, `tags`, `metadata.ingredients` |
| Filterable attributes | `category_handle`, `collection_handle`, `tags`, `metadata.dietary_flags`, `metadata.allergens`, `metadata.velocity` |
| Sortable attributes | `price_gbp`, `weight_grams`, `created_at`, `metadata.velocity` |
| Ranking rules | `words`, `typo`, `proximity`, `attribute`, `sort`, `metadata.velocity:desc`, `exactness` |
| Synonyms | 21 bidirectional groups (jeera↔cumin, haldi↔turmeric, etc.) |
| Pseudo-query (DP-01) | Disabled — `getPseudoQuery()` returns `""` |

---

## MVC Category Mapping — Post-Import Target

When new MVC products are imported, they map to these categories:

### Existing Categories — No Changes

| MVC Category | Target Handle(s) | Products |
|-------------|-----------------|----------|
| Rice & Atta | `rice-quinoa`, `flour-milk-powder`, `flours` | Rice, atta, besan, sooji |
| Lentils & Pulses | `dried-lentils-beans-peas`, `tinned-lentils-beans` | All dals, beans, chickpeas |
| Spices & Powders | `spices-herbs`, `spice-blends-mixes`, `spice-herb-jars`, `food-colourings-essences` | All spices, blends, waters |
| Pickles, Pastes, Oils | `chutneys-pickles-sauces`, `ghee-oils`, `all-essentials`, `coconut-products` | Pastes, oils, ghee, coconut |

### NEW Categories — Must Be Created

**Parent: `masalas-dessert-mixes`**
| Subcategory | For | SKUs |
|-------------|-----|------|
| `shan-masalas` | Shan recipe masalas | 18 |
| `mdh-masalas` | MDH masalas | 10 |
| `everest-masalas` | Everest masalas | 4 |
| `dessert-mixes` | Laziza/Shan dessert mixes | 6 |

**Parent: `ready-to-eat-instant`**
| Subcategory | For | SKUs |
|-------------|-----|------|
| `frozen-breads` | Shana frozen parathas/rotis | 6 |
| `ready-meals` | Ashoka ready meals | 8 |
| `breakfast-mixes` | MTR idli/dosa/upma mixes | 7 |
| `instant-noodles` | Maggi noodles | 3 |
| `paneer-cheese` | Nanak/East End paneer | 2 |

**Parent: `confectionery-sweets`**
| Subcategory | For | SKUs |
|-------------|-----|------|
| `tinned-sweets` | Haldiram's/Bikaji/MTR tinned sweets | 8 |
| `indian-chocolate` | Cadbury India, Amul | 4 |
| `mouth-fresheners` | Mukhwas, Hajmola | 2 |
| `indian-candies` | Parle Mango Bite, Melody | 2 |

**Parent: `beverages`**
| Subcategory | For | SKUs |
|-------------|-----|------|
| `loose-leaf-tea` | Brooke Bond, Tata, Wagh Bakri, Girnar | 8 |
| `filter-coffee` | Udhayam, Leo, Continental | 4 |
| `instant-coffee` | Bru, Nescafe | 2 |
| `drinks-syrups` | Rooh Afza, Maaza, Frooti, Bovonto, Rasna | 6 |
| `health-drinks` | Bournvita, Horlicks, Dabur, Glucon-D | 4 |

**New subcategories under existing SNACKS parent:**
| Subcategory | For | SKUs |
|-------------|-----|------|
| `haldiram-namkeens` | Haldiram's namkeens | 10 |
| `bikaji-namkeens` | Bikaji namkeens | 3 |
| `indian-biscuits` | Parle, Britannia, Karachi Bakery | 10 |

**Total: 4 new parents, 22 new subcategories, for ~176 new products**

---

## Remaining Products — Existing Natco/TRS MVC Matches

These existing products already match MVC requirements and just need
re-categorization (no re-import). They move into the target handles above:

| MVC Category | Existing Products That Match | Target Handle |
|-------------|----------------------------|---------------|
| Rice & Atta | `Natco - Basmati Rice *` (5), `Natco - Sona Masuri *`, `Natco - Parboiled *`, `Natco - Idli Rice *`, `Natco - Gram Flour *` (4), `Natco - Semolina *` (5), `TRS Ground Rice`, `TRS Pure Gram Flour`, `TRS Fine Semolina`, `TRS Coarse Semolina`, `Natco - Rice Flour 500g` | `rice-quinoa`, `flour-milk-powder` |
| Lentils | `Natco - Toor Dal *`, `Natco - Chanadal *`, `Natco - Mung *` (5), `Natco - Red Lentils *`, `Natco - Urid *` (5), `Natco - Chick Peas *`, `Natco - Red Kidney Beans *` (2), `Natco - Black Eye Beans *`, `TRS Red Split Lentils`, `TRS Toor Dal`, `TRS Mung Dal`, `TRS Urid Dal` | `dried-lentils-beans-peas` |
| Spices | 13 TRS spices + 80+ Natco spices | `spices-herbs`, `spice-blends-mixes` |
| Pickles & Pastes | `Natco - Garlic Paste`, `Natco - Ginger Paste`, `Natco - Garlic &amp; Ginger Paste`, `TRS Ginger Paste`, `TRS Ginger Garlic Paste`, `Natco - Coconut Oil (Parachute)`, `Natco - Pure Mustard Oil`, `Natco - Pure Sesame Oil`, `Natco - Ghee *`, `Natco - Coconut Milk`, `Natco - Tamarind *` | `all-essentials`, `ghee-oils`, `coconut-products` |

**~66 existing products to re-categorize — no import needed.**

---

## Brand Import Template

To import a new brand, adapt `scripts/import-trs-products.mjs`. The pattern:

```
1. Create source JSON:  Implementation/{brand}_products/products.json
                         (format: array of { product_name, category, variants[], description })

2. Create images:        apps/storefront/public/images/{brand}_{handle}.{ext}

3. Adapt import script:  Copy import-trs-products.mjs → import-{brand}-products.mjs
                         - Change JSON path
                         - Update CATEGORY_MAP (source category → target handle)
                         - Update getSubcategory() overrides
                         - Set brand_slug in metadata

4. Import:               node scripts/import-{brand}-products.mjs --apply

5. Enrich:               node scripts/mvc/pipeline.mjs --apply (auto-generates descriptions,
                         tags, dietary, allergens, synonyms for any brand)

6. Reindex:              cd apps/meilisearch && npm run reindex

7. Verify:               node scripts/verify-data-health.mjs
                         cd apps/storefront && npx playwright test e2e/
```

---

## Pending Tasks

| ID | Task | Priority | Status |
|----|------|----------|--------|
| **G11** | Natco variant consolidation (120→58 products, remove weight from titles) | 🔴 Go-Live | Not started |
| **MVC-01** | Create 23 new category handles for MVC | 🔴 Go-Live | ✅ Done |
| **MVC-02** | Import Round 1 — 100 products from 29 brands | 🔴 Go-Live | ✅ Done |
| **MVC-03** | Scrape + assign product images (75 of 83) | 🔴 Go-Live | ✅ Done — 8 missing |
| **MVC-06** | Enable pseudo-query (DP-01) | 🟡 | Ready to run |
| **MVC-07** | Update integration tests for MVC + new categories | 🔴 | ✅ Done — 74/74 |
| G1 | Email delivery — notification provider | 🟡 | Configured |
| G3 | Email verification on sign-up | 🟡 | Not started |
| G4 | Rate limiting on auth endpoints | 🟡 | Not started |
| G5 | Production build validation | 🟡 | Intentionally bypassed |
| G6 | CI/CD pipeline | 🟡 | No pipeline |
| G8 | PostgreSQL connection pooling | 🟡 | Not configured |
| G9 | Redis persistence | 🟡 | Not configured |
| G10 | Stripe live keys | 🟡 | Test mode only |
| **G12** | Product price management (pricelist, invoice scan) | 🔴 Go-Live | Not started |
| **G13** | Customer invoice generation (PDF + storefront) | 🔴 Go-Live | Not started |

---

## Post-Any-Data-Change Checklist

```bash
# 1. Reindex MeiliSearch
cd apps/meilisearch && npm run reindex

# 2. Verify data health
node scripts/verify-data-health.mjs

# 3. Run integration tests
cd apps/storefront && npx playwright test e2e/

# 4. Check catalog audit
node scripts/mvc/audit.mjs
```
