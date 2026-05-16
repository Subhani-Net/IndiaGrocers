# IndiaGrocers London — Backend Plan

> **Stack:** MedusaJS v2.15.2 + PostgreSQL 16 (Docker) + Redis 7 (Docker)
> **Admin:** http://localhost:9000/app — `admin@example.com` / `password123`

## Status Legend
- ✅ Done
- 🔷 In Progress
- ⬜ Not Started

---

## Phase B1: Infrastructure ✅

| ID | Task | Details | Status |
|---|---|---|---|
| B-1.1 | PostgreSQL via Docker | `postgres:16`, port 5432, `medusa:medusa`, db `indiagrocers` | ✅ |
| B-1.2 | Redis via Docker | `redis:7-alpine`, port 6379 | ✅ |
| B-1.3 | MedusaJS v2.15.2 installed | `create-medusa-app` scaffold, `@medusajs/dashboard` included | ✅ |
| B-1.4 | Docker Compose file | `docker-compose.yml` with postgres + redis + persistent volumes | ✅ |
| B-1.5 | env configured | `DATABASE_URL`, `REDIS_URL`, CORS for localhost:8000 | ✅ |
| B-1.6 | Git installed | Required for project setup | ✅ |

---

## Phase B2: Store Configuration ✅

| ID | Task | Details | Status |
|---|---|---|---|
| B-2.1 | Store name & currency | IndiaGrocers London, GBP default | ✅ |
| B-2.2 | UK Region | Region "UK", currency GBP, country gb | ✅ |
| B-2.3 | UK Tax Region | System tax provider assigned to gb | ✅ |
| B-2.4 | London Warehouse | Stock location: London, GB | ✅ |
| B-2.5 | London Delivery Fulfillment | Fulfillment set: London Delivery, UK Mainland geo-zone | ✅ |
| B-2.6 | Shipping Options | Standard (£3.99, 3-5 days) & Express (£6.99, next day) | ✅ |
| B-2.7 | Sales Channel | Default Sales Channel | ✅ |
| B-2.8 | Publishable API Key | Default key for storefront | ✅ |
| B-2.9 | Admin User | `admin@example.com` / `password123` | ✅ |
| B-2.10 | CORS | Storefront at `localhost:8000` allowed | ✅ |

---

## Phase B3: Category Hierarchy ✅

> 16 parent categories, 42 subcategories created via `initial-data-seed.ts`

| ID | Parent | Subcategories | Status |
|---|---|---|---|
| B-3.1 | Rice & Grains | Basmati Rice, Sona Masoori, Ponni Boiled, Idli Rice | ✅ |
| B-3.2 | Dals & Lentils | Toor Dal, Moong Dal, Masoor Dal, Chana Dal, Urad Dal, Kabuli Chana | ✅ |
| B-3.3 | Spices & Masalas | Turmeric, Chilli Powder, Cumin, Coriander, Garam Masala, Chicken Masala, Whole Spices | ✅ |
| B-3.4 | Cooking Oils & Ghee | Mustard Oil, Sunflower Oil, Ghee, Coconut Oil, Groundnut Oil | ✅ |
| B-3.5 | Flours & Grains | Wheat Atta, Besan, Rice Flour, Sooji, Maida | ✅ |
| B-3.6 | Snacks & Namkeen | Bhujia, Namkeen, Chips, Biscuits | ✅ |
| B-3.7 | Beverages | Tea, Coffee, Drinks | ✅ |
| B-3.8 | Pickles & Chutneys | Mango Pickle, Lime Pickle, Mixed Pickle, Chutneys | ✅ |
| B-3.9 | Papads & Fryums | — | ✅ |
| B-3.10 | Frozen Foods | Frozen Snacks, Frozen Paratha | ✅ |
| B-3.11 | Sweets & Mithai | Laddu, Barfi, Canned Sweets | ✅ |
| B-3.12 | Noodles & Pasta | Instant Noodles, Pasta | ✅ |
| B-3.13 | Sauces & Ketchup | — | ✅ |
| B-3.14 | Dairy & Milk Products | — | ✅ |
| B-3.15 | Ready to Eat | Curry Pouches, Breakfast Mixes | ✅ |
| B-3.16 | Fresh Vegetables | Onions, Potatoes, Tomatoes | ✅ |

