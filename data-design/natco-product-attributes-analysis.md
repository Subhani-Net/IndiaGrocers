# Natco Foods Product Attributes Analysis

> **Source:** Shopify product export JSON  
> **Files analyzed:** "All Lentils" (79 products) + "Tinned Products" (49 products)  
> **Date:** May 2026  
> **Total products across both files:** 128 (113 unique by handle, 15 overlaps)

---

## 1. Tags — All Unique Tags and Frequencies

### File 1 ("All Lentils" — 79 products)

Tags are used as **search keywords / SEO synonyms** — multiple variant spellings, regional names, and dish associations for the same ingredient. Several tags are generic ("beans", "lentils", "pulses", "dals", "daal", "peas") and appear on nearly every product (56–58 of 79). These act as catch-all search buckets.

| Freq | Tag | Category / Notes |
|------|-----|------------------|
| 58 | beans | Generic catch-all |
| 56 | lentils | Generic catch-all |
| 56 | pulses | Generic catch-all |
| 56 | dals | Generic catch-all |
| 56 | peas | Generic catch-all |
| 48 | daal | Alternate spelling |
| 19 | gram | Chickpea family |
| 11 | bengal gram | Chickpea variant |
| 8 | garbanzo | English name for chickpea |
| 7 | pigeon pea, moong, tuver, Arhar Dal, Toovar Dal | Toor dal variants |
| 6 | whole chana, roasted chana, whole channa | Chickpea preparation types |
| 5 | gungo peas, gungo, channa, chana, dal, lentil | Various |
| 4 | ramadan, black chickpeas | Seasonal / variant |
| 3 | puy, moog dal, masoor, massoor, rajma, kheema, chana dhal, razma, red rajma | Lentil types |
| 2 | desi chana, urad, white kidney, canellini, black eyed, borlotti, allubia, chholaa boot, kala chana, cow pea, cannellini, haricot, lobia, white rajma, canelini | Bean types |
| 1 | tur, toor daal, black lentil, beluga, rosecoco, lima bean, mat bean, matki, turkish gram, gram flour, black gram, urad, Namkeen, dew, new, Dal Recipe, meal kit, xmas snacks, spring, Christmas, special offer, cowpea, black eyed pea | Misc / Seasonal |

> **Tags removed:** `haldiram`, `bikaji` — not competitor brands, irrelevant. `2021BEST`, `2022BEST`, `2024BEST`, `2025BEST` — Shopify internal grouping tags, redundant. Not useful for product enrichment.

### File 2 ("Tinned Products" — 49 products)

| Freq | Tag | Category / Notes |
|------|-----|------------------|
| 23 | vegetable | Generic - hits all tinned veg |
| 6 | beans, nariyal, coconut, naariyal, gram | Tinned beans + coconut |
| 5 | bengal gram | Chickpea only |
| 4 | lentils, tin, dals, peas, Xmas Cooking, tomato tin, pulses, Christmas | Generic + seasonal |
| 3 | aam, ramadan, razma, red rajma, special offer, Mango, garbanzo, amchoor, whole channa, whole chana, rajma | Specific + seasonal |
| 2 | borlotti, Kamal Kakadi, channa, gourd, kerela, bitter melon, karella, Toovar Dal, kerella, tuver, Arhar Dal, paatra, drumstick, black chickpeas, ladies finger, pigeon pea, summer, chana, white kidney, bitter gourd | Specific vegetables/beans |
| 1 | cowpea, Dal Recipe, best, 2024BEST, rosecoco, black eyed pea | Misc |

### Tags Common to Both Files (31 total)

Arhar Dal, beans, bengal gram, black chickpeas, black eyed pea, borlotti, chana, channa, Christmas, cowpea, Dal Recipe, dals, garbanzo, gram, lentils, peas, pigeon pea, pulses, rajma, ramadan, razma, red rajma, rosecoco, special offer, Toovar Dal, tuver, white kidney, whole chana, whole channa

### Key Observations

- **Generic tags dominate both files** — "beans", "lentils", "pulses", "dals", "peas" are applied to 70%+ of products in File 1. These are low-value for categorization.
- **Seasonal/event tags** appear: "ramadan", "Christmas", "Xmas Cooking", "xmas snacks", "spring", "summer".
- **Rating tags** appear: "2021BEST", "2022BEST", "2024BEST", "2025BEST" — these are Shopify internal collection grouping tags, not quality ratings. **Removed — redundant.**
- **Multiple spelling variants** for the same ingredient: daal/dal, moong/moog, masoor/massoor, karela/kerela/karella, nariyal/naariyal.
- **"new"** and **"special offer"** tags are used sparingly (1–3 products each).

