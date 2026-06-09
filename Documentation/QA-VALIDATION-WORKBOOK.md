# QA Validation Master Workbook — IndiaGrocers

> **Purpose:** Step-by-step manual validation guide for customer journeys.
> Aligns with automated tests to avoid duplication. Covers web (1280px) and
> mobile PWA (375px) viewports.
>
> **Last updated:** June 2026
>
> **Related:** [test-plan.md](test-plan.md), [customer-journeys-and-features.md](../Documentation/customer-journeys-and-features.md), [scenarios.md](scenarios.md)

---

## Prerequisites for QA Tester

```bash
# Backend on :9000, Storefront on :8000, MeiliSearch on :7700
docker compose -f docker-compose.yml up -d
cd apps/backend && npx medusa develop    # Terminal 1
cd apps/storefront && yarn dev           # Terminal 2

# Verify setup
python -c "import urllib.request,json;print(json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:9000/auth/user/emailpass',json.dumps({'email':'admin@example.com','password':'password123'}).encode(),{'Content-Type':'application/json'})))['token'][:10])" && echo "Backend OK"
```

**Browser:** Chrome DevTools set to `Responsive` mode. Toggle between `Desktop (1280×720)` and `Mobile (375×812)`.

**Test card:** `4242 4242 4242 4242` · Any future date · Any 3-digit CVC

---

## Priority Guide

| Priority | Meaning | When to Test |
|----------|---------|-------------|
| **P1** | Blocker — must work before go-live | Every deployment |
| **P2** | Critical — core customer experience | Pre-release validation |
| **P3** | Expected — standard e-commerce behavior | Full regression |
| **P4** | Nice-to-have | Monthly check |

---

# JOURNEY 1 — New Customer Discovers & Buys

## 1A — Homepage Landing (P1)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 1.1 | Open `/gb` — page loads without console errors | ☐ | ☐ | [homepage.feature](e2e-features) |
| 1.2 | Hero section visible with at least 1 slide | ☐ | ☐ | BDD |
| 1.3 | Category grid visible — count the cards | ☐ | ☐ | BDD |
| 1.4 | Featured products rail visible | ☐ | ☐ | — |
| 1.5 | 4 promo banners: Free Delivery, Express, Farm Fresh, Best Price | ☐ | ☐ | BDD |
| 1.6 | Testimonials section visible | ☐ | ☐ | BDD |
| 1.7 | WhatsApp floating button visible (first visit) | ☐ | ☐ | BDD |
| 1.8 | Mobile: bottom nav shows 5 tabs (Home, Search, Browse, Reorder, Account) | — | ☐ | BDD |
| 1.9 | Desktop: header shows Browse mega menu + Account link | ☐ | — | BDD |
| 1.10 | New Customer Onboarding prompt visible (regional cuisine options) | ☐ | ☐ | BDD |

## 1B — Browse Categories (P1)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 1.11 | Click a category card from homepage grid | ☐ | ☐ | BDD |
| 1.12 | Verify URL changes to `/categories/[handle]` | ☐ | ☐ | BDD |
| 1.13 | Verify breadcrumb navigation shown (All Products > Category Name) | ☐ | ☐ | BDD |
| 1.14 | Verify category title and description displayed | ☐ | ☐ | BDD |
| 1.15 | Verify subcategory chips visible for child categories | ☐ | ☐ | BDD |
| 1.16 | Click a subcategory chip — only those products shown, chip highlighted | ☐ | ☐ | BDD |
| 1.17 | Verify product cards display thumbnail, title, brand badge, price | ☐ | ☐ | BDD |
| 1.18 | Verify price format is `£X.XX` (not raw pence) | ☐ | ☐ | [price-display.feature](e2e-features) |
| 1.19 | Sort products by "Price: Low to High" — verify ascending order | ☐ | ☐ | — |
| 1.20 | Filter by price range — enter min £2, max £5 — verify results | ☐ | ☐ | — |
| 1.21 | Clear filters — verify all products return | ☐ | ☐ | — |

