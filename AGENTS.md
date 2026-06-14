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
**Status:** Implemented — `@indiagrocers/auth` package with Resend email provider.
New customers receive a verification email on sign-up. Unverified accounts are gated
from the dashboard. Verification is handled via JWT token in a custom API route.

**Architecture:**
- `packages/auth/` — reusable auth module (pure Node, extractable as microservice)
- `apps/backend/src/subscribers/auth.ts` — Medusa event subscriber (customer.created, auth.password_reset)
- `apps/backend/src/api/auth/verify-email/route.ts` — Verification API endpoint
- `apps/storefront/src/modules/account/components/verify-email/index.tsx` — Verification UI
- `apps/storefront/src/modules/account/components/verification-gate/index.tsx` — Unverified gate

**Resend configuration:** Set `RESEND_API_KEY` and `RESEND_FROM` env vars for email delivery.
Without these, emails are logged to console (dev mode).

**Future phases:**
- Phase 4: Extract auth as standalone microservice
- Phase 5: Add Google OAuth, Facebook OAuth (types prepared in `AuthConfig.oauth`)

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
**Status:** Stripe plugin loaded, `pp_system_default` working.
`pp_stripe_stripe` registered but returns HTTP 500 when creating payment sessions
(likely API key or network connectivity issue). Stripe card UI renders in checkout
with `hidePostalCode: true`. Payment flow documented in `Implementation/README.md`.
- Stripe providers: all 8 registered (`pp_stripe_stripe`, `pp_stripe-ideal_stripe`, etc.)
- API endpoint for session creation: `POST /store/payment-collections/{id}/payment-sessions`
- SDK upgraded from v2.12.3 → v2.15.2 to match backend

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
**Status:** Built — `scripts/pricing/load-pricelist.mjs` accepts JSON or CSV pricelist, matches by title/handle/SKU, updates variant prices via Medusa Admin API. Dry-run + apply modes. Documented in `Implementation/README.md`.
**Effort:** Complete. Example pricelist in `scripts/pricing/example-pricelist.json`.

**Effort:** 3-4h for API script + pricelist format, 4-6h for invoice scanning (OCR)

### G13. Customer invoice generation

### G14. Payment refunds
**Status:** Provider supports refund flow — `refundPayment` method in `stripe-gbp-provider.ts`. 
Storefront integration not yet built.

The custom Stripe provider already handles the backend refund path:
- `refundPayment({ amount, data })` → calls `stripe.refunds.create()` with the correct pence amount
- PaymentIntent ID is retrieved from `data.id` or `data.stripe_pi_id`
- Charge-already-refunded errors are caught gracefully

**Remaining work:**
- Build a storefront admin/account flow to trigger refunds (cancel order, return items)
- Build a Medusa workflow that calls `refundPayment` on the payment session
- Wire up a refund notification email to the customer
- Add refund amount validation (cannot refund more than charged)

**Depends on:** G10 (Stripe keys), G1 (email, for refund notification)
**Effort:** 2-3h for backend workflow + 1-2h for storefront UI

### G15. Order modification until last window + weight-based variable charging
**Status:** Not started — post-launch phase

**Scenario 1 — Order modification:** Customer places an order with a fixed cost. 
During the packing window (e.g., 2 hours before delivery), the packer may find that
a product is out of stock or the available weight differs from what was ordered.
The order needs to be modified and the payment adjusted WITHOUT creating a new
transaction:

| Step | Description |
|------|-------------|
| Packer reviews order | Marks items as "substituted", "partial", or "unavailable" |
| Price recalculation | Order total is recalculated based on actual packed items |
| Payment adjustment | Existing Stripe PaymentIntent is updated with new amount via `updatePayment` |
| Customer notification | Customer receives updated order summary with new total |

**Scenario 2 — Weight-based variable pricing:** For products sold by weight 
(e.g., loose vegetables, fresh paneer by kg), the customer pays an estimated 
amount at checkout. The actual weight is confirmed during packing, and the 
final charge is applied to the same PaymentIntent:

