# Feature Inventory — IndiaGrocers Storefront

> **Purpose:** Complete catalog of every feature, component, page, and data dependency in the application. Used for enhancement planning, gap analysis, and onboarding new developers.
> 
> **Last updated:** June 2026
>
> **Related:** `FEATURE-DEPENDENCY-MAP.md` (category handle dependencies), `Implementation/README.md` (setup + execution log)

---

## 1. Pages & Routes

All routes live under `app/[countryCode]/` via `middleware.ts` (country-code-aware routing). Two layout groups exist:

- **`(main)`** — Standard layout with `Nav`, `Footer`, `CartMismatchBanner`, `FreeShippingPriceNudge`, `PantryShell`
- **`(checkout)`** — Minimal layout with branded header and back-to-cart link

### 1.1 Public Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `(main)/page.tsx` | **Homepage** — personalized: returning customer vs new customer (see §8.1) |
| `/search` | `(main)/search/page.tsx` | **Search** — full-text via MeiliSearch with autocomplete, synonyms, dietary chips (see §3.7) |
| `/store` | `(main)/store/page.tsx` | **All Products** — paginated grid with inline sort, cart sidebar |
| `/categories/[...category]` | `(main)/categories/[...category]/page.tsx` | **Category browsing** — routes to one of 4 templates based on page metadata (see §3.9) |
| `/products/[handle]` | `(main)/products/[handle]/page.tsx` | **Product Detail Page** — grocery-optimized PDP (see §3.4) |
| `/collections/[handle]` | `(main)/collections/[handle]/page.tsx` | **Collection page** — filtered product listing |
| `/cart` | `(main)/cart/page.tsx` | **Cart page** — full cart management (see §3.2) |
| `/wishlist` | `(main)/wishlist/page.tsx` | **Wishlist** — localStorage-backed product grid |
| `/brands` | `(main)/brands/page.tsx` | **Brands directory** — A-Z brand listing with product counts |
| `/delivery` | `(main)/delivery/page.tsx` | **Delivery information** — charges table, postcode zones, FAQ |
| `/offers` | `(main)/offers/page.tsx` | **Special offers** — deals grouped by price band |
| `/shop/weekly` | `(main)/shop/weekly/page.tsx` | **Weekly Shop** — reorder from past orders |
| `/health` | `(main)/health/page.tsx` | **Health check** — simple status page |

### 1.2 Checkout Pages

| Route | File | Purpose |
|-------|------|---------|
| `/checkout` | `(checkout)/checkout/page.tsx` | **Checkout** — 3-step flow: Address → Delivery → Payment (see §3.3) |

### 1.3 Order Pages

| Route | File | Purpose |
|-------|------|---------|
| `/order/[id]/confirmed` | `(main)/order/[id]/confirmed/page.tsx` | **Order confirmation** — green checkmark, order number, delivery ETA, items, guest save-prompt |
| `/order/[id]/transfer/[token]/accept` | `(main)/order/[id]/transfer/[token]/accept/page.tsx` | Accept order transfer |
| `/order/[id]/transfer/[token]/decline` | `(main)/order/[id]/transfer/[token]/decline/page.tsx` | Decline order transfer |

### 1.4 Account Pages

| Route | File | Purpose |
|-------|------|---------|
| `/account` (logged out) | `(main)/account/@login/page.tsx` | **Login/Register** — 5 auth states: sign-in, register, forgot-password, reset-password, verify-email |
| `/account` (logged in) | `(main)/account/@dashboard/page.tsx` | **Account overview** — welcome, profile stats, recent orders |
| `/account/profile` | `(main)/account/@dashboard/profile/page.tsx` | **Profile editing** — name, email, phone, password |
| `/account/addresses` | `(main)/account/@dashboard/addresses/page.tsx` | **Address book** — add/edit/delete addresses |
| `/account/orders` | `(main)/account/@dashboard/orders/page.tsx` | **Order history** — list of past orders |
| `/account/orders/details/[id]` | `(main)/account/@dashboard/orders/details/[id]/page.tsx` | **Order detail** — single order with items, shipping, payment |
| `/account/subscriptions` | `(main)/account/@dashboard/subscriptions/page.tsx` | **Subscriptions** — placeholder for future |
| `/account/reorder` | `(main)/account/@dashboard/reorder/page.tsx` | **Reorder** — placeholder (homepage QuickReorderShelf handles this) |

---

## 2. Account & Authentication (`modules/account/`)

### 2.1 Auth Flow (5 states)

Managed by `templates/login-template.tsx` — a view-switcher with states:

| View | Component | Purpose |
|------|-----------|---------|
| `SIGN_IN` | `components/login/` | Email + password form. Calls `login()` server action. "Forgot password?" link captures email and switches to forgot-password view. |
| `REGISTER` | `components/register/` | First name, last name, email, phone, password form. **Custom features:** email validation, password strength rules (8+ chars, 1+ letter, 1+ number) with visual checkmarks, "agree to Privacy Policy & Terms" link. Calls `signup()` server action. |
| `FORGOT_PASSWORD` | `components/forgot-password/` | Email input. Calls `requestPasswordReset()`. On success shows "Check Your Email" + "Enter Reset Code" button. |
| `RESET_PASSWORD` | `components/reset-password/` | Reset code input + new password + confirm password. Calls `resetPassword()`. On success redirects to sign-in. |
| `VERIFY_EMAIL` | `components/verify-email/` | Verification code input from email. Calls `verifyEmail()`. On success shows green checkmark + sign-in link. |

### 2.2 Account Dashboard

| Component | File | Purpose |
|-----------|------|---------|
| `AccountLayout` | `templates/account-layout.tsx` | Desktop grid layout: 280px sidebar + content area. Mobile: stacked with hamburger toggle. |
| `AccountNav` | `components/account-nav/` | Sidebar navigation: Overview, Profile, Addresses, Orders, Subscriptions, Reorder, Logout. Desktop gradient header with user initial avatar + email. Mobile hamburger with "Hello {name}". Active state: orange right-border indicator. |
| `Overview` | `components/overview/` | Dashboard: "Welcome to your IndiaGrocers account" heading, profile completion percentage bar, saved addresses count, total orders count, 5 most recent orders with status badges (color-coded: green=fulfilled, blue=shipped, orange=other). Empty state: "No recent orders" + "Start Shopping" button. |
| `VerificationGate` | `components/verification-gate/` | Gating component: blocks unverified accounts from dashboard. Shows "Verify Your Email" prompt with inbox-check CTA and link to login page. Checks `customer.metadata.email_verified === false`. Grandfathered accounts (no metadata) pass through. |

### 2.3 Profile Editing

