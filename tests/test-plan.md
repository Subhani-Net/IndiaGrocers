# IndiaGrocers — Workflow-Based Test Plan

> **Purpose:** Comprehensive test coverage for all user-facing workflows, mapped
> to defects (D1-D6), features (F-G1 through F-29), and go-live requirements.
> Each workflow documents steps, forks, edge cases, named products, and linked
> test files.
>
> **Last updated:** June 2026
>
> **Related:** [AGENTS.md](../AGENTS.md), [customer-journeys-and-features.md](../Documentation/customer-journeys-and-features.md), [QA-GATES.md](../scripts/data-pipeline/QA-GATES.md)

---

## Test Architecture

```
apps/storefront/e2e/           Playwright E2E (UI + DOM)
tests/                         Node.js HTTP tests (API + catalog)
scripts/                       Verification scripts (data health)
```

**Pattern:** All tests use named products (`"Natco - Cumin Seeds 400g"`),
`data-testid` selectors, and Gherkin-style comments. Tests validate specific
workflows with fork paths for happy, error, and edge cases.

**Running tests:**
```bash
cd apps/storefront
npx playwright test                # all E2E
npx playwright test e2e/account/   # specific domain
npx playwright test --ui           # interactive mode

node tests/verify-catalog.mjs      # Node.js catalog tests
node scripts/verify-data-health.mjs  # data health check
```

---

## Workflow W01 — Product Discovery

**Description:** Customer lands on site, searches/browses for products, views
PDP, uses filters and sorts.

**Named products:** `"Natco - Cumin Seeds 400g"`, `"TRS Cumin Seeds"`,
`"Tilda Pure Basmati"`, `"Natco - Brown Lentils 2kg"`, `"Natco - Turmeric Powder 400g"`,
`"Natco - Methi Seeds Fenugreek 400g"`

### Steps & Forks

```
1. Homepage loads
   ├── [OK] Guest sees hero, category grid, promo banners
   └── [OK] Authenticated user sees "Welcome, [Name]"

2. Browse by category
   ├── [OK] Click category card → category page with subcategories
   └── [OK] Click subcategory chip → filtered products

3. Search
   ├── [OK] Type "jeera" → cumin products
   ├── [OK] Type "haldi" → turmeric products
   ├── [OK] Type "chana" → chickpea products
   ├── [FORK] Empty search → "Start typing" message
   ├── [FORK] No results → "No results found"
   └── [FORK] Vernacular search → same results as Hindi

4. Filter
   ├── [FORK] Sort by price (low→high, high→low)
   ├── [FORK] Filter by price range
   ├── [FORK] Filter by brand
   └── [FORK] Clear all filters

5. Sort
   ├── [FORK] Default sort
   ├── [FORK] Price: Low to High
   ├── [FORK] Price: High to Low
   └── [FORK] Name: A to Z

6. Load more / pagination
   ├── [OK] 12 products initially
   ├── [FORK] Click "Load More" → next 12 append
   └── [FORK] All loaded → button hidden

7. Product Detail Page
   ├── [OK] Click product card → PDP with title, price, image
   ├── [FORK] Single variant → "Add to Cart"
   ├── [FORK] Multi variant → variant selector, price updates
   ├── [FORK] PDP tabs (description, ingredients, allergens)
   └── [FORK] Related products section
```

### Edge Cases
- Category with 0 products → shows empty state message
- Product with no image → shows placeholder
- Product with very long title → truncated, not broken layout
- Backend down → graceful error, not blank page

### Defects Mapped
| Defect | Description | Status |
|--------|-------------|--------|
| D6 | Cart reminder strip dead links (old handles → need updating) | Open |