| Step | Description |
|------|-------------|
| Customer orders 1kg paneer | Estimated charge: £8.00 (1000g × £0.80/100g) |
| Packer weighs actual paneer | Actual weight: 1050g |
| Payment updated | PaymentIntent amount updated to £8.40 (1050g × £0.80/100g) |
| Capture | Payment is captured at the actual weight-based amount |

**Provider capability:** `updatePayment({ amount, data })` already supports 
updating the PaymentIntent amount before capture. The Stripe PaymentIntent 
can be updated up until it's captured.

**Remaining work:**
- Build a "packing dashboard" UI for packers to modify orders
- Build a Medusa workflow for order modification + payment adjustment
- Add weight-based variant type to product model (`variant.type = "weight"`)
- Configure `capture: false` (manual capture) so payments can be adjusted before capture
- Build weight verification flow (packer enters actual weight → recalculation)

**Depends on:** G10 (Stripe), G11 (variant consolidation for weight variants)
**Effort:** 5-8h for packing UI + 3-4h for workflow + 2h for weight-based variant support

---

## Pre-Go-Live Defects

Recorded for fixing before launch. Not yet implemented.

### D1. Delivery slots — 4-hour weekend only
**Status:** Fixed
Delivery slots updated to:
- 4-hour windows: Morning (8am-12pm), Afternoon (12pm-4pm), Evening (4pm-8pm)
- Saturday and Sunday only (weekdays blocked)
- 4 weekend days shown (2 Saturdays + 2 Sundays across 2 weekends)
- File: `apps/storefront/src/modules/checkout/components/delivery-slot-selector/index.tsx`

### D2. Basket sidebar — sticky scroll
**Status:** Not started
The cart sidebar on category/product pages does not follow the user as they scroll.
Must update to sticky/position-fixed so the basket is always visible.
- On desktop (xl+ screens), the right sidebar showing cart contents should scroll
  with the page so the user always sees their basket.
- File: `apps/storefront/src/modules/checkout/components/cart-sidebar/` or similar

### D3. Stripe CardElement — hide ZIP for non-Amex cards
**Status:** Not started — deferred to later phase
The Stripe CardElement currently shows a ZIP/postal code field for all card types.
This should only appear for Amex cards. Non-Amex cards in the UK do not require ZIP.
- File: `apps/storefront/src/modules/checkout/components/stripe-payment/index.tsx`
- Fix: Set `hidePostalCode: true` on CardElement options, or conditionally show based on card brand detection

### D4. Add to Basket — no visual feedback on product card
**Status:** Not started — mandatory before production
The "Add to Basket" button on product cards adds the item to the cart
but provides no visual feedback on the card itself. The user has no indication
the item was added until they look at the cart icon in the header.
- Must show a quantity badge/count on the product card after adding
- Or show a brief toast/confirmation animation
- File: `apps/storefront/src/modules/products/components/product-preview/product-card.tsx`

### D5. Payment fails — "Failed to initiate payment"
**Status:** Fixed — Stripe wired with correct config.
Root causes found and resolved:
1. Stripe must be inside `modules[]` (payment module provider), not `plugins[]`
2. `automaticPaymentMethods: true` required in provider options
3. Session `data` must include `{ payment_method, confirm: true, return_url }`
4. API endpoint is `POST /payment-collections/{id}/payment-sessions` (not `/sessions`)
Full setup documented in `Implementation/README.md` (Stripe Setup — Step by Step).
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

### D6. Cart image on mobile not working
**Status:** Fixed
Root cause: `item.thumbnail` was null for cart line items on the `/cart` page
and cart dropdown, and the Medusa v2 cart API wasn't including product thumbnail
fields. 

Fixes applied:
1. `retrieveCart()` in `src/lib/data/cart.ts` — expanded fields to include
   `*items.product.thumbnail`, `*items.product.images`, `*items.variant.product`
2. Cart Item component (`src/modules/cart/components/item/index.tsx`) — added
   fallback `item.thumbnail || item.variant?.product?.thumbnail`
3. Cart Dropdown (`src/modules/layout/components/cart-dropdown/index.tsx`) —
   same fallback

