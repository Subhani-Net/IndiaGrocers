# Navigation System — Architecture & Rebuild Reference

> **Last updated:** June 2026
> **Status:** Active (v3 — unified single-row header + All Groceries panel + mobile drill-down)
> **Related:** [AGENTS.md](../AGENTS.md), `Implementation/navigation-contracts.md`

## Overview

The IndiaGrocers navigation system is a responsive, multi-level category navigation built for the Medusa v2 + Next.js 15 storefront. It provides:
- **Desktop:** Single-row sticky header with an "All Groceries" button that reveals a unified grid of all categories.
- **Mobile:** 2-row sticky header with a hamburger-triggered drill-down drawer (Tesco-style accordion navigation).

## Component Tree

```
Nav (server component)
├── Banner (free delivery, non-sticky)
├── <header sticky top-0 z-50>
│   ├── MOBILE (lg:hidden)
│   │   ├── Row 1: Hamburger | Logo (centered, absolute) | Account + Cart
│   │   └── Row 2: NavSearch (full-width)
│   │
│   └── DESKTOP (hidden lg:flex)
│       ├── Logo
│       ├── AllGroceriesPanel (client component)
│       │   ├── Trigger button "All Groceries ▾"
│       │   └── Panel (createPortal to body)
│       │       ├── Backdrop (fixed, z-40)
│       │       └── Grid panel (fixed, z-50)
│       ├── NavSearch (fluid center)
│       └── Account + Cart (with CartButton → CartDropdown Popover)
│
├── MobileMenu (client component — replaces old SideMenu)
│   ├── Hamburger trigger
│   ├── Drawer (createPortal, 85vw, max 400px)
│   │   ├── Depth 0: Static links + L1 categories
│   │   ├── Depth 1: "All [Category]" banner + L2 subcategories + "← Back"
│   │   └── Depth 2: L3 grandchildren + "← Back"
│   └── Footer: LanguageSelect + CountrySelect + copyright
│
└── types.ts (shared interfaces: NavCategory, NavChild, NavGrandchild)
```

## Data Architecture

### API Call

```
GET /store/product-categories
  fields: "*category_children, *category_children.category_children, *products, *parent_category, *parent_category.parent_category, *metadata"
  limit: 200
  cache: force-cache (tag-based ISR, revalidate: 300s)
```

### Tree Building (`fetchNavCategories()`)

```typescript
// src/modules/layout/templates/nav/index.tsx

1. Fetch all categories (flat list with expanded relations)
2. Split into parents (no parent_category_id), children (has parent_category_id),
   grandchildren (parent_category_id points to a child)
3. For each parent:
   - Build children array with injected "All [Category]" virtual child at index 0
   - Map real children with their grandchildren
4. Return NavCategory[]

Type shape:
  NavCategory { name, handle, children: NavChild[] }
  NavChild { name, handle, isVirtual?: boolean, grandchildren: NavGrandchild[] }
  NavGrandchild { name, handle }
```

### "All [Category]" Injection Rule

Every L1 category has a programmatically injected virtual L2 child at index 0:
```typescript
{ name: `All ${parentCategory.name}`, handle: parentCategory.handle, isVirtual: true, grandchildren: [] }
```

This links to the parent category page and is styled in brand-orange (`text-brand-orange font-semibold`).

## Desktop Panel Behavior

### AllGroceriesPanel (`components/all-groceries-panel/index.tsx`)

| Property | Value |
|----------|-------|
| Open trigger | Click (not hover) |
| Dismiss | ESC key, backdrop click, category link click |
| Backdrop | Fixed, z-40, bg-black/30, backdrop-blur-sm |
| Panel | Fixed, z-50, full-width, positioned below header |
| Body scroll | Locked (overflow: hidden) when open |
| Grid | 2 cols (sm:3, lg:4, xl:5) |
| L1 blocks | Bold header + "All [Category]" (orange) + L2 list (grey) |

### ARIA

- Trigger: `aria-expanded`, `aria-haspopup="menu"`, `data-testid="nav-all-groceries-btn"`
- Panel: `role="menu"`, `aria-label="All grocery categories"`
- Backdrop: `aria-hidden="true"`, `data-testid="nav-all-groceries-backdrop"`

## Mobile Panel Behavior

### MobileMenu (`components/mobile-menu/index.tsx`)

| Property | Value |
|----------|-------|
| Open trigger | Click hamburger icon |
| Drawer | Fixed, z-[51], 85vw, max-w-[400px], slides in from left |
| Navigation | Depth-based push/pop (Depth 0, 1, 2) |
| Touch targets | 48px min-height (`.drawer-row`) |
| Close | Backdrop click, X button |
| Body scroll | Locked when open |

### Depth Views

```
Depth 0 (Main):     Static links (Home/Store/Account/Cart) + Categories label + L1 list
Depth 1 (L2):       "← Back" header + "All [Category]" (orange banner) + divider + L2 subcategories
Depth 2 (L3):       "← Back" header + L3 grandchildren list (+ "View all in [L2]" fallback)
```

### Feature Flag

```typescript
// nav/index.tsx:16
const USE_NEW_MOBILE_MENU = true
```

