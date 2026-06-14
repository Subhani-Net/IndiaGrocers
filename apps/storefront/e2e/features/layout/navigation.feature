@navigation @layout @smoke @W01 @W07
Feature: Navigation System — Desktop & Mobile

  ## Business Rules
  # - Desktop header: single row (Logo, All Groceries button, Search, Account, Cart)
  # - Mobile header: 2-row sticky (Row1: hamburger/logo/account+cart, Row2: search)
  # - All Groceries panel: click-to-toggle, shows ALL L1 categories in a grid with "All [Category]" shortcuts
  # - Every L1 category has an injected "All [Category]" virtual L2 child linking to the parent category page
  # - Panel dismisses on ESC key, backdrop click, or category link click
  # - Mobile cart: plain link to /cart (no Popover dropdown) showing live item count badge
  # - Mobile menu: drill-down drawer with L1 → L2 → "All [Category]" banner → L2 subcategories
  # - Header uses position: sticky; top: 0; z-index: 50
  # - Data flow: categories fetched via /store/product-categories with 3-level expansion
  # - System Rebuild Contracts: see Documentation/navigation-system.md

  # ─────────────────────────────────────────────
  # DESKTOP — SINGLE-ROW HEADER STRUCTURE
  # ─────────────────────────────────────────────

  @desktop
  Scenario: Desktop header displays all 5 core elements in correct order
    Given the user is on the homepage
    Then the desktop header displays the logo "IndiaGrocers"
    And the desktop header displays an "All Groceries" button
    And the desktop header displays a search input
    And the desktop header displays an account link
    And the desktop header displays a cart button

  @desktop
  Scenario: Desktop header is a single horizontal row
    Given the user is on the homepage
    Then the header layout is a single row with all elements inline on lg screens

  @desktop
  Scenario: Desktop header is sticky during scroll
    Given the user is on the homepage
    When the user scrolls the page down by 500px
    Then the header is still visible at the top of the viewport

  # ─────────────────────────────────────────────
  # DESKTOP — ALL GROCERIES PANEL
  # ─────────────────────────────────────────────

  @desktop
  Scenario: "All Groceries" button toggles the unified grid panel on click
    Given the user is on the homepage
    When the user clicks the "All Groceries" button
    Then a full-width category grid panel appears below the header
    And a dark translucent backdrop covers the page content

  @desktop
  Scenario: All Groceries panel shows every L1 category with "All [Category]" shortcut
    Given the "All Groceries" panel is open
    Then every L1 category name is visible in the panel as a bold header
    And every L1 block has an "All [Category]" link in brand orange

  @desktop
  Scenario: All Groceries panel dismisses on backdrop click
    Given the "All Groceries" panel is open
    When the user clicks the backdrop overlay
    Then the All Groceries panel closes
    And the page content is no longer dimmed

  @desktop
  Scenario: All Groceries panel dismisses on ESC key
    Given the "All Groceries" panel is open
    When the user presses the Escape key
    Then the All Groceries panel closes

  @desktop
  Scenario: Clicking a category link in the panel navigates away
    Given the "All Groceries" panel is open
    When the user clicks "All Rice" in the panel
    Then the user is navigated to a category page
    And the panel is closed

  # ─────────────────────────────────────────────
  # MOBILE — 2-ROW STICKY HEADER
  # ─────────────────────────────────────────────

  @mobile
  Scenario: Mobile header shows hamburger, centered logo, and account+cart in row 1
    Given the user is on a mobile device
    And the user is on the homepage
    Then the mobile header displays a hamburger menu button on the left
    And the brand logo is centered in the header
    And the mobile header displays account and cart icons on the right

  @mobile
  Scenario: Mobile header shows full-width search in row 2
    Given the user is on a mobile device
    And the user is on the homepage
    Then the mobile header displays a full-width search input below row 1

  @mobile
  Scenario: Mobile header is sticky during scroll
    Given the user is on a mobile device viewing the homepage
    When the user scrolls the page down by 300px
    Then the mobile header is still visible at the top with both rows

  @mobile
  Scenario: Mobile cart link navigates to cart page
    Given the user is on a mobile device
    And the user is on the homepage
    When the user clicks the mobile cart link
    Then the user is navigated to the cart page

  @mobile
  Scenario: Mobile cart badge shows live item count
    Given the user has added items to the cart
    When the user views the homepage on mobile
    Then the mobile cart icon shows the correct item count badge

  # ─────────────────────────────────────────────
  # MOBILE — DRILL-DOWN DRAWER
  # ─────────────────────────────────────────────

  @mobile
  Scenario: Hamburger opens the mobile drawer
    Given the user is on a mobile device
    When the user taps the hamburger icon
    Then a slide-in drawer appears from the left covering 85% of the screen
    And the drawer shows Home, Store, Account, and Cart links
    And the drawer lists all L1 categories with chevron arrows

  @mobile
  Scenario: Tapping an L1 category navigates to L2 view with "All [Category]" banner
    Given the user is on a mobile device with the drawer open
    When the user taps the first L1 category
    Then the drawer slides forward to show subcategories
    And an "All [Category]" banner link appears at the top
    And a divider separates the banner from real L2 subcategories
    And a "Back" button is visible in the header

  @mobile
  Scenario: "Back" button returns to main menu
    Given the user is on a mobile device viewing L2 subcategories in the drawer
    When the user taps the "Back" button
    Then the drawer slides back to the main menu
    And the L1 category list is shown again

  @mobile
  Scenario: Mobile drawer closes on backdrop tap
    Given the user is on a mobile device with the drawer open
    When the user taps the backdrop outside the drawer
    Then the drawer slides out and closes

  # ─────────────────────────────────────────────
  # MOBILE MENU — PRESERVED FALLBACK (feature flag)
  # ─────────────────────────────────────────────

  @mobile
  Scenario: Legacy side menu remains functional when feature flag is off
    Given the feature flag USE_NEW_MOBILE_MENU is false
    And the user is on a mobile device
    When the user taps the hamburger icon
    Then the side menu slides in

  # ─────────────────────────────────────────────
  # HEADER SEARCH — LIVE GRID + NAVIGATION CLEANUP
  # ─────────────────────────────────────────────

  @desktop
  Scenario: Header search input focuses and accepts keystrokes
    Given the user is on the homepage
    When the user focuses the header search input
    Then the search input accepts text entry
    And the search context is activated

  @desktop
  Scenario: Typing in header search shows autocomplete dropdown
    Given the user is on the homepage
    When the user types "basmati" in the header search bar
    Then an autocomplete dropdown appears within 3 seconds
    And each suggestion shows a thumbnail and title

  @desktop
  Scenario: Autocomplete keyboard navigation with Arrow keys
    Given the user is on the homepage
    And the user has typed "rice" in the header search bar
    When the user presses ArrowDown in the search input
    Then the first autocomplete suggestion is highlighted

  Scenario: Search mode clears when navigating to a different page
    Given the user is searching for "basmati" in the header search
    When the user navigates to a category page
    Then the search results are no longer displayed
    And the category page renders normally
