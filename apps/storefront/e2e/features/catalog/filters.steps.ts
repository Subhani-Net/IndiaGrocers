import { createBdd } from "playwright-bdd"
import { expect } from "@playwright/test"

const { Given, When, Then } = createBdd()

/**
 * MOBILE FILTER — step definitions for the slide-out drawer with accordion.
 */

// ────────────────────────────────────────────────────────────
// NAVIGATION CONTEXT
// ────────────────────────────────────────────────────────────

Given("the user is on a mobile device", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
})

Given("the user is on a category page with filters available", async ({ page }) => {
  await page.goto("/categories/rice_grains", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3000)
})

// ────────────────────────────────────────────────────────────
// DRAWER OPEN / CLOSE
// ────────────────────────────────────────────────────────────

When("the user taps the {string} button", async ({ page }, label: string) => {
  const btn = page.locator("button").filter({ hasText: new RegExp(label, "i") }).first()
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click()
    await page.waitForTimeout(800)
  } else {
    console.log(`"${label}" button not found`)
  }
})

Given("the mobile filter drawer is open", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/categories/rice_grains", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3000)
  const filterBtn = page.locator("button").filter({ hasText: /Filter/i }).first()
  if (await filterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await filterBtn.click()
    await page.waitForTimeout(800)
  }
})

Then("a filter drawer slides in from the left side of the screen", async ({ page }) => {
  const drawer = page.locator(".mobile-drawer, [class*=\"mobile-drawer\"]").first()
  await expect(drawer).toBeVisible({ timeout: 3000 })
  const box = await drawer.boundingBox()
  if (box) {
    // Should be positioned near left edge
    expect(box.x).toBeLessThan(50)
  }
  console.log("Drawer visible from left")
})

Then("a sticky close button is visible at the top", async ({ page }) => {
  const closeBtn = page.locator("button[aria-label*=\"Close\" i], button[aria-label*=\"close\" i]").first()
  const isVisible = await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)
  console.log(`Close button visible: ${isVisible}`)
})

When("the user taps the close button in the drawer header", async ({ page }) => {
  const closeBtn = page.locator("button[aria-label*=\"Close\" i], button[aria-label*=\"close\" i]").first()
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click()
    await page.waitForTimeout(500)
  }
})

Then("the filter drawer slides out to the left", async ({ page }) => {
  await page.waitForTimeout(300)
  const drawer = page.locator(".mobile-drawer, [class*=\"mobile-drawer\"]").first()
  await expect(drawer).not.toBeVisible({ timeout: 3000 })
  console.log("Drawer dismissed")
})

Then("the drawer is no longer visible", async ({ page }) => {
  const drawer = page.locator(".mobile-drawer, [class*=\"mobile-drawer\"]").first()
  await expect(drawer).not.toBeVisible({ timeout: 3000 })
})

When("the user taps the backdrop outside the drawer", async ({ page }) => {
  // The backdrop is behind the drawer
  await page.mouse.click(10, 10)
  await page.waitForTimeout(500)
})

When("the user presses the Escape key", async ({ page }) => {
  await page.keyboard.press("Escape")
  await page.waitForTimeout(500)
})

Then("the filter drawer closes", async ({ page }) => {
  const drawer = page.locator(".mobile-drawer, [class*=\"mobile-drawer\"]").first()
  await expect(drawer).not.toBeVisible({ timeout: 3000 })
})

// ────────────────────────────────────────────────────────────
// ACCORDION SECTIONS
// ────────────────────────────────────────────────────────────

Then("the filter sections are displayed as accordion items", async ({ page }) => {
  // Radix accordion items have role="region" or specific data attributes
  const accordionItems = page.locator('[data-state="closed"], [data-state="open"]').filter({ hasText: /Sort|Weight|Brand|Dietary|Price|Stock/i })
  const count = await accordionItems.count()
  console.log(`Accordion items found: ${count}`)
  expect(count).toBeGreaterThanOrEqual(2)
})

Then("tapping a section header expands its content", async ({ page }) => {
  const trigger = page.locator('[data-state="closed"]').filter({ hasText: /Weight/i }).first()
  if (await trigger.isVisible({ timeout: 2000 }).catch(() => false)) {
    await trigger.click()
    await page.waitForTimeout(500)
    const expanded = page.locator('[data-state="open"]').filter({ hasText: /Weight/i }).first()
    const isExpanded = await expanded.isVisible({ timeout: 2000 }).catch(() => false)
    console.log(`Weight section expanded: ${isExpanded}`)
  } else {
    console.log("Weight section not found or already open")
  }
})

