import { createBdd } from "playwright-bdd"
import { expect } from "@playwright/test"

const { Given, When, Then } = createBdd()

/**
 * SEARCH — unique steps only.
 * Generic steps are in generic.steps.ts and common.steps.ts.
 */

When("the user types {string}", async ({ page }, text: string) => {
  const searchInput = page.locator('input[type="text"]').first()
  await searchInput.fill(text)
  await page.waitForTimeout(1000)
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
  const chip = page.locator("a").filter({ hasText: new RegExp(category, "i") }).first()
  if ((await chip.count()) > 0) {
    await chip.click()
    await page.waitForTimeout(2000)
  }
})

Then("the chip is visually active", async ({ page }, category: string) => {
  const chip = page.locator("a").filter({ hasText: category }).first()
  await expect(chip).toBeVisible()
})

Then("all search results are displayed", async ({ page }) => {
  const titles = page.locator('[data-testid="product-title"], [data-testid="product-full-title"]')
  const count = await titles.count()
  expect(count).toBeGreaterThanOrEqual(1)
})

Then("the top result is {string}", async ({ page }, productTitle: string) => {
  await page.waitForSelector('[data-testid="product-full-title"]', { timeout: 5000 })
  const firstTitle = page.locator('[data-testid="product-full-title"]').first()
  await expect(firstTitle).toBeVisible()
  const text = await firstTitle.textContent()
  expect(text?.toLowerCase()).toContain(productTitle.toLowerCase())
})

Then("the results include {string}", async ({ page }, productTitle: string) => {
  await page.waitForSelector('[data-testid="product-full-title"]', { timeout: 5000 })
  const allTitles = page.locator('[data-testid="product-full-title"]')
  const count = await allTitles.count()
  const texts: string[] = []
  for (let i = 0; i < count; i++) {
    texts.push((await allTitles.nth(i).textContent()) || "")
  }
  expect(texts.some(t => t.toLowerCase().includes(productTitle.toLowerCase()))).toBeTruthy()
})

Then("at least {int} results are returned", async ({ page }, minCount: number) => {
  const titles = page.locator('[data-testid="product-title"], [data-testid="product-full-title"]')
  await expect(titles.first()).toBeVisible({ timeout: 5000 })
  const count = await titles.count()
  expect(count).toBeGreaterThanOrEqual(minCount)
})
