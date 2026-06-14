@W01 @layout @desktop @regression
Feature: Tesco-Style 3-Pane Desktop Layout

  ## Business Rules
  # - Desktop (lg+) viewport splits into 3 panes: Left (Filters), Center (Products), Right (Basket)
  # - Default: Center (Products) + Right (Basket) visible; Left (Filters) hidden
  # - Horizontal quick-filter row with dietary chips shown above products when filter pane is hidden
  # - Click "All Filters" button → Left filter pane slides in, Right basket pane hides
  # - Click filter close (✕) → Left pane hides, Right basket returns
  # - cart-updated event (any add/remove action) → auto-close filter, auto-show basket
  # - Left and Right panes are sticky (position: sticky; top: 80px) with independent scroll
  # - Only Center pane scrolls with the page; Left/Right are locked to viewport
  # - Product grid (children) is never remounted when panes toggle
  # - Mobile (<lg) unaffected — existing filter drawer + single column layout preserved
  # - Architecture: ThreePaneLayout component (client) with useState toggle + cart-updated listener

  @smoke
  Scenario: Default state shows product grid and basket with horizontal quick-filter row
    Given the user is on a desktop viewport
    And the user is on a category page
    Then the product grid is displayed in the center
    And a basket sidebar is visible on the right
    And a horizontal row of dietary filter chips is displayed above the products
    And an "All Filters" button is visible

  Scenario: Clicking "All Filters" opens the filter pane and hides the basket
    Given the user is on a desktop viewport
    And the user is on a category page
    When the user clicks the "All Filters" button
    Then a vertical filter pane slides in on the left side
    And the basket sidebar is hidden
    And a close button is visible at the top of the filter pane

  Scenario: Clicking filter close button restores the basket
    Given the filter pane is open on a category page
    When the user clicks the close button in the filter pane
    Then the filter pane is hidden
    And the basket sidebar is visible again

  Scenario: Adding a product to the cart auto-closes the filter and shows the basket
    Given the filter pane is open on a category page
    When the user adds a product to the cart
    Then the filter pane is hidden
    And the basket sidebar is visible

  Scenario: Left filter pane is sticky and independently scrollable
    Given the filter pane is open on a category page
    Then the filter pane remains visible when the user scrolls the product grid
    And the filter pane has its own vertical scroll

  Scenario: Right basket pane is sticky and independently scrollable
    Given the user is on a desktop viewport
    And the user is on a category page
    Then the basket sidebar remains visible when the user scrolls the product grid

  Scenario: Product grid is never remounted when panes toggle
    Given the user is on a desktop viewport
    And the user is on a category page with many products
    When the user toggles the filter pane open and closed multiple times
    Then the product grid scroll position is preserved

  Scenario: Mobile viewport is unaffected by the 3-pane layout
    Given the user is on a mobile device
    And the user is on a category page
    Then no horizontal quick-filter row is displayed
    And the mobile filter button is visible
    And the basket sidebar is not visible

  Scenario: Search results page has basket sidebar but no filter pane
    Given the user is searching for "basmati" in the header search
    Then the search results grid includes a basket sidebar on desktop
    And no "All Filters" button is displayed

  Scenario: Dietary quick-filter chips navigate to filtered URL
    Given the user is on a desktop viewport
    And the user is on a category page
    When the user clicks the "Vegan" dietary chip
    Then the URL is updated to include the dietary filter parameter

  Scenario: Sort is not present inside the filter pane — only in the utility bar
    Given the user is on a desktop viewport
    And the filter pane is open on a category page
    Then the filter pane does not contain a "Sort By" section

  Scenario: Mobile utility bar shows Filter button and Sort dropdown together on the left
    Given the user is on a mobile device
    And the user is on a category page
    Then the Filter button and Sort control are adjacent on the left side of the utility bar
    And the product count is displayed on the right
