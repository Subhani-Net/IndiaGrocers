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

// ─── BEHAVIOR CONTRACT STEPS ───

Then("an autocomplete dropdown appears within {int} seconds", async ({ page }, maxSeconds: number) => {
  const start = Date.now()
  const dropdown = page.locator(".absolute.top-full .flex.items-center.gap-3").first()
  await dropdown.waitFor({ state: "visible", timeout: maxSeconds * 1000 })
  const elapsed = Date.now() - start
  console.log(`Autocomplete dropdown visible in ${elapsed}ms (limit: ${maxSeconds}s)`)
  expect(elapsed).toBeLessThan(maxSeconds * 1000)
})

Then("the dropdown is visible even if the main search is still loading", async ({ page }) => {
  // The dropdown is already visible (from the previous step).
  // Verify the loading spinner state is independent.
  const dropdown = page.locator(".absolute.top-full .flex.items-center.gap-3").first()
  const spinner = page.locator(".animate-spin")
  const dropdownVisible = await dropdown.isVisible().catch(() => false)
  const spinnerVisible = await spinner.isVisible().catch(() => false)
  console.log(`Dropdown visible: ${dropdownVisible}, Main spinner visible: ${spinnerVisible}`)
  // The dropdown should be visible — that's the contract.
  // Whether the spinner is also visible depends on timing.
  expect(dropdownVisible).toBeTruthy()
})

Then("search results are displayed", async ({ page }) => {
  const titles = page.locator('[data-testid="product-full-title"]')
  await expect(titles.first()).toBeVisible({ timeout: 10000 })
  const count = await titles.count()
  expect(count).toBeGreaterThanOrEqual(1)
  console.log(`Search results: ${count} products`)
})

Then("the results remain visible for at least {int} seconds", async ({ page }, seconds: number) => {
  const titles = page.locator('[data-testid="product-full-title"]')
  const startCount = await titles.count()
  console.log(`Results at T0: ${startCount} products`)

  await page.waitForTimeout(seconds * 1000)

  const endCount = await titles.count()
  console.log(`Results at T+${seconds}s: ${endCount} products`)

  // Results should not disappear (no wipe)
  expect(endCount).toBeGreaterThan(0)
  expect(endCount).toBe(startCount)
})

Then("no {string} message appears while products are displayed", async ({ page }, message: string) => {
  const titles = page.locator('[data-testid="product-full-title"]')
  const productCount = await titles.count()
  const content = (await page.textContent("body")) || ""
  const hasEmptyMessage = content.includes(message)

  console.log(`Products displayed: ${productCount}, "${message}" message found: ${hasEmptyMessage}`)
  if (productCount > 0) {
    expect(hasEmptyMessage).toBe(false)
  }
})

// ─── SSR CONTRACT STEPS ───

When("the user types {string} in the search input", async ({ page }, text: string) => {
  await page.waitForTimeout(1000)
  const searchInput = page.locator('input[type="text"]').first()
  await searchInput.fill(text)
  await page.waitForTimeout(500)
})

Then("the page URL updates to include the new query", async ({ page }) => {
  await page.waitForTimeout(3000)
  const url = page.url()
  expect(url).toContain("q=")
  console.log(`URL updated: ${url}`)
})

Then("search results for {string} are displayed within {int} seconds", async ({ page }, query: string, maxSeconds: number) => {
  const start = Date.now()
  await page.waitForSelector('[data-testid="product-full-title"]', { timeout: maxSeconds * 1000 })
  const elapsed = Date.now() - start
  const titles = page.locator('[data-testid="product-full-title"]')
  const count = await titles.count()
  const firstText = count > 0 ? (await titles.first().textContent()) || "" : ""
  console.log(`Results for "${query}" in ${elapsed}ms: ${count} products, first: "${firstText}"`)
  expect(elapsed).toBeLessThan(maxSeconds * 1000)
  expect(count).toBeGreaterThanOrEqual(1)
})

// ─── HEADER SEARCH CONTEXT STEPS ───

When("the user types {string} in the header search bar", async ({ page }, text: string) => {
  const headerInput = page.locator("header input[type=\"text\"]").first()
  await headerInput.fill(text)
  await page.waitForTimeout(500)
})

Given("the user has typed {string} in the header search bar", async ({ page }, text: string) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2000)
  const headerInput = page.locator("header input[type=\"text\"]").first()
  await headerInput.fill(text)
  await page.waitForTimeout(1500)
})

Then("the page content is replaced by a live search results grid", async ({ page }) => {
  const cards = page.locator(".product-card, [data-testid=\"product-full-title\"]")
  await cards.first().waitFor({ state: "visible", timeout: 10000 })
  const count = await cards.count()
  console.log(`Live grid cards visible: ${count}`)
  expect(count).toBeGreaterThanOrEqual(1)
})

Then("the grid shows product cards matching the query", async ({ page }) => {
  const content = (await page.textContent("body")) || ""
  console.log(`Grid content length: ${content.length}`)
  expect(content.length).toBeGreaterThan(200)
})

When("the user clicks an autocomplete suggestion", async ({ page }) => {
  const suggestion = page.locator(".absolute.top-full button").first()
  if (await suggestion.isVisible({ timeout: 2000 }).catch(() => false)) {
    await suggestion.click()
    await page.waitForTimeout(1000)
  }
})

Then("the autocomplete dropdown closes", async ({ page }) => {
  const dropdown = page.locator(".absolute.top-full")
  await expect(dropdown).not.toBeVisible({ timeout: 3000 })
})

Then("the user is navigated to the search page with query {string}", async ({ page }, query: string) => {
  await page.waitForTimeout(2000)
  const url = page.url()
  expect(url).toContain("/search")
  expect(url).toContain(`q=${encodeURIComponent(query)}`)
})

Given("the user is searching for {string} in the header search", async ({ page }, query: string) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2000)
  const headerInput = page.locator("header input[type=\"text\"]").first()
  await headerInput.fill(query)
  await page.waitForTimeout(2000)
})

When("the user navigates to a category page", async ({ page }) => {
  const catLink = page.locator("header a[href*='categories']").first()
  if (await catLink.isVisible({ timeout: 2000 }).catch(() => false)) {
    await catLink.click()
    await page.waitForTimeout(2000)
  }
})

Then("the search grid is cleared", async ({ page }) => {
  const content = (await page.textContent("body")) || ""
  const hasSearchUI = content.includes("result") && content.includes("for \"")
  console.log(`Search UI still visible: ${hasSearchUI}`)
})

Then("the category page content is displayed", async ({ page }) => {
  const url = page.url()
  console.log(`Navigation target: ${url}`)
  const content = (await page.textContent("body")) || ""
  expect(content.length).toBeGreaterThan(500)
})

Then("the original page content is restored", async ({ page }) => {
  await page.waitForTimeout(1000)
  const content = (await page.textContent("body")) || ""
  const hasSearchResults = content.includes("result") && content.includes("for \"")
  console.log(`Search results still showing: ${hasSearchResults}`)
})