---

## Phase B4: Seed Products 🔷

> Products seeded directly in `initial-data-seed.ts` (8 products, 20 variants)

| ID | Product | Brands | Variants | Status |
|---|---|---|---|---|
| B-4.1 | Basmati Rice | India Gate, Daawat | 1kg, 5kg, 10kg | ✅ |
| B-4.2 | Toor Dal | Deepak, Tata Sampann, Laxmi | 500g, 1kg, 2kg | ✅ |
| B-4.3 | Fresh Onions | — | Loose 1kg, Bag 5kg | ✅ |
| B-4.4 | Fresh Potatoes | — | Loose 1kg, Bag 5kg | ✅ |
| B-4.5 | More seed products needed | — | — | ⬜ |

---

## Phase B5: Full Catalog — CSV Import 🔷

> Target: 200+ SKUs across all 16 categories. CSV at `src/seed/indian-grocery-catalog.csv`

| ID | Task | SKUs | Status |
|---|---|---|---|
| B-5.1 | CSV format validated | v2 column names: `Variant Price GBP`, `Variant Option 1 Name/Value`, etc. | ✅ |
| B-5.2 | Rice & Grains (Basmati, Sona Masoori, Ponni, Idli, Brown Rice, Matta, Jeeraga Samba) — multi-brand + multi-weight | ~20 | ⬜ |
| B-5.3 | Dals & Lentils (Toor, Moong, Masoor, Chana, Urad, Kabuli) — 3 brands each, 2-3 weights | ~40 | ⬜ |
| B-5.4 | Spices & Masalas (Turmeric, Chilli, Cumin, Coriander, Garam Masala, Curry Masala, Cardamom, Cloves, Cinnamon, Fennel, Mustard Seeds, Fenugreek, Asafoetida) — multi-weight | ~35 | ⬜ |
| B-5.5 | Cooking Oils & Ghee (Mustard, Sunflower, Coconut, Groundnut, Ghee) — multi-size | ~15 | ⬜ |
| B-5.6 | Flours (Atta, Besan, Rice Flour, Sooji, Maida, Jowar, Bajra, Ragi) — multi-brand + multi-weight | ~30 | ⬜ |
| B-5.7 | Snacks & Namkeen (Bhujia, Moong Dal, Mixture, Kurkure, Lays, Bingo, Parle-G, Britannia, Good Day, Oreo) — multi-weight | ~25 | ⬜ |
| B-5.8 | Beverages (Tea: Taj Mahal, Red Label, Tetley; Coffee: Bru, Nescafe; Drinks: Rooh Afza, Maaza, Tang, Coconut Water) — multi-weight/size | ~20 | ⬜ |
| B-5.9 | Pickles & Chutneys (Mango, Lime, Mixed, Chilli, Garlic, Coriander, Tamarind, Mango Chutney) | ~15 | ⬜ |
| B-5.10 | Papads & Fryums (Moong Papad, Udad Papad, Rice Papad, Mixed Fryums, Chilli Fryums) | ~10 | ⬜ |
| B-5.11 | Frozen Foods (Samosas, Parathas, Idli Batter, Gobi Manchurian, Paneer Tikka) | ~12 | ⬜ |
| B-5.12 | Sweets & Mithai (Laddu, Soan Papdi, Kaju Katli, Gulab Jamun, Rasgulla) | ~10 | ⬜ |
| B-5.13 | Noodles & Pasta (Maggi, Top Ramen, Yippee, Penne, Macaroni) — multi-variant | ~12 | ⬜ |
| B-5.14 | Sauces (Tomato Ketchup, Green Chilli Sauce, Soy Sauce, Vinegar) | ~8 | ⬜ |
| B-5.15 | Dairy (Amul Butter, Paneer, Cheese Block, Curd, Milk Powder) | ~10 | ⬜ |
| B-5.16 | Ready to Eat (Dal Makhani, PBM, Chana Masala, Biryani, Upma, Poha, Idli, Dosa Mix) | ~12 | ⬜ |
| B-5.17 | Fresh Vegetables (Onions, Potatoes, Tomatoes — loose & bag variants; expand to Okra, Aubergine, Drumstick, Methi, etc.) | ~15 | ⬜ |
| B-5.18 | Import CSV via Admin UI | Upload and verify all SKUs load correctly | ⬜ |
| B-5.19 | Fix import errors | Handle duplicate handles, missing references, validation failures | ⬜ |