### Existing Coverage
| File | Covers |
|------|--------|
| `e2e/categories/spices.spec.ts` | Spices parent + 5 child categories, exhaustive title lists |
| `e2e/categories/lentils.spec.ts` | Lentils parent + child, full product names |
| `e2e/categories/grains.spec.ts` | Grains parent + rice/flour child categories |
| `e2e/categories/nuts-seeds.spec.ts` | Nuts/seeds + dried fruit categories |
| `e2e/categories/snacks.spec.ts` | Snacks + pappadoms categories |
| `e2e/categories/essentials.spec.ts` | Essentials + oil/salt/sugar categories |
| `e2e/categories/trs-products.spec.ts` | TRS brand products listing |
| `e2e/categories/mvc-products.spec.ts` | MVC Round 1 products |
| `e2e/search/vernacular.spec.ts` | Vernacular terms: jeera, haldi, chana, basmati |
| `e2e/search/top-results.spec.ts` | Top-10 results for 11 search terms |
| `tests/verify-catalog.mjs` | 18 sections: product counts, PDP 200, breadcrumbs |

### Gaps
| Gap | Priority | New File |
|-----|----------|----------|
| Empty search state | Medium | Enhance `search/vernacular.spec.ts` |
| Search no-results | Medium | Enhance `search/vernacular.spec.ts` |
| Sort by price on store page | Medium | New `e2e/categories/filters-sort.spec.ts` |
| PDP variant selection | High | Enhance `categories/mvc-products.spec.ts` |
| PDP with no image (placeholder) | Medium | Enhance `categories/mvc-products.spec.ts` |
| Backend-down error page | Low | Future phase |

---

## Workflow W02 — Cart Management

**Description:** Customer adds products to cart, changes quantities, removes
items, applies promo codes, views cart page.

**Named products:** `"Natco - Cumin Seeds 400g"`, `"Natco - Brown Lentils 2kg"`,
`"Natco - Turmeric Powder 400g"`

### Steps & Forks

```
1. Add single-variant product from category page
   ├── [OK] Click "Add" on product card → Q → "Add to Basket" button found
   ├── [FORK] Click + → quantity increments, cart count updates
   ├── [FORK] Click − → quantity decrements
   ├── [FORK] Click − at qty 1 → item removed from cart
   └── [FORK] Cart dropdown shows item with "NEW" badge

2. Add via PDP (Product Detail Page)
   ├── [FORK] Set quantity 3 → 3 units added to cart
   └── [FORK] Cart total updates correctly

3. Cart dropdown behavior
   ├── [OK] Shows items, subtotal, "View Cart" / "Go to Checkout" buttons
   ├── [FORK] Remove via trash icon in dropdown
   └── [FORK] Empty cart → "Your cart is empty" with "Start Shopping"

4. Cart page (/gb/cart)
   ├── [FORK] Items grouped by category
   ├── [FORK] Quantity selector (1-10) per item
   ├── [FORK] Remove button per item
   ├── [FORK] Order summary (subtotal, shipping, total)
   ├── [FORK] Promo code input
   ├── [FORK] Empty cart state → "Your cart is empty" + "Explore products"

5. Out-of-stock handling
   ├── [FORK] Out-of-stock items flagged with red alert badge
   └── [FORK] Out-of-stock items displayed at top

6. Promo codes
   ├── [FORK] Valid promo → discount applied
   └── [FORK] Invalid promo → error message

7. Cart persistence
   ├── [FORK] Navigate to other page → items remain
   └── [FORK] Browser refresh → items remain
```

### Edge Cases
- Add same product twice → quantity increments, not duplicate line
- Remove last item → cart empties, UI updates
- Set quantity to 0 → item removed
- Max quantity (10) → cannot exceed
- Rapid clicks on +/− → no race conditions

### Defects Mapped
| Defect | Description | Status |
|--------|-------------|--------|
| D2 | Basket sidebar sticky scroll (desktop) | Open |
| D4 | Add to Basket — no visual feedback on product card | Fixed |

### Existing Coverage
| File | Covers |
|------|--------|
| `e2e/products/quantity-selector.spec.ts` | Page loads, button visibility (NO interactions) |

