# AGENTS.md � IndiaGrocers (Extracted Feature Content)

> This content was extracted from AGENTS.md on 2026-06-19 per the Clean Codespace Policy.
> All feature planning, epics, and business requirements now live in /docs/epics/.

---

## End-to-End Journey — Go-Live Tasks

These are the specific customer flows that must work before launch.
Each depends on prior items. Execute in order.

### J1. Complete Registration Flow
**Status:** Partially built — needs email delivery to work
**Depends on:** G1 (email provider API key)

| Step | Action | Current State |
|------|--------|---------------|
| Customer fills signup form | `signup()` in `customer.ts` creates account + auto-logs in | ✅ Working |
| Verification email sent | `auth.ts` subscriber catches `customer.created`, generates token, calls notification service | ✅ Code exists |
| Customer receives email | Notification service delivers via SendGrid | ❌ Needs `SENDGRID_API_KEY` |
| Customer verifies email | `POST /store/auth/verify-email` validates token, marks customer verified | ✅ Code exists |
| Unverified account gated | `verification-gate.tsx` blocks dashboard for unverified | ✅ Code exists |
| Signup → auto-login → dashboard | Restore original flow, defer verification to post-signup prompt | ❌ `signup()` currently returns `createdCustomer` directly |

**Tasks:**
1. Set `SENDGRID_API_KEY` in `apps/backend/.env`
2. Verify `auth.ts` subscriber sends email successfully
3. Test signup → email received → verify → access dashboard

### J2. Forgot Password Flow
**Status:** Partially built — needs email delivery + correct token forwarding
**Depends on:** G1 (email provider API key)

| Step | Action | Current State |
|------|--------|---------------|
| Customer requests reset | `requestPasswordReset()` calls `sdk.auth.resetPassword()` | ✅ Working |
| Reset email sent | `auth.ts` subscriber catches `auth.password_reset`, forwards token | ✅ Code exists |
| Customer receives email | Notification service delivers via SendGrid | ❌ Needs `SENDGRID_API_KEY` |
| Customer enters token + new password | `resetPassword()` calls `sdk.auth.updateProvider()` | ✅ Working |
| Customer signs in with new password | `login()` standard flow | ✅ Working |

**Tasks:**
1. Verify `auth.ts` subscriber correctly forwards Medusa's reset token
2. Test end-to-end: request → email received → reset → login

### J3. Add to Basket
**Status:** Working
**Depends on:** Nothing

| Step | Current State |
|------|---------------|
| ProductCard "Add" button | ✅ `addToCart()` dispatches cart-updated event |
| Variant overlay (Options button) | ✅ `ProductOverlay` with +/- quantity |
| Cart dropdown updates | ✅ `cart-updated` event listener |
| Cart persists across navigation | ✅ Cart in Medusa session |

### J4. Checkout
**Status:** Partially working — fake payment, fake shipping
**Depends on:** G10 (Stripe payment)

| Step | Action | Current State |
|------|--------|---------------|
| Address entry | Shipping address form | ✅ Working |
| Delivery selection | Shipping method selector | ⚠️ May show dummy methods |
| Payment | Fake buttons labelled "Powered by Stripe" but calls `pp_system_default` | ❌ No Stripe integration |
| Review | Order summary + place order button | ✅ Working |

**Tasks:**
1. Install + configure `@medusajs/payment-stripe`
2. Integrate `@stripe/react-stripe-js` in checkout form
3. Create Stripe webhook endpoint
4. Test payment flow with test keys

### J5. Create Order + Confirmation
**Status:** Partially working — order created, no confirmation sent
**Depends on:** J4 (payment), G1 (email)

| Step | Action | Current State |
|------|--------|---------------|
| Cart completed | `sdk.store.cart.complete()` → order created | ✅ Working |
| Order confirmation page | `/order/{id}/confirmed` with order details | ✅ Working |
| Order confirmation email | Subscriber on `order.placed` sends email | ❌ No subscriber exists |
| Invoice PDF | HTML template → PDF attached to email | ❌ No code exists |

**Tasks:**
1. Create `order.placed` subscriber for confirmation email
2. Build HTML-to-PDF invoice template
3. Add downloadable invoice to order history
4. Add print-friendly CSS to order confirmation page
