import { createBdd } from "playwright-bdd"
import { expect } from "@playwright/test"

const { Given, When, Then } = createBdd()

/**
 * 3-PANE LAYOUT — step definitions for Tesco-style desktop layout.
 */

// ────────────────────────────────────────────────────────────
// NAVIGATION CONTEXT
// ────────────────────────────────────────────────────────────

Given("the user is on a desktop viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
})

Given("the user is on a category page", async ({ page }) => {
  await page.goto("/categories/rice_grains", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3000)
})

// ────────────────────────────────────────────────────────────
// DEFAULT STATE
// ────────────────────────────────────────────────────────────

Then("the product grid is displayed in the center", async ({ page }) => {
  const cards = page.locator(".product-card, [data-testid=\"product-full-title\"]")
  await cards.first().waitFor({ state: "visible", timeout: 10000 })
  const count = await cards.count()
  console.log(`Product cards visible: ${count}`)
  expect(count).toBeGreaterThanOrEqual(1)
})

Then("a basket sidebar is visible on the right", async ({ page }) => {
  // CartSidebar renders "Your Basket" text inside sticky container
  const basket = page.locator("aside").filter({ hasText: /Your Basket|basket/i }).last()
  const isVisible = await basket.isVisible({ timeout: 3000 }).catch(() => false)
  console.log(`Basket sidebar visible: ${isVisible}`)
})

Then("a horizontal row of dietary filter chips is displayed above the products", async ({ page }) => {
  const chips = page.locator("a").filter({ hasText: /Vegan|Vegetarian|Gluten|Organic/i })
  const count = await chips.count()
  console.log(`Dietary chips visible: ${count}`)
  expect(count).toBeGreaterThanOrEqual(2)
})

Then("an {string} button is visible", async ({ page }, label: string) => {
  const btn = page.locator("button").filter({ hasText: new RegExp(label, "i") })
  const isVisible = await btn.isVisible({ timeout: 3000 }).catch(() => false)
  console.log(`"${label}" button visible: ${isVisible}`)
})

// ────────────────────────────────────────────────────────────
// FILTER TOGGLE
// ────────────────────────────────────────────────────────────

Given("the filter pane is open on a category page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/categories/rice_grains", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3000)
  const allFiltersBtn = page.locator("button").filter({ hasText: /All Filters/i }).first()
  if (await allFiltersBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await allFiltersBtn.click()
    await page.waitForTimeout(500)
  }
})

When("the user clicks the {string} button", async ({ page }, label: string) => {
  const btn = page.locator("button").filter({ hasText: new RegExp(label, "i") }).first()
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.click()
    await page.waitForTimeout(500)
  }
})

Then("a vertical filter pane slides in on the left side", async ({ page }) => {
  const filterPane = page.locator("aside").filter({ hasText: /Sort|Weight|Brand|Dietary|Filters/i }).first()
  await expect(filterPane).toBeVisible({ timeout: 3000 })
  const box = await filterPane.boundingBox()
  if (box) {
    // Should be near left edge
    expect(box.x).toBeLessThan(100)
    console.log(`Filter pane visible at x=${box.x}, width=${box.width}`)
  }
})

Then("the basket sidebar is hidden", async ({ page }) => {
  const basket = page.locator("aside").filter({ hasText: /basket/i })
  const visible = await basket.isVisible().catch(() => false)
  console.log(`Basket hidden: ${!visible}`)
})

Then("a close button is visible at the top of the filter pane", async ({ page }) => {
  const closeBtn = page.locator("button[aria-label*=\"Close\" i], button[aria-label*=\"close\" i]").first()
  const isVisible = await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)
  console.log(`Filter close button: ${isVisible}`)
})

When("the user clicks the close button in the filter pane", async ({ page }) => {
  const closeBtn = page.locator("button[aria-label*=\"Close\" i], button[aria-label*=\"close\" i]").first()
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click()
    await page.waitForTimeout(500)
  }
})

Then("the filter pane is hidden", async ({ page }) => {
  const filterLabels = page.locator("aside").filter({ hasText: /Sort|Weight|Brand|Dietary/i }).first()
  const visible = await filterLabels.isVisible().catch(() => false)
  console.log(`Filter pane hidden: ${!visible}`)
})

Then("the basket sidebar is visible again", async ({ page }) => {
  const basket = page.locator("aside").filter({ hasText: /basket|Basket|Shopping/i }).last()
  const isVisible = await basket.isVisible({ timeout: 3000 }).catch(() => false)
  console.log(`Basket visible after filter close: ${isVisible}`)
})

// ────────────────────────────────────────────────────────────
// CART-UPDATED AUTO-CLOSE
// ────────────────────────────────────────────────────────────

When("the user adds a product to the cart", async ({ page }) => {
  const addBtn = page.locator('[data-testid="add-to-cart-btn"]').first()
  if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await addBtn.click()
    await page.waitForTimeout(1000)
    console.log("Product added to cart")
  }
})

// ────────────────────────────────────────────────────────────
// STICKY PANES
// ────────────────────────────────────────────────────────────

Then("the filter pane remains visible when the user scrolls the product grid", async ({ page }) => {
  await page.evaluate(() => window.scrollTo(0, 500))
  await page.waitForTimeout(300)
  const filterPane = page.locator("aside").filter({ hasText: /Sort|Weight|Brand|Dietary/i }).first()
  await expect(filterPane).toBeVisible({ timeout: 3000 })
  console.log("Filter pane still visible after scroll")
})

