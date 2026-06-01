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

## Fresh Setup — Step by Step

> **⚠️ BEFORE ANY DATA WORK:** Read `scripts/data-pipeline/QA-GATES.md`.  
> All 5 phases must pass their gate before proceeding.  
> **Never enrich incomplete data.**

Run these in order. The automated script at `scripts/setup.ps1` does all of this.

### Prerequisites
- Docker Desktop running (whale icon in tray, not animating)
- Node.js 26+, npm 11+, Yarn 4+

### Step 1: Docker
```bash
docker compose -f docker-compose.yml up -d
# If "container name already in use": docker rm -f indiagrocers-meilisearch
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
> IMPORTANT: Root `npm install` must complete before backend commands work. The backend subscriber imports `@indiagrocers/meilisearch` which is a workspace package. Running `npx medusa user` without root install will fail with `Cannot find module '@indiagrocers/meilisearch'`.

### Step 3: Configure backend .env
```bash
cd apps\backend
cp .env.template .env   # if .env missing
```
Ensure `.env` has:
```
DATABASE_URL=postgres://medusa:medusa@localhost:5432/indiagrocers
REDIS_URL=redis://localhost:6379
```

### Step 4: Migrate + create admin
```bash
cd apps\backend
npx medusa db:migrate        # creates tables + seeds infrastructure (categories, regions, collections)
npx medusa user -e admin@example.com -p password123
```

### Step 5: Start backend
```bash
npx medusa develop   # runs on :9000 — keep this terminal open
```

### Step 6: Seed products (in a new terminal, with backend running)
```bash
cd apps\backend
node src/seed/merge-product-variants.mjs       # import Natco products → 290→238 consolidated
node src/seed/reassign-natco-categories.mjs     # map products to seed categories
node src/seed/assign-collections-v2.mjs          # map products to collections
node src/seed/set-inventory.mjs                  # enable stock (disable inventory mgmt)
```

### Step 7: Configure search
```bash
cd apps\meilisearch
npm run configure       # create MeiliSearch index with synonyms, filters, ranking
npm run reindex         # push all products into search index
```

### Step 8: Verify data quality
```bash
node scripts/verify-data-health.mjs
# Checks: no old category handles in MeiliSearch, product count matches,
# dietary flags present. Run after ANY data operation.
```

### Step 9: Start storefront
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

## Seed pipeline (custom, NOT `medusa seed`)

6-step pipeline requiring backend running on `http://127.0.0.1:9000`.
Admin auth: `admin@example.com` / `password123`.

```
1. npx medusa exec src/migration-scripts/initial-data-seed.ts   # infra
2. node src/seed/merge-product-variants.mjs   # weights -> variants (290→238)
3. node src/seed/reassign-natco-categories.mjs   # categories from CSV
4. node src/seed/assign-collections-v2.mjs       # collections from CSV
5. node src/seed/set-inventory.mjs               # disable inventory mgmt
```

Step 1 uses `medusa exec` (Medusa TS runtime). Steps 2-5 use plain `node`
(.mjs scripts call Medusa Admin API directly).

Detailed pipeline docs: `apps/backend/src/seed/README.md`.

## Documentation

| File | Purpose |
|------|---------|
| `AGENTS.md` | This file — repo setup, commands, gotchas |
| `Documentation/customer-journeys-and-features.md` | Gherkin E2E scenarios + user story backlog |
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

## Phase 1 cleanup work items

Discrepancies found during codebase investigation to fix later:

- [ ] **P1.1** — README recommends `pnpm` but repo uses npm workspaces
      (`package-lock.json`, `packageManager: npm@11.14.1`). Update README.
- [ ] **P1.2** — Mixed package managers: root/backend use npm, storefront uses
      Yarn 4 (`yarn.lock` committed). Standardize or document rationale.
- [ ] **P1.3** — `next.config.js` disables ESLint and TypeScript during
      production builds. Re-enable or document as intentional safeguard gap.
- [ ] **P1.4** — Storefront README (`apps/storefront/README.md`) is marked
      deprecated and points to `dtc-starter`. Replace with IndiaGrocers-specific
      content.
- [ ] **P1.5** — Backend `.env.template` has unused `DB_NAME` key —
      `medusa-config.ts` only reads `DATABASE_URL`.
- [ ] **P1.6** — `prettier` is a root devDependency but no `.prettierrc` or
      `prettier.config.*` exists anywhere. Add config or remove dep.
- [ ] **P1.7** — No CI/CD configuration (no `.github/` directory). Add basic CI
      for lint + build.
- [ ] **P1.8** — No integration test files exist despite `test:integration:*`
      scripts in backend `package.json`.
- [ ] **P1.9** — Root `package.json` `"private": false` — should likely be
      `true` for a non-published monorepo root.
- [ ] **P1.10** — `Implementation/README.md` and root `README.md` have
      overlapping/conflicting quickstart instructions. Consolidate.
- [ ] **P1.11** — Forgot password flow backend: Medusa notification provider
      (SendGrid/Resend/SMTP) must be configured so `sdk.auth.resetPassword()`
      can deliver reset codes to email. Currently the API endpoint exists but
      no email provider is configured. Set up via `medusa-config.ts` modules.
