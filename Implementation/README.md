# Implementation Guide — IndiaGrocers

> **Purpose:** Single source of truth for setup, scripts, execution order, and
> current state. Read this before any data operation.
>
> **Last updated:** June 2026
>
> **Related:** `AGENTS.md` (repo setup), `Documentation/navigation-system.md` (nav architecture), `Documentation/search-system.md` (search architecture), `Implementation/navigation-contracts.md` (nav data contracts), `catalogue-build/minimum-viable-catalogue.md` (target catalog), `data-design/FEATURE-DEPENDENCY-MAP.md` (handle dependencies), `data-design/FEATURE-INVENTORY.md` (complete feature catalog)

---

## Fresh Setup

See `AGENTS.md` for detailed step-by-step. Condensed here:

```bash
# 1. Docker
docker compose -f docker-compose.yml up -d

# 2. Install (ORDER MATTERS)
npm install                              # root — links workspace packages
cd apps/storefront && yarn install && cd ../..  # storefront

# 3. Configure .env
cp apps\backend\.env.template apps\backend\.env
cp apps\storefront\.env.template apps\storefront\.env
# Fill in secrets: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_KEY, SENDGRID_API_KEY

# 4. Migrate + create admin
cd apps/backend
npx medusa db:migrate
npx medusa user -e admin@example.com -p password123
cd ../..

# 5. Start backend (keep open)
cd apps/backend && npx medusa develop

# 6. Seed products (new terminal, backend running)
cd apps/backend
node src/seed/reassign-natco-categories.mjs
node src/seed/assign-collections-v2.mjs
node src/seed/set-inventory.mjs

# 7. Import TRS products
cd ../..
node scripts/import-trs-products.mjs --apply
node scripts/rename-trs-images.mjs
node scripts/fix-trs-images.mjs --apply

# 8. Import MVC Round 1 products
node scripts/mvc/create-categories.mjs --apply
node scripts/mvc/import-round1.mjs --apply
node scripts/mvc/import-missing-variants.mjs
node scripts/mvc/pipeline.mjs --apply
node scripts/mvc/assign-images.mjs

# 9. Configure search
cd apps/meilisearch && npm run configure && npm run reindex && cd ../..

# 10. Verify
node scripts/verify-data-health.mjs

# 11. Start storefront
cd apps/storefront && yarn dev
```

---

## Payment Architecture

### How It Works

```
Storefront (checkout)                Medusa Backend
────────────────────                ──────────────
1. User fills address/delivery      

2. User clicks "Pay"                
   → handlePlaceOrder()             
   → initiatePaymentSession()       
      ├─ POST /store/              
      │  payment-collections        → creates payment collection for cart
      │  { cart_id }                   ↓
      │                             createPaymentCollectionWorkflow
      │                             → pay_col_xxx created (0 sessions)
      │
      └─ POST /store/
         payment-collections/       → creates payment session
         {id}/payment-sessions         ↓
         { provider_id }            selects provider (pp_system_default)
                                       ↓
3. placeOrder()                     payment session = active
   → sdk.store.cart.complete()      → cart completion workflow
                                       ↓
                                    → order created
4. Redirect to /order/{id}/confirmed
```

### API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/store/payment-collections` | Create payment collection for cart. Body: `{ cart_id }` |
| `POST` | `/store/payment-collections/{id}/payment-sessions` | Create payment session with provider. Body: `{ provider_id }` |
| `POST` | `/store/carts/{id}/complete` | Complete cart → create order |

### Payment Providers

| Provider ID | Status | Notes |
|------------|--------|-------|
| `pp_system_default` | ✅ Working | Manual/default payment. Orders complete successfully. |
| `pp_stripe_stripe` | ✅ Working | Card payments via Stripe Elements. PaymentIntent created + confirmed with `confirm: true` + `return_url`. |
| `pp_stripe-bancontact_stripe` | Registered | Not tested |
| `pp_stripe-ideal_stripe` | Registered | Not tested |
| `pp_stripe-giropay_stripe` | Registered | Not tested |
| `pp_stripe-blik_stripe` | Registered | Not tested |
| `pp_stripe-oxxo_stripe` | Registered | Not tested |
| `pp_stripe-promptpay_stripe` | Registered | Not tested |
| `pp_stripe-przelewy24_stripe` | Registered | Not tested |

