# AGENTS.md — IndiaGrocers

MedusaJS v2.15.2 backend + Next.js 15 storefront. Multi-region DTC ecommerce
for Indian groceries (Natco Foods catalog), targeting UK (GB/GBP).

## Package manager — READ CAREFULLY

Root uses **npm workspaces** (`npm -r`). The README mentions pnpm — ignore that.

| Directory               | Manager    | Lockfile              |
|-------------------------|------------|-----------------------|
| `C:\IndiaGrocers\`      | npm 11     | `package-lock.json`   |
| `apps/backend/`          | npm        | (uses root lockfile)  |
| `apps/storefront/`       | **Yarn 4** | `yarn.lock`           |

Run storefront commands with `yarn`, not `npm`:
```
cd apps/storefront && yarn dev
```

## Data Architecture — CRITICAL RULES

> **VIOLATING THESE RULES CAUSES DAYS OF DRIFT AND RE-WORK.**
> Every agent, script, and manual action must follow these.

### Master/Reference Data Files — Separated by Change Frequency

| Frequency | File | Content | Who Edits |
|-----------|------|---------|-----------|
| **Rarely** | `catalogue/products.csv` | Product identity, variants, metadata, categories | Product team |
| | `catalogue/categories.csv` | Category tree | Product team |
| | `catalogue/collections.csv` | Collection definitions | Marketing |
| | `catalogue/category-assignment.json` | Product→Category mapping | Product team |
| | `catalogue/category-key-mapping.json` | JSON→DB key translation | Dev (static) |
| **Periodically** | `catalogue/products-collections.csv` | Product→Collection assignments | Marketing |
| | `catalogue/meilisearch/synonyms.csv` | Search synonyms | SEO team |
| **Weekly** | `catalogue/prices.csv` | Variant prices | Operations |

> **Full documentation:** `catalogue/DATA-ARCHITECTURE.md`

### The Pipeline — One Command

```bash
node catalogue/enrich.mjs --apply --reindex
```

This reads ALL files above and applies them to DB + MeiliSearch in order.

### Clean Slate — Every Update, Every Time

| Operation | Rule |
|-----------|------|
| **Reindex MeiliSearch** | **Always delete all documents first.** Enforced in `reindex-products.ts`. |
| **Seed fresh DB** | Always drop + recreate the database. Never seed on top of existing data. |
| **CSV enrichment** | `enrich.mjs --apply` is idempotent — detects creates vs updates by handle. Safe to re-run. |
| **Price update** | Edit `prices.csv` only. Products CSV untouched. Run `enrich.mjs --apply --reindex`. |
| **After ANY data change** | Run `npm run reindex` (with clean-slate delete). Run `node scripts/verify-data-health.mjs`. |

### Anti-Patterns — NEVER DO THESE

| ❌ Never | ✅ Instead |
|----------|-----------|
| Edit product in Medusa Admin UI | Edit `catalogue/products.csv` → `enrich.mjs --apply --reindex` |
| Edit category in Medusa Admin UI | Edit `catalogue/categories.csv` → `enrich.mjs --apply --reindex` |
| Edit price directly on product | Edit `catalogue/prices.csv` → `enrich.mjs --apply --reindex` |
| Add image via Medusa Admin upload | Copy to `apps/backend/uploads/` → set `thumbnail_url` in CSV → `enrich.mjs --apply --reindex` |
| Run `npm run reindex` without deleting | Always delete-all first (enforced in script) |

### MeiliSearch Document Count Check

After every reindex, verify document count equals product count:
```bash
# Expected: numberOfDocuments === product count in DB
curl -s http://localhost:7700/indexes/products/stats
```

If `numberOfDocuments > productCount`, the index has stale duplicates — nuke and reindex:
```bash
curl -X DELETE http://localhost:7700/indexes/products/documents
cd apps/meilisearch && npm run reindex
```

## Fresh Setup — Step by Step

Run these in order. The CSV catalogue is the single source of truth.

### Prerequisites
- Docker Desktop running (whale icon in tray, not animating)
- Node.js 26+, npm 11+, Yarn 4+

### Step 1: Docker
```bash
docker compose -f docker-compose.yml up -d
```

| Service | Port | Credentials |
|---------|------|-------------|
| Postgres 16 | 5432 | `medusa`:`medusa`, db `indiagrocers` |
| Redis 7 | 6379 | — |
| MeiliSearch v1.12 | 7700 | — |

### Step 2: Install dependencies (ORDER MATTERS)
```bash
# Root first — links workspace packages including @indiagrocers/meilisearch
npm install

