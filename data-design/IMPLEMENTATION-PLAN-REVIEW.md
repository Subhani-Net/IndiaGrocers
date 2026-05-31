# Implementation Plan — Peer Review

> **Reviewers**: Product Owner + Senior Dev/BA  
> **Date**: 2026-05-30  
> **Verdict**: ✅ Robust foundation. 5 critical gaps, 3 risks, 2 missing scenarios.

---

## PO Assessment

### What's Good
- Clear epic structure with numbered user stories
- QA gates at every phase — this is excellent for preventing repeated work
- Acceptance criteria are checkable (checkbox format)
- Scripts index makes discoverability trivial
- Image naming convention documented for multi-brand scaling

### What's Missing (5 items)

| # | Gap | Impact | Fix |
|---|-----|--------|-----|
| **PO-1** | No success metrics per phase | Can't measure completion | Add: "Phase 1 done when audit returns 0 missing" |
| **PO-2** | No multi-brand repeat plan | TRS/Haldiram import is ad-hoc | Add: "For each new brand: repeat Phases 1-5, prefix brand to all handles/images" |
| **PO-3** | No user-facing acceptance tests | Customer might see broken pages | Add: "After Phase 5: browse all 8 parents, search 10 vernacular terms, filter by 3 dietary flags — all must return results" |
| **PO-4** | 13 SKU duplicates have no resolver | Plan says "acceptable" but they're real missed products | Add: "US-1.1 stretch: resolve 13 SKU clashes by assigning unique SKUs" |
| **PO-5** | No rollback instructions | Failed phase corrupts data with no recovery | Add: "Each phase: save snapshot. If audit fails: scripts/snapshot.js restore <filename>" |

### Recommended Priority Adjustments
- **P0 (must complete)**: PO-1, PO-3, PO-5
- **P1 (should complete)**: PO-2, PO-4

---

## Dev+BA Assessment

### What's Good
- All scripts are standalone, idempotent where possible
- Validation scripts work independently of each other
- MeiliSearch schema changes are additive (no destructive operations)
- Image naming convention prevents collisions across brands
- Pseudo-query approach is well-documented with a design doc

### What's Risky (3 items)

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| **DEV-1** | Phase 2 (enrichment) runs BEFORE Phase 3 (categories). If category migration overwrites metadata, enrichment is lost. | HIGH | Swap Phase 2 and Phase 3. Categories first, then enrich. |
| **DEV-2** | Step 3.2 "Assign missing subcategories (via keyword script)" — this is an undefined script. | HIGH | Create `scripts/assign-missing-subcategories.mjs` or remove this step (current keyword logic is inline). |
| **DEV-3** | `categories[0]` issue: child pages show wrong product counts because MeiliSearch picks first category. Parent pages work but child pages return 0-18 products vs expected 13-36. | MEDIUM | Document as known limitation. Add to plan: "Child pages are filter views. Parent pages are the canonical browsing experience." |

### What's Missing (2 scenarios)

| # | Scenario | Needed for |
|---|----------|-----------|
| **BA-1** | Multi-brand product import path: "When TRS products arrive, how does the pipeline handle brand_slug=trs, different taxonomy, different image convention?" | Scalability — the plan works for Natco only today |
| **BA-2** | Transactional flow validation: "After catalog is set up, can a customer: sign up → browse → add to cart → check out → view order?" | End-to-end verification — the plan only validates browsing |

---

## Combined Recommendations

### Immediate (before next implementation run)

1. **Swap Phase 2 and Phase 3 order** — Categories first, enrichment after
2. **Add Phase 5 storefront validation script** — automate the manual "Browse /categories/spices" checks
3. **Add snapshot at every phase** — `scripts/snapshot.js save "phase-X-complete"` before each audit
4. **Define success metrics per phase** — numeric targets not just checkboxes
5. **Document the `categories[0]` limitation** — child pages are filters, parent pages are canonical

### For next catalog (TRS, Haldiram)

1. Add `brand_slug` parameter to all import scripts
2. Prefix all handles with brand: `trs-black-pepper` vs `natco-black-pepper`
3. Image naming: `trs_coarse-black-pepper.jpg` follows established convention
4. Category handles remain the same across brands (spices-herbs serves both Natco and TRS products)
5. Re-run QA gates per brand independently, then combined audit

### Updated Phase Order

```
PHASE 1 — CATALOG (import all products)
PHASE 2 — CATEGORIES (assign taxonomy)      ← SWAPPED
PHASE 3 — ENRICHMENT (tags, dietary)        ← SWAPPED
PHASE 4 — SEARCH (MeiliSearch + pseudo-query)
PHASE 5 — IMAGES + STOREFRONT (download, validate)
```

---

## Verdict

| Dimension | Score | Notes |
|-----------|-------|-------|
| Completeness | 7/10 | Missing 5 PO items, 2 BA scenarios |
| Correctness | 8/10 | Phase order risk, undefined step |
| Reproducibility | 8/10 | Scripts are standalone but need snapshot integration |
| Scalability | 5/10 | Multi-brand plan is absent — treated as "later" |
| Testability | 7/10 | Automated audits exist; no automated storefront tests |

**Overall**: Robust for single-brand implementation. Needs phase reordering, snapshot integration, and multi-brand planning to be production-grade.
