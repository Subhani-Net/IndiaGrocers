@mobile
Feature: Mobile Experience

  ## Business Rules
  # - Mobile viewport is defined as width < 768px
  # - Mobile layout uses a hamburger side menu instead of the desktop header
  # - Product cards switch to a horizontal layout (image left, text right) on mobile
  # - A sticky add-to-cart bar appears at the bottom when the user scrolls past the PDP add button
  # - The mobile side menu includes Home, Store, Account, Cart, and all category links
  # - Clicking outside the side menu or the close button dismisses it

  Scenario: Open the mobile hamburger menu
    Given the user is on a mobile device
    When the user taps the hamburger icon
    Then the side menu slides in
    And the menu shows Home, Store, Account, and Cart links
    And the menu shows all category links

  Scenario: Close the mobile side menu via close button
    Given the mobile side menu is open
    When the user taps the close button
    Then the side menu slides out and closes

  Scenario: Close the mobile side menu by tapping outside
    Given the mobile side menu is open
    When the user taps outside the menu
    Then the side menu slides out and closes

  Scenario: Mobile product cards display in horizontal layout
    Given the user is on a mobile device
    When the user views a category page
    Then product cards are displayed in a horizontal layout
    And each card shows the product image on the left and text on the right

  Scenario: Sticky add-to-cart bar appears on PDP scroll
    Given the user is on a mobile device viewing a product detail page
    When the user scrolls past the "Add to Cart" button
    Then a sticky add-to-cart bar appears at the bottom of the screen