### Gaps
| Gap | Priority | New File |
|-----|----------|----------|
| Qty +/− click interaction on category card | **Critical** | `e2e/cart/cart-interactions.spec.ts` |
| Qty +/− click interaction on store page | **Critical** | `e2e/cart/cart-interactions.spec.ts` |
| Cart dropdown content after add | **Critical** | `e2e/cart/cart-interactions.spec.ts` |
| Cart page (view, modify, remove) | **Critical** | `e2e/cart/cart-interactions.spec.ts` |
| Promo code flow | High | `e2e/cart/cart-interactions.spec.ts` |
| Empty cart state | Medium | `e2e/cart/cart-interactions.spec.ts` |
| Cart persistence across navigation | Medium | `e2e/cart/cart-interactions.spec.ts` |
| Max quantity limit | Medium | `e2e/cart/cart-interactions.spec.ts` |

---

## Workflow W03 — Checkout

**Description:** Customer proceeds through 4-step checkout: Address → Delivery →
Payment → Review → Place Order.

**Named products:** `"Natco - Cumin Seeds 400g"`, `"Tilda Pure Basmati"`

### Steps & Forks

```
1. Postcode Gate
   ├── [OK] Valid London postcode ("E1 6AN") → pass, continue
   └── [FORK] Invalid postcode ("LS1 1AA") → warning message

2. Address Entry (Step 1)
   ├── [OK] Fill shipping address form + continue
   ├── [FORK] Missing required fields → validation errors
   └── [FORK] Saved address selection (if logged in)

3. Delivery Selection (Step 2)
   ├── [OK] Shipping methods visible
   ├── [FORK] Delivery slot selector visible (weekend only)
   ├── [FORK] 4-hour window selection (Morning/Afternoon/Evening)
   ├── [FORK] 4 weekend days shown (2 Sat + 2 Sun)
   └── [FORK] Weekday dates disabled

4. Payment (Step 3)
   ├── [OK] Stripe CardElement rendered
   ├── [FORK] Fill test card (4242...) →
   ├── [FORK] Invalid card → error message
   ├── [FORK] Expired card → error message
   └── [FORK] `pp_system_default` fallback (no card entered)

5. Review (Step 4)
   ├── [OK] Order summary with items, shipping, total
   ├── [FORK] Back buttons to edit previous steps
   └── [FORK] "Place Order" button

6. Place Order
   ├── [OK] Click "Place Order" → create payment session → complete
   ├── [FORK] Success → redirect to /order/{id}/confirmed
   └── [FORK] Failure → error message, stay on review

7. Guest checkout
   ├── [OK] Not signed in → can checkout
   └── [FORK] Post-checkout → account creation prompt
```

### Edge Cases
- Empty cart → redirected away from checkout
- Address with special characters → handled correctly
- Multiple payment attempts → no duplicate orders
- Network failure during payment → graceful error recovery

### Defects Mapped
| Defect | Description | Status |
|--------|-------------|--------|
| D1 | Delivery slots — 4-hour weekend only | Fixed |
| D3 | Stripe ZIP field (hide for non-Amex) | Deferred |
| D5 | Payment fails — "Failed to initiate payment" | Fixed |

### Existing Coverage
| File | Covers |
|------|--------|
| `e2e/checkout/payment-flow.spec.ts` | Cart page, address step, payment step, confirmation page loads (NO interactions) |
| `e2e/checkout/order-confirmation.spec.ts` | Page content checks (NO order flow) |
| `tests/e2e-test.mjs` | Full journey: homepage → add → checkout → order (HTTP-only) |

