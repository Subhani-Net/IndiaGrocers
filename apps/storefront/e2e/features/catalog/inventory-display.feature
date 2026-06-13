@W01 @catalog @inventory
Feature: Inventory Display — Stock Status on PDP and Listing Pages

  ## Business Rules
  # - Products with inventory show "In Stock" on the Product Detail Page
  # - Products do NOT show false "Out of Stock" badges — this was a critical bug
  # - Variant chips for in-stock items are enabled and clickable
  # - Add-to-Cart button is enabled for in-stock products
  # - Listing page product cards (category, search, store) do NOT show OOS badges
  # - Cart page does NOT falsely flag items as out of stock
  # - Inventory is a separate data layer from product identity
  # - Inventory changes (order placed) are reflected immediately (no cache staleness)

  Scenario: PDP shows In Stock for a product with inventory
    Given the user navigates to the PDP for "Natco - Cumin Seeds 400g"
    Then the page does not display "Out of Stock"
    And the Add to Cart button is enabled

  Scenario: PDP shows In Stock for a multi-variant product
    Given the user navigates to the PDP for "Natco - Soya Chunks 350g"
    Then variant size options are displayed
    And no variant is marked as "Out of stock"

  Scenario: Variant chips are clickable for in-stock variants
    Given the user is on a PDP with multiple weight variants
    When the user clicks a variant chip
    Then the selected variant's price is displayed
    And the Add to Cart button remains enabled

  Scenario: Category page does not show Out of Stock badges
    Given the user navigates to the category "rice_grains"
    Then product cards are displayed
    And no product card shows an "Out of Stock" badge

  Scenario: Search results do not show Out of Stock badges
    Given the user searches for "basmati"
    Then search results are displayed
    And no product card shows an "Out of Stock" badge

  Scenario: Cart page does not flag in-stock items as out of stock
    Given the user has added an in-stock product to the cart
    When the user views the cart page
    Then the cart does not display an "out of stock" warning banner
    And no items are grouped under an "Out of Stock" section header

  Scenario: Inventory is refreshed after order placement
    Given the user has placed an order
    When the user returns to the product page
    Then the product reflects updated inventory availability
