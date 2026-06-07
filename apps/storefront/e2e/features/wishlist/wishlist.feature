@W06 @wishlist
Feature: Wishlist

  ## Business Rules
  # - Customers can save products to a wishlist for later
  # - Wishlist is stored in localStorage (account sync planned — F-12)
  # - The heart icon on product cards toggles between outline (not saved) and filled orange (saved)
  # - The wishlist page shows all saved products in a grid
  # - Empty wishlist shows a heart icon with guidance and a CTA
  # - Wishlist buttons appear on product cards across all listing pages and the PDP

  Scenario: Add a product to the wishlist from a product card
    Given the user is on a category page
    When the user clicks the heart icon on a product card
    Then the heart icon fills with the brand orange colour
    And the product is saved to the wishlist

  Scenario: Remove a product from the wishlist
    Given the user is on a category page with a product already in the wishlist
    When the user clicks the filled heart icon
    Then the heart icon returns to an outline state
    And the product is removed from the wishlist

  Scenario: View the wishlist page with items
    Given the user has at least one product in their wishlist
    When the user navigates to "/wishlist"
    Then the page displays the wishlisted products in a grid
    And each product shows a thumbnail, title, and price

  Scenario: View an empty wishlist page
    Given the user has an empty wishlist
    When the user navigates to "/wishlist"
    Then the page displays a heart icon
    And the page displays the message "Your wishlist is empty"
    And the page displays a "Start Shopping" call-to-action

  Scenario: Wishlist buttons are present on the store page
    Given the user is on the store page
    Then each product card displays a heart icon for the wishlist
