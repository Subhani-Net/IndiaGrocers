# IndiaGrocers — Exhaustive E2E Test Suite
# System-Agnostic Gherkin Scenarios
# Generated: May 2026

> **⚠️ GUARDRAIL:** Append only. New scenarios must be added after the last existing
> feature block. Never delete or overwrite existing scenarios. To modify a scenario,
> reference its exact Feature name in your request.

This document contains the complete guardrail scenarios for IndiaGrocers.
Each scenario is a black-box test — system agnostic, verifiable via HTTP
and DOM assertions.

---

# =============================================================================
# PART 1: HOMEPAGE
# =============================================================================

Feature: Homepage

  # ---- Unauthenticated / Guest ----

  Scenario: Guest visitor lands on homepage
    Given I am an unauthenticated visitor
    When I navigate to "/gb"
    Then the page returns HTTP 200
    And the hero carousel or compact hero is visible
    And the category grid shows at least 8 category cards with icons
    And the Featured Products section is visible
    And the "Free Delivery on orders over £45" banner is visible
    And the 4 promo cards (Free Delivery, Express, Farm Fresh, Best Price) are visible
    And the Mobile Bottom Nav shows 5 tabs: Home, Search, Browse, Reorder, Account
    And the desktop header shows "Browse" mega menu button
    And the desktop header shows "Account" link (not "Hi, Name")
    And the New Customer Onboarding prompt shows 5 regional cuisine options
    And the WhatsApp floating button is visible (first visit)

  Scenario: Guest dismisses regional preference prompt
    Given I am on the homepage as a guest
    When I click the "×" button on the New Customer Onboarding prompt
    Then the onboarding prompt disappears
    And the homepage remains fully functional

  Scenario: Guest selects a regional preference
    Given I am on the homepage as a guest
    When I click the "South Indian" cuisine tile
    Then the tile is visually highlighted
    And a "Start Shopping 🥥" button appears
    When I click "Start Shopping"
    Then I am navigated to "/gb/store"

  # ---- Authenticated — First Login ----

  Scenario: New authenticated customer with no orders
    Given I am signed in as a customer with zero previous orders
    When I navigate to "/gb"
    Then I see "Welcome, [Name]!" heading
    And I see the New Customer Onboarding prompt
    And I do NOT see the Weekly Shop card
    And I do NOT see the Quick Reorder "Your Regulars" shelf
    And the header shows "Hi, [Name]" instead of "Account"

  Scenario: New authenticated customer with zero orders has no pantry
    Given I am signed in with zero orders
    When I navigate to "/gb/account/reorder"
    Then the "My Pantry" tab shows an empty state
    And the empty state message is "Your pantry is empty"
    And a "Browse Products" CTA is visible

  # ---- Authenticated — Returning with Order History ----

  Scenario: Returning customer with order history sees personalised homepage
    Given I am signed in as a customer with at least 1 previous order
    When I navigate to "/gb"
    Then I see "Welcome back, [Name]"
    And I see my last order date displayed
    And I see the Weekly Shop Card with "Reorder Last Shop" button
    And I see the Quick Reorder "Your Regulars" shelf (if pantry has items)
    And the Category Reminder Strip shows categories from my last orders

  Scenario: Returning customer with multiple orders sees accurate last order
    Given I have 5 previous orders
    When I view the homepage
    Then the Weekly Shop Card shows the date of my MOST RECENT order
    And the item count matches my last order

  Scenario: Returning customer with zero pantry items
    Given I am signed in with orders but no pantry items
    When I view the homepage
    Then the "Your Regulars" shelf is not visible
    And the Weekly Shop Card is still visible

  # ---- Hero Carousel ----

  Scenario: Hero carousel is compact (max 200px)
    Given I am on the homepage
    When I inspect the hero/header area
    Then the total hero height is <= 200px on desktop
    And at least 6 product cards are visible above the fold on desktop

  Scenario: Hero carousel auto-rotates
    Given I am on the homepage
    When I wait 5 seconds
    Then the hero slide changes to the next slide
    And the dot indicators reflect the current slide

  # ---- Trust Bar ----

  Scenario: Promo cards are visible below the fold
    Given I am on the homepage
    When I scroll past the product sections
    Then I see 4 promo cards with icons and labels
    And one card shows "Free Delivery — On orders over £45"

# =============================================================================
# PART 2: NAVIGATION & MENU
# =============================================================================

