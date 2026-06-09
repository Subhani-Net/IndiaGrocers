# IndiaGrocers — Setup Guide

> **One document to rule them all.** Follow these steps in order to get the full
> stack running on any developer machine. ~15 minutes with fast internet.

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Docker Desktop | Latest | `docker --version` (whale icon in tray, not animating) |
| Node.js | 26+ | `node --version` |
| npm | 11+ | `npm --version` |
| Yarn | 4+ | `yarn --version` |

---

## Step 1 — Start Docker Services

```bash
docker compose -f docker-compose.yml up -d
```

| Service | Port | Credentials |
|---------|------|-------------|
| Postgres 16 | 5432 | `medusa`:`medusa`, db `indiagrocers` |
| Redis 7 | 6379 | — |
| MeiliSearch v1.12 | 7700 | — |

> If "container name already in use": `docker rm -f indiagrocers-meilisearch`

---

## Step 2 — Install Dependencies (ORDER MATTERS)

```bash
# Step 2a: Root — links workspace packages including @indiagrocers/meilisearch
npm install

# Step 2b: Storefront uses Yarn 4 separately
cd apps\storefront
yarn install
cd ..\..
```

> Root `npm install` must complete before backend commands work. The backend
> subscriber imports `@indiagrocers/meilisearch` which is a workspace package.

---

## Step 3 — Configure Backend .env

```bash
cd apps\backend
cp .env.template .env   # if .env missing
```

Ensure `.env` has these minimum values:

```env
DATABASE_URL=postgres://medusa:medusa@localhost:5432/indiagrocers
REDIS_URL=redis://localhost:6379
STRIPE_SECRET_KEY=sk_test_xxx      # from Stripe dashboard
SENDGRID_API_KEY=SG.xxx            # from SendGrid (optional for dev)
SENDGRID_FROM=info@srsoils.com
```

The `.env.template` includes full instructions with `openssl rand -hex 64` commands.

---

## Step 4 — Migrate Database + Create Admin

```bash
cd apps\backend
npx medusa db:migrate          # creates tables + seeds infrastructure
npx medusa user -e admin@example.com -p password123
```

---

## Step 5 — Start Backend

```bash
cd apps\backend
npx medusa develop              # runs on :9000 — keep this terminal open
```

Verify: `python -c "import urllib.request,json;print(json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:9000/auth/user/emailpass',json.dumps({'email':'admin@example.com','password':'password123'}).encode(),{'Content-Type':'application/json'})))['token'][:10])"` should print a token.

---

## Step 6 — Seed Products

In a **new terminal**, with the backend running. The automated script handles all
of this: `powershell -File scripts\setup.ps1 -SkipDocker`

Or run individually:

### 6A — Product Import (data pipeline)

```bash
cd apps\backend

# Core pipeline (Natco products + category + inventory)
node src/seed/merge-product-variants.mjs       # import Natco products → 290→238 consolidated
node src/seed/migrate-to-natco-categories.mjs   # map products to new category tree
node src/seed/assign-categories-from-titles.mjs # title-based category assignment
node src/seed/fix-category-handles.mjs          # fix old category handles
node src/seed/set-inventory.mjs                  # enable stock (disable inventory mgmt)
```

### 6B — TRS Products

```bash
cd scripts
node import-trs-products.mjs              # import 50 TRS brand products (spices, lentils, etc.)
node rename-trs-images.mjs                # rename TRS images to {brand}_{handle} format
node fix-trs-images.mjs                   # fix TRS image paths
```

### 6C — MVC Products (Minimum Viable Catalogue)

```bash
cd scripts\mvc
node import-round1.mjs                    # ~99 MVC Round 1 products (Shan, MDH, Tilda, Kohinoor, etc.)
node create-categories.mjs                # create ~23 new MVC category handles
node pipeline.mjs --apply                 # enrichment: tags, dietary flags, allergens, descriptions, synonyms
node assign-images.mjs                    # assign images to MVC products
```

### 6D — Images

```bash
cd scripts
node download-natco-images.mjs            # download 357 Natco product images
node set-thumbnails.mjs                   # (from apps/backend/src/seed) set product thumbnails
```

### 6E — Other Data Fixes

```bash
cd apps\backend\src\seed
node set-descriptions.mjs                 # generate descriptions for products missing them
node enrich-metadata.mjs                  # apply metadata enrichment
cd ..\..\..\
node scripts\fix-tinned-products.mjs     # fix tinned product category assignments
node scripts\enrich-from-csv.mjs --apply # CSV-based enrichment (dietary, tags, allergens)
```