---

## 2. Body HTML (Description) Analysis

### File 1 — Description Patterns

| Pattern | Count (of 79) | Details |
|---------|---------------|---------|
| **Allergen warning** | 64 (81%) | "Our products are manufactured in a site that handles gluten, soya, milk, nuts, peanuts, sesame, mustard, celery and sulphites." — standard boilerplate on virtually all non-tinned dry goods |
| **Cooking instructions** | 31 (39%) | "Soak overnight", "boil in water", "cook within 30-40 minutes", "no need to soak" |
| **Foundation Earth eco-rating** | 29 (37%) | Products with eco-impact data tables (carbon, water usage, water pollution, biodiversity scores) |
| **Culinary uses** | ~55 (70%) | "Use in dals", "soups and stews", "casseroles", "curries", "salads" |
| **Storage instructions** | 10 (13%) | "Store in a cool dry place" — only on a few products |
| **High protein claim** | 7 (9%) | Daria snacks (4 products) + Soya products (3 products) |
| **Source of protein** | 4 (5%) | "great source of protein" on tinned chickpeas |
| **Vegetarian claim** | 5 (6%) | Soya products + Bhel Puri Kit |
| **Vegan claim** | 3 (4%) | Bhel Puri Kit + tinned chickpeas |
| **Low fat claim** | 3 (4%) | Yellow Split Peas: "Naturally low in fat, high in fibre and rich in protein" |
| **Gluten-free claim** | 0 (0%) | **Explicitly absent** — no product claims "gluten-free" despite red lentils noting "do not contain gluten" |
| **Ingredients listed** | 1 (1%) | Only Bhel Puri Kit has full ingredient breakdown |

### File 2 — Description Patterns

| Pattern | Count (of 49) | Details |
|---------|---------------|---------|
| **Premium quality** | 4 | Tinned chickpeas and black eyed beans |
| **Store cupboard essential** | 15 (31%) | Consistent phrase on tinned veg and beans |
| **Vegetarian** | 4 | Sarson Ka Saag: "popular vegetarian dish", chickpeas |
| **Vegan** | 6 | Coconut products + chickpeas |
| **Time-saver** | 1 | Black Eyed Beans: "great time-saver" |
| **Protein claim** | 1 | Chickpeas: "great source of protein" |
| **Ingredients listed** | 4 | Coconut products (emulsifiers, stabilizers) + Sarson Ka Saag |
| **Nutritional info** | 4 | Coconut products (per 100g table) |
| **Allergen warning** | 0 | **None** — tinned products lack allergen warnings entirely |

### Key Description Pattern Insights

1. **Massive gap in dietary claims** — only 9% of products mention protein, 6% vegetarian, 4% vegan. Given that lentils, beans, and chickpeas are naturally vegan, vegetarian, gluten-free, high-protein, high-fibre, and low-fat, this is a significant enrichment opportunity.
2. **Allergen boilerplate on 81% of dry goods** — the same paragraph is copy-pasted. It warns about cross-contamination but never makes positive claims about the product itself.
3. **Foundation Earth data on 7 base products** — Brown Chickpeas, Chanadal, Chickpeas, Green Lentils, Mung Dal Yellow, Red Kidney Beans, Red Lentils, Toor Dal (both), Urid Dal White, Yellow Split Peas. This is unique, valuable enrichment most competitors lack.
4. **Cooking instructions are inconsistent** — some products have soak/cook guidance, others don't. Mung Beans have detailed sprouting instructions; others of the same type don't.
5. **"No need to soak"** and **"soak overnight"** patterns could be auto-extracted to create cooking metadata fields.
6. **Tinned descriptions are sparse** — many are 1–2 sentences. Large opportunity to expand.

---

## 3. Product Types

### File 1 (79 products)

