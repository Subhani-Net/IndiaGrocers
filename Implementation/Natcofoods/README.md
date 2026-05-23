# IndiaGrocers London — Implementation Tracker

> **Stack:** MedusaJS v2.15.2 (backend) + Next.js 15 (storefront) + PostgreSQL + Redis
> **Last updated:** May 2026

---

## 📂 Plans & Docs

| Document | Purpose | Status |
|---|---|---|
| [PERFORMANCE-CACHING.md](./PERFORMANCE-CACHING.md) | Caching strategy, ISR, localStorage, image optimization | ✅ |
| [STORE-FRONT-FEATURE-REQS.md](./STORE-FRONT-FEATURE-REQS.md) | Feature requirements (52 done, 6 pending) | 52/58 |
| [STORE-FRONT-LAUNCH-PLAN.md](./STORE-FRONT-LAUNCH-PLAN.md) | Launch plan & issues | 81% (55/68) |
| [STORE-FRONT-PLAN.md](./STORE-FRONT-PLAN.md) | Original build plan | 83% (38/46) |
| [BACKEND-PLAN.md](./BACKEND-PLAN.md) | Backend build plan | 53% (39/74) |
| [BACKEND-DEPS-MAP.md](./BACKEND-DEPS-MAP.md) | Dependency mapping | Reference |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+, Docker Desktop

### 1. Start Docker services
```powershell
docker compose -f C:\IndiaGrocers\docker-compose.yml up -d
```

### 2. Start Medusa backend
```powershell
cd C:\IndiaGrocers\apps\backend
npx medusa develop
```
First run creates the admin user. Wait for `"Server is ready on http://localhost:9000"`.

### 3. Seed the database (one-time)
```powershell
# Step 1: Infrastructure (regions, categories, collections)
npx medusa exec src/migration-scripts/initial-data-seed.ts

# Step 2: Products come from Natco CSV catalog (already pre-loaded)
# Skip if products exist. Re-run only for fresh DB:
# node src/seed/import-csv.mjs

# Step 3: Merge weight variants (290 → 238 products)
node src/seed/merge-product-variants.mjs

# Step 4: Assign categories
node src/seed/reassign-natco-categories.mjs

# Step 5: Assign collections
node src/seed/assign-collections-v2.mjs

# Step 6: Set inventory as available
node src/seed/set-inventory.mjs
```
> Steps 2-6 require the backend to be running. Admin login: `admin@example.com` / `password123`

### 4. Start storefront
```powershell
cd C:\IndiaGrocers\apps\storefront
yarn dev
```

### 5. Access
| Service | URL |
|---|---|
| **Storefront** | http://localhost:8000/gb |
| Admin Dashboard | http://localhost:9000/app |
| PostgreSQL | `postgres://medusa:medusa@localhost:5432/indiagrocers` |
| Redis | `redis://localhost:6379` |

---

## 🗂️ Project Structure
```
C:\IndiaGrocers\
├── docker-compose.yml
├── package.json                    ← npm workspaces root
├── .gitignore
├── Implementation\                 ← Plans, tracking, CSV backups
│   ├── README.md                   ← THIS FILE
│   ├── STORE-FRONT-FEATURE-REQS.md
│   ├── STORE-FRONT-LAUNCH-PLAN.md
│   ├── STORE-FRONT-PLAN.md
│   ├── BACKEND-PLAN.md
│   ├── BACKEND-DEPS-MAP.md
│   └── natcofoods-import-backup\   ← Natco CSV and images
├── apps\
│   ├── backend\                    ← MedusaJS v2
│   │   ├── medusa-config.ts
│   │   ├── src\
│   │   │   ├── migration-scripts\
│   │   │   │   └── initial-data-seed.ts    ← Infrastructure seed
│   │   │   ├── seed\                        ← Data scripts
│   │   │   │   ├── README.md                ← Pipeline docs
│   │   │   │   ├── import-csv.mjs           ← CSV product import
│   │   │   │   ├── merge-product-variants.mjs  ← Variant merging
│   │   │   │   ├── set-descriptions.mjs     ← Generate descriptions
│   │   │   │   ├── reassign-natco-categories.mjs ← Category assignment
│   │   │   │   ├── assign-collections.mjs   ← Collection assignment
│   │   │   │   ├── assign-collections-v2.mjs
│   │   │   │   ├── set-inventory.mjs        ← Disable inventory checks
│   │   │   │   └── cleanup-and-migrate.mjs  ← Remove non-Natco products
│   │   │   ├── api\                          ← Custom API routes
│   │   │   └── admin\                        ← Medusa admin dashboard
│   │   └── .env
│   └── storefront\                 ← Next.js 15
│       ├── next.config.js
│       ├── tailwind.config.js
│       ├── src\
│       │   ├── app\                ← App Router pages (layout, [countryCode])
│       │   ├── modules\
│       │   │   ├── layout\         ← Nav, footer, cart sidebar, side menu
│       │   │   ├── home\           ← Hero, category grid, featured products
│       │   │   ├── categories\     ← Category listing template
│       │   │   ├── collections\    ← Collection listing template
│       │   │   ├── store\          ← All products, pagination, load-more
│       │   │   ├── products\       ← Product card, thumbnail, detail
│       │   │   ├── search\         ← Search page
│       │   │   ├── cart\           ← Cart dropdown + page
│       │   │   ├── checkout\       ← Checkout flow
│       │   │   ├── account\        ← User account pages
│       │   │   └── brands\         ← Brands A-Z page
│       │   ├── lib\                ← SDK config, data fetching, utilities
│       │   └── styles\             ← globals.css (Tailwind + custom)
│       └── .env
```