Feature: Navigation

  # ---- Desktop Navigation ----

  Scenario: Desktop mega menu shows all Phase 1 categories
    Given I am on a desktop viewport (>= 1024px)
    When I hover over the "Browse" button in the header
    Then a mega menu dropdown appears
    And it shows 11 Phase 1 parent categories
    And each parent category shows its child subcategories (up to 4)
    And the dropdown has an "All Products" link at the top

  Scenario: Desktop mega menu category links are correct
    Given the mega menu is open
    When I see "Staples & Grains" in the menu
    And I click it
    Then I navigate to "/gb/categories/staples-grains"

  Scenario: Desktop category strip shows Phase 1 categories
    Given I am on a desktop viewport
    When I look below the main header
    Then I see a horizontal category strip
    And it shows all 11 Phase 1 categories
    And hovering any category shows a dropdown with its subcategories

  Scenario: Desktop header shows "Hi, [Name]" when signed in
    Given I am signed in as "John"
    When I view the desktop header
    Then the account link shows "Hi, John"
    And NOT "Account"

  Scenario: Desktop header shows "Account" when guest
    Given I am a guest
    When I view the desktop header
    Then the account link shows "Account"

  # ---- Mobile Navigation ----

  Scenario: Mobile bottom nav has exactly 5 tabs
    Given I am on a mobile viewport (< 768px)
    When I view the bottom navigation bar
    Then it shows exactly 5 tabs: Home, Search, Browse, Reorder, Account
    And the active tab is highlighted in brand orange

  Scenario: Mobile bottom nav Reorder tab shows running-low badge
    Given I am signed in with 2 items marked "Running Low" in my pantry
    When I view the mobile bottom nav
    Then the Reorder tab shows a badge with "2"

  Scenario: Mobile bottom nav Search tab opens search
    Given I am on mobile
    When I tap the Search tab
    Then I navigate to the search page
    And the search input is auto-focused with keyboard open

  Scenario: Mobile side menu shows categories
    Given I am on mobile
    When I tap the hamburger icon
    Then a side menu slides in from the left
    And it shows page links: Home, Store, Account, Cart
    And it shows all Phase 1 parent categories
    And clicking outside the menu closes it

  # ---- Navigation Edge Cases ----

  Scenario: No old category names appear in navigation
    Given I am on any page
    When I inspect the navigation HTML
    Then I do NOT see "Rice & Grains" as a category
    And I do NOT see "Dals & Lentils"
    And I do NOT see "Cooking Oils & Ghee"
    And I do NOT see "Flours & Grains"
    And I do NOT see "Papads & Fryums"
    And I do NOT see "Sweets & Mithai"
    And I do NOT see "Noodles & Pasta"
    And I do NOT see "Sauces & Ketchup"

  Scenario: Navigation is consistent across pages
    Given I am on the homepage
    When I navigate to "/gb/cart"
    And I navigate to "/gb/categories/staples-grains"
    And I navigate to "/gb/products/natco-basmati-rice-india-2kg"
    Then the header, nav, and footer are identical on all pages

# =============================================================================
# PART 3: CATEGORY PAGES
# =============================================================================

Feature: Category Pages

  # ---- Weight-Heavy Template ----

  Scenario: Staples & Grains renders weight-heavy template
    Given I navigate to "/gb/categories/staples-grains"
    Then the page returns HTTP 200
    And the breadcrumb shows: Home > Store > Staples & Grains
    And the H1 is "Staples & Grains"
    And the page uses the weight-heavy template layout
    And every product card shows weight chips (at least 3 visible)
    And every product card shows price-per-unit
    And the "Best Value" badge is visible on applicable products
    And the sub-type chips are visible with child categories
    And the filter panel shows weight filter chips
    And the sort option "Weight: Largest First" is available

  Scenario: Atta & Flours renders weight-heavy template
    Given I navigate to "/gb/categories/atta-flours"
    Then the page returns HTTP 200
    And the weight-heavy template is used
    And the product grid has at least 5 products

  Scenario: Dal & Lentils renders weight-heavy template
    Given I navigate to "/gb/categories/dal-lentils"
    Then the page returns HTTP 200
    And the weight-heavy template is used

  Scenario: Oils & Ghee renders weight-heavy template
    Given I navigate to "/gb/categories/oils-ghee"
    Then the page returns HTTP 200
    And the weight-heavy template is used
    And price-per-unit is shown per 100ml for oils

  # ---- Brand-Showcase Template ----

  Scenario: Spice Blends renders brand-showcase template
    Given I navigate to "/gb/categories/spice-blends"
    Then the page returns HTTP 200
    And the brand-showcase template is used
    And the "Shop by Brand" brand tiles strip is visible above the grid
    And clicking a brand tile filters the grid to that brand

  Scenario: Beverages renders brand-showcase template
    Given I navigate to "/gb/categories/beverages"
    Then the page returns HTTP 200
    And the brand-showcase template is used

  # ---- Standard Grid Template ----

  Scenario: Snacks & Namkeen renders standard grid with VAT notice
    Given I navigate to "/gb/categories/snacks-namkeen"
    Then the page returns HTTP 200
    And the standard grid template is used
    And the VAT notice "Prices include 20% VAT" is visible

  Scenario: Pickles & Chutneys renders standard grid
    Given I navigate to "/gb/categories/pickles-chutneys"
    Then the page returns HTTP 200

  Scenario: Spices Whole renders standard grid
    Given I navigate to "/gb/categories/spices-whole"
    Then the page returns HTTP 200

  Scenario: Spices Ground renders standard grid
    Given I navigate to "/gb/categories/spices-ground"
    Then the page returns HTTP 200

  Scenario: Dairy renders standard grid
    Given I navigate to "/gb/categories/dairy"
    Then the page returns HTTP 200

  # ---- Product Card Behaviour ----

  Scenario: Clicking a weight chip on a product card updates the displayed price
    Given I am on "/gb/categories/staples-grains"
    And there is a product with multiple weight variants
    When I click a different weight chip on a product card
    Then the displayed price on that card updates
    And the price-per-unit updates
    And the URL does NOT change (inline update)

  Scenario: Out-of-stock product cards are visually distinct
    Given a product has zero inventory
    When I view it on a category page
    Then the card is dimmed
    And the "Add" button is replaced or disabled

  # ---- Filters ----

  Scenario: Price range filter works
    Given I am on "/gb/categories/dal-lentils"
    When I set min price to 1 and max price to 5
    And I apply the filter
    Then only products priced between £1 and £5 are shown
    And the URL includes "minPrice=1&maxPrice=5"

  Scenario: Dietary filter works
    Given I am on any category page
    When I check the "Vegetarian" dietary filter
    Then only vegetarian products are shown
    And the URL includes "dietary=vegetarian"

  Scenario: In-Stock toggle works
    Given I am on any category page
    When I toggle "In Stock Only" to ON
    Then only products with stock > 0 are shown

  Scenario: Clear Filters resets all applied filters
    Given I have applied price, dietary, and weight filters
    When I click "Clear Filters"
    Then all filters are removed
    And the URL no longer contains filter parameters
    And all products are displayed again

  Scenario: Browser back button restores filter state
    Given I have applied filters on a category page
    When I click a product to navigate away
    And I press the browser back button
    Then I return to the same category page
    And my filters are still applied (URL state preserved)

  # ---- Empty States ----

  Scenario: Category with no products shows helpful empty state
    Given a category exists but has 0 products
    When I navigate to that category page
    Then I see "No products yet" message
    And I see "Explore all products" CTA
    And I do NOT see an error page or blank screen

  Scenario: Filter combination returns zero results
    Given I am on a category with products
    When I apply filters that match no products
    Then I see "No matching products" message
    And I see "Try removing some filters" suggestion
    And a "Clear Filters" button is available

