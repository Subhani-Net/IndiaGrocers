# AGENTS.md � IndiaGrocers (Extracted Feature Content)

> This content was extracted from AGENTS.md on 2026-06-19 per the Clean Codespace Policy.
> All feature planning, epics, and business requirements now live in /docs/epics/.

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
