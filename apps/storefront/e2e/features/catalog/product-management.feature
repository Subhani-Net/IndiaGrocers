@W01 @W02 @admin @catalog @product-management @rebuild
Feature: Product Management — Add, Update, Delete & Rebuild

  ## Business Rules
  # - The CSV catalogue (products.csv + categories.csv) is the single source of truth
  # - Products are NEVER edited in the Medusa Admin UI — all changes flow through the CSV pipeline
  # - seed-catalogue.mjs enforces pre-flight validation before any API call
  # - --validate-only checks all rows for category mismatches, bad brand slugs, column shifts
  # - --dry-run shows what would change without making API calls
  # - --apply syncs all changes to Medusa DB (idempotent — safe to re-run)
  # - --reindex triggers MeiliSearch reindex after apply
  # - Each variant row gets a unique barcode (real EAN-13 or GEN_{handle}_{weight} placeholder)
  # - Variants are auto-grouped by base title + brand + category (e.g., 500g + 1kg → one product)
  # - Category handles are validated against categories.csv before any product sync
  # - The publishable API key is auto-synced to the storefront .env after each apply
  # - The entire catalogue can be rebuilt from scratch using only the CSV files + Medusa starter

  Scenario: Validate catalogue CSVs before any sync
    Given the CSV catalogue exists with products.csv and categories.csv
    When the admin runs seed-catalogue with --validate-only
    Then all 43 categories pass parent-child integrity checks
    And all 680 product rows pass category_handle validation
    And all product rows pass required field checks
    And no API calls are made to the backend
    And the script exits with zero errors

  Scenario: Dry-run shows proposed variant groupings
    Given the CSV catalogue exists with 680 product rows
    When the admin runs seed-catalogue with --dry-run
    Then the script reports 485 product groups
    And 123 groups are multi-variant (grouped by weight)
    And 362 groups are single-variant
    And the total variant row count remains 680
    And no API calls are made to the backend

  Scenario: Adding a new product to the catalogue
    Given the CSV catalogue is valid
    And a new product row is added to products.csv
      | handle | variant_sku | brand | product_title | category_handle | weight_value | weight_unit |
      | new-brand-test-product-500g | new-brand-test-500g | new-brand | New Brand - Test Product 500g | pickles | 500 | g |
    When the admin runs seed-catalogue with --apply
    Then the new product is created in the database
    And the product has the correct handle "new-brand-test-product"
    And the variant has barcode "GEN_new-brand-test-product_500g"
    And the variant barcode is written back to products.csv
    And the product is linked to the default sales channel
    And inventory levels are set for all variants

  Scenario: Updating an existing product's title
    Given a product exists in the database with handle "trs-toor-dal-oily"
    And the product title is changed in products.csv from "TRS - Toor Dal Oily" to "TRS - Toor Dal Oily (Premium)"
    When the admin runs seed-catalogue with --apply
    Then the product title is updated in the database
    And other unchanged fields are not modified
    And the script reports 0 creates and at least 1 update

  Scenario: Updating a product's price via prices.csv
    Given a product variant exists with SKU "trs-toor-dal-oily-1kg"
    And the variant price is 299 pence in the database
    When the price is changed to 349 pence in prices.csv
    And the admin runs seed-catalogue with --apply
    Then the variant price is updated to 349 pence
    And the storefront displays "£3.49" for that variant

  Scenario: Adding a new variant weight to an existing multi-variant product
    Given a product "TRS - Garam Masala" exists with 6 weight variants (100g, 200g, 400g, 500g, 1kg, 5kg)
    And a new row is added to products.csv for weight "250g"
    When the admin runs seed-catalogue with --apply
    Then the product now has 7 weight variants including "250g"
    And the new variant gets a unique barcode "GEN_trs-garam-masala_250g"

  Scenario: Replacing a generated barcode with a real EAN-13
    Given a product variant has generated barcode "GEN_trs-garam-masala_100g"
    When the barcode is replaced with real EAN-13 "8901234567890" in products.csv
    And the admin runs seed-catalogue with --apply
    Then the variant metadata.barcode is updated to "8901234567890"
    And the generated prefix "GEN_" is no longer present in that variant
    And the script writes the real barcode back to products.csv

  Scenario: Deleting a product by removing it from the CSV
    Given a product with handle "test-delete-product" exists in the database
    When all rows for that handle are removed from products.csv
    And the admin runs seed-catalogue with --apply
    Then the product is NOT deleted from the database
    And a warning is logged that the handle exists in DB but not in CSV
    And the admin must delete the product manually via Admin API

  Scenario: Category handle mismatch is caught by pre-flight validation
    Given the CSV catalogue contains a product with category_handle "nonexistent_category"
    When the admin runs seed-catalogue with --validate-only
    Then the script reports exactly 1 validation error
    And the error message includes "not found in categories.csv"
    And the error message includes the product title
    And the error message suggests similar category handles
    And the script exits with code 1 before making any API calls

  Scenario: Brand slug is auto-detected when set to "0"
    Given a product row has brand_slug "0"
    And the product title is "TRS - Cumin Seeds 400g"
    When the admin runs seed-catalogue with --validate-only
    Then the validation error shows the auto-detected brand "trs"
    And the error message guides the admin to fix the brand_slug column

  Scenario: Column-shifted data is detected during validation
    Given a product row has weight_unit "/uploads/some-image.jpg" instead of a valid unit
    When the admin runs seed-catalogue with --validate-only
    Then the validation error identifies the row as column-shifted
    And the error message explains the expected weight_value/weight_unit format

  Scenario: Duplicate variant rows are detected
    Given products.csv has two rows with the same handle AND same weight
    When the admin runs seed-catalogue with --validate-only
    Then the validation errors include the duplicate detection
    And the error identifies both row numbers

  Scenario: Rebuild the entire catalogue from scratch
    Given the Medusa database is empty (fresh install)
    And the publishable API key is generated by the Medusa starter
    When the admin runs seed-catalogue with --apply --reindex
    Then all 43 categories are created in parent-first order
    And all 485 product groups are created with variants
    And all 680 variant rows have barcodes assigned
    And the MeiliSearch index contains exactly 485 documents
    And the publishable API key is auto-synced to the storefront .env
    And the data-health verification script reports 0 failures

  Scenario: Re-run enrichment is idempotent
    Given all products are already synced to the database
    When the admin runs seed-catalogue with --apply --reindex a second time
    Then 0 products are created (all already exist)
    And 0 products fail to sync
    And all products are skipped or have minor metadata updates applied
    And the script completes without errors

  Scenario: Verify storefront renders after catalogue rebuild
    Given the catalogue has been rebuilt from scratch
    And the backend is running on port 9000
    When the storefront loads the homepage at "/gb"
    Then the page returns HTTP 200
    And the navigation bar shows all parent categories
    And at least one product is visible in the featured products rail
    And category pages render product cards with weight chips for multi-variant products
    And the search index returns results for "basmati rice"
