@W08 @admin @consolidation
Feature: Admin Order Consolidation

  ## Business Rules
  # - Orders can be consolidated into a wholesale master purchase list by target date
  # - Consolidation aggregates product_id → SUM(quantity) across all orders for the target date
  # - Response includes the target date, orders found count, consolidated items, and summary
  # - CSV export provides a downloadable format: product_title, SKU, quantity, category
  # - Invalid target_date returns HTTP 400
  # - Missing target_date returns HTTP 400
  # - Unauthenticated requests return HTTP 401
  # - A cron job runs daily at midnight for headless consolidation (F2.1.2)
  # - F2.2.2: PDF export for printable picking sheets is planned

  Scenario: Consolidate orders for a specific target date
    Given the admin is authenticated
    When the admin sends a consolidation request for "2026-06-01"
    Then the response includes the target date
    And the response includes the count of orders found
    And the response includes consolidated items
    And the response includes a summary

  Scenario: Consolidation with no orders returns an empty result
    Given the admin is authenticated
    When the admin sends a consolidation request for a date with no orders
    Then the consolidated items list is empty
    And the orders_found count is zero

  Scenario: Invalid target date returns an error
    Given the admin is authenticated
    When the admin sends a consolidation request with an invalid date
    Then the response status is 400

  Scenario: Missing target date returns an error
    Given the admin is authenticated
    When the admin sends a consolidation request without a target date
    Then the response status is 400

  Scenario: Unauthenticated request is rejected
    Given the admin is not authenticated
    When the admin sends a consolidation request
    Then the response status is 401

  Scenario: CSV export format contains required columns
    Given the admin is authenticated
    When the admin sends a consolidation request with CSV format
    Then the response contains comma-separated values
    And the columns include product title, SKU, quantity, and category
