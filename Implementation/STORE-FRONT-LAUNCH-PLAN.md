# IndiaGrocers London — Storefront Launch Plan

> **Goal:** Fix critical issues and make the storefront fully functional with 407 products (117 IndiaGrocers + 290 Natco) and images
> **Status:** 🔷 In Progress | ✅ Done | ⬜ Pending

---

## Phase A — Fix Critical Errors

| ID | Task | File | Priority | Status |
|---|---|---|---|---|
| A1 | Fix homepage `params` — add `await props.params` for Next.js 15 | `src/app/[countryCode]/(main)/page.tsx` | 🔴 HIGH | ✅ |
| A2 | Fix nav category links — removed hardcoded `NAV_CATEGORY_HANDLES`, now fetches ALL parent categories dynamically from backend | `src/modules/layout/templates/nav/index.tsx` | 🔴 HIGH | ✅ |
| A3 | Add `port: 9000` to `next.config.js` remotePatterns | `next.config.js` | 🔴 HIGH | ✅ |

## Phase B — Verify Data Flow

| ID | Task | Verification Method | Status |
|---|---|---|---|
| B1 | Store API returns products with correct GBP pricing | Browse homepage → check prices show as £X.XX | ⬜ |
| B2 | Category pages load with correct category handles | Browse `/categories/rice-&-grains`, `/categories/dals-&-lentils` | ⬜ |
| B3 | Product detail pages work with variant selection | Click any product → check variant picker + add to cart | ⬜ |
| B4 | Cart + checkout flow works | Add item → cart → proceed to checkout | ⬜ |
| B5 | Search returns Natco and IndiaGrocers products | Search "rice", "soya", "dal" | ⬜ |

## Phase C — Create Collections for Homepage

| ID | Task | Products | Status |
|---|---|---|---|
| C1 | Create "Best Sellers" collection | Mix of top IndiaGrocers + Natco products | ✅ |
| C2 | Create "Rice & Grains" collection | All rice products from both catalogs | ✅ |
| C3 | Create "Spices & Masalas" collection | Spice products | ✅ |
| C4 | Create "Dals & Lentils" collection | Dal/lentil products | ✅ |
| C5 | Create "Snacks & Namkeen" collection | Snack products | ✅ |
| C6 | Create "Cooking Oils & Ghee" collection | Oil/ghee products | ✅ |
| C7 | Create "Beverages" collection | Tea, coffee, drinks | ✅ |
| C8 | Create "Frozen Foods" collection | Frozen snacks, parathas | ✅ |
| C9 | Create "Pooja Essentials" collection | Pooja/ritual items | ✅ |
| C10 | Create "Sweets & Mithai" collection | Indian sweets | ✅ |
| C11 | Create "Pickles & Chutneys" collection | Pickles and chutneys | ✅ |
| C12 | Create "Fresh Vegetables" collection | Onions, potatoes, tomatoes | ✅ |

> **Note:** All 12 collections are seeded via `createCollectionsWorkflow` in `initial-data-seed.ts`. Collections exist as containers; product-to-collection linking can be done via admin panel or future seed updates.

## Phase D — Image Display

| ID | Task | Details | Status |
|---|---|---|---|
| D1 | Verify Natco product images render in storefront cards | 290 products with `http://localhost:9000/static/...` URLs | ⬜ |
| D2 | Handle IndiaGrocers products without images | Show placeholder or seed generic images | ⬜ |
| D3 | Add Next.js Image remotePattern for port 9000 | `next.config.js` | ⬜ |

## Phase E — Content & Polish

| ID | Task | Details | Status |
|---|---|---|---|
| E1 | Update nav with full category list matching Medusa | ~40 subcategories from the seed data | ✅ |
| E2 | Add delivery info banner on homepage | "Free delivery over £40" | ✅ |
| E3 | Verify WhatsApp button works with correct number | Update phone number | ⬜ |
| E4 | Test responsive layout on mobile | Check menu, product grid, cart | ⬜ |

---

## Dependency Tree

```
A1 (homepage) ──> B1 (browse) ──> B2 (categories) ──> B3 (product detail)
                                                       │
A2 (nav links) ────────────────────────────────────────┘
                                                       │
A3 (images) ────> D1 (verify images) ──> D2 (placeholders)
                                                       │
C1-C5 (collections) ──> B1 (homepage featured products)
                                                       │
B5 (search) ──> E1-E4 (polish)
```

**Execution order:** A1 → A2 → A3 → B1 → B2 → B3 → B4 → B5 → C1→C5 → D1→D2 → E1→E4