# Storefront uses Yarn 4 separately
cd apps\storefront
yarn install
cd ..\..
```

### Step 3: Configure backend .env
```bash
cd apps\backend
cp .env.template .env   # if .env missing
```
Ensure `.env` has:
```
DATABASE_URL=postgres://medusa:medusa@localhost:5432/indiagrocers_dev
REDIS_URL=redis://localhost:6379
```

### Step 4: Create database + migrate + admin
```bash
cd apps\backend
docker exec indiagrocers-postgres psql -U medusa -d indiagrocers -c "CREATE DATABASE indiagrocers_dev;"
npx medusa db:migrate        # creates tables + seeds infrastructure (store, region, sales channels, categories, collections)
npx medusa user -e admin@example.com -p password123
```

### Step 5: Start backend
```bash
npx medusa develop   # runs on :9000 — keep this terminal open
```

### Step 6: Seed everything from CSV (in a new terminal, with backend running)
```bash
node catalogue/enrich.mjs --apply --reindex
```
This single command:
- Creates 502 products with variants, prices, metadata, tags, images, categories
- Syncs 140 categories with parent-child tree
- Creates product collections
- Links products to sales channels
- Auto-updates storefront publishable key
- Uploads synonyms to MeiliSearch
- **Deletes all MeiliSearch documents and reindexes from scratch (clean slate)**

### Step 7: Verify data quality
```bash
node scripts/verify-data-health.mjs
# Expected: 4 passed, 0 warnings, 0 failed

# Check MeiliSearch document count matches product count
curl -s http://localhost:7700/indexes/products/stats
# Expected: numberOfDocuments === 502
```

### Step 8: Start storefront
```bash
cd apps\storefront
yarn dev              # runs on :8000
```

Open: `http://localhost:8000/gb`

## Dev servers (after initial setup)

```bash
# Backend (:9000)
cd apps\backend
npx medusa develop

# Storefront (:8000, uses turbopack)
cd apps\storefront
yarn dev

# Both at once (root)
npm -r dev
```

## After any data change (seed, enrichment, migration)

```bash
cd apps\meilisearch && npm run reindex     # push changes to MeiliSearch
node scripts/verify-data-health.mjs         # confirm no old handles, correct counts
```

## Storefront build traps

`apps/storefront/next.config.js` has:
```js
eslint: { ignoreDuringBuilds: true },
typescript: { ignoreBuildErrors: true },
```
This means `yarn build` can succeed with lint/type errors. Always run separately:
```bash
yarn lint                    # ESLint (extends next/core-web-vitals)
npx tsc --noEmit             # typecheck
```