## 1C — Mega Menu Navigation (P2, Desktop Only)

| Step | Action | Web ✓ | Automated |
|------|--------|--------|-----------|
| 1.22 | Hover "Browse" in header — dropdown with parent categories | ☐ | BDD |
| 1.23 | Each parent category shows child subcategories | ☐ | BDD |
| 1.24 | Click a subcategory link — navigates to correct category | ☐ | BDD |

## 1D — Product Detail Page (P1)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 1.25 | Click any product card → PDP loads | ☐ | ☐ | BDD |
| 1.26 | Verify product title, brand badge, price displayed | ☐ | ☐ | BDD |
| 1.27 | Verify at least 1 product image in gallery | ☐ | ☐ | BDD |
| 1.28 | Verify price is `£X.XX` or `XXp` (sub-£1 items) | ☐ | ☐ | price-display.feature |
| 1.29 | Verify "Add to Cart" button visible | ☐ | ☐ | BDD |
| 1.30 | Verify stock status indicator visible | ☐ | ☐ | BDD |
| 1.31 | Multi-variant product (e.g., Tilda Pure Basmati): variant options shown | ☐ | ☐ | BDD |
| 1.32 | Select a different variant — price updates | ☐ | ☐ | BDD |
| 1.33 | Expand "Product Information" tab — verify grocery fields (ingredients, storage, allergens) | ☐ | ☐ | BDD |
| 1.34 | Verify NO clothing-store fields (Material, Fit, Country of origin) | ☐ | ☐ | BDD |
| 1.35 | Mobile: scroll past Add button → sticky add-to-cart bar appears | — | ☐ | BDD |

## 1E — Multi-Variant Overlay (P2)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 1.36 | Multi-variant product card: click "Options" → overlay opens | ☐ | ☐ | BDD |
| 1.37 | Variants shown with +/- quantity controls | ☐ | ☐ | BDD |
| 1.38 | Increase/decrease quantity — total price updates | ☐ | ☐ | — |
| 1.39 | Press ESC → overlay closes | ☐ | ☐ | BDD |
| 1.40 | Click outside overlay → overlay closes | ☐ | ☐ | BDD |

---

# JOURNEY 2 — Search & Discover

## 2A — Text Search (P1)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 2.1 | Type "basmati" in search bar → Enter | ☐ | ☐ | [search.feature](e2e-features) |
| 2.2 | Verify results include "Tilda Pure Basmati", "Natco - Basmati Rice" | ☐ | ☐ | BDD + e2e |
| 2.3 | Each result shows thumbnail, title, price | ☐ | ☐ | BDD |
| 2.4 | Type "jeera" → verify cumin products appear | ☐ | ☐ | top-results.spec.ts |
| 2.5 | Type "haldi" → verify turmeric products appear | ☐ | ☐ | vernacular.spec.ts |
| 2.6 | Type "chana" → verify chickpea products appear | ☐ | ☐ | vernacular.spec.ts |
| 2.7 | Type "dal" → verify lentil/dal products appear | ☐ | ☐ | top-results.spec.ts |
| 2.8 | Empty search (submit blank) → "Start typing" guidance shown | ☐ | ☐ | BDD |
| 2.9 | Search "xyznonexistent" → "No results found" suggestion | ☐ | ☐ | BDD |

## 2B — Autocomplete (P2)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 2.10 | Type "rice" slowly → autocomplete dropdown appears | ☐ | ☐ | BDD |
| 2.11 | Verify each suggestion shows thumbnail, title, price | ☐ | ☐ | BDD |
| 2.12 | Verify "View all results" link at bottom | ☐ | ☐ | BDD |
| 2.13 | Click outside → autocomplete closes | ☐ | ☐ | BDD |