When `false`, the legacy `SideMenu` component renders instead.

## Header Layout Spec

### Mobile (viewport < 1024px)

```
┌──────────────────────────────────────┐
│  [☰]      IndiaGrocers      [👤][🛒] │ ← Row 1 (h-14)
├──────────────────────────────────────┤
│  [═══════ Search products... ══════] │ ← Row 2 (pb-2.5)
└──────────────────────────────────────┘
```

- Logo: Absolutely centered with `left-1/2 -translate-x-1/2`
- Logo wrapper: `pointer-events-none` (link has `pointer-events-auto`)
- Both rows: sticky

### Desktop (viewport ≥ 1024px)

```
┌──────────────────────────────────────────────────────────┐
│ [IndiaGrocers][All Groceries ▾] [══════ Search ═══════] [👤][🛒] │
└──────────────────────────────────────────────────────────┘
```

- Single row (h-16)
- Search: flex-1, mx-4
- All Groceries: next to logo, click-to-toggle
- All elements: sticky

### Cart Behavior by Viewport

| Screen | Cart Element | Click Behavior |
|--------|-------------|----------------|
| Mobile (< 1024px) | `<LocalizedClientLink href="/cart">` (data-testid: nav-mobile-cart-link) | Navigates to /cart |
| Desktop (≥ 1024px) | `<CartButton>` → `<CartDropdown>` (Popover, data-testid: nav-cart-link) | Opens Popover dropdown |

## Styling Dependencies

### Tailwind Config Additions

```
tailwind.config.js:
  keyframes:
    - drawer-slide-in / drawer-slide-out (drawer open/close)
    - drawer-push-in / drawer-push-out / drawer-pop-in (sub-navigation)
  animations:
    - drawer-in / drawer-out / drawer-push-forward / drawer-push-back
```

### Global CSS Utilities

```
globals.css:
  .mobile-drawer — fixed, 85vw, max-w-[400px], shadow-2xl
  .drawer-row — min-h-[48px], flex, items-center, hover states
  .drawer-row-active — text-brand-orange, bg-brand-orange/5
```

## Test Coverage

| Layer | File | Test Count |
|-------|------|------------|
| BDD/Gherkin | `e2e/features/layout/navigation.feature` | 20 scenarios |
| Step definitions | `e2e/features/layout/navigation.steps.ts` | ~30 step implementations |
| Playwright E2E | `e2e/layout/navigation.spec.ts` | 19 tests in 5 describe blocks |
| Feature flag | Legacy SideMenu preserved for fallback testing | — |

### Test Commands

```bash
# All navigation tests (BDD)
npx playwright test --project=bdd e2e/features/layout/

# All navigation tests (E2E spec)
npx playwright test --project=e2e e2e/layout/

# Single test file
npx playwright test e2e/layout/navigation.spec.ts

# Interactive UI
npx playwright test --ui
```

## Rebuild From Scratch

To reconstruct the navigation system after a fresh Medusa + Next.js setup:

### Step 1: Shared Types
Create `src/modules/layout/types.ts` with `NavCategory`, `NavChild`, `NavGrandchild` interfaces.

### Step 2: Data Layer
In `src/lib/data/categories.ts`, ensure the API call includes:
```
fields: "*category_children, *category_children.category_children, *products, *parent_category, *parent_category.parent_category, *metadata"
```

### Step 3: Data Transformation
In `src/modules/layout/templates/nav/index.tsx`:
- Implement `fetchNavCategories()` (flat → 3-level tree with "All [Category]" injection)
- Import `retrieveCart` for mobile cart badge count

### Step 4: Components (in order)
1. `components/mobile-menu/index.tsx` — Drawer with push/pop navigation, 48px touch targets
2. `components/all-groceries-panel/index.tsx` — Click-to-toggle button + portal grid panel
3. `templates/nav/index.tsx` — Sticky header with mobile 2-row + desktop 1-row layouts

### Step 5: CSS & Tailwind
- Add keyframes/animations to `tailwind.config.js`
- Add utility classes to `globals.css` (`.mobile-drawer`, `.drawer-row`, `.drawer-row-active`)

### Step 6: Test Artifacts
- Create feature file, step definitions, Playwright spec
- Run: `npx playwright test --project=e2e e2e/layout/navigation.spec.ts`

## Known Configuration Constants

| Constant | File | Default | Purpose |
|----------|------|---------|---------|
| `USE_NEW_MOBILE_MENU` | `nav/index.tsx:17` | `true` | Toggle new MobileMenu vs legacy SideMenu |
| `FREE_DELIVERY_BANNER` | `store-config.ts` | "Free delivery on orders over £30" | Banner text |

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1 | May 2026 | Original: CSS-only mega menu + SideMenu Popover |
| v2 | Jun 2026 | Sports Direct: NavStrip horizontal L1 bar with per-category hover dropdowns |
| v3 | Jun 2026 | Unified: Single-row header + All Groceries button + click-to-toggle unified grid + sticky positioning |
| v4 | Jun 2026 | Fixed: Mobile cart as plain link (no Popover), live item count badge, data-testid attributes, full test coverage |
