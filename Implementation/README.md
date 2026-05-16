# IndiaGrocers London — Implementation Tracker

> **Stack:** MedusaJS v2.15.2 (backend) + Next.js 15 (storefront) + PostgreSQL + Redis

---

## 📂 Plans

| Plan | Stories | Done | Progress |
|---|---|---|---|
| [STORE-FRONT-PLAN.md](./STORE-FRONT-PLAN.md) | 46 | 38 | 83% |
| [STORE-FRONT-LAUNCH-PLAN.md](./STORE-FRONT-LAUNCH-PLAN.md) | 52 | 39 | 75% |
| [BACKEND-PLAN.md](./BACKEND-PLAN.md) | 74 | 39 | 53% |
| [BACKEND-DEPS-MAP.md](./BACKEND-DEPS-MAP.md) | Dependency mapping | — | — |
| **Combined** | **172** | **89** | **52%** |

---

## 🚀 Quick Start

### 1. Start Docker services
```powershell
docker compose -f C:\IndiaGrocers\docker-compose.yml up -d
```

### 2. Start Medusa backend
```powershell
cd C:\IndiaGrocers\apps\backend
npx medusa develop
```

### 3. Start storefront (separate terminal)
```powershell
cd C:\IndiaGrocers\apps\storefront
yarn dev
```

### 4. Access
| Service | URL |
|---|---|
| Admin Dashboard | http://localhost:9000/app |
| Storefront | http://localhost:8000 |
| PostgreSQL | `postgres://medusa:medusa@localhost:5432/indiagrocers` |
| Redis | `redis://localhost:6379` |

**Admin login:** `admin@example.com` / `password123`

---

## 🗂️ Project Structure
```
C:\IndiaGrocers\
├── docker-compose.yml
├── Implementation\                 <-- Plans & tracking
│   ├── README.md
│   ├── STORE-FRONT-PLAN.md
│   └── BACKEND-PLAN.md
├── apps\
│   ├── backend\                    <-- MedusaJS v2
│   │   ├── src\
│   │   │   ├── migration-scripts\
│   │   │   │   └── initial-data-seed.ts   <-- Seed script
│   │   │   └── seed\
│   │   │       └── indian-grocery-catalog.csv  <-- CSV import
│   │   └── .env
│   └── storefront\                 <-- Next.js 15
│       ├── src\
│       │   ├── app\                <-- App Router pages
│       │   ├── modules\            <-- Components & templates
│       │   ├── lib\                <-- Data fetching, SDK
│       │   └── styles\             <-- Global CSS + Tailwind
│       ├── public\                 <-- PWA manifest, icons
│       └── .env
```

---

## 🐳 Docker Services

| Service | Image | Port | Credentials |
|---|---|---|---|
| PostgreSQL | `postgres:16` | 5432 | `medusa`:`medusa` / db: `indiagrocers` |
| Redis | `redis:7-alpine` | 6379 | — |

---

## 📋 Key Files Changed

### Backend
- `src/migration-scripts/initial-data-seed.ts` — Categories + seed products
- `.env` — DATABASE_URL, REDIS_URL

### Storefront
- `tailwind.config.js` — Brand colors (orange, red, green)
- `src/styles/globals.css` — Theme CSS classes
- `src/app/layout.tsx` — PWA metadata
- `src/app/[countryCode]/(main)/page.tsx` — Homepage
- `src/modules/layout/templates/nav/index.tsx` — Mega menu nav
- `src/modules/layout/templates/footer/index.tsx` — Footer
- `src/modules/home/components/*` — Hero, Categories, Testimonials, WhatsApp
- `public/manifest.json` — PWA manifest
- `public/icons/icon-192.svg` — App icon
