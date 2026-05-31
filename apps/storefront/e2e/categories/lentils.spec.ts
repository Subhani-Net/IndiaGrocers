import { test, expect } from "@playwright/test"
const TITLE = '[data-testid="product-title"]'
const CARD = ".product-card"

test("Lentils parent", async ({ page }) => {
  await page.goto("/categories/lentils"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  expect(titles.length).toBeGreaterThanOrEqual(35)
})

test("Lentils — Dried Lentils, Beans & Peas child", async ({ page }) => {
  await page.goto("/categories/dried-lentils-beans-peas"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  expect(titles.length).toBeGreaterThanOrEqual(30)
})

test("Lentils — Soya Products child", async ({ page }) => {
  await page.goto("/categories/soya-products"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  expect(titles.length).toBeGreaterThanOrEqual(3)
  for (const t of titles) expect(t?.toLowerCase()).toMatch(/soya/)
})

test("Lentils — All Lentils & Beans fallback", async ({ page }) => {
  await page.goto("/categories/all-lentils-beans"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  expect(titles.length).toBeGreaterThanOrEqual(35)
})
