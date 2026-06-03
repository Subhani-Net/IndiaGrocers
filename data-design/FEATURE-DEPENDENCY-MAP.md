# Feature Dependency Map — IndiaGrocers Storefront

> **Purpose:** Single source of truth for every feature's data dependencies, category handle references, and staleness status. When any category handle is renamed, created, or deleted, this document identifies exactly which files must be updated.
>
> **Last updated:** June 2026

---

## 1. Canonical Category Handles (Ground Truth)

These are the handles that **actually exist** in the database. Any handle not in this list is stale/dead.

### Natco Parent Categories

| Parent | Children |
|--------|----------|
| `spices` | `spices-herbs`, `spice-herb-jars`, `spice-blends-mixes`, `food-colourings-essences`, `sugar` |
| `essentials` | `all-essentials`, `tinned-products`, `ghee-oils`, `teas-drinks`, `vegetables`, `flour-essentials` |
| `lentils` | `all-lentils-beans`, `dried-lentils-beans-peas`, `soya-products`, `tinned-lentils-beans` |
| `nuts-seeds` | `all-nuts-seeds`, `raw-nuts`, `flavoured-nuts`, `seeds`, `coconut-products`, `dried-fruit`, `nut-seed-oils` |
| `snacks` | `all-snacks`, `pappadoms`, `chutneys-pickles-sauces`, `namkeen-lentil-snacks`, `flavoured-nuts-snacks`, `raisins-snacks` |
| `grains` | `all-grains`, `rice-quinoa`, `flour-milk-powder`, `wheat-grains-couscous`, `corn`, `soya-grains` |
| `flours` | (leaf — no children) |
| `tinned-products-parent` | `tinned-vegetables`, `tinned-coconut`, `tinned-fruit`, `tinned-lentils-beans` |

### MVC Round 1 Categories (added May 2026)

| Parent | Children |
|--------|----------|
| `masalas-dessert-mixes` | `shan-masalas`, `mdh-masalas`, `everest-masalas`, `dessert-mixes` |
| `ready-to-eat-instant` | `frozen-breads`, `ready-meals`, `breakfast-mixes`, `instant-noodles`, `paneer-cheese` |
| `confectionery-sweets` | `tinned-sweets`, `indian-chocolate`, `mouth-fresheners`, `indian-candies` |
| `beverages-drinks` | `loose-leaf-tea`, `filter-coffee`, `instant-coffee`, `drinks-syrups`, `health-drinks` |
| Under `snacks` | `haldiram-namkeens`, `bikaji-namkeens`, `indian-biscuits` |

### Phase 2/3 (Coming Soon — show `ComingSoonPage`)

`frozen`, `fresh`, `ready-to-cook`, `condiments`, `pooja`, `household`, `regional`

---

## 2. Feature Dependency Matrix

### 2.1 Category Page Templates (Dynamic — Safe)

**File:** `apps/storefront/src/app/[countryCode]/(main)/categories/[...category]/page.tsx`

| Dependency | Source | How |
|-----------|--------|-----|
| Category hierarchy | Medusa API (`getCategoryByHandle`) | Dynamically fetches full tree with children |
| Category handles | `resolveCategoryHandles(category)` | Recursively collects all child handles from API |
| MeiliSearch filter | Built from resolved handles | `category_handle IN ["a","b","c"]` |
| Template selection | Handle Set matching | See section 2.2 |

**Change impact:** ✅ Safe — no hardcoded handles. Template selector (below) must be kept in sync.

### 2.2 Template Selector

**File:** `apps/storefront/src/app/[countryCode]/(main)/categories/[...category]/page.tsx` (lines 67-75)

| Handle | Template | Status |
|--------|----------|--------|
| `grains` | weight-heavy | ✅ Current |
| `lentils` | weight-heavy | ✅ Current |
| `flours` | weight-heavy | ✅ Current |
| `spices` | brand-showcase | ✅ Current |
| Everything else | standard-grid | ✅ Current |

**Change impact:** If a handle is renamed, the template selector must be updated or products will render with wrong card type.

---

## 3. Dead Link Register — All Stale Category Handles

### 3.1 Stale → Correct Mapping

| Old (stale — 0 products) | New (correct) | Where used |
|--------------------------|---------------|------------|
| `staples-grains` | `grains` or `all-grains` | cart, weight-heavy, coming-soon, regional (5 refs) |
| `atta-flours` | `flours` or `flour-essentials` | cart, weight-heavy, coming-soon, regional (4 refs) |
| `dal-lentils` | `lentils` or `all-lentils-beans` | cart, weight-heavy, coming-soon, regional (4 refs) |
| `oils-ghee` | `ghee-oils` | cart, coming-soon, regional (3 refs) |
| `spice-blends` | `spice-blends-mixes` | cart, coming-soon, regional (3 refs) |
| `snacks-namkeen` | `namkeen-lentil-snacks` or `snacks` | cart, standard-grid, coming-soon (4 refs) |
| `pickles-chutneys` | `chutneys-pickles-sauces` | cart, standard-grid, coming-soon, regional (4 refs) |
| `beverages` | `teas-drinks` | cart, coming-soon, brand-showcase (3 refs) |

