# Customer Journeys & Feature Backlog — IndiaGrocers London

> **Purpose:** Gherkin E2E test scenarios for automated testing + user story
> backlog for features to be built. These mirror real customer journeys through
> the Indian grocery online store.
>
> **Last updated:** May 2026
>
> **Related:** [AGENTS.md](../AGENTS.md) — repo setup, commands, go-live requirements

---

## Journey 1: New Customer — Discovery & First Purchase

A first-time visitor lands on the site, browses, selects a product, adds to
cart, checks out as a guest, and optionally creates an account afterwards.

### Scenario 1.1: Homepage loads successfully

```
Feature: Homepage

  Scenario: New visitor lands on homepage
    Given the backend is running and seeded with products
    When I navigate to "/gb"
    Then I see the hero carousel with at least 1 slide
    And I see the category grid with at least 1 category card
    And I see at least 1 featured product rail
    And I see the 4 promo banners (Free Delivery, Express, Farm Fresh, Best Price)
    And I see the testimonials section
    And I see the WhatsApp floating button
    And no console errors are logged
```

### Scenario 1.2: Browse categories from homepage

```
Feature: Category Discovery

  Scenario: Customer clicks a category from the homepage grid
    Given I am on the homepage "/gb"
    When I click the first category card in the category grid
    Then I am navigated to "/gb/categories/[handle]"
    And I see breadcrumb navigation (All Products > Category Name)
    And I see the category title and description
    And I see subcategory chips for child categories
    And I see a grid of product cards (or a "No products found" message)
    And I see the cart sidebar on xl+ screens
```

### Scenario 1.3: Browse categories from mega menu

```
Feature: Mega Menu Navigation

  Scenario: Customer uses the desktop mega menu to browse
    Given I am on the homepage "/gb"
    When I hover over the "Browse" button in the header
    Then I see a dropdown with all parent categories
    And each category shows its child subcategories
    When I click a subcategory link
    Then I am navigated to "/gb/categories/[handle]"
```

### Scenario 1.4: View product detail page

```
Feature: Product Detail Page

  Scenario: Customer opens a product from a category grid
    Given I am on a category page with at least 1 product visible
    When I click a product card
    Then I am navigated to "/gb/products/[handle]"
    And I see the product title, brand badge, and description
    And I see at least 1 product image in the gallery
    And I see the product price
    And I see variant options (if the product has multiple variants)
    And I see the "Add to Cart" button
    And I see the stock status indicator

  Scenario: Customer selects a product variant
    Given I am on a product detail page with multiple variants
    When I click a variant option button (e.g., "500g")
    Then the price updates to reflect the selected variant
    And the stock status updates to reflect the selected variant
    And the URL updates to include the variant ID parameter

  Scenario: Product detail tabs display grocery-specific information
    Given I am on a product detail page
    When I expand the "Product Information" accordion
    Then I see ingredient information (if available)
    And I see storage instructions (if available)
    And I see allergen information (if available)
    And I see weight/size information
    And I do NOT see clothing-store fields (Material, Fit, Country of origin for clothing)
```

### Scenario 1.5: Multi-variant product overlay from card

```
Feature: Product Variant Overlay

  Scenario: Customer opens variant selector from product card
    Given I am on a category or collection page with multi-variant products
    When I click the "Options" button on a product card
    Then a modal overlay opens showing all variants with +/- quantity buttons
    And I can increase quantity for individual variants
    And I can decrease quantity
    And the total price updates
    And pressing ESC closes the overlay
    And clicking outside the overlay closes it
```

### Scenario 1.6: Add product to cart

```
Feature: Add to Cart

  Scenario: Customer adds a single-variant product to cart
    Given I am on a product detail page for a single-variant product
    When I click the "Add to Cart" button
    Then the cart icon in the header updates to show 1 item
    And the cart dropdown opens showing the added item
    And the cart sidebar shows the item with a "NEW" badge

  Scenario: Customer adds multiple variants from overlay
    Given I have opened the product variant overlay
    When I set quantity to 2 for "500g" and click the Add button
    Then the cart reflects both variant quantities

  Scenario: Customer adds a product with a specific quantity from PDP
    Given I am on a product detail page
    When I set the quantity to 3 and click "Add to Cart"
    Then the cart shows 3 units of the product
```

