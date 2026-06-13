# Data Architecture — IndiaGrocers Catalogue

> **Master/Reference Data Management System**
> Single source of truth per data domain. One pipeline. One command.

---

## Principle: Separate Files by Change Frequency

```
FREQUENCY        FILE                         CONTENT                     WHO EDITS
───────────      ────                         ───────                     ────────
Rarely           products.csv                 Product identity: titles,    Product team
(new product,                                  descriptions, variants,
edit, restructure)                             metadata, media, categories

                 categories.csv               Category tree               Product team
                 collections.csv              Collection definitions       Marketing
                 category-assignment.json     Product→Category mapping     Product team
                 category-key-mapping.json    JSON→DB handle mapping       Dev (static)

Periodically     products-collections.csv     Product→Collection mapping   Marketing
                 meilisearch/synonyms.csv     Search synonyms              SEO team

Frequently       prices.csv                   Variant prices + currency    Operations
(weekly)                                                                   
```

## Pipeline — One Command

```bash
node catalogue/enrich.mjs --apply --reindex
```

### What it reads (in order)

| # | File | What it does |
|---|------|-------------|
| 1 | `products.csv` | Create/update product identity: title, subtitle, description, variants, metadata, thumbnail, categories |
| 2 | `categories.csv` | Sync category tree (handle, name, parent, rank) |
| 3 | `collections.csv` | Create/update collections |
| 4 | `category-assignment.json` | Apply product→category mapping when `category_handle` is empty in CSV |
| 5 | `category-key-mapping.json` | Translate JSON category keys to DB handles |
| 6 | `products-collections.csv` | Assign collections to products |
| 7 | `prices.csv` | Apply variant prices (after products created) |
| 8 | `meilisearch/synonyms.csv` | Upload search synonyms |
| 9 | `meilisearch/filters.csv` | Configure filterable attributes |
| -- | `--reindex` flag | Delete all MeiliSearch docs + reindex from DB |

### All files are optional — if a file doesn't exist, that step is skipped.

---

## File Schemas

### products.csv — Product Identity

```
handle, variant_id, variant_sku, variant_barcode, product_group, variant_title,
product_title, subtitle, description, brand, category_handle, collection_handle,
dietary_flags, tags, allergens, ingredients, storage, country_of_origin,
weight_value, weight_unit, thumbnail_url, image_filenames, velocity,
eco_rating, brand_slug, vat_rate, regional_tags, subscription_eligible,
status, variant_title_raw, variant_sku_raw
```

**Note:** `price_gbp` was moved to `prices.csv`. `manage_inventory` column removed.

### prices.csv — Variant Prices

```
handle, variant_title, price_gbp, currency
```

| Column | Example | Description |
|--------|---------|-------------|
| `handle` | `4567660527688` | Product handle (matches `products.csv` handle) |
| `variant_title` | `700g` | Variant label. Empty or "Default" for single-variant |
| `price_gbp` | `4.60` | Price in GBP major unit (£4.60) |
| `currency` | `gbp` | Currency code |

### category-assignment.json — Product→Category Intelligence

```json
{
  "_description": "Curated product-to-category mapping",
  "_source": "MoreCategoriesProducts2.json",
  "mappings": {
    "Natco - Turmeric Powder": "powdered_spices",
    "Natco - Soya Chunks": "canned_preserved_vegetables"
  }
}
```

`enrich.mjs` uses this as a fallback when `category_handle` is empty in `products.csv`. The JSON category key is translated to a DB handle via `category-key-mapping.json`.

### category-key-mapping.json — JSON→DB Translation

```json
{
  "mappings": {
    "powdered_spices": "spices-ground",
    "canned_preserved_vegetables": "fresh",
    "lentils_dals": "dal-lentils"
  }
}
```

Static mapping. 28 JSON keys → 18 DB parent category handles.

### products-collections.csv — Product→Collection Assignments

```
product_handle, collection_handle
```

Empty initially. Populated per marketing campaign.

---

## Daily Operations

### Edit a product description
```bash
# 1. Edit products.csv → change description column
# 2. Apply
node catalogue/enrich.mjs --apply --reindex
```

### Weekly price update
```bash
# 1. Edit prices.csv only — change price_gbp
# 2. Apply (only prices change, products untouched)
node catalogue/enrich.mjs --apply --reindex
```

### Add a new product
```bash
# 1. Add row to products.csv (identity + variants)
# 2. Add corresponding price row to prices.csv
# 3. Copy image to apps/backend/uploads/
# 4. Apply
node catalogue/enrich.mjs --apply --reindex
```

### Add a new category assignment
```bash
# 1. Edit category-assignment.json — add product→category mapping
# 2. If new category key doesn't exist in DB, add to category-key-mapping.json
# 3. Apply
node catalogue/enrich.mjs --apply --reindex
```

### Run a collection campaign
```bash
# 1. Edit products-collections.csv — add product→collection rows
# 2. Apply
node catalogue/enrich.mjs --apply --reindex
```

---

## Fresh DB Setup

```bash
# 1. Infrastructure
npx medusa db:migrate                      # tables + regions + sales channels + categories
npx medusa user -e admin@example.com -p password123
npx medusa develop                          # start backend

# 2. One command seeds everything
node catalogue/enrich.mjs --apply --reindex

# 3. Verify
node scripts/verify-data-health.mjs
node catalogue/discoverability/gap-analysis.mjs
```

---

## File Inventory

| File | Purpose | Row Count | Change Frequency |
|------|---------|-----------|------------------|
| `products.csv` | Product identity | 612 rows (435 products) | Rarely |
| `prices.csv` | Variant prices | 612 entries | Weekly |
| `categories.csv` | Category tree | 140 rows | Quarterly |
| `collections.csv` | Collection definitions | 13 rows | Quarterly |
| `products-collections.csv` | Product→Collection | 0 (seed) | Per campaign |
| `category-assignment.json` | Product→Category mapping | 419 mappings | With catalogue changes |
| `category-key-mapping.json` | JSON→DB key translation | 28 mappings | Static |
| `meilisearch/synonyms.csv` | Search synonyms | 94 entries | Quarterly |

---

## What's NOT in the CSV Files

| Attribute | Why | Where it goes |
|-----------|-----|---------------|
| Product IDs | Generated by Medusa on creation | DB only |
| Variant IDs | Generated by Medusa on creation | DB only |
| Inventory (stock) | Real-time, not master data | Separate system |
| Orders | Transactional data | Separate system |
| Customers | PII/transactional | Separate system |

---

## Commit Conventions

| File changed | Commit message example |
|-------------|----------------------|
| `prices.csv` only | `prices: weekly update Jun 16` |
| `products.csv` only | `products: update Basmati Rice descriptions` |
| `category-assignment.json` | `categories: add 12 new product mappings` |
| Multiple | `catalogue: add 5 new Shan products with prices` |

---

## Rollback

```bash
# Revert prices to last week
git checkout HEAD~1 -- catalogue/prices.csv
node catalogue/enrich.mjs --apply --reindex

# Revert entire catalogue
git checkout <commit> -- catalogue/
node catalogue/enrich.mjs --apply --reindex
```
