# Data Pipeline

> **The catalogue system has moved to `catalogue/`.**
> See `catalogue/README.md` for the current product data management.

## Quick Reference

```bash
# Apply catalogue changes
node catalogue/enrich.mjs --apply

# Weekly prices
node catalogue/update-prices.mjs --apply

# Snapshot seed (new environments)
node scripts/data-pipeline/seed-from-snapshot.mjs --apply
```

## Archived

Historical scripts and the DATA-PIPELINE-MASTER-MAP are in this directory for reference.
Active data management is in `catalogue/`.

## Snapshot Seed (Recommended for New Environments)

Instead of running the full correction pipeline, use the snapshot approach:

```bash
# 1. Export current state (run on production/working DB)
node scripts/data-pipeline/export-snapshot.mjs

# 2. On the new machine, after db:migrate + initial-data-seed:
node scripts/data-pipeline/seed-from-snapshot.mjs --apply

# 3. Configure search
cd apps/meilisearch && npm run configure && npm run reindex

# 4. Verify
node scripts/verify-data-health.mjs
```

The snapshot (`snapshot.json`, ~1.1 MB) contains all 506 products with their
variants, prices, categories, metadata, tags, and thumbnails in their current
corrected state. No repetitive fixes needed — one import brings the DB to
production state.

## Pipeline Phases

| # | Phase | Steps | Key Scripts |
|---|-------|-------|-------------|
| 1 | Product Import | 6 | `import-from-shopify.mjs`, `merge-product-variants.mjs`, `import-trs-products.mjs`, MVC `import-round1.mjs` |
| 2 | Category Assignment | 5 | `migrate-to-natco-categories.mjs`, `assign-categories-from-titles.mjs`, `fix-category-handles.mjs`, `fix-tinned-products.mjs` |
| 3 | Enrichment | 1 | `pipeline.mjs --apply` (descriptions, tags, dietary, allergens, synonyms, reindex) |
| 4 | Images | 5 | `download-natco-images.mjs`, `rename-trs-images.mjs`, `fix-trs-images.mjs`, MVC `assign-images.mjs`, `set-thumbnails.mjs` |
| 5 | Inventory | 2 | `set-inventory.mjs`, `set-descriptions.mjs` |
| 6 | Search | 2 | `npm run configure`, `npm run reindex` (from `apps/meilisearch`) |
| 7 | Verify | 2 | `verify-data-health.mjs`, MVC `audit.mjs` |

## Script Locations

```
scripts/
  data-pipeline/
    run-all.mjs              ← THIS FILE — master orchestrator
    README.md                ← This documentation
    DATA-PIPELINE-MASTER-MAP.md  ← Complete script inventory
    archive/                 ← Historical scripts (15 files, no longer used)

  import-from-shopify.mjs    ← Natco import
  import-trs-products.mjs    ← TRS import
  fix-trs-images.mjs         ← TRS image fixes
  rename-trs-images.mjs      ← TRS image renaming
  fix-tinned-products.mjs    ← Tinned product categories
  download-natco-images.mjs  ← Natco image download
  enrich-from-csv.mjs        ← CSV enrichment
  verify-data-health.mjs     ← Data health check
  sync-lentils-csv.mjs       ← Lentils data sync

  mvc/
    import-round1.mjs        ← MVC Round 1 import
    import-missing-variants.mjs
    create-categories.mjs    ← MVC category creation
    pipeline.mjs             ← MVC enrichment pipeline
    assign-images.mjs        ← MVC image assignment
    audit.mjs                ← MVC post-import audit

  pricing/
    load-pricelist.mjs       ← Price loading

apps/backend/src/seed/
  merge-product-variants.mjs ← Natco variant consolidation
  migrate-to-natco-categories.mjs
  assign-categories-from-titles.mjs
  assign-categories-to-children.mjs
  fix-category-handles.mjs
  set-inventory.mjs
  set-descriptions.mjs
  set-thumbnails.mjs
  enrich-metadata.mjs
  reset-and-reassign.mjs
  import-products-from-csv.mjs

apps/meilisearch/scripts/
  configure.ts              ← MeiliSearch index config
  reindex-products.ts       ← Product reindex
```

## Data Files

| File | Purpose |
|------|---------|
| `data-design/lentils-master.csv` | Lentils attributes (tags, dietary, allergens) |
| `data-design/spices-master.csv` | Spices attributes |
| `data-design/grains-master.csv` | Grains attributes |
| `data-design/snacks-master.csv` | Snacks attributes |
| `data-design/essentials-master.csv` | Essentials attributes |
| `data-design/raw-nuts-master.csv` | Nuts attributes |
| `data-design/tinned-products-master.csv` | Tinned product data + category fixes |
| `scripts/pricing/example-pricelist.json` | Sample pricelist format |

## QA Gates

Per `QA-GATES.md`, each phase has a gate that must pass before proceeding:

| Phase | Gate Check |
|-------|-----------|
| 1 | Product count ≥ expected, all have categories, 95%+ have thumbnails |
| 2 | No old/forbidden category handles in MeiliSearch |
| 3 | 80%+ products have dietary flags, 50%+ have tags |
| 6 | MeiliSearch index has correct product count |

The orchestrator automatically stops if a gate fails.

## Adding New Data

1. Add your CSV/JSON to `data-design/`
2. Create your import/enrichment script in the appropriate directory
3. Add the step to `run-all.mjs` under the correct phase
4. Add verification to Phase 7
5. Run: `node scripts/data-pipeline/run-all.mjs --apply --from {phase}`

## Archive

Historical scripts that are no longer needed are in `scripts/data-pipeline/archive/`.
They are kept for reference but not used by the orchestrator.
