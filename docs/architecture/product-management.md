# Product Management Architecture

> **Status:** Active (v3) | **Last updated:** 2026-06-20 | **By:** Architecture Refactor

---

## 1. Overview

The IndiaGrocers product catalogue is built on a **4-layer pure model** that separates
product identity from brand affiliation, commercial packaging, and vendor sourcing.
Each layer has its own CSV source file, its own update cadence, and its own
validation rules. No layer depends on the internal data structures of another.

Two scripts govern the system:

| Script | Purpose |
|--------|---------|
| `catalogue/seed-catalogue.mjs` | Reads 7 CSVs, creates/updates products in Medusa DB + MeiliSearch |
| `tmp/delete_extract-pure-model.mjs` | Reads current DB + legacy CSVs, regenerates all 7 CSV files |

---

## 2. Design Principles

### 2.1 Separation by Change Frequency

Identity data (product concepts, unit definitions) changes rarely. Commerce data
(barcodes, prices) changes periodically. Vendor data changes independently.
**Column A must never appear in File B** if they change at different rates.

| Frequency | Files |
|-----------|-------|
| **Rarely** (product team) | `products.csv`, `variants.csv`, `categories.csv`, `brands.csv` |
| **Periodically** (marketing) | `product_brands.csv`, `brand_product_variants.csv` |
| **Weekly** (operations) | `prices.csv`, `variant_vendor_prices.csv`, `vendors.csv` |

### 2.2 Pure Identity First

A product is *what something is*, not *who sells it* or *how it's packaged*.
"Basmati Rice" is a product. "Daawat" is a brand. "1kg Bag" is a unit. 
"Daawat Basmati Rice 1kg, barcode 8901063051001, £5.99" is a sellable unit.
Each concept lives in its own file. No file mixes concerns.

### 2.3 Single Source of Truth per Data Element

Every data element has exactly one authoritative source:

| Data Element | Authoritative Source |
|-------------|---------------------|
| Product name, description, dietary flags | `products.csv` |
| Unit type/value/label (500g, 1kg, 1.5L) | `variants.csv` |
| Brand display name | `brands.csv` |
| Which brand sells which product | `product_brands.csv` |
| Barcode, image, active status per sellable unit | `brand_product_variants.csv` |
| Retail price (GBP) | `prices.csv` |
| Vendor wholesale cost, vendor SKU | `variant_vendor_prices.csv` |
| Category tree | `categories.csv` |

### 2.4 Medusa Handle Auto-generation

MedusaJS v2.15.2 validates product handles against `/^[a-zA-Z0-9-]+$/` — only
alphanumeric characters and single hyphens are permitted. Underscores, double
hyphens, and dots are rejected. Because our product handles embed brand
identifiers, we let **Medusa auto-generate the handle from the product title**
rather than constructing one manually. The title format `"BrandName - ProductTitle"` 
produces handles like `natco-basmati-rice` or `fresh-veg-garlic`.

---

## 3. The 4-Layer Architecture

