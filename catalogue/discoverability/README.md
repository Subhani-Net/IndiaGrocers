# Discoverability Validation Tool

Validates that every product in the catalogue is discoverable through search
and category browsing. Compares **what we expect** (from the catalogue) against
**what MeiliSearch actually returns**. The gap report drives search quality
improvements and prevents regressions.

## Architecture

```
                    catalogue/products.csv (source of truth)
                              │
                          Medusa DB
                              │
                      npm run reindex
                              │
                        MeiliSearch
                              │
              ┌───────────────┼───────────────┐
              │                               │
     update-expectations.mjs         gap-analysis.mjs
     (computes what SHOULD           (records what MeiliSearch
      appear from catalogue)          ACTUALLY returns)
              │                               │
              └───────────┬───────────────────┘
                          │
                    gap-report.json
                          │
                 compare-gaps.mjs
                    (vs previous run)
                          │
                    gap-trends.txt
```

The key insight: **expected titles are stable** — they change only when products
are added/deleted/updated. MeiliSearch actuals are always fresh. The gap between
them tells you exactly what's wrong.

## Files

| File | Purpose | When Updated |
|------|---------|-------------|
| `curated-search-terms.json` | Hand-picked search terms with metadata | Manually — add new customer search patterns |
| `update-expectations.mjs` | Computes stable expected titles from catalogue | After product add/delete/update |
| `expected-results.json` | Committed stable truth for expected titles | Output of update-expectations (commit after each product change) |
| `gap-analysis.mjs` | Queries MeiliSearch, compares to expectations | After any MeiliSearch change (reindex, config, synonyms) |
| `gap-report.json` | Current gap data (expected vs actual) | Output of gap-analysis |
| `gap-report.txt` | Human-readable summary | Output of gap-analysis |
| `compare-gaps.mjs` | Diffs current vs previous gap report | After gap-analysis, to see trends |
| `gap-trends.txt` | What improved/regressed since last run | Output of compare-gaps |

## Daily Workflow

### After any catalogue change (product edit, new product, category change)

```bash
# 1. Update catalogue (CSV → DB)
node catalogue/enrich.mjs --apply

# 2. Regenerate expected titles (they changed — products were added/edited)
node catalogue/discoverability/update-expectations.mjs

# 3. Push to MeiliSearch
cd apps/meilisearch && npm run reindex

# 4. Run gap analysis
node catalogue/discoverability/gap-analysis.mjs

# 5. Compare with previous run
node catalogue/discoverability/compare-gaps.mjs

# 6. Review and commit
cat catalogue/discoverability/gap-trends.txt
git add catalogue/discoverability/expected-results.json
git add catalogue/discoverability/gap-report.json
git commit -m "catalogue: update discoverability expectations after product changes"
```

### After any MeiliSearch config change (synonyms, ranking, filters)

```bash
# Only steps 4-6 needed (expectations haven't changed)
node catalogue/discoverability/gap-analysis.mjs
node catalogue/discoverability/compare-gaps.mjs
```

### Adding a new customer search pattern

```bash
# 1. Edit curated-search-terms.json — add new term
# 2. Regenerate expectations (new term needs expected titles)
node catalogue/discoverability/update-expectations.mjs
# 3. Run gap analysis
node catalogue/discoverability/gap-analysis.mjs
# 4. Compare
node catalogue/discoverability/compare-gaps.mjs
```

### Quick spot-check

```bash
# Just see the human-readable summary
cat catalogue/discoverability/gap-report.txt

# See trends (what changed since last time)
cat catalogue/discoverability/gap-trends.txt
```

## How Expected Order is Derived

For a search term like "basmati rice", the expected order from the catalogue is:

1. **Match quality**: Products whose titles contain ALL search words rank higher
2. **Brand priority**: Known brands (Tilda=10, Kohinoor=9, Natco=1) rank above generic
3. **Alphabetical**: Within same match+brand tier, alphabetically by title
4. **Limit**: Top 12 titles

For category browsing, the expected order is:

1. **Brand priority** within the category
2. **Alphabetical** within same brand tier

## How to Read the Gap Report

### gap-report.txt — Quick spot-check

```
SEARCH: 481 terms | avg overlap 5.1 | 2200 missing | 122 clean | 359 with gaps

Top search gaps (most missing):
  "staples grains" — 2/12 overlap — missing: Tilda Pure Basmati | Kohinoor Extra Long | Aashirvaad Atta
  "atta flours" — 1/12 overlap — missing: Aashirvaad Atta Select | Pillsbury Chakki Fresh
```

- **Overlap**: how many expected titles also appear in MeiliSearch results
- **Missing**: titles from our catalogue that MeiliSearch didn't return
- **Extra**: titles MeiliSearch returned that aren't in our expected list

### gap-trends.txt — What changed

```
SEARCH REGRESSIONS (3):
  "moong dal" 7→2 (-5) ⚠️  — investigate: new products or ranking change?
  
SEARCH IMPROVEMENTS (12):
  "basmati rice" 3→9 (+6) ✓  — synonym fix took effect
```

### gap-report.json — Full data

```json
{
  "_generated": "2026-06-12T10:00:00Z",
  "_expectedSnapshot": "2026-06-11T08:00:00Z",
  "searchGaps": [
    {
      "term": "basmati rice",
      "overlap": 9,
      "expectedCount": 12,
      "missing": ["Tilda Pure Basmati 5kg", "Kohinoor Extra Long Basmati 5kg"],
      "extra": [],
      "posDiffs": [
        { "pos": 3, "expected": "Tilda Pure Basmati", "actual": "Daawat Rozana Basmati" }
      ]
    }
  ]
}
```

## Curated Search Terms

Edit `curated-search-terms.json` to add new high-value search patterns:

```json
{
  "terms": [
    {
      "term": "jasmine rice",
      "group": "Staples",
      "failureImpact": "Customer-reported missing search for Thai rice variety"
    }
  ]
}
```

Then run `update-expectations.mjs` to compute expected titles for the new term.

## Maintenance Checklist

| Event | Action |
|-------|--------|
| New product added | `update-expectations.mjs` → commit `expected-results.json` |
| Product deleted | `update-expectations.mjs` → commit `expected-results.json` |
| Product title changed | `update-expectations.mjs` → commit `expected-results.json` |
| Category added/removed | `update-expectations.mjs` → commit `expected-results.json` |
| MeiliSearch config changed | `gap-analysis.mjs` → review `gap-report.txt` |
| Customer reports search gap | Add to `curated-search-terms.json` → `update-expectations.mjs` → `gap-analysis.mjs` |
| Before production deploy | `gap-analysis.mjs` → `compare-gaps.mjs` → verify no regressions |
| Weekly health check | `gap-analysis.mjs` → review trends |

## CI Integration

```yaml
discoverability-check:
  steps:
    - run: node catalogue/discoverability/gap-analysis.mjs
    - run: node catalogue/discoverability/compare-gaps.mjs
    - assert: |
        Search regressions must be 0 for terms with audience > 10
        Category overlap must not drop to 0
        Zero-overlap searches require approval comment
```
