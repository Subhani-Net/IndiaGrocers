@W04 @account @auth
Feature: Account Sign In and Password Reset

  ## Business Rules
  # - Existing customers sign in with email and password
  # - Successful sign-in redirects to the account dashboard (G2 — no manual refresh)
  # - Invalid credentials show an error message
  # - Forgot password flow sends a reset code via email (G1)
  # - Reset code can be entered with a new password to regain access
  # - Password reset enforces the same strength rules as registration
  # - Password mismatch shows a specific error
  # - Sign-out clears the cart and redirects to the login page
  # - G7: JWT and cookie secrets must come from environment variables

  Scenario: Sign in with valid credentials
    Given the user navigates to "/account"
    When the user enters valid email and password
    And the user clicks "Sign in"
    Then the user is redirected to the account dashboard
    And the dashboard displays the user's name

  Scenario: Sign in with invalid credentials shows error
    Given the user navigates to "/account"
    When the user enters an incorrect email or password
    And the user clicks "Sign in"
    Then an error message is displayed

  Scenario: Sign in with empty fields shows validation
    Given the user navigates to "/account"
    When the user clicks "Sign in" with empty fields
    Then browser validation indicates required fields

  Scenario: Sign in transitions to dashboard without manual refresh
    Given the user has valid credentials
    When the user signs in successfully
    Then the dashboard is displayed without requiring a manual page refresh

  Scenario: Forgot password — request a reset code
    Given the user navigates to "/account"
    When the user clicks "Forgot your password?"
    Then the password reset form is displayed
    When the user enters their email
    And the user clicks "Send Reset Code"
    Then a confirmation message "Check Your Email" is displayed
    And the email field is pre-filled

  Scenario: Reset password with a valid code
    Given the user has received a reset code via email
    When the user enters the reset code on the reset form
    And the user enters a new password meeting all rules
    And the user confirms the new password
    And the user clicks "Reset Password"
    Then a "Password Updated" confirmation is displayed
    And the user can sign in with the new password

  Scenario: Reset password with mismatched passwords shows error
    Given the user is on the reset password form
    When the user enters different passwords in "New Password" and "Confirm Password"
    And the user clicks "Reset Password"
    Then an error "Passwords do not match" is displayed

  Scenario: Reset password with a weak password shows validation
    Given the user is on the reset password form
    When the user enters a password shorter than 8 characters
    And the user clicks "Reset Password"
    Then a password strength error is displayed

  Scenario: Sign out clears session and redirects to login
    Given the user is signed in
    When the user clicks "Log out"
    Then the user is redirected to "/account"
    And the sign-in form is displayed
    And the basket is cleared

  Scenario: Protected account pages redirect unauthenticated users
    Given the user is not signed in
    When the user navigates to "/account/orders"
    Then the user is redirected to "/account"