### Scenario 1.7: View cart page

```
Feature: Cart Page

  Scenario: Customer navigates to cart from cart dropdown
    Given I have at least 1 item in my cart
    When I click "View Cart" in the cart dropdown
    Then I see the cart page at "/gb/cart"
    And items are grouped by product category
    And I see a quantity selector (1-10) for each item
    And I see a remove button for each item
    And I see the order summary with subtotal, shipping, and total
    And I see a promo code input field
    And I see the "Proceed to Checkout" button

  Scenario: Customer sees out-of-stock items flagged in cart
    Given I have a mix of in-stock and out-of-stock items in my cart
    When I view the cart page
    Then out-of-stock items are visually flagged with a red alert badge
    And out-of-stock items are displayed at the top of the list

  Scenario: Customer applies a promo code
    Given I am on the cart page with items
    When I enter a valid promo code and click apply
    Then the discount is reflected in the order summary
    When I click remove on the applied promotion
    Then the discount is removed from the order summary

  Scenario: Customer opens empty cart
    Given I have no items in my cart
    When I navigate to "/gb/cart"
    Then I see "Your cart is empty"
    And I see an "Explore products" link
```

### Scenario 1.8: Checkout flow

```
Feature: Checkout

  Scenario: Customer completes full 4-step checkout
    Given I am on the cart page with items and click "Proceed to Checkout"
    Then I am on the checkout page at step 1 (Address)
    And I fill in shipping address details and click continue
    Then I am on step 2 (Delivery)
    And I select a shipping method and click continue
    Then I am on step 3 (Payment)
    And I enter payment details and click continue
    Then I am on step 4 (Review)
    And I see the order summary with items, shipping, and total
    When I click "Place Order"
    Then I am redirected to the order confirmation page
    And I see the order number
    And I see the delivery ETA

  Scenario: Guest checkout works without login
    Given I am not signed in
    When I complete the checkout flow
    Then the order is placed successfully
    And I see the order confirmation page

  Scenario: Customer sees postcode check gate before checkout
    Given I am on the checkout page
    When the postcode check gate is shown
    And I enter a valid London postcode (e.g., "E1 6AN")
    Then the gate passes and I can continue to shop
    When I enter an invalid postcode (e.g., "LS1 1AA")
    Then I see a warning that delivery may not be available
```

### Scenario 1.9: Order confirmation page

```
Feature: Order Confirmation

  Scenario: Customer views order confirmation after purchase
    Given I have just placed an order
    Then I see a green checkmark and "Thank you" message
    And I see the order number
    And I see a delivery ETA
    And I see the delivery address card
    And I see the payment method card
    And I see the list of items ordered with quantities
    And I see the order summary (subtotal, shipping, total)
    And I see a "Continue Shopping" button

  Scenario: Customer receives invoice after purchase
    Given I have just placed an order
    Then I receive an email with a PDF invoice
    And the invoice contains the order number and date
    And the invoice lists all items with quantities and unit prices
    And the invoice shows subtotal, delivery charge, VAT, and grand total
    And the invoice shows IndiaGrocers branding, address, and VAT number
    And I can also download the invoice from my order history page
```

### Scenario 1.10: Create account

```
Feature: Account Registration

  Scenario: New customer registers for an account
    Given I am on the sign-in page "/gb/account"
    When I click "Join us"
    Then I see the registration form
    When I fill in first name, last name, email, phone, and password
    And the password meets all rules (8+ chars, 1+ letter, 1+ number)
    And I click "Join"
    Then my account is created
    And I am redirected to the account dashboard
    And I see "Overview" with my name and email

  Scenario: Registration shows password strength rules
    Given I am on the registration form
    When I type a short password (less than 8 characters)
    Then I see "At least 8 characters" unchecked
    When I type 8 characters without a letter
    Then I see "At least 1 letter" unchecked
    When I type 8 characters without a number
    Then I see "At least 1 number" unchecked
    When I type a valid password (8+ chars with letter and number)
    Then all 3 rules show as satisfied (checkmark)

  Scenario: Duplicate email registration shows error
    Given an account exists with "test@example.com"
    When I try to register with "test@example.com"
    Then I see "An account with this email already exists"

  Scenario: Invalid email format shows error
    Given I am on the registration form
    When I enter "not-an-email" and click "Join"
    Then I see "Please enter a valid email address"
```