```
═══════════════════════════════════════════════════════════════════════
LAYER 1: PURE IDENTITIES — "What things ARE"
═══════════════════════════════════════════════════════════════════════

  products.csv                      variants.csv
  ┌──────────────────────┐         ┌──────────────────────┐
  │ handle: basmati-rice │         │ handle: 500g         │
  │ title: Basmati Rice  │         │ unit_type: weight    │
  │ description: ...     │         │ unit_value: 500      │
  │ category: rice-grains│         │ unit_label: g        │
  │ dietary: veg;gf      │         │ display_title: 500g  │
  │ vat_rate: 0          │         │   Pack               │
  │ status: published    │         └──────────────────────┘
  └──────────┬───────────┘
             │                        brands.csv
             │                       ┌──────────────────┐
             │                       │ handle: daawat   │
             │                       │ brand_name: Daawat│
             │                       └────────┬─────────┘
             │                                │
═════════════┼────────────────────────────────┼────────────────────────
LAYER 2: JUNCTION — "Who sells what"         │
═════════════┼────────────────────────────────┼────────────────────────
             │                                │
  product_brands.csv                          │
  ┌──────────────────────────────┐            │
  │ product_handle: basmati-rice │            │
  │ brand_handle:   daawat       │◄───────────┘
  │ shelf_weight_kg: 1.2         │  (gross packaged weight)
  │ status:         published    │
  └──────────────┬───────────────┘
                 │
═════════════════┼══════════════════════════════════════════════════════
LAYER 3: COMMERCE — "What the customer buys" (Sellable Unit)
═════════════════┼══════════════════════════════════════════════════════
                 │
  brand_product_variants.csv
  ┌──────────────────────────────────────────────────┐
  │ product_handle : basmati-rice       ──► Layer 1  │
  │ brand_handle   : daawat             ──► Layer 1  │
  │ variant_handle : 500g               ──► Layer 1  │
  │ barcode        : 8901063051001                   │
  │ backup_barcodes: 8901063051002,...               │
  │ images         : daawat_basmati_500g_front.jpg,   │
  │                   daawat_basmati_500g_back.jpg   │
  │ thumbnail      : daawat_basmati_500g_front.jpg   │
  │ is_active      : true                            │
  └──────────────────┬───────────────────────────────┘
                     │
  prices.csv  ─── separate file, same composite key  │
  ┌──────────────────────────────────────────────────┐
  │ product_handle : basmati-rice                    │
  │ brand_handle   : daawat                          │
  │ variant_handle : 500g                            │
  │ price_gbp      : 2.99                            │
  │ currency       : gbp                             │
  └──────────────────────────────────────────────────┘
                     │
═════════════════════┼══════════════════════════════════════════════════
LAYER 4: SOURCING — "Where we get it from"
═════════════════════┼══════════════════════════════════════════════════
                     │
  variant_vendor_prices.csv
  ┌──────────────────────────────────────────────────┐
  │ product_handle : basmati-rice                    │
  │ brand_handle   : daawat                          │
  │ variant_handle : 500g           ──► composite FK  │
  │ vendor_handle  : taza_trade     ──► vendors.csv  │
  │ vendor_sku     : DT-BAS-500                      │
  │ cost_price_gbp : 1.80                            │
  │ is_primary     : true                            │
  └──────────────────────────────────────────────────┘
  ┌──────────────────────────────────────────────────┐
  │ (same composite key, different vendor)           │
  │ vendor_handle  : dhamecha                        │
  │ vendor_sku     : DHA-4512-X                      │
  │ cost_price_gbp : 1.65                            │
  │ is_primary     : false                           │
  └──────────────────────────────────────────────────┘

  vendors.csv (21 profiles)
  ┌──────────────────────────────────────┐
  │ vendor_handle: taza_trade            │
  │ vendor_name: Taza Trade Ltd          │
  │ sourcing_depot: depot_a              │
  │ warehouse_aisle: A3                  │
  │ lead_time_days: 2                    │
  │ min_order_qty: 12                    │
  └──────────────────────────────────────┘

  categories.csv (44 tree nodes, unchanged)
  ┌──────────────────────────────────────┐
  │ handle: rice-grains                  │
  │ name: Rice & Grains                  │
  │ parent_handle: (null)                │
  │ rank: 3                              │
  └──────────────────────────────────────┘
```

### 3.1 Composite Keys

Files in Layer 3 and 4 are joined by a **3-part composite key**:

```
product_handle :: brand_handle :: variant_handle
```

This key uniquely identifies one sellable unit. It appears in:
- `brand_product_variants.csv` (1 row per sellable unit)
- `prices.csv` (1 row per sellable unit)
- `variant_vendor_prices.csv` (N rows per sellable unit — one per vendor)

---

## 4. File Schemas

### 4.1 `products.csv` — Pure Product Identity

