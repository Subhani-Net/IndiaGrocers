
# Performance & Caching Strategy

> **Phase 2/3 — Quick Page Load Optimization**

## Caching Layers

### 1. Next.js Data Cache (Server-Side)
| Data | TTL | Strategy |
|---|---|---|
| Categories | 5 min | `force-cache` + tag-based revalidation |
| Collections | 5 min | `force-cache` + tag-based revalidation |
| Products | 1 min | `force-cache` + tag-based revalidation |
| Regions | 1 hour | Long cache — rarely changes |
| Locales | 1 hour | Long cache — rarely changes |
| Shipping Options | 2 min | Short cache for live rates |
| Variants | 1 min | Short cache — linked to product updates |
| Orders | 30 sec | Very short — user-specific |

Implementation: `lib/data/cookies.ts` — `getCacheOptions()` adds `revalidate` per data type.

### 2. ISR (Incremental Static Regeneration)
| Page | Revalidation | Strategy |
|---|---|---|
| Category pages | 5 min | Static generation + periodic refresh |
| Store (All Products) | 1 min | Static generation + frequent refresh |
| Collections | 5 min | Static generation + periodic refresh |

Implementation: `export const revalidate` in each page.tsx.

### 3. Client-Side localStorage Cache
| Data | TTL | Purpose |
|---|---|---|
| Product data | 5 min | Avoid re-fetching recently viewed products |
| Recently viewed | N/A | Track last 20 product views |
| Cart backup | 24 hours | Persist cart across sessions |

Implementation: `lib/util/local-cache.ts` — `cacheGet/cacheSet/cacheRemove` utilities.

### 4. Image Optimization
- `loading="lazy"` on all product thumbnails via `next/image`
- Proper `sizes` attribute for responsive loading
- `unoptimized={true}` for local backend images (will switch to CDN in production)
- `quality={50}` for size reduction

Implementation: `modules/products/components/thumbnail/index.tsx`

### 5. PWA / Service Worker
- Already configured via `@ducanh2912/next-pwa`
- Caches static assets (JS, CSS, fonts)
- Works offline for previously visited pages
- Config in `next.config.js`
