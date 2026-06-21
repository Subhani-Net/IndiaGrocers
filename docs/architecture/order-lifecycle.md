# Order Lifecycle — Checkout → Payment → Confirmation → Fulfillment → Delivery

> **Status:** Active | **Last updated:** 2026-06-21 | **Scope:** Storefront + Backend + Stripe

---

## 1. Architecture Overview

The order lifecycle spans three systems and six stages. Each stage has a defined trigger, a status
transition, and a fallback mechanism.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         THREE-SYSTEM ARCHITECTURE                       │
│                                                                         │
│  STOREFRONT (Next.js :8000)     BACKEND (Medusa :9000)     STRIPE       │
│  ┌─────────────────────┐       ┌──────────────────┐       ┌──────────┐ │
│  │ Checkout wizard     │       │ completeCartWF    │       │ Payment  │ │
│  │ Confirmation page   │       │ subscribers       │       │ Intent   │ │
│  │ Account orders      │       │ cron jobs         │       │ Webhooks │ │
│  └─────────────────────┘       └──────────────────┘       └──────────┘ │
│                                                                         │
│  Communication:                                                        │
│  Storefront → Backend:  Medusa JS SDK  (publishable key)               │
│  Storefront → Backend:  Server Actions  (JWT cookie for auth)          │
│  Backend → Stripe:      Stripe SDK v19   (STRIPE_SECRET_KEY)           │
│  Stripe → Backend:      Webhooks         (needs stripe listen in dev)  │
│  Backend → Customer:    SendGrid         (SENDGRID_API_KEY configured) │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Complete Sequence — From Click to Delivered

