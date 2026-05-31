# IndiaGrocers — Developer Setup Guide

New developer machine? Follow this. One script or step-by-step.

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 26+ | `node -v` |
| npm | 11+ | `npm -v` |
| Yarn | 4+ | `yarn -v` |
| Docker Desktop | latest | `docker --version` |

---

## Quick: One-Command Setup

```powershell
.\scripts\setup.ps1                    # Full setup (Docker + DB + seed + search)
.\scripts\setup.ps1 -SkipDocker        # Docker already running
.\scripts\setup.ps1 -SkipDocker -SkipSeed  # Just install + migrate (data exists)
```

---

## Step-by-Step (if you prefer manual)

### 1. Docker containers

```bash
docker compose -f docker-compose.yml up -d
# If "container name already in use":
#   docker rm -f indiagrocers-meilisearch
#   docker compose -f docker-compose.yml up -d
```

| Service | Port | Credentials |
|---------|------|-------------|
| Postgres 16 | 5432 | `medusa`:`medusa`, db `indiagrocers` |
| Redis 7 | 6379 | — |
| MeiliSearch v1.12 | 7700 | — |

### 2. Install dependencies — ORDER MATTERS

```bash
npm install                      # Root first — links workspace packages
cd apps\storefront
yarn install                     # Storefront uses Yarn 4
cd ..\..
```

> **IMPORTANT:** Root `npm install` must complete before any backend command. The backend's subscriber (`product-index.ts`) imports `@indiagrocers/meilisearch` — a workspace package. Skipping root install gives: `Cannot find module '@indiagrocers/meilisearch'`.

### 3. Configure backend .env

```bash
cd apps\backend
copy .env.template .env          # if .env missing
```

Ensure `.env` contains:
```
DATABASE_URL=postgres://medusa:medusa@localhost:5432/indiagrocers
REDIS_URL=redis://localhost:6379
```

### 4. Database migration + admin user

```bash
cd apps\backend

# Creates all tables + seeds infrastructure (categories, regions, collections, warehouse)
npx medusa db:migrate

# Create admin account
npx medusa user -e admin@example.com -p password123
```

### 5. Start backend

```bash
npx medusa develop          # runs on :9000 — keep this terminal open
```

### 6. Seed product data

In a **new terminal**, with backend running on `:9000`:

```bash
cd apps\backend

# Import Natco Foods catalog (merges weight variants: 290 → 238 products)
node src/seed/merge-product-variants.mjs

# Map products to seed categories
node src/seed/reassign-natco-categories.mjs

# Map products to collections
node src/seed/assign-collections-v2.mjs

# Enable stock (disables inventory management — all products in-stock)
node src/seed/set-inventory.mjs
```

### 7. Configure MeiliSearch (search engine)

```bash
cd apps\meilisearch
npm run configure          # create search index with synonyms, filters, ranking
npm run reindex            # push all products into search index
```

### 8. Verify data quality

```bash
node scripts/verify-data-health.mjs
```

Checks: old category handles removed from MeiliSearch, product count matches, dietary flags present. Run after ANY data operation.

### 9. Start storefront

```bash
cd apps\storefront
yarn dev                   # runs on :8000 (turbopack)
```

**Open:** http://localhost:8000/gb  
**Admin:** http://localhost:9000/app (login: `admin@example.com` / `password123`)

---

## Architecture

```
Browser
  │
  ├── Category browsing → Next.js SSR → Medusa API (/store/products?category_id=...)
  │     (products fetched + sorted server-side, NO MeiliSearch involved)
  │
  ├── Search bar → Browser → MeiliSearch directly (POST /indexes/products/search)
  │     (bypasses Medusa entirely; index kept in sync by backend subscriber)
  │
  └── Cart/Checkout → Next.js Server Actions → Medusa API (/store/carts, /store/orders)
```

| Component | Powers | Comment |
|-----------|--------|---------|
| **Postgres** | All data storage | Products, orders, customers, categories |
| **Redis** | Unused (idle) | Container runs but Medusa uses in-memory defaults |
| **MeiliSearch** | Search bar only | NOT category browsing, NOT checkout |
| **Medusa Backend** | Everything else | Category pages, product detail, cart, checkout, orders |

---

## Dev servers (day-to-day)

```bash
# Terminal 1 — Backend (:9000)
cd apps\backend
npx medusa develop

# Terminal 2 — Storefront (:8000)
cd apps\storefront
yarn dev

# Or both at once (from root)
npm -r dev
```

---

## Common Issues

| Symptom | Fix |
|---------|-----|
| `docker: daemon not running` | Start Docker Desktop (tray icon) |
| `container name already in use` | `docker rm -f indiagrocers-meilisearch` |
| `Cannot find module '@indiagrocers/meilisearch'` | Run `npm install` from root BEFORE any backend command |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` error | Backend seed incomplete — re-run step 4 (`npx medusa db:migrate`) |
| Search returns no results | Run step 7 (`npm run configure` + `npm run reindex`) |
| Categories show no products | Check step 6 seed ran and backend is running on :9000 |
| Old category names in search results | Re-run step 8 verification to audit MeiliSearch handles |
| Tables don't exist (`relation does not exist`) | Run `npx medusa db:migrate` |
| Slow first page load | Normal — Next.js ISR caches pages; subsequent loads are fast |

---

## Reset Everything

```bash
docker compose down -v             # destroy containers + volumes
docker compose up -d               # fresh containers
# Then re-run steps 2-8
```

---

## Project Structure

```
IndiaGrocers-Fix/
├── scripts/setup.ps1              # Automated setup script
├── apps/
│   ├── backend/                   # MedusaJS v2.15.2 (npm)
│   │   ├── src/
│   │   │   ├── api/               # Custom store/admin API routes
│   │   │   ├── seed/              # Data pipeline (.mjs scripts)
│   │   │   ├── migration-scripts/ # Infrastructure seed (TS)
│   │   │   ├── subscribers/       # Event subscribers (MeiliSearch sync)
│   │   │   └── modules/           # Custom Medusa modules
│   │   └── .env.template
│   ├── storefront/                # Next.js 15 App Router (Yarn 4)
│   │   └── src/
│   │       ├── app/[countryCode]/ # Dynamic routes
│   │       ├── modules/           # Feature modules (cart, checkout, search, etc)
│   │       └── lib/               # SDK config, data fetching, utilities
│   └── meilisearch/               # Search index config + scripts (workspace pkg)
├── docker-compose.yml             # Postgres + Redis + MeiliSearch
├── SETUP.md                       # This file
├── AGENTS.md                      # Repo conventions + AI agent guardrails
└── Documentation/                 # Customer journeys, feature backlog
```
