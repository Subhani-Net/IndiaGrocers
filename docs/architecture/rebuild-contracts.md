# AGENTS.md � IndiaGrocers (Extracted Feature Content)

> This content was extracted from AGENTS.md on 2026-06-19 per the Clean Codespace Policy.
> All feature planning, epics, and business requirements now live in /docs/epics/.

---

## System Rebuild — Application State & Test Coverage

> **If this application is rebuilt from scratch on a new Medusa instance, the
> following guarantees hold. Every file below documents or validates a specific
> system behavior.**

### Data Flow Contracts (source of truth for rebuild)

| Contract | File(s) | What It Guarantees |
|----------|---------|--------------------|
| Product listing pages never show false "Out of Stock" | `e2e/products/inventory-visibility.spec.ts`, `e2e/features/catalog/inventory-display.feature` | Inventory read from `getBulkInventory()`, never from `variant.inventory_quantity` |
| Cart page never shows false OOS banner/badges | Same as above — cart tests included | Cart items read from `inventoryMap[item.variant_id]`, never from `item.variant.inventory_quantity` |
| PDP stock status reads from inventory data layer | `e2e/products/inventory-visibility.spec.ts` | PDP uses `inventoryMap` prop, variant chips enabled when in stock |
| Checkout: shipping method registered BEFORE payment | `e2e/checkout/checkout-flow.spec.ts`, `e2e/features/checkout/checkout.feature` (shipping method section) | `setShippingMethod()` called at Step 2, step guard validates at Step 3 |
| Checkout: cart.complete() never fails with "No shipping method" | `e2e/features/checkout/checkout.feature`, `e2e/features/checkout/payment-flow.feature` | Shipping method set on cart before `cart.complete()` is called |
| Delivery cost displayed = actual cart shipping method cost | `e2e/features/checkout/checkout.feature` (delivery cost scenario) | Cost reads `cart.shipping_methods[0].amount`, never hardcoded |
| Bulk-inventory endpoint returns live stock data | `scripts/verify-bulk-inventory.mjs` (9 tests) | `POST /store/bulk-inventory` → `getVariantAvailability()` → correct availability |
| Full inventory pipeline correct | `tests/verify-inventory-pipeline.mjs` (5 sections) | Product fetch → variant IDs → bulk-inventory → enriched stock display |
| Cart cache invalidation on shipping method set | `e2e/features/checkout/checkout.feature` (cache scenario) | `revalidateTag("carts")` called in `setShippingMethod()` |
| No `cache: "force-cache"` on dynamic data (cart, inventory) | `lib/data/cart.ts`, `lib/data/inventory.ts` | Cart = tag-based ISR, inventory = 10s ISR |
| JSON-LD structured data on PDP matches inventory | `e2e/products/inventory-visibility.spec.ts` | `availability` field correct in `<script type="application/ld+json">` |
| Order confirmation: retry polling with 4 exponential attempts | `order/confirmed/page.tsx`, `components/order-confirmation-client.tsx` | Polls at 0s, 1s, 2.5s, 4s intervals; terminates on first 200; shows failover after exhaustion |
| Order confirmation: optimistic loading state | `order-confirmation-client.tsx:60-100` | Shows "Finishing your order... Please do not close or refresh" with `animate-pulse` skeleton receipts during polling |
| Order confirmation: memory leak protection | `order-confirmation-client.tsx:26-27,80-85` | `cancelledRef` flag checked before every `setState`; `clearTimeout` on unmount with undefined guard |
| Order confirmation: failover renders static receipt | `order-confirmation-client.tsx:135-188` | Green checkmark + order ID + "Refresh Page" + "View Order History" when all 4 retries fail |
| Order confirmation: Repeat Order adds all items to cart | `order-completed-template.tsx:35-70` | Reads `order?.items`, calls `addToCart` per item, dispatches `cart-updated` event; states: idle → adding → ✓ Added to Cart |
| Order confirmation: Order Status Tracker | `order-completed-template.tsx:75-117` | 3-stage timeline: "Order Received" (✓ green), "Processing" (animated spinner), "Out for Delivery" (pending) |
| Order confirmation: error boundary | `order/[id]/confirmed/error.tsx` | Catches template crashes, shows "Order Confirmed" + "Try Again" + "Continue Shopping" |

### Architecture Invariants (must hold after any rebuild)