### Current Payment State

`pp_stripe_stripe` is configured and working. The checkout form selects providers based on whether a card was entered: card entered via Stripe uses `pp_stripe_stripe` with confirmation data; no card falls back to `pp_system_default` (manual payment).

### Stripe Setup Status

| Component | Status |
|-----------|--------|
| Stripe module in `medusa-config.ts` (`modules[]`) | ✅ Configured as payment module provider |
| All 8 Stripe providers registered | ✅ |
| Card input UI (Stripe Elements) | ✅ Renders with `hidePostalCode: true` |
| Payment method creation (client-side) | ✅ Stripe.js `createPaymentMethod` |
| Payment session creation with Stripe | ✅ PaymentIntent created with `client_secret` |
| PaymentIntent confirmation | ✅ Via `confirm: true` + `return_url` in session `data` |
| Stripe webhook endpoint | ✅ Code exists at `/api/hooks/payment/route.ts` |
| End-to-end payment | ✅ `pp_system_default` works; Stripe flow wired |

### Stripe Setup — Step by Step

**1. Backend: Add Stripe provider inside payment module**

File: `apps/backend/medusa-config.ts`

```js
modules: [
  {
    key: "notification",
    resolve: "@medusajs/notification",
    options: { providers: [ ... ] },
  },
  {
    key: "payment",
    resolve: "@medusajs/payment",
    options: {
      providers: [
        {
          resolve: "@medusajs/payment-stripe",
          id: "stripe",
          options: {
            apiKey: process.env.STRIPE_SECRET_KEY || "",
            automaticPaymentMethods: true,   // Required — auto-detect payment method types
            capture: true,                   // Auto-capture payments
          },
        },
      ],
    },
  },
],
```

**Critical:** Stripe must be configured inside the `payment` module as a provider (matching the notification module pattern). Loading via `plugins[]` does NOT register Stripe with the payment module's provider registry, causing `"Unable to retrieve the payment provider with id: pp_stripe_stripe"`.

**2. Backend: Set environment variable**

```
# apps/backend/.env
STRIPE_SECRET_KEY=sk_test_xxxx    # from https://dashboard.stripe.com/test/apikeys
```

**3. Storefront: Set publishable key**

```
# apps/storefront/.env
NEXT_PUBLIC_STRIPE_KEY=pk_test_xxxx
```

**4. Storefront: Install Stripe dependencies**

```bash
cd apps/storefront && yarn add @stripe/stripe-js @stripe/react-stripe-js
```

**5. Storefront: Upgrade JS SDK to match backend version**

```bash
cd apps/storefront && yarn up @medusajs/js-sdk@2.15.2
```

**6. Storefront: Stripe card UI component**