### D7. Order confirmation email — all product prices are £0.00
**Status:** Fixed
Root cause: The remote query in `order-confirmation.ts` was cherry-picking
specific item fields (`items.title`, `items.quantity`, `items.unit_price`,
`items.total`) instead of expanding the full `items` relation. In Medusa v2,
the remote query needs `items.*` to load all line item fields including prices.

Fix: Changed `"items.title", "items.quantity", "items.unit_price", "items.total"`
to `"items.*"` in the remote query fields array.
File: `apps/backend/src/subscribers/order-confirmation.ts:32`

### D8. Price display — values displayed as multiples of 100
**Status:** Fixed
Root cause: `convertToLocale()` in `lib/util/money.ts` formatted amounts as-is,
treating Medusa v2's pence values as pounds. Medusa v2 returns all monetary
amounts in the minor currency unit (pence for GBP), but `convertToLocale` was
copied from a Medusa v1 starter that expected major units (pounds).

Fix: Changed `.format(amount)` to `.format(amount / 100)` in `money.ts:24`.
This fixed 33 instances across: cart line items, cart dropdown, order summary,
order confirmation, account order history, free shipping nudges, and discount
codes.

Payment-to-Stripe flow is correct:
- DB stores pence (e.g., 199)
- Medusa cart total is in pence
- Stripe PaymentIntent receives pence (Stripe expects minor units)
- Frontend pay button shows `formatAmount(total / 100)` = displayed in GBP
- All three (frontend, backend, Stripe) now charge the same amount

### D9. Product Detail Page — handle missing from API fields
**Status:** Fixed
Root cause: `listProducts()` and `fetchProductsByIds()` in `src/lib/data/products.ts`
did not include `handle` in the API `fields` parameter. Without `handle`, all product
card links (desktop and mobile) rendered as `/products/undefined`, making it impossible
to navigate from category/store pages to the Product Detail Page.

Fix: Added `handle` to the `fields` parameter in all three occurrences:
`products.ts:61`, `products.ts:190`, `products.ts:228`.

**Impact of fix:**
- Desktop: `<LocalizedClientLink href={`/products/${product.handle}`}>` now resolves correctly
- Mobile: Same fix in mobile layout (added in this defect)
- Category pages, store page, and search results all navigable to PDP
- Breadcrumbs on PDP correctly link back to parent categories

### D10. Order confirmation page — blank after successful payment
**Status:** Fix in progress
After a successful Stripe payment, the user is redirected to
`/order/{order_id}/confirmed` but sees a blank page with "Page not found"
and "Go to frontpage" link. The order WAS created (ID exists in URL) but
the confirmation page's `retrieveOrder()` call fails.

Root cause: `retrieveOrder()` in `orders.ts` uses `cache: "force-cache"` which
serves a stale/empty cached response for newly created orders. The Medusa
store API's orders endpoint also requires the publishable key for guest orders,
and the SDK client may not include it correctly in cached requests.

Fix applied:
- `orders.ts:26`: Changed `cache: "force-cache"` → `cache: "no-store"` for order retrieve
- `checkout.feature`: Added order confirmation scenarios
- `payment-flow.feature`: Complete payment→confirmation journey documented (10 scenarios)
- `payment-flow.steps.ts`: Step definitions with real assertions

---

## End-to-End Journey — Go-Live Tasks

These are the specific customer flows that must work before launch.
Each depends on prior items. Execute in order.

### J1. Complete Registration Flow
**Status:** Partially built — needs email delivery to work
**Depends on:** G1 (email provider API key)

| Step | Action | Current State |
|------|--------|---------------|
| Customer fills signup form | `signup()` in `customer.ts` creates account + auto-logs in | ✅ Working |
| Verification email sent | `auth.ts` subscriber catches `customer.created`, generates token, calls notification service | ✅ Code exists |
| Customer receives email | Notification service delivers via SendGrid | ❌ Needs `SENDGRID_API_KEY` |
| Customer verifies email | `POST /store/auth/verify-email` validates token, marks customer verified | ✅ Code exists |
| Unverified account gated | `verification-gate.tsx` blocks dashboard for unverified | ✅ Code exists |
| Signup → auto-login → dashboard | Restore original flow, defer verification to post-signup prompt | ❌ `signup()` currently returns `createdCustomer` directly |

