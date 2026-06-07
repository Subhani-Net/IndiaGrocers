@W02 @cart
Feature: Cart Management

  ## Business Rules
  # - Cart is persisted in Medusa session (survives page navigation and browser refresh)
  # - Quantity is tracked per variant, not per product — each variant is a separate line item
  # - Quantity controls appear only after the first "Add" click
  # - Decrementing to zero removes the line item entirely from the cart
  # - Cart page groups items by product category
  # - Quantity selector on the cart page allows values 1 to 10
  # - Out-of-stock items are flagged with a red alert badge and displayed at the top
  # - Promo codes can be applied and removed from the order summary
  # - Empty cart displays a clear message with a call-to-action to start shopping
  # - Cart dropdown shows items and subtotal without leaving the current page
  # - Guests with items see a sign-in prompt for a better experience
  # - D2: Basket sidebar should follow the user on scroll (sticky position)
  # - D4: Add to Basket must provide visual feedback on the product card

  Scenario: Add a single-variant product from a category page
    Given the user is on the "corn" category page
    When the user adds a product to their basket
    Then the basket contains at least one item

  Scenario: Quantity controls replace the Add button after first add
    Given the user is on the "corn" category page
    When the user adds a product to their basket
    Then the product card shows quantity controls

  Scenario: View basket dropdown after adding a product
    Given the user is on the "corn" category page
    When the user adds a product to their basket
    When the user opens the basket dropdown
    Then the dropdown shows at least one item

  Scenario: View an empty basket page
    Given the user navigates to "/cart"
    Then the page displays an empty basket message

  Scenario: Add a product from the product detail page
    Given the user is on the product detail page for a single-variant product
    When the user sets the quantity to 3
    And the user clicks "Add to Cart"
    Then the basket shows 3 units of the product

  Scenario: Update quantity on the cart page
    Given the user has items in their basket
    When the user changes the quantity of an item from 1 to 3
    Then the subtotal updates to reflect 3 times the unit price

  Scenario: Remove an item from the cart
    Given the user has an item in their basket with quantity 1
    When the user reduces the quantity to zero
    Then the item is removed from the basket

  Scenario: Cart page groups items by product category
    Given the user has items from different categories in their basket
    When the user views the cart page
    Then items are grouped under their respective category headings

  Scenario: Cart page shows order summary
    Given the user has items in their basket
    When the user views the cart page
    Then the order summary displays the subtotal
    And the order summary displays the shipping cost
    And the order summary displays the total

  Scenario: Cart page shows a promo code input
    Given the user has items in their basket
    When the user views the cart page
    Then a promo code input field is visible

  Scenario: Apply a valid promo code
    Given the user has items in their basket
    When the user enters a valid promo code and clicks apply
    Then the discount is reflected in the order summary

  Scenario: Remove an applied promo code
    Given a promo code has been applied to the basket
    When the user clicks remove on the applied promotion
    Then the discount is removed from the order summary

  Scenario: Out-of-stock items are flagged in the cart
    Given the user has a mix of in-stock and out-of-stock items in their basket
    When the user views the cart page
    Then out-of-stock items are visually flagged with a red alert badge
    And out-of-stock items are displayed at the top of the list

  Scenario: Cart dropdown shows subtotal
    Given the user has items in their basket
    When the user opens the basket dropdown
    Then the dropdown displays the basket subtotal

  Scenario: Cart dropdown has navigation buttons
    Given the user has items in their basket
    When the user opens the basket dropdown
    Then the dropdown shows a "View Cart" button
    And the dropdown shows a "Go to Checkout" button

  Scenario: Basket items persist across page navigation
    Given the user has added items to their basket
    When the user navigates to a different page
    And the user returns to the cart page
    Then the basket still contains the same items

  Scenario: Guest with items sees a sign-in prompt
    Given the user is not signed in
    And the user has items in their basket
    When the user views the cart page
    Then the page displays a prompt to sign in for a better experience
