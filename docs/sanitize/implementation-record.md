# IP & Brand Scrubbing — Implementation Record

> **Date:** 2026-06-21 | **Status:** Phase 1 Complete | **Next:** Phase 2 (SVG migration, deeper microcopy)

---

## Phase 1 — Completed

### 1. Design Tokens — Independent Color Palette

**File:** `apps/storefront/tailwind.config.js` (full rewrite)

| Change | Before | After |
|--------|--------|-------|
| **Neutral palette** | Dual `grey` + `stone` scales with conflicting warm tones | Single unified `grey` 11-stop scale; `stone` mapped as backward-compatible alias |
| **Primary brand** | `#FF6B35` (borrowed from generic palette) | `#EA580C` — self-determined orange, accessible on white |
| **Supporting accents** | `saffron`, `cardamom` (named after Indian spices — reads as ethnic-branding) | `amber`, `evergreen` — neutral descriptive names. Old names kept as aliases |
| **Charcoal** | `#1A1A2E` (blue-tinted) — a different hue family | `#171717` — warm near-black, same hue family as the neutral scale |
| **Red/Green status** | `#EF4444` / `#22C55E` (Tailwind defaults) | `#DC2626` / `#16A34A` (slightly adjusted for palette cohesion) |

**Backward compatibility:** All existing `brand-saffron`, `brand-cardamom`, `brand-cardamom-dark`, `brand-charcoal` class names still work via aliases in the config.

### 2. Font Loading — Inter via `next/font/google`

**File:** `apps/storefront/src/app/layout.tsx`

| Before | After |
|--------|-------|
| Inter declared in font stack but never loaded | `Inter` imported from `next/font/google` with `subsets: ["latin"]`, `display: "swap"` |
| No CSS variable for font | `--font-inter` CSS variable set on `<html>` |
| Viewport themeColor `#FF6B35` | Updated to `#EA580C` to match new brand orange |

### 3. CSS Custom Properties — Synced with Tailwind

**File:** `apps/storefront/src/styles/globals.css:134-149`

All 10 `:root` CSS custom properties updated to match the new Tailwind `brand.*` token values. No more drifth between CSS variables and Tailwind config.

### 4. Microcopy — Brand-Scrubbed Text

| File | What changed |
|------|-------------|
| `store-config.ts` | `FREE DELIVERY on orders over £40 · Order by 2pm for next day delivery` → `Free delivery on orders over £40 · Order by 2pm for your next-day slot`. Time slot labels simplified (dropped parens). Cutoff time `2:00 PM` → `2pm` |
| `hero-carousel.tsx` | All 3 slides rewritten. "Cook Delicious Protein-Rich Meals" → "Your weekly grocery shop, delivered". "Shop Now" → "Browse". Inline SVG arrow → lucide `ArrowRight` |
| `testimonials.tsx` | "Trusted by Customers" → "What our customers say". Redundant subtitle "Here is what our customers say about us" — removed |
| `postcode-validator/index.tsx` | "London zone" → removed. "Join our waitlist" → "Notify me". "expand to your area" → "reach". SaaS-style "waitlist" language completely purged |
| `order-completed-template.tsx` | "Order Confirmed!" → "Order placed!". Status tracker: "Processing" → "Preparing", "Out for Delivery" → "On the way". "Enjoy your groceries!" → "Enjoy". "Order Status" → "Where my order is" |
| `cart/templates/summary.tsx` | "Proceed to Checkout" → "Go to Checkout". "Have a promo code?" → "Got a code?". "FREE" → "Free" (all-caps removed) |

### 5. Lucide-Reactive Icons

**Installed:** `lucide-react` added to `apps/storefront` dependencies via `yarn add`

**First replacement:** Hero carousel inline SVG arrow → `<ArrowRight>` from lucide-react

**Existing library usage unchanged:** `@medusajs/icons` and `@heroicons/react` imports left in place (23 files already use them). Migration to unified lucide can happen gradually.

---

## Phase 2 — Remaining (Prioritized Inventory)

### Microcopy — Remaining Files

| Priority | File | Issue |
|----------|------|-------|
| HIGH | `order-confirmation-client.tsx` | "Attempt X of Y" exposes internal polling. "Your order has been placed successfully" is Amazon-verbatim |
| HIGH | `basket-progress-bar` | "Free delivery unlocked!" is gamification language |
| MEDIUM | `checkout-form/index.tsx` | "Guest checkout — no account needed". 30+ other microcopy strings |
| MEDIUM | `delivery-slot-selector` | "next-day delivery required" is ops language. "8am-based slots" is internal jargon |
| LOW | `sign-in-prompt` | "Sign in for a better experience" is Medusa template default |
| LOW | `empty-cart-message` | "Your cart is empty" → "Your basket's empty" for consistency |

### SVG → Lucide Migration — Remaining Files

~38 inline SVG occurrences across ~25 files. Priority order:

| Priority | Icon Pattern | Count | Lucide Replacement |
|----------|-------------|-------|-------------------|
| HIGH | Checkmark (`M5 13l4 4L19 7`) | 8 uses | `<Check>` |
| HIGH | X/Close (`M6 18L18 6M6 6l12 12`) | 7 uses | `<X>` |
| HIGH | Spinner (`circle cx=12...`) | 5 uses | `<Loader2 className="animate-spin">` |
| MEDIUM | Search magnifier | 4 uses | `<Search>` |
| MEDIUM | Heart | 3 uses | `<Heart>` |
| MEDIUM | User avatar | 2 uses | `<User>` |
| MEDIUM | ChevronRight | 5 uses | `<ChevronRight>` |
| LOW | Shopping cart | 3 uses | `<ShoppingBag>` |

### Custom Icon Components

13 custom icon components in `common/icons/` to replace with lucide equivalents. Brand logos (WhatsApp, iDEAL, Bancontact, PayPal) to keep as-is.

---

## Verification

```bash
# Storefront build check
cd apps\storefront
yarn build

# Tailwind compiles — verify new color tokens render
# Open any page — check Inter font is loading (Network tab → fonts.googleapis.com)
```

## Rollback

All changes are backward-compatible:
- Old `brand-saffron`, `brand-cardamom`, `brand-cardamom-dark`, `brand-charcoal` class names still work via aliases
- `stone-*` class names still work — mapped into the unified grey scale
- No component files had their Tailwind class names changed
- Microcopy changes are string-only replacements
