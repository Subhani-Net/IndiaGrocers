@configuration @W00
Feature: Store Configuration — Single Source of Truth

  ## Business Rules
  # - All configurable business values live in ONE file: apps/storefront/src/lib/config/store-config.ts
  # - To change any value: edit store-config.ts → restart storefront
  # - Monetary values are in PENCE (Medusa v2 standard) — the app divides by 100 for display
  # - GBP display labels are STRINGS only — never used in calculations
  # - Delivery slots derive from the Medusa shipping options API, falling back to config values
  #
  # Source: apps/storefront/src/lib/config/store-config.ts
  # Display: formatGBP() in apps/storefront/src/lib/util/format-price.ts (divides by 100)
  # Consumers: basket-progress-bar, sticky-basket-bar, cart summary, checkout-form,
  #            nav banner, homepage promo, delivery page, FAQ accordion,
  #            delivery-slot-selector, order-completed-template

  Scenario: Free delivery threshold is £40 across all pages
    Given the store configuration defines free delivery at 4000 pence
    When the user views the nav banner
    And the user views the basket progress bar
    And the user views the cart summary
    And the user views the homepage promo card
    And the user views the delivery page
    And the user views the FAQ
    Then all pages display "Free delivery on orders over £40"
    And no page displays £45

  Scenario: Minimum order amount is £30
    Given the store configuration defines minimum order at 3000 pence
    When the user adds items below £30 to the basket
    Then the basket progress bar shows "Minimum order £30.00"
    And the cart summary shows "Add £X.XX more to reach the £30.00 minimum order"
    And the checkout is blocked until the total reaches £30

  Scenario: Standard delivery cost is £3.99
    Given the store configuration defines standard delivery at 399 pence
    When the user views the basket progress bar
    Then "Delivery: £3.99 — FREE over £40.00" is displayed
    And the delivery page shows Standard Delivery at £3.99
    And the checkout delivery cost matches the cart shipping method amount

  Scenario: All monetary values flow through formatGBP which divides by 100
    Given the store configuration stores values in pence
    When any value is displayed on screen
    Then it must pass through formatGBP() or convertToLocale()
    And /100 division is applied exactly once
    And no raw pence value appears in the UI

  Scenario: GBP display labels are strings only, never used in calculations
    Given the store configuration exports FREE_DELIVERY_THRESHOLD_GBP as a string
    And the store configuration exports STANDARD_DELIVERY_GBP as a string
    And the store configuration exports FREE_DELIVERY_BANNER as a string
    When these values are consumed by any component
    Then they are used only in template literals and JSX text
    And they are never passed to formatGBP(), +, -, or any numeric operation

  Scenario: Changing a config value requires only one file edit
    Given the developer needs to increase free delivery to £50
    When they edit FREE_DELIVERY_THRESHOLD = 5000 in store-config.ts
    And restart the storefront
    Then every page that references the threshold updates automatically
    And the nav banner, basket bar, cart summary, homepage, delivery page, FAQ all show £50
