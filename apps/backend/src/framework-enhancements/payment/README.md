# Stripe GBP Provider

## What It Fixes

Medusa v2 stores monetary amounts in the minor unit (pence for GBP: 349 = £3.49).  
The Stripe provider's `getSmallestUnit()` treats its input as major units (pounds)  
and multiplies by 100 to convert to pence for Stripe's API. Since amounts are  
already in pence, this results in a **100× overcharge**.

| Without fix | With fix |
|-------------|----------|
| getSmallestUnit(349) → 34,900 | amount ÷ 100 → 3.49 → getSmallestUnit(3.49) → 349 |
| Stripe charges £349.00 | Stripe charges £3.49 ✓ |

## How It Works

This provider extends `StripeBase` from `@medusajs/payment-stripe` and overrides  
`initiatePayment`, `updatePayment`, and `refundPayment`. Each override divides the  
`amount` by 100 before calling the parent method, cancelling out the parent's  
multiplier.

## Registration

In `medusa-config.ts`, the payment module uses this provider instead of the stock one:

```ts
resolve: "./src/framework-enhancements/payment/stripe-gbp-provider",
```

## Upgrade Checklist

After upgrading `@medusajs/payment-stripe`:

1. Create a test cart with a known-price product (e.g., Cumin Seeds 400g = £3.49)
2. Proceed to checkout and inspect browser console for `[payment-fn]` logs:
   - `cart.item_total` should be 349 (pence)
   - `payment_collection.amount` should be 349 (pence)
   - `session amount` should be 349 (pence)
3. Check `payment-debug.log` on the backend for `PAYMENT SESSION CREATED`
4. Place the order and verify the Stripe charge is £3.49, not £349.00
5. If the charge is correct WITHOUT this provider, delete this directory and revert:
   ```ts
   resolve: "@medusajs/payment-stripe",  // back to stock
   ```

## Related

- `subscribers/payment-debug.ts` — logs all payment events for verification
- `AGENTS.md` § Framework Enhancements
- `scripts/verify-pricing.mjs` — pricing verification tests