**Total: 8 stale handles used across 31 individual references in 6 files.**

### 3.2 Feature-by-Feature Dead Links

#### 🔴 P0: Cart Reminder Strip ("Have you got everything?")

**File:** `apps/storefront/src/modules/cart/templates/index.tsx` (lines 85-98)
**Component:** `apps/storefront/src/modules/cart/components/category-reminder-strip/index.tsx`

**Dead links (7 of 10):**

| Display Name | Handle Used | Correct Handle | Fix |
|-------------|------------|----------------|-----|
| "Staples & Grains" | `staples-grains` ❌ | `grains` | Replace |
| "Atta & Flours" | `atta-flours` ❌ | `flour-milk-powder` | Replace |
| "Dal & Lentils" | `dal-lentils` ❌ | `dried-lentils-beans-peas` | Replace |
| "Oils & Ghee" | `oils-ghee` ❌ | `ghee-oils` | Replace |
| "Spices — Ground" | `spices-ground` ✅ | — | — |
| "Spice Blends" | `spice-blends` ❌ | `spice-blends-mixes` | Replace |
| "Beverages" | `beverages` ❌ | `teas-drinks` | Replace |
| "Snacks & Namkeen" | `snacks-namkeen` ❌ | `namkeen-lentil-snacks` | Replace |
| "Pickles & Chutneys" | `pickles-chutneys` ❌ | `chutneys-pickles-sauces` | Replace |
| "Dairy" | `dairy` ✅ | — | — |

**User impact:** Signed-in customers on the cart page click suggested categories and land on empty pages. The entire feature produces broken links.

#### 🟡 P1: Coming-Soon Category Cross-Links

**File:** `apps/storefront/src/modules/categories/templates/coming-soon.tsx` (lines 100-109)

**Dead links (8 of 9):**

| Display Name | Handle Used | Fix |
|-------------|------------|-----|
| "Staples & Grains" | `staples-grains` ❌ | `grains` |
| "Atta & Flours" | `atta-flours` ❌ | `flour-milk-powder` |
| "Dal & Lentils" | `dal-lentils` ❌ | `dried-lentils-beans-peas` |
| "Oils & Ghee" | `oils-ghee` ❌ | `ghee-oils` |
| "Spices — Ground" | `spices-ground` ✅ | — |
| "Spice Blends" | `spice-blends` ❌ | `spice-blends-mixes` |
| "Beverages" | `beverages` ❌ | `teas-drinks` |
| "Snacks & Namkeen" | `snacks-namkeen` ❌ | `namkeen-lentil-snacks` |
| "Pickles & Chutneys" | `pickles-chutneys` ❌ | `chutneys-pickles-sauces` |

**User impact:** Appears on phase 2/3 categories (`frozen`, `fresh`, `condiments`, etc.). Dead "browse available categories" links.

#### 🟡 P1: Empty-State Suggested Categories — Weight-Heavy

**File:** `apps/storefront/src/modules/categories/templates/weight-heavy.tsx` (lines 168-172)

**Dead links (3 of 3):**

| Display Name | Handle Used | Fix |
|-------------|------------|-----|
| "Staples & Grains" | `staples-grains` ❌ | `grains` |
| "Atta & Flours" | `atta-flours` ❌ | `flour-milk-powder` |
| "Dal & Lentils" | `dal-lentils` ❌ | `dried-lentils-beans-peas` |

**User impact:** When filtering on `grains`, `lentils`, or `flours` returns zero products, the "Or browse:" cross-sell links go to broken pages.

#### 🟡 P1: Regional Collection Cross-Links

**File:** `apps/storefront/src/modules/regional/templates/index.tsx` (lines 117-126)

**Dead links (6 of 8):**

| Display Name | Handle Used | Fix |
|-------------|------------|-----|
| "Staples & Grains" | `staples-grains` ❌ | `grains` |
| "Atta & Flours" | `atta-flours` ❌ | `flour-milk-powder` |
| "Dal & Lentils" | `dal-lentils` ❌ | `dried-lentils-beans-peas` |
| "Oils & Ghee" | `oils-ghee` ❌ | `ghee-oils` |
| "Spices — Whole" | `spices-whole` ✅ | — |
| "Spices — Ground" | `spices-ground` ✅ | — |
| "Spice Blends" | `spice-blends` ❌ | `spice-blends-mixes` |
| "Pickles & Chutneys" | `pickles-chutneys` ❌ | `chutneys-pickles-sauces` |