## 2C — Search Category Chips (P2)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 2.14 | Search results page: click "Rice" category chip | ☐ | ☐ | BDD |
| 2.15 | Verify only rice products shown, chip is highlighted | ☐ | ☐ | BDD |
| 2.16 | Click same chip again → filter removed, all results return | ☐ | ☐ | BDD |

---

# JOURNEY 3 — Add to Basket & Cart Management

## 3A — Add from Product Card (P1)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 3.1 | Category page: click "Add" on a product card | ☐ | ☐ | [cart.feature](e2e-features) |
| 3.2 | Verify button changes to `[-] 1 [+]` quantity control | ☐ | ☐ | cart.feature |
| 3.3 | Click `+` — quantity increments, count updates | ☐ | ☐ | e2e (quantity-selector) |
| 3.4 | Click `−` — quantity decrements | ☐ | ☐ | e2e (quantity-selector) |
| 3.5 | Click `−` when quantity is 1 → item removed, "Add" button returns | ☐ | ☐ | cart.feature |
| 3.6 | Verify cart icon in header updates (badge shows item count) | ☐ | ☐ | — |

## 3B — Cart Dropdown (P1)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 3.7 | Click cart icon → dropdown opens | ☐ | ☐ | cart.feature |
| 3.8 | Verify added item shown with thumbnail, title, variant, quantity | ☐ | ☐ | BDD |
| 3.9 | Verify subtotal displayed | ☐ | ☐ | BDD |
| 3.10 | Verify "View Cart" link present | ☐ | ☐ | BDD |
| 3.11 | Verify "Go to Checkout" button present | ☐ | ☐ | BDD |
| 3.12 | Empty cart: dropdown shows "Your cart is empty" + "Start Shopping" | ☐ | ☐ | BDD |

## 3C — Cart Page (P1)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 3.13 | Navigate to `/cart` | ☐ | ☐ | cart.feature |
| 3.14 | Verify items grouped by product category | ☐ | ☐ | BDD |
| 3.15 | Each item shows thumbnail, title, variant, unit price | ☐ | ☐ | — |
| 3.16 | Verify quantity selector works (change from 1→3) | ☐ | ☐ | e2e |
| 3.17 | Verify remove button removes the item | ☐ | ☐ | BDD |
| 3.18 | Verify order summary: subtotal, delivery, total | ☐ | ☐ | BDD |
| 3.19 | Verify promo code input visible | ☐ | ☐ | BDD |
| 3.20 | Verify "Proceed to Checkout" button | ☐ | ☐ | BDD |
| 3.21 | Empty cart: "Your cart is empty" + "Explore products" CTA | ☐ | ☐ | cart.feature |
| 3.22 | Add items, navigate away, return → cart persists | ☐ | ☐ | e2e |
| 3.23 | Refresh browser → cart persists | ☐ | ☐ | BDD |

## 3D — Basket Progress Bar (P2)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 3.24 | With items below free delivery threshold: verify "Add £X.XX for FREE delivery" | ☐ | ☐ | — |
| 3.25 | Verify free delivery threshold displays as £40.00 or £45.00 | ☐ | ☐ | — |
| 3.26 | Verify minimum order displays (£25.00 or £30.00) when below | ☐ | ☐ | — |
| 3.27 | Add items above free threshold → "Free delivery unlocked!" message | ☐ | ☐ | — |
| 3.28 | Verify all amounts are `£X.XX` format (no raw pence) | ☐ | ☐ | price-display.feature |

---

# JOURNEY 4 — Checkout

## 4A — Address (P1)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 4.1 | Cart with items → click "Proceed to Checkout" | ☐ | ☐ | BDD |
| 4.2 | Verify address form visible: First name, Last name, Address, City, Postcode, Email, Phone | ☐ | ☐ | BDD |
| 4.3 | Enter valid London postcode "E1 6AN" → gate passes | ☐ | ☐ | BDD |
| 4.4 | Enter invalid postcode "LS1 1AA" → warning shown | ☐ | ☐ | BDD |
| 4.5 | Submit with missing fields → validation errors shown | ☐ | ☐ | BDD |
| 4.6 | Fill all required fields → "Continue to Delivery Slot" button enabled | ☐ | ☐ | — |
| 4.7 | Click continue → proceeds to delivery step | ☐ | ☐ | — |

