# Framework Enhancements

> **Purpose:** Extensions to Medusa v2 that fix framework-level issues or add
> capabilities not available in the base install. Maintained separately from
> application code so they can be audited when upgrading Medusa.

## Structure

```
framework-enhancements/
  payment/
    stripe-gbp-provider.ts    # Fixes 100x Stripe overcharge (v2.15.2)
    README.md                 # Upgrade checklist for this enhancement
```

## Conventions

1. Each enhancement lives in its own subdirectory named by domain
2. Every enhancement has a `README.md` explaining:
   - What it fixes and which Medusa version
   - How to verify if it's still needed after an upgrade
   - What to delete/revert when fixed upstream
3. Enhancements are registered in `medusa-config.ts` instead of the stock module
4. Test verification steps are listed so upgrades can be validated

## Active Enhancements

| Enhancement | Medusa Version | Fixes | Status |
|-------------|---------------|-------|--------|
| `stripe-gbp-provider` | 2.15.2 | 100× Stripe overcharge for GBP (getSmallestUnit double-converts pence) | Active |

## Upgrade Procedure

When upgrading Medusa:

1. Run `npx medusa db:migrate` as usual
2. For each active enhancement, follow its README upgrade checklist
3. If an enhancement is no longer needed, delete its directory and revert
   `medusa-config.ts` to use the stock module
4. Run the full test suite: `npx playwright test --project=bdd && node tests/verify-pricing.mjs`
