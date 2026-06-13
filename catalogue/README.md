# IndiaGrocers — Product Catalogue System

> **Single source of truth for all product data.** CSV files only.
> One engine (`enrich.mjs`) applies everything to DB + MeiliSearch.
> **Clean slate every time. No appending. No drift.**

## Files

| File | Purpose | Who Edits |
|------|---------|-----------|
| `products.csv` | All 506 products × variants (612 rows) | Product team |
| `categories.csv` | 208 category tree handles | Product team |
| `prices/current.csv` | Current prices (updated weekly) | Operations |
| `meilisearch/synonyms.csv` | Search synonyms | Product/SEO |
| `meilisearch/filters.csv` | Filterable attributes | Dev |
| `meilisearch/ranking.csv` | Ranking rules | Dev |
| `schema.json` | Column definitions + display config | Dev |

## Scripts

| Script | When | What |
|--------|------|------|
| `enrich.mjs` | On any CSV change | Apply products, metadata, categories, tags, MeiliSearch config |
| `update-prices.mjs` | Weekly | Apply price changes, archive old prices |
| `generate-csvs.mjs` | One-time bootstrap | Export current DB to CSVs (run only once) |

## Daily Operations

### Edit a product description
```bash
# 1. Edit products.csv → change description column
# 2. Apply
node catalogue/enrich.mjs --apply
```

### Weekly price update
```bash
# 1. Edit prices/current.csv
# 2. Apply
node catalogue/update-prices.mjs --apply
# 3. Reindex search
cd apps/meilisearch && npm run reindex
```

### Add a new product
```bash
# 1. Add one row to products.csv
# 2. Apply
node catalogue/enrich.mjs --apply
```

---

## Image Management

### Architecture

Images use a **single source + config-driven** pattern. The DB stores relative
paths (`/uploads/filename.jpg`). A single utility function `getImageUrl()` in
the storefront resolves the full URL at render time using the
`NEXT_PUBLIC_IMAGE_BASE_URL` environment variable.

```
DB: /uploads/natco_soya-chunks-700g.jpg

Admin (:9000)  → loads from same origin → :9000/uploads/...  ✓
Storefront     → getImageUrl() prepends IMAGE_BASE_URL
                 dev:  http://localhost:9000/uploads/...
                 prod: https://cdn.indiagrocers.co.uk/uploads/...
```

### Single source of truth

All 755 product images live in `apps/backend/uploads/`. This is the canonical
location. The storefront proxies `/uploads/*` requests to the backend via a
Next.js rewrite in `next.config.js`.

### Configuration

| Env Variable | Dev | Production |
|-------------|-----|------------|
| `NEXT_PUBLIC_IMAGE_BASE_URL` | `http://localhost:9000` | `https://cdn.indiagrocers.co.uk` |
| `backend/uploads/` | Local directory (755 files) | Same files uploaded to CDN |

### Switching to CDN (production)

1. Upload `apps/backend/uploads/` contents to your CDN
2. Set `NEXT_PUBLIC_IMAGE_BASE_URL=https://cdn.indiagrocers.co.uk` in
   `apps/storefront/.env`
3. No DB changes required — all products continue to work

### Files involved

| File | Role |
|------|------|
| `apps/backend/uploads/` | **Canonical image source** — 755 images |
| `apps/storefront/src/lib/util/images.ts` | `getImageUrl()` — single image URL resolver |
| `apps/storefront/.env` | `NEXT_PUBLIC_IMAGE_BASE_URL` config |
| `apps/storefront/next.config.js` | Rewrite `/uploads/*` → backend |
| `apps/backend/src/api/uploads/[filename]/route.ts` | Serves images from disk |

---

## Fresh Database Setup (CSV as Source of Truth)

Complete setup from zero using the unified enrichment engine.

### Prerequisites
- Docker Desktop running (postgres + redis + meilisearch)
- Node.js 26+, npm 11+, Yarn 4+

### Step 1: Start Docker
```bash
docker compose -f docker-compose.yml up -d
```

### Step 2: Install dependencies
```bash
npm install
cd apps\storefront && yarn install && cd ..\..
```

### Step 3: Create database + migrate + admin
```bash
cd apps\backend
cp .env.template .env

# Ensure DATABASE_URL=postgres://medusa:medusa@localhost:5432/indiagrocers_dev

docker exec indiagrocers-postgres psql -U medusa -d indiagrocers -c "CREATE DATABASE indiagrocers_dev;"
npx medusa db:migrate
npx medusa user -e admin@example.com -p password123
```

### Step 4: Start backend
```bash
npx medusa develop   # keep this terminal open — runs on :9000
```

### Step 5: Seed everything from CSV (single command)
```bash
# In a new terminal, from root:
node catalogue/enrich.mjs --apply
```

This single command:
- Creates 502 products with variants, prices, and ALL metadata
- Syncs 140 categories with parent-child relationships
- Creates 13 product collections
- Links products to sales channels
- Auto-updates storefront publishable key
- Uploads 94 synonyms to MeiliSearch

### Step 6: Configure search
```bash
cd apps\meilisearch
npm run configure       # searchable/filterable/sortable + synonyms from CSV
npm run reindex         # push all products to MeiliSearch
```

### Step 7: Verify
```bash
node scripts/verify-data-health.mjs
# Expected: 4 passed, 0 warnings, 0 failed
```

### Step 8: Start storefront
```bash
cd apps\storefront
yarn dev   # runs on :8000
```

Open: `http://localhost:8000/gb`
Admin: `http://localhost:9000/app` (admin@example.com / password123)