#### 🟠 P2: VAT Notice + Suggested Categories — Standard-Grid

**File:** `apps/storefront/src/modules/categories/templates/standard-grid.tsx`

| Issue | Line | Detail |
|-------|------|--------|
| VAT notice never triggers | 53 | `snacks-namkeen` → actual handle is `namkeen-lentil-snacks`. "Prices include 20% VAT" banner never renders. |
| Suggested "Snacks & Namkeen" | 172 | `snacks-namkeen` ❌ → `namkeen-lentil-snacks` |
| Suggested "Pickles & Chutneys" | 173 | `pickles-chutneys` ❌ → `chutneys-pickles-sauces` |

#### 🟠 P2: Empty-State Suggested Categories — Brand-Showcase

**File:** `apps/storefront/src/modules/categories/templates/brand-showcase.tsx` (lines 215-219)

| Display Name | Handle Used | Fix |
|-------------|------------|-----|
| "Spices — Ground" | `spices-ground` ✅ | — |
| "Spices — Whole" | `spices-whole` ✅ | — |
| "Beverages" | `beverages` ❌ | `teas-drinks` |

**1 dead out of 3.**

---

## 4. Pseudo-Query System — Category Tag Keys

**File:** `apps/storefront/src/lib/util/category-tags.json`

| Key | Status | Issue |
|-----|--------|-------|
| `sugar-jaggery` | ❌ Stale | Should be `sugar` |
| `Beans` | ⚠️ Suspect | Uppercase `B` — may fail lookup (all other keys are lowercase) |
| All other 19 keys | ✅ Current | — |

**Impact:** Sugar products display in default sort order instead of relevance-sorted. The `Beans` key may also fail lookup. Feature is currently disabled (`getPseudoQuery` returns `""`), so no immediate user impact.

---

## 5. Dynamic Features — Safe from Handle Changes

These features dynamically fetch category data from the Medusa API and have **zero hardcoded handles**:

| Feature | File | How |
|---------|------|-----|
| Desktop nav | `nav/index.tsx` | `fetchNavCategories()` fetches from API |
| Mobile side menu | `side-menu/index.tsx` | Receives categories as props from nav |
| Homepage category grid | `category-grid.tsx` | `listCategories()` from API |
| Category page | `page.tsx` | `getCategoryByHandle()` + `resolveCategoryHandles()` from API |
| Breadcrumbs | `breadcrumb/index.tsx` | Walks `parent_category` chain from API |
| Search category chips | `search/page.tsx` | Fetches parent categories from API |
| Sub-type chips | `sub-type-chips/index.tsx` | Receives `childCategories` from parent template |
| Filter panel | `filter-panel/index.tsx` | Receives `categoryHandle` prop |
| Category emojis | `category-emojis.ts` | Uses names, not handles |
| MeiliSearch config | `configure-index.ts` | Uses field name `category_handle`, no specific values |
| E2E tests | All `*.spec.ts` | ✅ Already using current handles |

---

## 6. Change Protocol

### When renaming a category handle:

1. ✅ Update the database (Medusa Admin API or seed script)
2. ✅ Update the **Canonical Handles list** (Section 1 above)
3. ✅ Update the **Template Selector** (2 files: `page.tsx`, `category-phase.tsx`) if it's a template-triggering handle
4. ✅ Search and replace in all **6 stale-reference files** (Section 3)
5. ✅ Search and fix in **category-tags.json** (Section 4) if applicable
6. ✅ Update all **E2E tests** that navigate to the old URL
7. ✅ Reindex MeiliSearch (`npm run reindex`)
8. ✅ Run full test suite (`npx playwright test e2e/`)

### When creating a new category handle:

1. ✅ Create in Medusa via Admin API or seed script
2. ✅ Add to **Canonical Handles list** (Section 1)
3. ✅ No other changes needed — navigation and category browsing are dynamic

### When deleting a category handle:

1. ✅ Run the protocol above for all references found by grep across the storefront
2. ✅ Remove from stale-reference files if present
3. ✅ Remove from category-tags.json if present
4. ✅ Update E2E tests

---

## 7. Files Quick-Reference (grep targets)

When searching for handle dependencies, grep these patterns across `apps/storefront/src/`:

```
staples-grains
atta-flours
dal-lentils
oils-ghee
spice-blends (careful — also matches spice-blends-mixes)
snacks-namkeen
pickles-chutneys
beverages (careful — also matches beverages-drinks)
sugar-jaggery
```