---

## Journey 2: Existing Customer — Returning & Reordering

A customer with an account returns, signs in, reviews order history, browses,
and places a repeat order.

### Scenario 2.1: Sign in

```
Feature: Sign In

  Scenario: Existing customer signs in successfully
    Given I have an account with "test@example.com" / "TestPass1"
    When I navigate to "/gb/account"
    And I see the sign-in form
    And I enter "test@example.com" and "TestPass1"
    And I click "Sign in"
    Then I am redirected to the account dashboard
    And I see "Overview" with my name
    And the header shows I am signed in

  Scenario: Invalid credentials show error
    Given I am on the sign-in form
    When I enter wrong email or password
    And I click "Sign in"
    Then I see an error message

  Scenario: Empty fields show validation
    Given I am on the sign-in form
    When I click "Sign in" with empty email and password
    Then the browser shows "required" field validation
```

### Scenario 2.2: Forgot & reset password

```
Feature: Forgot Password

  Scenario: Customer requests password reset
    Given I am on the sign-in form
    When I click "Forgot your password?"
    Then I see the password reset form
    When I enter my email and click "Send Reset Code"
    Then I see "Check Your Email" confirmation
    And the email field is pre-filled

  Scenario: Customer resets password with code
    Given I have received a reset code via email
    When I click "Enter Reset Code" on the confirmation screen
    And I enter the code, new password, and confirm password
    And the password meets all rules
    And I click "Reset Password"
    Then I see "Password Updated" confirmation
    And I can sign in with the new password

  Scenario: Password mismatch shows error
    Given I am on the reset password form
    When I enter different passwords in "New Password" and "Confirm Password"
    And I click "Reset Password"
    Then I see "Passwords do not match"

  Scenario: Weak new password shows error
    Given I am on the reset password form
    When I enter a weak password (less than 8 chars)
    And I click "Reset Password"
    Then I see "Password must be at least 8 characters"
```

### Scenario 2.3: Account dashboard

```
Feature: Account Dashboard

  Scenario: Customer views account overview
    Given I am signed in
    When I navigate to "/gb/account"
    Then I see "Overview" with a welcome message and my name
    And I see my email displayed
    And I see my profile completion percentage bar
    And I see my saved addresses count
    And I see my total orders count
    And I see my 5 most recent orders with status badges

  Scenario: Customer with no orders sees empty state
    Given I am signed in with no orders
    When I view my account overview
    Then I see "No recent orders" with a "Start Shopping" link
```

### Scenario 2.4: Order history

```
Feature: Order History

  Scenario: Customer views all orders
    Given I am signed in with previous orders
    When I click "Orders" in the account sidebar
    Then I see a list of order cards with order number, date, status, and total

  Scenario: Customer views order details
    Given I am on the orders list
    When I click an order card
    Then I see the full order details
    And I see the items ordered
    And I see the shipping details
    And I see the order summary
    And I see a "Back to overview" link

  Scenario: Customer with no orders sees empty state
    Given I am signed in with no orders
    When I view my orders
    Then I see "Nothing to see here" with a "Continue shopping" link
```

### Scenario 2.5: Manage addresses

```
Feature: Address Management

  Scenario: Customer adds a new address
    Given I am signed in and viewing "Addresses"
    When I click "Add address"
    Then a modal opens with address fields
    When I fill in all required fields and save
    Then the new address appears in the address grid

  Scenario: Customer edits an existing address
    Given I have at least 1 saved address
    When I click "Edit" on an address card
    Then I can modify the fields and save

  Scenario: Customer deletes an address
    Given I have at least 1 saved address
    When I click "Delete" on an address card
    Then the address is removed from the grid
```

### Scenario 2.6: Edit profile

```
Feature: Profile Editing

  Scenario: Customer edits their name
    Given I am signed in and viewing "Profile"
    When I click edit on the name field
    And I enter a new first name and save
    Then my name is updated and reflected in the overview

  Scenario: Customer edits their email
    Given I am signed in and viewing "Profile"
    When I click edit on the email field
    And I enter a new email and save
    Then my email is updated

  Scenario: Customer edits their phone number
    Given I am signed in and viewing "Profile"
    When I click edit on the phone field
    And I enter a new phone number and save
    Then my phone number is updated
```