# =============================================================================
# PART 4: PRODUCT DETAIL PAGE (PDP)
# =============================================================================

Feature: Product Detail Page

  # ---- Core PDP ----

  Scenario: PDP loads with all required sections
    Given I navigate to "/gb/products/natco-basmati-rice-india-2kg"
    Then the page returns HTTP 200
    And the breadcrumb shows: Home > Store > [Category] > Product Title
    And the product title H1 is visible
    And the product image gallery is visible
    And the weight variant chips are visible (not a dropdown)
    And the price is displayed with £ symbol
    And the price-per-unit is displayed (UK legal requirement)
    And the stock status is displayed
    And the "Add to Basket" button is visible with the price

  Scenario: PDP shows allergen section visible and never collapsed
    Given I am on any product detail page
    Then the allergen section is visible without any click or expand action
    And the allergen section uses an amber/warning colour scheme
    And the word "ALLERGENS" or "Allergens & Dietary" is prominently visible
    And the section is NOT inside an accordion or collapsed container
    And if the product has allergens, they appear as amber badge chips
    And if the product has no allergens, "no major allergens" message shows

  Scenario: PDP shows product details section with trust signals
    Given I am on any product detail page
    Then the "Product Details" section is visible
    And it shows: Weight, Brand, Country of Origin, UK Food Business Operator
    And dietary flags are shown with ✓ or — indicators
    And VAT status is displayed
    And "Authentically Sourced" badge shows for Indian-origin products
    And "UK Stocked" badge shows for sourcing tier A or B products

  # ---- Weight Variant Chips ----

  Scenario: Weight chip click updates price and URL
    Given I am on a PDP with multiple weight variants
    When I click the "10kg" weight chip
    Then the main price updates to the 10kg price
    And the price-per-unit updates
    And the URL updates with the new variant ID (pushState)
    And the browser back button returns to the previous variant

  Scenario: Best Value badge appears on cheapest per-unit variant
    Given I am on a PDP with 3+ weight variants
    Then exactly one weight chip shows the "★ Best Value" badge
    And that chip corresponds to the variant with the lowest price-per-unit

  Scenario: Out-of-stock variant chip is disabled
    Given a PDP where one variant is out of stock
    When I view the weight chips
    Then the out-of-stock chip is visually distinct (greyed, disabled)
    And clicking it does nothing
    And the "Add to Basket" button shows "Out of Stock"

  # ---- Add to Basket ----

  Scenario: Add single product to cart from PDP
    Given I am on a PDP with an in-stock variant
    When I select a variant
    And I set quantity to 3
    And I click "Add to Basket — £X.XX"
    Then the button shows "Added! ✓" for 2 seconds
    And the cart count in the header updates
    And the cart total increases by (price × 3)

  Scenario: Add to Basket with default quantity of 1
    Given I am on a PDP
    When I click "Add to Basket" without changing quantity
    Then exactly 1 unit is added to the cart

  # ---- Brand Switcher ----

  Scenario: Brand switcher appears when product group has multiple brands
    Given a product has a `product_group_id` with 2+ brands
    When I am on the PDP
    Then the "Also Available From" brand switcher dropdown is visible
    And it shows alternative brands with "from £X.XX" prices

  Scenario: Brand switcher does NOT appear for single-brand products
    Given a product with no product_group_id or only 1 brand in the group
    When I am on the PDP
    Then the brand switcher dropdown is not visible

  # ---- Pantry Integration ----

  Scenario: Add to Pantry button on PDP toggles state
    Given I am signed in
    And I am on a PDP
    When I click "+ Add to Pantry"
    Then the button changes to "✓ In Your Pantry" with amber styling
    When I click it again
    Then the button reverts to "+ Add to Pantry"

  # ---- PDP Edge Cases ----

  Scenario: PDP for product with no images shows placeholder
    Given a product has no images
    When I view its PDP
    Then a placeholder image or fallback is displayed
    And the page does not crash

  Scenario: PDP for product with empty metadata
    Given a product has no allergens metadata
    When I view the PDP
    Then the allergen section shows "no major allergens" or fallback text

  Scenario: PDP SEO metadata is correct
    Given I view the page source for any PDP
    Then the <title> tag is unique and includes the product name
    And JSON-LD structured data is present for Google Shopping
    And canonical URL matches the selected variant