| # | Column | Type | Required | Description |
|---|--------|------|----------|-------------|
| 1 | `handle` | string | Yes | URL-safe unique key (e.g. `basmati-rice`) |
| 2 | `title` | string | Yes | Pure product name, no brand prefix (e.g. `Basmati Rice`) |
| 3 | `subtitle` | string | No | Marketing subtitle |
| 4 | `description` | string | No | Product description |
| 5 | `category_handle` | FK | Yes | References `categories.csv.handle` |
| 6 | `dietary_flags` | string | No | Semicolon-delimited: `vegetarian;vegan;gluten-free;organic` |
| 7 | `vat_rate` | number | Yes | `0` (zero-rated grocery) or `0.20` (standard-rated) |
| 8 | `status` | string | Yes | `published` or `draft` |

**Current data:** 468 rows (down from 503 brand-encoded product handles in v2)

### 4.2 `variants.csv` — Shared Unit Pool

| # | Column | Type | Required | Description |
|---|--------|------|----------|-------------|
| 1 | `handle` | string | Yes | Unit key (e.g. `500g`, `1kg`, `1-5l`) |
| 2 | `unit_type` | enum | Yes | `weight` \| `volume` \| `count` \| `each` \| `bundle` |
| 3 | `unit_value` | number | Yes | Numeric value (500, 1, 1.5, 12) |
| 4 | `unit_label` | string | Yes | Unit label (g, kg, ml, L, pack, piece) |
| 5 | `display_title` | string | Yes | Human-readable (e.g. `500g Pack`, `1.5L Bottle`) |

**Current data:** 69 unique units, reused across all products.

This is a **shared pool** — the same `500g` variant is reused by hundreds of
products, not duplicated per product. This design prevents the variant
explosion that occurs when each product-brand combination maintains its
own copy of identical unit definitions.

### 4.3 `product_brands.csv` — Product × Brand Junction

| # | Column | Type | Required | Description |
|---|--------|------|----------|-------------|
| 1 | `product_handle` | FK | Yes | → `products.csv.handle` |
| 2 | `brand_handle` | FK | Yes | → `brands.csv.handle` |
| 3 | `shelf_weight_kg` | number | No | Gross packaged weight (product + packaging in kg) |
| 4 | `status` | string | Yes | `published` or `draft` |

**Composite key:** `(product_handle, brand_handle)` — a product can be sold
under multiple brands, and each pairing has its own shelf weight and status.

**Current data:** 503 rows (35 products have multiple brand assignments)

### 4.4 `brand_product_variants.csv` — Sellable Unit

| # | Column | Type | Required | Description |
|---|--------|------|----------|-------------|
| 1 | `product_handle` | FK | Yes | → `products.csv` |
| 2 | `brand_handle` | FK | Yes | → `brands.csv` |
| 3 | `variant_handle` | FK | Yes | → `variants.csv` (e.g. `500g`, `1kg`) |
| 4 | `barcode` | string | No | Primary EAN-13 or `GEN_`/`VEG_` prefixed code |
| 5 | `backup_barcodes` | string | No | Comma-separated alternate barcodes (multi-supplier scanning) |
| 6 | `images` | string | No | Comma-separated image filenames |
| 7 | `thumbnail` | string | No | Primary display image |
| 8 | `is_active` | boolean | Yes | `true` or `false` |

**Composite key:** `(product_handle, brand_handle, variant_handle)`

This is the **commerce layer** — it defines exactly what a customer sees on
the storefront. One row = one purchasable unit (e.g., "Daawat Basmati Rice - 1kg Bag").

**Current data:** 685 rows

### 4.5 `prices.csv` — Retail Prices

| # | Column | Type | Required | Description |
|---|--------|------|----------|-------------|
| 1 | `product_handle` | FK | Yes | → composite key |
| 2 | `brand_handle` | FK | Yes | → composite key |
| 3 | `variant_handle` | FK | Yes | → composite key |
| 4 | `price_gbp` | number | Yes | Retail price in GBP major units (e.g. `2.99`) |
| 5 | `currency` | string | Yes | `gbp` |

**Separated from product data** so operations can update prices without
touching product definitions. Weekly price updates: edit this file →
`node catalogue/seed-catalogue.mjs --upsert --reindex`.

**Current data:** 554 rows

### 4.6 `variant_vendor_prices.csv` — Multi-Vendor Sourcing

