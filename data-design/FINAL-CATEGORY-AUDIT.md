# Final Category Audit — Natco Products

**Date:** 30 May 2026  
**Sources:** `grains-master.csv` (35), `essentials-master.csv` (23), `tinned-products-master.csv` (28)  
**Reference:** MeiliSearch facet distribution on `category_handle`

---

## Summary

| Category Group | CSV Expected | MeiliSearch Actual | Status |
|---|---|---|---|
| Rice & Quinoa (`rice-quinoa`) | 11 | 11 | **OK** |
| Flours (`flours`) | 22 | 22 | **OK** |
| Corn (`corn`) | 2 | 2 | **OK** |
| Ghee & Oils (`ghee-oils`) | 16 | 16 | **OK** |
| Sugar & Jaggery (`sugar`) | 4 | 4 | **OK** (handle differs) |
| Soya (`soya-products`) | 3 | 5 | +2 extra from other seed |
| Tinned Lentils/Beans (`tinned-lentils-beans`) | 9 | 8 | -2 missing, +1 extra full-case |
| Tinned Vegetables (`tinned-vegetables`) | 13 | **0** | All in wrong category |
| Tinned Coconut (`tinned-coconut`) | 3 | **0** | All in wrong category |
| Tinned Fruit (`tinned-fruit`) | 3 | **0** | All in wrong category |
| **Tinned parent** (`tinned-products-parent`) | 0 (should be 0) | **20** | All tinned miscategorized here |

---

## CRITICAL — Tinned Products Category Structure

**All 28 tinned products exist in MeiliSearch, but 19 of 28 are assigned to the wrong category handle.**

The `tinned-products-parent` handle contains 20 products that should be distributed across 4 leaf subcategories:

### `tinned-products-parent` → breakdown (all 20):

| Belongs in | Count | Products |
|---|---|---|
| `tinned-vegetables` | 13 | Okra Full Case 12x400g, Punjabi Tinda Full Case 12x400g, Tomatoes Chopped Full Case 12x400g, Spinach Puree 395g, Spinach Leaf 396g, Spinach Puree 794g, Tomato Paste 800g, Tomatoes Peeled 400g, Patra 400g, Sarson Ka Saag 450g, Karela 400g, Lotus Root 400g, Suran (Yam) 400g |
| `tinned-coconut` | 3 | Coconut Cream 400ml, Coconut Milk 400ml, Coconut Milk Light 400ml |
| `tinned-fruit` | 3 | Mango Pulp Alphonso 450g, Mango Pulp Kesar 850g, Mango Slices Alphonso 425g |
| `tinned-lentils-beans` | 1 | Chick Peas Full Case 12x400g |

**Result:** `tinned-vegetables`, `tinned-coconut`, and `tinned-fruit` have 0 products each despite having 19 products that belong in them.

---

## Category-By-Category Detail

### Grains (35 CSV products) — ALL CLEAN

| Handle | CSV | MeiliSearch | Delta |
|---|---|---|---|
| `rice-quinoa` | 11 | 11 | 0 |
| `flours` | 22 | 22 | 0 |
| `corn` | 2 | 2 | 0 |

No mismatches. Every CSV product matches a MeiliSearch entry and vice versa.

---

### Essentials (23 CSV products)

| Handle | CSV | MeiliSearch | Delta |
|---|---|---|---|
| `ghee-oils` | 16 | 16 | 0 |
| `sugar` / `sugar-jaggery` | 4 | 4 | 0 |
| `soya-grains` / `soya-products` | 3 | 5 | +2 |

**Ghee & Oils:** Perfect match. All 16 CSV products present (almond oil ×2, castor oil, coconut oil parachute, ghee ×2, groundnut oil, olive oil ×4, linseed oil, mustard oil ×2, sesame oil ×2).

**Sugar:** Perfect match. CSV uses handle `sugar-jaggery`, DB uses `sugar`. All 4 present (demerara ×2, jaggery, sugar candy).

**Soya:** 3 CSV products present (Soya Chunks 350g, Soya Chunks 700g, Soya Mince 300g) + 2 extra not in CSV (Soya Beans 2kg, Soya Beans 500g) from the dried-lentils seed pipeline. Handle differs: CSV calls it `soya-grains`, DB uses `soya-products`. All 3 CSV products are marked `DUPLICATE_lentils` in the CSV, suggesting they may also appear in `dried-lentils-beans-peas`.

---

### Tinned Products (28 CSV products) — STRUCTURAL ISSUE

#### `tinned-lentils-beans`: 8 actual vs 9 expected

**Present (8):**
| Product | CSV Match |
|---|---|
| Black Eyed Beans 400g | black-eyed-beans-400g |
| Chick Peas 2.5kg | chickpeas-tinned-large |
| Kala Chana Boiled 400g | kala-chana-boiled |
| Red Kidney Beans 2.5kg | red-kidney-tinned-large |
| Red Kidney Beans Boiled Full Case 12x400g | (extra — not in CSV) |
| Rose Coco (Borlotti) Beans 400g | rose-coco-beans |
| Toovar 400g | toovar |
| White Kidney Beans 400g | white-kidney-tinned |

**Missing from this category (2):**
- `chickpeas-tinned` — Chick Peas 400g single tin → the Full Case 12x400g is in `tinned-products-parent`
- `red-kidney-tinned` — Red Kidney Beans 400g single tin → the Boiled Full Case 12x400g is in `tinned-lentils-beans` (different product)

#### `tinned-vegetables`: 0 actual vs 13 expected

