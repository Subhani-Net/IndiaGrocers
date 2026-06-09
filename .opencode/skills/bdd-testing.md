# BDD Testing Standard

**Auto-loaded skill.** All test-related work MUST follow these rules.

## Core Rule — Two Artifacts Per Feature

Every feature, bugfix, or behavior change produces exactly TWO files:

| File | Purpose |
|------|---------|
| `.feature` | Business documentation — declarative Gherkin, self-contained scenarios |
| `.steps.ts` | Automation layer — Playwright step definitions with `Given/When/Then` |

## Feature File Rules

### Must include `## Business Rules` comment block at top
```gherkin
Feature: Cart Management

  ## Business Rules
  # - Cart persists in Medusa session (survives navigation + refresh)
  # - Quantity is tracked per variant, not per product
  # - Empty cart shows a clear CTA to start shopping
```

### Steps MUST be declarative (business intent), NOT imperative
```
✅ When the user adds "Natco - Cumin Seeds 400g" to their basket
❌ When the user clicks the button with data-testid "add-to-cart-btn"
```

### Scenarios MUST be self-contained
- No shared global state across scenarios
- Each scenario sets up its own preconditions via `Given`
- Named products used for readability: `"Natco - Cumin Seeds 400g"`

### Tag conventions
```
@W01  @search      # Workflow tag + domain tag
@D5   @bugfix      # Defect tag + type tag
@smoke @regression # Priority tags
```

## Step Definition Rules

### File naming: `{domain}.steps.ts`
```
e2e/features/cart/cart.feature    # Gherkin
e2e/features/cart/cart.steps.ts   # Step definitions
```

### Use Playwright-style (preferred)
```ts
import { createBdd } from "playwright-bdd"
import { test } from "@playwright/test"

const { Given, When, Then } = createBdd(test)

Given("the user is on the {string} category page", async ({ page }, handle: string) => {
  await page.goto(`/gb/categories/${handle}`)
  await page.waitForSelector(".product-card", { timeout: 10000 })
})
```

### Use `data-testid` selectors in step implementations
- Business language in `.feature`, testids in `.steps.ts`
- Never expose testids in feature files

### Common steps go in `e2e/features/common.steps.ts`
- Reusable across all feature files
- Loaded once by playwright-bdd

## Workflow Tags

| Tag | Workflow |
|-----|----------|
| `@W01` | Product Discovery (search, browse, PDP) |
| `@W02` | Cart Management (add, qty, remove) |
| `@W03` | Checkout (address, delivery, payment, review) |
| `@W04` | Account (register, login, forgot-password) |
| `@W05` | Order Confirmation |
| `@W06` | Wishlist |
| `@W07` | Admin Pricing |
| `@W08` | Admin Consolidation |

## Defect Tags

| Tag | Defect |
|-----|--------|
| `@D1` | Delivery slots — 4-hour weekend only |
| `@D2` | Basket sidebar sticky scroll |
| `@D4` | Add to Basket — no visual feedback |
| `@D5` | Payment fails |
| `@D6` | Cart image on mobile not working |
| `@D7` | Order confirmation email prices are £0.00 |
| `@D8` | Price display — values displayed as multiples of 100 |
| `@G14` | Payment refunds (future) |
| `@G15` | Order modification + weight-based charging (future) |

## When Adding a New Feature
1. Read `tests/test-plan.md` for workflow context
2. Create `e2e/features/{workflow}/{feature-name}.feature` with Business Rules + scenarios
3. Create `e2e/features/{workflow}/{feature-name}.steps.ts` with step definitions
4. Add any shared steps to `e2e/features/common.steps.ts`
5. Run: `npx playwright test --project=bdd`

## When Fixing a Bug
1. Read defect from AGENTS.md
2. Add `@bugfix` scenario to relevant `.feature` file
3. Write scenario that REPRODUCES the bug first
4. Add adjacent regression scenario for the fixed behavior
5. NEVER delete existing scenarios

## When Updating a Feature
1. Read existing `.feature` file first — it's the contract
2. APPEND new scenarios only (never delete, per AGENTS.md)
3. If business rule changes, update the `## Business Rules` comment

## Running Tests
```bash
npx playwright test --project=bdd          # BDD tests only
npx playwright test --project=e2e           # Traditional tests only
npx playwright test                          # All projects
```
