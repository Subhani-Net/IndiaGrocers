# Pricing Denomination Map — Pence vs Pounds

> **Purpose:** Definitive reference for which layer stores/uses pence (integers, smallest currency unit) vs pounds (decimal GBP). Every test and future change must preserve this mapping.

---

## Layer Map

```
═══════════════════════════════════════════════════════════════════════
LAYER 0 — SOURCE FILES (Pounds)
═══════════════════════════════════════════════════════════════════════
  File: tmp/catalog-rebuild-v3/prices.csv
  Column: price_gbp
  Format: Decimal GBP  (e.g. "5.99" = £5.99)
  Example:  aashirvaad-atta-select,5kg  →  price_gbp: "5.99"
═══════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════
LAYER 1 — SEED PIPELINE (Conversion: Pounds → Pence)
═══════════════════════════════════════════════════════════════════════
  File: catalogue/seed-catalogue.mjs
  Line: 381 (approx — price application)
  Code:  amount: Math.round(parseFloat(price_gbp) * 100)
  Conversion: price_gbp (pounds) × 100 → amount (pence)
  Example:  "5.99"  →  Math.round(5.99 * 100)  →  599
═══════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════
LAYER 2 — POSTGRES DATABASE (Pence — integers only)
═══════════════════════════════════════════════════════════════════════
  Tables:
    price.amount              — variant prices (INTEGER, pence)
    product_variant_price_set — links variant ↔ price_set
    order_line_item.unit_price — order item prices (NUMERIC, pence)
    order.total / order.subtotal / order.shipping_total — (NUMERIC, pence)
    order_item.unit_price     — (NUMERIC, pence)
    payment.amount            — payment amount (NUMERIC, pence)
    payment_collection.amount — collection total (NUMERIC, pence)
    payment_session.amount    — session amount (NUMERIC, pence)

  Currency config: currency WHERE code = 'gbp'
    decimal_digits: 2
    symbol: £
    rounding: 0

  Verification: ALL amount columns must contain INTEGER values.
  If you see decimals in any amount column, the seed pipeline is broken.

  Example:
    SELECT amount FROM price WHERE currency_code = 'gbp' LIMIT 1;
    → 699  (not 6.99, not 699.00)
═══════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════
LAYER 3 — MEDUSA STORE API (Pence — raw integers in JSON)
═══════════════════════════════════════════════════════════════════════
  Endpoints:
    GET /store/products → variants[].calculated_price.calculated_amount  (pence)
    GET /store/orders/:id → total, subtotal, items[].unit_price         (pence)

  The API returns raw integers. The storefront is responsible for ÷100.

  Example response:
    { "calculated_price": { "calculated_amount": 699 } }   ← pence
═══════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════
LAYER 4 — MEDUSA ADMIN API (Pence — raw integers in JSON)
═══════════════════════════════════════════════════════════════════════
  Endpoints:
    GET /admin/products → variants[].prices[].amount  (pence)
    GET /admin/orders/:id → total, items[].unit_price  (pence)

  Same as Store API — raw pence. Admin UI is responsible for ÷100
  using currency.decimal_digits = 2.

  WARNING (v2.15.2): The admin UI may display raw pence values as pounds
  (e.g., £699.00 instead of £6.99). This is a framework rendering issue.
  The data in the API and DB is correct. See §Known Issues below.
═══════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════
LAYER 5 — STOREFRONT DISPLAY (Pounds — after ÷100 conversion)
═══════════════════════════════════════════════════════════════════════
  Every component receives pence from the API and divides by 100:

  Formatting:  formatGBP(amountInPence: number) → amountInPence / 100
  File:        apps/storefront/src/lib/util/format-price.ts:20-30

  Product cards:    (amount / 100).toFixed(2)  or  formatGBP(amount)
  Product PDP:      (price / 100).toFixed(2)
  Cart sidebar:     (amount / 100).toFixed(2)
  Checkout:         pence / 100
  Search results:   product.price_gbp / 100
  Nav autocomplete: (price_gbp / 100).toFixed(2)

  Special case: amounts < 100 pence display as "50p" not "£0.50"
  (formatGBP, line 21-23)

  Verification: Every storefront page showing a price must have been
  through a ÷100 conversion. No component should display raw pence.
═══════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════
LAYER 6 — MEILISEARCH INDEX (Pence — raw integers)
═══════════════════════════════════════════════════════════════════════
  File: apps/meilisearch/scripts/reindex-products.ts:133
  Field: price_gbp
  Value: p.variants[0].calculated_price.calculated_amount  (pence)
  Used for: sorting (price_gbp:asc), filtering (price_gbp <= X)

  Storefront consumption of MeiliSearch results:
    Search filter:   price_gbp <= ${userPrice * 100}   ← converts to pence
    Autocomplete:    (hit.price_gbp / 100).toFixed(2)  ← converts to pounds
═══════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════
LAYER 7 — STRIPE (Pence — passed directly, no conversion)
═══════════════════════════════════════════════════════════════════════
  File: apps/backend/src/framework-enhancements/payment/stripe-gbp-provider.ts

  Custom provider (stripe-gbp-provider):
    initiatePayment(input.amount) → stripe.paymentIntents.create({ amount })
    NO ×100 multiplication. Amount from Medusa (pence) goes directly to Stripe.
    Stripe interprets the amount as pence for GBP.

  Stock @medusajs/payment-stripe provider (NOT USED):
    Would call getSmallestUnit() → ×100 again → 100× overcharge.
    The custom provider was built specifically to prevent this.

  Verification:
    DB payment.amount === Stripe PaymentIntent.amount  (both in pence)
    Example:  DB = 5217 pence  ↔  Stripe PI amount = 5217  ↔  £52.17
═══════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════
LAYER 8 — ORDER EMAIL (Pounds — after ÷100 conversion)
═══════════════════════════════════════════════════════════════════════
  File: apps/backend/src/subscribers/order-confirmation.ts:115-116
  Code:  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" })
           .format((amount || 0) / 100)
  All amounts divided by 100 before email rendering.
═══════════════════════════════════════════════════════════════════════
```