# =============================================================================
# PART 5: SEARCH
# =============================================================================

Feature: Search

  # ---- Basic Search ----

  Scenario: Search returns results for exact product name
    Given I am on the search page "/gb/search"
    When I search for "Natco Basmati Rice"
    Then the results include "Natco Basmati Rice India 2kg"
    And the result count is at least 1

  Scenario: Search returns 200 even for empty query
    Given I navigate to "/gb/search?q="
    Then the page returns HTTP 200
    And the page shows "Start typing or select a category to find products"

  # ---- Synonym Search ----

  Scenario: Search "besan" resolves to gram flour products
    Given I search for "besan"
    Then the results include gram flour / besan products
    And a synonym notice shows "Showing results for 'gram flour'"
    And the result count is at least 1

  Scenario: Search "gram flour" finds besan products (bidirectional)
    Given I search for "gram flour"
    Then the results include "Natco Gram Flour" products

  Scenario: Search "hing" resolves to asafoetida
    Given I search for "hing"
    Then results include asafoetida products
    And the synonym was applied

  Scenario: Search "sooji" resolves to semolina/rava
    Given I search for "sooji"
    Then results include semolina/sooji/rava products

  Scenario: Search "ghee" finds clarified butter products
    Given I search for "ghee"
    Then results include ghee products

  # ---- Transliteration Search ----

  Scenario: Search "jeera" finds cumin seed products
    Given I search for "jeera"
    Then results include products with "Cumin" or "Jeera" in title

  Scenario: Search "haldi" finds turmeric products
    Given I search for "haldi"
    Then results include turmeric products

  Scenario: Search "dhania" finds coriander products
    Given I search for "dhania"
    Then results include coriander products

  # ---- Brand + Weight Query Parser ----

  Scenario: Search "MDH garam masala 100g" parses brand and weight
    Given I search for "MDH garam masala 100g"
    Then the brand "MDH" is extracted from the query
    And the weight "100g" is extracted
    And results are filtered by brand and weight

  Scenario: Search "5kg toor dal" parses weight and product
    Given I search for "5kg toor dal"
    Then the weight "5kg" is extracted
    And results are filtered to approx 5kg variants

  # ---- Search Edge Cases ----

  Scenario: Search with no results shows suggestions
    Given I search for "xyznonexistentproduct123"
    Then I see "No results for 'xyznonexistentproduct123'"
    And I see suggested synonym terms or category links
    And I do NOT see a blank page or error

  Scenario: Search with special characters is safe
    Given I search for "<script>alert(1)</script>"
    Then the page returns HTTP 200
    And no script is executed
    And the query is safely escaped in the results display

  Scenario: Search with very long query is handled
    Given I search for a 500-character string
    Then the page returns HTTP 200 without crashing

  # ---- Autocomplete ----

  Scenario: Autocomplete shows up to 5 product suggestions
    Given I am on the search page
    When I type "Natco" with a 300ms pause
    Then a dropdown appears with up to 5 matching products
    And each suggestion shows a thumbnail, title, and price
    And a "View all results" link appears at the bottom

  Scenario: Clicking outside autocomplete closes it
    Given the autocomplete dropdown is open
    When I click outside the search area
    Then the dropdown closes

  Scenario: Autocomplete shows category chips from live data
    Given I am on the search page
    Then the category quick-filter chips are displayed
    And they correspond to actual Phase 1 categories
    And clicking a chip navigates to that category page

  # ---- Search with MeiliSearch ----

  Scenario: MeiliSearch returns results in under 200ms
    Given I search for "basmati"
    Then results appear within 200ms of the debounce trigger

  Scenario: MeiliSearch index is filterable by category handle
    Given I search with a category filter applied
    Then only products in that category appear in results

# =============================================================================
# PART 6: CART & BASKET MECHANICS
# =============================================================================

