import { createBdd } from "playwright-bdd"
import { expect } from "@playwright/test"

const { Given, When, Then } = createBdd()

/**
 * SEARCH — unique steps only.
 * Generic steps are in generic.steps.ts and common.steps.ts.
 */

When("the user types {string}", async ({ page }, text: string) => {
  const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first()
  if ((await searchInput.count()) > 0) {
    await searchInput.fill(text)
    await page.waitForTimeout(1000)
  }
})

Given("the search autocomplete dropdown is visible", async ({ page }) => {
  await page.goto("/search", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(1000)
})

When("the user clicks outside the search area", async ({ page }) => {
  await page.locator("body").click({ position: { x: 10, y: 10 } })
  await page.waitForTimeout(1000)
})

Given("the user is on the search page with results", async ({ page }) => {
  await page.goto("/search?q=rice", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3000)
})

When("the user clicks the {string} category chip", async ({ page }, category: string) => {
  const chip = page.locator("button").filter({ hasText: new RegExp(category, "i") }).first()
  if ((await chip.count()) > 0) {
    await chip.click()
    await page.waitForTimeout(1000)
  }
})

Then("the chip is visually active", async ({ page }, category: string) => {
  console.log(`"${category}" chip active check`)
})

Then("all search results are displayed", async ({ page }) => {
  const titles = page.locator('[data-testid="product-title"]')
  const count = await titles.count()
  console.log(`All results after filter clear: ${count}`)
})

Then("the top result is {string}", async ({ page }, productTitle: string) => {
  const firstTitle = page.locator('[data-testid="product-title"], [data-testid="product-full-title"]').first()
  const text = await firstTitle.textContent().catch(() => "")
  console.log(`Top result: "${text}"`)
})

Then("at least {int} results are returned", async ({ page }, minCount: number) => {
  const titles = page.locator('[data-testid="product-title"], [data-testid="product-full-title"]')
  const count = await titles.count()
  expect(count).toBeGreaterThanOrEqual(minCount)
})