All 13 products are in `tinned-products-parent` instead. 10 match CSV single-unit products, 3 are Full Case 12x400g variants with no matching CSV entry (the corresponding singles are missing):

| Product in MeiliSearch | CSV Match |
|---|---|
| Okra Full Case 12x400g | `okra` (single 400g missing) |
| Punjabi Tinda Full Case 12x400g | `punjabitinda` (single 400g missing) |
| Tomatoes Chopped Full Case 12x400g | `tomatoeschopped` (single 400g missing) |
| Spinach Puree 395g | spinach-puree-395g |
| Spinach Leaf 396g | spinach-leaf-tinned |
| Spinach Puree 794g | spinach-puree-tinned |
| Tomato Paste 800g | tomatopaste |
| Tomatoes Peeled 400g | tomatoespeeled |
| Patra 400g | patra |
| Sarson Ka Saag 450g | sarson-ka-saag |
| Karela 400g | karela |
| Lotus Root 400g | lotusroot |
| Suran (Yam) 400g | suranyam |

#### `tinned-coconut`: 0 actual vs 3 expected

All 3 in `tinned-products-parent` — perfect product match, wrong handle:
- Coconut Cream 400ml = `coconutcream`
- Coconut Milk 400ml = `coconutmilk`
- Coconut Milk Light 400ml = `coconut-milk-light`

#### `tinned-fruit`: 0 actual vs 3 expected

All 3 in `tinned-products-parent` — perfect product match, wrong handle:
- Mango Pulp Alphonso 450g = `mango-pulp-alphonso`
- Mango Pulp Kesar 850g = `mango-pulp-kesar`
- Mango Slices Alphonso 425g = `mango-slices-alphonso`

---

## Full-Case Variant Substitution Issue

5 CSV products have their single-unit versions missing from the catalog. Instead, Full Case (12x400g) bulk variants exist:

| CSV Handle (Missing) | Expected Product | Replaced By |
|---|---|---|
| `chickpeas-tinned` | Chick Peas 400g | Chick Peas Full Case 12x400g |
| `red-kidney-tinned` | Red Kidney Beans 400g | Red Kidney Beans Boiled Full Case 12x400g |
| `okra` | Okra 400g | Okra Full Case 12x400g |
| `punjabitinda` | Punjabi Tinda 400g | Punjabi Tinda Full Case 12x400g |
| `tomatoeschopped` | Tomatoes Chopped 400g | Tomatoes Chopped Full Case 12x400g |

These 5 full-case variants are not in the CSV. Either the CSV should be updated to include them as separate SKUs, or the single tins need to be created.

---

## Handle Naming Inconsistencies

| CSV Handle | DB Handle | Products Match? |
|---|---|---|
| `sugar-jaggery` | `sugar` | Yes (4/4) |
| `soya-grains` | `soya-products` | Yes, but +2 extras |

These don't cause data loss but create confusion when cross-referencing.

---

## Products From Other Seed Data (not in CSV)

These products appear in MeiliSearch under categories that overlap with CSV scopes but come from the broader seed pipeline:

| Category | Count | Products |
|---|---|---|
| `flour-milk-powder` | 2 | Milk Powder 300g, Milk Powder 750g |
| `wheat-grains-couscous` | 2 | Couscous 500g, Vermice T'Dini-Fedelini 500g |
| `vegetables` | 2 | Crispy Fried Onions 150g, Crispy Fried Onions 400g |
| `teas-drinks` | 3 | Spiced Tea Masala Blend 160s, Coconut Water 330ml, Coconut Water 1L |
| `soya-products` | +2 | Soya Beans 2kg, Soya Beans 500g (in addition to the 3 CSV soya products) |

These are **expected and intentional** — they come from `initial-data-seed.ts` or other pipeline steps outside the Natco CSV import.

---

## Action Items

### P0 — Blocking (broken category structure)

1. **Reassign 19 tinned products** from `tinned-products-parent` to their correct leaf subcategories:
   - 10 to `tinned-vegetables` (excluding the 3 Full-Case-only variants that have no matching CSV singles)
   - 3 to `tinned-coconut`
   - 3 to `tinned-fruit`
   - 1 to `tinned-lentils-beans` (Chick Peas Full Case)

### P1 — Missing single-unit products

2. **Create the 5 missing single-unit tinned products** or update CSV to accept full-case variants as the canonical SKUs:
   - Chick Peas 400g (`chickpeas-tinned`)
   - Red Kidney Beans 400g (`red-kidney-tinned`)
   - Okra 400g (`okra`)
   - Punjabi Tinda 400g (`punjabitinda`)
   - Tomatoes Chopped 400g (`tomatoeschopped`)

### P2 — Handle alignment

3. **Standardize category handles** between CSVs and DB:
   - `sugar-jaggery` → `sugar` (or vice versa)
   - `soya-grains` → `soya-products` (or vice versa)

### P3 — Reindex

4. **Run `npm run reindex`** after any category reassignment to sync MeiliSearch.

---

## Verification

After fixes, MeiliSearch should show:

| Handle | Expected |
|---|---|
| `rice-quinoa` | 11 |
| `flours` | 22 |
| `corn` | 2 |
| `ghee-oils` | 16 |
| `sugar` | 4 |
| `soya-products` | 5 |
| `tinned-lentils-beans` | 10 (9 + 1 full-case) |
| `tinned-vegetables` | 13 (or 10 if full-case variants are excluded) |
| `tinned-coconut` | 3 |
| `tinned-fruit` | 3 |
| `tinned-products-parent` | **0** |
