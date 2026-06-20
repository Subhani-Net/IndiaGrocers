# Changelog

## 2026-06-19 — AGENTS.md Refactor + Clean Codespace Policy

### AGENTS.md Purge
- Extracted 690 lines of feature planning content from AGENTS.md (1127 → 437 lines)
- Moved to structured docs/ directory preserving exact content:
  - `docs/epics/backlog.md` — Phase 1 & 2 work items, order consolidation
  - `docs/epics/go-live-requirements.md` — G1-G15 go-live prerequisites
  - `docs/epics/defects.md` — D1-D10 pre-go-live defects
  - `docs/epics/customer-journeys.md` — J1-J5 end-to-end journey tasks
  - `docs/architecture/rebuild-contracts.md` — Test coverage, navigation, search, filter, 3-pane layout contracts
- AGENTS.md now contains ONLY: setup steps, engine config, guardrails, conventions

### Temp Script Cleanup
- Moved 12 investigation/image-fetching scripts to `tmp/image-checks/`:
  fetch-bombaybasket.mjs, fetch-trs-natco.mjs, fetch-jalpur.mjs, fetch-jalpur-v2.mjs,
  fetch-asiandukan.mjs, fetch-all.mjs, fetch-variety.mjs, fetch-vegetables.mjs,
  fetch-haldiram.mjs, fetch-images.mjs, scan-asiandukan.mjs, scan-indianspiceshops.mjs
- Deleted 2 one-off patch scripts: fix-brand-slugs.mjs, fix-data.mjs

### Documentation Created
- `docs/CHANGELOG.md` — this file

---

## 2026-06-18 — MVP Asset Finalizer (finalize-mvp-assets.mjs)

### New Pipeline
- Created 5-step MVP production asset finalizer at `catalogue/mvp/finalize-mvp-assets.mjs`
- Step 1: Asset Filtering — strips products without verified images
- Step 2: Taxonomy Validation — verifies category handles, appends fresh_veg if needed
- Step 3: Codes & Metadata — validates barcodes (EAN-13, GEN_, VEG_), injects sourcing_depot
- Step 4: Database Merge — upserts by variant_barcode as master key
- Step 5: Physical Transfer — copies images to public/images/products/ and backend/uploads/

### Image Accumulation
- 89 product images downloaded from 10+ web sources
- 17 of 18 MVP vegetables have images (Small Onion pending)
- 72 of 149 missing grocery products now have images

### Vegetable MVP
- 18 vegetables as standalone products under fresh_veg category
- VEG_ barcode prefix for vegetable-specific identification
- Sourcing strategies: AMB_STAPLE, MARGIN_PACK, CORE_VOL, SI_ANCHOR, SAT_FRESH, REG_SPEC

---

## 2026-06-16 — Seed Pipeline with Zod Integration

### seed-catalogue.mjs
- Built 8-step pipeline replacing enrich.mjs as primary seed engine
- Categories: parent-first upsert with validation
- Products: variant normalization (group by base title + brand), two-tier upsert (handle → product, barcode → variant)
- Prices: sync from prices.csv by SKU matching
- Auto-syncs publishable API key to storefront .env

### Zod Validation Layer
- `csvProductRowSchema` — Zod object schema covering all 31 CSV columns
- Enforces: lowercase alphanumeric category_handle, 13-digit or GEN_/VEG_ barcodes, valid status enum
- Variant uniformity: detects mismatched parent attributes across multi-variant rows
- Separate strict errors (blocking) from warnings (informational)

### Image Fetcher (tmp/image-checks/)
- Bombay Basket: 8 images via category page scrape
- Jalpur Millers: 16 images via Shopify API (brand-agnostic matching)
- Asian Dukan: 10 images via Magento search
- Food Bazaar: 13 images via Shopify brand collections
- Variety Foods: 11 images via Shopify collections
- Haldiram UK: 5 images via Shopify API
- Indian Spice Shops: 7 images via catalog search
- Mullaco Online: 4 images via Shopify API

---

## 2026-06-16 — Product CSV Cleanup (cleanup-products.mjs)

### Data Quality
- Fixed 50 column-shifted rows (weight_value/weight_unit/thumbnail_url misalignment)
- Deleted 23 duplicate rows (MVC pipeline vs new pipeline cross-source duplicates)
- Merged 37 single-variant sibling products into multi-variant handles
- Stripped weight suffixes from ~300 product titles
- Auto-detected brand_slug for 46 products with brand_slug="0"
- Fixed 46 products with status="Default" → "published"
- Assigned barcodes to 680 of 680 rows (100% coverage)

### Result
- 733 rows → 680 rows (clean)
- 542 unique handles → 486 unique handles
- 121 → 123 multi-variant groups
