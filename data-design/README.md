# Data Design System — IndiaGrocers

Master product data mapping system for the IndiaGrocers catalog. Tracks the
relationship between Natco Foods' Shopify product catalog and our Medusa
backend product catalog.

## Files

| File | Purpose |
|------|---------|
| `lentils-master.csv` | Master data sheet — 79 Natco lentil products mapped to our subcategories |
| `lentils-master.json` | JSON snapshot of the same data (machine-readable) |
| `scripts/generate-lentils.ps1` | Generator script — pulls from Natco Shopify JSON source |
| `snapshots/` | Timestamped backups of previous versions |

## Viewing the data

### Tabular view (recommended for editing)

Open `lentils-master.csv` in:
- **VS Code** with the "Rainbow CSV" extension for colorized columns
- **Excel** (double-click the CSV file)
- **Google Sheets** (File → Import → Upload)

### Programmatic view

```bash
# Read as JSON
cat lentils-master.json | jq '.products[] | select(.natco_handle == "alubia-beans")'

# Query CSV with PowerShell
Import-Csv .\lentils-master.csv | Where-Object { $_.natco_subcategory -eq "soya-products" }
```

## Column reference

| Column | Description | Editable? |
|--------|-------------|-----------|
| `natco_handle` | Shopify product handle (unique ID from Natco source) | No |
| `title` | Product title from Shopify | No |
| `variant_weight` | Weight extracted from title (e.g. `2kg`, `500g`, `12x400g`) | No |
| `natco_type` | Shopify product_type (e.g. `Lentils`, `Beans`, `Tinned Lentils, Beans`) | No |
| `natco_subcategory` | Derived from natco_type using mapping rules | No |
| `our_subcategory` | Our Medusa subcategory — **adjust this** to match our catalog | **Yes** |
| `in_our_catalog` | `YES` / `NO` — does this product exist in our Medusa catalog? | **Yes** |
| `our_product_id` | Medusa product ID if matched (e.g. `prod_01J...`) | **Yes** |
| `match_status` | `OK` / `MISSING` / `NEEDS_REVIEW` | **Yes** |

## Subcategory mapping rules

| Natco product_type | our_subcategory |
|--------------------|-----------------|
| `Lentils` | `dried-lentils-beans-peas` |
| `Beans` | `dried-lentils-beans-peas` |
| `Beans` + "soya" in title | `soya-products` (exception) |
| `Tinned Lentils, Beans` | `tinned-lentils-beans` |
| `Soya` | `soya-products` |
| `Daria Lentil Snack` | `namkeen-lentil-snacks` |

## Workflow: Making changes

### 1. Edit the CSV

Open `lentils-master.csv` in Excel or VS Code. Change only the editable
columns: `our_subcategory`, `in_our_catalog`, `our_product_id`, `match_status`.

### 2. Take a snapshot before applying

```bash
node scripts/snapshot.js save "Updated subcategory mappings for soya products"
```

This saves a timestamped copy to `snapshots/` and creates a git commit.

### 3. Apply changes to the database

```bash
node scripts/apply-design.js lentils
```

This reads `lentils-master.csv`, finds rows where `match_status = "OK"` and
`in_our_catalog = "YES"`, and updates the corresponding Medusa products.

### 4. Reindex search

After applying changes, regenerate the MeiliSearch index so search results
reflect the updated catalog:

```bash
cd apps/meilisearch && npm run reindex
```

## Workflow: Taking snapshots

```bash
# Save current state with a description
node scripts/snapshot.js save "Before Natco May 2026 re-sync"

# List all snapshots
node scripts/snapshot.js list

# Compare two snapshots
node scripts/snapshot.js diff v1 v2
```

## Workflow: Reverting

### Revert a CSV to previous version

```bash
git checkout HEAD~1 -- data-design/lentils-master.csv
```

### Revert to a specific snapshot

```bash
node scripts/snapshot.js restore v3
```

## Workflow: Syncing from Natco source

When Natco adds/changes products on Shopify:

```bash
# 1. Fetch fresh JSON from Natco Shopify
#    (paste into tool output file or use script)

# 2. Regenerate the master sheet
cd data-design
powershell -ExecutionPolicy Bypass -File .\scripts\generate-lentils.ps1

# 3. The script preserves existing our_subcategory / our_product_id
#    matches by keying on natco_handle. New products get UNKNOWN/NEEDS_REVIEW.

# 4. Review the diff, update new rows, then apply.
```

## Current state

- **79 products** from Natco Foods "All Lentils" collection
- **5 subcategories**: dried-lentils-beans-peas (53), tinned-lentils-beans (15), namkeen-lentil-snacks (6), soya-products (5)
- **Source**: https://shop.natcofoods.com/collections/all-lentils/products.json
- **Fetched**: 2026-05-28
- **All rows**: `match_status = NEEDS_REVIEW`, `in_our_catalog = UNKNOWN`
  (ready for the catalog matching pass)
