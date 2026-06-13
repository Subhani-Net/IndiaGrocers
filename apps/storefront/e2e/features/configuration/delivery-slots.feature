@configuration @W03 @D1
Feature: Delivery Slots — Configuration & Behaviour

  ## Business Rules
  # - Delivery slots are generated from the DELIVERY_SLOTS config in store-config.ts
  # - Only Saturday and Sunday are available (weekend delivery only)
  # - 4 weekend days are shown (2 weekends: 2 Saturdays + 2 Sundays)
  # - 3 time windows per day: Morning (8am-12pm), Afternoon (12pm-4pm), Evening (4pm-8pm)
  # - Each time window is mapped to a Medusa shipping option via shippingOptionId
  # - Time window prices match the shipping option's calculated_price.calculated_amount
  # - The shipping method is registered on the cart before advancing to payment
  #
  # Source: apps/storefront/src/lib/config/store-config.ts → DELIVERY_SLOTS
  # Component: apps/storefront/src/modules/checkout/components/delivery-slot-selector/index.tsx
  # API: setShippingMethod() in apps/storefront/src/lib/data/cart.ts → POST /store/carts/{id}/shipping-methods
  # E2E tests: apps/storefront/e2e/checkout/delivery-slots.spec.ts (7 tests)
  # BDD steps: apps/storefront/e2e/features/checkout/checkout.steps.ts

  # ── DELIVERY_SLOTS Config Structure ──

  Scenario: Delivery slots configuration is stored in a single source
    Given the store configuration file exists at src/lib/config/store-config.ts
    When the DELIVERY_SLOTS export is read
    Then it contains daysToShow, maxAttempts, weekendOnly, and windows
    And each window has label, start, and end properties

  Scenario: Number of displayed weekend days is configurable
    Given DELIVERY_SLOTS.daysToShow is set in store-config.ts
    When the delivery step renders
    Then exactly that many day buttons are displayed
    And the default value is 4 (2 weekends)

  Scenario: Time windows are defined in the config, not hardcoded
    Given DELIVERY_SLOTS.windows contains the time window definitions
    When the delivery slot selector renders
    Then each window matches a config entry
    And the window IDs, labels, start times, and end times come from the config
    And no hardcoded "Morning (8am-12pm)" string exists outside the config file

  Scenario: Weekend-only restriction is configurable
    Given DELIVERY_SLOTS.weekendOnly is set in store-config.ts
    When the delivery step renders available days
    Then if weekendOnly is true, only Saturday (6) and Sunday (0) are shown
    And if weekendOnly is false, all days of the week are available

  Scenario: Day generation safety limit prevents infinite loops
    Given DELIVERY_SLOTS.maxAttempts is set in store-config.ts
    When the date generation loop runs
    Then it stops after at most maxAttempts iterations
    And the default value is 14

  # ── SHIPPING OPTION MAPPING ──

  Scenario: Each time window maps to a valid Medusa shipping option
    Given shipping options are fetched from the Medusa API
    When time windows are generated
    Then each window has a non-empty shippingOptionId
    And the shippingOptionId matches an option returned by the API

  Scenario: Time window prices match the mapped shipping option
    Given a shipping option has calculated_price.calculated_amount
    Or a shipping option has amount as fallback
    Or the config STANDARD_DELIVERY_COST as final fallback
    When a time window is displayed
    Then its price matches the resolved shipping option price
    And the price is in pence, displayed through formatGBP()

  Scenario: Express shipping option is mapped for premium windows
    Given the store config has EXPRESS_DELIVERY_COST = 699
    And a time window is marked as premium: true
    When that window is displayed
    Then it maps to the express shipping option
    And displays the express price

  # ── RENDERING BEHAVIOUR ──

  Scenario: Delivery step shows slot selector with all required elements
    Given the user has an item in their basket
    And the user has filled in their delivery address
    When the user navigates to the delivery step
    Then the delivery slot selector is visible
    And day buttons show weekend dates
    And clicking a day button expands time windows
    And each time window shows its label, start time, and end time

  Scenario: Selecting a time window shows a confirmation summary
    Given the user has expanded a delivery day
    When the user clicks a time window
    Then a green confirmation summary appears
    And it displays the selected date and time window

  Scenario: All displayed days are weekend days
    Given the delivery step is rendered
    When day buttons are examined
    Then every day abbreviation is "Sat" or "Sun"
    And exactly 4 days are shown
    And no weekday appears

  Scenario: Continue to Payment button is disabled without slot selection
    Given the user is on the delivery step
    When no slot has been selected
    Then the Continue to Payment button is disabled

  Scenario: Selecting a slot enables the Continue to Payment button
    Given the user is on the delivery step
    When the user selects a delivery date and time window
    Then the Continue to Payment button becomes enabled