`apps/storefront/src/modules/checkout/components/stripe-payment/index.tsx` renders a `CardElement` inside `<Elements>` provider. Card options set `hidePostalCode: true` (UK cards don't need ZIP).

**7. Storefront: Checkout form integration**

`apps/storefront/src/modules/checkout/templates/checkout-form/index.tsx` calls `initiatePaymentSession()` before `placeOrder()`. Provider selection:
- Card entered via Stripe → `pp_stripe_stripe` with `data: { payment_method, confirm: true, return_url }`
- No card → `pp_system_default`

**8. Storefront: Payment session function**

`apps/storefront/src/lib/data/cart.ts:initiatePaymentSession()` uses direct API calls:

```
POST /store/payment-collections { cart_id }
  → creates payment collection for the cart

POST /store/payment-collections/{id}/payment-sessions
  { provider_id: "pp_stripe_stripe", data: { payment_method, confirm: true, return_url } }
  → creates payment session + initiates Stripe PaymentIntent + confirms it
```

**9. Stripe Session Data Format**

The `data` field passed to the payment session must include:

| Field | Purpose | Required |
|-------|---------|----------|
| `payment_method` | Stripe PaymentMethod ID (`pm_xxx`) from client-side tokenization | Yes |
| `confirm` | Set to `true` to confirm the PaymentIntent immediately | Yes |
| `return_url` | URL to redirect after 3D Secure / authentication | Yes (with `confirm: true`) |

The `return_url` must point back to the storefront (e.g., `window.location.href`). Stripe redirects here after any required authentication (3D Secure, bank redirect).

**10. Authentication Flow**

```
Stripe.js on storefront           Medusa Backend              Stripe API
────────────────────              ──────────────              ─────────
CardElement → createPaymentMethod
  → pm_xxx created
                                  ← POST /payment-sessions
                                     { provider_id, data: {
                                       payment_method: "pm_xxx",
                                       confirm: true,
                                       return_url: "..." }}
                                                              → create PaymentIntent
                                                              → confirm PaymentIntent
                                                              ← status: succeeded
                                  ← session status: AUTHORIZED
cart.complete()
  → order created ✅
```

**11. `pp_system_default` Fallback**

When no card is entered, the checkout falls back to `pp_system_default` (manual payment). Orders complete but no payment is collected. This is useful for testing order flow before Stripe is configured.

**12. Verify Stripe is loaded**

```bash
curl http://127.0.0.1:9000/admin/payments/payment-providers \
  -H "Authorization: Bearer <admin-token>"
```

Should show all 8 `pp_stripe_*` providers plus `pp_system_default`.

**13. Webhook endpoint (production only)**

`apps/backend/src/api/hooks/payment/route.ts` receives Stripe events. Needed in production for asynchronous payment confirmations, refunds, and disputes. Not required for test mode with `confirm: true`.

**14. Troubleshooting**

| Error | Cause | Fix |
|-------|-------|------|
| `Unable to retrieve the payment provider with id: pp_stripe_stripe` | Stripe configured in `plugins[]` instead of `modules[]` | Move to `payment` module's `providers` array |
| `Session was not authorized with the provider` | PaymentIntent not confirmed | Add `confirm: true` + `return_url` to session `data` |
| `Payment sessions are required to complete cart` | No payment collection created | Call `POST /store/payment-collections` before cart completion |
| `return_url parameter is not provided` | Missing `return_url` in session `data` | Include `return_url: window.location.href` |
| PaymentIntent `requires_confirmation` | `confirm: true` not set or confirm failed | Verify 3 params: `payment_method`, `confirm: true`, `return_url` |

---

## Email Setup — End to End

### Architecture

```
Medusa Event System              Subscribers                  SendGrid API
─────────────────              ────────────                  ───────────
customer.created ─────────────→ auth.ts                      (optional)
                                  ↓
                            generateToken()
                            store in customer metadata
                            buildHTML()
                                  ↓
                            sendNotification()
                              → notificationService
                                .createNotifications([{
                                  to, channel: "email",
                                  content: { subject, html }
                                }])
                                  ↓
                            SendGrid provider.send()
                              → @sendgrid/mail.send()
                                  ↓
                            📧 Email delivered

auth.password_reset ─────────→ auth.ts
                                  ↓
                            buildResetHtml()
                            sendNotification() → 📧

order.placed ───────────────→ order-confirmation.ts
                                  ↓
                            container.resolve("query")
                              → fetch full order with relations
                                  ↓
                            buildOrderConfirmationEmail()
                            sendNotification() → 📧
```

### Emails Sent

| Event | File | Email Content |
|-------|------|---------------|
| `customer.created` | `subscribers/auth.ts` | Verification code + verification link |
| `auth.password_reset` | `subscribers/auth.ts` | Reset code + reset password link |
| `order.placed` | `subscribers/order-confirmation.ts` | Order number, items, prices, delivery address, total |

### Setup Steps

**Step 1 — Create SendGrid account**

Go to https://signup.sendgrid.com and create an account. Free tier gives 100 emails/day.

**Step 2 — Verify Sender Identity**

1. Go to https://app.sendgrid.com/settings/sender_auth
2. Click **"Verify a Single Sender"**
3. Enter the from email address (e.g., `info@yourdomain.com`)
4. SendGrid sends a verification email — click the link to confirm
5. Wait 1-2 minutes for the verification to propagate

**Step 3 — Create API Key**

1. Go to https://app.sendgrid.com/settings/api_keys
2. Click **"Create API Key"** → "Full Access" or "Restricted Access" with **Mail Send** permission
3. Copy the generated key (starts with `SG.`)
4. Save it immediately — cannot be viewed again

**Step 4 — Configure backend `.env`**

```
# apps/backend/.env
SENDGRID_API_KEY=SG.xxxx                    # From Step 3
SENDGRID_FROM=info@yourdomain.com           # Must match verified sender (Step 2)
```

**Step 5 — Backend config (already done)**

`apps/backend/medusa-config.ts` auto-activates SendGrid when `SENDGRID_API_KEY` is set:

```js
modules: [{
  key: "notification",
  resolve: "@medusajs/notification",
  options: {
    providers: [
      { resolve: "@medusajs/medusa/notification-local", id: "local", ... },
      ...(process.env.SENDGRID_API_KEY ? [{
        resolve: "@medusajs/notification-sendgrid",
        id: "sendgrid",
        options: {
          channels: ["email"],
          api_key: process.env.SENDGRID_API_KEY,
          from: process.env.SENDGRID_FROM || "noreply@indiagrocers.co.uk",
        },
      }] : []),
    ],
  },
}],
```

The `from` address MUST match the verified sender identity in SendGrid (Step 2).

**Step 6 — Restart backend**

```bash
cd apps/backend && npx medusa develop
```

**Step 7 — Test**

- **Signup:** Create account → check email for verification code
- **Forgot password:** Click "Forgot your password?" → enter email → check inbox
- **Order:** Add to basket → checkout → place order → check inbox for order confirmation

### How Notification Format Works

The SendGrid provider checks for `content` field in the notification:

```ts
// ✅ Correct — sends inline HTML
notificationService.createNotifications([{
  to: "user@email.com",
  channel: "email",
  content: {
    subject: "Order Confirmed",
    html: "<html>...</html>",
  },
}])

// ❌ Wrong — SendGrid template mode (needs pre-configured template)
notificationService.createNotifications([{
  to: "user@email.com",
  channel: "email",
  template: "template-id",   // needs SendGrid dynamic template
  data: { ... },              // template variables
}])
```

### Dev Mode (no SendGrid key)

Without `SENDGRID_API_KEY`, emails are logged to the backend terminal:

```
[auth] DEV EMAIL — to:user@email.com subject:Verify your email
[order] DEV EMAIL — Order #12 to user@email.com
```

The local notification provider logs content, the SendGrid provider is not activated.

### Configuring for Different Domains

For a different domain (e.g., `support@mygrocerystore.com`):

1. **Verify the new sender** in SendGrid → Sender Authentication
2. **Update `.env`:**
   ```
   SENDGRID_FROM=support@mygrocerystore.com
   ```
3. Restart backend

For multi-domain setups (different from addresses per email type), modify the `content.subject` and sender in each subscriber individually.

### Troubleshooting

| Error | Cause | Fix |
|-------|-------|------|
| `403 - The from address does not match a verified Sender Identity` | `SENDGRID_FROM` not verified in SendGrid | Verify sender in SendGrid Settings → Sender Authentication |
| `DEV EMAIL` logged instead of sent | SENDGRID_API_KEY missing or notification service unavailable | Check `.env` has `SENDGRID_API_KEY`, restart backend |
| `no email on order` | Order event only carries `{ id }` | Subscriber must fetch full order via `container.resolve("query")` |
| `Could not resolve 'orderService'` | Wrong service name | Use `container.resolve("query")` remote query engine |
| Email lands in spam | New SendGrid account, no domain reputation | Warm up SendGrid account with low volumes first |

### Files Reference

| File | Purpose |
|------|---------|
| `apps/backend/medusa-config.ts` | Notification module config (SendGrid + local providers) |
| `apps/backend/.env` | `SENDGRID_API_KEY`, `SENDGRID_FROM` |
| `apps/backend/src/subscribers/auth.ts` | Verification + password reset emails |
| `apps/backend/src/subscribers/order-confirmation.ts` | Order confirmation emails |
| `apps/backend/src/api/auth/verify-email/route.ts` | Verification token validation |
| `apps/storefront/src/modules/account/components/verify-email/index.tsx` | Verification code input UI |
| `packages/auth/` | Auth module (email templates + Resend provider — extractable in Phase 4/5) |

---

## Environment Variables

### Backend (`apps/backend/.env`)

```env
DATABASE_URL=postgres://medusa:medusa@localhost:5432/indiagrocers
REDIS_URL=redis://localhost:6379
STORE_CORS=http://localhost:8000
ADMIN_CORS=http://localhost:5173,http://localhost:9000
AUTH_CORS=http://localhost:5173,http://localhost:9000
JWT_SECRET=<generate with: openssl rand -hex 64>
COOKIE_SECRET=<generate with: openssl rand -hex 64>
MEILISEARCH_HOST=http://localhost:7700

# Email (optional — enables verification, password reset, order confirmation emails)
SENDGRID_API_KEY=SG.xxxx

# Stripe (optional — enables Stripe payment provider)
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx

# Disable admin dashboard in production
DISABLE_MEDUSA_ADMIN=false
```

### Storefront (`apps/storefront/.env`)

```env
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxxx
NEXT_PUBLIC_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_REGION=gb
NEXT_PUBLIC_STRIPE_KEY=pk_test_xxxx
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
```

---

## Price Management

### Architecture

The price loading script matches pricelist entries to Medusa products by title, handle, or variant SKU. It updates variant prices via the Medusa Admin API.

### Usage

```bash
# Dry run — see what would change
node scripts/pricing/load-pricelist.mjs <pricelist.json>

# Apply changes
node scripts/pricing/load-pricelist.mjs <pricelist.json> --apply

# Then reindex MeiliSearch
cd apps/meilisearch && npm run reindex
```

### Pricelist Format

**JSON:**
```json
[
  { "title": "Natco - Cumin Seeds 400g", "price_gbp": 3.49 },
  { "title": "Tilda Pure Basmati", "variant_title": "2kg", "price_gbp": 5.49 },
  { "handle": "shan-special-chicken-biryani-mix", "price_gbp": 1.49 },
  { "sku": "MVC-shan-special-chicken-biryani-mix-v0", "price_gbp": 1.49 }
]
```

**CSV:**
```csv
title,variant_title,price_gbp
"Natco - Cumin Seeds 400g",Default,3.49
"Tilda Pure Basmati",2kg,5.49
```

### Matching Logic

| Field | Matches | Example |
|-------|---------|---------|
| `title` | Exact product title (case-insensitive) | `"Natco - Cumin Seeds 400g"` |
| `handle` | Product URL handle | `"shan-special-chicken-biryani-mix"` |
| `sku` | Variant SKU | `"MVC-shan-special-chicken-biryani-mix-v0"` |
| `variant_title` | Variant title (defaults to `"Default"`) | `"2kg"`, `"500g"` |

Prices are specified in **GBP pounds** (`price_gbp: 3.49` = £3.49). The script converts to pence internally.

### Output

| Status | Meaning |
|--------|---------|
| `UPDATED` | Price changed |
| `NOT_FOUND` | Product not matched in DB — check title/handle |
| `NO_VARIANT` | Product matched but variant not found |
| `SKIPPED` | Price already correct — no change needed |

### Files

| File | Purpose |
|------|---------|
| `scripts/pricing/load-pricelist.mjs` | Main price loading script |
| `scripts/pricing/example-pricelist.json` | Example pricelist (JSON format) |

---

## Docker Services

```bash
docker compose -f docker-compose.yml up -d
```

| Service | Image | Port | Credentials |
|---------|-------|------|-------------|
| Postgres 16 | `postgres:16` | 5432 | `medusa`:`medusa`, db `indiagrocers` |
| Redis 7 | `redis:7-alpine` | 6379 | — |
| MeiliSearch v1.12 | `getmeili/meilisearch:v1.12` | 7700 | — (no auth in dev) |

---

## Script Index

### Data Import Scripts

| Script | Purpose | Run? |
|--------|---------|------|
| `scripts/import-from-shopify.mjs` | Import missing Natco products from Shopify JSON | ✅ Run |
| `scripts/import-trs-products.mjs` | Import 50 TRS products from `Implementation/TRS_products/products.json` | ✅ Run |
| `scripts/rename-trs-images.mjs` | Rename TRS images to `{brand}_{handle}.{ext}` convention | ✅ Run |

### Fix & Repair Scripts

| Script | Purpose | Run? |
|--------|---------|------|
| `scripts/fix-trs-images.mjs` | Link TRS product thumbnails to correct image files | ✅ Run |
| `scripts/fix-tinned-products.mjs` | Reparent tinned subcategories + reassign 28 misassigned products | ✅ Run |

### Enrichment Scripts

| Script | Purpose | Run? |
|--------|---------|------|
| `scripts/mvc/pipeline.mjs` | Enrichment: descriptions, tags, dietary, allergens, synonyms | ✅ Run |
| `scripts/mvc/audit.mjs` | Catalog health dashboard — read-only | ✅ Run |
| `scripts/mvc/enable-pseudo-query.mjs` | Rebuilds category-tags.json + enables DP-01 | ❌ |

### MVC Catalog Build Scripts

| Script | Purpose | Run? |
|--------|---------|------|
| `scripts/mvc/create-categories.mjs` | Create 23 new MVC category handles | ✅ Run |
| `scripts/mvc/import-round1.mjs` | Import 100 MVC products from JSON | ✅ Run |
| `scripts/mvc/import-missing-variants.mjs` | Import 17 missing weight variants | ✅ Run |
| `scripts/mvc/scrape-images.py` | Scrape product images from veenas.com | ✅ Run |
| `scripts/mvc/assign-images.mjs` | Link scraped images to MVC products | ✅ Run |

### Validation Scripts

| Script | Purpose |
|--------|---------|
| `scripts/verify-data-health.mjs` | Validates MeiliSearch handles, product count, dietary flags |
| `scripts/validate-all-categories.mjs` | Per-category parent/child product count |
| `scripts/audit-catalog-completeness.mjs` | CSV vs DB vs MeiliSearch cross-reference |
| `scripts/validate-storefront.mjs` | Storefront validation |

---

## Execution Log

### Phase 1: Foundation — Docker + Migration
### Phase 2: Product Import — Natco (357) + TRS (50)
### Phase 3: Data Fixes — Tinned products, TRS images, old handles cleanup
### Phase 4: MVC Enrichment — Descriptions, tags, dietary, synonyms, allergens
### Phase 5: MVC Round 1 — Categories, 100 products, images, tests
### Phase 6: Payment + Auth — Stripe plugin, email subscriber, order confirmation

---

## Current State — Production Catalog

| Metric | Value |
|--------|-------|
| Total products | **506** |
| Original (Natco + TRS) | 407 |
| MVC Round 1 | 99 |
| Category handles | 49 active |
| Brands | 31 |
| Descriptions | 506/506 (100%) |
| Images | 504/506 (99.6%) |
| Integration tests | **81/81 passing** |
| Payment | `pp_system_default` (orders complete) |
| Stripe card UI | Rendered in checkout (`hidePostalCode: true`) |
| Email (SendGrid) | Configured, needs `SENDGRID_API_KEY` set |

### Category Hierarchy

```
SPICES → spices-herbs, spice-herb-jars, spice-blends-mixes, food-colourings-essences, sugar
GRAINS → rice-quinoa, flour-milk-powder, wheat-grains-couscous, corn, flours
LENTILS → dried-lentils-beans-peas, soya-products, tinned-lentils-beans
NUTS-SEEDS → raw-nuts, seeds, coconut-products, dried-fruit, flavoured-nuts-snacks
SNACKS → pappadoms, chutneys-pickles-sauces, namkeen-lentil-snacks, flavoured-nuts-snacks,
         haldiram-namkeens, bikaji-namkeens, indian-biscuits
ESSENTIALS → all-essentials, ghee-oils, teas-drinks, vegetables,
             tinned-products → tinned-vegetables, tinned-coconut, tinned-fruit
MASALAS-DESSERT-MIXES → shan-masalas, mdh-masalas
READY-TO-EAT-INSTANT → instant-noodles
CONFECTIONERY-SWEETS → tinned-sweets, indian-candies
BEVERAGES-DRINKS → loose-leaf-tea, drinks-syrups, health-drinks
```

---

## Payment Files Reference

| File | Purpose |
|------|---------|
| `apps/backend/medusa-config.ts` | Stripe loaded via `plugins[]` |
| `apps/backend/src/api/hooks/payment/route.ts` | Stripe webhook endpoint |
| `apps/backend/src/subscribers/order-confirmation.ts` | Email on `order.placed` |
| `apps/backend/src/subscribers/auth.ts` | Email on `customer.created` + `auth.password_reset` |
| `apps/backend/src/api/auth/verify-email/route.ts` | Email verification API |
| `apps/storefront/src/lib/data/cart.ts` | `initiatePaymentSession()` — API-based session creation |
| `apps/storefront/src/modules/checkout/components/stripe-payment/index.tsx` | Stripe card UI |
| `apps/storefront/src/modules/checkout/templates/checkout-form/index.tsx` | Checkout flow |
| `apps/storefront/src/modules/account/components/verify-email/index.tsx` | Email verification UI |
| `apps/storefront/src/modules/account/components/verification-gate/index.tsx` | Unverified account gate |
| `packages/auth/` | Auth module (extractable microservice in future) |

---

## Post-Any-Data-Change Checklist

```bash
cd apps/meilisearch && npm run reindex
node scripts/verify-data-health.mjs
cd apps/storefront && npx playwright test e2e/
node scripts/mvc/audit.mjs
```

---

## Pending Tasks

| ID | Task | Priority | Status |
|----|------|----------|--------|
| **G11** | Natco variant consolidation | 🔴 Go-Live | Not started |
| **G4** | Rate limiting on auth endpoints | 🔴 Go-Live | Not started |
| **G12** | Product price management | 🔴 Go-Live | ✅ Built — `scripts/pricing/load-pricelist.mjs` |
| **G13** | Customer invoice generation | 🔴 Go-Live | Not started |
| **D1** | Delivery slots: 4-hour, Sat/Sun only | 🔴 Go-Live | Recorded |
| **D2** | Basket sidebar: sticky scroll | 🔴 Go-Live | Recorded |
| **D4** | Add to Basket: visual feedback | 🔴 Go-Live | Recorded |
| **D5** | Payment fails — "Failed to initiate payment" | 🔴 Go-Live | Fixed — Stripe wired, needs `return_url` in session data |
| **D6** | Cart reminder strip: 7/10 links dead (old seed handles) | 🔴 Go-Live | Not started — see `data-design/FEATURE-DEPENDENCY-MAP.md` |
| G1 | SendGrid API key set | 🟡 | Needs key |
| G5 | Production build validation | 🟡 | Deferred |
| G6 | CI/CD pipeline | 🟡 | Not started |
| G8 | Postgres connection pooling | 🟡 | Not configured |
| G9 | Redis persistence | 🟡 | Not configured |