Feature: Cart

  # ---- Cart Page ----

  Scenario: Cart page loads with items
    Given I have 3 items in my cart
    When I navigate to "/gb/cart"
    Then the page returns HTTP 200
    And the H1 shows "Your Basket (3 items)"
    And items are grouped by category
    And each item shows: thumbnail, title, weight, quantity, price

  Scenario: Cart page shows empty state when cart is empty
    Given I have no items in my cart
    When I navigate to "/gb/cart"
    Then I see "Your cart is empty"
    And I see an "Explore products" or "Start Shopping" link

  # ---- Basket Progress Bar (£45 threshold) ----

  Scenario: Progress bar shows red below £30 minimum order
    Given I have items totaling £20 in my cart
    When I view the cart page
    Then the progress bar has a red background
    And it shows "Minimum order £30.00"
    And the checkout button is disabled with "Add £10.00 more to checkout"

  Scenario: Progress bar shows amber when £30–£44.99
    Given I have items totaling £35 in my cart
    When I view the cart page
    Then the progress bar has an amber background
    And it shows "Add £10.00 for FREE delivery"
    And the checkout button is enabled
    And the delivery cost shows "£3.99"

  Scenario: Progress bar shows green when £45+ reached
    Given I have items totaling £50 in my cart
    When I view the cart page
    Then the progress bar has a green background
    And it shows "Free delivery unlocked!"
    And the delivery cost shows "FREE"

  # ---- Quantity Controls ----

  Scenario: Increase quantity updates subtotal
    Given I have an item with quantity 1 in my cart
    When I increase the quantity to 3
    Then the subtotal for that item updates to (price × 3)
    And the overall cart total updates accordingly

  Scenario: Decrease quantity to zero removes item
    Given I have an item with quantity 1 in my cart
    When I decrease the quantity to 0 (or click remove)
    Then the item is removed from the cart
    And the cart item count decreases

  # ---- Bulk Upgrade Nudge ----

  Scenario: Bulk upgrade nudge appears for quantity >= 2 with savings >= 10%
    Given I have 3 units of "Natco Toovar 400g" in my cart
    And a larger variant "2kg" exists with >= 10% per-unit savings
    When I view the cart
    Then a bulk upgrade nudge appears: "Switch to 2kg and save X%"
    And clicking "Switch" replaces the small items with the larger variant

  Scenario: Max 2 bulk nudges shown
    Given I have 5 products each triggering a bulk nudge
    When I view the cart
    Then at most 2 bulk upgrade nudges are displayed

  Scenario: Dismissed bulk nudge does not reappear in same session
    Given a bulk nudge is visible
    When I click "No thanks"
    Then that nudge disappears
    And it does not reappear on the same page load

  # ---- Out-of-Stock in Cart ----

  Scenario: Out-of-stock items flagged in cart
    Given I have an item that is now out of stock
    When I view my cart
    Then that item is visually flagged with an "Out of Stock" badge
    And the item is displayed at the top of the cart list
    And a warning banner appears about out-of-stock items

  # ---- Promo Codes ----

  Scenario: Valid promo code applies discount
    Given I am on the cart page with items
    When I enter a valid promo code and click "Apply"
    Then the discount is reflected in the order summary
    And the promo code badge is visible

  Scenario: Invalid promo code shows error
    Given I am on the cart page
    When I enter "INVALID123" and click "Apply"
    Then an error message is displayed

  # ---- Sign-In Prompt ----

  Scenario: Guest with items sees sign-in prompt
    Given I am a guest with items in my cart
    When I view the cart page
    Then I see "Already have an account? Sign in for a better experience"

  Scenario: Signed-in customer does NOT see sign-in prompt
    Given I am signed in with items in my cart
    When I view the cart page
    Then I do NOT see the sign-in prompt

# =============================================================================
# PART 7: CHECKOUT
# =============================================================================

Feature: Checkout

  # ---- Checkout Access ----

  Scenario: Checkout not accessible without cart
    Given I have no items in my cart
    When I navigate to "/gb/checkout"
    Then the page returns HTTP 404

  Scenario: Checkout accessible with items in cart
    Given I have items totaling > £30 in my cart
    When I navigate to "/gb/checkout"
    Then the page returns HTTP 200
    And the 3-step indicator is visible

  # ---- Step 1: Address ----

  Scenario: Address form validates required fields
    Given I am on the checkout address step
    When I click "Continue to Delivery Slot" without filling any fields
    Then I see "Please fill in all required fields"

  Scenario: Valid London postcode enables continue
    Given I have filled all required address fields
    And I enter postcode "SW9 8AL"
    Then the postcode validator shows green "✓ We deliver to SW9"
    And "Continue to Delivery Slot" is enabled

  Scenario: Non-London postcode shows waitlist
    Given I enter postcode "M1 1AA" (Manchester)
    Then the validator shows amber warning
    And a "Join waitlist" CTA appears
    And the continue button is disabled

  Scenario: Invalid UK postcode format shows validation
    Given I enter "ABC" in postcode
    When I blur the field
    Then the validator shows "Please enter a valid UK postcode"

  Scenario: Empty postcode disables continue
    Given I fill all fields except postcode
    When I click continue
    Then I see a validation error about the postcode

  # ---- Step 2: Delivery Slot ----

  Scenario: Delivery slot selector shows 5 day tiles
    Given I have completed the address step
    When I am on the delivery slot step
    Then I see 5 day tiles showing dates
    And each tile shows the number of available slots

  Scenario: Clicking a day tile expands time windows
    Given I am on the delivery slot step
    When I click a day tile
    Then 6 two-hour time windows appear
    And unavailable windows are greyed out
    And each window shows the start–end time

  Scenario: Selecting a time window shows confirmation
    Given I have selected a day and time window
    Then a green confirmation banner shows the selected slot
    And the "Continue to Payment" button is enabled

  Scenario: Delivery slots require selection before continuing
    Given I am on the delivery slot step
    When I click "Continue to Payment" without selecting a slot
    Then the button is disabled

  Scenario: Same-day express slot is premium priced
    Given it is before 10am
    When I expand today's time windows
    Then an "Express (Same Day)" slot is visible
    And it shows a premium price of £5.99

  # ---- Step 3: Payment ----

  Scenario: Payment step shows order summary with delivery slot
    Given I have selected a delivery slot
    When I am on the payment step
    Then the order summary shows subtotal, delivery cost, and total
    And the selected delivery slot date and time are displayed
    And the delivery address is displayed

  Scenario: Wallet pay buttons are visible
    Given I am on the payment step
    Then an Apple Pay button is visible
    And a Google Pay button is visible
    And an "or pay with card" divider is visible

  Scenario: Place Order button shows total
    Given I am on the payment step
    When I view the "Place Order" button
    Then it shows "Place Order — £X.XX" with the calculated total

  Scenario: T&Cs checkbox is required
    Given I am on the payment step
    When I uncheck the T&Cs checkbox
    Then the Place Order button should require acceptance

  # ---- Guest Checkout ----

  Scenario: Guest can complete checkout without account
    Given I am a guest with items in cart
    When I complete all 3 checkout steps
    Then my order is placed successfully
    And I am redirected to the order confirmation page
    And the guest notice was visible on the address step

  # ---- Checkout Error Handling ----

  Scenario: Browser back preserves checkout form data
    Given I filled the address form and moved to delivery slot
    When I press the browser back button
    Then I am returned to the address step
    And my filled form data is preserved

  Scenario: Payment failure shows error and retains cart
    Given a payment failure occurs
    When I attempt to place the order
    Then an error message is displayed
    And my cart items are NOT lost

  Scenario: Minimum order gate blocks at cart, not at checkout
    Given my cart total is below £30
    When I attempt to proceed to checkout
    Then I am blocked at the cart page, not at the checkout page

