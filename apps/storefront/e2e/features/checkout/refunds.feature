@W03 @payment @refund
Feature: Payment Refunds

  ## Business Rules
  # - Refunds are processed through the same Stripe PaymentIntent used for the original charge
  # - The refund amount cannot exceed the original charge amount
  # - Partial refunds are supported (e.g., returning one item from a multi-item order)
  # - Charge-already-refunded errors are handled gracefully (idempotent)
  # - Refund notification email is sent to the customer
  # - The stripe-gbp-provider refundPayment method uses Stripe's refunds API
  # - Refunds are recorded in the payment session data for audit
  # - GBP amounts are in pence throughout the refund flow (no conversion needed)

  Scenario: Full refund of a completed order
    Given an order has been placed and payment captured
    When the admin initiates a full refund
    Then the full order amount is refunded to the customer's card
    And the refund appears in the Stripe dashboard
    And a refund confirmation email is sent to the customer

  Scenario: Partial refund of a multi-item order
    Given an order has been placed with multiple items
    When the admin initiates a refund for a single item
    Then only the refunded item's amount is returned to the customer
    And the remaining items are still charged

  Scenario: Refund amount cannot exceed the original charge
    Given an order has been placed for "£30.00"
    When the admin attempts to refund "£35.00"
    Then the refund is rejected
    And an error message is displayed

  Scenario: Refund is idempotent
    Given an order has already been refunded
    When the admin attempts to refund the same order again
    Then the charge-already-refunded status is returned
    And no duplicate refund is created

  Scenario: Refund notification email is sent
    Given a refund has been processed
    Then a refund confirmation email is sent to the customer
    And the email includes the refunded amount and order number

  Scenario: Refund provider correctly handles GBP amounts
    Given a payment was captured for "349 pence"
    When a refund is initiated for "349 pence"
    Then the Stripe refund API receives "349" as the amount
    And the customer's card is credited "£3.49"