### Gaps
| Gap | Priority | New File |
|-----|----------|----------|
| Delivery slot validation (D1 regression) | **Critical** | `e2e/checkout/delivery-slots.spec.ts` |
| Postcode gate | High | Enhance `e2e/checkout/payment-flow.spec.ts` |
| Stripe card fill + payment session (D5 regression) | **Critical** | `e2e/checkout/payment.spec.ts` |
| Full address→delivery→payment→review flow | **Critical** | `e2e/checkout/payment.spec.ts` |
| Checkout step navigation (back/edit) | Medium | `e2e/checkout/payment.spec.ts` |
| Guest checkout | Medium | `e2e/checkout/payment.spec.ts` |

---

## Workflow W04 — Account / Registration

**Description:** Customer creates account, signs in, manages profile/addresses/
orders, resets password, verifies email.

### Steps & Forks

```
1. Registration
   ├── [FORK] Navigate to /account → click "Join us"
   ├── [FORK] Fill form: name, email, phone, password
   ├── [FORK] Password strength rules: 8+ chars, 1 letter, 1 number
   ├── [FORK] All rules met → account created, redirected to dashboard
   ├── [FORK] Duplicate email → "account already exists"
   ├── [FORK] Invalid email → validation error
   └── [FORK] Weak password → rule checks show failures

2. Sign In
   ├── [FORK] Enter email + password → sign in
   ├── [FORK] Correct credentials → redirect to dashboard
   ├── [FORK] Wrong credentials → error message
   ├── [FORK] Empty fields → browser validation
   └── [EDGE] Sign-in → dashboard visible without manual refresh (G2)

3. Forgot Password
   ├── [FORK] Click "Forgot password?" → email form
   ├── [FORK] Enter email → "Check Your Email" message
   ├── [FORK] Enter reset code + new password → reset
   ├── [FORK] Password mismatch → error
   └── [FORK] Weak new password → rule validation

4. Account Dashboard
   ├── [FORK] Overview: name, email, orders count
   ├── [FORK] No orders → empty state + "Start Shopping"
   └── [FORK] Recent orders visible (max 5)

5. Profile Management
   ├── [FORK] Edit name
   ├── [FORK] Edit email
   ├── [FORK] Edit phone
   └── [FORK] Change password

6. Address Management
   ├── [FORK] Add new address (modal)
   ├── [FORK] Edit existing address
   └── [FORK] Delete address

7. Order History
   ├── [FORK] List of orders (number, date, status, total)
   ├── [FORK] Click order → order details
   └── [FORK] No orders → empty state

8. Sign Out
   ├── [FORK] Click "Log out" → redirect to /account
   └── [EDGE] Cart cleared on sign-out

9. Email Verification (G3)
   ├── [FORK] Sign-up → verification email sent
   ├── [FORK] Unverified → gated from dashboard
   └── [FORK] Verify → dashboard accessible
```

### Edge Cases
- Concurrent sessions → handled gracefully
- Session expiry → redirect to login
- Token expiry during reset → clear error
- Two different accounts same browser → isolation

### Defects Mapped
| Defect | Description | Status |
|--------|-------------|--------|
| G1 | Email delivery — SendGrid configured | Done |
| G2 | Login/signup page transition after success | Fixed |
| G3 | Email verification on sign-up | Done |
| G4 | Rate limiting on auth endpoints | Not implemented |
| G7 | JWT and cookie secrets from environment | Fixed |

### Existing Coverage
| File | Covers |
|------|--------|
| NONE | Zero account tests exist |

### Gaps
| Gap | Priority | New File |
|-----|----------|----------|
| Register (happy path + edge cases) | **Critical** | `e2e/account/register-login.spec.ts` |
| Sign in (happy path + errors) | **Critical** | `e2e/account/register-login.spec.ts` |
| Forgot password | **Critical** | `e2e/account/forgot-password.spec.ts` |
| Dashboard overview | High | `e2e/account/register-login.spec.ts` |
| Profile edit | Medium | Future file |
| Address CRUD | Medium | Future file |
| Order history | Medium | Future file |
| Sign out | Medium | `e2e/account/register-login.spec.ts` |
| Verification gate | High | `e2e/account/register-login.spec.ts` |

---

## Workflow W05 — Order Confirmation

