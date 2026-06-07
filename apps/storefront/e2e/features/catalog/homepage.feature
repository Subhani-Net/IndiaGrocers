@W01 @homepage @smoke
Feature: Homepage

  ## Business Rules
  # - The homepage is the primary landing page for all visitors
  # - Guest visitors see the full homepage with onboarding prompts
  # - Authenticated users see personalised content (Welcome, Name)
  # - The hero carousel cycles through promotional content
  # - The category grid shows at least 8 categories with icons
  # - Four promo banners live below the hero: Free Delivery, Express, Farm Fresh, Best Price
  # - A WhatsApp floating button appears for first-time visitors
  # - The testimonials section provides social proof
  # - The Mobile Bottom Nav shows 5 tabs: Home, Search, Browse, Reorder, Account
  # - New Customer Onboarding shows 5 regional cuisine options

  Scenario: Guest visitor lands on the homepage
    Given the user navigates to "/"
    Then the page returns HTTP 200
    And the page displays a hero section
    And the page displays a category grid
    And the page displays promo banners
    And the page displays the testimonials section
    And the page displays a WhatsApp contact button

  Scenario: Guest visitor sees the new customer onboarding prompt
    Given the user navigates to "/"
    Then the page displays a regional preference prompt
    And the prompt includes South Asian cuisine options

  Scenario: Guest dismisses the regional preference prompt
    Given the user navigates to "/"
    And the regional preference prompt is visible
    When the user dismisses the preference prompt
    Then the prompt disappears
    And the homepage remains fully functional

  Scenario: Guest selects a regional preference
    Given the user navigates to "/"
    And the regional preference prompt is visible
    When the user selects a regional preference
    Then the user is navigated to the store page

  Scenario: Authenticated customer with no orders sees personalised homepage
    Given the user is signed in as a new customer with no orders
    When the user navigates to "/"
    Then the page displays a welcome message with the user's name
    And the page displays the new customer onboarding prompt
    And the page does not display a weekly shop card
    And the header displays the user's name instead of "Account"

  Scenario: Authenticated customer with order history sees tailored homepage
    Given the user is signed in as a returning customer
    When the user navigates to "/"
    Then the page displays a welcome back message
    And the page displays the user's last order date
    And the page displays a Weekly Shop card
    And the page displays a Quick Reorder shelf
    And the page displays a category reminder strip

  Scenario: Desktop header shows Browse mega menu and Account link
    Given the user is on the homepage
    Then the desktop header displays a Browse button
    And the desktop header displays an Account link

  Scenario: Mobile devices show a bottom navigation bar
    Given the user is on a mobile device
    When the user views the homepage
    Then the bottom navigation shows 5 tabs: Home, Search, Browse, Reorder, Account