### Scenario 2.7: Sign out

```
Feature: Sign Out

  Scenario: Customer signs out
    Given I am signed in
    When I click "Log out" in the account sidebar
    Then I am redirected to "/gb/account"
    And I see the sign-in form
    And the cart is cleared
```

---

## Journey 3: Product Discovery — Search & Browse

Customer searches, filters, sorts, and browses to find products.

### Scenario 3.1: Text search from nav bar

```
Feature: Nav Search

  Scenario: Customer searches from the header
    Given I am on any page
    When I type "basmati" in the search field and press Enter
    Then I am navigated to "/gb/search?q=basmati"
    And I see search results matching "basmati"

  Scenario: Empty search query
    Given I am on any page
    When I submit an empty search
    Then I am navigated to "/gb/search?q="
    And I see "Start typing or select a category to find products"
```

### Scenario 3.2: Autocomplete search

```
Feature: Search Autocomplete

  Scenario: Search shows autocomplete suggestions
    Given I am on the search page
    When I type "rice" with a 300ms pause
    Then I see a dropdown with up to 5 matching products
    And each result shows a thumbnail, title, and price
    And I see a "View all results" link at the bottom

  Scenario: Clicking outside closes autocomplete
    Given I have autocomplete results visible
    When I click outside the search area
    Then the autocomplete dropdown closes

  Scenario: No matching results
    Given I am on the search page
    When I type "xyznonexistent"
    Then I see "No results found" with a suggestion to try different terms
```

### Scenario 3.3: Category quick-filter in search

```
Feature: Search Category Filter

  Scenario: Customer filters search by category chip
    Given I am on the search page
    When I click the "Rice" category chip
    Then only products in the Rice category are shown
    And the "Rice" chip is visually active

  Scenario: Customer deselects category filter
    Given a category chip is active
    When I click the same chip again
    Then the filter is removed and all results are shown
```

### Scenario 3.4: Product listing — sort and filter

```
Feature: Product Listing Filters

  Scenario: Customer sorts products by price
    Given I am on a category or store page with multiple products
    When I select "Price: Low to High" from the sort dropdown
    Then products are displayed in ascending price order

  Scenario: Customer filters by price range
    Given I am on a category or store page with products
    When I enter a minimum price of 2 and a maximum price of 5
    Then only products priced between £2 and £5 are shown

  Scenario: Customer filters by brand
    Given I am on a category or store page with products
    When I type a brand name in the brand filter
    Then only products matching that brand are shown

  Scenario: Active filters are displayed and can be cleared
    Given I have applied filters
    When I click "Clear Filters"
    Then all filters are removed and full results are shown
```

### Scenario 3.5: Load more pagination

```
Feature: Load More

  Scenario: Customer loads more products
    Given I am on a page showing 12 products with more available
    When I click "Load More"
    Then 12 more products are appended to the grid
    And the "Showing X of Y products" counter updates

  Scenario: All products loaded
    Given all products have been loaded
    When I scroll to the bottom
    Then the "Load More" button is hidden or shows "All products loaded"
```

---

## Journey 4: Cart Management

Customer manages items, quantities, promos, and transitions to checkout.

### Scenario 4.1: Empty cart state

```
Feature: Empty Cart

  Scenario: Customer views empty cart
    Given I have no items in my cart
    When I click the cart icon in the header
    Then the cart dropdown shows "Your cart is empty" with a "Start Shopping" link
    When I navigate to "/gb/cart"
    Then the cart page shows the empty state with "Explore products" link
```

### Scenario 4.2: Update quantity in cart

```
Feature: Cart Quantity

  Scenario: Customer increases item quantity
    Given I have an item in my cart
    When I change the quantity from 1 to 3
    Then the subtotal updates to reflect 3x the unit price

  Scenario: Customer decreases item quantity to zero
    Given I have an item in my cart with quantity 1
    When I change the quantity to 0 or use the remove button
    Then the item is removed from the cart
```

### Scenario 4.3: Sign-in prompt for guests with items

