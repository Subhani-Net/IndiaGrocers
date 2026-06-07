@errors @resilience
Feature: Error Handling and Edge Cases

  ## Business Rules
  # - All error states must degrade gracefully — never show a blank page or raw stack trace
  # - 404 pages for non-existent products and categories show a friendly message with a homepage link
  # - Product images that fail to load show a placeholder or fallback image
  # - The cart must persist across page navigation and browser refresh
  # - When the backend is unreachable, the storefront must show a sensible error message
  # - Network timeouts must be handled without crashing the page
  # - The application must not log sensitive information to the browser console

  Scenario: Navigate to a non-existent page
    Given the user navigates to "/non-existent-page"
    Then the page displays a 404 error message
    And the page displays a link to return to the homepage

  Scenario: Navigate to a non-existent product
    Given the user navigates to "/products/non-existent-handle"
    Then the page displays a 404 error message

  Scenario: Navigate to a non-existent category
    Given the user navigates to "/categories/non-existent-category"
    Then the page displays a 404 or empty state message

  Scenario: Product image fails to load
    Given a product has a broken image URL
    When the user views the product on a listing page
    Then a placeholder image is displayed instead of a broken image icon

  Scenario: Cart persists across page navigation
    Given the user has added items to their basket
    When the user navigates to a different page
    And the user returns to the category page
    Then the basket still contains the same items

  Scenario: Cart persists across browser refresh
    Given the user has added items to their basket
    When the user refreshes the browser
    Then the basket still contains the same items

  Scenario: Backend unreachable shows a sensible error
    Given the backend is not responding
    When the user navigates to any store page
    Then a sensible error message is displayed
    And no blank page or raw error is shown

  Scenario: No console errors on any page
    Given the user navigates to any page
    Then no errors are logged to the browser console
