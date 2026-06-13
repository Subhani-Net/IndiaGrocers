@W03 @W05 @payment @confirmation @critical-path
Feature: Payment Processing and Order Confirmation

  ## Business Rules
  # - Payment is processed via the backend Stripe provider (stripe-gbp-provider)
  # - The storefront NEVER passes amounts to Stripe — only the backend creates Stripe PaymentIntents
  # - Stripe PaymentIntent amount comes from the Medusa cart total (in pence)
  # - Payment session is created FIRST, then the cart is completed (order created)
  # - On success, the user is redirected to /order/{order_id}/confirmed
  # - The confirmation page fetches fresh order data (no-store cache)
  # - Confirmation page shows: checkmark, order number, ETA, address, payment, items, summary
  # - Confirmation page shows a "Continue Shopping" button to /store
  # - If payment fails or order creation fails, an error is shown on the checkout page
  # - Guest users can complete checkout and view order confirmation
  #
  # Defects covered: D5 (payment session), D8 (price display), D10 (confirmation blank)
  #
  # Provider: apps/backend/src/framework-enhancements/payment/stripe-gbp-provider.ts
  # Confirmation: apps/storefront/src/modules/order/templates/order-completed-template.tsx
  # Cart completion: apps/storefront/src/lib/data/cart.ts (placeOrder)
  # Order retrieval: apps/storefront/src/lib/data/orders.ts (retrieveOrder)

  # ────────────────────────────────────────────────────────────
  # PAYMENT FLOW — End to End
  # ────────────────────────────────────────────────────────────

  @D5 @D8 @regression
  Scenario: Payment session is created with the correct cart total
    Given the user has an item in their basket
    And the user has filled in their delivery address
    And the user has selected a delivery slot
    When the user proceeds to the payment step
    Then a payment session is created
    And the payment session amount matches the cart total

  @D5 @regression
  Scenario: Stripe PaymentIntent receives the correct amount in pence
    Given the user has an item in their basket
    And the user has filled in their delivery address
    When the user initiates a Stripe payment
    Then the Stripe PaymentIntent is created with the cart total in pence
    And the Stripe amount is NOT multiplied by 100

  @D10 @regression
  Scenario: Cart completion creates an order and redirects to confirmation
    Given the user has initiated a successful Stripe payment
    When the cart is completed
    Then an order is created in the system
    And the user is redirected to the order confirmation page
    And the confirmation URL contains "/order/" and "/confirmed"

  @D10 @regression
  Scenario: Order confirmation page displays all required sections
    Given the user is on the order confirmation page for a successfully placed order
    Then the page displays a green success indicator
    And the page displays the text "Order Confirmed"
    And the confirmation page displays the order number
    And the confirmation page displays a delivery ETA
    And the page displays the delivery address
    And the page displays the payment method used
    And the page lists the items ordered with their quantities
    And the page displays the order subtotal, shipping cost, and total
    And the page displays a "Continue Shopping" button

  @D10 @regression
  Scenario: Order confirmation page does NOT show a 404 or blank page
    Given the user is on the order confirmation page for a successfully placed order
    Then the page does NOT display "Page not found"
    And the page does NOT display "Go to frontpage"
    And the page content is longer than 100 characters
    And the page contains order-related content

  @D10 @regression
  Scenario: Order confirmation page shows correct prices
    Given the user is on the order confirmation page for a successfully placed order
    Then all prices on the page are displayed in GBP format with two decimal places
    And the order total matches the sum of subtotal and shipping

  @D8 @regression
  Scenario: Payment amount is consistent across frontend, backend, and Stripe
    Given the user completes the full checkout and payment flow
    Then the amount displayed on the Pay button matches the cart total divided by 100
    And the amount sent to Stripe matches the cart total in pence
    And no price is multiplied by 100 at any stage

  # ────────────────────────────────────────────────────────────
  # NAVIGATION FLOW — Post-Payment
  # ────────────────────────────────────────────────────────────

  @navigation
  Scenario: User navigates from confirmation back to store
    Given the user is on the order confirmation page
    When the user clicks "Continue Shopping"
    Then the user is navigated to the store page

  @navigation
  Scenario: User navigates from confirmation to order history
    Given the user is on the order confirmation page
    When the user clicks "View your order"
    Then the user is navigated to the order history page

  @navigation
  Scenario: User navigates from confirmation to create account
    Given the user is on the order confirmation page as a guest
    When the user clicks "Create Account"
    Then the user is navigated to the registration page

  # ────────────────────────────────────────────────────────────
  # SHIPPING METHOD VALIDATION IN CART COMPLETION
  # ────────────────────────────────────────────────────────────

  @D1 @D5 @critical-path @regression
  Scenario: Cart completion validates shipping method is set
    Given the user has an item in their basket
    And the user has filled in their delivery address
    And the user has selected a delivery slot
    And the user has initiated a successful payment
    When the cart is completed
    Then the cart's shipping_methods array is non-empty
    And the validateShippingStep passes without error

  @D1 @D5 @critical-path @regression
  Scenario: Delivery cost in order confirmation matches registered shipping method
    Given the user has completed the full checkout flow
    Then the order confirmation displays the correct shipping cost
    And the shipping cost in the order matches the shipping method registered on the cart

  # ────────────────────────────────────────────────────────────
  # DATA FLOW — Shipping Method → Payment → Order
  # ────────────────────────────────────────────────────────────

  @architecture @critical-path
  Scenario: Shipping method is registered BEFORE payment session creation
    Given the user is on the payment step
    When the user clicks the Pay button
    Then the cart has a shipping method set before initiatePaymentSession is called
    And the payment session is created for a cart with valid shipping

  @architecture @critical-path
  Scenario: Complete order flow with shipping method validation
    Given the user starts with an empty basket
    When the user adds a product to the basket
    And the user fills in delivery address
    And the user selects a delivery slot
    And the shipping method is registered on the cart
    And the user enters payment details
    And the user confirms the order
    Then the order is created successfully
    And the order has a shipping method
    And the order confirmation page displays correct shipping cost
