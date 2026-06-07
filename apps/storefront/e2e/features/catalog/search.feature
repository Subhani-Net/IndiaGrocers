@W01 @search
Feature: Product Search

  ## Business Rules
  # - Search is powered by MeiliSearch with synonym support for vernacular terms
  # - Hindi/vernacular terms map to English products (e.g., "jeera" → cumin)
  # - Search results show product cards with title, thumbnail, and price
  # - Autocomplete shows up to 5 matching products with thumbnail and price
  # - Category quick-filter chips narrow results to a specific category
  # - Empty search shows guidance to start typing or select a category
  # - No-matching-results shows a suggestion to try different terms
  # - Search country code is dynamically resolved (not hardcoded)
  # - Named vernacular terms: jeera, haldi, chana, basmati, dal, besan, masala

  Scenario: Search for products using an English term
    Given the user navigates to the search page with query "basmati"
    Then the page displays search results
    And the results include "Tilda Pure Basmati"
    And the results include "Natco - Basmati Rice India - Bag 5kg"

  Scenario: Search for products using a vernacular Hindi term — jeera
    Given the user navigates to the search page with query "jeera"
    Then the page displays search results
    And the results include "TRS Cumin Seeds"
    And the results include "Natco - Cumin Seeds 400g"

  Scenario: Search for products using a vernacular Hindi term — haldi
    Given the user navigates to the search page with query "haldi"
    Then the page displays search results
    And the results include "Natco - Turmeric Powder 400g"
    And the results include "Natco - Turmeric Powder Jar 100g"

  Scenario: Search for products using a vernacular Hindi term — chana
    Given the user navigates to the search page with query "chana"
    Then the page displays search results
    And the results include "Natco - Chanadal Polished 2kg"
    And the results include "Natco - Brown Chick Peas 2kg"

  Scenario: Search shows autocomplete suggestions
    Given the user navigates to the search page
    When the user types "rice"
    Then an autocomplete dropdown appears with matching products
    And each suggestion shows a thumbnail, title, and price
    And the dropdown shows a "View all results" link

  Scenario: Search shows autocomplete suggestions for vernacular terms
    Given the user navigates to the search page
    When the user types "dal"
    Then the autocomplete dropdown shows lentil products matching the term

  Scenario: Clicking outside search closes autocomplete
    Given the search autocomplete dropdown is visible
    When the user clicks outside the search area
    Then the autocomplete dropdown closes

  Scenario: Empty search query shows guidance
    Given the user navigates to the search page with an empty query
    Then the page displays a message to start typing or select a category

  Scenario: No matching search results shows suggestion
    Given the user navigates to the search page with query "xyznonexistent"
    Then the page displays no results
    And the page displays a suggestion to try different terms

  Scenario: Category quick-filter chip narrows results
    Given the user is on the search page with results
    When the user clicks the "Rice" category chip
    Then only products in the Rice category are displayed
    And the "Rice" chip is visually active

  Scenario: Deselecting a category chip restores all results
    Given a category chip is active on the search results
    When the user clicks the same chip again
    Then the filter is removed
    And all search results are displayed

  Scenario: Search results show product cards with prices
    Given the user navigates to the search page with query "rice"
    Then each search result displays a product title
    And each search result displays a product price
    And each search result displays a product image

  Scenario: Top 10 search results are ranked correctly
    Given the user navigates to the search page with query "masala"
    Then the top result is "Shan Karahi Gosht Masala"
    And the results include "MDH Kitchen King Masala"
    And at least 10 results are returned
