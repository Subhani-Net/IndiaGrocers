@W10 @checkout @order @regression
Feature: Order Confirmation — Retry Polling & Post-Purchase Flow

  ## Business Rules
  # - After payment, the user is redirected to /order/[id]/confirmed
  # - If the DB hasn't committed the order yet, the page retries up to 4 times:
  #   Attempt 1: immediate (0s), Attempt 2: +1s, Attempt 3: +2.5s, Attempt 4: +4s
  # - While retrying, an optimistic loading screen shows "Finishing your order..."
  # - On success, the full OrderCompletedTemplate renders (green checkmark, status tracker, repeat order, receipt)
  # - If all 4 retries fail, a static failover page shows "Order Confirmed" with Refresh + View Order History buttons
  # - All timers are cleared on component unmount (memory leak protection)
  # - The Repeat Order button re-adds all order items to the cart
  # - An Order Status Tracker shows: Received ✓, Processing ⏳, Out for Delivery ⏳
  # - A "View Order History" link navigates to /account/orders
  # - Cart is cleared via removeCartId() in the placeOrder() flow (backend)
  # - Architecture: OrderConfirmationClient (polling engine) + OrderCompletedTemplate (receipt) + error.tsx (boundary)

  @smoke
  Scenario: Optimistic loading screen shows during order data retrieval
    Given the user is redirected to the order confirmation page
    Then a "Finishing your order" message is displayed
    And an animated skeleton placeholder is visible
    And the page shows the current retry attempt count

  Scenario: Successful order fetch renders the full receipt with green checkmark
    Given the order data is available on the first fetch attempt
    When the order confirmation page loads successfully
    Then a green checkmark is displayed
    And the order number is shown
    And the "Estimated Delivery" section is visible
    And the "Order Status" tracker is displayed

  Scenario: Retry polling retries up to 4 times before showing failover
    Given the order data is initially unavailable
    When the order confirmation page retries fetching
    Then the page retries exactly 4 times
    And if all retries fail, a static failover page is shown
    And the failover page includes the order number
    And a "Refresh Page" button is displayed
    And a "View Order History" link is displayed

  Scenario: Repeat Order button re-adds order items to the cart
    Given the order confirmation page is displayed with items
    When the user clicks the "Repeat This Order" button
    Then the button shows a "Adding..." state
    And after completion the button shows "✓ Added to Cart"
    And the cart-updated event is dispatched

  Scenario: Order Status Tracker shows three stages
    Given the order confirmation page is displayed
    Then the status tracker shows "Order Received" as complete
    And the status tracker shows "Processing" as in-progress
    And the status tracker shows "Out for Delivery" as pending

  Scenario: View Order History link navigates to account orders
    Given the order confirmation page is displayed
    When the user clicks the "View Order History" link
    Then the user is navigated to the account orders page

  Scenario: Continue Shopping button returns to the store
    Given the order confirmation page is displayed
    When the user clicks the "Continue Shopping" button
    Then the user is navigated to the store page

  Scenario: Memory leak protection — timers are cleared on page navigation
    Given the order confirmation page is displaying the loading state
    When the user navigates away from the page
    Then no pending timers remain active

  Scenario: Back button does not resubmit the payment
    Given the order confirmation page is displayed
    When the user presses the browser back button
    Then the page remains on the confirmation view