# =============================================================================
# PART 8: ORDER CONFIRMATION
# =============================================================================

Feature: Order Confirmation

  Scenario: Order confirmation page shows success
    Given I have just placed an order
    When I am redirected to the confirmation page
    Then I see a green checkmark
    And I see "Order Confirmed!" heading
    And I see the order number
    And I see the estimated delivery date
    And I see the delivery address card
    And I see the payment method card
    And I see the items ordered with quantities
    And I see the order summary (subtotal, delivery, total)

  Scenario: Order confirmation shows Spice Points earned
    Given an order has been placed
    When I view the confirmation page
    Then I see "You earned X Spice Points on this order!"

  Scenario: Order confirmation shows save-details prompt for guest
    Given I placed an order as a guest
    When I view the confirmation page
    Then I see "Save your details for next time"
    And a "Create Account" CTA is visible
    And a "Maybe later" dismiss button is visible

  Scenario: Order confirmation shows Continue Shopping CTA
    Given I am on the confirmation page
    Then a "Continue Shopping" button is visible
    And clicking it navigates to "/gb/store"

# =============================================================================
# PART 9: ACCOUNT & AUTHENTICATION
# =============================================================================

Feature: Authentication

  # ---- Sign In ----

  Scenario: Valid credentials sign in successfully
    Given I am on "/gb/account"
    When I enter valid email and password
    And I click "Sign in"
    Then I am redirected to my account dashboard
    And the header shows "Hi, [Name]"

  Scenario: Invalid credentials show error
    Given I am on the sign-in form
    When I enter wrong password
    Then I see an error message
    And I remain on the sign-in page

  Scenario: Empty fields show validation
    Given I am on the sign-in form
    When I click "Sign in" with empty fields
    Then browser validation prevents submission

  # ---- Sign Up ----

  Scenario: New customer registers successfully
    Given I am on the register form
    When I fill in: first name, last name, email, phone, password
    And the password meets all rules (8+ chars, 1+ letter, 1+ number)
    And I click "Join"
    Then my account is created
    And I am redirected to my account dashboard

  Scenario: Duplicate email registration shows error
    Given an account exists with "existing@test.com"
    When I try to register with "existing@test.com"
    Then I see "An account with this email already exists"

  Scenario: Registration password rules are validated
    Given I am on the register form
    When I type a short password (less than 8 characters)
    Then I see "At least 8 characters" unchecked
    When I type a password without a letter
    Then I see "At least 1 letter" unchecked
    When I type a password without a number
    Then I see "At least 1 number" unchecked

  # ---- Forgot Password ----

  Scenario: Forgot password form is accessible
    Given I am on the sign-in form
    When I click "Forgot your password?"
    Then I see the password reset form
    When I enter my email and submit
    Then I see "Check Your Email" confirmation

  # ---- Sign Out ----

  Scenario: Sign out clears session and returns to sign-in
    Given I am signed in
    When I click "Log out"
    Then I am redirected to the sign-in page
    And the header no longer shows "Hi, [Name]"
    And the cart is cleared

# =============================================================================
# PART 10: ACCOUNT DASHBOARD
# =============================================================================

Feature: Account Dashboard

  Scenario: Dashboard shows overview with stats
    Given I am signed in
    When I navigate to "/gb/account"
    Then I see "Hello, [Name]" welcome message
    And I see my profile completion percentage
    And I see my saved addresses count
    And I see my total orders count
    And I see my 5 most recent orders with status badges

  Scenario: Dashboard for customer with no orders
    Given I am signed in with zero orders
    When I view my dashboard
    Then I see "No recent orders"
    And a "Start Shopping" CTA is visible

  Scenario: Dashboard for customer with many orders
    Given I have 20 orders
    When I view my dashboard
    Then only the 5 most recent orders are shown
    And a "View all orders" link is visible

  # ---- Order History ----

  Scenario: Orders list shows all orders
    Given I have 10 previous orders
    When I navigate to "/gb/account/orders"
    Then I see 10 order cards
    And each shows: order number, date, status, total
    And most recent orders appear first

  Scenario: Order detail page shows full order information
    Given I click an order from the list
    Then I see the order items
    And I see the shipping address
    And I see the order summary
    And I see the payment information

  # ---- Addresses ----

  Scenario: Add new address from account
    Given I am on the addresses page
    When I click "Add address"
    And I fill in the address form
    And I save
    Then the new address appears in my address list

  Scenario: Edit existing address
    Given I have a saved address
    When I click "Edit" on that address
    And I modify the address
    And I save
    Then the address is updated

  Scenario: Delete address
    Given I have at least 2 saved addresses
    When I delete one
    Then it is removed from the list

  # ---- Profile ----

  Scenario: Edit name from profile
    Given I am on the profile page
    When I edit my first name and save
    Then my name is updated in the header and dashboard

  Scenario: Edit phone number from profile
    Given I am on the profile page
    When I edit my phone and save
    Then it is updated

