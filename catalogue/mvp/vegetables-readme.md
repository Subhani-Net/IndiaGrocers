# Fresh Vegetables — Catalogue MVP

**Source:** Veenas.com Fresh Vegetables collection  
**Date scraped:** June 2026  
**Status:** Ready for integration — NOT yet in main products.csv  

## Files

| File | Contents |
|------|----------|
| `vegetables-products.csv` | 79 product rows (31-column format) |
| `vegetables-prices.csv` | 79 SKU → price entries |
| `vegetables-category.csv` | Parent + child category (2 rows) |
| `vegetables-readme.md` | This file |

## Metrics

| Metric | Value |
|--------|-------|
| Products | 79 (all single-variant) |
| Weight formats | g, kg, pc (piece), pk (pack) |
| Sold out (draft) | 2 (Tinda Round, Purple Yam) |
| In stock (published) | 77 |
| Price range | £1.49 – £11.49 |
| Average price | ~£3.40 |
| Brand | Veenas |
| Category | fresh_vegetables (child of vegetables_fruits_flowers) |
| VAT | 0 (zero-rated grocery) |
| Dietary | vegetarian;vegan;gluten-free |
| Allergens | Only celery (for celery product) |

## Integration Steps

### 1. Add categories to `categories.csv`
Append the 2 rows from `vegetables-category.csv` to the main `categories.csv`.  
The parent `vegetables_fruits_flowers` has rank 75 (after beverages_pantry at 70).

### 2. Add brand to `apps/backend/src/config/brands.ts`
```ts
{ slug: "veenas", name: "Veenas", categories: ["fresh_vegetables"] },
```

### 3. Merge products into `products.csv`
Append all 79 rows from `vegetables-products.csv`.

### 4. Merge prices into `prices.csv`
Append all 79 rows from `vegetables-prices.csv`.

### 5. Seed
```bash
cd catalogue
node seed-catalogue.mjs --apply --reindex
```

### 6. Verify
```bash
node catalogue/seed-catalogue.mjs --validate-only
node scripts/verify-data-health.mjs
```

## Notes

- Barcodes are empty — will be auto-assigned as `GEN_veenas-{handle}_{weight}` by seed-catalogue.mjs
- Images are NOT included — thumbnail_url is empty. Source images from Veenas.com or supplier
- Storage instructions are product-specific
- Country of origin is set per product (India, UK, Sri Lanka, Kenya, Netherlands, etc.)
- "Sold out" products set to status=draft to prevent storefront display until back in stock
- All products are single-variant (one weight per product). Multi-weight variants (e.g., same vegetable in 300g and 500g packs) can be merged later by sharing a handle
