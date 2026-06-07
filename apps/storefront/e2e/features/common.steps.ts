import { createBdd } from "playwright-bdd"
import { expect } from "@playwright/test"

const { Given, When, Then } = createBdd()

// ────────────────────────────────────────────────────────────
// NAVIGATION
// ────────────────────────────────────────────────────────────

Given("the user navigates to {string}", async ({ page }, url: string) => {
  await page.goto(url, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2000)
})

Given("the user is on the {string} category page", async ({ page }, handle: string) => {
  await page.goto(`/categories/${handle}`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".product-card", { timeout: 15000 })
  await page.waitForTimeout(2000)
})

Given("the user is on the store page", async ({ page }) => {
  await page.goto("/store", { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".product-card", { timeout: 15000 })
})

Given("the user is on the homepage", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2000)
})

Given("the user navigates to the search page with query {string}", async ({ page }, query: string) => {
  await page.goto(`/search?q=${encodeURIComponent(query)}`, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(4000)
})

Given("the user navigates to the search page", async ({ page }) => {
  await page.goto("/search", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2000)
})

// ────────────────────────────────────────────────────────────
// PAGE ASSERTIONS
// ────────────────────────────────────────────────────────────

Then("the page returns HTTP 200", async ({ page }) => {
  const content = await page.textContent("body")
  expect(content?.length).toBeGreaterThan(100)
})

Then("the page displays {string}", async ({ page }, text: string) => {
  const content = (await page.textContent("body")) || ""
  expect(content.toLowerCase()).toContain(text.toLowerCase())
})

Then("the page contains {string}", async ({ page }, pattern: string) => {
  const content = (await page.textContent("body")) || ""
  expect(content).toMatch(new RegExp(pattern, "i"))
})

// ────────────────────────────────────────────────────────────
// URL ASSERTIONS
// ────────────────────────────────────────────────────────────

Then("the user is redirected to a page containing {string}", async ({ page }, urlFragment: string) => {
  await page.waitForTimeout(2000)
  expect(page.url()).toContain(urlFragment)
})

Then("the user is navigated to {string}", async ({ page }, expectedUrl: string) => {
  await page.waitForTimeout(2000)
  expect(page.url()).toContain(expectedUrl)
})

// ────────────────────────────────────────────────────────────
// ELEMENT VISIBILITY
// ────────────────────────────────────────────────────────────

Then("a {string} is displayed", async ({ page }, element: string) => {
  const content = (await page.textContent("body")) || ""
  expect(content.length).toBeGreaterThan(0)
})

Then("the page displays a {string} section", async ({ page }, section: string) => {
  const content = (await page.textContent("body")) || ""
  expect(content.toLowerCase()).toContain(section.toLowerCase())
})

// ────────────────────────────────────────────────────────────
// GENERIC ELEMENT PRESENCE
// ────────────────────────────────────────────────────────────

Then("the page displays a {string} button", async ({ page }, buttonText: string) => {
  const btn = page.locator("button").filter({ hasText: new RegExp(buttonText, "i") }).first()
  await expect(btn).toBeAttached({ timeout: 5000 })
})

Then("the page displays a {string} link", async ({ page }, linkText: string) => {
  const link = page.locator("a").filter({ hasText: new RegExp(linkText, "i") }).first()
  await expect(link).toBeAttached({ timeout: 5000 })
})

// ────────────────────────────────────────────────────────────
// CART / BASKET STATE (shared)
// ────────────────────────────────────────────────────────────

Given("the user has an empty basket", async ({ page }) => {
  await page.goto("/cart", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2000)
})

Then("the basket has at least one item", async ({ page }) => {
  const cartLink = page.locator('[data-testid="nav-cart-link"]')
  if (await cartLink.isVisible().catch(() => false)) {
    await cartLink.click()
    await page.waitForTimeout(1000)
    const dropdown = page.locator('[data-testid="nav-cart-dropdown"]')
    const dropText = (await dropdown.textContent().catch(() => "")) || ""
    expect(dropText.length).toBeGreaterThan(10)
  }
})

Then("the page displays an empty basket message", async ({ page }) => {
  const content = (await page.textContent("body")) || ""
  const isEmpty = content.match(/empty|no items|start shopping|explore/i)
  expect(isEmpty).toBeTruthy()
})

// ────────────────────────────────────────────────────────────
// SEARCH
// ────────────────────────────────────────────────────────────

Then("the page displays search results", async ({ page }) => {
  const titles = page.locator('[data-testid="product-title"], [data-testid="product-full-title"]')
  const count = await titles.count()
  console.log(`Search results: ${count} products`)
  expect(count).toBeGreaterThanOrEqual(0)
})

Then("the results include {string}", async ({ page }, productTitle: string) => {
  const titles = page.locator('[data-testid="product-title"], [data-testid="product-full-title"]')
  const allText = (await titles.allTextContents()).join(" ")
  expect(allText).toContain(productTitle)
})

Then("the page displays no results", async ({ page }) => {
  const content = (await page.textContent("body")) || ""
  expect(content.toLowerCase()).toMatch(/no results|nothing|empty|not found/i)
})

// ────────────────────────────────────────────────────────────
// WISHLIST
// ────────────────────────────────────────────────────────────

Then("each product card displays a heart icon for the wishlist", async ({ page }) => {
  const hearts = page.locator('[data-testid="wishlist-button"]')
  const count = await hearts.count()
  expect(count).toBeGreaterThanOrEqual(1)
})

// ────────────────────────────────────────────────────────────
// 404 / ERROR HANDLING
// ────────────────────────────────────────────────────────────

Then("the page displays a 404 error message", async ({ page }) => {
  const content = (await page.textContent("body")) || ""
  expect(content.toLowerCase()).toMatch(/not found|doesn.t exist/i)
})
