# Search System — Architecture & Rebuild Reference

> **Last updated:** June 2026
> **Status:** Active (SearchContext + live grid + universal WeightHeavyProductCard + PdpLayover)
> **Related:** [AGENTS.md](../AGENTS.md), `Implementation/navigation-contracts.md`

## Overview

The IndiaGrocers search system provides a Tesco-style unified search experience across the storefront. It has two modes:

1. **Live Grid (SearchContext):** Typing in the header search bar replaces the page content with a live-updating product grid.
2. **SSR Page:** Direct URL navigation to `/search?q=xxx` renders results server-side with the same grid.

All product cards across the website use `WeightHeavyProductCard` with weight chips, unit pricing, and best-value badges. Clicking any card opens the `PdpLayover` multi-line variant sheet modal.

## Component Tree

```
SearchProvider (client context)
├── Nav
│   └── NavSearch ←─ useSearch() reads/writes query, autocomplete
├── LayoverProvider (client context)
│   ├── SearchLayoutClient
│   │   ├── isSearchActive=true → SearchResultsGrid → WeightHeavyProductCard
│   │   │                            ↓ click → useLayover().openLayover(product)
│   │   └── isSearchActive=false → {children} (normal page)
│   ├── PdpLayoverShell ←─ useLayover() renders modal when openProduct set
│   └── Footer
└── pathname cleanup: navigate away → clearSearch()
```

## Data Architecture

### SearchContext (`lib/context/search-context.tsx`)

| State | Type | Purpose |
|-------|------|---------|
| `isSearchActive` | `boolean` | Is the user currently in search mode? |
| `searchQuery` | `string` | Current typed query |
| `searchResults` | `StoreProduct[]` | Live results from MeiliSearch + Medusa |
| `isLoading` | `boolean` | Fetch in progress |
| `totalCount` | `number` | Total matching results |

**Data flow:**
```
User types → setSearchQuery("chilli")
  → 300ms debounce
  → abortRef.current?.abort() (cancel previous)
  → new AbortController
  → searchProducts("chilli", { limit: 24, signal })
  → fetchProductsByIds({ ids, countryCode })
  → setSearchResults(fullProducts)
  → SearchLayoutClient detects isSearchActive=true
  → Renders SearchResultsGrid with WeightHeavyProductCard
```

### SSR Page (`search/page.tsx`)

Server component reads all URL params (`q`, `dietary`, `brand`, `sort`, `page`, `maxPrice`), builds MeiliSearch filter, pre-fetches results, passes as `initialResults` prop to `SearchTemplate`.

### LayoverContext (`lib/context/layover-context.tsx`)

| State | Type | Purpose |
|-------|------|---------|
| `openProduct` | `StoreProduct \| null` | Product displayed in the layover |

**Data flow:**
```
ProductCard click → onProductClick()
  → useLayover().openLayover(product)
  → LayoverContext.openProduct = product
  → PdpLayoverShell renders <PdpLayover product={...}>
  → User adjusts variant quantities
  → "Add to Basket" → addToCart per variant → cart-updated event
  → closeLayover() → body scroll restored
```

## Header Search Behavior

### NavSearch (`components/nav-search/index.tsx`)

| Action | Behavior |
|--------|----------|
| Focus input | `setSearchActive(true)` |
| Type | `setSearchQuery(value)` → autocomplete + live grid |
| ArrowDown/Up | Navigate autocomplete suggestions |
| Enter (no highlight) | `router.replace("/search?q=xxx")` |
| Enter (highlighted item) | `router.push("/search?q=xxx")` |
| Click autocomplete item | `router.push("/search?q=xxx")` ← dropdown closes, input blurs |
| "View all results" link | `router.push("/search?q=xxx")` |
| Escape | `clearSearch()` → original page returns |
| Click outside | Dropdown closes, search stays active |
| Navigate away (any route) | `useEffect([pathname])` → `clearSearch()` |

## Product Card Behavior

### WeightHeavyProductCard (universal)

| Element | Behavior |
|---------|----------|
| Image click | `onProductClick()` → layover OR `<Link>` → PDP page |
| Title click | Same |
| "+N more" link | Same |
| Weight chips | Select active variant on card |
| Best Value badge | Amber star on lowest unit price variant |
| Unit price | Displayed under price (e.g. `£2.50/kg`, `89p/100g`) |
| Add to Basket | Adds selected variant to cart |

### ProductCard (legacy — archive)

Simplified card used only for `ProductPreview` wrapper (homepage rails). Will be replaced by `WeightHeavyProductCard` in a future consistency pass.

## PdpLayover

| Property | Desktop | Mobile |
|----------|---------|--------|
| Position | Centered modal (`max-w-2xl`) | Slide-up bottom sheet (`rounded-t-2xl`) |
| Max height | `85vh` | `90vh` |
| Backdrop | `bg-black/40 backdrop-blur-sm` | Same |
| Dismiss | ESC, backdrop click, close button | Same + drag handle |
| Variant rows | Price + unit price + `[−] N [+]` stepper | Same |
| Total + Add | Footer with total price + "Add to Basket" button | Same |
| Body scroll | Locked while open | Same |

## Navigation Cleanup

`search-context.tsx:129-137` watches `usePathname()`. When the user navigates to any route other than `/search`:
```typescript
useEffect(() => {
    if (isSearchActive && !pathname.includes("/search")) {
      setIsSearchActive(false)
      setSearchQueryState("")
      setSearchResults([])
      setTotalCount(0)
      setIsLoading(false)
    }
}, [pathname])
```

## Files Index

| Layer | File | Purpose |
|-------|------|---------|
| Context | `lib/context/search-context.tsx` | SearchProvider + useSearch hook |
| Context | `lib/context/layover-context.tsx` | LayoverProvider + useLayover hook |
| Layout | `app/[countryCode]/(main)/layout.tsx` | Wraps with SearchProvider + LayoverProvider |
| Layout | `components/search-layout-client.tsx` | Conditionally renders SearchResultsGrid |
| Layout | `components/pdp-layover-shell.tsx` | Renders PdpLayover when open |
| Header | `components/nav-search/index.tsx` | Header search with autocomplete |
| Grid | `search/components/search-results-grid.tsx` | Live search results grid |
| Card | `product-preview/weight-heavy-card.tsx` | Universal product card |
| Layover | `product-preview/pdp-layover/index.tsx` | Multi-line variant modal |
| Page | `search/page.tsx` | SSR search page |
| Template | `search/templates/index.tsx` | Search page client template |
| Client | `lib/search-client.ts` | MeiliSearch client |

## Rebuild From Scratch

1. Create `search-context.tsx` + `layover-context.tsx`
2. Create `SearchLayoutClient`, `PdpLayoverShell`
3. Create `SearchResultsGrid`, `PdpLayover`
4. Ensure `WeightHeavyProductCard` has `onProductClick` prop
5. Wire `layout.tsx` with both providers
6. Rewrite `NavSearch` to use contexts
7. Add pathname cleanup effect
8. Run validation: `npx playwright test --project=e2e e2e/search/`

## Configuration

| Constant | File | Value | Purpose |
|----------|------|-------|---------|
| Autocomplete debounce | `nav-search/index.tsx` | 200ms | MeiliSearch autocomplete |
| Live grid debounce | `search-context.tsx` | 300ms | Main search fetch |
| Fetch limit | `search-context.tsx` | 24 | Products per search |
| SSR limit | `search/page.tsx` | 12 | Products per SSR page |
| MeiliSearch host | `search-client.ts` | `NEXT_PUBLIC_MEILISEARCH_HOST` | Default `localhost:7700` |