```
Feature: Cart Sign-In Prompt

  Scenario: Guest with items sees sign-in prompt
    Given I am not signed in and have items in my cart
    When I view the cart page
    Then I see "Already have an account? Sign in for a better experience"
```

---

## Journey 5: Wishlist

Customer saves products for later.

### Scenario 5.1: Add product to wishlist

```
Feature: Wishlist

  Scenario: Customer hearts a product from a category grid
    Given I am on a category or collection page
    When I click the heart icon on a product card
    Then the heart icon fills with brand orange color
    And the product is saved to my wishlist

  Scenario: Customer un-hearts a product
    Given a product is in my wishlist
    When I click the filled heart icon
    Then the heart icon returns to outline state
    And the product is removed from my wishlist
```

### Scenario 5.2: View wishlist page

```
Feature: Wishlist Page

  Scenario: Customer views wishlist with items
    Given I have at least 1 product in my wishlist
    When I navigate to "/gb/wishlist"
    Then I see my wishlisted products in a grid
    And each product shows thumbnail, title, and price

  Scenario: Empty wishlist
    Given my wishlist is empty
    When I navigate to "/gb/wishlist"
    Then I see a heart icon and "Your wishlist is empty"
    And I see a "Start Shopping" button
```

---

## Journey 6: Mobile Experience

Customer uses the store on a mobile device.

### Scenario 6.1: Mobile hamburger menu

```
Feature: Mobile Navigation

  Scenario: Customer opens mobile menu
    Given I am on a mobile viewport (width < 768px)
    When I tap the hamburger icon
    Then the side menu slides in
    And I see Home, Store, Account, Cart links
    And I see all category links

  Scenario: Customer closes mobile menu
    Given the mobile side menu is open
    When I tap the close button or outside the menu
    Then the side menu slides out and closes
```

### Scenario 6.2: Mobile product card

```
Feature: Mobile Product Display

  Scenario: Customer views products on mobile
    Given I am on a mobile viewport
    When I view a category or collection page
    Then products are displayed in a horizontal card layout (image left, text right)
```

### Scenario 6.3: Mobile sticky add-to-cart

```
Feature: Mobile Add to Cart

  Scenario: Customer scrolls past the add-to-cart button on PDP
    Given I am on a product detail page on mobile
    When I scroll past the "Add to Cart" button
    Then a sticky add-to-cart bar appears at the bottom
```

---

## Journey 7: Edge Cases & Error Handling

### Scenario 7.1: 404 page

```
Feature: Error Pages

  Scenario: Customer navigates to a non-existent page
    Given I navigate to "/gb/non-existent-page"
    Then I see a 404 "Page not found" message
    And I see a link to return to the homepage

  Scenario: Customer navigates to a non-existent product
    Given I navigate to "/gb/products/non-existent-handle"
    Then I see a 404 page

  Scenario: Customer navigates to a non-existent category
    Given I navigate to "/gb/categories/non-existent"
    Then I see a 404 page
```

### Scenario 7.2: Network error handling

```
Feature: Error Resilience

  Scenario: Backend is unreachable
    Given the Medusa backend is not running
    When I navigate to any store page
    Then I see a sensible error message (not a blank page or raw error)

  Scenario: Product image fails to load
    Given a product has a broken image URL
    When I view the product on a listing or detail page
    Then I see a placeholder/fallback image
```

### Scenario 7.3: Cart persistence

```
Feature: Cart Persistence

  Scenario: Cart persists across page navigation
    Given I have added items to my cart
    When I navigate to a different page and return
    Then my cart still contains the same items

  Scenario: Cart persists across browser refresh
    Given I have added items to my cart
    When I refresh the browser
    Then my cart still contains the same items
```

---

## Journey 8: Admin Operations — Pricing & Invoicing

### Scenario 8.1: Load prices from pricelist