**Tasks:**
1. Set `SENDGRID_API_KEY` in `apps/backend/.env`
2. Verify `auth.ts` subscriber sends email successfully
3. Test signup → email received → verify → access dashboard

### J2. Forgot Password Flow
**Status:** Partially built — needs email delivery + correct token forwarding
**Depends on:** G1 (email provider API key)

| Step | Action | Current State |
|------|--------|---------------|
| Customer requests reset | `requestPasswordReset()` calls `sdk.auth.resetPassword()` | ✅ Working |
| Reset email sent | `auth.ts` subscriber catches `auth.password_reset`, forwards token | ✅ Code exists |
| Customer receives email | Notification service delivers via SendGrid | ❌ Needs `SENDGRID_API_KEY` |
| Customer enters token + new password | `resetPassword()` calls `sdk.auth.updateProvider()` | ✅ Working |
| Customer signs in with new password | `login()` standard flow | ✅ Working |

**Tasks:**
1. Verify `auth.ts` subscriber correctly forwards Medusa's reset token
2. Test end-to-end: request → email received → reset → login

### J3. Add to Basket
**Status:** Working
**Depends on:** Nothing

| Step | Current State |
|------|---------------|
| ProductCard "Add" button | ✅ `addToCart()` dispatches cart-updated event |
| Variant overlay (Options button) | ✅ `ProductOverlay` with +/- quantity |
| Cart dropdown updates | ✅ `cart-updated` event listener |
| Cart persists across navigation | ✅ Cart in Medusa session |

### J4. Checkout
**Status:** Partially working — fake payment, fake shipping
**Depends on:** G10 (Stripe payment)

| Step | Action | Current State |
|------|--------|---------------|
| Address entry | Shipping address form | ✅ Working |
| Delivery selection | Shipping method selector | ⚠️ May show dummy methods |
| Payment | Fake buttons labelled "Powered by Stripe" but calls `pp_system_default` | ❌ No Stripe integration |
| Review | Order summary + place order button | ✅ Working |

**Tasks:**
1. Install + configure `@medusajs/payment-stripe`
2. Integrate `@stripe/react-stripe-js` in checkout form
3. Create Stripe webhook endpoint
4. Test payment flow with test keys

### J5. Create Order + Confirmation
**Status:** Partially working — order created, no confirmation sent
**Depends on:** J4 (payment), G1 (email)

| Step | Action | Current State |
|------|--------|---------------|
| Cart completed | `sdk.store.cart.complete()` → order created | ✅ Working |
| Order confirmation page | `/order/{id}/confirmed` with order details | ✅ Working |
| Order confirmation email | Subscriber on `order.placed` sends email | ❌ No subscriber exists |
| Invoice PDF | HTML template → PDF attached to email | ❌ No code exists |

**Tasks:**
1. Create `order.placed` subscriber for confirmation email
2. Build HTML-to-PDF invoice template
3. Add downloadable invoice to order history
4. Add print-friendly CSS to order confirmation page

---

## System Rebuild — Application State & Test Coverage

> **If this application is rebuilt from scratch on a new Medusa instance, the
> following guarantees hold. Every file below documents or validates a specific
> system behavior.**

### Data Flow Contracts (source of truth for rebuild)