## 4B — Delivery Slot Selection (P1 — D1 Regression)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 4.8 | Delivery slot selector visible with "Weekend delivery — Saturday & Sunday, 4-hour slots" subtitle | ☐ | ☐ | BDD |
| 4.9 | Verify only Saturday and Sunday dates are selectable | ☐ | ☐ | delivery-slots.spec.ts |
| 4.10 | Count the day buttons: exactly 4 (2 Saturdays + 2 Sundays) | ☐ | ☐ | BDD |
| 4.11 | Click a date → time windows expand: Morning (8am-12pm), Afternoon (12pm-4pm), Evening (4pm-8pm) | ☐ | ☐ | BDD |
| 4.12 | Verify each window spans exactly 4 hours | ☐ | ☐ | BDD |
| 4.13 | Click a time window → confirmation summary with date and time appears | ☐ | ☐ | BDD |
| 4.14 | Verify NO weekday dates (Mon-Fri) are shown | ☐ | ☐ | BDD |

## 4C — Payment (P1)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 4.15 | Proceed to payment step | ☐ | ☐ | BDD |
| 4.16 | Verify Stripe card input visible (CardElement with "Powered by Stripe") | ☐ | ☐ | BDD |
| 4.17 | Verify postal code field is HIDDEN (UK cards don't need it) | ☐ | ☐ | — |
| 4.18 | Verify Pay button shows correct amount (e.g., `Pay £5.98`) | ☐ | ☐ | BDD |
| 4.19 | Verify order summary shows: items, subtotal, delivery, total | ☐ | ☐ | BDD |
| 4.20 | Verify delivery address card shown | ☐ | ☐ | BDD |
| 4.21 | Verify selected delivery slot shown | ☐ | ☐ | BDD |

## 4D — Place Order (P1)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 4.22 | Enter test card `4242 4242 4242 4242` with future date and any CVC | ☐ | ☐ | — |
| 4.23 | Click Pay button | ☐ | ☐ | — |
| 4.24 | Verify redirect to order confirmation page | ☐ | ☐ | — |
| 4.25 | Verify green checkmark and "Thank you" message | ☐ | ☐ | BDD |
| 4.26 | Verify order number displayed | ☐ | ☐ | BDD |
| 4.27 | Verify delivery ETA displayed | ☐ | ☐ | BDD |
| 4.28 | Verify items listed with quantities | ☐ | ☐ | BDD |
| 4.29 | Verify order summary (subtotal, delivery, total) | ☐ | ☐ | BDD |
| 4.30 | Verify "Continue Shopping" button | ☐ | ☐ | BDD |
| 4.31 | Check Stripe dashboard → payment appears with correct amount (NO 100x overcharge) | — | — | verify-pricing.mjs |

## 4E — Guest Checkout (P2)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 4.32 | Not signed in: add items, proceed to checkout | ☐ | ☐ | BDD |
| 4.33 | Complete the full flow → order placed successfully | ☐ | ☐ | — |

---

# JOURNEY 5 — Account & Authentication

## 5A — Registration (P1)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 5.1 | Navigate to `/account` → sign-in form visible | ☐ | ☐ | registration.feature |
| 5.2 | Click "Join us" → registration form visible | ☐ | ☐ | BDD |
| 5.3 | Verify all fields: First name, Last name, Email, Phone, Password | ☐ | ☐ | BDD |
| 5.4 | Type short password (<8 chars) → "At least 8 characters" rule unchecked | ☐ | ☐ | BDD |
| 5.5 | Type 8 chars without letter → "At least 1 letter" rule unchecked | ☐ | ☐ | BDD |
| 5.6 | Type 8 chars without number → "At least 1 number" rule unchecked | ☐ | ☐ | BDD |
| 5.7 | Type valid password (8+ chars, letter + number) → all 3 rules satisfied | ☐ | ☐ | BDD |
| 5.8 | Submit with duplicate email → "account already exists" error | ☐ | ☐ | BDD |
| 5.9 | Submit with invalid email format → validation error | ☐ | ☐ | BDD |
| 5.10 | Submit with empty fields → validation errors shown | ☐ | ☐ | BDD |

## 5B — Sign In (P1)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 5.11 | Enter valid credentials (test-user@example.com / TestPass1) → click Sign in | ☐ | ☐ | login.feature |
| 5.12 | Verify redirect to account dashboard WITHOUT manual refresh | ☐ | ☐ | BDD |
| 5.13 | Verify dashboard shows user's name and email | ☐ | ☐ | BDD |
| 5.14 | Enter WONG credentials → error message shown | ☐ | ☐ | BDD |
| 5.15 | Submit empty fields → browser validation | ☐ | ☐ | BDD |

## 5C — Forgot Password (P2)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 5.16 | Click "Forgot your password?" → reset form shown | ☐ | ☐ | BDD |
| 5.17 | Enter email → click "Send Reset Code" | ☐ | ☐ | BDD |
| 5.18 | Verify "Check Your Email" confirmation message | ☐ | ☐ | BDD |

## 5D — Account Dashboard (P2)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 5.19 | Signed in → verify overview shows welcome, name, email | ☐ | ☐ | dashboard.feature |
| 5.20 | Verify profile completion bar | ☐ | ☐ | BDD |
| 5.21 | Verify order count and recent orders | ☐ | ☐ | BDD |
| 5.22 | Click "Orders" in sidebar → order history page | ☐ | ☐ | BDD |
| 5.23 | Click an order → full order details visible | ☐ | ☐ | BDD |
| 5.24 | Click "Addresses" → address management page | ☐ | ☐ | BDD |
| 5.25 | Click "Profile" → edit name, email, phone | ☐ | ☐ | BDD |
| 5.26 | Click "Log out" → redirected to `/account` sign-in form | ☐ | ☐ | BDD |

## 5E — Sign Out (P2)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 5.27 | Signed in → click "Log out" in sidebar | ☐ | ☐ | BDD |
| 5.28 | Verify redirected to sign-in form | ☐ | ☐ | BDD |
| 5.29 | Verify cart is cleared after logout | ☐ | ☐ | BDD |

---

# JOURNEY 6 — Wishlist (P3)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 6.1 | Category page: click heart icon on product card | ☐ | ☐ | wishlist.feature |
| 6.2 | Verify heart fills with brand orange colour | ☐ | ☐ | BDD |
| 6.3 | Click filled heart → returns to outline state | ☐ | ☐ | BDD |
| 6.4 | Navigate to `/wishlist` → products shown in grid | ☐ | ☐ | BDD |
| 6.5 | Each product shows thumbnail, title, price | ☐ | ☐ | BDD |
| 6.6 | Empty wishlist → heart icon + "Your wishlist is empty" + CTA | ☐ | ☐ | BDD |
| 6.7 | Store page: verify each product card has heart icon | ☐ | ☐ | BDD |

---

# JOURNEY 7 — Mobile Experience (P2)

| Step | Action | Mobile ✓ | Automated |
|------|--------|----------|-----------|
| 7.1 | Mobile viewport (375px): open side menu via hamburger icon | ☐ | mobile.feature |
| 7.2 | Menu shows Home, Store, Account, Cart + all categories | ☐ | BDD |
| 7.3 | Tap close button → menu closes | ☐ | BDD |
| 7.4 | Tap outside menu → menu closes | ☐ | BDD |
| 7.5 | Category page: products shown in horizontal layout (image left, text right) | ☐ | BDD |
| 7.6 | PDP: scroll past Add button → sticky add-to-cart bar at bottom | ☐ | BDD |
| 7.7 | Bottom nav visible with 5 tabs | ☐ | BDD |
| 7.8 | Cart page: image thumbnail visible for each item | ☐ | — |

---

# JOURNEY 8 — Error Handling (P2)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 8.1 | Navigate to `/non-existent-page` → 404 with homepage link | ☐ | ☐ | error-handling.feature |
| 8.2 | Navigate to `/products/non-existent-handle` → 404 or redirect | ☐ | ☐ | BDD |
| 8.3 | Navigate to `/categories/non-existent-category` → empty state or 404 | ☐ | ☐ | BDD |
| 8.4 | Broken image URL (check console) → placeholder shown, not broken icon | ☐ | ☐ | BDD |
| 8.5 | No console errors on any page (F12 → Console → check for red errors) | ☐ | ☐ | BDD |
| 8.6 | Cart persistence: add items → navigate away → return → items still there | ☐ | ☐ | BDD |
| 8.7 | Cart persistence: add items → refresh browser → items still there | ☐ | ☐ | BDD |

---

# JOURNEY 9 — Price Display Consistency (P1)

| Step | Action | Web ✓ | Mobile ✓ | Automated |
|------|--------|--------|----------|-----------|
| 9.1 | Category page: all prices are `£X.XX` (no raw pence, no `£X.XXXX`) | ☐ | ☐ | price-display.feature |
| 9.2 | Product card: price format correct | ☐ | ☐ | BDD |
| 9.3 | Cart page: subtotal, delivery, total all `£X.XX` | ☐ | ☐ | BDD |
| 9.4 | Cart dropdown: subtotal in `£X.XX` | ☐ | ☐ | BDD |
| 9.5 | Checkout payment step: Pay button shows `Pay £X.XX` | ☐ | ☐ | BDD |
| 9.6 | Order confirmation: all amounts `£X.XX` | ☐ | ☐ | BDD |
| 9.7 | No `£X.XXXX` (4+ decimal places) anywhere | ☐ | ☐ | BDD |
| 9.8 | Sub-£1 items: displayed as `XXp` (e.g., "65p"), not "£0.65" | ☐ | ☐ | BDD |
| 9.9 | Checkout Pay button amount matches cart total | ☐ | ☐ | — |
| 9.10 | Stripe charge amount matches Pay button amount | ☐ | — | verify-pricing.mjs |

---

# QUICK SMOKE CHECK (P1 — Every Deployment)

Run these 5 checks on BOTH web and mobile viewports. Takes ~3 minutes.

| # | Check | Web ✓ | Mobile ✓ |
|---|-------|--------|----------|
| S1 | Homepage loads, category grid visible, no console errors | ☐ | ☐ |
| S2 | Search "jeera" → results appear with cumin products | ☐ | ☐ |
| S3 | Add "Natco - Cumin Seeds 400g" to cart → qty controls appear | ☐ | ☐ |
| S4 | Cart page → prices display as `£X.XX` | ☐ | ☐ |
| S5 | Checkout → address form loads → delivery slots show weekends only | ☐ | ☐ |

---

## Automated Test Reference

| What | Command | Coverage |
|------|---------|----------|
| All BDD scenarios | `npx playwright test --project=bdd` | 14 feature files, ~127 scenarios |
| Search + data integrity | `npx playwright test --project=e2e` | Category pages, search rankings, PDP |
| Pricing verification | `node tests/verify-pricing.mjs` | DB prices, API, storefront display |
| Catalog verification | `node tests/verify-catalog.mjs` | Product counts, PDP accessibility |
| Data health check | `node scripts/verify-data-health.mjs` | MeiliSearch, dietary flags, handles |
| Consolidation | `node tests/verify-consolidation.mjs` | Admin consolidation API |
| Full suite | `npx playwright test` | Both BDD + e2e projects |

> **QA Note:** BDD feature files in `e2e/features/` are the **source of truth** for expected behaviour. Read the `.feature` file before testing a feature — it documents business rules + expected outcomes.