| # | Column | Type | Required | Description |
|---|--------|------|----------|-------------|
| 1 | `product_handle` | FK | Yes | → composite key |
| 2 | `brand_handle` | FK | Yes | → composite key |
| 3 | `variant_handle` | FK | Yes | → composite key |
| 4 | `vendor_handle` | FK | Yes | → `vendors.csv.vendor_handle` |
| 5 | `vendor_sku` | string | No | Vendor's internal item code |
| 6 | `cost_price_gbp` | number | No | Wholesale cost in GBP |
| 7 | `is_primary` | boolean | Yes | `true` if this is the primary supplier |

**N rows per sellable unit** — one for each vendor that supplies this variant.
The same 1kg Basmati Rice pack can be sourced from Taza Trade (primary, cost £1.80)
and Dhamecha (backup, cost £1.65).

**Current data:** 685 rows (1:1 with sellable units, ready for multi-vendor expansion)

### 4.7 `brands.csv` — Brand Definitions

| # | Column | Type | Required | Description |
|---|--------|------|----------|-------------|
| 1 | `handle` | string | Yes | Machine key (e.g. `daawat`, `natco`, `fresh_veg`) |
| 2 | `brand_name` | string | Yes | Display name (e.g. `Daawat`, `Natco`, `Fresh Veg`) |
| 3 | `categories` | string | No | Comma-separated primary category handles |

**Current data:** 69 rows. All 69 slugs must exist in 
`apps/backend/src/config/brands.ts` for backend metadata validation to pass.

### 4.8 `categories.csv` — Category Tree

| # | Column | Type | Required | Description |
|---|--------|------|----------|-------------|
| 1 | `handle` | string | Yes | URL-safe category key |
| 2 | `name` | string | Yes | Display name |
| 3 | `parent_handle` | FK | No | Self-referencing parent (null = root) |
| 4 | `rank` | number | No | Visual sort order |
| 5 | `description` | string | No | Category description |

**Current data:** 44 nodes in a self-referencing tree. Parents must be
seeded before children.

### 4.9 `vendors.csv` — Vendor Profiles

| # | Column | Type | Required | Description |
|---|--------|------|----------|-------------|
| 1 | `vendor_handle` | string | Yes | Machine key (e.g. `taza_trade`) |
| 2 | `vendor_name` | string | Yes | Display name |
| 3 | `sourcing_depot` | string | No | Depot identifier for warehouse routing |
| 4 | `warehouse_aisle` | string | No | Aisle/bay location |
| 5 | `lead_time_days` | number | No | Typical restock lead time |
| 6 | `min_order_qty` | number | No | Minimum order quantity from this vendor |

**Current data:** 21 profiles.

---

## 5. Seed Pipeline — Complete Data Flow

