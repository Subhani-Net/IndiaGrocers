# AGENTS.md � IndiaGrocers (Extracted Feature Content)

> This content was extracted from AGENTS.md on 2026-06-19 per the Clean Codespace Policy.
> All feature planning, epics, and business requirements now live in /docs/epics/.

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
