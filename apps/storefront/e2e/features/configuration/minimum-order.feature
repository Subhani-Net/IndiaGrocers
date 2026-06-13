@configuration @W04
Feature: Minimum Order & Free Delivery — Configuration & Behaviour

  ## Business Rules
  # - MIN_ORDER_AMOUNT (3000 pence / £30.00) — orders below this cannot be placed
  # - FREE_DELIVERY_THRESHOLD (4000 pence / £40.00) — orders at or above this get free delivery
  # - Values are in pence (Medusa v2 standard), displayed via formatGBP() which divides by 100
  # - When itemTotal < MIN_ORDER: basket shows "Minimum order £30.00", checkout blocked
  # - When MIN_ORDER <= itemTotal < FREE_DELIVERY: basket shows progress toward free delivery
  # - When itemTotal >= FREE_DELIVERY: basket shows "You've earned FREE delivery!"
  # - Delivery cost is STANDARD_DELIVERY_COST (399 pence / £3.99) unless free threshold met
  #
  # Source: apps/storefront/src/lib/config/store-config.ts
  # Components: basket-progress-bar, sticky-basket-bar, cart summary, checkout-form
  # Tests: apps/storefront/e2e/configuration/minimum-order.spec.ts

  # ── MIN_ORDER_AMOUNT Config ──

  Scenario: Minimum order amount is configurable in store-config.ts
    Given the store configuration defines MIN_ORDER_AMOUNT at 3000 pence
    When the developer changes it to 2000
    And restarts the storefront
    Then the basket bar, cart summary, and checkout all reflect £20.00 as the minimum

  Scenario: Basket progress bar shows minimum order when below threshold
    Given the user has items in the basket totaling less than MIN_ORDER_AMOUNT
    When the user views the basket
    Then the progress bar displays "Minimum order £30.00"
    And the progress bar color is red/low

  Scenario: Basket progress bar shows progress toward free delivery
    Given the user has items in the basket between MIN_ORDER_AMOUNT and FREE_DELIVERY_THRESHOLD
    When the user views the basket
    Then the progress bar displays "You're £X.XX away from FREE delivery"
    And the progress bar color is amber/medium

  Scenario: Basket progress bar shows free delivery achieved
    Given the user has items in the basket totaling FREE_DELIVERY_THRESHOLD or more
    When the user views the basket
    Then the progress bar displays "You've earned FREE delivery!"
    And the progress bar is fully green

  # ── FREE_DELIVERY_THRESHOLD Config ──

  Scenario: Free delivery threshold is configurable in store-config.ts
    Given the store configuration defines FREE_DELIVERY_THRESHOLD at 4000 pence
    When the developer changes it to 5000
    And restarts the storefront
    Then every component that references the threshold updates to £50.00

  Scenario: Free delivery banner appears consistently at the configured threshold
    Given FREE_DELIVERY_THRESHOLD is set in store-config.ts
    When the user views the nav banner
    Then it displays "FREE DELIVERY on orders over £40 · Order by 2pm..."
    And the value "£40" matches FREE_DELIVERY_THRESHOLD_GBP from the config

  Scenario: Cart summary shows delivery cost correctly
    Given the user has items below FREE_DELIVERY_THRESHOLD
    When the user views the cart summary
    Then delivery is charged at STANDARD_DELIVERY_COST (£3.99)
    And the total includes the delivery cost

  Scenario: Cart summary shows free delivery when threshold met
    Given the user has items at or above FREE_DELIVERY_THRESHOLD
    When the user views the cart summary
    Then delivery is shown as "FREE"
    And the total equals the item subtotal only

  # ── CROSS-COMPONENT CONSISTENCY ──

  Scenario: All pages show the same free delivery threshold
    Given FREE_DELIVERY_THRESHOLD = 4000 and FREE_DELIVERY_THRESHOLD_GBP = "£40"
    When the user views the nav banner
    And the user views the basket progress bar
    And the user views the cart summary
    And the user views the homepage promo cards
    And the user views the delivery page
    And the user views the FAQ
    Then every page displays £40 (not £45, not any other value)

  Scenario: Sticky mobile basket bar shows correct free delivery progress
    Given the user is on a mobile viewport
    And the user has items in the basket below FREE_DELIVERY_THRESHOLD
    When the user scrolls down the page
    Then a sticky basket bar appears at the bottom
    And it shows "£X.XX to free delivery →"
    And the remaining amount is FREE_DELIVERY_THRESHOLD - itemTotal

  Scenario: Sticky mobile basket bar shows FREE when threshold met
    Given the user is on a mobile viewport
    And the user has items at or above FREE_DELIVERY_THRESHOLD
    When the user scrolls down the page
    Then a green sticky basket bar appears at the bottom
    And it shows "FREE delivery →"

  # ── CHECKOUT VALIDATION ──

  Scenario: Checkout blocks orders below MIN_ORDER_AMOUNT
    Given the user has items totaling less than MIN_ORDER_AMOUNT
    When the user tries to proceed to checkout
    Then the checkout button is disabled or shows a minimum order validation message

  Scenario: Checkout delivery cost is read from cart shipping method
    Given the user has selected a delivery slot
    And a shipping method is registered on the cart
    When the user views the payment step
    Then the delivery cost in the order summary matches cart.shipping_methods[0].amount
    And the delivery cost is NOT hardcoded
    And if the cart has no shipping method, STANDARD_DELIVERY_COST is used as fallback

  Scenario: Delivery cost display values are in pence, displayed in pounds
    Given the store config stores STANDARD_DELIVERY_COST as 399 (pence)
    When the delivery cost is displayed via formatGBP()
    Then the user sees "£3.99"
    And the raw pence value 399 never appears in the UI

  Scenario: Total includes delivery cost correctly
    Given itemTotal = 3000 (pence / £30.00) and deliveryCost = 399 (pence / £3.99)
    When the order total is calculated
    Then total = 3399 (pence / £33.99)
    And formatGBP(total) displays "£33.99"
    And Stripe receives 3399 pence (handled by Medusa backend)