```
STAGE 1: CHECKOUT                              [Storefront + Backend]
────────────────────────────────────────────────────────────────────
Customer navigates /gb/checkout?step=address
  → 4-step wizard: Address → Delivery → Payment → Review
  → Each step validates before advancing
  → Postcode validated against London delivery zone whitelist

Step 1 — Address
  collect: first_name, last_name, phone, email, address_1, city, postcode
  submit → setAddresses() → updateCart(POST /store/carts/:id) → redirect ?step=delivery

Step 2 — Delivery
  DeliverySlotSelector generates weekend slots (Sat/Sun only)
  3 time windows: Morning (8-12), Afternoon (12-4), Evening (4-8)
  slot selected → setShippingMethod(cartId, optionId, {delivery_date, delivery_window})
    → addShippingMethod(POST /store/carts/:id/shipping-methods)
    → metadata persisted on shipping method for confirmation page display
  continue → ?step=payment

Step 3 — Payment + Review
  StripeCardForm renders Stripe Elements (<CardElement>)
  Customer clicks "Pay" →
    1. stripe.createPaymentMethod({ type: "card", card: cardElement }) → pm_xxx token
    2. handlePlaceOrder(pm_xxx)


STAGE 2: PAYMENT INITIATION                    [Storefront → Backend → Stripe]
───────────────────────────────────────────────────────────────────────────────

handlePlaceOrder(paymentMethodId) in checkout-form/index.tsx:139

  Step 2a — initiatePaymentSession()
    POST /store/payment-collections              → creates payment_collection
    POST /store/payment-collections/:id/payment-sessions
      { provider_id: "pp_stripe_stripe",
        data: { payment_method: pm_xxx, confirm: true, return_url: "..." } }

  Step 2b — Backend StripeGbpProvider.initiatePayment()
    stripe-gbp-provider.ts:47-77
    Creates Stripe PaymentIntent with:
      amount: cart_total (in pence — no double-conversion)
      currency: gbp
      capture_method: "automatic"     (capture: true in config)
      automatic_payment_methods: { enabled: true }
      payment_method: pm_xxx           (from Step 2a)
      confirm: true                    (charges card immediately)
      return_url: "http://localhost:8000/gb"
    Returns: { id: pi_xxx, data: { stripe_pi_id: pi_xxx } }
    Stripe PI status: processing → succeeded (auto-confirmed)

  Step 2c — handlePlaceOrder continues →
    placeOrder() in cart.ts:429
      POST /store/carts/:id/complete


STAGE 3: CART COMPLETION → ORDER CREATION       [Backend]
──────────────────────────────────────────────────────────

POST /store/carts/:id/complete
  → completeCartWorkflow (node_modules/@medusajs/core-flows)

Workflow steps (in order):
  1. acquireLockStep(cart_id)        — prevents concurrent completions
  2. validateCartStep                — items, shipping, address, payment
  3. confirmVariantInventoryStep     — inventory check (if enabled)
  4. authorizePaymentSessionStep     → StripeGbpProvider.authorizePayment()
       stripe-gbp-provider.ts:79-84
       Returns { status: "authorized" } — PI already confirmed in Step 2b
       Payment session status: pending → authorized
       Payment collection status: not_paid → authorized
  5. createOrderStep                 — INSERT INTO order
       Order status: draft → pending
       Fulfillment status: not_fulfilled
  6. emitEventStep("order.placed")   — triggers all subscribers
  7. releaseLockStep(cart_id)

Workflow returns: { type: "order", order: { id: "order_xxx", ... } }
Workflow fails:    { type: "cart",  cart: { ... }, error: { ... } }


STAGE 4: ORDER PLACED — BACKEND SUBSCRIBERS     [Backend]
──────────────────────────────────────────────────────────

Event "order.placed" fires → subscribers execute asynchronously:

  Subscriber 1: order-confirmation.ts (apps/backend/src/subscribers/)
    Config: event: ["order.placed"]
    1. Fetches full order via remote query (items, customer, shipping_address, billing_address)
    2. Builds HTML email with: display_id, customer name, items table, totals, address
    3. Sends via notificationService.createNotifications({ channel: "email" })
       → SendGrid provider (SENDGRID_API_KEY configured in .env)
       → Falls back to console.log if provider unavailable

  Subscriber 2: payment-debug.ts
    Config: event: ["payment-collection.created", "payment-collection.payment_session_created", "order.placed"]
    Logs payment amounts, session data, order totals to payment-debug.log
    Used to verify the 100× GBP overcharge bug is fixed

  Subscriber 3: product-index.ts
    Config: event: ["product.created", "product.updated", "product.deleted"]
    Updates MeiliSearch index when products change (not order-related)

  Subscriber 4: order-completion.ts (P1 feature, June 2026)
    Config: event: ["payment.captured"]
    Auto-transitions order status from "pending" → "completed"
    Closes the payment → completion loop without admin intervention


STAGE 5: PAYMENT CAPTURE                       [Stripe + Backend]
──────────────────────────────────────────────────────────────────

Stripe auto-captures because capture_method: "automatic" was set.
  Stripe PI status: succeeded
  Stripe charge: created and captured

Medusa needs to record this capture. Two paths:

  PATH A (normal): Stripe webhook
    Stripe sends POST to /hooks/payment/stripe
    Backend verifies signature with STRIPE_WEBHOOK_SECRET
    Event: payment_intent.succeeded → payment captured
    Payment collection: authorized → completed
    Payment session: authorized → captured
    Then order-completion subscriber fires → order pending → completed

  PATH B (fallback): payment-reconciliation job
    Runs every 15 minutes (currently disabled: payment-reconciliation.ts.off)
    Checks Stripe PI status for orders with "awaiting"/"authorized" payment
    If Stripe says "succeeded", captures payment in Medusa via 3-tier fallback:
      1. capturePaymentWorkflow
      2. paymentModule.capturePayment()
      3. Direct DB UPDATE (payment_collection + payment_session)
    To re-enable: rename .off → .ts, restart backend

  PATH C (dev without Stripe CLI): Manual DB fix
    UPDATE payment_collection SET status = 'completed', captured_amount = amount
    UPDATE payment_session SET status = 'captured'


STAGE 6: ORDER CONFIRMATION — STOREFRONT        [Storefront]
────────────────────────────────────────────────────────────

placeOrder() receives { type: "order", order: { id } }
  → revalidateTag("orders-<cacheId>")     — bust stale order caches
  → removeCartId()                        — delete _medusa_cart_id cookie
  → redirect("/gb/order/{id}/confirmed")   — 307 server-side redirect

OrderConfirmationClient mounts → starts polling:

  Poll schedule (6 attempts, ~30s window):
    Attempt 1: instant (0ms)     — order may not be committed yet
    Attempt 2: +2s (2000ms)      — workflow still in progress?
    Attempt 3: +4s (6000ms)      — should usually be ready by now
    Attempt 4: +6s (12000ms)     — extended wait for slow workflows
    Attempt 5: +8s (20000ms)     — extended wait
    Attempt 6: +10s (30000ms)    — last chance before failover

  Each poll calls: retrieveOrder(orderId)
    → server action "use server"
    → sdk.client.fetch("/store/orders/{id}")
      → publishable API key automatically injected by SDK
      → cache: "no-store" (always fresh)
    → returns order → sets status: "success"

  Success: renders OrderCompletedTemplate with:
    - Order ID + display ID
    - Delivery ETA (from STANDARD_ETA config or persisted delivery slot metadata)
    - Dynamic Status Tracker (driven by order.status + order.fulfillment_status)
    - Delivery address + payment method cards
    - Items ordered list
    - Order summary (subtotal, shipping, total)
    - Spice Points loyalty
    - Repeat Order button, Print Receipt button
    - Create Account prompt (for guests)

  Failover (all 6 attempts exhausted):
    Shows gray box with order ID, "Refresh Page" button, "View Order History" link
    This should only appear if order truly doesn't exist (genuine failure)


STAGE 7: FULFILLMENT & DELIVERY                 [Manual — Admin UI]
────────────────────────────────────────────────────────────────────

Uses manual_manual provider — no automated fulfillment.

  Admin actions required (via http://localhost:9000/app):
    1. Create Fulfillment → items packed → fulfillment_status: fulfilled
    2. Create Shipment    → handed to carrier → fulfillment_status: shipped
    3. Mark Delivered     → customer received → fulfillment_status: delivered

  Shipping configuration (initial-data-seed.ts:141-248):
    - Fulfillment set: "London Delivery", type: "shipping"
    - Geo-zone: UK (country_code: "gb")
    - 2 shipping options:
      Standard Delivery: £3.99 (399 pence)
      Express Delivery:  £6.99 (699 pence)
    - Both linked to manual_manual provider

  Delivery slot configuration (store-config.ts:34-47):
    - Weekend only: Saturday + Sunday
    - 3 time windows per day: Morning (8-12), Afternoon (12-4), Evening (4-8)
    - 4 days displayed (2 Saturdays + 2 Sundays)
    - Slot metadata persisted on shipping method (P3 feature):
      delivery_date: "Saturday, 28 June"
      delivery_window: "Morning (8am-12pm)"

  Order Status Tracker on confirmation page (4 steps, dynamic):
    Step 1 "Order Confirmed"  ✓ = payment captured
    Step 2 "Processing"       → = order completed (auto-transitioned)
    Step 3 "Out for Delivery"  → = fulfillment created (manual)
    Step 4 "Delivered"         ✓ = shipment delivered (manual)
```