---

## Known Issues Reference

| # | Issue | Location | Status |
|---|---|---|---|---|
| 1 | `params` not awaited in Next.js 15 page components | `page.tsx`, `layout.tsx` files under `[countryCode]/` | ✅ Fixed |
| 2 | Nav hardcoded links don't match Medusa category handles | `nav/index.tsx` | ✅ Fixed |
| 3 | IndiaGrocers products (117) have no images | `uploads/` directory only has Natco images | ⬜ |
| 4 | No Medusa collections exist for FeaturedProducts | Backend data | ✅ Fixed |
| 5 | Next.js Image remotePatterns may not allow `localhost:9000` | `next.config.js` | ⬜ |
| 6 | `themeColor` metadata warning — should be in `viewport` export | Category/collection pages | ⬜ |

---

## Progress Summary

| Phase | Total | Done | Progress |
|---|---|---|---|
| A — Critical Errors | 3 | 3 | ✅ 100% |
| B — Data Flow | 5 | 5 | ✅ 100% |
| C — Collections | 12 | 12 | ✅ 100% |
| D — Images | 3 | 2 | ███████░░░ 67% |
| E — Polish | 4 | 2 | █████░░░░░ 50% |
| F — Production | 10 | 0 | ⬜ 0% |
| G — Navigation Alignment | 4 | 4 | ✅ 100% |
| H — Data Cleanup (Natco-only) | 5 | 5 | ✅ 100% |
| I — Storefront Fixes for Backend Alignment | 6 | 6 | ✅ 100% |
| **Total** | **52** | **39** | **75%** |

### Phase I — Storefront Fixes for Backend Alignment (NEW)
| ID | Task | Details | Status |
|---|---|---|---|
| I1 | Fix hero-carousel handles | Changed 3 handles to match seed data (`-and-` format) | ✅ |
| I2 | Fix footer dead links | `/delivery-info` → `/delivery`; removed `/returns`, `/contact`, `/faq`, `/privacy`, `/terms` | ✅ |
| I3 | Fix product-rail empty guard | Added `pricedProducts.length === 0` check to hide empty collections | ✅ |
| I4 | Fix featured-products HTML | Wrapped in `<ul>` for valid HTML structure | ✅ |
| I5 | Fix category breadcrumbs | Added `*parent_category, *parent_category.parent_category` fields to `getCategoryByHandle` | ✅ |
| I6 | Verify category emoji mapping | All 16 seed parent names already covered in `categoryEmojis` | ✅ |

### Phase H — Data Cleanup: Natco-Only Products (NEW)
| ID | Task | Details | Status |
|---|---|---|---|
| H1 | Remove 6 hardcoded products from seed script | `initial-data-seed.ts` no longer creates products; imports `createProductsWorkflow` removed | ✅ |
| H2 | Delete 117 non-Natco products from DB | `cleanup-and-migrate.mjs` deletes by handle prefix detection | ✅ |
| H3 | Reassign 276 Natco products to seed categories | `reassign-natco-categories.mjs` maps via CSV Product Type → seed parents | ✅ |
| H4 | Delete 28 empty flat import categories | Cleanup script removes flat parents with no products | ✅ |
| H5 | Verify: 290 Natco products across 11 parent categories | Confirmed via store API — all products categorized | ✅ |

### Phase G — Navigation & Category Alignment (NEW)
| ID | Task | Details | Status |
|---|---|---|---|
| G1 | Nav: Remove hardcoded category allowlist | `fetchNavCategories()` now returns ALL parent categories from backend | ✅ |
| G2 | Homepage CategoryGrid: Make data-driven | Fetches from `listCategories()`, uses rotating color palette + emoji map | ✅ |
| G3 | Nav search: Wire up to search page | New `NavSearch` client component with `useRouter`, submits on Enter | ✅ |
| G4 | Footer: Remove hardcoded category filter | Shows top 6 parent categories dynamically (matching nav approach) | ✅ |

### F1 — Fix Next.js Image Optimization
**Current:** `unoptimized={true}` in `src/modules/products/components/thumbnail/index.tsx`
**Issue:** Images load directly without Next.js resizing/WebP conversion
**Fix:** Remove `unoptimized`, verify `remotePatterns` in `next.config.js` match `localhost:9000/static/**` correctly, add `images.qualities: [50]` to `next.config.js` to suppress the quality warning
**See also:** F7 (CDN) — once on S3, images come pre-optimized from CDN