- [x] **P1.12** — Sign-in/sign-up pages may not transition to dashboard after
      success without manual refresh. The login server action sets the auth
      cookie but doesn't trigger a page re-render. Fixed with `revalidatePath("/", "layout")`
      in both `login()` and `signup()` server actions (`src/lib/data/customer.ts:110,135`).
- [ ] **P1.13** — `checkout/components/shipping/index.tsx:74,78,345` uses
      `(sm as any).service_zone` — the `service_zone` relation is not loaded
      by default when fetching shipping options. The proper fix is to include
      `service_zone` in the relation config of the fulfillment list call. See
      lines marked `FIXME: service_zone relation not loaded`.

---

## Phase 2 planned work items

- [ ] **P2.1** — Email verification on sign-up: currently accounts are
      created without email verification. Add verification email flow using
      Medusa auth events/subscribers.
- [ ] **P2.2** — Extend forgot-password to phone/SMS channel (currently
      email-only).
- [ ] **P2.3** — Add password strength meter on register form (beyond
      current rule checklist).
- [ ] **P2.4** — Add rate limiting to forgot-password endpoint to prevent
      abuse (currently no rate limiting configured).

---

## Phase 2 Feature: Order Consolidation for Wholesale

Aggregate retail orders into a wholesale master purchase list by target date.

### F2.1 Backend API
- [x] **F2.1.1** — `POST /admin/consolidate-orders` endpoint accepting
      `target_date`, returning aggregated `product_id → SUM(quantity)`.
      File: `apps/backend/src/api/admin/consolidate-orders/route.ts`
- [x] **F2.1.2** — Cron job at `apps/backend/src/jobs/order-consolidation.ts`
      scheduled daily at midnight for headless consolidation.

### F2.2 Admin Dashboard
- [x] **F2.2.1** — Consolidation panel widget at
      `apps/backend/src/admin/widgets/order-consolidation.tsx` with date picker,
      trigger button, results table, CSV export.
- [ ] **F2.2.2** — PDF export (printable picking sheet format).

### F2.3 Remaining
- [ ] **F2.3.1** — Add configurable consolidation time window (e.g., 9am cutoff).
- [ ] **F2.3.2** — Integrate with warehouse/inventory system for automatic
      stock deduction.

---

## Go-Live Requirements

These must be resolved before production launch. Ordered by priority.

