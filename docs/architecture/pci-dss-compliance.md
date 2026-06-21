# PCI-DSS Compliance — Stripe Payment Audit

> **Audit Date:** 2026-06-21 | **Auditor:** Automated Code Review | **Verdict:** Compliant (SAQ A)

---

## 1. Compliance Status

The storefront is **PCI-DSS compliant** with the highest scope reduction path (**SAQ A**).
Card data is entirely handled by Stripe's hosted iframe and never touches the merchant's
infrastructure. Only opaque `paymentMethod.id` tokens traverse the application.

---

## 2. Architecture — Card Data Isolation

```
┌─────────────────────────────────────────────────────────────┐
│  STOREFRONT (merchant domain — localhost:8000)              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  <Elements stripe={stripePromise}>                   │   │
│  │    ┌─────────────────────────────────────────────┐  │   │
│  │    │  <CardElement />                            │  │   │
│  │    │                                              │  │   │
│  │    │  ← STRIPE IFRAME (stripe.com domain) ←      │  │   │
│  │    │  Card data typed HERE.                       │  │   │
│  │    │  Merchant JavaScript CANNOT read this iframe. │  │   │
│  │    └─────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  stripe.createPaymentMethod({ card: cardElement })   │   │
│  │    → sends card data directly Stripe API              │   │
│  │    → returns opaque token: "pm_xxx..."               │   │
│  │                                                      │   │
│  │  onPay("pm_xxx...")   ← ONLY the token               │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  Merchant server sends token to Medusa backend              │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│  MEDUSA BACKEND (merchant server)                           │
│                          │                                  │
│  Payment provider receives token "pm_xxx..."                │
│  → Stripe server-side SDK creates PaymentIntent             │
│  → PaymentIntent.confirm() charges the card                 │
│  → Card data was NEVER on this server                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Evidence — Component Chain

### 3.1 Stripe Elements Initialization

**File:** `apps/storefront/src/modules/checkout/components/stripe-payment/index.tsx:7-9`
```tsx
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_KEY || "pk_test_placeholder"
)
```

**Line 117-124 — Elements wrapper isolating the card field:**
```tsx
<Elements stripe={stripePromise}>
  <StripeCardForm
    onPay={onPay}
    isEnabled={!placingOrder}
    total={total}
  />
</Elements>
```

### 3.2 Card Element (iframe)

**Line 93 — Stripe-hosted `<CardElement>`, NOT a native HTML input:**
```tsx
<CardElement
  options={{
    hidePostalCode: true,
    style: { base: { fontSize: "16px", color: "#444" }, invalid: { color: "#e53e3e" } },
  }}
/>
```

`hidePostalCode: true` prevents the iframe from capturing a ZIP/postcode (address is
collected separately in the checkout address step, outside the Stripe iframe).

### 3.3 Card Tokenization (client-side only)

**Lines 47-57 — Card data tokenized in the browser, never sent to merchant:**
```tsx
const cardElement = elements.getElement(CardElement)
if (!cardElement) return

const { error, paymentMethod } = await stripe.createPaymentMethod({
  type: "card",
  card: cardElement,   // ← iframe reference, not card data
})

if (error) { setStripeError(error.message); return }
```

`stripe.createPaymentMethod()` sends card data directly from the Stripe iframe to Stripe's
API. The merchant's page receives only an opaque `paymentMethod.id` token.

### 3.4 Token Only Passed to Backend

**Line 66 — Only the token traverses the application:**
```tsx
await onPay(paymentMethod.id)
```

**File:** `apps/storefront/src/modules/checkout/templates/checkout-form/index.tsx:155-161`
```tsx
await initiatePaymentSession(cart, {
  provider_id: "pp_stripe_stripe",
  data: {
    payment_method: paymentMethodId,   // ← "pm_xxx..." token only
    confirm: true,
    return_url: window.location.href,
  },
})
```

---

## 4. Negative Findings — Red Flag Audit

The following dangerous patterns were **searched for and NOT found** anywhere in the codebase:

| Red Flag Pattern | Matches Found |
|-----------------|---------------|
| Native `<input type="text">` for card numbers | 0 |
| Variable names: `cardNumber`, `card_number` | 0 |
| Variable names: `cvv`, `cvc`, `cardCvc` | 0 |
| Variable names: `expiryDate`, `cardExpiry` | 0 |
| `localStorage` / `sessionStorage` storing card data | 0 |
| Deprecated `stripe.createToken()` API | 0 |
| Card data in React state | 0 |
| Card data in cookies | 0 |
| Card data in server-side API logs | 0 |

All 7 native `<input>` fields found in the checkout module are legitimate address
fields (first_name, last_name, phone, email, address_1, city, checkbox).

---

## 5. SDK Versions

| Package | Version | Status |
|---------|---------|--------|
| `@stripe/react-stripe-js` | `^6.5.0` | Current |
| `@stripe/stripe-js` | `^9.7.0` | Current |

---

## 6. Environment Configuration

| Variable | Value | Status |
|----------|-------|--------|
| `NEXT_PUBLIC_STRIPE_KEY` | `pk_test_51TdfOx...` | **Test key** — replace with `pk_live_...` before production |
| `STRIPE_SECRET_KEY` (backend) | `sk_test_51TdfOx...` | **Test key** — replace with `sk_live_...` before production |
| `STRIPE_WEBHOOK_SECRET` (backend) | `whsec_a737f65c...` | Configured |

**Pre-production action required:** Swap both `sk_test_` and `pk_test_` keys for
live equivalents from the Stripe Dashboard.

---

## 7. PCI SAQ Eligibility

Based on the architecture, the storefront qualifies for **SAQ A** (the simplest
self-assessment questionnaire):

| SAQ A Requirement | How It's Met |
|-------------------|-------------|
| All card data captured via Stripe iframe | `<CardElement>` from `@stripe/react-stripe-js` |
| No electronic card data storage | Zero card data in DB, Redis, localStorage, or cookies |
| Merchant server never handles raw card data | Only `paymentMethod.id` tokens transmitted |
| Stripe hosts the payment form | Stripe Elements iframe served from `js.stripe.com` |
| No custom payment form handling | No manual `<form>` submission with card fields |

---

## 8. Related Documentation

| Document | Relevance |
|----------|-----------|
| `docs/architecture/order-lifecycle.md` | Complete payment flow from checkout through capture |
| `docs/architecture/pricing-denomination.md` | Pricing pipeline — amounts are pence, display is pounds |
| `SETUP.md` | Stripe CLI setup, environment variables, key configuration |
| `apps/backend/src/framework-enhancements/payment/stripe-gbp-provider.ts` | Custom Stripe provider (GBP 100× fix) |
