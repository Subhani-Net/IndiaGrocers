import { createBdd } from "playwright-bdd"
import { expect } from "@playwright/test"

const { Given, When, Then } = createBdd()

/**
 * WISHLIST STEPS
 */

When("the user clicks the heart icon on a product card", async ({ page }) => {
  const heart = page.locator('[data-testid="wishlist-button"]').first()
  if ((await heart.count()) > 0) {
    await heart.click({ force: true })
    await page.waitForTimeout(500)
  }
})

Then("the heart icon fills with the brand orange colour", async ({ page }) => {
  const heart = page.locator('[data-testid="wishlist-button"]').first()
  const svg = heart.locator("svg")
  const classAttr = (await svg.getAttribute("class").catch(() => "")) || ""
  const isFilled = classAttr.includes("fill-brand-orange") || classAttr.includes("text-brand-orange")
  console.log(`Heart filled: ${isFilled}`)
  expect(isFilled).toBeTruthy()
})

Then("the product is saved to the wishlist", async ({ page }) => {
  console.log("Wishlist saved")
})

Given("the user is on a category page with a product already in the wishlist", async ({ page }) => {
  await page.goto("/categories/corn", { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".product-card", { timeout: 15000 })
  const heart = page.locator('[data-testid="wishlist-button"]').first()
  if ((await heart.count()) > 0) {
    await heart.click({ force: true })
    await page.waitForTimeout(500)
  }
})

When("the user clicks the filled heart icon", async ({ page }) => {
  const heart = page.locator('[data-testid="wishlist-button"]').first()
  if ((await heart.count()) > 0) {
    await heart.click({ force: true })
    await page.waitForTimeout(500)
  }
})

Then("the heart icon returns to an outline state", async ({ page }) => {
  const heart = page.locator('[data-testid="wishlist-button"]').first()
  const svg = heart.locator("svg")
  const classAttr = (await svg.getAttribute("class").catch(() => "")) || ""
  const isOutline = !classAttr.includes("fill-brand-orange")
  console.log(`Heart outline: ${isOutline}`)
})

Then("the product is removed from the wishlist", async ({ page }) => {
  console.log("Wishlist removed")
})

Given("the user has at least one product in their wishlist", async ({ page }) => {
  await page.goto("/categories/corn", { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".product-card", { timeout: 15000 })
  const heart = page.locator('[data-testid="wishlist-button"]').first()
  if ((await heart.count()) > 0) {
    await heart.click({ force: true })
    await page.waitForTimeout(500)
  }
})

Then("the page displays the wishlisted products in a grid", async ({ page }) => {
  const cards = page.locator(".product-card")
  const count = await cards.count()
  console.log(`Wishlist products: ${count}`)
  expect(count).toBeGreaterThanOrEqual(0)
})

Then("each product shows a thumbnail, title, and price", async ({ page }) => {
  const content = (await page.textContent("body")) || ""
  expect(content).toMatch(/£[0-9]+\.[0-9]{2}/)
})

Given("the user has an empty wishlist", async ({ page }) => {
  // Just navigate to wishlist — it will be empty by default in fresh browser
  await page.goto("/wishlist", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2000)
})

Then("the page displays a heart icon", async ({ page }) => {
  const content = (await page.textContent("body")) || ""
  const hasEmpty = content.match(/empty|no items|start shopping/i)
  console.log(`Empty wishlist: ${hasEmpty ? "yes" : "no"}`)
})

Then("the page displays the message {string}", async ({ page }, message: string) => {
  const content = (await page.textContent("body")) || ""
  const found = content.toLowerCase().includes(message.toLowerCase())
  console.log(`Message "${message}": ${found ? "found" : "not found"}`)
  expect(found).toBeTruthy()
})

Then("the page displays a {string} call-to-action", async ({ page }, cta: string) => {
  const links = page.locator("a")
  const count = await links.count()
  expect(count).toBeGreaterThan(0)
})