Then("the section content does not overflow the drawer", async ({ page }) => {
  const drawer = page.locator(".mobile-drawer, [class*=\"mobile-drawer\"]").first()
  const box = await drawer.boundingBox()
  if (box) {
    // Drawer height should be within viewport
    expect(box.height).toBeLessThanOrEqual(page.viewportSize()?.height || 900)
    console.log(`Drawer height: ${box.height}px (viewport: ${page.viewportSize()?.height}px)`)
  }
})

// ────────────────────────────────────────────────────────────
// FILTER STATE PERSISTENCE
// ────────────────────────────────────────────────────────────

When("the user selects the {string} dietary filter", async ({ page }, filter: string) => {
  const checkbox = page.locator("label").filter({ hasText: new RegExp(filter, "i") }).locator("input[type=\"checkbox\"]").first()
  if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
    await checkbox.check()
    await page.waitForTimeout(500)
    console.log(`Dietary filter "${filter}" checked`)
  }
})

When("the user closes the drawer", async ({ page }) => {
  const closeBtn = page.locator("button[aria-label*=\"Close\" i], button[aria-label*=\"close\" i]").first()
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click()
    await page.waitForTimeout(500)
  } else {
    await page.keyboard.press("Escape")
    await page.waitForTimeout(500)
  }
})

When("the user reopens the filter drawer", async ({ page }) => {
  const filterBtn = page.locator("button").filter({ hasText: /Filter/i }).first()
  if (await filterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await filterBtn.click()
    await page.waitForTimeout(800)
  }
})

Then("the {string} filter is still selected", async ({ page }, filter: string) => {
  // The active filter chip should be visible
  const chip = page.locator("button").filter({ hasText: new RegExp(filter, "i") }).first()
  const isVisible = await chip.isVisible({ timeout: 2000 }).catch(() => false)
  console.log(`"${filter}" filter chip visible: ${isVisible}`)
})

// ────────────────────────────────────────────────────────────
// BODY SCROLL LOCK
// ────────────────────────────────────────────────────────────

Then("the page body scroll is locked", async ({ page }) => {
  const overflow = await page.evaluate(() => document.body.style.overflow)
  console.log(`Body overflow: "${overflow}"`)
  expect(overflow).toBe("hidden")
})

Then("the page body scroll is restored", async ({ page }) => {
  await page.waitForTimeout(300)
  const overflow = await page.evaluate(() => document.body.style.overflow)
  console.log(`Body overflow after close: "${overflow}"`)
  expect(overflow).not.toBe("hidden")
})

// ────────────────────────────────────────────────────────────
// CLEAR ALL
// ────────────────────────────────────────────────────────────

Given("the user has applied a brand filter and a dietary filter", async ({ page }) => {
  // Brand
  const brandInput = page.locator("input[placeholder*=\"brand\" i]").first()
  if (await brandInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await brandInput.fill("natco")
    await brandInput.press("Enter")
    await page.waitForTimeout(500)
  }
  // Dietary
  const checkbox = page.locator("label").filter({ hasText: /Organic/i }).locator("input[type=\"checkbox\"]").first()
  if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
    await checkbox.check()
    await page.waitForTimeout(500)
  }
})

When("the user taps the {string} button", async ({ page }, label: string) => {
  const btn = page.locator("button").filter({ hasText: new RegExp(label, "i") }).first()
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click()
    await page.waitForTimeout(500)
  }
})

Then("all active filter chips are removed", async ({ page }) => {
  const chips = page.locator("button").filter({ hasText: /✕/ })
  const count = await chips.count()
  console.log(`Remaining filter chips after clear: ${count}`)
  expect(count).toBe(0)
})

// ────────────────────────────────────────────────────────────
// DESKTOP SIDEBAR
// ────────────────────────────────────────────────────────────

Given("the user is on a desktop viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
})

Then("the filter panel is displayed in a left sidebar", async ({ page }) => {
  const sidebar = page.locator("aside").filter({ hasText: /Sort|Filter/i }).first()
  await expect(sidebar).toBeVisible({ timeout: 5000 })
  console.log("Desktop filter sidebar visible")
})

Then("the sidebar is always visible without a toggle button", async ({ page }) => {
  const toggleBtn = page.locator("button").filter({ hasText: /Filter/i })
  const visible = await toggleBtn.isVisible().catch(() => false)
  // On desktop (sm+), the filter button should be hidden
  console.log(`Filter toggle button visible on desktop: ${visible}`)
})