---

## Phase B6: Product Images

| ID | Task | Details | Status |
|---|---|---|---|
| B-6.1 | File storage configured | Local storage (`uploads/`) for dev; plan S3 for production | ⬜ |
| B-6.2 | Upload placeholder images | Per-category placeholder product images | ⬜ |
| B-6.3 | Link images to seeded products | Update products with image URLs | ⬜ |

---

## Phase B7: Payment & Tax

| ID | Task | Details | Status |
|---|---|---|---|
| B-7.1 | Configure Stripe payment | Stripe API keys, webhook setup for GBP payments | ⬜ |
| B-7.2 | Manual payment fallback | Already available (pp_system_default) | ✅ |
| B-7.3 | UK VAT tax rates | 0% for most food items, 20% VAT for non-essentials | ⬜ |
| B-7.4 | Tax overrides per product | Assign correct tax rate to each product category | ⬜ |
| B-7.5 | Test payment flow | End-to-end test: add to cart → checkout → pay → order confirmed | ⬜ |

---

## Phase B8: Inventory Management

| ID | Task | Details | Status |
|---|---|---|---|
| B-8.1 | Set inventory levels for seeded products | All seeded products have 1M stock each (done in seed) | ✅ |
| B-8.2 | Per-product inventory tracking | Enable `manage_inventory: true` on all variants | ⬜ |
| B-8.3 | Low stock alerts | Configure admin notifications when stock drops below threshold | ⬜ |

---

## Phase B9: Shipping Enhancements

| ID | Task | Details | Status |
|---|---|---|---|
| B-9.1 | Free shipping threshold | Free delivery for orders ≥ £40 (rule-based) | ⬜ |
| B-9.2 | Postcode-based shipping zones | Restrict delivery to specific London postcodes | ⬜ |
| B-9.3 | Next-day cutoff time | 2:00 PM cutoff for Express delivery | ⬜ |
| B-9.4 | Weight-based shipping | Additional charges for heavy/bulky items | ⬜ |

---

## Phase B10: Email & Notifications

| ID | Task | Details | Status |
|---|---|---|---|
| B-10.1 | Order confirmation emails | Template for order confirmed, customer-facing | ⬜ |
| B-10.2 | Order shipped notification | Tracking link, delivery ETA | ⬜ |
| B-10.3 | Admin notifications | New order, low stock alerts for admin user | ⬜ |

---

## Progress Summary

| Phase | Total | Done | Progress |
|---|---|---|---|
| B1 — Infrastructure | 6 | 6 | ██████████ 100% |
| B2 — Store Configuration | 10 | 10 | ██████████ 100% |
| B3 — Category Hierarchy | 16 | 16 | ██████████ 100% |
| B4 — Seed Products | 5 | 4 | ████████░░ 80% |
| B5 — Full Catalog (CSV) | 19 | 1 | █░░░░░░░░░ 5% |
| B6 — Product Images | 3 | 0 | ⬜ 0% |
| B7 — Payment & Tax | 5 | 1 | ██░░░░░░░░ 20% |
| B8 — Inventory | 3 | 1 | ███░░░░░░░ 33% |
| B9 — Shipping Enhancements | 4 | 0 | ⬜ 0% |
| B10 — Email & Notifications | 3 | 0 | ⬜ 0% |
| **Total** | **74** | **39** | **53%** |
