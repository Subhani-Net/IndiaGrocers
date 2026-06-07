@W04 @account @auth
Feature: Account Registration

  ## Business Rules
  # - New customers register with email, password, name, and phone
  # - Password must be 8+ characters with at least 1 letter and 1 number
  # - Password rules show real-time validation as the user types
  # - Duplicate email shows a clear error message
  # - Invalid email format shows a validation error
  # - A verification email is sent on successful registration (G3)
  # - Unverified accounts are gated from the account dashboard
  # - Registration auto-logs the customer in (G2 — revalidatePath ensures dashboard renders)
  # - G1: Email delivery via SendGrid must be configured
  # - G4: Rate limiting on auth endpoints (to be implemented)

  Scenario: Register a new customer account
    Given the user navigates to "/account"
    When the user clicks "Join us"
    Then the registration form is displayed
    And the form includes first name, last name, email, phone, and password fields

  Scenario: Password strength rules show real-time validation
    Given the registration form is shown
    When the user types a short password of less than 8 characters
    Then the "At least 8 characters" rule is not satisfied
    When the user types 8 characters without a letter
    Then the "At least 1 letter" rule is not satisfied
    When the user types 8 characters without a number
    Then the "At least 1 number" rule is not satisfied
    When the user types a valid password meeting all rules
    Then all 3 password rules show as satisfied

  Scenario: Register with valid credentials
    Given the registration form is displayed
    When the user fills in valid registration details
    And the user submits the registration form
    Then the user is redirected to the account dashboard
    And the dashboard displays the user's name and email

  Scenario: Duplicate email registration shows error
    Given an account exists with "test@example.com"
    When the user attempts to register with "test@example.com"
    Then an error message "An account with this email already exists" is displayed

  Scenario: Invalid email format shows validation error
    Given the registration form is displayed
    When the user enters an invalid email format
    And the user submits the registration form
    Then a validation error for email is displayed

  Scenario: Empty required fields show validation errors
    Given the registration form is displayed
    When the user submits the registration form with empty fields
    Then validation errors are displayed for required fields

  @G3 @email-verify
  Scenario: Verification email is sent on successful registration
    Given the user has registered with a valid email
    Then a verification email is sent to the registered email address

  @G3 @email-verify
  Scenario: Unverified account is gated from the dashboard
    Given the user has registered but not verified their email
    When the user navigates to "/account"
    Then the user is redirected to a verification prompt
    And a message to check email for the verification link is displayed

  @G3 @email-verify
  Scenario: Verified account can access the dashboard
    Given the user has verified their email
    When the user navigates to "/account"
    Then the account dashboard is displayed