**Description:** After placing order, customer sees confirmation page with order
details and can download invoice.

### Steps & Forks

```
1. Confirmation Page
   ├── [OK] Green checkmark + "Thank you" message
   ├── [OK] Order number displayed
   ├── [FORK] Delivery ETA displayed
   ├── [FORK] Delivery address card
   ├── [FORK] Payment method card
   ├── [FORK] Items list with quantities
   ├── [FORK] Order summary (subtotal, shipping, total)
   └── [FORK] "Continue Shopping" button

2. PDF Invoice (G13)
   ├── [FORK] Email sent on order.placed
   ├── [FORK] Invoice contains order number, date, line items, VAT, total
   └── [FORK] Downloadable from order history

3. Order confirmation page is print-friendly
   └── [EDGE] Print CSS produces clean output
```

### Existing Coverage
| File | Covers |
|------|--------|
| `e2e/checkout/order-confirmation.spec.ts` | Page loads + content checks |
| `e2e/checkout/payment-flow.spec.ts` | Confirmation page renders |

### Gaps
| Gap | Priority | New File |
|-----|----------|----------|
| Real order confirmation after checkout | **Critical** | `e2e/checkout/payment.spec.ts` |
| Invoice download from order history | Medium | Future phase (G13 not built) |

---

## Workflow W06 — Wishlist

**Description:** Customer adds/removes products from wishlist, views wishlist
page.

### Steps & Forks

```
1. Add to wishlist from product card
   ├── [FORK] Click heart icon → fills with brand orange
   └── [FORK] Product added to localStorage

2. Remove from wishlist
   ├── [FORK] Click filled heart → returns to outline
   └── [FORK] Product removed from localStorage

3. View wishlist page (/gb/wishlist)
   ├── [FORK] Shows wishlisted products in grid
   ├── [FORK] Each product: thumbnail, title, price
   └── [EDGE] Empty wishlist → heart icon + "Your wishlist is empty" + CTA

4. Wishlist persistence
   └── [EDGE] localStorage only (no account sync yet — F-12)
```

### Existing Coverage
| File | Covers |
|------|--------|
| NONE | Zero wishlist tests exist |

### Gaps
| Gap | Priority | New File |
|-----|----------|----------|
| Heart/unheart product card | **Critical** | `e2e/wishlist/add-remove-view.spec.ts` |
| Wishlist page with items | **Critical** | `e2e/wishlist/add-remove-view.spec.ts` |
| Empty wishlist state | High | `e2e/wishlist/add-remove-view.spec.ts` |
| Add from PDP (F-05 — missing feature) | Medium | Future |

---

## Workflow W07 — Admin Pricing

**Description:** Admin loads price list (JSON/CSV), updates product prices via
API, exports results.

### Steps & Forks

```
1. Load pricelist (dry run)
   ├── [FORK] JSON pricelist → match by title
   ├── [FORK] CSV pricelist → match by SKU
   └── [FORK] Report: which matched, which not found

2. Apply prices
   ├── [FORK] Update matched products → ✅ reported
   ├── [FORK] Skip same-price products
   └── [EDGE] Handle products with no existing price

3. Price in storefront
   ├── [EDGE] Price rounded correctly (pence → pounds)
   └── [EDGE] PDP shows updated price after reindex
```

### Existing Coverage
| File | Covers |
|------|--------|
| NONE | Zero pricing tests exist |

### Gaps
| Gap | Priority | New File |
|-----|----------|----------|
| Dry-run pricelist load | **Critical** | `tests/verify-pricing.mjs` |
| Apply pricelist load | **Critical** | `tests/verify-pricing.mjs` |
| Verify price after update (API + storefront) | **Critical** | `tests/verify-pricing.mjs` |
| Price display consistency (pence/rounding) | High | `tests/verify-pricing.mjs` |

---

## Workflow W08 — Admin Consolidation