# =============================================================================
# PART 11: REORDER & PANTRY
# =============================================================================

Feature: Reorder & Pantry

  Scenario: Reorder page shows 3 tabs
    Given I am signed in
    When I navigate to "/gb/account/reorder"
    Then I see 3 tabs: My Pantry, Last Order, Shopping List
    And "My Pantry" is the default active tab

  Scenario: Marking pantry item as Running Low moves it to top
    Given I have 5 items in my pantry, 2 marked Running Low
    When I view the My Pantry tab
    Then the 2 Running Low items appear at the top with amber indicator
    And the 3 Stocked items appear below

  Scenario: "Add All Running Low" adds items to cart
    Given I have 2 Running Low pantry items
    When I click "Add All to Basket"
    Then both items are added to the cart
    And a confirmation toast appears

  Scenario: Pantry item can be removed
    Given I have an item in my pantry
    When I click the "×" remove button
    Then the item is removed from the pantry

  # ---- Shopping List ----

  Scenario: Add item to shopping list
    Given I am on the Shopping List tab
    When I type "atta" and press Enter
    Then "atta" appears in the list as unchecked

  Scenario: Check off shopping list item
    Given I have items in my shopping list
    When I check an item
    Then it shows with strikethrough styling
    And a "Remove checked items" button appears

  # ---- Quick Reorder Shelf ----

  Scenario: Quick Reorder shelf shows on homepage for returning customer
    Given I am signed in with pantry items
    When I view the homepage
    Then the "Your Regulars" shelf is visible
    And it shows up to 8 pantry items
    And each item shows price and running-low status

  Scenario: Quick Reorder shelf is hidden for guest
    Given I am a guest
    When I view the homepage
    Then the "Your Regulars" shelf is not visible

  Scenario: Quick Reorder shelf "Add All" adds all items
    Given the Quick Reorder shelf shows 4 items
    When I click "Add All (£X.XX)"
    Then all 4 items are added to the cart

# =============================================================================
# PART 12: COMING SOON PAGES
# =============================================================================

Feature: Coming Soon Pages

  Scenario: Phase 2 routes show Coming Soon with waitlist
    Given I navigate to "/gb/categories/frozen"
    Then the page returns HTTP 200
    And it shows "Frozen Foods — Coming Soon"
    And a Phase 2 badge is visible
    And an email capture form with "Notify Me" button is present
    And links to browse available categories are shown

  Scenario: Phase 3 routes show Coming Soon
    Given I navigate to "/gb/categories/pooja"
    Then the page returns HTTP 200
    And it shows "Pooja Essentials — Coming Soon"
    And a Phase 3 badge is visible

  Scenario: Submitting waitlist email shows confirmation
    Given I am on a Coming Soon page
    When I enter "test@example.com" and click "Notify Me"
    Then I see "✓ You're on the list!" confirmation

  Scenario: Coming Soon page never returns 404
    Given I navigate to any Phase 2 or Phase 3 category route
    Then the page does NOT return HTTP 404

# =============================================================================
# PART 13: ERROR HANDLING & EDGE CASES
# =============================================================================

Feature: Error Handling

  # ---- 404 Pages ----

  Scenario: Non-existent product returns 404
    Given I navigate to "/gb/products/non-existent-handle"
    Then I see a 404 "Page not found" message
    And I see a link to return to the homepage

  Scenario: Non-existent category returns 404
    Given I navigate to "/gb/categories/non-existent-category"
    Then I see a 404 page

  Scenario: Non-existent route returns 404
    Given I navigate to "/gb/this-does-not-exist"
    Then I see a 404 page

  # ---- Network / Server Errors ----

  Scenario: Graceful handling when backend is unreachable
    Given the backend is not running
    When I navigate to any storefront page
    Then I see a sensible error or fallback
    And the page does NOT show a raw stack trace or blank screen

  # ---- Empty States Summary ----

  Scenario: Empty cart shows helpful message
    Given I have no items in cart
    Then I see an empty cart message with "Explore products" link

  Scenario: Empty wishlist shows helpful message
    Given I have no wishlisted items
    When I navigate to "/gb/wishlist"
    Then I see "Your wishlist is empty" with "Start Shopping" button

  Scenario: Empty orders list shows helpful message
    Given I have no orders
    When I navigate to "/gb/account/orders"
    Then I see "No orders yet" with start shopping CTA

  # ---- Image Fallback ----

  Scenario: Broken product image shows placeholder
    Given a product has a broken image URL
    When I view that product on a listing or detail page
    Then a placeholder image is displayed
    And the page layout does not break

  # ---- Price Display ----

  Scenario: Prices always shown in GBP with £ prefix
    Given I am viewing any product on any page
    Then all prices are displayed in GBP
    And every price includes the £ symbol

  Scenario: Prices always shown inclusive of VAT
    Given a product with a price
    Then the displayed price is inclusive of VAT
    And for snacks, a VAT notice "Prices include 20% VAT" is shown

  Scenario: Price-per-unit is always shown on product cards and PDP
    Given I am viewing any product listing or detail page
    Then every product card shows price-per-unit (e.g., "89p per kg")
    And PDP shows price-per-unit prominently below the main price

  # ---- Weight Display ----

  Scenario: Weight is visible on every product surface
    Given I am viewing search results, category cards, cart items,
          order history, reorder shelf, or weekly shop page
    Then every product shows its weight/size
    And no product appears without a weight label

  # ---- VAT Display ----

  Scenario: Snacks category shows VAT notice
    Given I navigate to "/gb/categories/snacks-namkeen"
    Then a VAT notice is visible: "Prices include 20% VAT"

  Scenario: Staple categories show zero-rated VAT
    Given I navigate to "/gb/categories/staples-grains"
    Then the product detail page shows "VAT: 0% (zero-rated food item)"
    And no 20% VAT notice is shown at category level

