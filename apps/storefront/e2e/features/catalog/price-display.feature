@W01 @W02 @W03 @W05 @pricing
Feature: Price Display Consistency

  ## Business Rules
  # - Medusa stores all prices as integer pence (e.g., 199 = £1.99)
  # - The storefront MUST divide by 100 before displaying any price as GBP
  # - The `formatGBP()` function in `lib/util/format-price.ts` is the single source of truth
  # - No component may display the raw pence value without dividing by 100
  # - Prices appear on: product cards, PDP, cart, checkout, order confirmation, search results
  # - Autocomplete prices come from MeiliSearch `price_gbp` field (stored in pence)
  # - Delivery slot premium prices are in pence
  # - Free delivery threshold (£40) and minimum order (£25) are expressed in pence
  # - Unit prices (e.g., "89p per 100g") use the same formatGBP function
  #
  # Verified pages and components:
  #   ✅ product-card.tsx:11 — formatPrice(amount / 100)                → £1.99
  #   ✅ weight-heavy-card.tsx:208 — formatGBP(price)                   → £1.99
  #   ✅ cart/summary.tsx:178 — formatGBP(itemTotal)                    → £1.99
  #   ✅ checkout-form/index.tsx:257 — formatGBP(itemTotal)             → £1.99
  #   ✅ grocery-pdp.tsx:167 — formatGBP(price)                         → £1.99
  #   ✅ variant-chips/index.tsx:109 — formatGBP(chip.price)            → £1.99
  #   ✅ basket-progress-bar/index.tsx — formatGBP()                    → £1.99
  #   ✅ frequently-bought-together:107 — formatGBP(p.price)            → £1.99
  #   ✅ brand-switcher:86 — formatGBP(b.priceFrom)                     → £1.99
  #   ✅ subscribe-save:86 — formatGBP(price)                           → £1.99
  #   ✅ sticky-basket-bar:46 — formatGBP(total)                        → £1.99
  #   ✅ weekly-shop-card — formatGBP(total)                            → £1.99
  #   ✅ quick-reorder-shelf:42 — formatGBP(total)                      → £1.99
  #   ✅ bulk-upgrade-nudge:55 — formatGBP(upgradePrice)                → £1.99
  #   ✅ delivery-slot-selector:187 — formatGBP(window.price)           → £1.99
  #   ✅ search autocomplete — calculated_amount: h.price_gbp (pence)   → £1.99

  Scenario: Product card price is displayed correctly
    Given the user is on the "spices-herbs" category page
    Then every product card displays a price in GBP pounds and pence
    And no price exceeds £100 for a single grocery item

  Scenario: Product detail page shows the correct price
    Given the user navigates to the product detail page for "Natco - Cumin Seeds 400g"
    Then the page displays a price of "£3.49"
    And the price is formatted as GBP with two decimal places after a pound sign

  Scenario: Cart order summary shows correct prices
    Given the user has added a product to the basket
    When the user views the cart page
    Then the subtotal is displayed in GBP pounds and pence
    And the total is displayed in GBP pounds and pence

  Scenario: Free delivery threshold displays correctly
    Given the user views the basket progress bar
    Then the free delivery threshold contains a pound sign and two decimal places

  Scenario: Minimum order amount displays correctly
    Given the user has items below the minimum order threshold
    When the user views the basket
    Then the minimum order amount contains a pound sign and two decimal places

  Scenario: Price below £1 is displayed in pence
    Given a product has a sub-pound price
    When the user views the product
    Then the displayed price contains a pence value

  Scenario: Payment amount matches the displayed cart total
    Given the user has an item in their basket
    And the user is on the payment step
    Then the pay button displays the cart total in GBP
    And the amount charged to the payment gateway equals the displayed total

  Scenario: Backend stores prices in pence, payment gateway receives pence
    Given a product has a price of 199 pence in the database
    When the user adds the product and proceeds to payment
    Then the payment gateway receives an amount of 199 pence
    And the user's card is charged 199 pence

  Scenario: No price discrepancy between frontend, backend, and payment
    Given the user completes a checkout flow
    Then the displayed price on the storefront matches the price in the database divided by 100
    And the amount charged by the payment gateway matches the displayed price multiplied by 100
