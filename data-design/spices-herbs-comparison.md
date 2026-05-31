# Natco Spices & Herbs vs Local Storefront — Detailed Comparison

**Generated:** 2026-05-30
**Sources:** Natco Shopify JSON (`shop.natcofoods.com/collections/spices-herbs`) vs Local MeiliSearch index

---

## Executive Summary

**100% product coverage. Zero data loss.** All 134 Natco `spices-herbs` products exist in the local storefront. The organizational structure differs: Natco uses a flat Shopify collection; local uses a hierarchical Medusa category tree with 4 subcategories under the `spices` parent. The UX gap is that `/categories/spices-herbs` shows 84 products instead of 134 — users must navigate to the parent `/categories/spices` to see the full catalog.

---

## Step 1: Natco Shopify JSON — Product Breakdown

**Total products in the Natco `spices-herbs` collection:** 134

| Product Type (Natco) | Count | Valid for spices-herbs? |
|----------------------|-------|------------------------|
| Spices | 52 | ✅ Yes |
| Spice & Herb Jars | 34 | ✅ Yes |
| Spice Blends and Mixes | 14 | ✅ Yes |
| Flavouring | 12 | ✅ Yes (cooking/baking essences) |
| Herbs | 11 | ✅ Yes |
| Food Colouring | 7 | ✅ Yes (baking/cooking aids) |
| Spice Jars | 2 | ✅ Yes |
| spice (lowercase) | 2 | ✅ Yes |
| **TOTAL** | **134** | **100% valid** |

**Misclassified products in Natco JSON:** 0 — No Pappadoms, Pickles, Sauce, Chutney, Snacks, Flour, Rice, Lentils, Beans, Soya products found in the `spices-herbs` collection.

---

## Step 2: Local MeiliSearch — Spices Subtree

The local storefront uses a hierarchical category tree created by `migrate-to-natco-categories.mjs` which mirrors the Natco Foods taxonomy:

```
spices (parent, 0 direct products)
├── spices-herbs (84 products)        ← "All Spices & Herbs"
├── spice-herb-jars (18 products)     ← "Spice & Herb Jars"
├── spice-blends-mixes (14 products)  ← "Spice Blends & Mixes"
├── food-colourings-essences (19)     ← "Food Colourings & Essences"
└── sugar (4 products)                ← "Sugar"
```

| Local Category | Count | Maps to Natco product_type |
|---------------|-------|---------------------------|
| `spices-herbs` | 84 (83 real + 1 test) | Spices (52), Herbs (11), Spice Jars (2), spice (2), partial Spice & Herb Jars (16/34) |
| `spice-herb-jars` | 18 | partial Spice & Herb Jars (18/34) |
| `spice-blends-mixes` | 14 | Spice Blends and Mixes (14/14) |
| `food-colourings-essences` | 19 | Flavouring (12), Food Colouring (7) |
| `sugar` | 4 | Not in Natco spices-herbs collection (separate Shopify collection) |
| **TOTAL (spices subtree)** | **139** | |
| **TOTAL (minus sugar + test)** | **134** | |

---

## Step 3: Comparison Table

| Issue | Natco Count | Local Count | Root Cause |
|-------|------------|-------------|------------|
| Total products in spices-herbs | 134 | 84 | Local split Natco's flat collection into 4 subcategories under `spices` parent |
| All spice products (combined) | 134 | 134 | Perfect match after accounting for TEST-3 artifact |
| Products with wrong product_type | 0 | 0 | No misclassified products in either system |
| Products missing from local that Natco has | — | 0 | All 134 products exist in the 4 subcategories |
| Products on local that aren't in Natco | — | 1 | TEST-3 Chilli Powder 1kg (test artifact, should be removed) |
| "Pappadoms" or snack products in spices-herbs | 0 | 0 | Neither system has misclassified snack/non-spice items |
| Sugar products under Spices parent | 0 (in collection) | 4 | Sugar is a separate Shopify collection at Natco; locally it's a child of `spices` |

---

## Step 4: Detailed Findings & Recommendations

### 4.1 Data Coverage: 100% Match

Every Natco product is accounted for in the local storefront:

