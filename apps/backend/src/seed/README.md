# Data Setup Pipeline

Full pipeline to set up IndiaGrocers from a fresh Medusa database.

## Prerequisites
- Backend running: `npx medusa develop`
- Admin credentials: `admin@example.com` / `password123`

## Step 1: Infrastructure

```bash
npx medusa exec src/migration-scripts/initial-data-seed.ts
```

Creates:
- Default sales channel
- Publishable API key
- Store: "IndiaGrocers London" (GBP)
- Region: UK (GB)
- Tax regions
- Stock location: "London Warehouse"
- Shipping profiles + options (Standard £3.99, Express £6.99)
- **16 parent + 50 child product categories**
- **12 product collections**
- Inventory items for all variants

## Step 2: Merge Weight Variants

```bash
node src/seed/merge-product-variants.mjs
```

Reads the Natco CSV catalog, identifies products that differ only by weight (e.g., "Chick Peas 400g", "Chick Peas 1kg", "Chick Peas 2kg"), and merges them into a single product with "Weight/Size" variants. Generates descriptions automatically.

**Result:** 290 individual products → ~238 consolidated products

## Step 3: Set Descriptions (if needed)

```bash
node src/seed/set-descriptions.mjs
```

Utility script. Generates descriptions for any product missing one: `"Premium {type} from Natco Foods. {category}."`

Run this if any products were created without descriptions.

## Step 4: Assign Categories

```bash
node src/seed/reassign-natco-categories.mjs
```

Reads the Natco CSV product types (e.g., "Lentils", "Spices", "Rice") and maps each product to the correct seed parent category using `POST /admin/product-categories/:id/products`.

Mapping: CSV "Product Type" column → Seed category handle (see `TYPE_TO_SEED` map in script).

## Step 5: Assign Collections

```bash
node src/seed/assign-collections-v2.mjs
```

Same CSV-based approach as Step 4, but maps to collections instead of categories. Uses `POST /admin/products/:id` with `collection_id`.

## Step 6: Set Inventory

```bash
node src/seed/set-inventory.mjs
```

Disables inventory management on all product variants (`manage_inventory: false`, `allow_backorder: true`). Products show as "in stock" without needing inventory levels.

## Cleanup (optional)

```bash
node src/seed/cleanup-and-migrate.mjs
```

Deletes non-Natco products (identified by handle prefix). Removes empty flat categories created by CSV import.

## Script Reference

| Script | API Calls Used | Idempotent? |
|---|---|---|
| `merge-product-variants.mjs` | POST /admin/products, DELETE /admin/products/:id | No (creates + deletes) |
| `set-descriptions.mjs` | POST /admin/products/:id | Yes (skips if description exists) |
| `reassign-natco-categories.mjs` | POST /admin/product-categories/:id/products | Yes (re-assigns same products) |
| `assign-collections-v2.mjs` | POST /admin/products/:id | Yes (skips if collection_id set) |
| `set-inventory.mjs` | POST /admin/products/:id | Yes (skips if already set) |
| `cleanup-and-migrate.mjs` | DELETE /admin/products/:id | No (destructive) |
