# Natco Foods — Product Data Analysis Master View

Source: https://shop.natcofoods.com  
Date: May 2026  
Collections analyzed: All Lentils (79), Tinned Products (49)  
Unique products: 113 (15 products appear in both collections)

---

## 1. COLLECTIONS ANALYZED

| Collection | Products | Unique Types | Shopify URL |
|------------|----------|-------------|-------------|
| All Lentils | 79 | 5 | /collections/all-lentils |
| Tinned Products | 49 | 4 | /collections/tinned-products |
| **Combined** | **128** (113 unique) | **7** | — |

---

## 2. PRODUCTS BY NATCO TYPE

| Natco Type | Count | Examples |
|------------|-------|----------|
| Lentils | 34 | Brown Lentils, Chanadal, Chick Peas, Green Lentils, Mung Dal, Red Lentils, Toor Dal, Urid Dal, Yellow Split Peas, Mung Split, Urid Split |
| Beans | 21 | Alubia, Black Eye, Butter, Brown Chick Peas, Moth, Mung, Red Kidney, Rose Coco, Soya Beans, Urid Beans |
| Tinned Vegetables | 25 | Spinach, Karela, Lotus Root, Okra, Patra, Punjabi Tinda, Suran/Yam, Tomato, Sarson Ka Saag |
| Tinned Lentils, Beans | 15 | Black Eyed, Chick Peas, Kala Chana, Red Kidney, Rose Coco, Toovar, White Kidney |
| Daria Lentil Snack | 6 | Bhel Puri Kit, Daria Dal, Daria Gotta, Gram Roasted |
| Tinned Coconut | 6 | Coconut Milk, Coconut Cream, Coconut Milk Light |
| Soya | 3 | Soya Chunks, Soya Mince |
| Tinned Fruit | 3 | Mango Pulp, Mango Slices |

---

## 3. NATCO SUBCATEGORY MAPPING

| Our Subcategory | Natco Types | Count |
|-----------------|-------------|-------|
| dried-lentils-beans-peas | Lentils + Beans | 53 |
| tinned-vegetables | Tinned Vegetables | 25 |
| tinned-lentils-beans | Tinned Lentils, Beans | 15 |
| namkeen-lentil-snacks | Daria Lentil Snack | 6 |
| tinned-coconut | Tinned Coconut | 6 |
| soya-products | Soya | 5 |
| tinned-fruit | Tinned Fruit | 3 |

---

## 4. TAGS — CLEANED (haldiram, bikaji removed; BEST year tags removed)

### Most Frequent (≥5 products)

| Count | Tag | Applies To |
|-------|-----|-----------|
| 58 | beans | Most dry lentils & beans |
| 56 | lentils | Most dry lentils & beans |
| 56 | pulses | Most dry lentils & beans |
| 56 | dals | Most dry lentils & beans |
| 56 | peas | Most dry lentils & beans |
| 48 | daal | Alternate spelling |
| 23 | vegetable | All tinned vegetables |
| 19 | gram | Chickpea family |
| 11 | bengal gram | Chickpea variant |
| 8 | garbanzo | Chickpea |
| 6 | coconut, nariyal, naariyal | Coconut products |

### Seasonal Tags

| Tag | Products | Season |
|-----|----------|--------|
| ramadan | 7 | Ramadan |
| Christmas, Xmas Cooking, xmas snacks | 6 | Christmas |
| spring | 1 | Spring |
| summer | 1 | Summer |

### Spelling Variants (need normalization)

```
daal (48) → dal (5)
moong (7) → moog (3)
masoor (3) → massoor (3)
karela (2) → kerela (3) → kerella (2)
nariyal (6) → naariyal (6)
```

### Removed (redundant/irrelevant)

```
haldiram, bikaji — removed (not applicable to this catalog)
2021BEST, 2022BEST, 2024BEST, 2025BEST — removed (Shopify internal grouping, redundant)
```

---

## 5. PRICE RANGES

| Category | Min | Max | Median |
|----------|-----|-----|--------|
| 300g snacks | £1.55 | £2.05 | £1.80 |
| 400g tinned single | £0.60 | £1.55 | £0.65 |
| 500g dry | £1.15 | £1.80 | £1.40 |
| 1kg dry | £2.15 | £3.25 | £2.70 |
| 2kg dry | £3.80 | £6.80 | £4.20 |
| 2.5kg tinned | £3.45 | £4.45 | £3.95 |
| Full cases (4x1kg) | £8.05 | £12.25 | £10.00 |
| Full cases (12x400g) | £6.20 | £17.40 | £9.50 |

