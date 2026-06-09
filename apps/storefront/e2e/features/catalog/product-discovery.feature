@W01 @catalog
Feature: Product Discovery — Browse, Categories, PDP

  ## Business Rules
  # - Products are organised into a category tree: parent → child → leaf
  # - Category pages show subcategory chips for child categories
  # - Product cards display title, thumbnail, price, and brand badge
  # - Multi-variant products show a variant overlay with size/weight options
  # - Single-variant products show an "Add to Basket" button directly
  # - Product Detail Page (PDP) shows title, images, price, description, stock status
  # - PDP tabs show grocery-specific information: ingredients, allergens, storage
  # - PDP for multi-variant products shows variant selector with price updates
  # - Breadcrumb navigation shows the user's position in the category tree
  # - Store page shows all products with load-more pagination
  # - Filters and sort controls refine the product listing
  # - Named products: "Natco - Cumin Seeds 400g", "Tilda Pure Basmati", "Natco - Brown Lentils 2kg"

  Scenario: Browse a category from the homepage grid
    Given the user is on the homepage
    When the user clicks a category card in the category grid
    Then the user is navigated to a category page
    And the page displays breadcrumb navigation
    And the page displays the category title
    And the page displays subcategory chips
    And the page displays a grid of product cards

  Scenario: Browse a subcategory from the chips
    Given the user is on a parent category page
    When the user clicks a subcategory chip
    Then only products from that subcategory are displayed
    And the subcategory chip is visually active

  Scenario: Category page with no products shows an empty state
    Given the user navigates to an empty category
    Then the page displays a "no products found" message
    And the page displays breadcrumb navigation

  Scenario: View a product detail page for a single-variant product
    Given the user is on a category page
    When the user clicks the product card for "Natco - Cumin Seeds 400g"
    Then the user is navigated to the product detail page
    And the page displays the product title "Natco - Cumin Seeds 400g"
    And the page displays at least one product image
    And the page displays the product price
    And the page displays an "Add to Cart" button
    And the page displays a stock status indicator

  Scenario: View a product detail page for a multi-variant product
    Given the user is on a category page
    When the user clicks the product card for "Tilda Pure Basmati"
    Then the user is navigated to the product detail page
    And the page displays variant size options
    And the price updates when a different variant is selected

  Scenario: Product detail page shows grocery-specific information
    Given the user is on a product detail page
    When the user expands the product information section
    Then the page displays ingredient information if available
    And the page displays storage instructions if available
    And the page displays allergen information if available
    And the page does not display clothing-specific fields

  Scenario: Open the variant overlay from a product card
    Given the user is on a category page with multi-variant products
    When the user clicks the Options button on a product card
    Then a modal overlay opens showing all variants
    And each variant shows a quantity control
    And pressing ESC closes the overlay
    And clicking outside the overlay closes it

  Scenario: Sort products by price on a listing page
    Given the user is on the store page
    When the user selects "Price: Low to High" from the sort dropdown
    Then products are displayed in ascending price order

  Scenario: Filter products by price range
    Given the user is on the store page
    When the user enters a minimum price and a maximum price
    Then only products within the price range are displayed

  Scenario: Clear all active filters
    Given the user has applied filters
    When the user clicks "Clear Filters"
    Then all filters are removed
    And all products are displayed

  Scenario: Load more products via pagination
    Given the user is on the store page
    When the user clicks "Load More"
    Then additional products are appended to the grid
    And the product count display updates

  Scenario: Product card displays brand badge
    Given the user is on a category page
    Then each product card displays a brand badge

  Scenario: Product with no image shows a placeholder
    Given the user views a product with a missing image
    Then a placeholder image is displayed instead of a broken image

  @D9 @navigation
  Scenario: Navigate from category page to PDP by clicking a product card
    Given the user is on the "corn" category page
    When the user clicks any product card link
    Then the user is navigated to a product detail page
    And the PDP displays a product title
    And the PDP displays a product price in GBP

  @D9 @navigation
  Scenario: Navigate from category page to PDP on mobile
    Given the user is on a mobile device
    And the user is on the "corn" category page
    When the user clicks any product card link
    Then the user is navigated to a product detail page
    And the PDP displays a product title

  @D9 @navigation
  Scenario: Navigate from store page to PDP
    Given the user is on the store page
    When the user clicks any product card link
    Then the user is navigated to a product detail page
    And the PDP displays a product title

  @D9 @navigation
  Scenario: PDP breadcrumbs link back to category
    Given the user is viewing a product detail page
    Then the breadcrumbs contain a link to the product's category
    And the breadcrumbs contain a link to the store

  @D9 @navigation
  Scenario: Search results navigate to PDP
    Given the user navigates to the search page with query "basmati"
    When the user clicks any product card link
    Then the user is navigated to a product detail page
    And the page displays basmati rice information
