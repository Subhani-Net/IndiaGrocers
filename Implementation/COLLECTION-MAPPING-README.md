# IndiaGrocers — Collection Mapping Documentation

## Purpose
Creates Products → Collections mapping for the storefront homepage FeaturedProducts component to display product rails.

## Prerequisites
- Medusa backend running at `http://localhost:9000`
- Admin user: `admin@example.com` / `password123`
- All products imported (IndiaGrocers CSV + Natco API import)

## Files in this directory

| File | Purpose |
|---|---|
| `collection-product-mapping.json` | Source mapping: collection → product IDs |
| `scripts/create-collections.mjs` | Reads mapping, creates collections, assigns products |
| `scripts/upload-images-by-mapping.mjs` | Reads mapping, uploads images via POST /admin/uploads |
| `scripts/import-csv-catalog.mjs` | Imports CSV catalog into Medusa via API |
| `scripts/upload-sample-images.mjs` | Uploads a sample batch of 10 product images |

## Steps Performed

### Step 1 — Build Product ID Mapping
1. Queried `GET /admin/products?limit=500&fields=id,handle,title` to get all 407 products
2. Filtered IndiaGrocers (117, no `natco-` prefix) and Natco (290, `natco-` prefix) products
3. Manually grouped products into 6 collections by category/title
4. Saved to `collection-product-mapping.json` with verified product IDs

### Step 2 — Create Collections via API
```
POST /admin/collections
{
  "title": "Best Sellers",
  "handle": "best-sellers",
  "metadata": { "description": "..." }
}
```
Created 6 collections:
- Best Sellers (20 products)
- Rice & Grains (12 products)  
- Dals & Lentils (28 products)
- Spices & Masalas (13 products)
- Snacks & Namkeen (7 products)
- Cooking Essentials (12 products)

### Step 3 — Assign Products via API
```
POST /admin/collections/{collection_id}/products
{
  "add": ["prod_01xxx", "prod_01yyy"]
}
```
Assigned 92 unique products across 6 collections.

## How to Re-run

```powershell
# Start backend first
cd C:\IndiaGrocers\apps\backend
npx medusa develop

# Then run the script
cd C:\IndiaGrocers\Implementation\scripts
node create-collections.mjs
```

## How to Verify

```javascript
// Check collections exist
GET /admin/collections?limit=20&fields=id,title,handle

// Check products in a collection
GET /admin/collections/{id}?fields=id,title,products.id
```

## Collection JSON Format

```json
{
  "collections": [
    {
      "name": "Collection Name",
      "handle": "collection-handle", 
      "description": "Description for SEO",
      "product_ids": ["prod_xxx", "prod_yyy"]
    }
  ]
}
```

**Naming convention:**
- Collection handle: lowercase, hyphenated, unique
- Product IDs: must exist in Medusa (verify with `GET /admin/products/:id`)
