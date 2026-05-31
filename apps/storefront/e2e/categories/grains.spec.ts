import { test, expect } from "@playwright/test"

const TITLE = '[data-testid="product-title"]'
const CARD = ".product-card"

test("Grains parent — rice at top", async ({ page }) => {
  await page.goto("/categories/grains"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  expect(titles.length).toBeGreaterThanOrEqual(30)
  const first = titles.slice(0, 5).join(" ").toLowerCase()
  expect(first).toMatch(/rice|basmati|sona|ponni|idli|powa|mamra/)
})

test("Rice & Quinoa child", async ({ page }) => {
  await page.goto("/categories/rice-quinoa"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  expect(titles.length).toBeGreaterThanOrEqual(10)
  for (const t of titles) expect(t?.toLowerCase()).toMatch(/rice|basmati|sona|ponni|idli|quinoa|powa|mamra|parboiled|long grain/)
})

test("Corn child", async ({ page }) => {
  await page.goto("/categories/corn"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  expect(titles.length).toBeGreaterThanOrEqual(1)
  for (const t of titles) expect(t?.toLowerCase()).toMatch(/popcorn|corn/)
})

test("Flour & Milk Powder child", async ({ page }) => {
  await page.goto("/categories/flour-milk-powder"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  expect(titles.length).toBeGreaterThanOrEqual(14)
  for (const t of titles) expect(t?.toLowerCase()).toMatch(/flour|atta|besan|maida|semolina|sooji|rava|cornmeal|maize|ground rice|millet|ragi|bajri|milk powder/)
})
