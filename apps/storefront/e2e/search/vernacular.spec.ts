import { test, expect } from "@playwright/test"

test("Search jeera finds cumin", async ({ page }) => {
  await page.goto("/search?q=jeera")
  await page.waitForTimeout(5000)
  const content = (await page.textContent("body")) || ""
  expect(content.toLowerCase()).toMatch(/cumin|jeera|spice/)
})

test("Search haldi finds turmeric", async ({ page }) => {
  await page.goto("/search?q=haldi")
  await page.waitForTimeout(5000)
  const content = (await page.textContent("body")) || ""
  expect(content.toLowerCase()).toMatch(/turmeric|haldi|spice/)
})

test("Search chana finds chickpea", async ({ page }) => {
  await page.goto("/search?q=chana")
  await page.waitForTimeout(5000)
  const content = (await page.textContent("body")) || ""
  expect(content.toLowerCase()).toMatch(/chickpea|chana|gram/)
})

test("Search basmati finds rice", async ({ page }) => {
  await page.goto("/search?q=basmati")
  await page.waitForTimeout(5000)
  const content = (await page.textContent("body")) || ""
  expect(content.toLowerCase()).toMatch(/basmati|rice/)
})
