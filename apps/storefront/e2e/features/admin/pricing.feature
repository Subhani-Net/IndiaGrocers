@W07 @admin @pricing
Feature: Admin Price Management

  ## Business Rules
  # - Product prices are loaded from JSON or CSV pricelist files
  # - Products are matched by title, handle, or SKU
  # - Prices are stored in pence (GBP minor unit) in the database
  # - Prices are displayed in pounds on the storefront (divided by 100)
  # - Dry-run mode reports changes without applying them
  # - Apply mode updates variant prices via the Admin API
  # - Products not found in the pricelist are reported
  # - Products already at the target price are skipped
  # - G12: Real prices must be loaded before go-live

  Scenario: Dry-run a pricelist against the product database
    Given the admin runs the pricelist loader in dry-run mode
    Then all 506 products are fetched from the database
    And the pricelist entries are matched to products by title
    And a report is generated showing which products would be updated
    And no prices are actually changed

  Scenario: Apply a pricelist to update product prices
    Given the admin runs the pricelist loader in apply mode
    Then matched product prices are updated to the pricelist values
    And a summary is shown with counts of updated, skipped, and not-found products

  Scenario: Products not in the pricelist are unaffected
    Given the admin applies a pricelist to specific products
    Then products not listed in the pricelist retain their current prices

  Scenario: Verify an updated price on the storefront
    Given the admin has updated a product price via the pricelist
    And the search index has been reindexed
    When the user views the product detail page
    Then the displayed price matches the updated pricelist value

  Scenario: Price is displayed correctly in pounds on the storefront
    Given a product has a price of 199 pence in the database
    When the user views the product
    Then the displayed price is "£1.99"
