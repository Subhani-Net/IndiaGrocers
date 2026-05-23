# IndiaGrocers London — Storefront Build Plan

> **Goal:** Indian online grocery store for London with orange/white theme.
> **Stack:** Next.js 15 (App Router) + Tailwind CSS + MedusaJS v2 backend at localhost:9000

## Status Legend
- ✅ Done
- 🔷 In Progress
- ⬜ Not Started

---

## Phase 1: Foundation ✅

| ID | User Story | Status |
|---|---|---|
| SF-1.1 | **Orange Theme** — Warm orange (#FF6B35) / white / red accent theme with CSS variables | ✅ |
| SF-1.2 | **Responsive Layout** — Mobile-first grid, works on 320px to 1920px | ✅ |
| SF-1.3 | **PWA Support** — Manifest, service worker (next-pwa), install prompt, apple-touch-icon, offline-ready | ✅ |
| SF-1.4 | **Desktop Mega Menu** — Sticky header with announcement bar, logo, search, account/cart icons, category mega menus on hover | ✅ |
| SF-1.5 | **Mobile Hamburger Menu** — Slide-out side menu with full category tree (matching mega menu data) | ✅ |
| SF-1.6 | **Footer** — 4-column: company info (address, phone, WhatsApp), quick links (categories), customer service, social icons, payment badges | ✅ |
| SF-1.7 | **Hero Carousel** — Auto-rotating gradient slides with emojis, headings, and "Shop Now" CTAs | ✅ |
| SF-1.8 | **Category Grid** — Data-driven 16-category card grid on homepage, fetched from Medusa backend with emoji icons and rotating color palette | ✅ |
| SF-1.9 | **Featured Products** — Collection-driven product rails on homepage (from Medusa backend) | ✅ |
| SF-1.10 | **Testimonials** — Customer review carousel with star ratings, navigation arrows, dots | ✅ |
| SF-1.11 | **WhatsApp Float** — Fixed bottom-right chat bubble, opens popup with "Start Chat" link, toggleable | ✅ |
| SF-1.12 | **Promo Banner Strip** — 4-box feature strip (Free Delivery, Express, Farm Fresh, Best Price) | ✅ |

---

## Phase 2: Page Styling — Category, Product, Search, Brands

| ID | User Story | Status |
|---|---|---|
| SF-2.1 | **Category Listing Page** — Header with category image/icon, breadcrumbs (Home > Groceries > Rice), subcategory chips, orange-themed sort bar, product grid | ⬜ |
| SF-2.2 | **Product Card (Grid)** — Photo, brand tag (orange), product title, "From £X.XX" pricing, weight/variant options inline, stock badge (In Stock / Low Stock), "Add" / "Choose Options" button | ⬜ |
| SF-2.3 | **Product Detail Page** — Image gallery, brand badge, "£X.XX per kg" unit price, weight/size variant selector (pill buttons), quantity +/- stepper, orange "Add to Cart" button, product info tabs (Description, Shipping, Returns), related products grid | ⬜ |
| SF-2.4 | **Search Page** — Prominent search bar at top, autocomplete dropdown with category-filtered "Did you mean?" suggestions, product results grid (same cards as SF-2.2), "No results found" with popular categories fallback | ⬜ |
| SF-2.5 | **Brands A-Z Page** — Alphabet jump-bar at top (A B C ... Z), letter-grouped brand cards in columns, each card has brand logo/name and product count, clicking navigates to brand's product listing | ⬜ |
| SF-2.6 | **Cart Page** — Orange theme: item rows (thumbnail, name, variant, quantity stepper, remove), promo code input, sticky order summary sidebar (subtotal, shipping, discount, total), "Proceed to Checkout" orange button, "Continue Shopping" link | ⬜ |
| SF-2.7 | **Checkout Flow** — 4-step progress indicator (Address > Shipping > Payment > Review), each step themed orange on active, address form with postcode lookup, shipping method radio, payment method selection, final review with place-order button | ⬜ |
| SF-2.8 | **Order Confirmation** — Large green checkmark, "Thank you! Order #XXXXX" heading, order details table, delivery ETA, "Continue Shopping →" orange button | ⬜ |
| SF-2.9 | **Account Pages** — Login/Register forms styled orange, my account sidebar nav, order history list with status badges, address book cards, edit profile forms | ⬜ |
| SF-2.10 | **Delivery Info Page** — Delivery charges table, postcode coverage map/checker, cutoff times, FAQ accordion | ⬜ |

---

## Phase 3: Core Shopping Functionality

| ID | User Story | Status |
|---|---|---|
| SF-3.1 | **Product Filters** — Sidebar/dropdown: filter by brand (multi-select), price range (min/max), category, stock status (in stock only) | ⬜ |
| SF-3.2 | **Sort Options** — Dropdown: Price Low → High, Price High → Low, Newest, Most Popular, A-Z | ⬜ |
| SF-3.3 | **Pagination** — Page numbers at bottom, "Showing 1-24 of 156 products", items-per-page selector (24/48/96) | ⬜ |
| SF-3.4 | **Search Autocomplete** — Debounced search as you type, shows product suggestions with thumbnail + price, category suggestions, "View all results for 'X'" link | ⬜ |
| SF-3.5 | **Brand Listing** — Clicking a brand shows all its products in the product grid, with brand banner at top | ⬜ |
| SF-3.6 | **Collection Pages** — Curated collections (Pooja Essentials, Fresh Vegetables) with collection banner and product grid | ⬜ |
| SF-3.7 | **Sale / Offer Pages** — "Under £1" grid, "Buy 1 Get 1" tagged products | ⬜ |

---

## Phase 4: Cart, Checkout & Order Enhancements

| ID | User Story | Status |
|---|---|---|
| SF-4.1 | **Cart Dropdown** — Hover/click cart icon shows mini-cart with 3 latest items, subtotal, "View Cart" + "Checkout" buttons | ⬜ |
| SF-4.2 | **Free Delivery Nudge** — Progress bar "Add £X.XX more for FREE delivery" when cart < £40, green "You qualify for FREE delivery!" when above | ⬜ |
| SF-4.3 | **Promo Code** — Input on cart page, applies discount, shows saved amount, removable | ⬜ |
| SF-4.4 | **Order Cut-off Timer** — "Order in HH:MM:SS for next day delivery" countdown at top of relevant pages (from backend config) | ⬜ |
| SF-4.5 | **Guest Checkout** — Allow checkout without creating account, with option to register at order confirmation | ⬜ |

---

## Phase 5: Enhanced Experience

| ID | User Story | Status |
|---|---|---|
| SF-5.1 | **Stock Badges** — Products show "In Stock ✓" (green), "Only X left" (amber), "Out of Stock" (red with notify-me button) | ⬜ |
| SF-5.2 | **Bulk / Wholesale** — Quantity discounts (e.g., Buy 4+ = £X.XX each), per-unit price shown on product detail | ⬜ |
| SF-5.3 | **Related Products** — "Customers also bought" / "You might also like" carousel on product detail page | ⬜ |
| SF-5.4 | **Wishlist** — Heart icon on product cards, wishlist page under account, persist across sessions | ⬜ |
| SF-5.5 | **Multi-Store Concept** — Toggle between Main Store, Keralam Store, Ceylon Store (via sales channels), each filters products by channel | ⬜ |
| SF-5.6 | **Fresh / Frozen Badges** — Visual badges on products: "🥬 Fresh", "❄️ Frozen", "🔥 Hot Sale", "🆕 New" | ⬜ |

---

## Phase 6: Performance & Polish

| ID | User Story | Status |
|---|---|---|
| SF-6.1 | **Image Optimisation** — Next.js <Image> with lazy loading, WebP format, blur placeholder, responsive sizes | ⬜ |
| SF-6.2 | **Loading Skeletons** — Skeleton placeholders for product grids, product detail, cart (using existing skeleton components) | ⬜ |
| SF-6.3 | **SEO Metadata** — Dynamic `<title>` and `<meta description>` per page, Open Graph images, structured data (Product schema) | ⬜ |
| SF-6.4 | **Offline Page** — Custom offline page with "You're offline" message, cached categories, last-viewed products | ⬜ |
| SF-6.5 | **Analytics** — Google Analytics / Vercel Analytics page-view and conversion tracking | ⬜ |
| SF-6.6 | **Error Pages** — Styled 404 page with link to homepage, category suggestions; 500 error page with retry button | ⬜ |

---

## Progress Summary

| Phase | Total | Done | Progress |
|---|---|---|---|
| 1 — Foundation | 12 | 12 | ██████████ 100% |
| 2 — Page Styling | 10 | 0 | ⬜ 0% |
| 3 — Core Shopping | 7 | 0 | ⬜ 0% |
| 4 — Cart & Checkout | 5 | 0 | ⬜ 0% |
| 5 — Enhanced Experience | 6 | 0 | ⬜ 0% |
| 6 — Performance & Polish | 6 | 0 | ⬜ 0% |
| **Total** | **46** | **12** | **26%** |