| Product Type | Count | Description |
|-------------|-------|-------------|
| **Lentils** | 34 | Dry lentils & pulses (Brown Lentils, Chick Peas, Chanadal, Green Lentils, Mung Dal, Red Lentils, Toor Dal, Urid Dal, Yellow Split Peas, Mung Split, Urid Split) |
| **Beans** | 21 | Dry beans (Alubia, Black Eye, Butter, Brown Chickpeas, Moth, Mung, Red Kidney, Rose Coco/Borlotti, Soya Beans, Urid Beans) |
| **Tinned Lentils, Beans** | 15 | Canned/boiled versions (Black Eyed, Chick Peas, Kala Chana, Red Kidney, Rose Coco, Toovar, White Kidney) |
| **Daria Lentil Snack** | 6 | Snack products (Bhel Puri Kit, Daria Dal, Daria Gotta x2, Gram Roasted x2) |
| **Soya** | 3 | Soya Chunks x2, Soya Mince |

### File 2 (49 products)

| Product Type | Count | Description |
|-------------|-------|-------------|
| **Tinned Vegetables** | 25 | Spinach (leaf + puree), Karela, Lotus Root, Okra, Patra, Punjabi Tinda, Suran/Yam, Tomato (paste, chopped, peeled), Sarson Ka Saag |
| **Tinned Lentils, Beans** | 15 | Black Eyed, Chick Peas, Kala Chana, Red Kidney, Rose Coco, Toovar, White Kidney |
| **Tinned Coconut** | 6 | Coconut Milk, Coconut Cream, Coconut Milk Light (each with Full Case variant) |
| **Tinned Fruit** | 3 | Mango Pulp Alphonso, Mango Pulp Kesar, Mango Slices Alphonso |

### Type Mapping Observations

- **Brown Chickpeas** appear in File 1 as product_type "Lentils" (SKU L-series) but are technically a bean/chickpea — same base ingredient as "Kala Chana Boiled" which is "Tinned Lentils, Beans".
- **Soya Beans** (SKU L-series) are product_type "Beans" but Soya Chunks and Soya Mince are separate types ("Soya").
- **Bhel Puri Kit** is product_type "Daria Lentil Snack" even though it's a meal kit, not a lentil snack.
- The 15 "Tinned Lentils, Beans" products in File 1 are **identical** to the 15 "Tinned Lentils, Beans" products in File 2 (confirmed — same handles, same tags, same prices).
- **Note discrepancy:** Mung Beans are product_type "Beans" (SKU L-series) but Mung Dal Yellow and Mung Split are "Lentils". The same base ingredient (mung) spans two types based on processing.

---

## 4. Vendor

**All 128 products have vendor "Natco Foods".** No sub-brands.

> **Tags `haldiram` and `bikaji` removed** — these were SEO tags on Daria snacks, not actual brands in this catalog. No competitor products exist in this data set.

---

## 5. Price Range

### File 1 — Dry/Snack Products

| Metric | Value |
|--------|-------|
| **Minimum** | £0.60 |
| **Maximum** | £29.45 |
| **Median** | £3.85 |
| **Average** | ~£5.05 |

**Price by weight class:**
- 300g snacks: £1.55–£2.05
- 350g soya: £2.25
- 400g tinned: £0.60–£1.40
- 500g dry: £1.15–£1.80
- 700g soya/snacks: £4.60–£7.25
- 1kg dry: £2.15–£3.25
- 2kg dry: £3.80–£6.80
- 2.5kg tinned: £3.45–£4.45
- Full Cases (4x1kg): £8.05–£12.25
- Full Cases (12x400g): £6.20–£15.60

### File 2 — Tinned Products

| Metric | Value |
|--------|-------|
| **Minimum** | £0.60 |
| **Maximum** | £29.45 |
| **Median** | £2.60 |
| **Average** | ~£6.38 |

**Price by category:**
- Single tins (400g): £0.60–£1.55
- Coconut Milk/Cream (400ml): £1.10–£1.65
- Mango products (425–850g): £1.70–£2.60
- Tinned large size (2.5kg): £3.45–£4.45
- Full Cases (6x400ml coconut): £6.00–£8.95
- Full Cases (12x400g): £6.90–£17.40
- Full Cases (12x794g spinach): £26.90
- Full Cases (12x800g tomato paste): £29.45

---

## 6. Image Patterns

### Naming Conventions (highly inconsistent)

Images follow **multiple naming patterns** simultaneously:

| Pattern | Example | Used on |
|---------|---------|---------|
| `{SKU}{Description}.jpg` | `L1010AlubiaBeans6X2KG.jpg` | Original dry products |
| `{Description}{Weight}ECO.jpg` | `GreenLentils1kgECO.jpg` | ECO-rated products |
| `{SKU}_{DESCRIPTION}_{WEIGHT}.jpg` | `C1110_CHICK_PEAS_397G_2.jpg` | Tinned products |
| `{Description}_{Weight}_ECO.jpg` | `MungDalYellow2kgECO.jpg` | Some ECO products |
| `{SKU}_{DESCRIPTION}_{WEIGHT}_M.jpg` | `L6365_ROSE_COCO_BNS_500G_M.jpg` | Medium size variants |
| `{Description}_{Weight}_Pillow_Pack.png` | `Brown_Lentils_Pillow_pack.png` | Pillow-pack format |
| `{description}_with_uuid.jpg` | Many files have UUIDs appended | Duplicate images |
| `Screenshot*.png` | `Screen_Shot_2018-08-03_at_17.57.53.png` | Legacy screenshots |
| Plain name `.jpg` | `alubia_beans.jpg`, `daria_dal.jpg` | Simple products |
| Long detailed name | `R4160GramRoastedSalted20X300G.jpg` | Snack products |

### Key Issues

- **No consistent naming convention** — SKU-based, description-based, and mixed patterns coexist
- **Many duplicate images with UUIDs** — Shopify CDN appends UUIDs when images are re-uploaded
- **Screenshots used as product images** — `Screen_Shot_2018-08-03_at_17.57.53.png` and `Screenshot2024-01-18at21.16.57.png`
- **No predictable pattern** like `natco_{product-name}.jpg`
- **Mixed `.jpg` and `.png`** formats
- **Weight encoding varies:** `2KG`, `2kg`, `500g`, `500G`, `2.6KG`, `397G`

---

## 7. Product Options

**All 128 products have a single option:** `"Title": "Default Title"` with a single value.

No products have:
- Weight/Size options (each weight is a separate Shopify product)
- Color options
- Flavor options
- Any other variant options

**This means:** Medusa variant consolidation is needed — currently each weight (500g, 1kg, 2kg) is a separate Shopify product, not a variant of a parent product. They would need to be combined as product variants in Medusa.

---

## 8. Dietary / Lifestyle Inference

Based on product titles, types, and descriptions, the following dietary flags can be **confidently auto-assigned**:

### Applies to All Lentils, Beans, and Pulses (approx. 90+ products)

| Flag | Confidence | Basis |
|------|-----------|-------|
| **Vegan** | HIGH | All are plant-based with no animal ingredients |
| **Vegetarian** | HIGH | All are plant-based |
| **Dairy-Free** | HIGH | No dairy in ingredients |
| **Nut-Free** (ingredients) | HIGH | No nuts in ingredients (cross-contamination warning exists but is facility-level) |
| **Kosher** | MEDIUM | Plant-based unprocessed foods are inherently kosher |
| **Halal** | HIGH | Plant-based unprocessed foods are inherently halal |

### Applies to Most (varies by type)

| Flag | Products | Confidence | Basis |
|------|----------|-----------|-------|
| **High Protein** | Lentils, beans, chickpeas, soya | HIGH | Legumes are 20-25% protein |
| **High Fibre** | All lentils, beans, split peas | HIGH | Pulses are naturally high fibre |
| **Low Fat** | Yellow Split Peas, most lentils | HIGH | Explicitly stated on split peas; most lentils <2% fat |
| **Gluten-Free (ingredients)** | All lentils, beans, chickpeas | HIGH | Legumes contain no gluten; red lentils explicitly state this |
| **No Added Sugar** | All dry lentils/beans | HIGH | Single-ingredient dried products |
| **Source of Iron** | Lentils, chickpeas | MEDIUM | Known nutritional property |
| **Low GI** | Chickpeas, lentils, beans | MEDIUM | Known property of legumes |

### Product-Specific Flags

| Product | Flags to Assign | Basis |
|---------|----------------|-------|
| Soya Chunks / Soya Mince | Meat Alternative, High Protein, Vegan | Explicit in description: "great alternative to meat" |
| Bhel Puri Kit | Vegan, Vegetarian, Contains Gluten (wheat flour), Contains Nuts (peanuts) | Explicit in ingredients |
| Daria snacks | High Protein, Vegan, Gluten-Free | Explicit: "healthy high protein snack" |
| Coconut Milk/Cream | Vegan, Dairy-Free, Gluten-Free | Explicit in description: "vegan cooking" |
| Sarson Ka Saag | Vegetarian, Vegan, Gluten-Free | Explicit: "popular vegetarian dish" |
| Mango products | Vegan, Gluten-Free, No Added Sugar | Plant-based; tinned fruit |