| Contract | File(s) | What It Guarantees |
|----------|---------|--------------------|
| Product listing pages never show false "Out of Stock" | `e2e/products/inventory-visibility.spec.ts`, `e2e/features/catalog/inventory-display.feature` | Inventory read from `getBulkInventory()`, never from `variant.inventory_quantity` |
| Cart page never shows false OOS banner/badges | Same as above — cart tests included | Cart items read from `inventoryMap[item.variant_id]`, never from `item.variant.inventory_quantity` |
| PDP stock status reads from inventory data layer | `e2e/products/inventory-visibility.spec.ts` | PDP uses `inventoryMap` prop, variant chips enabled when in stock |
| Checkout: shipping method registered BEFORE payment | `e2e/checkout/checkout-flow.spec.ts`, `e2e/features/checkout/checkout.feature` (shipping method section) | `setShippingMethod()` called at Step 2, step guard validates at Step 3 |
| Checkout: cart.complete() never fails with "No shipping method" | `e2e/features/checkout/checkout.feature`, `e2e/features/checkout/payment-flow.feature` | Shipping method set on cart before `cart.complete()` is called |
| Delivery cost displayed = actual cart shipping method cost | `e2e/features/checkout/checkout.feature` (delivery cost scenario) | Cost reads `cart.shipping_methods[0].amount`, never hardcoded |
| Bulk-inventory endpoint returns live stock data | `scripts/verify-bulk-inventory.mjs` (9 tests) | `POST /store/bulk-inventory` → `getVariantAvailability()` → correct availability |
| Full inventory pipeline correct | `tests/verify-inventory-pipeline.mjs` (5 sections) | Product fetch → variant IDs → bulk-inventory → enriched stock display |
| Cart cache invalidation on shipping method set | `e2e/features/checkout/checkout.feature` (cache scenario) | `revalidateTag("carts")` called in `setShippingMethod()` |
| No `cache: "force-cache"` on dynamic data (cart, inventory) | `lib/data/cart.ts`, `lib/data/inventory.ts` | Cart = tag-based ISR, inventory = 10s ISR |
| JSON-LD structured data on PDP matches inventory | `e2e/products/inventory-visibility.spec.ts` | `availability` field correct in `<script type="application/ld+json">` |

### Architecture Invariants (must hold after any rebuild)

| Invariant | File | Verify With |
|-----------|------|-------------|
| `variant.inventory_quantity` is NEVER read by any UI component | Entire `src/` — zero direct reads except comment in `inventory.ts` and dead storage in `weight-heavy-card.tsx:59` | `grep "\.inventory_quantity" apps/storefront/src/` → 0 results (UI layer only) |
| Inventory is a separate data layer from product identity | `lib/data/inventory.ts` → `getBulkInventory()` | Single function, single endpoint |
| Products: ISR 60s, Inventory: ISR 10s, Cart: no force-cache | `lib/data/products.ts`, `lib/data/inventory.ts`, `lib/data/cart.ts` | grep for `cache: "force-cache"` → 0 results in data layer |
| `setShippingMethod()` is called before `pushStep("payment")` | `checkout-form/index.tsx:handleDeliveryContinue` | `e2e/checkout/checkout-flow.spec.ts` |
| Step guard blocks navigation to `?step=payment` without shipping | `checkout-form/index.tsx:useEffect` guard | `e2e/checkout/checkout-flow.spec.ts` |
| `handlePlaceOrder` validates shipping before `initiatePaymentSession` | `checkout-form/index.tsx:handlePlaceOrder` | Step guard + manual validation in handler |

### Test Files Index

| Layer | File | Type | Tests |
|-------|------|------|-------|
| Backend endpoint | `scripts/verify-bulk-inventory.mjs` | Node.js | 9 (endpoint contract, availability validation) |
| Pipeline verification | `tests/verify-inventory-pipeline.mjs` | Node.js | 5 sections (backend → storefront) |
| E2E — inventory visibility | `e2e/products/inventory-visibility.spec.ts` | Playwright | 7 (PDP, cart, listing badges) |
| E2E — checkout flow | `e2e/checkout/checkout-flow.spec.ts` | Playwright | 11 (steps, guards, validation) |
| E2E — payment flow | `e2e/checkout/payment-flow.spec.ts` | Playwright | 4 (cart, address, payment, confirmation) |
| BDD — catalog inventory | `e2e/features/catalog/inventory-display.feature` | playwright-bdd | 7 scenarios |
| BDD — checkout | `e2e/features/checkout/checkout.feature` | playwright-bdd | 18 scenarios (8 original + 10 new) |
| BDD — payment flow | `e2e/features/checkout/payment-flow.feature` | playwright-bdd | 14 scenarios (10 original + 4 new) |