**Description:** Admin consolidates retail orders into wholesale master purchase
list by target date.

### Steps & Forks

```
1. Consolidate orders
   ├── [FORK] POST /admin/consolidate-orders { target_date }
   └── [FORK] Response: product_id → SUM(quantity)

2. CSV export
   ├── [FORK] Export results as CSV
   └── [FORK] CSV columns: product_title, SKU, quantity, category

3. Cron job
   └── [EDGE] Runs daily at midnight (headless)
```

### Existing Coverage
| File | Covers |
|------|--------|
| NONE | Zero consolidation tests exist |

### Gaps
| Gap | Priority | New File |
|-----|----------|----------|
| Consolidate API endpoint | **Critical** | `tests/verify-consolidation.mjs` |
| CSV export format | High | `tests/verify-consolidation.mjs` |
| Empty result (no orders) | Medium | `tests/verify-consolidation.mjs` |

---

## Implementation Matrix

### New Files (Phase B — Playwright E2E)

| # | File | Workflow | Tests | Priority |
|---|------|----------|-------|----------|
| 1 | `e2e/account/register-login.spec.ts` | W04 | Register (valid, dup email, weak pw), Login (valid, wrong, empty), Logout, Dashboard | **Critical** |
| 2 | `e2e/account/forgot-password.spec.ts` | W04 | Request reset, enter code, set pw, mismatch, weak pw | **Critical** |
| 3 | `e2e/cart/cart-interactions.spec.ts` | W02 | Add from category card, qty +/−, remove, cart dropdown, empty state, persistence | **Critical** |
| 4 | `e2e/checkout/delivery-slots.spec.ts` | W03 + D1 | Slot visibility, weekend-only, 4-hour window display, date range | **Critical** |
| 5 | `e2e/checkout/payment.spec.ts` | W03 + W05 + D5 | Full checkout flow, Stripe card, place order, confirmation | **Critical** |
| 6 | `e2e/wishlist/add-remove-view.spec.ts` | W06 | Heart/unheart, wishlist page, empty state | **Critical** |

### Enhanced Files (Phase C)

| File | Add |
|------|-----|
| `e2e/products/quantity-selector.spec.ts` | Real click interactions — incement/decrement, cart badge update |
| `e2e/categories/mvc-products.spec.ts` | PDP variant selection, price display on PDP |

### Admin Scripts (Phase D — Node.js)

| File | Covers | Tests |
|------|--------|-------|
| `tests/verify-pricing.mjs` | W07 | Dry-run, apply, verify API price, verify storefront display |
| `tests/verify-consolidation.mjs` | W08 | POST consolidate, verify response, CSV export |

### Test IDs to Add

| Component | File | New testids |
|-----------|------|-------------|
| Wishlist button | `wishlist-button.tsx` | `wishlist-heart`, `wishlist-heart-filled` |
| Quantity buttons | `product-card.tsx` | `qty-decrement`, `qty-increment`, `qty-count` |
| Add button | `product-card.tsx` | `add-to-cart-btn` |
| Product overlay | ProductOverlay component | `product-overlay`, `overlay-add-btn` |
| Delivery slots | `delivery-slot-selector/index.tsx` | `delivery-slot-selector`, `slot-morning`, `slot-afternoon`, `slot-evening` |
| Stripe payment | `stripe-payment/index.tsx` | `stripe-card-element`, `stripe-card-errors` |
| Checkout form | `checkout-form/index.tsx` | `checkout-step-address`, `checkout-step-delivery`, `checkout-step-payment`, `checkout-step-review`, `place-order-btn` |

---

## Total Test Count

| Phase | Files | Approx. Tests |
|-------|-------|---------------|
| Phase A | 1 (plan doc) | — |
| Phase B | 6 new Playwright specs | ~80 |
| Phase C | 2 enhanced specs | ~15 |
| Phase D | 2 admin Node.js scripts | ~20 |
| **Total** | **11 files** | **~115 tests** |