| Invariant | File | Verify With |
|-----------|------|-------------|
| `variant.inventory_quantity` is NEVER read by any UI component | Entire `src/` — zero direct reads except comment in `inventory.ts` and dead storage in `weight-heavy-card.tsx:59` | `grep "\.inventory_quantity" apps/storefront/src/` → 0 results (UI layer only) |
| Inventory is a separate data layer from product identity | `lib/data/inventory.ts` → `getBulkInventory()` | Single function, single endpoint |
| Products: ISR 60s, Inventory: ISR 10s, Cart: no force-cache | `lib/data/products.ts`, `lib/data/inventory.ts`, `lib/data/cart.ts` | grep for `cache: "force-cache"` → 0 results in data layer |
| `setShippingMethod()` is called before `pushStep("payment")` | `checkout-form/index.tsx:handleDeliveryContinue` | `e2e/checkout/checkout-flow.spec.ts` |
| Step guard blocks navigation to `?step=payment` without shipping | `checkout-form/index.tsx:useEffect` guard | `e2e/checkout/checkout-flow.spec.ts` |
| `handlePlaceOrder` validates shipping before `initiatePaymentSession` | `checkout-form/index.tsx:handlePlaceOrder` | Step guard + manual validation in handler |

### Test Files Index

| Layer | File | Type | Tests |
|-------|------|------|-------|
| Backend endpoint | `scripts/verify-bulk-inventory.mjs` | Node.js | 9 (endpoint contract, availability validation) |
| Pipeline verification | `tests/verify-inventory-pipeline.mjs` | Node.js | 5 sections (backend → storefront) |
| E2E — inventory visibility | `e2e/products/inventory-visibility.spec.ts` | Playwright | 7 (PDP, cart, listing badges) |
| E2E — checkout flow | `e2e/checkout/checkout-flow.spec.ts` | Playwright | 11 (steps, guards, validation) |
| E2E — payment flow | `e2e/checkout/payment-flow.spec.ts` | Playwright | 4 (cart, address, payment, confirmation) |
| BDD — catalog inventory | `e2e/features/catalog/inventory-display.feature` | playwright-bdd | 7 scenarios |
| BDD — checkout | `e2e/features/checkout/checkout.feature` | playwright-bdd | 18 scenarios (8 original + 10 new) |
| BDD — payment flow | `e2e/features/checkout/payment-flow.feature` | playwright-bdd | 14 scenarios (10 original + 4 new) |
| E2E — order confirmation polling | `e2e/checkout/order-confirmation-polling.spec.ts` | Playwright | 13 (5 describe blocks) |
| BDD — order confirmation | `e2e/features/checkout/order-confirmation.feature` | playwright-bdd | 10 scenarios |
| BDD — order confirmation steps | `e2e/features/checkout/order-confirmation.steps.ts` | playwright-bdd | ~30 step definitions |

### Run All Validation

```bash
# Backend
node scripts/verify-bulk-inventory.mjs         # 9 tests
node tests/verify-inventory-pipeline.mjs        # Pipeline verification

# Storefront E2E
npx playwright test e2e/products/inventory-visibility.spec.ts
npx playwright test e2e/checkout/checkout-flow.spec.ts
npx playwright test e2e/checkout/payment-flow.spec.ts
npx playwright test e2e/checkout/order-confirmation-polling.spec.ts
```

### Navigation System — Rebuild Contracts

> **Documentation:** `Documentation/navigation-system.md`, `Implementation/navigation-contracts.md`

| Contract | File(s) | What It Guarantees |
|----------|---------|--------------------|
| Navigation: 3-level category tree with injected "All [Category]" | `nav/index.tsx:19-58` | `fetchNavCategories()` returns `NavCategory[]` with virtual L2 child at index 0 per L1; grandchildren mapped correctly |
| Navigation: Desktop panel shows ALL L1 categories simultaneously | `all-groceries-panel/index.tsx:100-131` | `categories.map()` renders every L1 block in a masonry grid; no per-category hover filtering |
| Navigation: Mobile cart is a plain link, not a Popover | `nav/index.tsx:134-141` | Mobile cart is `<LocalizedClientLink href="/cart">` with `data-testid="nav-mobile-cart-link"`; no `<Suspense>` or `<CartButton>` in mobile layout |
| Navigation: Desktop cart is a Popover dropdown | `nav/index.tsx:163-174` | Desktop cart is `<Suspense><CartButton/></Suspense>`; Popover panel shows only on `small:` screens |
| Navigation: Header uses `position: sticky; top: 0` | `nav/index.tsx:115` | `<header className="sticky top-0 z-50">` — verified by Playwright computed style assertion |
| Navigation: Mobile logo centered via absolute positioning | `nav/index.tsx:127-131` | `absolute left-1/2 -translate-x-1/2` with `pointer-events-none` wrapper; link has `pointer-events-auto` |
| Navigation: Panel body scroll lock | `all-groceries-panel/index.tsx:44-53`, `mobile-menu/index.tsx:97-107` | `document.body.style.overflow = "hidden"` on open, restored on close |
| Navigation: ESC dismisses desktop panel | `all-groceries-panel/index.tsx:35-42` | Global `keydown` listener with `e.key === "Escape"` |

### Navigation Test Files

