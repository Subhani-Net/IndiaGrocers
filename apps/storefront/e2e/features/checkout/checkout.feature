@W03 @W05 @checkout
Feature: Checkout and Order Confirmation

  ## Business Rules
  # - Checkout requires 4 sequential steps: Address → Delivery → Payment → Review
  # - Address step collects first name, last name, address, city, postcode, email, phone
  # - Postcode validation gate checks if the postcode is within the delivery area
  # - Delivery slots are 4-hour windows on weekends only (Saturday and Sunday)
  # - Four weekend days are displayed across two weekends (2 Saturdays + 2 Sundays)
  # - Time windows: Morning (8am-12pm), Afternoon (12pm-4pm), Evening (4pm-8pm)
  # - Payment is processed via Stripe CardElement — postal code field is hidden
  # - Both authenticated customers and guests can complete checkout
  # - Order confirmation page shows: green checkmark, order number, delivery ETA
  # - Confirmation page displays: delivery address card, payment method card, items list
  # - A "Continue Shopping" button is available on the confirmation page
  # - Empty basket redirects the user away from the checkout page
  # - G13: PDF invoice sent on order.placed and downloadable from order history
  # - D1: Delivery slots are 4-hour weekend only
  # - D3: Stripe ZIP field hidden for non-Amex cards (deferred)
  # - D5: Payment correctly creates session and captures payment

  @D5 @regression
  Scenario: Checkout redirects when the basket is empty
    Given the user has an empty basket
    When the user attempts to access the checkout page
    Then the user is redirected away from checkout

  @D5
  Scenario: Address step shows all required fields
    Given the user has an item in their basket
    When the user navigates to the checkout address step
    Then the address form includes fields for first name, last name, address, city, postcode, email, and phone

  Scenario: Postcode validation gate appears
    Given the user has an item in their basket
    When the user navigates to the checkout address step
    Then a postcode validation gate is displayed

  Scenario: Valid London postcode passes the gate
    Given the user enters a postcode of "E1 6AN"
    Then the postcode gate passes
    And the user can continue to shop

  Scenario: Invalid postcode shows a warning
    Given the user enters a postcode of "LS1 1AA"
    Then a warning is displayed that delivery may not be available

  Scenario: Address step validates required fields
    Given the user has an item in their basket
    And the user is on the checkout address step
    When the user submits with missing required fields
    Then validation errors are displayed

  @D1 @bugfix
  Scenario: Delivery slots are restricted to weekend days only
    Given the user has an item in their basket
    And the user has filled in their delivery address
    When the user proceeds to the delivery step
    Then only Saturday and Sunday dates are available for selection

  @D1
  Scenario: Delivery slots display 4-hour time windows
    Given the user has an item in their basket
    And the user has filled in their delivery address
    When the user proceeds to the delivery step
    Then three time windows are available covering morning, afternoon, and evening

  Scenario: Payment step shows Stripe card entry form
    Given the user has an item in their basket
    When the user navigates to the payment step
    Then a card payment form is displayed

  Scenario: Payment form has a visible pay button
    Given the user has an item in their basket
    When the user navigates to the payment step
    Then a pay button is displayed with the order total

  Scenario: Review step shows the full order summary
    Given the user is on the review step
    Then the order summary shows the items, shipping cost, and total

  # ────────────────────────────────────────────────────────────
  # CHECKOUT FLOW — Shipping Method Registration (Architecture Fix)
  # ────────────────────────────────────────────────────────────

  @critical-path @regression
  Scenario: Delivery step registers a shipping method on the cart before advancing
    Given the user has an item in their basket
    And the user has filled in their delivery address
    When the user selects a delivery slot and clicks Continue to Payment
    Then the shipping method is registered on the cart via the Medusa API
    And the user is advanced to the payment step

  @critical-path @regression
  Scenario: Payment step is guarded — redirects to delivery if no shipping method
    Given the user has an item in their basket
    And no shipping method has been set on the cart
    When the user navigates to the payment step
    Then the user is redirected to the delivery step

  @critical-path @regression
  Scenario: Delivery cost displayed in order summary matches the registered shipping method
    Given the user has an item in their basket
    And the user has filled in their delivery address
    And the user has selected a delivery slot and advanced to payment
    Then the delivery cost in the order summary matches the cart's shipping method amount

  @critical-path @regression
  Scenario: Place order validates shipping method is set before creating payment session
    Given the user is on the payment step
    And a shipping method is registered on the cart
    When the user initiates payment
    Then the payment session is created successfully
    And the cart completion succeeds without a "No shipping method selected" error

  @critical-path @regression
  Scenario: Payment session is created only after shipping method is confirmed
    Given the user has an item in their basket
    And the user has filled in their delivery address
    And the user has selected a delivery slot and advanced to payment
    When the user places the order
    Then the cart has a shipping method before payment session creation
    And the "No shipping method selected" error is never raised

  # ────────────────────────────────────────────────────────────
  # DELIVERY SLOT → SHIPPING OPTION MAPPING
  # ────────────────────────────────────────────────────────────

  Scenario: All delivery time windows map to valid shipping option IDs
    Given the user has an item in their basket
    And the user has filled in their delivery address
    When the user is on the delivery step
    Then every available time window has a non-empty shipping option ID
    And the window prices match the shipping option's calculated price

  Scenario: Express delivery option is mapped correctly when available
    Given the user has an item in their basket
    And the user has filled in their delivery address
    When the user is on the delivery step
    Then if a premium window exists, it maps to the express shipping option
    And the premium window displays the express shipping option's price

  # ────────────────────────────────────────────────────────────
  # CACHE & DATA FLOW
  # ────────────────────────────────────────────────────────────

  Scenario: Cart cache is revalidated after shipping method is set
    Given the user has an item in their basket
    And the user is on the delivery step
    When a shipping method is set on the cart
    Then the cart cache tag is revalidated
    And the payment step receives the cart with the updated shipping method

  Scenario: Shipping options list is not cached indefinitely
    Given the user accesses the checkout page
    Then the shipping options are fetched from the Medusa API
    And the shipping options response includes real shipping option IDs and prices
    And the delivery address is displayed
    And the selected delivery slot is displayed

  Scenario: Order confirmation page shows success message
    Given the user has just placed an order
    Then the confirmation page displays a green checkmark
    And the confirmation page displays a "Thank you" message
    And the confirmation page displays the order number
    And the confirmation page displays a delivery ETA

  Scenario: Order confirmation page shows order details
    Given the user is on the order confirmation page
    Then a delivery address card is displayed
    Then a payment method card is displayed
    And the list of items ordered with quantities is displayed
    And the order summary with subtotal, shipping, and total is displayed

  Scenario: Continue Shopping button on confirmation page
    Given the user is on the order confirmation page
    Then a "Continue Shopping" button is displayed

  @G13
  Scenario: Order placed triggers confirmation email
    Given an order has been placed
    Then an order confirmation email is sent to the customer

  Scenario: Guest can complete checkout without login
    Given the user is not signed in
    And the user has items in their basket
    When the user completes the checkout flow
    Then the order is placed successfully
    And the order confirmation page is displayed

  @D10 @regression
  Scenario: Order confirmation page shows success with order details
    Given the user has just placed an order
    Then a green checkmark is displayed
    And a "Thank you" message is displayed
    And the confirmation page displays the order number
    And a delivery ETA is displayed
    And a delivery address card is displayed
    And a payment method card is displayed
    And the list of items ordered with quantities is displayed
    And the order summary with subtotal, shipping, and total is displayed
    And a "Continue Shopping" button is displayed

  @D10 @regression
  Scenario: Order confirmation page is not a blank 404 page
    Given the user has just placed an order
    Then the page does not display a 404 error
    And the page does not display "Page not found"
    And the page displays meaningful order content