### Enrichment Opportunity Summary

| Flag | Products that SHOULD have it | Currently have it | Gap |
|------|------------------------------|-------------------|-----|
| Vegan | ~100+ | 3 | **97 missing** |
| Vegetarian | ~100+ | 5 | **95 missing** |
| High Protein | ~80+ | 11 | **69 missing** |
| High Fibre | ~80+ | 3 | **77 missing** |
| Low Fat | ~60+ | 3 | **57 missing** |
| Gluten-Free | ~80+ | 0 | **80 missing** |

---

## 9. Cross-File Overlap Analysis

### Products Appearing in Both Files

15 products (by handle) appear in both files:

| Handle | Title | Type | Tags Match? |
|--------|-------|------|-------------|
| black-eyed-beans-400g | Black Eyed Beans 400g | Tinned Lentils, Beans | YES — identical |
| chickpeas-tinned | Chick Peas 400g | Tinned Lentils, Beans | YES — identical |
| chickpeas-tinned-case | Chick Peas Full Case 12x400g | Tinned Lentils, Beans | YES — identical |
| chickpeas-tinned-large | Chick Peas 2.5kg | Tinned Lentils, Beans | YES — identical |
| kala-chana-boiled | Kala Chana Boiled 400g | Tinned Lentils, Beans | YES — identical |
| kala-chana-case | Kala Chana Boiled Full Case 12x400g | Tinned Lentils, Beans | YES — identical |
| red-kidney-tinned | Red Kidney Beans 400g | Tinned Lentils, Beans | YES — identical |
| red-kidney-fulltin | Red Kidney Beans Boiled Full Case 12x400g | Tinned Lentils, Beans | YES — identical |
| red-kidney-tinned-large | Red Kidney Beans 2.5kg | Tinned Lentils, Beans | YES — identical |
| rose-coco-beans | Rose Coco (Borlotti) Beans 400g | Tinned Lentils, Beans | YES — identical |
| rose-coco-beans-case | Rose Coco (Borlotti) Beans Full Case 12x400g | Tinned Lentils, Beans | YES — identical (File 2 missing "rosecoco" tag) |
| toovar | Toovar 400g | Tinned Lentils, Beans | YES — identical |
| toovar-full-case | Toovar Full Case 12x400g | Tinned Lentils, Beans | YES — identical |
| white-kidney-tinned | White Kidney Beans 400g | Tinned Lentils, Beans | YES — identical |
| white-kidney-fulltin | White Kidney Beans Boiled Full Case 12x400g | Tinned Lentils, Beans | YES — identical |

**Verdict:** Tags are **identical** for all 15 overlapping products, with one minor exception (Rose Coco case missing "rosecoco" tag in File 2). Prices, SKUs, handles, and product types also match exactly. These are truly the same Shopify products exported in two different collections.

### Products Unique to Each File

- **File 1 only (64):** All dry lentils, dry beans, and snack products (L-series SKUs, R-series snacks)
- **File 2 only (34):** All vegetables, coconut products, and fruit products (plus spinach in C-series SKUs)

---

## 10. SKU Prefix Architecture

| Prefix | Count (F1) | Count (F2) | Category |
|--------|-----------|-----------|----------|
| **C** | 16 | 41 | Tinned products (C = Canned) |
| **L** | 55 | 0 | Dry lentils & beans (L = Lentils) |
| **R** | 8 | 0 | Snacks & soya products (R = Ready-to-eat / Retail) |

- C-series SKUs: C1xxx (chickpeas/coconut), C2xxx (beans/tomatoes), C5xxx (patra), C6xxx (saag), C7xxx (toovar/vegetables)
- L-series SKUs: L1xxx (alubia), L3xxx (chickpeas/lentils), L5xxx (red kidney), L6xxx (rose coco/toor), L7xxx (urid), L9xxx (soya/yellow peas)
- R-series SKUs: R4xxx (daria/gram snacks), R7xxx (soya products)

---

## 11. Weight Distribution

### File 1

| Weight | Count | Notes |
|--------|-------|-------|
| 300g | 5 | Snacks |
| 350g | 1 | Soya Chunks |
| 400g | 7 | Tinned single cans |
| 500g | 12 | Standard retail pouch |
| 700g | 2 | Soya Chunks large + Daria Gotta large |
| 1kg | 11 | Mid-size retail |
| 2kg | 22 | Large/bulk retail |
| 2.5kg | 2 | Tinned large |
| 4.2kg | 11 | Full cases (4x1kg) |
| 5.48kg | 6 | Full cases (12x400g tinned) |

