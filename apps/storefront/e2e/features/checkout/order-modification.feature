@W03 @checkout @order-modification
Feature: Order Modification and Weight-Based Charging

  ## Business Rules
  # - Orders can be modified until the packing window closes (e.g., 2 hours before delivery)
  # - During packing, items may be substituted, marked as unavailable, or have weight adjusted
  # - For weight-based products (loose items sold by kg/g), the actual weight determines the final charge
  # - Payment is adjusted on the SAME Stripe PaymentIntent — no new transaction is created
  # - `capture: false` (manual capture) must be configured so payments can be adjusted before capture
  # - The stripe-gbp-provider's `updatePayment` method updates the PaymentIntent amount
  # - Customer receives an updated order summary after packing adjustments
  # - Weight-based variants use `variant.type = "weight"` metadata

  Scenario: Packer marks an item as unavailable
    Given an order contains a product that is out of stock
    When the packer marks the item as unavailable
    Then the order total is recalculated without the unavailable item
    And the existing Stripe PaymentIntent is updated with the new total

  Scenario: Packer substitutes an item
    Given an order contains a product that is out of stock
    When the packer substitutes it with a similar available product
    Then the order total reflects the substituted product's price
    And the PaymentIntent is updated accordingly

  Scenario: Weight-based product — actual weight exceeds estimate
    Given a customer ordered 1kg of loose paneer at an estimated price of £8.00
    When the packer weighs the actual paneer and records "1050g"
    Then the PaymentIntent amount is updated to "£8.40"
    And the customer is charged the actual weight-based amount

  Scenario: Weight-based product — actual weight is less than estimate
    Given a customer ordered 1kg of loose paneer at an estimated price of £8.00
    When the packer weighs the actual paneer and records "950g"
    Then the PaymentIntent amount is updated to "£7.60"
    And the customer is charged only for the actual weight

  Scenario: Customer receives updated order after packing
    Given the packer has adjusted an order during packing
    When the adjustments are saved
    Then the customer receives an email with the updated order summary
    And the updated total is displayed in their order history

  Scenario: Payment is captured after packing adjustments
    Given an order has been packed and adjusted
    When the packer confirms the order is ready for delivery
    Then the PaymentIntent is captured at the final adjusted amount
    And no additional payment authorization is required

  Scenario: Order cannot be modified after the packing window closes
    Given the packing window for an order has closed
    When the packer attempts to modify the order
    Then the modification is rejected
    And the order proceeds to delivery with its current state

  Scenario: Payment update uses the same PaymentIntent
    Given an existing PaymentIntent for an order
    When the order total is adjusted during packing
    Then the updatePayment method is called on the same PaymentIntent
    And no new PaymentIntent is created
    And no additional payment authorization is required from the customer
