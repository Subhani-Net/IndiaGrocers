@W04 @account
Feature: Account Dashboard and Profile Management

  ## Business Rules
  # - The dashboard shows an overview with the user's name, email, and profile completion
  # - Order history lists all orders with status badges
  # - Each order can be expanded to view full details
  # - Addresses can be added, edited, and deleted via modal forms
  # - Profile fields (name, email, phone) can be edited inline
  # - Password can be changed from the profile section
  # - Zero-order users see an empty state with a CTA to start shopping
  # - Orders display order number, date, status, and total

  Scenario: View account overview dashboard
    Given the user is signed in
    When the user navigates to "/account"
    Then the overview displays a welcome message with the user's name
    And the overview displays the user's email
    And the overview displays a profile completion bar
    And the overview displays saved addresses count
    And the overview displays total orders count

  Scenario: View recent orders on the overview
    Given the user is signed in with previous orders
    When the user views the account overview
    Then the overview displays the 5 most recent orders
    And each order shows a status badge

  Scenario: Customer with no orders sees an empty state
    Given the user is signed in with no orders
    When the user views the account overview
    Then the overview displays "No recent orders"
    And the overview displays a "Start Shopping" call-to-action

  Scenario: View full order history
    Given the user is signed in with previous orders
    When the user clicks "Orders" in the account sidebar
    Then a list of order cards is displayed
    And each card shows the order number, date, status, and total

  Scenario: View order details
    Given the user is viewing their order history
    When the user clicks an order card
    Then the full order details are displayed
    And the items in the order are listed
    And the shipping details are displayed
    And the order summary is displayed

  Scenario: No orders shows empty state on orders page
    Given the user is signed in with no orders
    When the user clicks "Orders" in the account sidebar
    Then an empty state message is displayed
    And a "Continue shopping" link is displayed

  Scenario: Add a new address
    Given the user is signed in and viewing "Addresses"
    When the user clicks "Add address"
    Then a modal opens with address fields
    When the user fills in all required fields and saves
    Then the new address appears in the address grid

  Scenario: Edit an existing address
    Given the user has at least one saved address
    When the user clicks "Edit" on an address card
    Then the address fields are populated with current values
    When the user modifies fields and saves
    Then the address is updated

  Scenario: Delete an address
    Given the user has at least one saved address
    When the user clicks "Delete" on an address card
    Then the address is removed from the grid

  Scenario: Edit profile — change name
    Given the user is signed in and viewing "Profile"
    When the user clicks edit on the name field
    And the user enters a new name and saves
    Then the name is updated across the dashboard

  Scenario: Edit profile — change email
    Given the user is signed in and viewing "Profile"
    When the user clicks edit on the email field
    And the user enters a new email and saves
    Then the email is updated

  Scenario: Edit profile — change phone number
    Given the user is signed in and viewing "Profile"
    When the user clicks edit on the phone field
    And the user enters a new phone number and saves
    Then the phone number is updated
