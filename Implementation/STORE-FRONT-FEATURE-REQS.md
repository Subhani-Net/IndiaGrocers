# Storefront Feature Requirements & Status

> **Last updated:** May 2026
> **Status:** ✅ Complete | 🔷 Implemented (pending verification) | ⬜ Pending

---

## NAV: Navigation & Layout

| ID | Feature | Implemented | Verified |
|---|---|---|---|
| NAV-01 | Dynamic Category Navigation — no hardcoded handles | ✅ | ⬜ |
| NAV-02 | Mega Menu Dropdown — scoped per category, left-aligned | ✅ | ⬜ |
| NAV-03 | Single-Row Sticky Header — Logo, Browse, Search, Account, Cart | ✅ | ⬜ |
| NAV-04 | Search Input — submits via form action | ✅ | ⬜ |
| NAV-05 | Mega Menu Bar Below Header — scrolls away | ✅ | ⬜ |
| NAV-06 | Mobile Header — hamburger menu, logo, cart | ✅ | ⬜ |
| NAV-07 | Footer Quick Links — dynamic, child-filtered | ✅ | ⬜ |
| NAV-08 | Browse Dropdown — All Products + all categories | ✅ | ⬜ |

## HOME: Homepage

| ID | Feature | Implemented | Verified |
|---|---|---|---|
| HOME-01 | Data-Driven Category Grid — 12 categories, rotating colors | ✅ | ⬜ |
| HOME-02 | Hero Carousel Links — match seed data handles | ✅ | ⬜ |
| HOME-03 | Featured Products Guard — empty collections return null | ✅ | ⬜ |

## PROD: Product Display

| ID | Feature | Implemented | Verified |
|---|---|---|---|
| PROD-01 | Load More Button — progressive 12 per click, counter | ✅ | ⬜ |
| PROD-02 | Remove Filter Sidebar — full-width product grid | ✅ | ⬜ |
| PROD-03 | Category Breadcrumbs — full ancestor chain | ✅ | ⬜ |
| PROD-04 | 4-Column Desktop Grid — 4/2/1 responsive | ✅ | ⬜ |
| PROD-05 | Desktop Vertical Card — image top, title/weight/price/Add | ✅ | ⬜ |
| PROD-06 | Mobile Horizontal Card — 30% image, 70% text | ✅ | ⬜ |
| PROD-07 | Image Display — square, object-contain, full width | ✅ | ⬜ |
| PROD-08 | Inline Accordion — "More details" toggle | ✅ | ⬜ |
| PROD-09 | Variant Columns — weight + price, flex-wrap | ✅ | ⬜ |
| PROD-10 | Options Button — opens product overlay | ✅ | ⬜ |
| PROD-11 | Add to Cart from Card — adds cheapest variant | ✅ | ⬜ |
| PROD-12 | Uniform Card Heights — min-h wrapper | ✅ | ⬜ |
| PROD-13 | Variant Badge — orange count badge after overlay add | ✅ | ⬜ |

## CART: Cart & Basket

| ID | Feature | Implemented | Verified |
|---|---|---|---|
| CART-01 | Cart Sidebar — right column xl+, real cart data | ✅ | ⬜ |
| CART-02 | Cart Items Display — thumbnail, title, qty, price | ✅ | ⬜ |
| CART-03 | Remove from Cart — per-item deleteLineItem | ✅ | ⬜ |
| CART-04 | Cart Total — subtotal + "View Basket" link | ✅ | ⬜ |
| CART-05 | Auto-Refresh — cart-updated custom event | ✅ | ⬜ |
| CART-06 | Cart Badge in Header — item count in nav | ✅ | ⬜ |

## OVRL: Product Overlay

| ID | Feature | Implemented | Verified |
|---|---|---|---|
| OVRL-01 | Options Overlay — opens on "Options" click | ✅ | ⬜ |
| OVRL-02 | Layout — image left 40%, details right, mobile stacked | ✅ | ⬜ |
| OVRL-03 | Variant Selectors — ± quantity, green glow when active | ✅ | ⬜ |
| OVRL-04 | Add to Cart from Overlay — adds all selected, resets | ✅ | ⬜ |
| OVRL-05 | Close Button — X top-right always visible | ✅ | ⬜ |
| OVRL-06 | ESC Key Close | ✅ | ⬜ |
| OVRL-07 | Backdrop Close — click outside dismisses | ✅ | ⬜ |
| OVRL-08 | Scroll Lock — body overflow hidden | ✅ | ⬜ |

## CHKT: Checkout & Delivery

| ID | Feature | Implemented | Verified |
|---|---|---|---|
| CHKT-01 | Postcode Overlay — input, validate, result | ✅ | ⬜ |
| CHKT-02 | Postcode Header Button — location pin, opens overlay | ✅ | ⬜ |
| CHKT-03 | Delivery Gate — checkout blocked until postcode valid | ✅ | ⬜ |
| CHKT-04 | Guest Checkout — Medusa supports customer: null | ✅ | ⬜ |
| CHKT-05 | Static Postcode List — London area codes | ✅ | ⬜ |

## DATA: Data Management