Storefront also runs `check-env-variables.js` at build startup — exits with error
if `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is not set.

## Routing

Storefront uses `[countryCode]` dynamic route via middleware
(`src/middleware.ts:105`). Country detection order:
1. Country in URL path
2. `x-vercel-ip-country` header (Vercel)
3. `NEXT_PUBLIC_DEFAULT_REGION` env var (default: `us`)
4. First available region

## Tests (backend only)

Jest 29 with `@swc/jest` transform (NOT ts-jest). Three modes selected
via `TEST_TYPE` env var. Run from `apps/backend/`:

| Command                     | Pattern                                    |
|-----------------------------|--------------------------------------------|
| `npm run test:unit`         | `**/src/**/__tests__/**/*.unit.spec.[jt]s` |
| `npm run test:integration:modules` | `**/src/modules/*/__tests__/**/*.[jt]s` |
| `npm run test:integration:http`    | `**/integration-tests/http/*.spec.[jt]s` |

Setup file: `integration-tests/setup.js` (loaded for all tests).
Note: No actual integration test files exist yet.

## Framework Enhancements

Extensions to Medusa v2 that fix framework-level issues. Maintained separately
from application code so they can be audited and reverted when upgrading.

Location: `apps/backend/src/framework-enhancements/`

| Enhancement | Medusa Version | Fixes | Status |
|-------------|---------------|-------|--------|
| `stripe-gbp-provider` | 2.15.2 | 100× Stripe overcharge for GBP — `getSmallestUnit()` double-converts pence | Active |

### Upgrade Procedure
1. Run `npx medusa db:migrate` after upgrading Medusa
2. For each enhancement, follow its `README.md` upgrade checklist
3. If no longer needed, delete the enhancement directory and revert `medusa-config.ts`
4. Run full test suite: `npx playwright test --project=bdd && node tests/verify-pricing.mjs`

## Seed pipeline (catalogue system)

Single command from CSV master files:

```bash
# Validate (compare CSV vs DB)
node catalogue/enrich.mjs --validate-only

# Apply all changes (products, categories, tags, metadata, MeiliSearch)
node catalogue/enrich.mjs --apply

# Weekly price updates
node catalogue/update-prices.mjs --apply

# Generate CSVs from current DB (one-time bootstrap)
node catalogue/generate-csvs.mjs
```

**CSV files are the source of truth:** `catalogue/products.csv` (612 rows),
`catalogue/categories.csv` (208), `catalogue/prices/current.csv` (612).

Documentation: `catalogue/README.md`
Schema: `catalogue/schema.json`

### Snapshot Seed (new environments)

```bash
node scripts/data-pipeline/export-snapshot.mjs          # Export from working DB
node scripts/data-pipeline/seed-from-snapshot.mjs --apply  # Import to fresh DB
```

### Archived Scripts

Historical scripts moved to `archive/`. See `scripts/data-pipeline/DATA-PIPELINE-MASTER-MAP.md` for reference.

## Documentation

| File | Purpose |
|------|---------|
| `AGENTS.md` | This file — repo setup, commands, gotchas |
| `SETUP.md` | **Start-to-finish setup** — single document for new dev machines |
| `Documentation/customer-journeys-and-features.md` | Gherkin E2E scenarios + user story backlog |
| `Documentation/QA-VALIDATION-WORKBOOK.md` | **QA manual test workbook** — step-by-step customer journey validation with web/mobile checkboxes |
| `tests/test-plan.md` | Automated test plan — 10 workflows mapped to test files |
| `data-design/IMPLEMENTATION-PLAN.md` | Epics, user stories, implementation order, script index |
| `data-design/QA-GATES.md` | 5-phase QA gate checklist |
| `Implementation/README.md` | Implementation tracker, project structure, brand colors |

## Architecture notes

```
apps/backend/src/
  api/          custom store/admin API routes
  admin/        admin dashboard (Medusa admin UI widgets)
  seed/         data pipeline scripts (.mjs)
  migration-scripts/  initial-data-seed.ts
  modules/      custom Medusa modules + workflow definitions
  workflows/    Medusa workflows
  jobs/         scheduled jobs
  subscribers/  event subscribers
  links/        module links

apps/storefront/src/
  app/[countryCode]/  Next.js App Router
  modules/            feature modules (cart, checkout, products, account, etc)
  lib/                SDK config, data fetching, hooks, utilities
```

Storefront path aliases: `@lib/*` → `src/lib/*`, `@modules/*` → `src/modules/*`

Backend tsconfig: `strictNullChecks: true`, outputs to `.medusa/server/`.
`.medusa/` is excluded from npm workspaces and Jest ignores it.

## Environment

| Variable                            | Required | Notes                        |
|-------------------------------------|----------|------------------------------|
| `DATABASE_URL` (backend)            | YES      | Postgres connection string   |
| `REDIS_URL` (backend)               | YES      | For event bus + cache        |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`| YES      | Checked at storefront startup|
| `NEXT_PUBLIC_DEFAULT_REGION`        | no       | Defaults to `us`             |
| `MEDUSA_BACKEND_URL` (storefront)   | no       | Defaults to `localhost:9000` |

## Docker

| Service  | Image         | Port | Auth / DB                    |
|----------|---------------|------|------------------------------|
| postgres | `postgres:16` | 5432 | `medusa`:`medusa`, db `indiagrocers` |
| redis    | `redis:7-alpine` | 6379 | —                       |
| meilisearch | `getmeili/meilisearch:v1.12` | 7700 | — (no auth in dev) |

All three services start with one command:
```bash
docker compose -f C:\IndiaGrocers\docker-compose.yml up -d
```

MeiliSearch index must be configured after first Docker start:
```bash
cd C:\IndiaGrocers\apps\meilisearch
npm run configure
npm run reindex
```

## Brand

Primary brand color: `#FF6B35` (orange). Full palette in `Implementation/README.md`.

## Image Naming Convention

**Format**: `{brand}_{product-handle}.{ext}`  
**Examples**: `natco_basmati-rice-2kg.jpg`, `trs_coarse-black-pepper.jpg`

| Rule | Reason |
|------|--------|
| Brand prefix required | Avoids collisions when multiple brands share same product name |
| Product handle as filename | Matches product handle in Medusa — trivial to map by script |
| Lowercase only | Avoids case-sensitivity issues on CDN |
| No spaces/special chars | URL-safe without encoding |

**For future catalogs (TRS, Haldiram, etc.)**: Download images from Shopify JSON before importing products. Name files as `{brand}_{handle}.{ext}` and save to `apps/storefront/public/images/`. Set thumbnail to `/images/{brand}_{handle}.{ext}` during product creation.

---

## Architecture Guardrails — Default Behaviour

> **These apply to every analysis, fix, feature, and code change unless the user
> explicitly states "deep analysis not required."**

### Before Any Fix

| Agent must | Details |
|-----------|---------|
| Trace the **complete data flow** | From source of truth → API → cache → UI. Identify ALL components in the chain before proposing any fix. |
| Identify **every file, system, and data contract** affected | List second-order effects: caching layers, other pages, other APIs, other components that read the same data. |
| Challenge **the assumption beneath the bug** | Ask: is the field we're fixing inherently unreliable? Is the architecture assuming something that isn't true? |
| Design for the **long-term steady state** | The fix must work correctly after orders are placed, after cache invalidates, after data drifts, across all fetch contexts. |

### Before Any Feature

| Agent must | Details |
|-----------|---------|
| Design the **data architecture first** | What data lives where, how it flows, how it invalidates, what its freshness requirements are. Derive implementation from this architecture. |
| Separate concerns by **change frequency** | Identity (stable), pricing (semi-stable), inventory (volatile) → different cache TTLs, different fetch paths. |
| Identify the **single source of truth** | Every data element must have exactly one authoritative source. UI reads from that source. |
| Evaluate **caching strategy holistically** | What gets cached, for how long, what triggers invalidation, what's the worst-case staleness. |

### Before Proposing "A Fix"

| Agent must | Details |
|-----------|---------|
| Explain **why the system-level design makes this fix correct** | Not "this line fixes the bug" — "this architecture change makes the entire class of bugs impossible." |
| Identify **what could regress** | List components/pages/flows that use the same data and could break silently. |
| Describe the **long-term steady state** | After 100 orders, after cache invalidation, after a cold start — does this hold? |
| Prefer **architectural separation over patching** | If two concerns are coupled (inventory merged into product), separate them rather than adding if-else guards around the coupling. |

### Bandaids vs Architecture — Distinction

| ❌ Band-aid (unacceptable) | ✅ Architecture fix (required) |
|---|---|
| Add `?? 0` or `== null` guard to handle missing data | Fix the data source to reliably provide the data, or separate the concern |
| Add a try/catch that swallows the real error | Trace the error to its root and fix the data contract |
| Add `cache: "no-store"` to force freshness | Design a caching strategy that matches data volatility |
| Mutate the product object to inject inventory | Create a separate inventory data layer with its own fetch path |
| Fix one component's stock check | Audit all components that read stock, design a single inventory source |
| Clear the cache manually | Design automatic cache invalidation triggered by the data change event |

Unless user states "deep analysis not required", every change follows these rules.

---

## AI Agent Guardrails — Mandatory

### Tests

| User asks | Agent must |
|---|---|
| "add tests" / "add a test" / "enhance tests" | **APPEND new test sections ONLY.** Never overwrite, delete, or replace existing test code. Add new `console.log("\nN. Section Name\n")` blocks after the last existing section. |
| "fix tests" / "change test" / "rewrite test" / "update test" | Only then modify existing test code. Reference the specific section number. |
| "run tests" / "check tests" | Run the existing test file without modifications. |
| "what does test X check" | Read the test file and explain. Do not edit. |

**Rule:** When in doubt about the user's intent — whether they want new tests or modifications to existing ones — **ASK before touching existing test code.**

### Code

| User asks | Agent must |
|---|---|
| "build" / "create" / "implement" | Create NEW files or add to existing files without removing working code. |
| "fix" / "rewrite" / "change" / "update" | Only then modify existing logic. |
| "delete" / "remove" / "strip" | Only then delete code or files. |

**Rule:** Never silently overwrite or delete existing functionality. If an edit would remove existing tests, validations, or features, WARN the user first.