```
                                  ┌──────────────────────┐
                                  │  seed-catalogue.mjs   │
                                  └──────────┬───────────┘
                                             │
                              ┌──────────────┴──────────────┐
                              │  1. Load 7 CSVs into memory  │
                              │     Build lookup maps        │
                              └──────────────┬──────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │  --validate-only       │  --apply / --upsert    │
                    │  Check FK references   │                        │
                    │  Check image existence │                        │
                    │  Report errors, exit   │                        │
                    └────────────────────────┘                        │
                                             │                        │
                              ┌──────────────┴──────────────┐         │
                              │  2. Auth: POST /auth/user/   │         │
                              │     emailpass → Bearer token │         │
                              └──────────────┬──────────────┘         │
                                             │                        │
                         ┌───────────────────┴─────┐                  │
                         │  --apply              │  --upsert          │
                         │  Destructive reset:   │  Load existing     │
                         │  DELETE all products  │  products +        │
                         │  DELETE all categories│  categories from   │
                         │                       │  DB into memory    │
                         └───────────┬───────────┴──────┬─────────────┘
                                     │                  │
                              ┌──────┴──────┐   ┌──────┴──────┐
                              │ 3. Seed     │   │ 3. Compare   │
                              │ Categories  │   │ each product_brand
                              │ in order    │   │ against existing
                              │ (parents    │   │ DB state     │
                              │  first)     │   │              │
                              └──────┬──────┘   │ Compute      │
                                     │          │ autoHandle   │
                              ┌──────┴──────┐   │ from title   │
                              │ 4. Seed     │   │              │
                              │ Products    │   │ Changed?     │
                              │             │   │  ├─ UPDATE   │
                              │ For each    │   │  ├─ CREATE   │
                              │ product_    │   │  └─ SKIP     │
                              │ brand:      │   └──────┬──────┘
                              │             │          │
                              │ ┌──────────────────────┴───────────┐
                              │ │ For each sellable unit:           │
                              │ │  - Look up pure product (Layer 1) │
                              │ │  - Look up brand display name     │
                              │ │  - Look up variant unit def       │
                              │ │  - Collect vendor prices (Layer 4)│
                              │ │  - Collect retail price (prices)  │
                              │ │  - Build variant metadata envelope│
                              │ │                                   │
                              │ │ POST /admin/products              │
                              │ │  title: "BrandName - ProductTitle"│
                              │ │  handle: auto-generated by Medusa │
                              │ │  metadata: { dietary, vat, ... }  │
                              │ │  categories: [{ id }]             │
                              │ │  options: [{ title, values }]     │
                              │ │  variants: [{ title, prices,      │
                              │ │    metadata: { unit_type,         │
                              │ │      vendor_handle, vendor_sku,   │
                              │ │      cost_price_gbp, vendors[],   │
                              │ │      images, all_barcodes, ... }] │
                              │ │                                   │
                              │ │ POST /admin/sales-channels/       │
                              │ │   {id}/products (link to channel) │
                              │ └───────────────────────────────────┘
                              │          │
                              └──────────┼──────────────────────────┘
                                         │
                              ┌──────────┴──────────┐
                              │ 5. MeiliSearch       │
                              │ DELETE all documents │
                              │ Fetch all products   │
                              │ Fetch variant barcodes
                              │ POST batch index     │
                              └──────────┬──────────┘
                                         │
                              ┌──────────┴──────────┐
                              │ 6. Publishable Key   │
                              │ GET admin key        │
                              │ Write to storefront  │
                              │ .env file            │
                              └──────────────────────┘
```

### 5.1 Variant Metadata Envelope

Every variant created in Medusa carries a metadata envelope with all
sourcing and identity information. This is what the storefront reads
to display unit details, vendor info, and barcodes:

```json
{
  "unit_type": "weight",
  "unit_value": 500,
  "unit_label": "g",
  "display_title": "500g Pack",
  "barcode": "8901063051001",
  "all_barcodes": "8901063051001;8901063051002;8901063051003",
  "vendor_handle": "taza_trade",
  "vendor_name": "Taza Trade Ltd",
  "vendor_sku": "DT-BAS-500",
  "cost_price_gbp": "1.80",
  "vendors": [
    { "handle": "taza_trade", "sku": "DT-BAS-500", "cost": 1.80, "is_primary": true },
    { "handle": "dhamecha", "sku": "DHA-4512", "cost": 1.65, "is_primary": false }
  ],
  "shelf_weight_kg": null,
  "images": ["daawat_basmati_500g_front.jpg", "daawat_basmati_500g_back.jpg"]
}
```

### 5.2 Product Metadata Envelope

Every product carries a separate metadata envelope with identity and 
categorisation fields validated by Zod:

```json
{
  "country_of_origin": "India",
  "uk_food_business_operator": "IndiaGrocers London",
  "ingredients": "See product packaging",
  "allergens": [],
  "vat_rate": 0,
  "velocity": "B",
  "sourcing_tier": "B",
  "dietary_flags": ["vegetarian", "gluten-free"],
  "regional_tags": [],
  "subscription_eligible": true,
  "requires_fast_delivery": false,
  "requires_cold_chain": false,
  "brand_slug": "daawat",
  "priority_rank": "2",
  "synonyms": [],
  "images": []
}
```

---

## 6. Backend Validation

### 6.1 Zod Schema

