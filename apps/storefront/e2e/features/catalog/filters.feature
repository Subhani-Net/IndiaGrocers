@W01 @filters @mobile
Feature: Mobile Filter — Slide-Out Drawer with Accordion

  ## Business Rules
  # - Mobile filter panel slides in from the left as a full-height drawer (85vw, max 400px)
  # - Drawer has a sticky close (✕) button at the top, always visible
  # - Filter sections are collapsible accordion items (Radix Accordion) — collapsed by default on mobile
  # - Tapping an accordion header expands the section downward without breaking drawer scroll
  # - Filter selections persist when the drawer is closed and reopened
  # - ESC key or backdrop click dismisses the drawer with a slide-out animation
  # - Body scroll is locked while the drawer is open
  # - Desktop filter sidebar (left <aside>) is completely unaffected by mobile filter changes
  # - The component is portaled to document.body for proper z-index stacking
  # - Architecture: MobileFilterDrawer + FilterAccordion (Radix) + compact FilterPanel

  @smoke
  Scenario: Filter button opens the mobile filter drawer
    Given the user is on a mobile device
    And the user is on a category page with filters available
    When the user taps the "Filter" button
    Then a filter drawer slides in from the left side of the screen
    And a sticky close button is visible at the top

  Scenario: Close button dismisses the filter drawer
    Given the mobile filter drawer is open
    When the user taps the close button in the drawer header
    Then the filter drawer slides out to the left
    And the drawer is no longer visible

  Scenario: Backdrop tap dismisses the filter drawer
    Given the mobile filter drawer is open
    When the user taps the backdrop outside the drawer
    Then the filter drawer slides out to the left

  Scenario: ESC key dismisses the filter drawer
    Given the mobile filter drawer is open
    When the user presses the Escape key
    Then the filter drawer closes

  Scenario: Filter sections are displayed as collapsible accordion items
    Given the mobile filter drawer is open
    Then the filter sections are displayed as accordion items
    And tapping a section header expands its content
    And the section content does not overflow the drawer

  Scenario: Filter selections persist after closing and reopening the drawer
    Given the mobile filter drawer is open
    When the user selects the "Vegetarian" dietary filter
    And the user closes the drawer
    And the user reopens the filter drawer
    Then the "Vegetarian" filter is still selected

  Scenario: Body scroll is locked while the drawer is open
    Given the mobile filter drawer is open
    Then the page body scroll is locked

  Scenario: Body scroll is restored when the drawer closes
    Given the mobile filter drawer is open
    When the user closes the drawer
    Then the page body scroll is restored

  Scenario: "Clear all" removes all active filters
    Given the mobile filter drawer is open
    And the user has applied a brand filter and a dietary filter
    When the user taps the "Clear all" button
    Then all active filter chips are removed

  Scenario: Desktop filter sidebar remains unchanged
    Given the user is on a desktop viewport
    And the user is on a category page
    Then the filter panel is displayed in a left sidebar
    And the sidebar is always visible without a toggle button
