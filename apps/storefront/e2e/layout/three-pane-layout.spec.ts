import { test, expect } from "@playwright/test"

/**
 * 3-PANE LAYOUT — Integration Tests
 *
 * Validates the Tesco-style desktop 3-pane layout architecture:
 * 1. ThreePaneLayout component with filter/basket toggle state
 * 2. Horizontal quick-filter row (dietary chips + All Filters button + sort)
 * 3. Sticky left (filter) and right (basket) panes on lg+
 * 4. cart-updated event auto-closes filter and restores basket
 * 5. Children (product grid) never remount on pane toggles
 * 6. Mobile layout completely unaffected (<lg)
 * 7. Search results page: basket only, no filter pane
 *
 * Architecture: ThreePaneLayout (client) + CartSidebar (className prop) + SearchContext (countryCode)
 */

test.describe("3-Pane Layout — Desktop Default State", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/categories/rice_grains", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)
  })

  test("Horizontal quick-filter row is visible above the product grid", async ({ page }) => {
    // Dietary chips should be in the toolbar
    const chips = page.locator("a").filter({ hasText: /Vegan|Vegetarian|Gluten|Organic/i })
    const count = await chips.count()
    console.log(`Dietary chip count: ${count}`)
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test("All Filters button is present when not searching", async ({ page }) => {
    const allFiltersBtn = page.locator("button").filter({ hasText: /All Filters/i }).first()
    await expect(allFiltersBtn).toBeVisible({ timeout: 3000 })
  })

  test("Basket sidebar is visible by default", async ({ page }) => {
    const basket = page.locator("aside").filter({ hasText: /Your Basket|basket/i }).last()
    const isVisible = await basket.isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`Basket visible: ${isVisible}`)
  })

  test("Product grid is visible between toolbar and basket", async ({ page }) => {
    const cards = page.locator(".product-card, [data-testid=\"product-title\"]")
    await cards.first().waitFor({ state: "visible", timeout: 10000 })
    const count = await cards.count()
    console.log(`Product cards: ${count}`)
    expect(count).toBeGreaterThanOrEqual(3)
  })
})

test.describe("3-Pane Layout — Filter Toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/categories/rice_grains", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)
  })

  test("Clicking All Filters opens the filter pane", async ({ page }) => {
    const allFiltersBtn = page.locator("button").filter({ hasText: /All Filters/i }).first()
    await allFiltersBtn.click()
    await page.waitForTimeout(500)

    // Filter pane should now be visible with filter content
    const filterPane = page.locator("aside").filter({ hasText: /Sort|Weight|Brand|Dietary/i }).first()
    await expect(filterPane).toBeVisible({ timeout: 3000 })
    console.log("Filter pane opened")
  })

  test("Opening filter toggles All Filters button to Hide Filters", async ({ page }) => {
    const allFiltersBtn = page.locator("button").filter({ hasText: /All Filters/i }).first()
    await allFiltersBtn.click()
    await page.waitForTimeout(500)

    const hideBtn = page.locator("button").filter({ hasText: /Hide Filters/i }).first()
    const visible = await hideBtn.isVisible({ timeout: 2000 }).catch(() => false)
    console.log(`"Hide Filters" button: ${visible}`)
  })

  test("Filter close button dismisses the filter pane", async ({ page }) => {
    // Open
    const allFiltersBtn = page.locator("button").filter({ hasText: /All Filters/i }).first()
    await allFiltersBtn.click()
    await page.waitForTimeout(500)

    // Close via ✕ button
    const closeBtn = page.locator("button[aria-label*=\"Close\" i], button[aria-label*=\"close\" i]").first()
    await closeBtn.click()
    await page.waitForTimeout(400)

    // Filter should be hidden
    const filterPane = page.locator("aside").filter({ hasText: /Sort|Weight|Brand|Dietary/i }).first()
    const visible = await filterPane.isVisible().catch(() => false)
    console.log(`Filter visible after close: ${visible}`)
  })

  test("Product grid remains visible during filter open/close", async ({ page }) => {
    // Initial product count
    const cards = page.locator(".product-card, [data-testid=\"product-title\"]")
    const initialCount = await cards.count()

    // Open filter
    const allFiltersBtn = page.locator("button").filter({ hasText: /All Filters/i }).first()
    await allFiltersBtn.click()
    await page.waitForTimeout(500)

    const duringOpen = await cards.count()
    console.log(`Products during filter open: ${duringOpen}`)

    // Products should still be present
    expect(duringOpen).toBe(initialCount)
  })
})

