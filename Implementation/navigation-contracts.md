# Navigation System — Data Flow & Behavior Contracts

> **Purpose:** Guarantees that must hold across any rebuild or refactor of the navigation system.
> **Pattern:** Modeled after AGENTS.md § System Rebuild — Application State & Test Coverage
> **Last updated:** June 2026

## Architecture Invariants

| # | Invariant | Why It Matters |
|---|-----------|----------------|
| N1 | The navigation data tree uses exactly THREE levels: L1 (parent) → L2 (child) → L3 (grandchild). L3 is currently empty in CSV data; the system handles this gracefully. | Changing the depth changes the entire component tree. |
| N2 | Every L1 category has an injected virtual `NavChild` at index 0 with `isVirtual: true`, `name: "All ${L1.name}"`, `handle: L1.handle`. This is done in `fetchNavCategories()`, NOT in any UI component. | Ensures "All [Category]" appears consistently in desktop panel, mobile drawer, and any future nav widget. |
| N3 | "All [Category]" links navigate to the PARENT category page (`/categories/{parent.handle}`), NOT any child page. | Prevents broken links when category hierarchy changes. |
| N4 | Mobile cart is a plain `<a href="/cart">` link, NOT a Popover. Desktop cart is a `<Popover>` (CartDropdown). NEVER both in the same viewport instance. | Prevents the invisible-Popover-on-mobile bug (D-cart regression). |
| N5 | The header uses `position: sticky; top: 0; z-index: 50`. The `sticky` class is applied to the `<header>` element, not a wrapper div. | Changing positioning breaks scroll behavior contract. |
| N6 | The mobile logo is centered via `absolute left-1/2 -translate-x-1/2` with `pointer-events-none` on the wrapper and `pointer-events-auto` on the link. | Changing centering method must re-validate no overlap with account/cart buttons. |
| N7 | AllGroceriesPanel panel + backdrop render via `createPortal` to `document.body`. Panel top is calculated from `triggerRef.getBoundingClientRect().bottom`. | Portal location and positioning math must not change without re-validating all dismiss behaviors. |
| N8 | Body scroll is locked (`overflow: hidden`) when AllGroceriesPanel or MobileMenu is open. Restored on close. | Prevents background scrolling behind open panels. |

## Data Flow Contracts

| Contract | Verified By | Guarantee |
|----------|------------|-----------|
| C1 — Category API fields include grandchildren | `lib/data/categories.ts:19` | `*category_children.category_children` is present in API fields string |
| C2 — fetchNavCategories returns correct tree | `nav/index.tsx:19-58` | Parents filtered to those with children; children mapped to parents; grandchildren mapped to children |
| C3 — "All [Category]" is first in children array | `nav/index.tsx:35-42` | `isVirtual: true` child is prepended before real children |
| C4 — Desktop panel shows all L1 categories | `all-groceries-panel/index.tsx:100-131` | `categories.map()` renders every category without filtering |
| C5 — Mobile L2 view shows "All" banner + divider + real L2 | `mobile-menu/index.tsx:297-338` | `child.isVirtual` check renders banner; remaining children render normally |
| C6 — Mobile cart has no Popover dependency | `nav/index.tsx:134-141` | Mobile cart is `<LocalizedClientLink>`, not `<Suspense><CartButton/>` |
| C7 — Desktop cart has Suspense-wrapped Popover | `nav/index.tsx:163-174` | `<Suspense fallback={...}><CartButton/></Suspense>` only in desktop layout |
| C8 — Cart badge uses live data (mobile) | `nav/index.tsx:77-85` | `retrieveCart()` called server-side; `totalItems` derived from `cart.items.reduce()` |

## Component Contracts

| Component | Props | Key Behaviors |
|-----------|-------|---------------|
| `AllGroceriesPanel` | `{ categories: NavCategory[] }` | Click-toggle, ESC dismiss, backdrop dismiss, portal render, body scroll lock |
| `MobileMenu` | `{ regions, locales, currentLocale, categories }` | Depth-based push/pop, 48px touch targets, language/country selectors in footer |
| `Nav` (server) | `{ customer? }` | Fetches regions, locales, categories, cart; builds tree; renders header |
| `NavSearch` | (none) | Gets countryCode from useParams(); full-width input; submits to search page |
| `CartButton` (server) | (none) | Fetches cart via retrieveCart(); renders CartDropdown (desktop only) |

## Test Files

| Layer | File | Tests |
|-------|------|-------|
| BDD — Navigation | `e2e/features/layout/navigation.feature` | 20 scenarios |
| BDD — Steps | `e2e/features/layout/navigation.steps.ts` | ~30 step definitions |
| E2E — Navigation | `e2e/layout/navigation.spec.ts` | 19 tests (5 describe blocks) |

## Run All Navigation Validation

```bash
# TypeScript check
yarn tsc --noEmit

# E2E tests (requires dev server running on :8000)
npx playwright test --project=e2e e2e/layout/navigation.spec.ts
npx playwright test --project=bdd e2e/features/layout/navigation.feature

# Build check
yarn build
```