`apps/backend/src/lib/validators/product-metadata.ts` validates product
metadata at the API level on every `POST /admin/products` and
`POST /admin/products/:id`. The middleware runs before the database write.

| Field | Validation |
|-------|-----------|
| `allergens` | Array of UK 14 allergens: `celery, gluten, crustaceans, eggs, fish, lupin, milk, molluscs, mustard, tree-nuts, peanuts, sesame, soya, sulphites` |
| `vat_rate` | Strict union: `0` or `0.2` |
| `country_of_origin` | Non-empty string |
| `uk_food_business_operator` | Non-empty string |
| `ingredients` | Non-empty string |
| `dietary_flags` | Array of `"vegetarian" \| "vegan" \| "gluten-free" \| "organic"` |
| `velocity` | `"A" \| "B" \| "C"` |
| `sourcing_tier` | `"A" \| "B" \| "C" \| "D"` |
| `regional_tags` | Array of `"punjabi" \| "gujarati" \| "south-indian" \| "bengali" \| "east-african-asian"` |
| `brand_slug` | Must exist in `BRAND_SLUGS` set (68 slugs in `apps/backend/src/config/brands.ts`) |
| `best_before_guidance` | Optional string |
| `subscription_eligible` | Boolean |
| `requires_fast_delivery` | Boolean |
| `requires_cold_chain` | Boolean |
| `synonyms` | Array of non-empty strings (default `[]`) |
| `images` | Array of strings (default `[]`) |
| `shelf_weight_kg` | Optional number |

### 6.2 Brand Slug Registration

Any brand handle used in `product_brands.csv` MUST also exist in 
`apps/backend/src/config/brands.ts`. The `BRAND_SLUGS` Set is used for 
O(1) validation. To add a new brand:

1. Add to `tmp/catalog-rebuild-v3/brands.csv` (CSV source)
2. Add to `apps/backend/src/config/brands.ts` (backend validator)
3. Use in `product_brands.csv` as `brand_handle`
4. Restart the backend
5. Run seed with `--upsert`

---

## 7. Operational Commands

### 7.1 Seed Pipeline

```bash
# Validate all CSVs (no API calls)
node catalogue/seed-catalogue.mjs --validate-only

# Preview what would be created
node catalogue/seed-catalogue.mjs --dry-run

# Full destructive rebuild (new environment)
node catalogue/seed-catalogue.mjs --apply --reindex

# Incremental update (price changes, new products)
node catalogue/seed-catalogue.mjs --upsert --reindex

# Preview incremental changes without applying
node catalogue/seed-catalogue.mjs --upsert --dry-run
```

### 7.2 Data Health Verification

```bash
# Verify DB + MeiliSearch consistency
node scripts/verify-data-health.mjs

# Quick check: document count should equal product count
curl -s http://localhost:7700/indexes/products/stats
```

### 7.3 Regenerate CSVs from Current DB

```bash
node tmp/delete_extract-pure-model.mjs
# Output written to: tmp/catalog-rebuild-v3/
```

### 7.4 Direct Database Access

```bash
# Connect interactively
docker exec indiagrocers-postgres psql -U medusa -d indiagrocers_dev

# Single query
docker exec indiagrocers-postgres psql -U medusa -d indiagrocers_dev \
  -c "SELECT handle, title, metadata->>'brand_slug' FROM product LIMIT 5"

# Products per brand
docker exec indiagrocers-postgres psql -U medusa -d indiagrocers_dev \
  -c "SELECT metadata->>'brand_slug' AS brand, COUNT(*) FROM product GROUP BY brand ORDER BY count DESC"
```

---

## 8. Diagnostics

### 8.1 Quick Health Check

```bash
# 1. Verify backend is running
curl -s http://localhost:9000/health

# 2. Check DB counts
docker exec indiagrocers-postgres psql -U medusa -d indiagrocers_dev \
  -c "SELECT 'products' AS tbl, COUNT(*) FROM product \
       UNION ALL SELECT 'variants', COUNT(*) FROM product_variant \
       UNION ALL SELECT 'categories', COUNT(*) FROM product_category"

# 3. Check MeiliSearch sync
curl -s http://localhost:7700/indexes/products/stats

# 4. Run full verification
node scripts/verify-data-health.mjs
```