---

## 🐳 Docker Services

| Service | Image | Port | Credentials |
|---|---|---|---|
| PostgreSQL | `postgres:16` | 5432 | `medusa`:`medusa` / db: `indiagrocers` |
| Redis | `redis:7-alpine` | 6379 | — |

---

## 📊 Current Data State

| Entity | Count | Notes |
|---|---|---|
| Products | 238 | Natco Foods catalog, weight variants merged |
| Categories | 63 | 16 parents + 50 children |
| Collections | 16 | Products assigned via product type mapping |
| Regions | 1 | UK (GBP) |
| Stock Location | 1 | London Warehouse |
| Inventory | All available | `manage_inventory: false` on all variants |

### Product Distribution (by collection)
| Collection | Products |
|---|---|
| Spices & Masalas | 58 |
| Snacks & Namkeen | 38 |
| Dals & Lentils | 30 |
| Fresh Vegetables | 25 |
| Cooking Essentials | 24 |
| Flours & Grains | 17 |
| Pickles Chutneys | 14 |
| Rice & Grains | 10 |
| Sweets Mithai | 6 |
| Beverages | 2 |
| Noodles Pasta | 1 |

---

## 📋 Storefront Features

### Layout
- **Single-row sticky header:** Logo | Browse dropdown (all categories) | Search | Account | Cart
- **Mega menu bar:** Full category list below header, scrolls away with page
- **Cart sidebar:** Right 20% column on xl+ screens, "Your Basket" panel
- **Footer:** Dynamic category quick links

### Product Display
- **4-column grid** on desktop (2 on tablet, 1 on mobile)
- **Vertical cards:** Image top, title/weight/price/Add button below
- **Variant chips:** Size options shown when multiple weights available
- **Accordion:** "▼ More details" toggle on cards with descriptions
- **Load More:** Button replaces pagination, shows 12 per click
- **Mobile:** Horizontal card (30% image, 70% text)

### Homepage
- **Data-driven category grid:** 12 categories from backend, rotating colors
- **Hero carousel:** Valid category handles
- **Featured products:** Empty-guarded, 4-column rail

---

## 🔧 Data Pipeline Scripts

| Script | Purpose | Run Order |
|---|---|---|
| `initial-data-seed.ts` | Infrastructure: regions, categories, collections | 1 |
| `cleanup-and-migrate.mjs` | Delete non-Natco products, empty categories | — |
| `merge-product-variants.mjs` | Merge weight variants, generate descriptions | 2 |
| `set-descriptions.mjs` | Utility: generate descriptions for any product missing them | 3 |
| `reassign-natco-categories.mjs` | Map products to seed categories via CSV types | 4 |
| `assign-collections-v2.mjs` | Map products to collections via product types | 5 |
| `set-inventory.mjs` | Disable inventory management (always in stock) | 6 |

All scripts expect backend running on `http://127.0.0.1:9000`. Admin login: `admin@example.com` / `password123`

---

## 🎨 Brand Colors

| Token | Color |
|---|---|
| `brand-orange` | `#FF6B35` |
| `brand-orange-dark` | `#E55A2B` |
| `brand-green` | `#22C55E` |
| `brand-red` | `#EF4444` |
| `grey-10` | `#F9FAFB` |
| `grey-20` | `#E5E7EB` |
| `grey-50` | `#6B7280` |
| `grey-90` | `#111827` |