| ID | Feature | Implemented | Verified |
|---|---|---|---|
| DATA-01 | Natco-Only Products | ✅ | ✅ |
| DATA-02 | Category Assignment — CSV type mapping | ✅ | ✅ |
| DATA-03 | Collection Assignment — 12 collections | ✅ | ✅ |
| DATA-04 | Weight Variant Merging — 45 groups consolidated | ✅ | ✅ |
| DATA-05 | Auto-Generated Descriptions | ✅ | ✅ |
| DATA-06 | Inventory as Available — manage_inventory: false | ✅ | ✅ |

## SEED: Backend

| ID | Feature | Implemented | Verified |
|---|---|---|---|
| SEED-01 | Infrastructure-Only Seed | ✅ | ✅ |
| SEED-02 | Category Metadata — nav_visible: true | ✅ | ✅ |
| SEED-03 | Pipeline Documentation | ✅ | ✅ |

---

## Verification Status

| Status | Count | Meaning |
|---|---|---|
| ✅ Verified | 9 | User confirmed working |
| 🔷 Pending Verification | 43 | Implemented, needs user validation |
| ⬜ Pending | 3 | Not yet implemented |

---

## Pending Verification Checklist

### Navigation (8 features)
- [ ] NAV-01: Browse all 13 parent categories dynamically
- [ ] NAV-02: Hover category → mega menu drops, only one at a time
- [ ] NAV-03: Header sticks on scroll, Browse dropdown works
- [ ] NAV-04: Type search term → Enter → navigates to search page
- [ ] NAV-05: Mega menu bar below header scrolls away
- [ ] NAV-06: Mobile hamburger opens side menu with categories
- [ ] NAV-07: Footer shows 6 dynamic categories, links work
- [ ] NAV-08: Browse dropdown shows All Products + all categories with children

### Homepage (3 features)
- [ ] HOME-01: 12 category cards, emojis, colors, links work
- [ ] HOME-02: Hero "Shop Now" buttons navigate correctly
- [ ] HOME-03: Featured products render (or empty if no products)

### Product Display (13 features)
- [ ] PROD-01: "Load More Products" button, 12 → 24 → 36...
- [ ] PROD-02: No sort/filter sidebar on category pages
- [ ] PROD-03: Breadcrumbs show All Products / Parent / Category
- [ ] PROD-04: 4 columns desktop, 2 tablet, 1 mobile
- [ ] PROD-05: Image top, title, variant text, price, Add button
- [ ] PROD-06: Mobile card has image left, text right
- [ ] PROD-07: Images show full, no cropping
- [ ] PROD-08: "More details" expands description
- [ ] PROD-09: Variant columns with weight + price
- [ ] PROD-10: "Options" button on variant cards
- [ ] PROD-11: "Add" button adds product to cart
- [ ] PROD-12: All cards same height in a row
- [ ] PROD-13: Variant badge shows count after overlay add

### Cart (6 features)
- [ ] CART-01: Cart sidebar visible on xl+ screens
- [ ] CART-02: Shows items with images, titles, qty, price
- [ ] CART-03: Remove button deletes item from cart
- [ ] CART-04: Total displays, "View Basket" link works
- [ ] CART-05: Cart refreshes after Add/Remove
- [ ] CART-06: Cart icon in header shows item count

### Overlay (8 features)
- [ ] OVRL-01: Click "Options" → overlay opens
- [ ] OVRL-02: Image left 40%, variant selectors right
- [ ] OVRL-03: +/- buttons work, green glow on active
- [ ] OVRL-04: "Add to Cart" adds all selected variants
- [ ] OVRL-05: X close button always visible
- [ ] OVRL-06: ESC key closes overlay
- [ ] OVRL-07: Click backdrop closes overlay
- [ ] OVRL-08: Page doesn't scroll behind overlay

### Checkout (5 features)
- [ ] CHKT-01: Postcode overlay opens from header icon
- [ ] CHKT-02: Header location pin icon visible
- [ ] CHKT-03: Checkout page shows postcode gate
- [ ] CHKT-04: Guest can proceed through checkout
- [ ] CHKT-05: Valid London postcodes accepted

---

## Pending Features (Not Implemented)

| ID | Feature | Status |
|---|---|---|
| FUT-01 | Postcode check overlay (Partially done) | ✅ Partial |
| FUT-02 | Payment processor — Stripe integration, capture payments | ⬜ |
| FUT-03 | Favourites / Reorder — last 6 orders, add all to cart | ⬜ |
| FUT-04 | Order Cancellation — customer-initiated cancel before dispatch | ⬜ |
| FUT-05 | Returns Workflow — return request, label generation, tracking | ⬜ |
| FUT-06 | Refunds Workflow — automated/partial refunds via payment processor | ⬜ |

### FUT-04: Order Cancellation
- Customer can cancel an order from the order details page
- Only cancellable if order status is "pending" or "processing" (not yet shipped)
- Cancel button with confirmation dialog
- Backend updates order status, releases inventory, triggers refund if paid
- Cancellation confirmation email

### FUT-05: Returns Workflow
- Customer initiates return from order details page
- Select items and return reason (damaged, wrong item, changed mind, etc.)
- Generate return label / RMA number
- Return window: 14 days from delivery
- Track return status (requested → in transit → received → processed)
- Return eligibility checks (perishable items excluded)

### FUT-06: Refunds Workflow
- Triggered automatically upon return receipt or manually by admin
- Support partial refunds (per-item refunds)
- Refund to original payment method via payment processor
- Refund confirmation email with amount breakdown
- Refund timeline displayed to customer (3-5 business days)
- Store credit option as alternative to monetary refund