### G1. Email delivery — notification provider
**Status:** Configured — notification module in `medusa-config.ts` with local dev
provider always enabled and `@medusajs/notification-sendgrid` auto-activated when
`SENDGRID_API_KEY` env var is set. Providers are nested inside the notification
module's `providers` array (not standalone modules), and the module uses `key:
"notification"` to override the default while keeping all other default modules
auto-loaded.

### G2. Login/signup page transition after success
**Status:** Fixed — `revalidatePath("/", "layout")` added to `login()` and `signup()`.
When the server action completes, Next.js re-renders all layouts which causes the
account page to detect the new auth cookie and switch from login form to dashboard.

### G3. Email verification on sign-up
**Status:** Not implemented — accounts created unverified
Currently `signup()` creates the account without email verification. Medusa
supports email verification through auth events. Requires:
1. Notification provider configured (see G1)
2. Auth workflow subscriber to send verification codes
3. Verification page in storefront (enter code → activate account)
4. Restrict account features (checkout, orders) until verified

### G4. Rate limiting on auth endpoints
**Status:** Not implemented — vulnerable to abuse
No rate limiting exists on `/auth/*/emailpass/reset-password` or
`/auth/*/emailpass/register`. Implement via:
- Next.js middleware rate limiting (e.g., `@upstash/ratelimit`)
- Or Medusa module/middleware
- Target: 3 attempts per email per minute, 10 per IP per minute

### G5. Production build validation
**Status:** Intentionally bypassed
`next.config.js` has `eslint.ignoreDuringBuilds: true` and
`typescript.ignoreBuildErrors: true`. Re-enable these for production builds,
or run `yarn lint` and `npx tsc --noEmit` in CI (see G6) as a quality gate.

### G6. CI/CD pipeline
**Status:** No pipeline exists
No `.github/` directory. Minimum viable CI:
- Lint (storefront) + typecheck (storefront + backend)
- Build (both apps)
- Deploy hook for Vercel (storefront) and Medusa Cloud / Railway (backend)

### G7. JWT and cookie secrets from environment
**Status:** Fixed — fallbacks only used in non-production (`NODE_ENV !== "production"`).
`medusa-config.ts` now returns `undefined` in production if env vars are missing,
which causes a clear startup failure rather than silently using weak defaults.
`.env.template` includes generation instructions (`openssl rand -hex 64`).

### G8. PostgreSQL connection pooling
**Status:** Not configured
Production traffic requires connection pooling (e.g., PgBouncer) or
configure `DATABASE_URL` with pooling parameters. Without it, concurrent
Medusa requests can exhaust Postgres connections.

### G9. Redis persistence
**Status:** Docker default — no persistence config
Redis is used for event bus + cache. Production needs:
- Persistence (RDB or AOF) configured
- Authentication (`requirepass`)
- Backups scheduled

### G10. Stripe live keys
**Status:** Test mode only
`NEXT_PUBLIC_STRIPE_KEY` in storefront `.env` and Stripe provider config in
backend must be swapped to live keys before accepting real payments.

### G11. Natco product variant consolidation
**Status:** Not started — mandatory for consistent UX
All 357 Natco products are currently flat SKUs with weight in the title
(e.g., `"Natco - Brown Lentils 2kg"`, `"Natco - Brown Lentils 500g"` as
separate products). Each has a single `"Default"` variant. The weight-heavy
card component (`weight-heavy-card.tsx`) cannot display weight chips,
unit pricing, or best-value indicators because variant metadata is null.

**Must consolidate:**
1. Merge same-product different-weight SKUs into single products with
   `Weight/Size` variants (58 clean groups → 120 products merge into 58)
2. Remove weight suffixes from all Natco product titles
   (`"Natco - Cumin Seeds 400g"` → `"Natco - Cumin Seeds"`)
3. Handle 3 cross-category groups manually (dried vs tinned, Full Case)
4. 227 unique products stay as-is but lose weight suffix in title
5. Populate `GroceryVariantMetadata` on all variants

**Impact of delay:**
- Product cards show meaningless `"Default"` weight chip on all Natco products
- No unit pricing displayed (e.g., `£0.89/100g`)
- No best-value variant highlighting
- Search results show weight-suffixed titles inconsistently (TRS already clean)
- Product detail page shows single `"Default"` option

**Effort breakdown:**

| Phase | Task | Est. |
|-------|------|------|
| 1. Adapt merge script | Handle `&amp;` titles, preserve existing metadata + tags, cross-category splits | 1-2h |
| 2. Run consolidation | Merge 120→58, assign categories, images, delete old products | 30m |
| 3. Fix enrichment pipeline | Strip weights from titles in `pipeline.mjs` CSV matching | 30m |
| 4. Re-enrich | Re-run MVC pipeline with updated title matching | 30m |
| 5. Update integration tests | ~700 title assertions across 8 spec files — remove weight suffixes | 2-3h |
| 6. Reindex + validate | `npm run reindex`, run full 57-test suite | 30m |
| **Total** | | **5-7h** |

**Scripts to use/adapt:**
- `apps/backend/src/seed/merge-product-variants.mjs` — existing consolidation script, needs updating
- `scripts/mvc/pipeline.mjs` — enrichment pipeline, needs title matching fix

**Do NOT proceed without:**
- Backing up the database (Docker volume or pg_dump)
- Running full integration test suite before AND after consolidation
- Validating MeiliSearch category handles haven't shifted

### G12. Product price management
**Status:** Not started — mandatory for go-live
All MVC Round 1 products (Shan, MDH, Haldiram's, Parle, Britannia, Patak's, Tilda, etc.)
and all TRS products have placeholder prices (£0.99–£3.99). Real wholesale/retail prices
must be loaded before accepting orders. The system needs:

1. **API-based price loading** — a script that reads prices from a structured data source
   (JSON/CSV pricelist) and updates product variants via Medusa Admin API. Pattern already
   exists in `import-round1.mjs` (variant price field). Accept a pricelist file, map product
   names to variant SKUs, and POST updated prices.

2. **Pricelist scan and update** — support for scanned/uploaded wholesaler price sheets.
   Convert a CSV/Excel pricelist exported from TRS Dhamecha, Bestway, or other C&C into
   the price update format. Map C&C product codes/descriptions to Medusa product handles.

3. **Invoice scan and update** — accept a scanned C&C purchase invoice (PDF/image).
   Extract line items (product name, pack size, cost price) and update Medusa variant
   prices with actual cost data. Calculate retail prices as cost + margin %.

**Required scripts:**
- `scripts/pricing/load-pricelist.mjs` — load prices from JSON/CSV pricelist
- `scripts/pricing/scan-invoice.mjs` — extract prices from C&C invoice
- `scripts/pricing/update-prices.mjs` — batch-update variant prices via API

**Effort:** 3-4h for API script + pricelist format, 4-6h for invoice scanning (OCR)

### G13. Customer invoice generation
**Status:** Not started — mandatory for go-live
After an order is placed, the customer must receive an invoice with:
- Order number, date, and delivery ETA
- Line items: product name, variant, quantity, unit price, line total
- Subtotal, delivery charge, VAT, and grand total
- Payment method and billing/delivery addresses
- IndiaGrocers branding and business details (address, VAT number, contact)

Can be delivered as:
1. **Email PDF invoice** — generated via Medusa order subscriber, sent with
   notification provider (G1). Requires an HTML-to-PDF template.
2. **Downloadable invoice** — customer can download from order history page.
3. **Print-friendly** — order confirmation page doubles as printable invoice.

**Depends on:** G1 (email provider configured), G12 (real pricing for accurate invoices)

**Effort:** 2-3h for PDF template + subscriber, 1-2h for storefront download link

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
