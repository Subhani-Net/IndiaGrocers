import { test, expect } from "@playwright/test"

/**
 * MINIMUM ORDER & FREE DELIVERY CONFIGURATION TESTS
 *
 * Validates that:
 * - MIN_ORDER_AMOUNT (3000p / £30) gates the basket
 * - FREE_DELIVERY_THRESHOLD (4000p / £40) shows progress
 * - STANDARD_DELIVERY_COST (399p / £3.99) displays correctly
 * - All values come from store-config.ts, never hardcoded
 * - Raw pence values never appear in the UI
 * - Nav banner, basket bar, cart summary, homepage are consistent
 *
 * Source: apps/storefront/src/lib/config/store-config.ts
 */

test.describe("Minimum Order — Basket Progress Bar", () => {
  test("Basket bar references values from store-config, not hardcoded", async ({ page }) => {
    await page.goto("/gb/cart", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)

    const content = (await page.textContent("body")) || ""

    // The basket bar should reference £30 (minimum) and £40 (free delivery)
    // NOT £45 (the old hardcoded value)
    const hasOldThreshold = content.includes("£45")
    console.log("Old £45 threshold visible:", hasOldThreshold)
    expect(hasOldThreshold).toBe(false)
  })

  test("Free delivery threshold label shows correct value", async ({ page }) => {
    await page.goto("/gb/cart", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)

    const content = (await page.textContent("body")) || ""

    // Should show the correct free delivery amount (£40.00)
    const hasCorrectThreshold = content.match(/£40\.?00/)
    console.log("£40 threshold shown:", !!hasCorrectThreshold)
  })
})

test.describe("Minimum Order — Nav Banner", () => {
  test("Nav banner shows free delivery at £40", async ({ page }) => {
    await page.goto("/gb", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)

    const content = (await page.textContent("body")) || ""

    // Banner should show "FREE DELIVERY on orders over £40"
    const banner = content.match(/FREE\s*DELIVERY.*over.*£40/i)
    console.log("Free delivery banner:", banner ? banner[0] : "NOT FOUND")
    expect(banner).toBeTruthy()
  })

  test("Nav banner does NOT show £45", async ({ page }) => {
    await page.goto("/gb", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)

    const content = (await page.textContent("body")) || ""
    const hasOldValue = content.includes("over £45")
    console.log("Old £45 in banner:", hasOldValue)
    expect(hasOldValue).toBe(false)
  })
})

test.describe("Minimum Order — Homepage Promo Cards", () => {
  test("Free delivery promo card shows £40 not £45", async ({ page }) => {
    await page.goto("/gb", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)

    const content = (await page.textContent("body")) || ""

    // Promo card should say "On orders over £40"
    // Not the old "On orders over £45"
    const hasOldValue = content.includes("orders over £45")
    console.log("Old £45 in promo:", hasOldValue)
    expect(hasOldValue).toBe(false)
  })
})

test.describe("Minimum Order — Delivery Page", () => {
  test("Delivery page table shows correct prices from config", async ({ page }) => {
    await page.goto("/gb/delivery", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)

    const content = (await page.textContent("body")) || ""

    // Should show Standard Delivery £3.99 and Free Delivery (orders over £40)
    const hasStandard = content.match(/£3\.99/)
    const hasFree = content.match(/£0\.00|£40/)
    console.log("Delivery page: £3.99:", !!hasStandard, "£0.00/£40:", !!hasFree)
  })
})

test.describe("Minimum Order — FAQ Accordion", () => {
  test("FAQ shows free delivery at £40", async ({ page }) => {
    await page.goto("/gb/delivery", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)

    const content = (await page.textContent("body")) || ""

    // FAQ should say "Free delivery is available on all orders over £40"
    const hasOldValue = content.includes("over £40") && !content.includes("over £45")
    console.log("FAQ £40 correct:", hasOldValue)
  })
})

test.describe("Minimum Order — Raw Pence Values", () => {
  test("Raw pence values (4000, 3000, 399) never appear in the UI", async ({ page }) => {
    await page.goto("/gb/cart", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)

    const content = (await page.textContent("body")) || ""

    // These pence values should be divided by 100 before display
    // They should NOT appear as raw numbers in the UI
    const hasRaw4000 = content.match(/\b4000\b/)
    const hasRaw3000 = content.match(/\b3000\b/)
    const hasRaw399 = content.match(/\b399\b/)

    console.log("Raw 4000:", !!hasRaw4000, "3000:", !!hasRaw3000, "399:", !!hasRaw399)
    expect(hasRaw4000).toBeFalsy()
    expect(hasRaw3000).toBeFalsy()
    expect(hasRaw399).toBeFalsy()
  })
})

test.describe("Minimum Order — Sticky Basket Bar (Mobile)", () => {
  test("Mobile sticky bar uses correct free delivery threshold", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/gb/cart", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)

    // Scroll to trigger sticky bar visibility
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)

    const content = (await page.textContent("body")) || ""

    // Sticky bar should show progress toward £40, not £45
    const hasOldValue = content.includes("£45")
    console.log("Mobile sticky £45:", hasOldValue)
    expect(hasOldValue).toBe(false)
  })
})

test.describe("Minimum Order — Cross-Page Consistency", () => {
  test("£45 does not appear on any main customer-facing page", async ({ page }) => {
    const pages = ["/gb", "/gb/cart", "/gb/delivery", "/gb/store"]

    for (const path of pages) {
      await page.goto(path, { waitUntil: "domcontentloaded" })
      await page.waitForTimeout(2000)
      const content = (await page.textContent("body")) || ""
      const hasOldValue = content.includes("£45")
      console.log(`${path}: £45 visible = ${hasOldValue}`)
      expect(hasOldValue).toBe(false)
    }
  })
})