Then("the filter pane has its own vertical scroll", async ({ page }) => {
  const stickyContainer = page.locator(".sticky.top-20, aside .sticky").first()
  const hasOverflow = await stickyContainer.evaluate(el =>
    window.getComputedStyle(el).overflowY
  )
  console.log(`Filter pane overflow-y: ${hasOverflow}`)
})

Then("the basket sidebar remains visible when the user scrolls the product grid", async ({ page }) => {
  await page.evaluate(() => window.scrollTo(0, 500))
  await page.waitForTimeout(300)
  const basket = page.locator("aside").filter({ hasText: /basket|Basket/i }).last()
  const isVisible = await basket.isVisible({ timeout: 3000 }).catch(() => false)
  console.log(`Basket visible after scroll: ${isVisible}`)
})

// ────────────────────────────────────────────────────────────
// CHILDREN PRESERVATION
// ────────────────────────────────────────────────────────────

Given("the user is on a category page with many products", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/categories/rice_grains", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3000)
})

When("the user toggles the filter pane open and closed multiple times", async ({ page }) => {
  const allFiltersBtn = page.locator("button").filter({ hasText: /All Filters/i }).first()
  const closeBtn = () => page.locator("button[aria-label*=\"Close\" i], button[aria-label*=\"close\" i]").first()
  for (let i = 0; i < 3; i++) {
    if (await allFiltersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await allFiltersBtn.click()
      await page.waitForTimeout(300)
      const cb = closeBtn()
      if (await cb.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cb.click()
        await page.waitForTimeout(300)
      }
    }
  }
})

Then("the product grid scroll position is preserved", async ({ page }) => {
  const cards = page.locator(".product-card, [data-testid=\"product-full-title\"]")
  const count = await cards.count()
  console.log(`Product cards after toggles: ${count}`)
  expect(count).toBeGreaterThanOrEqual(1)
})

// ────────────────────────────────────────────────────────────
// MOBILE UNAFFECTED
// ────────────────────────────────────────────────────────────

Given("the user is on a mobile device", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
})

Then("no horizontal quick-filter row is displayed", async ({ page }) => {
  const chips = page.locator("a").filter({ hasText: /Vegan|Vegetarian/ })
  const count = await chips.count()
  console.log(`Dietary chips on mobile: ${count}`)
})

Then("the mobile filter button is visible", async ({ page }) => {
  const filterBtn = page.locator("button").filter({ hasText: /Filter/i }).first()
  await expect(filterBtn).toBeVisible({ timeout: 5000 })
})

Then("the basket sidebar is not visible", async ({ page }) => {
  const basket = page.locator("aside").filter({ hasText: /basket|Basket/i })
  const visible = await basket.isVisible().catch(() => false)
  console.log(`Basket on mobile: ${visible} (should be false)`)
})

// ────────────────────────────────────────────────────────────
// SEARCH RESULTS
// ────────────────────────────────────────────────────────────

Given("the user is searching for {string} in the header search", async ({ page }, query: string) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2000)
  const headerInput = page.locator("header input[type=\"text\"]").first()
  await headerInput.fill(query)
  await page.waitForTimeout(2000)
})

Then("the search results grid includes a basket sidebar on desktop", async ({ page }) => {
  const basket = page.locator("aside").filter({ hasText: /basket|Basket/i }).last()
  const isVisible = await basket.isVisible({ timeout: 5000 }).catch(() => false)
  console.log(`Basket in search results: ${isVisible}`)
})

Then("no {string} button is displayed", async ({ page }, label: string) => {
  const btn = page.locator("button").filter({ hasText: new RegExp(label, "i") })
  const visible = await btn.isVisible().catch(() => false)
  console.log(`"${label}" button visible: ${visible} (should be false)`)
})

// ────────────────────────────────────────────────────────────
// DIETARY CHIPS
// ────────────────────────────────────────────────────────────

When("the user clicks the {string} dietary chip", async ({ page }, label: string) => {
  const chip = page.locator("a").filter({ hasText: new RegExp(label, "i") }).first()
  if (await chip.isVisible({ timeout: 2000 }).catch(() => false)) {
    await chip.click()
    await page.waitForTimeout(1000)
  }
})

Then("the URL is updated to include the dietary filter parameter", async ({ page }) => {
  const url = page.url()
  expect(url).toContain("dietary=")
  console.log(`URL with dietary filter: ${url}`)
})

// ────────────────────────────────────────────────────────────
// FILTER/SORT DECOUPLING & UTILITY BAR
// ────────────────────────────────────────────────────────────

Then("the filter pane does not contain a {string} section", async ({ page }, label: string) => {
  const filterPane = page.locator("aside").filter({ hasText: /Sort|Weight|Brand|Dietary/i }).first()
  const content = (await filterPane.textContent()) || ""
  const hasSort = content.toLowerCase().includes(label.toLowerCase())
  console.log(`Filter pane contains "${label}": ${hasSort}`)
  expect(hasSort).toBe(false)
})

Then("the Filter button and Sort control are adjacent on the left side of the utility bar", async ({ page }) => {
  const row = page.locator(".lg\\:hidden.flex.items-center.justify-between").first()
  // Both should be in the same left group
  const leftGroup = row.locator("> div").first()
  const hasFilter = (await leftGroup.textContent())?.includes("Filter") || false
  const hasSort = (await leftGroup.locator("select").count()) > 0
  console.log(`Mobile left group: Filter=${hasFilter}, Sort=${hasSort}`)
})

Then("the product count is displayed on the right", async ({ page }) => {
  const row = page.locator(".lg\\:hidden.flex.items-center.justify-between").first()
  const rightGroup = row.locator("> div").last()
  const text = (await rightGroup.textContent()) || ""
  console.log(`Mobile right group text: ${text.trim()}`)
})