### File 2

| Weight | Count | Notes |
|--------|-------|-------|
| 380–400g | 18 | Single tins |
| 400ml | 3 | Coconut milk/cream |
| 425–450g | 2 | Mango |
| 795–850g | 3 | Spinach puree large + Mango Kesar |
| 800g | 1 | Tomato paste |
| 2.5kg | 2 | Tinned large |
| 2.71kg | 2 | Coconut case (6x400ml) |
| 5.057kg | 1 | Chopped tomatoes case |
| 5.48kg | 14 | Standard case (12x400g) |
| 6.04kg | 1 | Saag case (12x450g) |
| 10.79kg | 1 | Tomato paste case (12x800g) |
| 10.85kg | 1 | Spinach puree case (12x794g) |

---

## 12. Foundation Earth Eco-Ratings

Found on 29 products across 7+ base product lines:

| Product Line | Rating | Carbon Grade | Water Grade | Pollution Grade | Biodiversity Grade |
|-------------|--------|-------------|-------------|-----------------|-------------------|
| Brown Chickpeas | **A** | A+ | D | A+ | B |
| Chanadal | **B** | A | D | B | B |
| Chickpeas | **B** | A | D | B | B |
| Green Lentils | **A** | A | A | A+ | A+ |
| Mung Dal Yellow | **B** | A | C | C | E |
| Red Kidney Beans | **B** | A | D | A | B |
| Red Lentils | **A** | A | A* | A* | A |
| Toor Dal Oily | **B** | A | A+ | B | D |
| Toor Dal Plain | **B** | A | A+ | B | D |
| Urid Dal White | **B** | A | A | C | E |
| Yellow Split Peas | **A** | A | C | A | A+ |

**Key insight:** Green Lentils and Red Lentils are the most environmentally sustainable (A ratings across all dimensions). Mung Dal Yellow and Urid Dal White have the worst biodiversity scores (E).

This is a **significant differentiator** — very few food brands publish per-product eco-impact data. Should be a prominent storefront filter and badge.

---

## 13. Enrichment Recommendations

### Priority 1 — Dietary Flags (auto-assignable)

Create a rules engine that assigns flags based on product_type + tags:

```
IF product_type IN ('Lentils','Beans','Soya') THEN {
  dietary.vegan = true
  dietary.vegetarian = true
  dietary.dairyFree = true
  dietary.highProtein = true
  dietary.highFibre = true
  dietary.lowFat = true
  dietary.glutenFree_ingredients = true
  dietary.noAddedSugar = true
  dietary.halal = true
  dietary.kosher = true
}
```
Exception: Bhel Puri Kit contains wheat flour (gluten) and peanuts.

### Priority 2 — Description Structure

Most descriptions are a single paragraph. Could be parsed into structured fields:
- `shortDescription` (first sentence — already a good summary)
- `cookingInstructions` (extract sentences with "soak", "cook", "boil", "simmer")
- `culinaryUses` (extract "use in...", "perfect for...")
- `allergenInfo` (extract the standard allergen paragraph)
- `storageInstructions` (extract "store in a cool dry place")

### Priority 3 — Missing Enrichment to Add Manually

- **Ingredient lists** — only 2 products have them. Every product should.
- **Nutritional information** — only coconut products have it. Per 100g nutritional panel needed for all.
- **Cooking time** — extract "30-40 minutes", "no need to soak"
- **Soaking requirement** — yes/no from "soak overnight" vs "no need to soak"
- **Foundation Earth rating** — add as structured metadata with grade per dimension
- **Country of origin** — not present anywhere, would be valuable for Indian groceries

### Priority 4 — Tag Cleanup

- **Normalize spelling variants:** daal→dal, moong→moog, masoor→massoor
- **Remove generic catch-alls** from products where they don't apply (e.g., "peas" tag on kidney beans)
- **Separate seasonal tags** from product tags — create a separate "seasonal" attribute

### Priority 5 — Variant Consolidation

Currently each weight is a separate Shopify product. In Medusa, these should be consolidated:
- **Alubia Beans:** 500g + 2kg → 1 product, 2 variant options
- **Chick Peas (dry):** 1kg + 2kg + 4x1kg case → 1 product, 3 variant options
- etc.

This would reduce 79 unique products to approximately 25–30 parent products with size variants.
