import { test, expect } from "@playwright/test"
const TITLE = '[data-testid="product-title"]'
const CARD = ".product-card"

test("Snacks parent — no pickle masala or pastes", async ({ page }) => {
  await page.goto("/categories/snacks"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  expect(titles.length).toBeGreaterThanOrEqual(30)
  for (const t of titles) {
    expect(t?.toLowerCase()).not.toMatch(/pickle masala|garlic paste|ginger paste/)
  }
})

test("Snacks — Pappadoms child", async ({ page }) => {
  await page.goto("/categories/pappadoms"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  expect(titles.length).toBeGreaterThanOrEqual(6)
  for (const t of titles) expect(t?.toLowerCase()).toMatch(/papad|pappad/)
})