# =============================================================================
# PART 14: CROSS-BROWSER & RESPONSIVE
# =============================================================================

Feature: Responsive Design

  Scenario: Mobile viewport shows 1-column product grid
    Given I am on a mobile viewport (375px)
    When I view any category page
    Then the product grid is 1 column
    And weight chips fit without overflow
    And touch targets are minimum 44px height

  Scenario: Tablet viewport shows 2-column product grid
    Given I am on a tablet viewport (768px)
    When I view any category page
    Then the product grid is 2 columns

  Scenario: Desktop viewport shows 3-column product grid
    Given I am on a desktop viewport (1280px)
    When I view any category page
    Then the product grid is 3 columns

  Scenario: Mobile filter is a bottom drawer
    Given I am on a mobile viewport
    When I tap the "Filter" button on a category page
    Then a bottom-sheet drawer slides up
    And it covers approximately 80% of the screen
    And it contains all filter options
    And an "Apply" button is at the bottom

  # ---- Sticky Elements ----

  Scenario: Mobile sticky basket bar appears when cart has items
    Given I am on mobile with items in my cart
    When I browse any page
    Then a sticky basket bar appears above the bottom nav
    And it shows the cart total and "£X.XX to free delivery"

  Scenario: Mobile sticky basket bar is not visible when cart is empty
    Given I am on mobile with an empty cart
    Then the sticky basket bar is not visible

  # ---- Accessibility ----

  Scenario: All form inputs have associated labels
    Given I inspect any form on the site
    Then every input has a <label> element associated with it

  Scenario: Interactive elements have visible focus states
    Given I navigate using the Tab key
    Then every interactive element shows a visible focus ring or outline

  Scenario: Allergen section has sufficient colour contrast (WCAG AA)
    Given I view the allergen section on any PDP
    Then the text meets WCAG AA contrast ratio of at least 4.5:1

  Scenario: Colour is never the only way information is conveyed
    Given I view out-of-stock products
    Then the out-of-stock state includes text (not just grey colour)
    And error messages include text (not just red colour)

# =============================================================================
# PART 15: METADATA & COMPLIANCE
# =============================================================================

Feature: Metadata & Compliance

  Scenario: Every product has brand_slug populated
    Given I fetch all products from the store API
    Then at least 90% of products have a non-empty brand_slug

  Scenario: Every product has vat_rate populated
    Given I fetch all products
    Then at least 90% of products have a vat_rate of 0 or 0.20

  Scenario: Every product has country_of_origin populated
    Given I fetch all products
    Then at least 90% of products have a non-empty country_of_origin

  Scenario: Every product has a category assignment
    Given I fetch all products
    Then every product belongs to at least one category
    And no product has zero category assignments

  Scenario: Snacks products have VAT rate 0.20
    Given I fetch all products in "snacks-namkeen"
    Then all of them have vat_rate = 0.20 (if they have VAT populated)

  Scenario: Staple products have VAT rate 0
    Given I fetch products in "staples-grains", "dal-lentils", "atta-flours", "oils-ghee"
    Then all of them have vat_rate = 0 (if they have VAT populated)

  Scenario: Product prices are actually populated
    Given I fetch all products
    Then every product has at least one variant with a calculated_price

  Scenario: Category assignment is 1-to-1 per product
    Given I fetch all products
    When I count how many Phase 1 categories each product belongs to
    Then no product belongs to more than 2 Phase 1 parent categories

# =============================================================================
# PART 16: REGIONAL PAGES
# =============================================================================

Feature: Regional Collection Pages

  Scenario: Regional page for South Indian shows curated products
    Given I navigate to a regional collection page
    Then the page shows products grouped by shelf: Staples, Spices, Oils, Snacks

  Scenario: Regional page has editorial header
    Given I am on a regional collection page
    Then the page has a header with the region name
    And a brief description of the regional cuisine
    And cross-category links at the bottom

# =============================================================================
# PART 17: BREADCRUMBS
# =============================================================================

Feature: Breadcrumbs

  Scenario: Category page shows breadcrumb
    Given I am on "/gb/categories/staples-grains"
    Then the breadcrumb shows: Home > Store > Staples & Grains

  Scenario: Sub-category page shows breadcrumb with parent
    Given I am on a sub-category page
    Then the breadcrumb shows: Home > Store > Parent Category > Sub-Category

  Scenario: Product page shows breadcrumb with category
    Given I am on a product page
    Then the breadcrumb shows: Home > Store > [Category] > [Product Name]

  Scenario: Breadcrumb links are clickable and navigate correctly
    Given I am on a product page
    When I click "Home" in the breadcrumb
    Then I navigate to the homepage
    When I click the category link
    Then I navigate to that category page