---

## 3. Status Transition Tables

### 3.1 Payment Collection Status

| Status | Trigger | Means |
|--------|---------|-------|
| `not_paid` | Payment collection created | No payment session yet |
| `awaiting` | Payment session created, no auth | Waiting for payment provider response |
| `authorized` | `authorizePayment()` succeeds | Stripe PI confirmed, funds reserved |
| `completed` | Payment captured (webhook/reconciliation) | Funds transferred, order payable |

### 3.2 Payment Session Status

| Status | Trigger | Means |
|--------|---------|-------|
| `pending` | Session created via `initiatePaymentSession` | Stripe PI being created |
| `authorized` | `authorizePayment()` returns | Stripe PI confirmed |
| `captured` | Webhook or reconciliation captures | Funds settled |
| `canceled` | Payment canceled | Stripe PI canceled |
| `error` | Payment failed | Stripe PI error |

### 3.3 Order Status

| Status | Trigger | Automated? |
|--------|---------|-----------|
| `draft` | Cart exists before completion | — |
| `pending` | `completeCartWorkflow` creates order | **Auto** |
| `completed` | Payment captured → `order-completion` subscriber | **Auto** (P1) |
| `archived` | Admin archives order | Manual |
| `canceled` | Admin cancels order | Manual |

### 3.4 Fulfillment Status

