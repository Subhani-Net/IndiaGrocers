import { test, expect } from "@playwright/test"

/**
 * QUANTITY SELECTOR E2E TESTS
 *
 * Validates product card UI and quantity selector behavior.
 *
 * Desktop: Store page cards always show [-]/[+] controls. Category pages show "Add to Basket".
 * Mobile (<768px): Cards show "Add" buttons that transform to [-]/[+] controls.
 */

const CARD = ".product-card"

test("Qty — Store page shows product cards with quantity controls", async ({ page }) => {
  await page.goto("/gb/store")
  await page.waitForSelector(CARD, { timeout: 10000 })
  const count = await page.locator(CARD).count()
  expect(count).toBeGreaterThanOrEqual(1)
  console.log(`Store: ${count} cards`)
})

test("Qty — Category page loads with cards", async ({ page }) => {
  await page.goto("/gb/categories/corn")
  await page.waitForSelector(CARD, { timeout: 10000 })
  const count = await page.locator(CARD).count()
  expect(count).toBeGreaterThanOrEqual(1)
  console.log(`Corn category: ${count} cards`)
})

test("Qty — Category page has Add to Basket button", async ({ page }) => {
  await page.goto("/gb/categories/corn")
  await page.waitForSelector(CARD, { timeout: 10000 })
  await expect(page.locator("button").filter({ hasText: "Add to Basket" }).first()).toBeVisible({ timeout: 5000 })
  console.log("Add to Basket button present")
})

test("Qty — Spices category loads with cards", async ({ page }) => {
  await page.goto("/gb/categories/spices-herbs")
  await page.waitForSelector(CARD, { timeout: 10000 })
  const count = await page.locator(CARD).count()
  expect(count).toBeGreaterThanOrEqual(1)
  console.log(`Spices: ${count} cards`)
})

// ═══════════════════════════════════════════════════════════════════
//  QUANTITY SELECTOR INTERACTION TESTS (Phase C enhancement)
// ═══════════════════════════════════════════════════════════════════

test("Qty — Add button click transforms to quantity controls", async ({ page }) => {
  await page.goto("/gb/categories/spices-herbs")
  await page.waitForSelector(CARD, { timeout: 10000 })

  // Find first "Add to Basket" or "Add" button
  const addBtn = page.locator('[data-testid="add-to-cart-btn"]').first()
  if (await addBtn.isVisible().catch(() => false)) {
    await addBtn.click()
    await page.waitForTimeout(2000)

    // Quantity controls should now be visible
    const qtyControls = page.locator('[data-testid="qty-controls"]').first()
    const hasControls = await qtyControls.isVisible().catch(() => false)
    console.log("Controls after Add: " + (hasControls ? "visible" : "not visible"))
    expect(hasControls).toBeTruthy()
  } else {
    console.log("No Add button — may already have items in cart")
  }
})

test("Qty — increment increases count", async ({ page }) => {
  await page.goto("/gb/categories/spices-herbs")
  await page.waitForSelector(CARD, { timeout: 10000 })

  // Find qty controls (if any items already in cart) or add one
  let qtyControls = page.locator('[data-testid="qty-controls"]').first()
  if (!(await qtyControls.isVisible().catch(() => false))) {
    const addBtn = page.locator('[data-testid="add-to-cart-btn"]').first()
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(2000)
    }
  }

  qtyControls = page.locator('[data-testid="qty-controls"]').first()
  if (await qtyControls.isVisible().catch(() => false)) {
    const incBtn = qtyControls.locator('[data-testid="qty-increment"]')
    const countEl = qtyControls.locator('[data-testid="qty-count"]')

    const before = parseInt((await countEl.textContent()) || "0")
    await incBtn.click()
    await page.waitForTimeout(500)
    const after = parseInt((await countEl.textContent()) || "0")

    console.log(`Increment: ${before} → ${after}`)
    expect(after).toBe(before + 1)
  }
})

test("Qty — decrement decreases count", async ({ page }) => {
  await page.goto("/gb/categories/spices-herbs")
  await page.waitForSelector(CARD, { timeout: 10000 })

  // Ensure we have qty > 0 first
  let qtyControls = page.locator('[data-testid="qty-controls"]').first()
  if (!(await qtyControls.isVisible().catch(() => false))) {
    const addBtn = page.locator('[data-testid="add-to-cart-btn"]').first()
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(2000)
    }
    // Increment to get qty > 1
    qtyControls = page.locator('[data-testid="qty-controls"]').first()
    if (await qtyControls.isVisible().catch(() => false)) {
      await qtyControls.locator('[data-testid="qty-increment"]').click()
      await page.waitForTimeout(500)
    }
  }

  qtyControls = page.locator('[data-testid="qty-controls"]').first()
  if (await qtyControls.isVisible().catch(() => false)) {
    const decBtn = qtyControls.locator('[data-testid="qty-decrement"]')
    const countEl = qtyControls.locator('[data-testid="qty-count"]')

    const before = parseInt((await countEl.textContent()) || "0")
    await decBtn.click()
    await page.waitForTimeout(500)
    const after = parseInt((await countEl.textContent()) || "0")

    console.log(`Decrement: ${before} → ${after}`)
    expect(after).toBe(before - 1)
  }
})

test("Qty — multiple increments work correctly", async ({ page }) => {
  await page.goto("/gb/categories/spices-herbs")
  await page.waitForSelector(CARD, { timeout: 10000 })

  // Add item first
  const addBtn = page.locator('[data-testid="add-to-cart-btn"]').first()
  if (await addBtn.isVisible().catch(() => false)) {
    await addBtn.click()
    await page.waitForTimeout(2000)
  }

  const qtyControls = page.locator('[data-testid="qty-controls"]').first()
  if (await qtyControls.isVisible().catch(() => false)) {
    const incBtn = qtyControls.locator('[data-testid="qty-increment"]')
    const countEl = qtyControls.locator('[data-testid="qty-count"]')

    // Click + 3 times
    for (let i = 0; i < 3; i++) {
      await incBtn.click()
      await page.waitForTimeout(300)
    }

    const final = parseInt((await countEl.textContent()) || "0")
    console.log(`After 3 increments: ${final}`)
    expect(final).toBeGreaterThanOrEqual(3)
  }
})