### Run All Validation

```bash
# Backend
node scripts/verify-bulk-inventory.mjs         # 9 tests
node tests/verify-inventory-pipeline.mjs        # Pipeline verification

# Storefront E2E
npx playwright test e2e/products/inventory-visibility.spec.ts
npx playwright test e2e/checkout/checkout-flow.spec.ts
npx playwright test e2e/checkout/payment-flow.spec.ts
```

### Navigation System — Rebuild Contracts

> **Documentation:** `Documentation/navigation-system.md`, `Implementation/navigation-contracts.md`

| Contract | File(s) | What It Guarantees |
|----------|---------|--------------------|
| Navigation: 3-level category tree with injected "All [Category]" | `nav/index.tsx:19-58` | `fetchNavCategories()` returns `NavCategory[]` with virtual L2 child at index 0 per L1; grandchildren mapped correctly |
| Navigation: Desktop panel shows ALL L1 categories simultaneously | `all-groceries-panel/index.tsx:100-131` | `categories.map()` renders every L1 block in a masonry grid; no per-category hover filtering |
| Navigation: Mobile cart is a plain link, not a Popover | `nav/index.tsx:134-141` | Mobile cart is `<LocalizedClientLink href="/cart">` with `data-testid="nav-mobile-cart-link"`; no `<Suspense>` or `<CartButton>` in mobile layout |
| Navigation: Desktop cart is a Popover dropdown | `nav/index.tsx:163-174` | Desktop cart is `<Suspense><CartButton/></Suspense>`; Popover panel shows only on `small:` screens |
| Navigation: Header uses `position: sticky; top: 0` | `nav/index.tsx:115` | `<header className="sticky top-0 z-50">` — verified by Playwright computed style assertion |
| Navigation: Mobile logo centered via absolute positioning | `nav/index.tsx:127-131` | `absolute left-1/2 -translate-x-1/2` with `pointer-events-none` wrapper; link has `pointer-events-auto` |
| Navigation: Panel body scroll lock | `all-groceries-panel/index.tsx:44-53`, `mobile-menu/index.tsx:97-107` | `document.body.style.overflow = "hidden"` on open, restored on close |
| Navigation: ESC dismisses desktop panel | `all-groceries-panel/index.tsx:35-42` | Global `keydown` listener with `e.key === "Escape"` |

### Navigation Test Files

| Layer | File | Type | Tests |
|-------|------|------|-------|
| E2E — Navigation | `e2e/layout/navigation.spec.ts` | Playwright | 19 (5 describe blocks) |
| BDD — Navigation | `e2e/features/layout/navigation.feature` | playwright-bdd | 20 scenarios |
| BDD — Navigation steps | `e2e/features/layout/navigation.steps.ts` | playwright-bdd | ~30 step definitions |

### Run Navigation Validation

```bash
npx playwright test --project=e2e e2e/layout/navigation.spec.ts
npx playwright test --project=bdd e2e/features/layout/
```

### Search System — Rebuild Contracts

> **Architecture:** SearchContext (live grid) + SSR page (direct URL). Universal `WeightHeavyProductCard` on all grids. `PdpLayover` modal for variant selection. `NavSearch` autocomplete with keyboard nav.