| Status | Trigger | Automated? |
|--------|---------|-----------|
| `not_fulfilled` | Order created | Default |
| `fulfilled` | Admin creates fulfillment | Manual |
| `shipped` | Admin creates shipment | Manual |
| `delivered` | Admin marks delivered | Manual |

### 3.5 Stripe PaymentIntent Status

| Stripe Status | Medusa Mapping | Trigger |
|--------------|----------------|---------|
| `requires_payment_method` | `pending` | PI created, no card yet |
| `requires_confirmation` | `pending` | Card attached, awaiting confirm |
| `requires_capture` | `authorized` | Confirmed, awaiting capture |
| `processing` | `authorized` | Payment processing |
| `succeeded` | `captured` | Payment complete |
| `canceled` | `canceled` | Payment canceled |

---

## 4. Key Files Reference

### Storefront (`apps/storefront/src/`)

| File | Role |
|------|------|
| `modules/checkout/templates/checkout-form/index.tsx` | 3-step checkout wizard, slot selection, `handlePlaceOrder()` |
| `modules/checkout/components/stripe-payment/index.tsx` | Stripe Elements card form, `createPaymentMethod()` |
| `modules/checkout/components/delivery-slot-selector/index.tsx` | Weekend slot generation, time window selection |
| `lib/data/cart.ts` | `setAddresses()`, `setShippingMethod()`, `initiatePaymentSession()`, `placeOrder()` |
| `lib/data/orders.ts` | `retrieveOrder()` (no-store), `listOrders()` (no-store) |
| `lib/data/cookies.ts` | `getAuthHeaders()`, `getCacheOptions()`, `getCacheTag()` |
| `lib/config.ts` | Medusa JS SDK init with publishableKey |
| `lib/config/store-config.ts` | Delivery slots, ETA, pricing constants |
| `modules/order/components/order-confirmation-client.tsx` | Polling engine (6 attempts, 30s window) |
| `modules/order/templates/order-completed-template.tsx` | Success display, dynamic status tracker, print receipt |
| `app/[countryCode]/(main)/order/[id]/confirmed/page.tsx` | Confirmation route handler |

### Backend (`apps/backend/src/`)

| File | Role |
|------|------|
| `framework-enhancements/payment/stripe-gbp-provider.ts` | Custom Stripe provider (GBP pence fix), PaymentIntent lifecycle |
| `subscribers/order-confirmation.ts` | `order.placed` → HTML email via SendGrid |
| `subscribers/payment-debug.ts` | Payment event logging → `payment-debug.log` |
| `subscribers/order-completion.ts` | `payment.captured` → auto-transition order `pending` → `completed` |
| `api/hooks/payment/route.ts` | Stripe webhook endpoint (broken — see gaps) |
| `jobs/payment-reconciliation.ts.off` | Fallback payment sync (currently disabled) |
| `jobs/order-consolidation.ts` | Daily order reporting |
| `migration-scripts/initial-data-seed.ts` | Shipping options, payment provider registration |

### Backend Config