## Quick Reference

| Layer | Unit | Example for £5.99 | To get pounds | To get pence |
|-------|------|-------------------|---------------|-------------|
| CSV source | Pounds | `5.99` | — | `× 100` |
| DB `price` | Pence | `599` | `÷ 100` | — |
| Store API response | Pence | `599` | `÷ 100` | — |
| Admin API response | Pence | `599` | `÷ 100` | — |
| Storefront display | Pounds | `"£5.99"` | — | `× 100` |
| MeiliSearch index | Pence | `599` | `÷ 100` | — |
| Stripe PI amount | Pence | `599` | `÷ 100` | — |
| Order DB | Pence | `599` | `÷ 100` | — |
| Order email | Pounds | `"£5.99"` | — | `× 100` |

## Known Issues

### Admin UI Display (v2.15.2)

The Medusa Admin v2.15.2 dashboard may display raw pence values as pounds
(e.g., 599 shown as `£599.00` instead of `£5.99`). The currency table has
`decimal_digits = 2` for GBP, but the admin UI may not apply this division.

**Impact:** Admin operators see inflated values when viewing products and
orders. Storefront and Stripe are unaffected — customers see correct prices.

**Status:** Framework issue — under investigation. Data and storefront are correct.

## Redis Configuration (added 2026-06-21)

Redis stores transient operational data: event queue, cache entries. All persistent
data is in PostgreSQL. Safe to flush anytime with `npm run redis:clear`.

Modules registered in `apps/backend/medusa-config.ts`:
- `@medusajs/event-bus-redis` (key: `"eventBus"`) — distributed events, enables cron jobs
- `@medusajs/cache-redis` (key: `"cache"`) — shared cache across restarts

`@medusajs/workflow-engine-redis` is installed but not registered. Not needed
for single-instance deployments — workflow execution history stays in PostgreSQL.

## Test Coverage

Playwright tests in `apps/storefront/e2e/pricing/pricing-denomination.spec.ts`
validate these invariants:

1. DB amount = storefront displayed amount × 100
2. DB amount = Stripe PI amount (same integer)
3. Storefront never displays raw pence (no price > £100 for sub-£1 products)
4. API response amounts are integers (no decimals)
5. MeiliSearch sorting by price works correctly in pence
