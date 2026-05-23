# IndiaGrocers London — Backend Dependencies Map

> **Proposal:** Build frontend through Phase 4, implement only the backend stories required to support it.
> **Legend:** 🔴 Critical | 🟡 Needed | 🟢 Nice to have | ⬜ Not needed yet

---

## Frontend Phase 1: Foundation ✅

| Frontend Story | Backend Dependency | Status | Criticality |
|---|---|---|---|
| SF-1.1 Orange Theme | None (pure CSS) | ✅ | 🟢 |
| SF-1.2 Responsive Layout | None | ✅ | 🟢 |
| SF-1.3 PWA Support | None (static files) | ✅ | 🟢 |
| SF-1.4 Desktop Mega Menu | **B3 — Category Hierarchy** | ✅ | 🔴 |
| SF-1.5 Mobile Hamburger Menu | **B3 — Category Hierarchy** | ✅ | 🔴 |
| SF-1.6 Footer | **B3 — Categories** (for quick links) | ✅ | 🟡 |
| SF-1.7 Hero Carousel | None (static content) | ✅ | 🟢 |
| SF-1.8 Category Grid | None (static links) | ✅ | 🟢 |
| SF-1.9 Featured Products | **B4 — Seed Products** (4 products seeded) | ✅ | 🔴 |
| SF-1.10 Testimonials | None (static content) | ✅ | 🟢 |
| SF-1.11 WhatsApp Float | None (static link) | ✅ | 🟢 |
| SF-1.12 Promo Banners | None (static) | ✅ | 🟢 |

---

## Frontend Phase 2: Page Styling

| Frontend Story | Backend Dependency | Current Status | Criticality | Action |
|---|---|---|---|---|
| SF-2.1 Category Listing Page | **B3/B5** — Categories with products | B3 ✅, B5 ⬜ | 🔴 | Need **B5.2-B5.17** (CSV import) to have products in categories |
| SF-2.2 Product Card Styling | **B5** — Products with prices, variants | ⬜ | 🔴 | Need products to render cards. Medusa API already ready |
| SF-2.3 Product Detail Page | **B5 + B6** — Full product data, images | ⬜ | 🔴 | Need products + image URLs. Can use text-only initially (🟡) |
| SF-2.4 Search Page | **B5** — Products to search | ⬜ | 🔴 | Medusa native search API works. Need products to return results |
| SF-2.5 Brands A-Z Page | **B3 + B5** — Products tagged by brand | ⬜ | 🟡 | Brands stored as tags. Need products first, then filter by tag |
| SF-2.6 Cart Page Styling | **B2** — Cart APIs | ✅ | 🟢 | Medusa cart APIs already work. Pure CSS restyling |
| SF-2.7 Checkout Styling | **B2.5-B2.6** — Shipping options | ✅ | 🟢 | Shipping configured. Payment **B7.1** needed to complete checkout flow (🟡) |
| SF-2.8 Order Confirmation | **B2 + B7.1** — Order flow + payment | ⬜ | 🟡 | Payment needed for real orders. Can style with mock data (🟢) |
| SF-2.9 Account Pages Styling | **B2.9** — User exists | ✅ | 🟢 | Pure CSS restyling of existing account pages |
| SF-2.10 Delivery Info Page | None (static content page) | — | 🟢 | No backend dependency |

**Phase 2 Blockers:** 🔴 B5 (Products in catalog) — all product-related pages need data

---

## Frontend Phase 3: Core Shopping