Expected healthy state:
- `products` = 492
- `variants` = 685
- `categories` = 44
- MeiliSearch `numberOfDocuments` = 492

### 8.2 Common Failure Modes

#### "Product metadata validation failed" (HTTP 400)

**Cause:** One or more required metadata fields are missing or invalid.

**Check:** The Zod validator in `apps/backend/src/lib/validators/product-metadata.ts`
lists all required fields. Common issues:
- `brand_slug` not registered in `apps/backend/src/config/brands.ts`
- `vat_rate` not exactly `0` or `0.2`
- `allergens` array contains a value not in UK_14_ALLERGENS
- Required string fields (`ingredients`, `country_of_origin`, etc.) are empty

**Fix:** Add the missing brand to `brands.ts`, fix the CSV data, re-run seed.

#### "Invalid product handle" (HTTP 400)

**Cause:** The handle contains characters outside `[a-zA-Z0-9-]`. Medusa rejects
underscores, double hyphens, dots, and other special characters.

**Fix:** In v3, handles are auto-generated from titles. Do not manually
set `handle` in the POST body. If you need a specific handle, ensure it
matches `/^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/`.

#### Duplicate products in DB

**Symptom:** `COUNT(*) FROM product` is significantly higher than expected (492).

**Cause:** Running the seed script multiple times without a clean DB. The 
destructive reset deletes all products before creating, but if the seed
was run with `--upsert` on an already-populated DB, duplicates from 
previous `--apply` runs may persist.

**Fix:** Do a clean rebuild:
```bash
docker exec indiagrocers-postgres psql -U medusa -d indiagrocers_dev \
  -c "DELETE FROM product_variant; DELETE FROM product; DELETE FROM product_category"
curl -X DELETE http://localhost:7700/indexes/products/documents
node catalogue/seed-catalogue.mjs --apply --reindex
```

#### MeiliSearch document count ≠ DB product count

**Cause:** Reindex step failed or was skipped. The `--reindex` flag must be
passed explicitly.

**Fix:**
```bash
curl -X DELETE http://localhost:7700/indexes/products/documents
cd apps/meilisearch && npm run reindex
```

Or run the full seed with `--reindex`.

#### FK validation errors in --validate-only

**Cause:** A handle referenced in one CSV does not exist in the referenced
CSV. For example, a `variant_handle` in `brand_product_variants.csv` that
has no matching row in `variants.csv`.

**Fix:** Run `tmp/delete_extract-pure-model.mjs` to regenerate all CSVs
from the current DB state, then re-run validation.

#### Missing images

**Symptom:** `--validate-only` reports "⚠ N sellable units have no valid image".

**Cause:** The image file referenced in `brand_product_variants.csv.images` 
does not exist in `apps/backend/uploads/` or `apps/storefront/public/images/products/`.

**Fix:** Place the image file in `apps/backend/uploads/` using the naming 
convention `{brand}_{product-handle}.{ext}` (e.g., `daawat_basmati-rice-1kg.jpg`).
Update the `images` column in `brand_product_variants.csv`, then re-run seed.

---

## 9. Architecture Evolution

### v1 → v2 (May 2026)

**Problem:** Flat `products.csv` with one row per variant (612 rows). Product
identity and variant specs were merged into a single file. Brand was a column
on the product row. No procurement/vendor data.

**Change:** Split into `products-v2.csv` (product profiles) + `variants.csv`
(variant specs). Added `brands.csv`, `supplier_skus.csv`, `vendors.csv` for
procurement. Variants grouped by `product_handle || brand_handle`.

**Limitation of v2:** Products still had `brand_slug` baked into the row.
Product titles contained the brand name twice ("Natco - Natco - Basmati Rice").
The same pure product concept (e.g., "Basmati Rice") was split across 9 
different product handles, one per brand.

### v2 → v3 (June 2026) — Current

