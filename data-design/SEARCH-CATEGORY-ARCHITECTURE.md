# Search & Category Architecture — Data Flow Analysis

## Current State

```
                    ┌─────────────────────────────────────┐
                    │           MEILISEARCH                │
                    │  (typo, synonym, relevance, sort)    │
                    │                                      │
                    │  Indexed per product:                │
                    │  ✅ id, title, handle, description   │
                    │  ✅ category_handle (Natco leaf)     │
                    │  ✅ price_gbp, weight_grams          │
                    │  ✅ collection_title                 │
                    │  ⚠️ tags (empty — CSV had no tags)   │
                    │  ❌ dietary_flags (not in document)  │
                    │  ❌ eco_ratings (not in document)    │
                    │  ❌ allergens (only in metadata obj) │
                    │  ❌ synonyms_text (populated but not  │
                    │     leveraged by search template)    │
                    └──────────┬──────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                   │
    ┌───────▼──────┐  ┌───────▼──────┐   ┌───────▼──────┐
    │ CATEGORY     │  │   SEARCH     │   │   PRODUCT    │
    │ BROWSING     │  │   BAR        │   │   DETAIL     │
    │              │  │              │   │              │
    │ /grains      │  │ ?q=basmati   │   │ /products/   │
    │ /lentils     │  │              │   │   basmati-   │
    │ /spices      │  │              │   │   rice-2kg   │
    └──────┬───────┘  └──────┬───────┘   └──────┬───────┘
           │                 │                   │
           └─────────────────┼───────────────────┘
                             │
                    ┌────────▼──────────┐
                    │      MEDUSA        │
                    │  (product source)  │
                    │                    │
                    │  265 products      │
                    │  ✅ categories     │
                    │  ✅ variants       │
                    │  ✅ prices         │
                    │  ✅ images         │
                    │  ⚠️ metadata       │
                    │     (partial)      │
                    └────────────────────┘
```

---

## What Works Today

| Scenario | Input | Result |
|----------|-------|--------|
| Browse `/categories/grains` | Parent with children | Resolves all child handles → IN filter → shows all grains products |
| Browse `/categories/rice-quinoa` | Leaf with products | Shows only rice products |
| Browse `/categories/all-lentils-beans` | Leaf, no products | Fallback to parent Lentils → shows all lentils |
| Search "basmati" | MeiliSearch | Returns basmati rice products by relevance |
| Search "basan" (typo) | MeiliSearch typo | Returns "besan" (gram flour) products |
| Search "chickpea flour" | MeiliSearch synonym | Returns "besan" products |
| Filter by brand | MeiliSearch filter | Filters by metadata.brand_slug |

---

## What's Missing — Impact

### 1. 37 Missing Products (Lentils only)
| Impact | Products |
|--------|----------|
| Full Cases missing | 28 (12x400g, 4x1kg, 6x400ml packs) |
| New variants missing | 9 (Toor Dal Oily, Urid Beans/Dal/Split, Yellow Split Peas, Moth Beans, Rose Coco dried) |

**Effect**: Browsing "All Lentils" shows only 42 products instead of Natco's 79.

### 2. Tags Not Indexed
Natco has 74 unique tags (cleaned). None are in MeiliSearch.

**Effect**: Searching "ramadan" or "chana" finds nothing despite products having those tags. Tags are the missing link between how Indian shoppers search (vernacular terms) and product discovery.

### 3. Dietary Flags Incomplete
97+ products qualify for vegan/fiags but only 5 claim them. Dietary flags are in `metadata.dietary_flags` but the enrich-metadata script may have gaps.

**Effect**: No "Vegan" or "High Protein" filters on search results. No dietary badges on product cards.

### 4. Synonyms Not Leveraged by Search
The search template doesn't use the synonym resolution functions. MeiliSearch has 80 synonym pairs configured, but the storefront search doesn't show "Did you mean?" or "Showing results for..." synonym hints.

**Effect**: User searches "chana" → gets results via MeiliSearch synonym → but no visible indication that "chickpea" was also matched.

---

## What Needs to Happen

### Phase A — Complete Product Catalog
```
Import missing products (Full Cases, Toor Dal Oily, Urid, Yellow Split Peas, etc.)
↓
Assign categories
↓
Enrich metadata (tags + dietary + allergens)
↓
Reindex MeiliSearch
```

### Phase B — Enrich MeiliSearch Document
```
Add to reindex/subscriber:
  - tags[] (from product tags)
  - dietary_flags[] (from metadata)
  - allergens[] (from metadata)  
  - eco_rating (from metadata)
↓
Update configure-index.ts:
  - tags → searchable
  - dietary_flags → filterable + searchable
  - allergens → filterable
  - eco_rating → filterable
```

### Phase C — Storefront Enhancements (future)
```
- Synonym "Did you mean?" hints in search
- Dietary filter chips on search results
- Eco-rating badges on product cards
- Tag-based "Related products" suggestions
```

---

## Decision Needed

The architecture is solid. The data is incomplete. Do we:

1. **Complete the data first** — import missing products, add tags, enrich dietary flags — then the existing search/category flow works with full data
2. **Fix what we have** — leave missing products for later, just enrich tags/dietary on existing 265
3. **Restart data layer** — rebuild product import from scratch using Natco Shopify JSON directly (not CSV), with variant consolidation, tags, and full enrichment
