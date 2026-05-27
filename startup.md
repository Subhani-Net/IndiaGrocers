# IndiaGrocers — Startup Guide

## Prerequisites

- Docker Desktop installed and running
- Node.js 20+ installed
- npm 10+ installed

## One-time setup (skip if already done)

```bash
# Install dependencies
cd C:\IndiaGrocers
npm install
cd apps\storefront
yarn install

# Copy env files and configure
cd C:\IndiaGrocers\apps\backend
copy .env.template .env
# → Edit .env: set DATABASE_URL=postgresql://medusa:medusa@localhost:5432/indiagrocers

# Migrate database
npx medusa db:migrate

# Create admin user
npx medusa user -e admin@example.com -p password123

# Seed initial data (store, region, categories, collections)
npx medusa exec src/migration-scripts/initial-data-seed.ts
```

### If migrating from old seed data (existing database only)

```bash
cd C:\IndiaGrocers\apps\backend

# 1. Update category handles to design names
node src/seed/fix-category-handles.mjs

# 2. Assign products to new categories by title matching
node src/seed/assign-categories-from-titles.mjs

# 3. Enrich product metadata (allergens, VAT, brand, weight, etc.)
node src/seed/enrich-metadata.mjs
```

> **Fresh setup**: the `initial-data-seed.ts` already creates categories with correct design handles, so the migration scripts above are **not needed**. They are only for upgrading a database that was seeded with the original (pre-May-2026) data.
```

## Every session — start the application

### 1. Start infrastructure (Postgres + Redis + MeiliSearch)

```bash
docker compose -f C:\IndiaGrocers\docker-compose.yml up -d
```

### 2. Configure MeiliSearch (first time only, or after docker volume wipe)

```bash
cd C:\IndiaGrocers\apps\meilisearch
npm run configure
```

### 3. Reindex products into MeiliSearch (first time only)

```bash
# Backend must be running for this step — do it after step 4 if first time
cd C:\IndiaGrocers\apps\meilisearch
npm run reindex
```

### 4. Start backend — Terminal 1

```bash
cd C:\IndiaGrocers\apps\backend
npx medusa develop
```

### 5. Start storefront — Terminal 2

```bash
cd C:\IndiaGrocers\apps\storefront
yarn dev
```

---

## URLs

| Service | URL |
|---|---|
| Storefront | [http://localhost:8000/gb](http://localhost:8000/gb) |
| Medusa Admin | [http://localhost:9000/app](http://localhost:9000/app) |
| MeiliSearch | [http://localhost:7700](http://localhost:7700) |
| Backend health | [http://localhost:9000/health](http://localhost:9000/health) |
| Storefront health | [http://localhost:8000/gb/health](http://localhost:8000/gb/health) |

## Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `password123` |

## Stop everything

```bash
docker compose -f C:\IndiaGrocers\docker-compose.yml down
```

## Troubleshooting

| Problem | Fix |
|---|---|
| Docker not running | Start Docker Desktop |
| Port 5432/6379/7700 in use | Stop existing containers: `docker compose down` |
| `npm install` fails | Delete `node_modules` and `package-lock.json`, retry |
| Backend can't connect to DB | Check `DATABASE_URL` in `.env` |
| Products not showing | Run seed: `npx medusa exec src/migration-scripts/initial-data-seed.ts` |
| Search returns no results | Run: `cd apps/meilisearch && npm run configure && npm run reindex` |

## Catalogue seed pipeline (if products need to be re-imported)

```bash
# Backend must be running on http://127.0.0.1:9000
# Admin must be logged in with admin@example.com / password123

cd C:\IndiaGrocers\apps\backend

# Step 1: Seed infrastructure (already done above)
npx medusa exec src/migration-scripts/initial-data-seed.ts

# Step 2: Merge product variants (290 → 238)
node src/seed/merge-product-variants.mjs

# Step 3: Reassign categories from CSV
node src/seed/reassign-natco-categories.mjs

# Step 4: Assign collections
node src/seed/assign-collections-v2.mjs

# Step 5: Set inventory levels
node src/seed/set-inventory.mjs
```