| File | Role |
|------|------|
| `apps/backend/medusa-config.ts` | Module registration (payment, notification, Stripe provider) |
| `apps/backend/.env` | STRIPE_SECRET_KEY, SENDGRID_API_KEY, REDIS_URL, DATABASE_URL |

---

## 5. Known Gaps & Decisions

| Gap | Status | Impact |
|-----|--------|--------|
| **Fulfillment is manual** | By design (MVP) | Admin must create fulfillment, shipment, mark delivered |
| **No delivery tracking** | By design (MVP) | No carrier integration, no tracking numbers |
| **Stripe webhooks need Stripe CLI** | Documented | In dev, `stripe listen --forward-to` required. See SETUP.md "Dev Loop" for exact command. Provider fix handles payment sync in-app even without CLI |
| **Webhook endpoint broken** | Known | `src/api/hooks/payment/route.ts` resolves wrong service. Medusa's built-in handler should be used |
| **Redis not configured** | Fixed (2026-06-21) | `event-bus-redis` + `cache-redis` registered in `medusa-config.ts`. Cron jobs now fire. `workflow-engine-redis` deferred (single-instance, not needed). Clear with `npm run redis:clear` |
| **Reconciliation job disabled** | Temporary | Renamed to `.ts.off` to observe normal flow. Rename back to `.ts` to re-enable |
| **Confirmation polling 30s window** | Fixed (P2) | Extended from 4 attempts (7.5s) to 6 (30s) to handle slow workflows |
| **Delivery slot persisted** | Fixed (P3) | Slot metadata stored on shipping method, displayed on confirmation page |
| **Order auto-completion** | Fixed (P1) | `order-completion` subscriber auto-transitions `pending` → `completed` on `payment.captured` |
| **SendGrid email** | Fixed (P0) | SENDGRID_API_KEY configured, emails sent on `order.placed` |

---

## 6. Testing & Verification Commands

### Check an order's payment state
```bash
# Payment collection + session status
docker exec indiagrocers-postgres psql -U medusa -d indiagrocers_dev -c \
  "SELECT pc.status AS pc_status, pc.captured_amount, ps.status AS session_status \
   FROM payment_collection pc \
   JOIN payment_session ps ON ps.payment_collection_id = pc.id \
   WHERE pc.id = (SELECT payment_collection_id FROM order_payment_collection \
                  WHERE order_id = 'order_xxx');"
```

### Check Stripe PaymentIntent status
```bash
node -e "import Stripe from 'stripe'; \
  const s = new Stripe('sk_test_...', {apiVersion:'2024-04-10'}); \
  s.paymentIntents.retrieve('pi_xxx').then(pi => \
    console.log('Status:', pi.status, 'Amount:', pi.amount))"
```

### Check order status via API
```bash
curl -s http://localhost:9000/store/orders/order_xxx \
  -H "x-publishable-api-key: pk_..."
```

### Fix a stuck payment (manual reconciliation)
```sql
-- Step 1: Complete the payment collection
UPDATE payment_collection SET status = 'completed', captured_amount = authorized_amount
WHERE id = (SELECT payment_collection_id FROM order_payment_collection WHERE order_id = 'order_xxx');

-- Step 2: Capture the payment session
UPDATE payment_session SET status = 'captured'
WHERE payment_collection_id = (SELECT payment_collection_id FROM order_payment_collection WHERE order_id = 'order_xxx');

-- Step 3: Complete the order (if not auto-transitioned)
UPDATE "order" SET status = 'completed' WHERE id = 'order_xxx';
```

### Re-enable the reconciliation job
```bash
cd apps/backend/src/jobs
ren payment-reconciliation.ts.off payment-reconciliation.ts
# Backend watcher auto-restarts
```

### View reconciliation job status
```bash
# Check if job file is active
Get-ChildItem apps/backend/src/jobs/payment-reconciliation*

# Check backend log for reconciliation messages
Select-String -Path tmp/medusa-runtime.log -Pattern "reconciliation"
```
