# G11: Natco Product Variant Consolidation

**Priority:** Mandatory for Go-Live  
**Status:** Not started  
**Estimate:** 5-7 hours  
**Created:** May 2026

## Problem

All 357 Natco products are flat SKUs with weight embedded in the title. Each has
a single `"Default"` variant. This means:

- Product cards show `"Default"` as the weight — meaningless to customers
- No unit pricing is displayed
- No best-value highlighting between weight options
- Product detail page shows single `"Default"` option
- Search titles are inconsistent with TRS (which already have clean titles)

## Current State

```
Natco - Brown Lentils 2kg     → separate product, title: "Natco - Brown Lentils 2kg"
Natco - Brown Lentils 500g     → separate product, title: "Natco - Brown Lentils 500g"
Natco - Cumin Seeds 400g       → separate product, title: "Natco - Cumin Seeds 400g"
Natco - Cumin Seeds Jar 100g   → separate product, differerent packaging
```

## Target State

```
Natco - Brown Lentils          → one product, variants: {2kg: £X.XX, 500g: £X.XX}
Natco - Cumin Seeds            → one product, variants: {400g: £X.XX}
Natco - Cumin Seeds Jar        → separate product, variants: {100g: £X.XX}
```

## Data Analysis

| Category | Count |
|----------|-------|
| Total Natco products | 357 |
| Clean merge groups (same product, different weights) | 58 groups |
| Products in clean groups | 120 |
| Cross-category conflicts | 3 groups (10 products) |
| Unique products (stay as-is) | 227 |
| Post-consolidation | ~292 products (65 fewer) |

### Clean Groups (58) — Merge

These are genuinely the same product in different weights. All variants are in the
same subcategory. Examples:

- Gram Flour Superfine: 2kg, 1kg, 500g → 3 variants
- Brown Lentils: 2kg, 500g → 2 variants
- Black Pepper Coarse: 1kg, 300g, 100g → 3 variants
- Almond Oil: 500ml, 250ml → 2 variants

### Problematic Groups (3) — Keep Split

**Chick Peas** (4 products, dried vs tinned):
- Chick Peas Full Case 4x1kg (dried) → stays as Chick Peas Dried
- Chick Peas 2kg (dried) → merges into Chick Peas Dried
- Chick Peas 2.5kg (tinned) → stays as Chick Peas Tinned
- Chick Peas Full Case 12x400g (tinned) → stays as Chick Peas Tinned Bulk

**Red Kidney Beans** (3 products, dried vs tinned):
- Red Kidney Beans 1kg, 2kg (dried) → merge into Red Kidney Beans Dried
- Red Kidney Beans 2.5kg (tinned) → stays as Red Kidney Beans Tinned

**Rose Coco Beans** (3 products, dried vs tinned):
- Rose Coco Beans 2kg, 500g (dried) → merge into Rose Coco Beans Dried
- Rose Coco Beans 400g (tinned) → stays as Rose Coco Beans Tinned

### Jars vs Loose — Keep Separate (20+ pairs)

Jar and loose pack formats are fundamentally different products and should NOT
be merged. The naming convention ("Jar" in the title) correctly keeps them
separate:

| Jar Format | Loose Format |
|------------|-------------|
| Cumin Seeds Jar 100g | Cumin Seeds 400g |
| Cumin Ground Jar 70g | Cumin Ground 100g, 400g |
| Turmeric Powder Jar 100g | Turmeric Powder 400g |
| Garam Masala Jar 80g | Garam Masala 400g |

## Implementation Steps

### Phase 1: Adapt Merge Script (1-2h)

File: `apps/backend/src/seed/merge-product-variants.mjs`

Changes needed:
1. Handle `&amp;` in titles (normalize to `&` before grouping)
2. Preserve existing product metadata (dietary_flags, allergens, synonyms, tags)
3. Handle cross-category groups (dried vs tinned split)
4. Preserve `GroceryVariantMetadata` on each variant after merge
5. Add dry-run mode
6. Handle Full Case products separately

### Phase 2: Run Consolidation (30m)

```bash
cd apps/backend
node src/seed/merge-product-variants.mjs        # dry-run first
node src/seed/merge-product-variants.mjs --apply # execute
```

Then:
- Re-assign categories to new consolidated products
- Re-assign images (handles change)
- Delete old individual products

### Phase 3: Fix Enrichment Pipeline (30m)

File: `scripts/mvc/pipeline.mjs`

The CSV matching uses exact title match. After consolidation, titles lose weight
suffix but CSVs still have it. Fix: strip weight from CSV titles before matching.

### Phase 4: Re-enrich (30m)

```bash
node scripts/mvc/pipeline.mjs --apply
```

Re-applies tags, dietary, allergens, synonyms to consolidated products.

### Phase 5: Update Tests (2-3h)

All 700+ title assertions across 8 spec files must lose weight suffixes:

| File | Assertions affected |
|------|-------------------|
| spices.spec.ts | ~322 |
| lentils.spec.ts | ~146 |
| snacks.spec.ts | ~78 |
| nuts-seeds.spec.ts | ~86 |
| grains.spec.ts | ~80 |
| essentials.spec.ts | ~90 |
| trs-products.spec.ts | ~78 |
| vernacular.spec.ts | ~24 |
| top-results.spec.ts | ~130 |
| **Total** | **~1,034** |

Pattern: `"Natco - Brown Lentils 2kg"` → `"Natco - Brown Lentils"`

### Phase 6: Reindex + Validate (30m)

```bash
cd apps/meilisearch && npm run reindex
node scripts/verify-data-health.mjs
cd apps/storefront && npx playwright test e2e/
```

## Risks

1. **Product IDs change** — old products deleted, new ones created. Any system
   referencing old IDs (carts, orders, wishlists) will break.
2. **MeiliSearch document IDs change** — full reindex required.
3. **Category_handle may shift** — after re-assignment, verify with `verify-data-health.mjs`.
4. **Image handles change** — need to re-link images to new products.
5. **Backup essential** — take database snapshot before running consolidation.

## Dependencies

- Must run after MVC enrichment pipeline (already complete)
- Requires backend running on :9000
- Requires admin credentials

## Validation Criteria

- [ ] All 57 integration tests pass after consolidation
- [ ] verify-data-health.mjs passes 4/4
- [ ] Weight-heavy card shows proper weight chips for consolidated products
- [ ] Product detail page shows variant selector for multi-variant products
- [ ] Search results show clean titles without weight suffixes
- [ ] CSV enrichment matches consolidated titles (updated matching)
