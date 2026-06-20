# MVP Product Catalogue Build

## Status: ✅ MERGED — June 2026

All MVP products have been merged into the main `catalogue/products.csv` (737 rows).
The `delete_mvp-products.csv` file is a stale duplicate — kept for reference only.
**`catalogue/products.csv` is the single source of truth for all product data.**

## Purpose

This directory contains the additional product data needed to achieve the
Minimum Viable Catalogue (242 SKUs) defined in `../catalogue-build/minimum-viable-catalogue.md`.

**Note:** Frozen products (Shana, Nanak Paneer, East End Paneer — 8 SKUs) are deferred to Phase 2
(4-5 weeks from now) when cold-chain logistics are ready.

## Files

| File | Purpose |
|------|---------|
| `delete_mvp-products.csv` | ❌ Stale duplicate — 124 rows already merged into `../products.csv`. Safe to remove. |
| `mvp-duplicates-log.md` | Cross-reference of MVC products vs existing CSV matches |
| `mvp-new-categories.csv` | Frozen categories (DEFERRED Phase 2) + health_drinks/mouth_fresheners proposals |
| `mvp-readme.md` | This file |
| `mvp-duplicates-log.md` | Cross-reference of MVC products vs existing CSV matches |
| `mvp-new-categories.csv` | Frozen categories (DEFERRED Phase 2) — not yet added to main CSV |
| `mvp-readme.md` | This file |

## Merge Status: ✅ COMPLETE

All merges have been applied:
- Products merged into `catalogue/products.csv` — 737 rows total
- Categories merged into `catalogue/categories.csv` — 44 rows total
- Category handles re-mapped across all products (35 categories, 0 orphans)
- `delete_mvp-products.csv` is the stale original — safe to remove once verified

## To load into the database

```bash
# With backend + Docker running:
cd ../   # back to catalogue/
node enrich.mjs --apply --reindex
```

## Schema

Same 31-column schema as `../products.csv`:

```
handle,variant_id,variant_sku,variant_barcode,product_group,variant_title,
product_title,subtitle,description,brand,category_handle,collection_handle,
dietary_flags,tags,allergens,ingredients,storage,country_of_origin,
weight_value,weight_unit,thumbnail_url,image_filenames,velocity,eco_rating,
brand_slug,vat_rate,regional_tags,subscription_eligible,status,
variant_title_raw,variant_sku_raw
```

## Variant Handling

Multi-variant products share the same `handle` across rows. Each variant row
differs by `variant_id`, `variant_sku`, `weight_value`, and `variant_title`.

Variant ID pattern: `variant_01MV_{BRAND}_{PRODUCT}_{WEIGHT}`
SKU pattern: `{brand_short}-{product_slug}-{weight}`

## Next Steps After DB Load

- Source ~203 missing product images (see `mvp-duplicates-log.md` for list)
- Run `node enrich.mjs --apply --reindex` after images are added
- Update `catalogue-build/minimum-viable-catalogue.md` status to "LOADED"
- Run full test suite: `npx playwright test`
