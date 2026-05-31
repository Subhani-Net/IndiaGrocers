import { test, expect } from "@playwright/test"
const TITLE = '[data-testid="product-title"]'
const CARD = ".product-card"

test("Nuts & Seeds parent — no flours", async ({ page }) => {
  await page.goto("/categories/nuts-seeds"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  expect(titles.length).toBeGreaterThanOrEqual(30)
  const noFlour = titles.every((t) => !t?.toLowerCase().includes("flour") || t?.toLowerCase().includes("coconut flour"))
  expect(noFlour).toBeTruthy()
})

test("Nuts & Seeds — Raw Nuts child", async ({ page }) => {
  await page.goto("/categories/raw-nuts"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  expect(titles.length).toBeGreaterThanOrEqual(15)
  for (const t of titles) expect(t?.toLowerCase()).toMatch(/almond|cashew|walnut|pecan|pine|peanut|pistachio|monkey|fruit|nut/)
})

test("Nuts & Seeds — Seeds child — no flours or nuts", async ({ page }) => {
  await page.goto("/categories/seeds"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  expect(titles.length).toBeGreaterThanOrEqual(10)
  for (const t of titles) {
    expect(t?.toLowerCase()).not.toMatch(/flour|atta|besan|maida/)
    expect(t?.toLowerCase()).not.toMatch(/cashew|almond|walnut/)
  }
})