**Problem:** v2 conflated product identity with brand. Variants were
1:1 with products (no reuse). No multi-vendor sourcing. Single images
per variant. Unit definitions were embedded in variant rows.

**Changes:**

1. **Pure product extraction**: 503 brand-encoded product handles 
   extracted to 468 pure product concepts. Brand prefix stripped from
   titles. Products deduplicated by normalized title + category.

2. **Shared variant pool**: 697 variant rows collapsed to 69 unique
   unit definitions (500g, 1kg, 1.5L, etc.). Units are type-tagged 
   (`weight` | `volume` | `count` | `each`).

3. **Product-brand separation**: New `product_brands.csv` junction 
   table. One product can map to multiple brands. Each pairing gets
   its own shelf weight and status.

4. **Sellable unit layer**: New `brand_product_variants.csv` as the
   commerce layer. Barcodes, images, and active status live here,
   separated from pure variant identity.

5. **Multi-vendor sourcing**: `variant_vendor_prices.csv` supports 
   N vendors per sellable unit. Each vendor gets its own SKU, cost
   price, and primary/backup flag.

6. **Multi-image support**: `images` column as comma-separated 
   filenames on sellable units.

7. **Handle auto-generation**: MedusaJS rejects underscores and 
   double hyphens in handles (`/^[a-zA-Z0-9-]+$/`). v3 removed 
   explicit handle assignment; Medusa generates handles from the
   title string `"BrandName - ProductTitle"`.

### Future Enhancements (v4 Candidates)

| Enhancement | Rationale |
|-------------|-----------|
| Variant-level allergen/ingredient overrides | Some variants have different ingredients than parent product |
| Per-variant images (currently 1 image per sellable unit) | Multiple product photos per variant |
| Inventory quantity tracking per sellable unit | Stock levels not yet integrated |
| Shelf weight auto-calculation from product weight + packaging | Currently manual in `product_brands.csv` |
| Supplier lead time aggregation for "restock ETA" display | Multi-vendor data enables this |
| `backup_barcodes` scanning at checkout for Saturday delivery | Already in variant metadata, needs POS integration |
| Price history / price change log | Track weekly price.csv changes over time |

---

## 10. File Inventory

| File | Location | Purpose | Edits |
|------|----------|---------|-------|
| Products CSV | `tmp/catalog-rebuild-v3/products.csv` | 468 pure product identities | Product team |
| Variants CSV | `tmp/catalog-rebuild-v3/variants.csv` | 69 shared unit definitions | Dev (static) |
| Product-Brands CSV | `tmp/catalog-rebuild-v3/product_brands.csv` | 503 product×brand mappings | Marketing |
| Brand Product Variants CSV | `tmp/catalog-rebuild-v3/brand_product_variants.csv` | 685 sellable units | Product team |
| Prices CSV | `tmp/catalog-rebuild-v3/prices.csv` | 554 retail prices | Operations (weekly) |
| Vendor Prices CSV | `tmp/catalog-rebuild-v3/variant_vendor_prices.csv` | 685 vendor SKU mappings | Operations |
| Brands CSV | `tmp/catalog-rebuild-v3/brands.csv` | 69 brand definitions | Marketing |
| Categories CSV | `tmp/catalog-rebuild-v3/categories.csv` | 44 category tree nodes | Product team |
| Vendors CSV | `tmp/catalog-rebuild-v3/vendors.csv` | 21 vendor profiles | Operations |
| Seed Pipeline | `catalogue/seed-catalogue.mjs` | Reads CSVs → Medusa DB + MeiliSearch | Dev |
| Extraction Script | `tmp/delete_extract-pure-model.mjs` | Reads DB → regenerates all CSVs | Dev |
| Zod Validator | `apps/backend/src/lib/validators/product-metadata.ts` | API-level metadata validation | Dev |
| Brand Registry | `apps/backend/src/config/brands.ts` | 68 brand slugs for validation | Dev |
| Data Health | `scripts/verify-data-health.mjs` | DB + MeiliSearch consistency check | CI |
| V2 Backup | `catalogue/seed-catalogue-v2.mjs` | Previous pipeline (for rollback) | Archive |
