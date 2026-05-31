import { test, expect } from "@playwright/test"
const TITLE = '[data-testid="product-title"]'
const CARD = ".product-card"

test("Spices parent", async ({ page }) => {
  await page.goto("/categories/spices"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  expect(titles.length).toBeGreaterThanOrEqual(100)
})

test("Spices — Spices & Herbs child", async ({ page }) => {
  await page.goto("/categories/spices-herbs"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  expect(titles.length).toBeGreaterThanOrEqual(50)
})

test("Spices — Spice & Herb Jars child", async ({ page }) => {
  await page.goto("/categories/spice-herb-jars"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  expect(titles.length).toBeGreaterThanOrEqual(15)
})

test("Spices — Spice Blends & Mixes child", async ({ page }) => {
  await page.goto("/categories/spice-blends-mixes"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  expect(titles.length).toBeGreaterThanOrEqual(10)
})

test("Spices — Food Colourings & Essences child", async ({ page }) => {
  await page.goto("/categories/food-colourings-essences"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  expect(titles.length).toBeGreaterThanOrEqual(15)
})