| Component | File | Purpose |
|-----------|------|---------|
| `ProfileName` | `components/profile-name/` | Edit first/last name. Uses shared `AccountInfo` disclosure panel. Calls `updateCustomer()`. |
| `ProfileEmail` | `components/profile-email/` | Edit email address. Currently a stub — returns `{ success: true }` without API call. |
| `ProfilePhone` | `components/profile-phone/` | Edit phone number. Calls `updateCustomer()`. |
| `ProfilePassword` | `components/profile-password/` | Change password. Currently disabled — shows "not implemented" toast. |
| `ProfileBillingAddress` | `components/profile-billing-address/` | Edit billing address. Uses `AccountInfo` disclosure panel. |
| `AccountInfo` | `components/account-info/` | Reusable collapsible edit panel. Uses `@headlessui/react` `Disclosure` with expand/collapse transition. Shared by all profile components. |

### 2.4 Address Management

| Component | File | Purpose |
|-----------|------|---------|
| `AddressBook` | `components/address-book/` | Grid of saved address cards + "Add Address" button. |
| `AddressCard` | `components/address-card/` | Contains `add-address.tsx` (modal form for new address) and `edit-address-modal.tsx` (edit/delete existing address). Full address fields: name, company, address, city, postcode, country, phone. |

### 2.5 Orders

| Component | File | Purpose |
|-----------|------|---------|
| `OrderOverview` | `components/order-overview/` | Lists all orders as `OrderCard` components. Empty state: "Nothing to see here" + "Continue shopping". |
| `OrderCard` | `components/order-card/` | Order summary: order number (`#display_id`), date, item count, thumbnail strip (first 4 items), total, status badge with color. |
| `TransferRequestForm` | `components/transfer-request-form/` | Order transfer: enter email to request transfer to another account. |

### 2.6 Data Dependencies

| Data Function | Source | Purpose |
|--------------|--------|---------|
| `login()` | `lib/data/customer.ts` | Authenticate with email + password |
| `signup()` | `lib/data/customer.ts` | Register new account, auto-login |
| `signout()` | `lib/data/customer.ts` | Clear auth token, remove cart |
| `retrieveCustomer()` | `lib/data/customer.ts` | Fetch current customer profile |
| `updateCustomer()` | `lib/data/customer.ts` | Update customer fields |
| `requestPasswordReset()` | `lib/data/customer.ts` | Trigger reset password email |
| `resetPassword()` | `lib/data/customer.ts` | Set new password with reset token |
| `verifyEmail()` | `lib/data/customer.ts` | Validate verification token via API |
| `listOrders()` | `lib/data/orders.ts` | Fetch customer's order history |
| `retrieveOrder()` | `lib/data/orders.ts` | Fetch single order details |

### 2.7 Backend Integration

| Backend Service | File | Purpose |
|----------------|------|---------|
| `subscribers/auth.ts` | `apps/backend/src/subscribers/` | Listens to `customer.created` and `auth.password_reset` — generates verification tokens, sends emails via notification module |
| `api/auth/verify-email/route.ts` | `apps/backend/src/api/auth/` | `POST /store/auth/verify-email` — validates token, marks customer verified |

---

## 3. Checkout (`modules/checkout/`)

### 3.1 Flow

3-step wizard driven by URL search param `?step=address|delivery|payment`.

| Step | Component | What Happens |
|------|-----------|-------------|
| **Address** | Inline in `checkout-form/index.tsx` | First name, last name, address, city, phone, email, postcode. London postcode validation (140+ outward codes). "Same as billing" checkbox. |
| **Delivery** | `DeliverySlotSelector` | Date picker + 3 time windows (Morning 8am-12pm, Afternoon 12pm-4pm, Evening 4pm-8pm). 5-day lookahead. Premium express option. |
| **Payment** | `StripePayment` | Stripe CardElement (`hidePostalCode: true`). Order summary (items, subtotal, delivery, total). T&C checkbox. "Pay" button initiates payment session + order completion. |

### 3.2 Payment Architecture

The checkout form calls `initiatePaymentSession()` → `placeOrder()`:

```
handlePlaceOrder()
  → initiatePaymentSession(cart, { provider_id })
     → POST /store/payment-collections { cart_id }    ← creates payment collection
     → POST /payment-collections/{id}/payment-sessions ← sets provider session
  → placeOrder()
     → sdk.store.cart.complete(cartId)                  ← creates order
```

**Provider selection:**
- Card entered via Stripe → `pp_stripe_stripe` with `data: { payment_method: "pm_xxx" }`
- No card → `pp_system_default` (manual payment)

### 3.3 Components