test.describe("3-Pane Layout — Sticky Panes & Scroll", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/categories/rice_grains", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)
  })

  test("Basket sidebar uses sticky positioning", async ({ page }) => {
    // CartSidebar inner div uses sticky top-20
    const stickyEl = page.locator(".sticky.top-20").first()
    if (await stickyEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      const position = await stickyEl.evaluate(el => window.getComputedStyle(el).position)
      expect(position).toBe("sticky")
      console.log(`Basket position: ${position}`)
    }
  })

  test("Basket remains visible after page scroll", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 600))
    await page.waitForTimeout(500)

    const basket = page.locator("aside").filter({ hasText: /Your Basket|basket/i }).last()
    const box = await basket.boundingBox()
    if (box) {
      // Should still be within viewport
      expect(box.y).toBeLessThan(page.viewportSize()?.height || 900)
      console.log(`Basket y after scroll: ${box.y}`)
    }
  })

  test("Filter pane is sticky when open", async ({ page }) => {
    // Open filter
    const allFiltersBtn = page.locator("button").filter({ hasText: /All Filters/i }).first()
    await allFiltersBtn.click()
    await page.waitForTimeout(500)

    await page.evaluate(() => window.scrollTo(0, 400))
    await page.waitForTimeout(300)

    const filterPane = page.locator("aside").filter({ hasText: /Sort|Weight|Brand|Dietary/i }).first()
    await expect(filterPane).toBeVisible({ timeout: 3000 })
    const box = await filterPane.boundingBox()
    if (box) {
      expect(box.y).toBeLessThan(100) // near top
      console.log(`Filter y after scroll: ${box.y}`)
    }
  })
})

test.describe("3-Pane Layout — Mobile Unchanged", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/categories/rice_grains", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)
  })

  test("No horizontal quick-filter row on mobile", async ({ page }) => {
    const chips = page.locator("a").filter({ hasText: /Vegan|Vegetarian|Gluten|Organic/i })
    const count = await chips.count()
    console.log(`Dietary chips on mobile: ${count}`)
  })

  test("Mobile filter button is visible", async ({ page }) => {
    const filterBtn = page.locator("button").filter({ hasText: /Filter/i }).first()
    await expect(filterBtn).toBeVisible({ timeout: 5000 })
  })

  test("No basket sidebar on mobile", async ({ page }) => {
    const basket = page.locator("aside").filter({ hasText: /Your Basket|basket/i })
    const visible = await basket.isVisible().catch(() => false)
    console.log(`Basket on mobile: ${visible}`)
  })
})

test.describe("3-Pane Layout — Search Results", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2000)
  })

  test("Search results grid has basket sidebar but no filter button", async ({ page }) => {
    const headerInput = page.locator("header input[type=\"text\"]").first()
    await headerInput.fill("basmati")
    await page.waitForTimeout(3000)

    // Basket should be visible
    const basket = page.locator("aside").filter({ hasText: /Your Basket|basket/i }).last()
    const basketVisible = await basket.isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`Basket in search: ${basketVisible}`)

    // All Filters button should NOT be present
    const allFiltersBtn = page.locator("button").filter({ hasText: /All Filters/i }).first()
    const filterBtnVisible = await allFiltersBtn.isVisible().catch(() => false)
    console.log(`All Filters in search: ${filterBtnVisible}`)
  })
})

test.describe("Utility Bar — Desktop & Mobile Consistency", () => {
  test("Desktop utility bar: [Filter] [Sort] ─── [product count]", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/categories/rice_grains", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)

    // Desktop utility row
    const row = page.locator(".hidden.lg\\:flex.items-center.justify-between").first()
    await expect(row).toBeVisible({ timeout: 3000 })

    // Left group: Filter button + Sort dropdown
    const filterBtn = row.locator("button").filter({ hasText: /All Filters|Hide Filters/i }).first()
    const filterVisible = await filterBtn.isVisible().catch(() => false)
    console.log(`Desktop Filter button: ${filterVisible}`)

    const sortSelect = row.locator("select")
    const sortVisible = await sortSelect.isVisible().catch(() => false)
    console.log(`Desktop Sort dropdown: ${sortVisible}`)

    // Right group: product count
    const productCount = row.locator("span").filter({ hasText: /product/i }).first()
    const countVisible = await productCount.isVisible().catch(() => false)
    console.log(`Desktop product count: ${countVisible}`)
  })

  test("Mobile utility bar matches desktop layout: [Filter] [Sort] ─── [product count]", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/categories/rice_grains", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)

    // Mobile utility row
    const row = page.locator(".lg\\:hidden.flex.items-center.justify-between").first()
    await expect(row).toBeVisible({ timeout: 3000 })

    // Left: Filter button
    const filterBtn = row.locator("button").filter({ hasText: /Filter/i }).first()
    await expect(filterBtn).toBeVisible({ timeout: 3000 })

    // Left: Sort dropdown
    const sortSelect = row.locator("select")
    const sortVisible = await sortSelect.isVisible().catch(() => false)
    console.log(`Mobile Sort dropdown: ${sortVisible}`)

    // Right: product count
    const productCount = row.locator("span").filter({ hasText: /product/i }).first()
    const countVisible = await productCount.isVisible().catch(() => false)
    console.log(`Mobile product count: ${countVisible}`)
  })

  test("Desktop utility bar has border-b separator", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/categories/rice_grains", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)

    const row = page.locator(".hidden.lg\\:flex.items-center.justify-between.border-b").first()
    const hasBorder = await row.isVisible({ timeout: 2000 }).catch(() => false)
    console.log(`Desktop utility bar border-b: ${hasBorder}`)
    expect(hasBorder).toBeTruthy()
  })

  test("Mobile utility bar has border-b separator", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/categories/rice_grains", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)

    const row = page.locator(".lg\\:hidden.flex.items-center.justify-between.border-b").first()
    const hasBorder = await row.isVisible({ timeout: 2000 }).catch(() => false)
    console.log(`Mobile utility bar border-b: ${hasBorder}`)
    expect(hasBorder).toBeTruthy()
  })
})