- **Spices (52/52):** All bulk spices present (`spices-herbs`)
- **Herbs (11/11):** All dried herbs present (`spices-herbs`)
- **Spice Jars (2/2):** Garam Masala Jar, Tandoori Masala Jar (`spices-herbs`)
- **Spice & Herb Jars (34/34):** 16 in `spices-herbs`, 18 in `spice-herb-jars`
- **Spice Blends & Mixes (14/14):** All Mangal masalas + bulk seasonings (`spice-blends-mixes`)
- **Flavouring (12/12):** Essences, juices, syrups, waters (`food-colourings-essences`)
- **Food Colouring (7/7):** Liquid and powder colours (`food-colourings-essences`)

### 4.2 UX Gap: Category Page Shows 84 Not 134

The `/gb/categories/spices-herbs` page shows only 84 products — the 50 products in `spice-herb-jars`, `spice-blends-mixes`, and `food-colourings-essences` are invisible on this page.

**This IS mitigated** by the category page's `resolveCategoryHandles` function (`categories/[...category]/page.tsx:88-95`), which recursively resolves a parent category and all its descendants. When a user navigates to the parent `/gb/categories/spices`, they see all 134 (actually 139 including sugar) products because the parent resolves its entire subtree.

**However**, there are issues:
1. No visual indication on the `spices-herbs` page that these are "only basic spices" and more products exist in sibling subcategories
2. The `SubTypeChips` component (`weight-heavy.tsx:83-93`) shows child category chips, but only if `spices-herbs` has children — which it doesn't (it's a leaf)
3. The parent `spices` page uses the BrandShowcase template, but the siblings of `spices-herbs` don't link back

### 4.3 Anomalous Product

**TEST-3 Chilli Powder 1kg** (handle: `test3-chilli-powder`, id: `prod_01KSW8AD8QDZFAV1APRPBMMMRK`) exists in `spices-herbs` but has no counterpart in the Natco catalog. This is a test artifact from seed data testing and should be deleted.

### 4.4 Category Structure Justification

The split into subcategories (`spices-herbs`, `spice-herb-jars`, `spice-blends-mixes`, `food-colourings-essences`) is intentional — it comes from `migrate-to-natco-categories.mjs` which mirrors the Natco Foods taxonomy. This structure is valid and provides better browsing granularity than a flat 134-product list.

### 4.5 Template Mismatch

The `spices-herbs` handle gets the **StandardGrid** template (`page.tsx:77-81`), which is correct since it's not in the `WEIGHT_HEAVY_HANDLES` or `BRAND_SHOWCASE_HANDLES` sets. However, the sibling categories (`spice-herb-jars`, `spice-blends-mixes`, `food-colourings-essences`) also get StandardGrid, which may not be ideal — the `spice-blends-mixes` page could benefit from the BrandShowcase template.

---

## Recommendations

### Immediate (bug fixes)

1. **Delete TEST-3 Chilli Powder 1kg** — test artifact polluting production search index

### Short-term (UX improvements)

2. **Add "See all Spices" link** from the `spices-herbs` category page to `/categories/spices` so users can discover the full catalog
3. **Add sibling subcategory chips** to the `spices-herbs` category page header (similar to how `SubTypeChips` renders child categories) linking to `spice-herb-jars`, `spice-blends-mixes`, `food-colourings-essences`
4. **Update `pseudo-query.ts`** (`lib/util/pseudo-query.ts:20-31`) — currently has separate entries for `spices-herbs` and `spice-herb-jars`. Consider a combined pseudo-query for the `spices` parent page that covers all relevant terms.

### Medium-term (data architecture)

5. **Consider `spices-herbs` → `all-spices-herbs` rename** to clarify it's the "core" spices/herbs subset, not the full collection
6. **Add metadata flag** to mark `spices-herbs` as a "show siblings" category so the template renders links to related subcategories

### Long-term (product taxonomy)

7. **Review sugar placement** — Sugar is under the `spices` parent locally but is a separate Shopify collection at Natco. This is acceptable but worth documenting
8. **Validation test** — Add a data health check that ensures the count of `spices-herbs` + `spice-herb-jars` + `spice-blends-mixes` + `food-colourings-essences` matches the expected Natco catalog count (134)

---

## Summary

| Metric | Value |
|--------|-------|
| Natco total | 134 |
| Local total (combined) | 134 |
| Data completeness | 100% |
| Misclassified products (either side) | 0 |
| Products incorrectly missing | 0 |
| Test artifacts to remove | 1 (TEST-3) |
| UX issue: partial view on /spices-herbs | Yes — fixable with sibling chips or redirect |