| Contract | File(s) | What It Guarantees |
|----------|---------|--------------------|
| Search: global context manages live grid state | `lib/context/search-context.tsx:41-170` | `SearchProvider` wraps layout; `useSearch()` returns `isSearchActive`, `searchQuery`, `searchResults`, `isLoading`, `totalCount`. 300ms debounced `searchProducts` → `fetchProductsByIds` with AbortController per invocation |
| Search: layout conditionally renders grid | `(main)/layout.tsx:37-58`, `components/search-layout-client.tsx` | `<SearchLayoutClient>` reads `isSearchActive` → renders `<SearchResultsGrid>` or passes through `{children}` |
| Search: header NavSearch connected to context | `nav-search/index.tsx:16-23` | `useSearch()` reads/writes query; autocomplete dropdown with 200ms debounce + AbortSignal; ArrowUp/Down/Enter/Escape keyboard nav; product click → `router.push("/search?q=...")` |
| Search: navigating away clears search | `search-context.tsx:129-137` | `useEffect([pathname])` fires on route change; if `isSearchActive && !pathname.includes("/search")` → `clearSearch()` |
| Search: SSR page for direct URL | `search/page.tsx:39-55` | Server component reads `searchParams` (q, dietary, brand, sort, page, maxPrice), builds MeiliSearch filter, calls `searchProducts` + `fetchProductsByIds` directly, passes as `initialResults` |
| Search: client template syncs SSR props | `search/templates/index.tsx:128-144` | `useEffect` watches `initialResults` → syncs to `products` state; `initialPage > 1` check for Load More append |
| Card: universal `WeightHeavyProductCard` | `weight-heavy-card.tsx` | Weight chips, best-value badges, unit pricing (£/kg, p/100g), variant selection, +/- qty controls. `onProductClick` prop → `<div role="button">` instead of `<LocalizedClientLink>` when layover active |
| Card: click opens `PdpLayover` modal | `weight-heavy-card.tsx:161-184,280-314` | `onProductClick={() => openLayover(product)}` passed from all templates via `useLayover()` |
| PdpLayover: multi-line variant sheet | `pdp-layover/index.tsx` | Mobile slide-up bottom sheet, desktop centered modal. Lists all variants with price, computed unit price, +/- steppers. Bulk "Add to Basket" calls `addToCart` per variant with qty > 0 |
| Layover: global context | `lib/context/layover-context.tsx` | `LayoverProvider` + `useLayover()` returns `openProduct`, `openLayover(product)`, `closeLayover()`. Body scroll locked while open |
| Mobile filter: portal-rendered drawer | `mobile-filter-drawer/index.tsx:55-70` | `createPortal` to `document.body`; `animate-drawer-in` (250ms) open / `animate-drawer-out` (200ms) close |
| Mobile filter: accordion sections via Radix | `filter-panel/index.tsx:320-325` | `FilterAccordion` with `type="multiple"`, `defaultValue=[]` — collapsed on mobile |
| Mobile filter: body scroll lock on open | `mobile-filter-drawer/index.tsx:39-46` | `document.body.style.overflow = "hidden"` on mount, restored on unmount |
| Mobile filter: ESC key dismiss | `mobile-filter-drawer/index.tsx:49-54` | Global `keydown` listener with `e.key === "Escape"` |
| Mobile filter: desktop sidebar unchanged | `standard-grid.tsx:134-140` | `<aside className="hidden sm:block w-56">` — `FilterPanel` without `compact` prop |

### Search & Card Test Files

| Layer | File | Type | Tests |
|-------|------|------|-------|
| E2E — Loading states | `e2e/search/loading-states.spec.ts` | Playwright | 10 (spinner lifecycle, race condition) |
| E2E — Behavior contracts | `e2e/search/behavior-contracts.spec.ts` | Playwright | 12 (autocomplete speed, results persistence, SSR pre-fetch) |
| E2E — Top results | `e2e/search/top-results.spec.ts` | Playwright | 16 (hardcoded top-N for 15 terms) |
| E2E — Vernacular | `e2e/search/vernacular.spec.ts` | Playwright | 4 (Hindi→English mapping) |
| BDD — Search | `e2e/features/catalog/search.feature` | playwright-bdd | 22 scenarios |
| BDD — Search steps | `e2e/features/catalog/search.steps.ts` | playwright-bdd | 22 step definitions |
| BDD — Navigation | `e2e/features/layout/navigation.feature` | playwright-bdd | 22 scenarios (incl. header search) |
| BDD — Navigation steps | `e2e/features/layout/navigation.steps.ts` | playwright-bdd | ~35 step definitions |

### Mobile Filter Test Files