---

## 6. DIETARY FLAGS — Auto-Assignable

All lentils, beans, and pulses (90+ products) qualify for these with HIGH confidence:

| Flag | Products | Currently Claimed | Gap |
|------|----------|------------------|-----|
| Vegan | 100+ | 3 | **97** |
| Vegetarian | 100+ | 5 | **95** |
| Dairy-Free | 100+ | 0 | **100** |
| High Protein | 80+ | 11 | **69** |
| High Fibre | 80+ | 3 | **77** |
| Low Fat | 60+ | 3 | **57** |
| Gluten-Free | 80+ | 0 | **80** |
| No Added Sugar | 90+ | 0 | **90** |
| Halal | 90+ | 0 | **90** |

---

## 7. ECO-RATINGS (Foundation Earth)

29 products across 11 product lines have eco-impact data:

| Product | Overall | Carbon | Water | Pollution | Biodiversity |
|---------|---------|--------|-------|-----------|-------------|
| Green Lentils | **A** | A | A | A+ | A+ |
| Red Lentils | **A** | A | A* | A* | A |
| Brown Chickpeas | **A** | A+ | D | A+ | B |
| Yellow Split Peas | **A** | A | C | A | A+ |
| Chanadal | **B** | A | D | B | B |
| Chickpeas | **B** | A | D | B | B |
| Red Kidney Beans | **B** | A | D | A | B |
| Toor Dal Oily | **B** | A | A+ | B | D |
| Toor Dal Plain | **B** | A | A+ | B | D |
| Mung Dal Yellow | **B** | A | C | C | E |
| Urid Dal White | **B** | A | A | C | E |

---

## 8. SKU PREFIX ARCHITECTURE

| Prefix | Count | Category | Pattern |
|--------|-------|----------|---------|
| **L** | 55 | Dry lentils & beans | L1xxx=alubia, L3xxx=chickpeas/lentils, L5xxx=kidney, L6xxx=borlotti/toor, L7xxx=urid, L9xxx=soya/yellow peas |
| **C** | 57 | Tinned products | C1xxx=chickpeas/coconut, C2xxx=beans/tomatoes, C5xxx=patra, C6xxx=saag, C7xxx=toovar/vegetables |
| **R** | 8 | Snacks & soya | R4xxx=daria/gram snacks, R7xxx=soya products |

---

## 9. VARIANT STRUCTURE (needs consolidation for Medusa)

All products are single-sku (one weight = one product). Should consolidate:

| Product Line | Current | Consolidated |
|-------------|---------|-------------|
| Alubia Beans | 500g + 2kg (2 products) | 1 product, 2 variants |
| Chick Peas (dry) | 1kg + 2kg + 4x1kg (3 products) | 1 product, 3 variants |
| Red Kidney Beans (dry) | 1kg + 2kg + 4x1kg (3 products) | 1 product, 3 variants |
| Green Lentils | 1kg + 2kg + 4x1kg (3 products) | 1 product, 3 variants |
| ... and 20+ more product lines | 2-3 products each | 1 product each |

**Impact:** 79 "All Lentils" products → ~25-30 parent products with size variants.

## 11. Design Principles

See `ENRICHMENT-ARCHITECTURE.md` sections 7-8 for complete design principle registry.
Key principles applicable to this data:

- **DP-01** `SEARCH-ORDERING-PSEUDO-QUERY.md` — Category browsing relevance through tag-based pseudo-queries
- **DP-02** Many-to-many collections (deferred)
- **DP-03** Variant consolidation
- **DP-04** Eco-rating badges
- **DP-05** Dietary filter system

---

## 12. Files in Data-Design

| File | Contents |
|------|----------|
| `lentils-master.csv` | 79 products, categorized (42 in our catalog, 37 missing) |
| `tinned-products-master.csv` | 49 products, categorized (not yet cross-referenced) |
| `natco-product-attributes-analysis.md` | Full detail analysis (tags, prices, dietary, eco, variants) |
| `DECISION-TREE.md` | Pipeline decisions log (in `scripts/data-pipeline/`) |
| `snapshots/` | Version history of all CSV files |
