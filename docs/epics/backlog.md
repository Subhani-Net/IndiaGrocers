# AGENTS.md � IndiaGrocers (Extracted Feature Content)

> This content was extracted from AGENTS.md on 2026-06-19 per the Clean Codespace Policy.
> All feature planning, epics, and business requirements now live in /docs/epics/.

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
