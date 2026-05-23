# Known Issues & Bugs

> Recorded: May 2026
> Fix priority: 🔴 High | 🟡 Medium | 🟢 Low

---

## Product Cards

| ID | Bug | Description | Priority | Fix |
|---|---|---|---|---|
| BUG-01 | "Default" text displayed on product cards | Single-variant products show variant title "Default" as weight label on some screen sizes or contexts. The text "Default" appears next to the price or as a size/label where a real weight should be shown. Single-variant products from the Natco import all have `title: "Default"` for their single variant. This should be hidden or replaced with the actual weight extracted from the product title. | 🔴 High | `product-card.tsx` — ensure `weightText` never renders "Default". The weight should be extracted from the product title (e.g., "Black Eyed Beans 400g" → "400g") when variant title is "Default". |
| BUG-02 | Card variant badges persist after page reload | Variant quantity badges (orange circles on variant columns) use React local state and are lost on page refresh. Should read from actual cart data for persistence. | 🟢 Low | |
| BUG-03 | Mobile variant card uneven height | Mobile variant product cards with multiple variant columns can overflow the horizontal layout on very small screens. | 🟡 Medium | |
| BUG-13 | Overlay heading says "Select size" for all options | Product overlay variant selector heading is hardcoded to "Select size" (`product-overlay.tsx:97`). Products may have options that aren't sizes (e.g., "Standard", "Default", or other attributes). Should be generic like "Options" or "Product details". | 🟢 Low | Change `product-overlay.tsx` line 97 from `"Select size"` to `"Options"` or derive from actual option title. |

---

## Navigation

| ID | Bug | Description | Priority | Fix |
|---|---|---|---|---|
| BUG-04 | Browse dropdown category count mismatch | Browse dropdown shows 13 parent categories but mega menu bar may show different count depending on child filtering logic. | 🟡 Medium | |
| BUG-05 | Search form uses hardcoded country code `/gb/search` | The search form `action="/gb/search"` assumes GB region only. Should derive country code from context/params. | 🟡 Medium | |
| BUG-14 | Category strip scrolls in its own container | `nav-cat-group` container has `overflow-x-auto` (line 190). On screens narrower than the total category width, the bar scrolls horizontally within its own div instead of wrapping categories or fitting to page width. Categories should fit the page width without internal scroll. | 🟡 Medium | Remove `overflow-x-auto no-scrollbar` from the category strip container and use flex wrap or reduce padding to fit categories within content-container width. |

---

## Cart & Checkout

| ID | Bug | Description | Priority | Fix |
|---|---|---|---|---|
| BUG-06 | Cart sidebar refresh only on cart-updated event | Cart sidebar fetches on mount and on custom event. If another component adds to cart without dispatching the event, sidebar stays stale. Need fallback polling or context. | 🟡 Medium | |
| BUG-07 | Postcode check repeats on every checkout visit | DeliveryGate stores postcode in local state only — navigating away and coming back requires re-checking. Should persist to localStorage. | 🟢 Low | |

---

## Performance

| ID | Bug | Description | Priority | Fix |
|---|---|---|---|---|
| BUG-08 | Images not optimized in production | `unoptimized={true}` in Thumbnail bypasses Next.js Image optimization. Fine for local dev but needs switching off for CDN. | 🟡 Medium | |
| BUG-09 | force-cache without proper cache invalidation | Products data caches for 60s with no forced refresh mechanism when admin updates products. Need revalidation hook. | 🟢 Low | |

---

## Data

| ID | Bug | Description | Priority | Fix |
|---|---|---|---|---|
| BUG-10 | TRS product prices are placeholder | TRS products imported with default formula prices (99 + index * 50). Need real pricing data. | 🔴 High | |
| BUG-11 | TRS product images not linked | 48 TRS product images exist in `Implementation/TRS_products/images/` but are not uploaded to the backend or linked to products. | 🔴 High | `upload-trs-images.mjs` — 43 of 45 uploaded (2 missing files, 5 names identical to Natco skipped) | |
| BUG-12 | Products not filtered by category on store API | `category_id` filter works in admin API but doesn't return accurate results from store API for some queries. | 🟡 Medium | |
| BUG-15 | Variants not sorted by weight | Product variants are displayed in creation order (import/index order), not sorted from smallest to largest weight. For merged products like Chick Peas with variants [2.5kg, 1kg, 2kg, 400g], the variant columns appear in a confusing order. Should sort by numeric value ascending (e.g., 400g, 1kg, 2kg, 2.5kg). | 🟢 Low | Sort `variants` array by extracted numeric weight value before rendering in product card and overlay. |
| BUG-16 | "From" prefix shown on single-price products in search | Search results display `"From £X.XX"` even for products with a single variant/price. The `hasMultiplePrices` check now only shows "From" when variants have differing prices. | 🟢 Low | ✅ Fixed in `search/templates/index.tsx` — `SearchProductCard` revised, `getProductPrice` import removed, card layout aligned with `ProductCard` |

---

## Summary

| Priority | Count |
|---|---|
| 🔴 High | 3 |
| 🟡 Medium | 7 |
| 🟢 Low | 6 |
| **Total** | **16** |
