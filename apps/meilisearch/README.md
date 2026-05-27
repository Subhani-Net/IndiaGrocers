# MeiliSearch — IndiaGrocers

Search infrastructure for the IndiaGrocers storefront.

## Setup

```bash
# Start all services (Postgres + Redis + MeiliSearch)
docker compose -f C:\IndiaGrocers\docker-compose.yml up -d
```

MeiliSearch runs at http://localhost:7700 (no API key required in dev mode).

## Environment Variables

Add to `apps/backend/.env`:
```
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=              # optional in dev
```

Add to `apps/storefront/.env`:
```
NEXT_PUBLIC_MEILISEARCH_HOST=http://localhost:7700
NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY=   # optional in dev
```

## Index Configuration

```bash
# Configure the products index (searchable/filterable attributes + synonyms)
cd apps/meilisearch
npm run configure
```

## Reindex Products

Requires the Medusa backend to be running on http://127.0.0.1:9000:

```bash
cd apps/meilisearch
npm run reindex
```

## Auto-Indexing

Products are automatically indexed into MeiliSearch via the subscriber at
`apps/backend/src/subscribers/product-index.ts`. This fires on
`product.created` and `product.updated` events.

## Package Structure

```
apps/meilisearch/
├── docker-compose.yml          # MeiliSearch container
├── package.json
├── scripts/
│   ├── configure-index.ts      # Index setup + synonym upload
│   └── reindex-products.ts     # Bulk reindex from Medusa
└── src/
    ├── client.ts               # Admin + search clients
    ├── search-synonyms.ts      # 23 bidirectional synonym pairs
    └── index.ts                # Public exports
```

## Usage from Backend

```ts
import {
  getProductsIndex,
  meiliAdmin,
  resolveSynonyms,
} from "@indiagrocers/meilisearch"
```

## Usage from Storefront

```ts
import { searchProducts, autocompleteProducts } from "@lib/search-client"
```