| Component | File | Purpose |
|-----------|------|---------|
| `StepIndicator` | `components/step-indicator/` | 3-step visual progress bar: Address → Delivery Slot → Payment. Current step highlighted orange, completed steps green checkmark. |
| `AddressSelect` | `components/address-select/` | Dropdown to choose from saved addresses. |
| `CountrySelect` | `components/country-select/` | Country dropdown populated from region data. |
| `PostcodeValidator` | `components/postcode-validator/` | Real-time London postcode validation. Checks against 140+ outward codes (Central, East, North, NW, South, West, Outer London). Shows green check (valid), amber warning (unknown/outer), red (invalid). |
| `DeliverySlotSelector` | `components/delivery-slot-selector/` | Date + time window picker. Slots: Morning (8am-12pm), Afternoon (12pm-4pm), Evening (4pm-8pm). Premium express option with surcharge. |
| `StripePayment` | `components/stripe-payment/` | `@stripe/react-stripe-js` CardElement inside `<Elements>` provider. `hidePostalCode: true` (UK cards don't need ZIP). Calls `stripe.createPaymentMethod()` on submit. |
| `DiscountCode` | `components/discount-code/` | Promo code input. Apply via `applyPromotions()`. Remove button for active codes. |
| `ErrorMessage` | `components/error-message/` | Reusable error banner. Used across auth + checkout forms. |
| `SubmitButton` | `components/submit-button/` | Form submit button with loading spinner animation. |

### 3.4 Data Dependencies

| Function | Purpose |
|----------|---------|
| `setAddresses()` | Update cart with shipping address + email |
| `initiatePaymentSession()` | Create payment collection + provider session via API |
| `placeOrder()` | Complete cart → create order → redirect to confirmation |
| `applyPromotions()` | Apply discount codes to cart |
| `listCartOptions()` | Fetch available shipping options |

---

## 4. Products (`modules/products/`)

### 4.1 Product Detail Page

**File:** `templates/grocery-pdp.tsx`

| Section | Feature |
|---------|---------|
| Image Gallery | Main image + thumbnail strip. Placeholder fallback. |
| Product Info | Title, brand badge, price, weight chips, variant selector. |
| Brand Switcher | `BrandSwitcher` — switch between brands for same product type (e.g., switch from Natco to TRS Cumin Seeds). |
| Allergen Section | `AllergenSection` — UK FIC 2014 compliant: 14 allergens listed, bold highlighting in ingredients text. |
| Product Details Accordion | `ProductDetailsSection` — ingredients, storage instructions, allergen info, dietary flags, weight/size info. Uses expand/collapse panels. |
| Frequently Bought Together | `FrequentlyBoughtTogether` — cross-sell product carousel on PDP. |
| Related Products | `RelatedProducts` — related products carousel with skeleton loader fallback. |
| Add to Cart | `ProductActions` — quantity selector + "Add to Cart" button. Integrates with pantry context. |
| Subscription Option | `SubscribeSave` — toggle for subscription-eligible products. |

### 4.2 Product Cards

Two card types, selected by `ProductPreview` wrapper based on product type.

| Card | File | When Used | Features |
|------|------|-----------|----------|
| **ProductCard** | `product-card.tsx` | Search results, home rails, collection pages | Thumbnail, title, brand badge, weight chip, price, "Add" button, wishlist heart, "Options" button (opens overlay for multi-variant) |
| **WeightHeavyProductCard** | `weight-heavy-card.tsx` | Category pages (all templates) | Everything above + weight chips with unit pricing (e.g., "£0.89/100g"), best-value highlighting, variant metadata extraction from `GroceryVariantMetadata` |

**Mobile/Desktop variants:** Both cards have separate mobile layouts (horizontal: image left, text right) and desktop layouts (vertical stack).

### 4.3 Product Overlay

**File:** `components/product-preview/product-overlay.tsx`

Modal overlay triggered by "Options" button on multi-variant products. Shows all weight/size variants with individual +/- quantity controls, total price calculation, and "Add to Cart" button. Closed by ESC key or click-outside.

### 4.4 Components

| Component | Purpose |
|-----------|---------|
| `Thumbnail` | Product image with placeholder fallback (`PlaceholderImage` SVG). Used across all product displays. |
| `ImageGallery` | PDP image gallery: main image + clickable thumbnail strip. |
| `VariantChips` | Clickable pill buttons for weight/size variants. Active state: orange border. Reads from `GroceryVariantMetadata.weight_label`. |
| `AllergenSection` | UK allergen display: "Contains: **Wheat**, **Milk**" — bold formatting inside ingredients string. |
| `ProductDetailsSection` | Accordion with collapsible panels: Ingredients, Storage, Allergens, Dietary, Weight Info. Uses smooth height animation. |
| `BrandSwitcher` | Dropdown to switch between brands for the same product. Fetches related products from different brands. |
| `FrequentlyBoughtTogether` | Cross-sell product carousel. Shows up to 4 related products from same category. |
| `RelatedProducts` | Related products section. Skeleton loader during fetch. |
| `SubscribeSave` | Subscription toggle. Reads `metadata.subscription_eligible`. Shows discount percentage. |
| `ProductPrice` | Price display: sale price in red, original price strikethrough. |
| `ProductActions` | Quantity selector (1-10) + "Add to Cart" button. |
| `ProductOnboardingCta` | Admin onboarding banner — shown when `_medusa_onboarding` cookie exists. |

### 4.5 Data Dependencies

| Function | Purpose |
|----------|---------|
| `retrieveProductByHandle()` | Full product with variants, images, categories, metadata |
| `listProducts()` | Product listing with price filtering, region filtering |
| `fetchProductsByIds()` | Bulk product fetch (used by MeiliSearch result hydration) |

---

## 5. Cart (`modules/cart/`)

### 5.1 Cart Page

**File:** `templates/index.tsx`

| Feature | Description |
|---------|-------------|
| Items List | `ItemsTemplate` — each item shows thumbnail, title, variant, unit price, quantity selector (1-10), line total, remove button. |
| Order Summary | `Summary` — subtotal, delivery charge, applied promos, total. |
| Progress Bar | `BasketProgressBar` — visual £15 min order → £45 free delivery. Shows remaining amount. |
| Bulk Upgrade | `BulkUpgradeNudge` — detects when a larger variant gives better value (lower £/kg). Suggests swap with savings display. |
| Category Reminder | `CategoryReminderStrip` — "Have you got everything?" — shows categories user hasn't added items from. **Currently has 7/10 dead links (old seed handles).** |
| Complete Basket | `CompleteYourBasket` — suggests missing category items. |
| Sign-in Prompt | `SignInPrompt` — "Already have an account?" for guests. |
| Empty State | `EmptyCartMessage` — "Your cart is empty" + "Explore products" link. |
| Cart Sidebar | Persistent right sidebar on xl+ screens showing cart contents. |

### 5.2 Components

| Component | Purpose |
|-----------|---------|
| `Item` | Single line item: thumbnail, title, variant name, unit price, quantity +/- buttons, remove trash button. |
| `EmptyCartMessage` | Empty cart state with illustration and CTA. |
| `SignInPrompt` | Guest user prompt — "Sign in for a better experience." |
| `BasketProgressBar` | Progress visualization: colored bar, current/target amounts, shipping message. |
| `BulkUpgradeNudge` | Value comparison: detects price-per-unit savings for larger variants. Shows "Save £X.XX — switch to 2kg" callout. |
| `CategoryReminderStrip` | Horizontal chip strip: categories with checkmarks (already in cart) or arrows (suggested). Links to `/categories/{handle}`. |
| `CompleteYourBasket` | Missing category suggestions with product thumbnails. |
| `CartItemSelect` | Bulk selection toggle for cart items (select all/deselect). |

### 5.3 Data Dependencies

| Function | Purpose |
|----------|---------|
| `retrieveCart()` | Fetch current cart with items, region, promotions |
| `updateLineItem()` | Change item quantity |
| `deleteLineItem()` | Remove item from cart |
| `addToCart()` | Add product variant to cart |
| `applyPromotions()` | Apply discount code |

---

## 6. Homepage (`modules/home/`)

### 6.1 Personalization

The homepage has two modes based on customer status:

| Mode | Trigger | Shows |
|------|---------|-------|
| **Returning customer** | Authenticated + has order history | "Welcome back" + `WeeklyShopCard` + `QuickReorderShelf` + `HeroCarousel` + `CategoryGrid` |
| **New customer** | Guest or first-time | `NewCustomerOnboarding` (regional preferences) + `FeaturedProducts` + `HeroCarousel` + `CategoryGrid` |

Both modes show: `Testimonials`, 4 promo banners (Free Delivery, Express, Farm Fresh, Best Price), `WhatsAppFloat`.

### 6.2 Components

| Component | Purpose |
|-----------|---------|
| `HeroCarousel` | Auto-rotating 3-slide hero: emoji + title + subtitle + CTA button. Slides: Dal & Lentils (green), Oils & Ghee (amber), Rice & Grains (orange). Interval: 5 seconds. |
| `CategoryGrid` | 6×2 grid of parent categories. Each card: emoji icon (from `category-emojis.ts`), category name, `→ Browse` CTA. Fetches categories dynamically from API. |
| `FeaturedProducts` | Collection-based product rails. Each collection → horizontal scrollable `ProductRail`. Uses `FeaturedProductsSkeleton` during loading. |
| `Testimonials` | 4 customer reviews carousel: "Priya K." (5 stars, Croydon), "Rajesh M." (5 stars, Tooting), "Lakshmi S." (5 stars, Sutton), "Arjun V." (5 stars, Wembley). Previous/next navigation. |
| `WhatsAppFloat` | Fixed bottom-right WhatsApp button (#25D366 green). Pupup message bubble: "Need help? Chat with us" + "Start Chat" link to `wa.me/{number}`. Dismissible via localStorage persistence. |
| `QuickReorderShelf` | Pantry-based quick reorder. Shows running-low items first (with amber badge), then stocked items. Each item: thumbnail, title, "Add" button. "Add All" bulk button at top. |
| `WeeklyShopCard` | CTA card: "Your Weekly Shop" based on last order date and item count. Links to `/shop/weekly`. |
| `NewCustomerOnboarding` | Regional cuisine preference selector: 5 cuisine cards (Punjabi, South Indian, Gujarati, Bengali, East African Asian). Persists selection to localStorage (`indiagrocers_region`). Sets `preferred_cuisines` cookie. |
| `PantryShell` | Wraps children in `PantryProvider` context (see §14.1). |
| `Hero` | Original Medusa starter hero component — **unused**, retained as reference. |

---

## 7. Layout & Navigation (`modules/layout/`)

### 7.1 Navigation Bar

**File:** `templates/nav/index.tsx`

| Element | Description |
|---------|-------------|
| Logo | "IndiaGrocers" — `text-brand-orange` + `text-grey-90` secondary color. |
| Promo Banner | "FREE DELIVERY on orders over GBP 40 · Order by 2pm for next day delivery". |
| Search | Inline search form: placeholder "Search rice, spices, dals...", submits to `/gb/search?q=...`. |
| Account | "Hi, {name}" for logged-in users, "Account" for guests. Links to `/account`. |
| Cart | Cart icon with item count badge. Opens `CartDropdown` on click. |
| Browse (Mega Menu) | Desktop "Browse" dropdown: "All Products" link + divider + 2-column grid of parent categories with child subcategories. |
| Category Strip | Below-promo secondary nav: horizontal scrollable parent category list. Each hover opens a mega menu with children. |
| Mobile Hamburger | Opens `SideMenu` (slide-in from left). |
| Mobile Bottom Nav | 5-tab bar (visible `< md`): Home, Search, Browse, Reorder, Account. |
| Sticky Basket Bar | Fixed bottom bar (mobile): basket total, item count, progress bar, "Checkout" CTA. |

### 7.2 Category Data

`fetchNavCategories()` fetches all categories via `listCategories()`, filters to parents with `category_children.length > 0`, returns `{ name, handle, children }`. This is **fully dynamic** — no hardcoded handles.

### 7.3 Footer

**File:** `templates/footer/index.tsx`

| Section | Content |
|---------|---------|
| Branding | "IndiaGrocers" — "Your trusted source for authentic Indian groceries in London." |
| Quick Links | Dynamic: parent categories from API. |
| Customer Service | Delivery Information, All Products, Special Offers. |
| Connect | Facebook, Instagram, YouTube social icons — **currently placeholder `#` links**. |
| Contact | Address: "123 Green Street, London E1 6AN, UK", Phone: "+44 20 7123 4567", WhatsApp: "+44 7867 226626". |
| We Accept | Visa, Mastercard, Amex badges. |
| Copyright | "© {year} IndiaGrocers London. All rights reserved." |
| MedusaCTA | "Powered by Medusa & Next.js" attribution (legitimate). |

### 7.4 Navigation Components

| Component | Purpose |
|-----------|---------|
| `NavSearch` | Header search input with magnifying glass icon. |
| `CartButton` | Cart icon + badge. Opens dropdown on click. |
| `CartDropdown` | Popover dropdown: item list with thumbnails, quantities, prices. "View Cart" link at bottom. Listens to `cart-updated` window event. |
| `CartSidebar` | Persistent right sidebar (visible xl+): cart items, quantities, totals. Listens to `cart-updated` events. |
| `CartMismatchBanner` | Fixes cart-customer ID mismatch: if logged-in customer has a different cart, shows banner to transfer or start fresh. |
| `SideMenu` | Mobile slide-in menu: Home, Store, Account, Cart links + category tree + country/language selectors + footer with copyright. |
| `CountrySelect` | Region/currency selector dropdown. Lists all available regions. |
| `LanguageSelect` | Locale/language dropdown. |
| `MobileBottomNav` | 5-tab mobile nav: Home (🏠), Search (🔍), Browse (📂), Reorder (🔄), Account (👤). |
| `StickyBasketBar` | Fixed bottom bar on mobile: basket total, count, free-delivery progress, "Checkout" button. |
| `FreeShippingPriceNudge` | Shows how much more to spend for free delivery (`£X.XX away from free delivery`). Placed in main layout, appears above page content. |

---

## 8. Search (`modules/search/`)

### 8.1 Search Template

**File:** `templates/index.tsx`

| Feature | Description |
|---------|-------------|
| Search Input | Full-width input: "Search for rice, spices, dals, snacks...". Magnifying glass icon. Loading spinner during search. |
| Autocomplete | Dropdown with up to 5 matching products. Each result: thumbnail, title, brand badge, price. "View all results" link at bottom. Debounced at 200ms. Click-outside closes. |
| Synonym Detection | Inline synonym map for 27 Indian grocery term pairs. Detected synonyms shown: `"Showing results for 'gram flour'"` when searching "besan". |
| Dietary Chips | Vegetarian, Vegan, Gluten-Free, Halal, Organic filter chips. Toggle on/off. Active chip: green background. |
| Category Chips | Parent categories as quick-filter chips. Fetched dynamically from API. |
| Brand Chips | Auto-extracted from search results. Shows top 10 brands with counts. Active chip: orange. |
| Product Grid | 2/3/4 column responsive grid of `ProductCard` components. |
| Load More | "Load More Products" button for additional results (12 per page). |
| No Results | "No results found" with suggestion to try different terms or browse categories. |
| Empty State | "Start typing or select a category to find products". |

### 8.2 Synonym Map

27 bidirectional pairs: besan/gram flour, hing/asafoetida, sooji/semolina, jeera/cumin, haldi/turmeric, dhania/coriander, methi/fenugreek, saunf/fennel, ajwain/carom seeds, imli/tamarind, ghee/clarified butter, paneer/indian cheese, chana/chickpeas, moong/mung, masoor/red lentils, urad/black gram, toor/pigeon pea, mirchi/chilli, poha/flattened rice, panch phoron/five spice, namak/salt, shakkar/cane sugar, mooli/daikon, karela/bitter melon, kadi patta/curry leaves, atta/chapati flour, malai/cream.

### 8.3 Data Dependencies

| Function | Source | Purpose |
|----------|--------|---------|
| `searchProducts()` | `lib/search-client.ts` | MeiliSearch query with limit + offset |
| `autocompleteProducts()` | `lib/search-client.ts` | MeiliSearch with limit=5 |
| `fetchProductsByIds()` | `lib/data/products.ts` | Hydrate MeiliSearch result IDs into full products |

---

## 9. Categories (`modules/categories/`)

### 9.1 Template Selection

The category page (`app/[...category]/page.tsx`) routes to one of 4 templates based on category handle:

| Handle Match | Template | Visual Style |
|-------------|----------|-------------|
| `grains`, `lentils`, `flours` | `WeightHeavy` | Weight chips, unit pricing, best-value badges |
| `spices` | `BrandShowcase` | Brand-filtered browsing with brand tiles |
| Phase 2/3 (`frozen`, `fresh`, etc.) | `ComingSoon` | Placeholder with waitlist |
| Everything else | `StandardGrid` | Grid with filters, sort, brand tiles |

### 9.2 Category Resolution

`resolveCategoryHandles(category)` recursively walks `category_children` to build a MeiliSearch filter:

```typescript
// Parent category: category_handle IN ["grains", "rice-quinoa", "flour-milk-powder", ...]
// Leaf category:  category_handle = "rice-quinoa"
```

**Fully dynamic** — no hardcoded handles in the resolution logic.

### 9.3 Template Components

| Template | Features |
|----------|----------|
| `StandardGrid` | Breadcrumbs, `SubTypeChips`, `BrandTilesStrip`, `FilterPanel` (price range + brand), `InlineSort`, weight-heavy product cards in 3-column grid, VAT notice. |
| `WeightHeavy` | Same as StandardGrid plus: `LoadMore` pagination, bulk-upgrade nudges, cart sidebar. |
| `BrandShowcase` | 35+ brand filter tiles (MDH, Everest, Shan, TRS, Natco, etc.), brand-switching dropdown, product filtering by selected brand. |
| `ComingSoon` | Emoji header, title, description, "Expected: {date}" badge, email waitlist signup form. |

### 9.4 Empty States

All templates have empty states when filtering returns zero products. These include "Or browse:" cross-sell links — **but links point to old seed handles (dead). See `FEATURE-DEPENDENCY-MAP.md` for the fix.**

---

## 10. Order Display (`modules/order/`)

### 10.1 Order Confirmation

**File:** `templates/order-completed-template.tsx`

| Element | Description |
|---------|-------------|
| Success Banner | Green checkmark icon + "Thank you!" + "Your order has been placed." |
| Order Number | `#display_id` display. |
| Delivery ETA | Estimated delivery date (today + 2 days for morning slots, + 3 for afternoon/evening). |
| Items List | Product thumbnails, titles, quantities, prices. |
| Delivery Address | Address card with name + address lines. |
| Payment Method | Payment provider card (e.g., "Manual Payment"). |
| Order Summary | Subtotal, delivery, total. |
| Guest Save Prompt | "Create an account" prompt for guest users — links to `/account?mode=register`. |
| Continue Shopping | CTA button back to store. |

### 10.2 Order Components

| Component | Purpose |
|-----------|---------|
| `Items` | Order items list with quantities and prices. |
| `Item` | Single order line item display. |
| `OrderDetails` | Order metadata: ID, date, customer email, fulfillment status. |
| `OrderSummary` | Subtotal, shipping, discount, tax, total. |
| `ShippingDetails` | Shipping address card. |
| `PaymentDetails` | Payment method card. |
| `Help` | Customer support links: "Need help? Contact us". |
| `TransferActions` | Accept/decline transfer buttons. |
| `TransferImage` | Order transfer illustration. |

---

## 11. Wishlist (`modules/wishlist/`)

**Storage:** `localStorage` with key `indiagrocers_wishlist`.

| Component | Purpose |
|-----------|---------|
| `WishlistButton` | Heart toggle button on product cards and PDP. Filled orange heart = in wishlist, outline = not. |
| Wishlist Page (`templates/index.tsx`) | Grid of wishlisted products with remove buttons. Empty state: large heart icon + "Your wishlist is empty" + "Start Shopping" button. |

---

## 12. Store / Browsing (`modules/store/`)

### 12.1 Store Page

| Component | Purpose |
|-----------|---------|
| `InlineSort` | Sort dropdown: Default, Latest Arrivals, Price Low→High, Price High→Low, Name A→Z, Name Z→A, Weight Largest First. |
| `FilterPanel` | Price range (min/max inputs), brand filter (text input). Active filter chips displayed with clear buttons. |
| `SubTypeChips` | Horizontal scrollable child-category navigation chips. Shows categories within the current parent. |
| `BrandTilesStrip` | Horizontal scrollable brand tiles with product counts. Click filters products by brand. |
| `PaginatedProducts` | Server-side product fetching with JSON pagination. |
| `ProductGridLoadMore` | Client-side "Load More" button — appends 12 products per click. |
| `InfiniteScrollGrid` | Infinite scroll variant (alternative to load more). |

### 12.2 Sort Options

| Option | Parameter | Description |
|--------|-----------|-------------|
| Default (Relevance) | No param | MeiliSearch ranking rules (words → typo → proximity → attribute → sort → velocity → exactness) |
| Latest Arrivals | `created_at:desc` | Newest products first |
| Price: Low to High | `price_gbp:asc` | Ascending by variant price |
| Price: High to Low | `price_gbp:desc` | Descending by variant price |
| Name: A-Z | `title:asc` | Alphabetical |
| Name: Z-A | `title:desc` | Reverse alphabetical |
| Weight: Largest First | `weight_grams:desc` | Heaviest products first |

---

## 13. Brands (`modules/brands/`)

| Component | Purpose |
|-----------|---------|
| Brands Page (`templates/index.tsx`) | A-Z brand directory. Extracts brand from product titles using regex `product.title.match(/\s+-\s+(.+)$/)`. Groups by first letter, shows product count per brand. Click navigates to `?brand={brand}` search. |

---

## 14. Delivery (`modules/delivery/`)

| Component | Purpose |
|-----------|---------|
| Delivery Page (`templates/index.tsx`) | Charges table: Standard Delivery (£3.99, 2-3 working days), Express Delivery (£5.99, next day if ordered by 2pm), Free Delivery (orders over £40). Postcode zone table: Central, East, North, South, West London with example postcodes. |
| FAQ Accordion (`components/faq-accordion.tsx`) | Expandable FAQ items. Questions: delivery times, order tracking, missing items, returns policy. |

---

## 15. Regional (`modules/regional/`)

| Component | Purpose |
|-----------|---------|
| Regional Page (`templates/index.tsx`) | Products grouped by regional cuisine preference (Punjabi, South Indian, Gujarati, Bengali, East African Asian). Reads `preferred_cuisines` cookie. "Browse by Category" cross-links — **6 of 8 links are dead (old seed handles)**. |

---

## 16. Offers (`modules/offers/`)

| Component | Purpose |
|-----------|---------|
| Offers Page (`templates/index.tsx`) | Deals grouped by price band: "Under £5", "Under £10", "Bulk Deals" (large-format products with lowest price-per-unit). Products filtered by price range and weight. |

---

## 17. Weekly Shop (`modules/weekly-shop/`)

| Component | Purpose |
|-----------|---------|
| Weekly Shop Page (`templates/index.tsx`) | Rebuild last order. Each item: quantity selector, current price, price-change indicator (red ↑ for increase, green ↓ for decrease). "Add All to Basket" bulk button. |

---

## 18. Common Components (`modules/common/`)

### 18.1 Shared UI

| Component | Purpose |
|-----------|---------|
| `Breadcrumb` | Dynamic breadcrumb nav: `Home > Category > Subcategory`. Walks `parent_category` chain from API. |
| `CartTotals` | Order total summary: subtotal, shipping, discount, tax, grand total. |
| `Checkbox` | Styled checkbox with label. |
| `DeleteButton` | Trash icon button — calls delete action. |
| `Divider` | Horizontal rule with optional label. |
| `EmptyState` | "No products found" with filter-clear suggestion. |
| `FilterRadioGroup` | Radio button group for filter options. |
| `Input` | Styled form input with floating label, focus ring. |
| `InteractiveLink` | Accessible link component. |
| `LineItemOptions` | Variant options display for cart/order items. |
| `LineItemPrice` | Price display for line items. |
| `LineItemUnitPrice` | Per-unit price display. |
| `LocalizedClientLink` | Country-code-aware Next.js `Link` wrapper — auto-prepends `/[countryCode]`. |
| `Modal` | Reusable modal dialog with backdrop. |
| `NativeSelect` | Styled `<select>` dropdown. |
| `Radio` | Styled radio input. |

### 18.2 Icons (18 custom SVGs)

Back, Bancontact, ChevronDown, Eye, EyeOff, FastDelivery, iDeal, MapPin, Medusa, Nextjs, Package, PayPal, PlaceholderImage, Refresh, Spinner, Trash, User, X.

---

## 19. Loading Skeletons (`modules/skeletons/`)

**11 component skeletons + 4 page skeletons.** Used as React Suspense fallbacks during data fetching.

| Type | Items |
|------|-------|
| Component Skeletons | Button, Card Details, Cart Item, Cart Totals, Code Form, Line Item, Order Confirmed Header/Info/Items/Summary, Product Preview |
| Page Skeletons | Cart Page, Order Confirmed, Product Grid, Related Products |

---

## 20. Custom Features Index

### C1–C10: Homepage

| # | Feature | Location | What Makes It Custom |
|---|---------|----------|---------------------|
| **C1** | WhatsApp Float | `home/components/whatsapp-float.tsx` | Floating chat button with dismissible popup. Not in Medusa starter. |
| **C2** | Customer Testimonials | `home/components/testimonials.tsx` | 4 London-based reviews with star ratings. Original content. |
| **C3** | Hero Carousel | `home/components/hero-carousel.tsx` | Indian grocery themed slides. Replaces starter "Ecommerce Starter Template" hero. |
| **C4** | Category Grid with Emojis | `home/components/category-grid.tsx` + `lib/constants/category-emojis.ts` | Custom emoji mapping per category. |
| **C5** | Returning vs New Customer Homepage | `app/(main)/page.tsx` | Personalization engine — different content for new vs returning customers. |
| **C6** | Regional Onboarding | `home/components/new-customer-onboarding/` | 5 cuisine preferences saved to localStorage. |
| **C7** | Weekly Shop Reorder | `home/components/weekly-shop-card/` + `modules/weekly-shop/` | Rebuild last order with price-change indicators. |
| **C8** | Quick Reorder Shelf | `home/components/quick-reorder-shelf/` | Pantry-based reorder — running-low items first. |
| **C9** | Virtual Pantry | `lib/context/pantry-context.tsx` | localStorage-based pantry tracker per product. |
| **C10** | 4 Promo Banners | Homepage inline | Free Delivery, Express, Farm Fresh, Best Price. |

### C11–C20: Products & Categories

| # | Feature | Location | What Makes It Custom |
|---|---------|----------|---------------------|
| **C11** | Weight-Heavy Product Cards | `products/.../weight-heavy-card.tsx` | Unit pricing, best-value chips, variant metadata. Grocery-specific. |
| **C12** | Grocery PDP Template | `products/templates/grocery-pdp.tsx` | Allergen section, brand switcher, product details accordion, pantry integration. |
| **C13** | Allergen Display (UK Compliant) | `products/.../allergen-section/` + `lib/util/allergen-display.ts` | 14-allergen bold highlighting per UK FIC 2014. |
| **C14** | Brand Showcase Template | `categories/templates/brand-showcase.tsx` | 35+ brand filter tiles with product counts. |
| **C15** | Brand Tiles Strip | `store/components/brand-tiles-strip/` | Scrollable brand filter. |
| **C16** | Sub-Type Chips | `store/components/sub-type-chips/` | Child-category navigation within a parent category. |
| **C17** | Coming Soon Pages | `categories/templates/coming-soon.tsx` | Phase 2/3 placeholder with waitlist. |
| **C18** | Category Phase System | `lib/util/category-phase.ts` | Maps categories to rollout phases. |
| **C19** | Multi-Variant Overlay | `products/.../product-overlay.tsx` | Modal with individual variant +/- controls. |
| **C20** | Brand Switcher on PDP | `products/.../brand-switcher/` | Switch between brands for same product. |

### C21–C30: Checkout & Cart

| # | Feature | Location | What Makes It Custom |
|---|---------|----------|---------------------|
| **C21** | London Postcode Validation | `lib/util/postcode-validation.ts` + `checkout/.../postcode-validator/` | 140+ London outward codes with valid/warning/unknown states. |
| **C22** | Delivery Slot Selector | `checkout/.../delivery-slot-selector/` | 3 time windows, 5-day lookahead, premium express option. |
| **C23** | Basket Progress Bar | `cart/.../basket-progress-bar/` | £15 min → £45 free delivery visual progress. |
| **C24** | Bulk Upgrade Nudges | `cart/.../bulk-upgrade-nudge/` | Value comparison: larger variant saves money. |
| **C25** | Category Reminder Strip | `cart/.../category-reminder-strip/` | Cross-sell category suggestions. **7/10 links dead.** |
| **C26** | Complete Your Basket | `cart/.../complete-your-basket/` | Missing category item suggestions. |
| **C27** | Stripe Payment UI | `checkout/.../stripe-payment/` | CardElement with `hidePostalCode: true`. |
| **C28** | Guest Save Prompt | Order completed template | Post-purchase account creation prompt. |

### C31–C40: Navigation & Search

| # | Feature | Location | What Makes It Custom |
|---|---------|----------|---------------------|
| **C29** | Browse Mega Menu | `layout/templates/nav/index.tsx` | 2-column category grid dropdown. |
| **C30** | Category Strip (Desktop) | `layout/templates/nav/index.tsx` | Horizontal scrollable parent categories with per-category mega menus. |
| **C31** | Cart Sidebar (Desktop) | `layout/.../cart-sidebar/` | Persistent right sidebar on xl+ screens. |
| **C32** | Mobile Bottom Nav | `layout/.../mobile-bottom-nav/` | 5-tab mobile navigation. |
| **C33** | Sticky Basket Bar (Mobile) | `layout/.../sticky-basket-bar/` | Fixed bottom bar with basket summary + checkout CTA. |
| **C34** | Free Shipping Price Nudge | `shipping/.../free-shipping-price-nudge/` | "£X.XX away from free delivery" message. |
| **C35** | Dietary Filter Chips | `search/templates/index.tsx` | Vegetarian, Vegan, Gluten-Free, Halal, Organic quick-filters. |
| **C36** | Synonym Detection in Search | `search/templates/index.tsx` | 27-pair Indian grocery synonym map. |
| **C37** | MeiliSearch Integration | `lib/search-client.ts` | Full-text search with ranking, autocomplete, filtering. |
| **C38** | Pseudo-Query System | `lib/util/pseudo-query.ts` + `category-tags.json` | Category relevance scoring (currently disabled). |
| **C39** | A-Z Brands Directory | `modules/brands/` | Brand listing extracted from product titles. |
| **C40** | Sort by Weight | `store/.../inline-sort/` | "Weight: Largest First" grocery-specific sort. |

### C41–C45: Account & Infrastructure

| # | Feature | Location | What Makes It Custom |
|---|---------|----------|---------------------|
| **C41** | Email Verification Flow | `account/.../verify-email/` + `verification-gate/` + backend subscriber | Custom JWT verification with SendGrid emails. |
| **C42** | Password Strength Meter | `account/.../register/` | Visual rule checklist with checkmarks. |
| **C43** | Order Transfer System | `order/.../transfer-*` + account transfer form | Complete transfer flow: request → token → accept/decline. |
| **C44** | Frequently Bought Together | `products/.../frequently-bought-together/` | PDP cross-sell carousel. |
| **C45** | Subscribe & Save | `products/.../subscribe-save/` | Subscription option for eligible products. |

---

## 21. Data Layer (`lib/data/`)

All are server-side functions (`"use server"`) calling the Medusa JS SDK.

### 21.1 Cart (`cart.ts`)

| Function | Purpose |
|----------|---------|
| `retrieveCart()` | Fetch current cart with items, region, promotions, shipping methods |
| `createCart()` | Create empty cart for initial requests |
| `updateCart()` | Update cart fields (email, region, shipping) |
| `addToCart()` | Add product variant to cart |
| `deleteLineItem()` | Remove item from cart |
| `updateLineItem()` | Change item quantity |
| `setAddresses()` | Set shipping + billing address on cart |
| `placeOrder()` | Complete cart → create order → redirect to confirmation |
| `initiatePaymentSession()` | Create payment collection + provider session via Medusa Store API |
| `applyPromotions()` | Apply/remove discount codes |
| `listCartOptions()` | Fetch available shipping options |

### 21.2 Customer (`customer.ts`)

| Function | Purpose |
|----------|---------|
| `retrieveCustomer()` | Fetch current authenticated customer |
| `login()` | Authenticate with email + password |
| `signup()` | Register new account, auto-login |
| `signout()` | Clear auth token + cart |
| `updateCustomer()` | Update customer profile fields |
| `requestPasswordReset()` | Trigger password reset email via Medusa auth |
| `resetPassword()` | Set new password with reset token |
| `verifyEmail()` | Call `/store/auth/verify-email` with verification token |
| `transferCart()` | Transfer guest cart to authenticated customer |

### 21.3 Products & Categories

| Function | File | Purpose |
|----------|------|---------|
| `listProducts()` | `products.ts` | Paginated product listing with region/price filtering |
| `fetchProductsPage()` | `products.ts` | Server-side pagination helper |
| `fetchProductsByIds()` | `products.ts` | Bulk fetch by ID array (used by MeiliSearch hydration) |
| `retrieveProductByHandle()` | `products.ts` | Full product with variants, images, categories, metadata |
| `listCategories()` | `categories.ts` | All categories with children + products (limit 200) |
| `getCategoryByHandle()` | `categories.ts` | Single category by URL handle |

### 21.4 Orders & Collections

| Function | File | Purpose |
|----------|------|---------|
| `listOrders()` | `orders.ts` | Customer's order history |
| `retrieveOrder()` | `orders.ts` | Single order with items, payments, fulfillment |
| `createTransferRequest()` | `orders.ts` | Request order transfer to another email |
| `listCollections()` | `collections.ts` | All collections |
| `retrieveCollection()` | `collections.ts` | Single collection by handle |

### 21.5 Regions & Shipping

| Function | File | Purpose |
|----------|------|---------|
| `listRegions()` | `regions.ts` | Available regions |
| `retrieveRegion()` | `regions.ts` | Region by ID |
| `getRegion()` | `regions.ts` | Region by country code |
| `listCartShippingMethods()` | `fulfillment.ts` | Shipping options for cart |

### 21.6 Cookies & Auth

| Function | File | Purpose |
|----------|------|---------|
| `getAuthHeaders()` | `cookies.ts` | Build auth headers from JWT cookie |
| `getCacheTag()` | `cookies.ts` | Generate cache tag for revalidation |
| `getCacheOptions()` | `cookies.ts` | Cache TTL configuration |
| `getCartId()` | `cookies.ts` | Read cart ID from cookies |
| `setCartId()` | `cookies.ts` | Write cart ID to cookies |
| `removeCartId()` | `cookies.ts` | Clear cart cookie |
| `setAuthToken()` | `cookies.ts` | Store JWT in httpOnly cookie |
| `removeAuthToken()` | `cookies.ts` | Clear auth cookie |

---

## 22. Hooks & Utilities (`lib/util/`)

### 22.1 Hooks

| File | Purpose |
|------|---------|
| `use-in-view.tsx` | Intersection Observer — detects element viewport entry (lazy loading/analytics) |
| `use-toggle-state.tsx` | Boolean toggle hook (used by `AccountInfo` disclosure panels) |

### 22.2 Utilities

| File | Purpose |
|------|---------|
| `allergen-display.ts` | UK Food Regs: 14-allergen code→name mapping, bold highlighting in ingredients |
| `category-phase.ts` | Category → rollout phase mapping (Phase 2/3 categories) |
| `category-tags.json` | Precomputed category tag frequencies for pseudo-query |
| `compare-addresses.ts` | Deep-compare two address objects |
| `env.ts` | `getBaseURL()` — Vercel URL / env var / localhost default |
| `format-price.ts` | `formatGBP()`, `formatUnitPrice()`, `getWeightLabel()`, VAT-inclusive |
| `get-locale-header.ts` | Build locale header from cookies |
| `get-percentage-diff.ts` | Percentage difference between two numbers (price changes) |
| `get-product-price.ts` | Cheapest variant price extraction |
| `isEmpty.ts` | Null/undefined/empty check |
| `local-cache.ts` | Client-side TTL cache (localStorage, 5-min default) |
| `medusa-error.ts` | Error normalizer — readable messages from API errors |
| `money.ts` | `convertToLocale()` — currency formatting (default `en-GB`) |
| `postcode-validation.ts` | London delivery zones: 140+ outward codes + validation function |
| `product.ts` | `isSimpleProduct()` — single-variant detection |
| `pseudo-query.ts` | Category-tag-based relevance query builder (returns `""` — disabled) |
| `repeat.ts` | Array creation helper |
| `sort-products.ts` | Client-side product sorter (price, title, date, weight) |

---

## 23. Context Providers

### 23.1 PantryContext

**File:** `lib/context/pantry-context.tsx`

Virtual pantry system for tracking customer stock levels:

| Method | Purpose |
|--------|---------|
| `addItem(handle, name)` | Add product to pantry |
| `removeItem(handle)` | Remove product from pantry |
| `toggleRunningLow(handle)` | Toggle low-stock status |
| `isInPantry(handle)` | Check if product is tracked |
| `runningLow` | Array of low-stock items |
| `stocked` | Array of stocked items |

**Storage:** `localStorage` with key `indiagrocers_pantry`. Entries: `{ handle, name, runningLow }`.

### 23.2 ModalContext

**File:** `lib/context/modal-context.tsx`

Provides `close()` function to modal children via React context. Used by product overlay, address modals, and other dialog components.

---

## 24. Types (`types/`)

### 24.1 Grocery Product Types

**File:** `types/product.ts`

| Type | Definition |
|------|------------|
| `Allergen` | UK FIC 14: `"celery" \| "gluten" \| "crustaceans" \| "eggs" \| "fish" \| "lupin" \| "milk" \| "molluscs" \| "mustard" \| "peanuts" \| "sesame" \| "soya" \| "sulphites" \| "tree-nuts"` |
| `VatRate` | `0 \| 0.2` |
| `WeightUnit` | `"g" \| "kg" \| "ml" \| "l"` |
| `DietaryFlag` | `"vegetarian" \| "vegan" \| "gluten-free" \| "halal" \| "organic" \| "dairy-free" \| "nut-free" \| "kosher"` |
| `RegionalTag` | `"punjabi" \| "south-indian" \| "gujarati" \| "bengali" \| "east-african-asian"` |
| `VelocityClass` | `"A" \| "B"` |
| `GroceryProductMetadata` | Full product metadata: brand_slug, country_of_origin, dietary_flags, allergens, velocity, sourcing_tier, vat_rate, eco_rating, regional_tags, ingredients, storage, best_before |
| `GroceryVariantMetadata` | Variant metadata: weight_value, weight_unit, weight_grams, price_per_unit, price_per_unit_label, is_best_value, low_stock_threshold |

---

## 25. Configuration & Middleware

### 25.1 SDK Configuration

**File:** `lib/config.ts`

Initializes the Medusa JS SDK with:
- `baseUrl`: `MEDUSA_BACKEND_URL` or `http://localhost:9000`
- `apiKey`: `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
- `defaultHeaders`: auto-injects locale from cookies

### 25.2 Middleware

**File:** `middleware.ts`

Country detection order:
1. Country in URL path (`/[countryCode]/...`)
2. `x-vercel-ip-country` header (Vercel edge)
3. `NEXT_PUBLIC_DEFAULT_REGION` env var
4. First available region from Medusa API

Cache: region map cached for 1 hour.

### 25.3 Constants

**File:** `lib/constants.tsx`

Payment provider icon map: Stripe, iDeal, Bancontact, PayPal, system default.

**File:** `lib/constants/category-emojis.ts`

Emoji mappings per category name (used in category grid, not handle-dependent).

---

## 26. MeiliSearch Configuration

### 26.1 Search Client

**File:** `lib/search-client.ts`

Functions: `searchProducts(query, options)`, `autocompleteProducts(query)`. Both hit `POST /indexes/products/search` with MeiliSearch REST API. Supports limit, offset, filter parameters.

### 26.2 Index Configuration

**File:** `apps/meilisearch/scripts/configure-index.ts`

| Setting | Value |
|---------|-------|
| Searchable attributes | `title`, `description`, `tags`, `metadata.ingredients` |
| Filterable attributes | `category_handle`, `collection_handle`, `tags`, `metadata.dietary_flags`, `metadata.allergens`, `metadata.velocity` |
| Sortable | `price_gbp`, `weight_grams`, `created_at`, `metadata.velocity` |
| Ranking rules | `words`, `typo`, `proximity`, `attribute`, `sort`, `metadata.velocity:desc`, `exactness` |
| Synonyms | 21 global bidirectional synonym groups |

### 26.3 Subscriber

**File:** `apps/backend/src/subscribers/product-index.ts`

Auto-indexes products on `product.created` and `product.updated` events. Fetches full product via query graph, builds MeiliSearch document, upserts to index.

---

## 27. Backend Subscribers (Notification & Events)

| File | Events | Action |
|------|--------|--------|
| `subscribers/auth.ts` | `customer.created`, `auth.password_reset` | Generate verification token, send email via notification module (SendGrid/local) |
| `subscribers/order-confirmation.ts` | `order.placed` | Fetch order via remote query, build HTML confirmation email, send via notification module |
| `subscribers/product-index.ts` | `product.created`, `product.updated` | Index product into MeiliSearch |
| `subscribers/product-price-updated.ts` | `product.updated`, `product-variant.updated` | Recalculate variant pricing |

---

## 28. Feature Count Summary

| Category | Count |
|----------|-------|
| Pages/Routes | 24 |
| Custom Features | 45 |
| Account Components | 13 |
| Cart Components | 8 |
| Checkout Components | 9 |
| Product Components | 12 |
| Home Components | 9 |
| Layout Components | 12 |
| Search Components | 1 template (6 sub-features) |
| Category Templates | 4 |
| Order Components | 8 |
| Data Layer Functions | 20 |
| Utilities | 17 |
| Hooks | 2 |
| Context Providers | 2 |
| Shared Components | 13 |
| Icons | 18 |
| Loading Skeletons | 15 |
| Backend Subscribers | 4 |
| **Total** | **~225 pieces** |