---

## Step 7 — Configure Search

```bash
cd apps\meilisearch
npm run configure        # create MeiliSearch index + synonyms + filters + ranking rules
npm run reindex          # push all 506 products into search index
```

---

## Step 8 — Verify Data Health

```bash
cd ..\..
node scripts/verify-data-health.mjs

# Expected output:
#   ✅ No forbidden handles found
#   ✅ Product count: 506
#   ✅ Dietary flags present
#   === RESULT: 4 passed, 0 warnings, 0 failed ===
```

---

## Step 9 — Start Storefront

```bash
cd apps\storefront
yarn dev                   # runs on :8000 with turbopack
```

Open `http://localhost:8000/gb` — you should see the homepage with category grid, hero, and promo banners.

---

## Step 10 — Create Test User (for automated tests)

```bash
powershell -File scripts\setup-test-user.ps1
# Creates: test-user@example.com / TestPass1
```

---

## Step 11 — Run Full Test Suite

```bash
# Data checks (no backend running needed beyond Docker)
node scripts/verify-data-health.mjs
node tests/verify-pricing.mjs
node tests/verify-consolidation.mjs
node tests/verify-catalog.mjs

# Playwright E2E tests (requires storefront on :8000)
cd apps\storefront
npx playwright test --project=e2e    # Traditional Playwright (~150 tests)
npx playwright test --project=bdd    # BDD Gherkin scenarios (~130 scenarios)

# Single feature
npx playwright test --project=bdd --grep "Cart Management"
```

---

## Dev Loop (After Initial Setup)

### Backend changes
```bash
cd apps\backend
npx medusa develop        # auto-reloads on source changes
```

### Storefront changes
```bash
cd apps\storefront
yarn dev                  # auto-reloads with turbopack HMR
```

### After any data change (seed, enrichment, migration)
```bash
cd apps\meilisearch && npm run reindex     # push changes to MeiliSearch
node scripts/verify-data-health.mjs         # confirm no regressions
```

---

## Common Issues

| Symptom | Fix |
|---------|-----|
| `Cannot find module '@indiagrocers/meilisearch'` | Run `npm install` at root first (Step 2a) |
| Backend won't start — port 5432 refused | Start Docker: `docker compose up -d` |
| MeiliSearch connection refused | Start Docker: `docker compose up -d` |
| Storefront shows "Failed to fetch" | Backend not running on :9000 |
| `npx medusa` command not found | Run `npm install` in `apps/backend` |
| Payment gives "apiKey is missing" | Set `STRIPE_SECRET_KEY` in `apps/backend/.env` |
| Prices showing as `£99.00` instead of `£0.99` | This was fixed in D8 — `convertToLocale` in `money.ts` now divides by 100 |
| Product card links go to `/products/undefined` | This was fixed in D9 — `handle` field added to API `fields` parameter |
| Stripe charges 100× expected amount | This was fixed — `stripe-gbp-provider.ts` in framework-enhancements handles the unit conversion |

---

## Framework Enhancements

The `apps/backend/src/framework-enhancements/` directory contains patches to
Medusa v2 that fix framework-level issues. These are maintained separately so
they can be audited when upgrading.

| Enhancement | File | Fixes |
|-------------|------|-------|
| `stripe-gbp-provider` | `payment/stripe-gbp-provider.ts` | 100× Stripe overcharge — Medusa v2 stores pence but Stripe provider's `getSmallestUnit()` double-converts |

**Upgrade check:** After upgrading `@medusajs/payment-stripe`, verify payment
session amounts match Stripe dashboard charges. If they match without the
custom provider, delete the enhancement and revert `medusa-config.ts`.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `AGENTS.md` | Full architecture, defects, go-live requirements |
| `SETUP.md` | This file — start-to-finish setup |
| `Documentation/QA-VALIDATION-WORKBOOK.md` | QA manual test workbook |
| `tests/test-plan.md` | Automated test plan |
| `e2e/features/` | 16 Gherkin `.feature` files — system behaviour source of truth |
| `.opencode/skills/bdd-testing.md` | BDD rules auto-loaded for AI agents |

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `password123` |
| Test User (BDD) | `test-user@example.com` | `TestPass1` |
| Stripe test card | `4242 4242 4242 4242` | Any future date, any CVC |