| Layer | File | Type | Tests |
|-------|------|------|-------|
| E2E — Mobile Filter | `e2e/filters/mobile-filter-drawer.spec.ts` | Playwright | 11 (5 describe blocks) |
| BDD — Filters | `e2e/features/catalog/filters.feature` | playwright-bdd | 10 scenarios |
| BDD — Filter steps | `e2e/features/catalog/filters.steps.ts` | playwright-bdd | ~20 step definitions |

### 3-Pane Layout — Rebuild Contracts

> **Architecture:** `ThreePaneLayout` (client component) manages filter/basket toggle state. Sticky panes on lg+. Horizontal quick-filter row above grid.

| Contract | File(s) | What It Guarantees |
|----------|---------|--------------------|
| 3-Pane: default state = grid + basket visible, filter hidden | `three-pane-layout/index.tsx:143-173` | `filterOpen` starts `false`; left pane hidden, right pane shown, quick-filter row visible |
| 3-Pane: All Filters button toggles filter pane | `three-pane-layout/index.tsx:123-135` | `toggleFilter()` sets `filterOpen = !filterOpen`; left pane slides in, right basket hides |
| 3-Pane: cart-updated event auto-closes filter | `three-pane-layout/index.tsx:61-66` | `window.addEventListener("cart-updated", () => setFilterOpen(false))` |
| 3-Pane: children never remount on toggle | `three-pane-layout/index.tsx:146` | `{children}` in center pane — React preserves subtree across sibling toggles |
| 3-Pane: sticky left and right panes | `three-pane-layout/index.tsx:139,152` | `sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto` on both panes |
| 3-Pane: horizontal quick-filter row | `three-pane-layout/index.tsx:73-102` | Dietary chips (Vegan, Vegetarian, GF, Organic) + All Filters button + sort dropdown |
| 3-Pane: search page has basket only | `three-pane-layout/index.tsx` | `showFilterPane={false}` → no filter button, no left pane; only basket on right |
| Filter/Sort: decoupled architecture | `filter-panel/index.tsx:8-13` | `FilterPanel` has zero sort code — no `SortProducts`, no `sortBy` prop, no sort accordion section. Sort lives ONLY in `InlineSort` in the utility bar |
| Filter/Sort: independent URL params | `filter-panel/index.tsx:55-100` | Sort writes `sortBy` param. Filters write `brand`, `weight`, `dietary`, `minPrice`, `maxPrice`, `inStock`. No overlap, no conflict |
| Utility bar: desktop + mobile consistent layout | `three-pane-layout/index.tsx:59-97`, `standard-grid.tsx:104-131` | Both viewports: [Filter] [Sort ▾] ─── [product count]. `justify-between`, `items-center` |
| Utility bar: border separator | `three-pane-layout/index.tsx:60`, `standard-grid.tsx:105` | `border-b border-stone-100 pb-4` on both desktop and mobile utility rows |
| Mobile menu: category-first navigation | `mobile-menu/index.tsx:150-220` | No static links (Home, Store, Account, Cart). "Shop by Category" header. Category rows at 44px with `border-b` separators. Utility links in muted footer |

### 3-Pane Layout Test Files

| Layer | File | Type | Tests |
|-------|------|------|-------|
| E2E — 3-Pane Layout | `e2e/layout/three-pane-layout.spec.ts` | Playwright | 14 (5 describe blocks) |
| BDD — 3-Pane Layout | `e2e/features/catalog/three-pane-layout.feature` | playwright-bdd | 10 scenarios |
| BDD — 3-Pane steps | `e2e/features/catalog/three-pane-layout.steps.ts` | playwright-bdd | ~25 step definitions |

### Run All Validation

```bash
npx playwright test --project=e2e e2e/search/
npx playwright test --project=e2e e2e/filters/
npx playwright test --project=e2e e2e/layout/three-pane-layout.spec.ts
npx playwright test --project=bdd e2e/features/catalog/search.feature
npx playwright test --project=bdd e2e/features/layout/navigation.feature
npx playwright test --project=bdd e2e/features/catalog/filters.feature
npx playwright test --project=bdd e2e/features/catalog/three-pane-layout.feature

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
