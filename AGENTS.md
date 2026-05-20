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

## Quickstart

```bash
# Infrastructure
docker compose -f C:\IndiaGrocers\docker-compose.yml up -d

# Install (root)
cd C:\IndiaGrocers
npm install
cd apps\storefront
yarn install
```

## Dev servers

```bash
# Backend (:9000)
cd apps\backend
cp .env.template .env        # then set DATABASE_URL, REDIS_URL
npx medusa db:migrate
npx medusa user -e admin@test.com -p supersecret
npx medusa develop

# Storefront (:8000, uses turbopack)
cd apps\storefront
yarn dev

# Both at once (root)
npm -r dev
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

## Brand

Primary brand color: `#FF6B35` (orange). Full palette in `Implementation/README.md`.

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
**Status:** Not configured — Medusa v2 requires notification providers to be
registered inside the `@medusajs/notification` module's `providers` array, not as
standalone modules. Adding a top-level `modules` key overrides default module
auto-loading and crashes startup. The `@medusajs/notification-local` and
`@medusajs/notification-sendgrid` packages are installed. Correct config format:
```ts
modules: [
  { resolve: "@medusajs/notification", options: { providers: [
    { resolve: "@medusajs/notification-sendgrid", id: "sendgrid", options: { ... } }
  ]}}
]
```
This requires listing ALL modules explicitly (not just notification) to avoid
overriding defaults.

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