```
Feature: Price Management

  Scenario: Admin loads product prices from a pricelist file
    Given I am signed in as an admin
    When I upload a JSON or CSV pricelist file containing product names and prices
    Then the system maps product names to variant SKUs
    And updates all matched product variant prices
    And reports how many products were updated
    And reports which products in the pricelist were not found

  Scenario: Admin loads prices from a wholesaler C&C price sheet
    Given I have a CSV or Excel price sheet exported from TRS Dhamecha or Bestway
    When I run the pricelist scan script
    Then the system maps C&C product codes to Medusa product handles
    And extracts the wholesale cost prices
    And calculates retail prices as cost + configured margin percentage
    And updates product variant prices accordingly

  Scenario: Admin scans a C&C purchase invoice
    Given I have a scanned PDF or image of a C&C purchase invoice
    When I run the invoice scan script
    Then the system extracts line items (product name, pack size, cost price)
    And maps extracted product names to Medusa products
    And updates variant prices with the actual C&C cost data
    And calculates retail prices as cost + margin percentage
```

### Scenario 8.2: Invoice generation

```
Feature: Invoice Generation

  Scenario: Customer receives invoice email after order
    Given a customer has placed an order
    When the order is confirmed
    Then a PDF invoice is generated with:
      And order number, date, and delivery ETA
      And line items with product name, variant, quantity, unit price, line total
      And subtotal, delivery charge, VAT, and grand total
      And payment method and billing/delivery addresses
      And IndiaGrocers branding, business address, and VAT number
    And the PDF invoice is emailed to the customer

  Scenario: Customer downloads invoice from order history
    Given I am signed in and viewing my order history
    When I click "Download Invoice" on any completed order
    Then a PDF invoice is generated and downloaded
    And the invoice matches the format of the email invoice

  Scenario: Order confirmation page is print-friendly
    Given I am viewing the order confirmation page after placing an order
    When I print the page
    Then the printed output contains all invoice-required information
    And the print layout is clean and professional
```

---

## Feature Backlog — User Stories

All features are written as <code>As a ___ I want ___ so that ___</code>.

### P0 — Blocking (go-live prerequisites)

| ID | User Story | Journey Ref | Status |
|----|-----------|-------------|--------|
| F-G1 | As an **admin**, I want an email notification provider configured so that **customers receive password reset codes and order confirmations**. | J2.2, J1.11 | Not started |
| F-G2 | As a **customer**, I want to see my dashboard after signing in without a manual refresh so that **I know I'm logged in and can continue shopping**. | J2.1 | Broken |
| F-G4 | As a **security admin**, I want rate limiting on auth endpoints so that **attackers cannot brute-force passwords or spam reset emails**. | J2.1, J2.2 | Not started |
| F-G7 | As a **devops engineer**, I want JWT and cookie secrets set from environment variables so that **the site is secure in production**. | All | Not started |
| F-G12 | As an **admin**, I want to load and update product prices from pricelists, C&C price sheets, and purchase invoices so that **customers see real prices, not placeholders, at checkout**. | J1.4, J1.8 | Not started |
| F-G13 | As a **customer**, I want to receive a proper invoice (PDF + downloadable) after placing an order so that **I have a record of my purchase with prices, VAT, and business details**. | J1.9 | Not started |

### P1 — Foundational UX

| ID | User Story | Journey Ref | Status |
|----|-----------|-------------|--------|
| F-01 | As a **customer**, I want product detail tabs to show grocery-relevant information (ingredients, allergens, storage, nutrition) so that **I can make informed purchasing decisions**. | J1.4 | Needs rewrite |
| F-02 | As a **customer**, I want a quantity selector on the product detail page so that **I can add multiple units without going to the cart**. | J1.6 | Not built |
| F-03 | As a **customer**, I want to sort and filter products by price, brand, and category on listing pages so that **I can quickly find what I need**. | J3.4 | Built but not wired |
| F-04 | As a **customer**, I want breadcrumb navigation on product and store pages so that **I know where I am and can easily navigate back**. | J1.4, J3.0 | Partially built |
| F-05 | As a **customer**, I want to add products to my wishlist from the product detail page so that **I can save items for later while viewing them in detail**. | J5.1 | Missing on PDP |
| F-06 | As a **customer**, I want to use gift cards at checkout so that **I can redeem gift card balances toward my purchase**. | J4.5 | Disabled |
| F-07 | As a **customer**, I want to change my account password from my profile so that **I can keep my account secure**. | J2.6 | Disabled in UI |
| F-08 | As a **customer**, I want a loading skeleton shown while featured products load so that **I don't see blank spaces on the homepage**. | J1.1 | Missing |
| F-09 | As a **customer**, I want toast notifications when I add items to my cart or complete actions so that **I get immediate feedback**. | J1.6, J4.0 | Not built |