| Frontend Story | Backend Dependency | Current Status | Criticality | Action |
|---|---|---|---|---|
| SF-3.1 Product Filters | **B5** — Products, **B3** — Category IDs | ⬜ | 🔴 | Medusa supports `?category_id=` filter natively. Brand filters need tags |
| SF-3.2 Sort Options | **B5** — Products | ⬜ | 🟢 | Medusa supports `?order=price/name/created_at` natively |
| SF-3.3 Pagination | **B5** — Products | ⬜ | 🟢 | Medusa supports `?limit=` and `?offset=` natively |
| SF-3.4 Search Autocomplete | **B5** — Products | ⬜ | 🔴 | Medusa supports `?q=` natively. Need products to test |
| SF-3.5 Brand Listing | **B5** — Products with tags | ⬜ | 🟡 | Filter by `?tag_id=` or pass tags as query |
| SF-3.6 Collection Pages | **B4** — Collections + products | ⬜ | 🟡 | Need collections created with assigned products |
| SF-3.7 Sale/Offer Pages | **B4/B5** — Products + potentially discount rules | ⬜ | 🟢 | Can do manually with tags (e.g., tag "under-5") |

**Phase 3 Blockers:** 🔴 B5 (Products catalog) — same as Phase 2

---

## Frontend Phase 4: Cart & Checkout Enhancements

| Frontend Story | Backend Dependency | Current Status | Criticality | Action |
|---|---|---|---|---|
| SF-4.1 Cart Dropdown | **B2** — Cart APIs | ✅ | 🟢 | Already works. Restyling only |
| SF-4.2 Free Delivery Nudge | **B9.1** — Free shipping rule / **B2.6** — Shipping config | ⬜ | 🟡 | Can hardcode £40 threshold in frontend. Backend rule optional |
| SF-4.3 Promo Code | **B7.1** — Payment + **Promotions module** | ⬜ | 🟡 | Medusa promotions module enabled by default. Needs test codes |
| SF-4.4 Order Cut-off Timer | **B9.3** — Cutoff time config | ⬜ | 🟢 | Can hardcode "2:00 PM" in frontend. Backend config optional |
| SF-4.5 Guest Checkout | **B2.9** — Auth config | ✅ | 🟢 | Medusa supports guest checkout by default |

---

## Summary: Backend Stories Needed Per Phase

### 🔴 Must Complete (blockers for frontend)

| ID | Task | Unblocks |
|---|---|---|
| **B5.2-B5.18** | CSV Import — All product categories | SF-2.1 through SF-3.7 (all product pages) |
| **B7.1** | Stripe Payment (or use manual payment) | SF-2.7, SF-2.8 (checkout flow) |

### 🟡 Should Complete (enhances frontend)

| ID | Task | Unblocks |
|---|---|---|
| **B6.1-B6.3** | Product Images | SF-2.2, SF-2.3 (visual product display) |
| **B9.1** | Free Shipping Threshold | SF-4.2 (free delivery nudge) |
| **B8.2** | Inventory Tracking | SF-5.1 (stock badges) |

### 🟢 Can Defer

| ID | Task | Unblocks |
|---|---|---|
| B7.3-B7.4 | UK VAT Tax Rates | Not critical for dev |
| B9.2 | Postcode Zones | Not critical for dev |
| B10.1-B10.3 | Email Notifications | Not critical for dev |

---

## Recommended Execution Order

```
1. B5 (CSV Import)         ← 🔴 BLOCKER — unblocks all product pages
2. SF-2.1 to SF-2.10       ← Phase 2 styling (uses products from step 1)
3. B7.1 (Stripe/Payment)   ← 🟡 Needed for checkout
4. SF-3.1 to SF-3.7         ← Phase 3 functionality
5. SF-4.1 to SF-4.5         ← Phase 4 cart enhancements
6. B6 (Product Images)     ← 🟡 Enhances visuals
7. B9.1 (Free Shipping)    ← 🟡 Enhances cart
```

---

## What Can Be Done NOW (No Blockers)

These frontend stories need **zero** additional backend work:
- SF-2.6 (Cart Page Styling) — pure CSS
- SF-2.9 (Account Pages Styling) — pure CSS
- SF-2.10 (Delivery Info Page) — static page
- SF-2.7 (Checkout Styling) — CSS (payment flow completes with manual/test payment)
- SF-2.8 (Order Confirmation Styling) — CSS with mock
- SF-4.1 (Cart Dropdown) — pure CSS
- SF-4.4 (Cut-off Timer) — hardcoded component
- SF-4.5 (Guest Checkout) — already works