| Layer | File | Type | Tests |
|-------|------|------|-------|
| E2E — Navigation | `e2e/layout/navigation.spec.ts` | Playwright | 19 (5 describe blocks) |
| BDD — Navigation | `e2e/features/layout/navigation.feature` | playwright-bdd | 20 scenarios |
| BDD — Navigation steps | `e2e/features/layout/navigation.steps.ts` | playwright-bdd | ~30 step definitions |

### Run Navigation Validation

```bash
npx playwright test --project=e2e e2e/layout/navigation.spec.ts
npx playwright test --project=bdd e2e/features/layout/
```

### Search System — Rebuild Contracts

> **Architecture:** SearchContext (live grid) + SSR page (direct URL). Universal `WeightHeavyProductCard` on all grids. `PdpLayover` modal for variant selection. `NavSearch` autocomplete with keyboard nav.

| Contract | File(s) | What It Guarantees |
|----------|---------|--------------------|
| Search: global context manages live grid state | `lib/context/search-context.tsx:41-170` | `SearchProvider` wraps layout; `useSearch()` returns `isSearchActive`, `searchQuery`, `searchResults`, `isLoading`, `totalCount`. 300ms debounced `searchProducts` → `fetchProductsByIds` with AbortController per invocation |
| Search: layout conditionally renders grid | `(main)/layout.tsx:37-58`, `components/search-layout-client.tsx` | `<SearchLayoutClient>` reads `isSearchActive` → renders `<SearchResultsGrid>` or passes through `{children}` |
| Search: header NavSearch connected to context | `nav-search/index.tsx:16-23` | `useSearch()` reads/writes query; autocomplete dropdown with 200ms debounce + AbortSignal; ArrowUp/Down/Enter/Escape keyboard nav; product click → `router.push("/search?q=...")` |
| Search: navigating away clears search | `search-context.tsx:129-137` | `useEffect([pathname])` fires on route change; if `isSearchActive && !pathname.includes("/search")` → `clearSearch()` |
| Search: SSR page for direct URL | `search/page.tsx:39-55` | Server component reads `searchParams` (q, dietary, brand, sort, page, maxPrice), builds MeiliSearch filter, calls `searchProducts` + `fetchProductsByIds` directly, passes as `initialResults` |
| Search: client template syncs SSR props | `search/templates/index.tsx:128-144` | `useEffect` watches `initialResults` → syncs to `products` state; `initialPage > 1` check for Load More append |
| Card: universal `WeightHeavyProductCard` | `weight-heavy-card.tsx` | Weight chips, best-value badges, unit pricing (£/kg, p/100g), variant selection, +/- qty controls. `onProductClick` prop → `<div role="button">` instead of `<LocalizedClientLink>` when layover active |
| Card: click opens `PdpLayover` modal | `weight-heavy-card.tsx:161-184,280-314` | `onProductClick={() => openLayover(product)}` passed from all templates via `useLayover()` |
| PdpLayover: multi-line variant sheet | `pdp-layover/index.tsx` | Mobile slide-up bottom sheet, desktop centered modal. Lists all variants with price, computed unit price, +/- steppers. Bulk "Add to Basket" calls `addToCart` per variant with qty > 0 |
| Layover: global context | `lib/context/layover-context.tsx` | `LayoverProvider` + `useLayover()` returns `openProduct`, `openLayover(product)`, `closeLayover()`. Body scroll locked while open |
| Mobile filter: portal-rendered drawer | `mobile-filter-drawer/index.tsx:55-70` | `createPortal` to `document.body`; `animate-drawer-in` (250ms) open / `animate-drawer-out` (200ms) close |
| Mobile filter: accordion sections via Radix | `filter-panel/index.tsx:320-325` | `FilterAccordion` with `type="multiple"`, `defaultValue=[]` — collapsed on mobile |
| Mobile filter: body scroll lock on open | `mobile-filter-drawer/index.tsx:39-46` | `document.body.style.overflow = "hidden"` on mount, restored on unmount |
| Mobile filter: ESC key dismiss | `mobile-filter-drawer/index.tsx:49-54` | Global `keydown` listener with `e.key === "Escape"` |
| Mobile filter: desktop sidebar unchanged | `standard-grid.tsx:134-140` | `<aside className="hidden sm:block w-56">` — `FilterPanel` without `compact` prop |

### Search & Card Test Files