### P2 — Core Journey Enhancements

| ID | User Story | Journey Ref | Status |
|----|-----------|-------------|--------|
| F-10 | As a **customer**, I want to add delivery instructions (e.g., "leave with neighbor") at checkout so that **the driver knows how to deliver my order**. | J1.8 | Not built |
| F-11 | As a **customer**, I want to select a delivery time slot so that **I can choose when my groceries arrive**. | J1.8, J4.8 | Not built |
| F-12 | As a **customer**, I want my wishlist synced to my account so that **I can access it from any device**. | J5.1 | localStorage only |
| F-13 | As a **customer**, I want to track my order with a carrier tracking number so that **I know exactly when my delivery will arrive**. | J1.11, J2.4 | Not built |
| F-14 | As a **customer**, I want to reorder from my order history so that **I can quickly repeat a previous purchase**. | J2.4 | Not built |
| F-15 | As a **customer**, I want to cancel an order before it ships so that **I can change my mind about a purchase**. | J2.3 | Not built |
| F-16 | As a **guest**, I want to create an account after placing an order so that **I can track it without re-entering my details**. | J1.12 | Not built |
| F-17 | As a **customer**, I want the search country code to be dynamic (not hardcoded "gb") so that **search works correctly in all configured regions**. | J3.1 | Hardcoded |
| F-18 | As a **customer**, I want to use keyboard arrow keys to navigate search autocomplete results so that **I can quickly select a suggestion**. | J3.2 | Not built |
| F-19 | As a **customer**, I want a locale/language selector in the desktop header so that **I can switch languages without opening the mobile menu**. | — | Not built |

### P3 — Polish & Engagement

| ID | User Story | Journey Ref | Status |
|----|-----------|-------------|--------|
| F-20 | As a **customer**, I want to see "Hi, [Name]" in the header when signed in so that **I feel recognized as a returning customer**. | J2.1 | Static link |
| F-21 | As a **customer**, I want to zoom in on product images so that **I can inspect the product details closely**. | J1.4 | Not built |
| F-22 | As a **customer**, I want to share a product on social media so that **I can recommend it to friends**. | J1.4 | Not built |
| F-23 | As a **customer**, I want to see customer reviews on product pages so that **I can read other buyers' experiences**. | J1.4 | Not built |
| F-24 | As a **customer**, I want to toggle between grid and list view on listing pages so that **I can choose my preferred browsing mode**. | J3.4 | Not built |
| F-25 | As a **customer**, I want to choose how many results per page so that **I can see more or fewer products at once**. | J3.5 | Not built |
| F-26 | As a **customer**, I want a "Buy it again" section on my account dashboard so that **I can quickly repurchase frequent items**. | J2.3 | Not built |
| F-27 | As a **customer**, I want to see recently viewed products so that **I can return to products I was considering**. | J1.1 | Not built |
| F-28 | As a **customer**, I want to verify my email address after signing up so that **my account is secure and I can receive order updates**. | J1.10 | Not built |
| F-29 | As a **customer**, I want to verify my phone number so that **I can receive SMS delivery updates**. | J2.6 | Not built |

---

## Status Summary

| Journey | Scenarios | Passing | Failing | Not Testable |
|---------|-----------|---------|---------|--------------|
| J1 — New Customer | 10 | 5 | 3 | 2 |
| J2 — Existing Customer | 7 | 3 | 3 | 1 |
| J3 — Product Discovery | 5 | 2 | 2 | 1 |
| J4 — Cart Management | 3 | 3 | 0 | 0 |
| J5 — Wishlist | 2 | 2 | 0 | 0 |
| J6 — Mobile | 3 | 2 | 0 | 1 |
| J7 — Edge Cases | 3 | 1 | 0 | 2 |
| **Total** | **33** | **18** | **8** | **7** |

> **Not Testable** = requires infrastructure setup (email provider, Stripe live keys, etc.) or is not yet built.
> **Failing** = feature exists but has a known bug or incomplete implementation.
> **Passing** = feature is implemented and expected to work.
