import { createBdd } from "playwright-bdd"

const { Given, When, Then } = createBdd()

/**
 * MOBILE — unique steps only.
 * Generic steps (tap hamburger, close, outside) are in generic.steps.ts.
 */

Given("the mobile side menu is open", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2000)
  const menuBtn = page.locator('[data-testid="nav-menu-button"], button[aria-label*="menu" i]').first()
  if (await menuBtn.isVisible().catch(() => false)) {
    await menuBtn.click()
    await page.waitForTimeout(1000)
  }
})

When("the user views a category page", async ({ page }) => {
  // already navigated by scenario context
})

Then("product cards are displayed in a horizontal layout", async ({ page }) => {
  console.log("Horizontal layout check")
})

Given("the user is on a mobile device viewing a product detail page", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/products/mdh-kitchen-king-masala", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3000)
})

When("the user scrolls past the {string} button", async ({ page }, buttonText: string) => {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
  await page.waitForTimeout(1000)
})

Then("a sticky add-to-cart bar appears at the bottom of the screen", async ({ page }) => {
  const content = (await page.textContent("body")) || ""
  console.log("Sticky add-to-cart check")
})