| Layer | File | Type | Tests |
|-------|------|------|-------|
| E2E — Loading states | `e2e/search/loading-states.spec.ts` | Playwright | 10 (spinner lifecycle, race condition) |
| E2E — Behavior contracts | `e2e/search/behavior-contracts.spec.ts` | Playwright | 12 (autocomplete speed, results persistence, SSR pre-fetch) |
| E2E — Top results | `e2e/search/top-results.spec.ts` | Playwright | 16 (hardcoded top-N for 15 terms) |
| E2E — Vernacular | `e2e/search/vernacular.spec.ts` | Playwright | 4 (Hindi→English mapping) |
| BDD — Search | `e2e/features/catalog/search.feature` | playwright-bdd | 22 scenarios |
| BDD — Search steps | `e2e/features/catalog/search.steps.ts` | playwright-bdd | 22 step definitions |
| BDD — Navigation | `e2e/features/layout/navigation.feature` | playwright-bdd | 22 scenarios (incl. header search) |
| BDD — Navigation steps | `e2e/features/layout/navigation.steps.ts` | playwright-bdd | ~35 step definitions |

### Mobile Filter Test Files

| Layer | File | Type | Tests |
|-------|------|------|-------|
| E2E — Mobile Filter | `e2e/filters/mobile-filter-drawer.spec.ts` | Playwright | 11 (5 describe blocks) |
| BDD — Filters | `e2e/features/catalog/filters.feature` | playwright-bdd | 10 scenarios |
| BDD — Filter steps | `e2e/features/catalog/filters.steps.ts` | playwright-bdd | ~20 step definitions |

### 3-Pane Layout — Rebuild Contracts

> **Architecture:** `ThreePaneLayout` (client component) manages filter/basket toggle state. Sticky panes on lg+. Horizontal quick-filter row above grid.

| Contract | File(s) | What It Guarantees |
|----------|---------|--------------------|
| 3-Pane: default state = grid + basket visible, filter hidden | `three-pane-layout/index.tsx:143-173` | `filterOpen` starts `false`; left pane hidden, right pane shown, quick-filter row visible |
| 3-Pane: All Filters button toggles filter pane | `three-pane-layout/index.tsx:123-135` | `toggleFilter()` sets `filterOpen = !filterOpen`; left pane slides in, right basket hides |
| 3-Pane: cart-updated event auto-closes filter | `three-pane-layout/index.tsx:61-66` | `window.addEventListener("cart-updated", () => setFilterOpen(false))` |
| 3-Pane: children never remount on toggle | `three-pane-layout/index.tsx:146` | `{children}` in center pane — React preserves subtree across sibling toggles |
| 3-Pane: sticky left and right panes | `three-pane-layout/index.tsx:139,152` | `sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto` on both panes |
| 3-Pane: horizontal quick-filter row | `three-pane-layout/index.tsx:73-102` | Dietary chips (Vegan, Vegetarian, GF, Organic) + All Filters button + sort dropdown |
| 3-Pane: search page has basket only | `three-pane-layout/index.tsx` | `showFilterPane={false}` → no filter button, no left pane; only basket on right |
| Filter/Sort: decoupled architecture | `filter-panel/index.tsx:8-13` | `FilterPanel` has zero sort code — no `SortProducts`, no `sortBy` prop, no sort accordion section. Sort lives ONLY in `InlineSort` in the utility bar |
| Filter/Sort: independent URL params | `filter-panel/index.tsx:55-100` | Sort writes `sortBy` param. Filters write `brand`, `weight`, `dietary`, `minPrice`, `maxPrice`, `inStock`. No overlap, no conflict |
| Utility bar: desktop + mobile consistent layout | `three-pane-layout/index.tsx:59-97`, `standard-grid.tsx:104-131` | Both viewports: [Filter] [Sort ▾] ─── [product count]. `justify-between`, `items-center` |
| Utility bar: border separator | `three-pane-layout/index.tsx:60`, `standard-grid.tsx:105` | `border-b border-stone-100 pb-4` on both desktop and mobile utility rows |
| Mobile menu: category-first navigation | `mobile-menu/index.tsx:150-220` | No static links (Home, Store, Account, Cart). "Shop by Category" header. Category rows at 44px with `border-b` separators. Utility links in muted footer |

### 3-Pane Layout Test Files

| Layer | File | Type | Tests |
|-------|------|------|-------|
| E2E — 3-Pane Layout | `e2e/layout/three-pane-layout.spec.ts` | Playwright | 14 (5 describe blocks) |
| BDD — 3-Pane Layout | `e2e/features/catalog/three-pane-layout.feature` | playwright-bdd | 10 scenarios |
| BDD — 3-Pane steps | `e2e/features/catalog/three-pane-layout.steps.ts` | playwright-bdd | ~25 step definitions |

### Run All Validation

```bash
npx playwright test --project=e2e e2e/search/
npx playwright test --project=e2e e2e/filters/
npx playwright test --project=e2e e2e/layout/three-pane-layout.spec.ts
npx playwright test --project=bdd e2e/features/catalog/search.feature
npx playwright test --project=bdd e2e/features/layout/navigation.feature
npx playwright test --project=bdd e2e/features/catalog/filters.feature
npx playwright test --project=bdd e2e/features/catalog/three-pane-layout.feature

