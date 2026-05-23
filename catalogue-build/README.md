# IndiaGrocers — Catalogue Build

**Target market:** Premium online Indian grocery, South London (Croydon, Sutton, Tooting)
**Community focus:** South Asian — Punjabi, Gujarati, Tamil, Telugu, Bangladeshi, Pakistani
**Wholesale channels:** TRS, East End Foods, Dhamecha, Bestway, Natco, specialist importers
**Last updated:** May 2026

---

## File Index

| File | Category | Approx. SKUs |
|------|----------|-------------|
| [01-rice-and-atta.md](./01-rice-and-atta.md) | Rice & Atta (Flours) | ~120 |
| [02-lentils-pulses-dals.md](./02-lentils-pulses-dals.md) | Lentils, Pulses & Dals | ~130 |
| [03-everyday-spices-powders.md](./03-everyday-spices-powders.md) | Everyday Spices & Powders | ~180 |
| [04-branded-masalas-dessert-mixes.md](./04-branded-masalas-dessert-mixes.md) | Branded Masalas & Dessert Mixes | ~160 |
| [05-savoury-namkeens-biscuits.md](./05-savoury-namkeens-biscuits.md) | Namkeens, Biscuits & Snacks | ~150 |
| [06-ready-to-eat-instant-mixes-frozen.md](./06-ready-to-eat-instant-mixes-frozen.md) | Ready-to-Eat, Instant Mixes & Frozen | ~130 |
| [07-confectionery-sweets.md](./07-confectionery-sweets.md) | Confectionery & Sweets | ~100 |
| [08-beverages-teas-coffees.md](./08-beverages-teas-coffees.md) | Beverages, Teas & Coffees | ~140 |
| [09-pickles-pastes-accompaniments.md](./09-pickles-pastes-accompaniments.md) | Pickles, Pastes & Accompaniments | ~170 |

**Total estimated SKU count (across all sizes/variants): ~1,280**

---

## SKU Format Convention

Every line item is written as:

```
- [Brand Name] [Exact Product Name / Sub-Type] (UK Market Sizes)
```

Example:
```
- Tilda Pure Original Basmati Rice (500g, 1kg, 2kg, 5kg, 10kg, 20kg)
```

Each size is treated as a separate SKU in Medusa.

---

## Priority Tiers (Procurement Guidance)

### Tier 1 — Never Out of Stock
These are weekly repurchase essentials. A stockout costs you the customer.

| Product | Brand |
|---------|-------|
| Chakki Atta | Elephant, Pillsbury, Aashirvaad |
| Basmati Rice | Tilda, Kohinoor, Lal Qilla |
| Toor Dal Oily | TRS, East End |
| Red Split Lentils | TRS, East End |
| Turmeric, Chilli, Coriander Powder | TRS, East End, MDH |
| Garam Masala | TRS, MDH, Everest |
| Ginger-Garlic Paste 1kg | TRS, East End, Heera |
| Plain Roti / Paratha (Frozen) | Shana |
| Brooke Bond Red Label Tea | 500g, 1kg |
| Wagh Bakri Tea | 500g, 1kg |
| Rooh Afza | 750ml, 1.5L |
| Maggi Hot & Sweet Sauce | 400g, 1kg |

### Tier 2 — Strong Weekly Demand
Stock at 2–3 weeks cover minimum.

- Full Shan masala range (60g sachets)
- MDH Kitchen King, Chana Masala, Deggi Mirch
- Haldiram's Aloo Bhujia, Moong Dal, All In One Mix (200g/400g)
- Parle-G (400g, 1kg)
- Britannia Good Day (Butter, Cashew)
- MTR Idli Mix, Rava Idli Mix, Khaman Dhokla Mix (500g)
- Priya Mango Pickle, Gongura Pickle (300g, 500g)
- Patak's Mango Chutney, Lime Pickle
- Sona Masoori Rice (5kg, 10kg) — Tooting South Indian community
- Udhayam / Continental Filter Coffee

### Tier 3 — Seasonal / Festival Peak-Buy
Order 6–8 weeks ahead of festival season.

| Festival | Key Lines |
|----------|-----------|
| Diwali (Oct) | Soan Papdi (all brands), Kaju Katli, Haldiram's Gift Tins, Karachi Bakery Fruit Biscuits |
| Ramadan (date varies) | Rooh Afza ×4 normal, Dates (all varieties), Seviyan/Vermicelli, Laziza dessert mixes |
| Navratri (Oct) | Kuttu Atta, Singhara Atta, Sabudana, Makhana, Farali Chivda |
| Eid-ul-Adha | National/Shan halal masalas, Haleem Mix ×3 normal |
| Karva Chauth | Kala Chana, Halwa mixes |

---

## Community-Specific Must-Haves

### Tooting (Tamil / Telugu / Kannada)
- Udhayam / Leo / Continental Filter Coffee
- Idli Rice, Sona Masoori, Ponni Rice, Parboiled Rice
- MTR Idli/Dosa/Upma mixes
- Aachi Pickles full range
- Bovonto fizzy drink
- Gingelly / Sesame Oil (Idhayam brand)
- Priya Gongura Pickle

### Croydon / Sutton (Punjabi / Gujarati / North Indian)
- 10kg/20kg Atta sacks
- 10kg/20kg Basmati (Falak, Lal Qilla)
- MDH Kitchen King, Rajma Masala, Paneer Butter Masala
- Everest Pav Bhaji Masala, Tikhalela Masala
- Gujarati Farsan: Gathiya, Fafda, Chivda, Boondi
- Vandevi Asafoetida
- Haldiram's full namkeen range

### Pakistani Community (Tooting / Croydon crossover)
- Full Shan masala range
- National Foods pickles and masalas
- Laziza / Shan dessert mixes
- Haleem Mix (Shan, National)
- Falak / Zebra Super Basmati
- Toor Dal Dry (not oily)

---

## Next Steps for Catalogue Team

1. **Pricing** — Pull wholesale cost prices from TRS pricelist (request from rep)
   and Dhamecha/Bestway catalogue. Apply 35–45% margin on commodity lines,
   25–35% on branded premium.

2. **Medusa import** — Convert each line item into a Medusa product with:
   - `title`: Brand + Product Name
   - `subtitle`: Sub-type (e.g., "Oily" / "Washed White")
   - `variants`: one per pack size with `sku`, `price_GBP`, `weight_g`
   - `collection`: category slug
   - `tags`: community tags (e.g., `south-indian`, `punjabi`, `halal`)

3. **Images** — Source from TRS/East End/brand press packs.
   Avoid screenshot scraping; request trade press images.

4. **Retiring products** — Flag slow movers after 90 days of sales data.
   Products with zero sales in 60 days and no festival dependency should be
   delisted. Maintain this catalogue as the master reference.

5. **Additions cadence** — Review quarterly. Key windows:
   - January: New year health products (Chyawanprash, herbal teas, millets)
   - March: Holi (colours — non-food crossover)
   - August–September: Pre-Navratri fasting range top-up
   - September–October: Diwali gifting range
