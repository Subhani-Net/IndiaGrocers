import { test, expect } from "@playwright/test"

const TITLE = '[data-testid="product-full-title"]'
const CARD = ".product-card"
const WAIT = 15000

test("Search jeera finds cumin", async ({ page }) => {
  await page.goto("/search?q=jeera")
  await page.waitForSelector(CARD, { timeout: WAIT }).catch(() => {})
  await page.waitForTimeout(1000)
  const content = (await page.textContent("body")) || ""
  expect(content.toLowerCase()).toMatch(/cumin|jeera|spice/)

  const titles = await page.locator(TITLE).allTextContents()
  console.log(titles)
  expect(titles).toContain("TRS Cumin Seeds")
  expect(titles).toContain("Natco - Cumin Seeds 400g")
  expect(titles).toContain("TRS Cumin Powder")
  expect(titles).toContain("Natco - Cumin Ground 400g")
  expect(titles).toContain("Natco - Cumin Ground 100g")
  expect(titles).toContain("Natco - Cumin Seeds Jar 100g")
  expect(titles).toContain("Natco - Cumin Ground Jar 70g")
  expect(titles).toContain("Natco - Cumin Seeds Black 100g")
})

test("Search haldi finds turmeric", async ({ page }) => {
  await page.goto("/search?q=haldi")
  await page.waitForSelector(CARD, { timeout: WAIT }).catch(() => {})
  await page.waitForTimeout(1000)
  const content = (await page.textContent("body")) || ""
  expect(content.toLowerCase()).toMatch(/turmeric|haldi|spice/i)

  const titles = await page.locator(TITLE).allTextContents()
  console.log(titles)
  expect(titles).toContain("Natco - Turmeric Powder 400g")
  expect(titles).toContain("Natco - Turmeric Powder Jar 100g")
})

test("Search chana finds chickpea", async ({ page }) => {
  await page.goto("/search?q=chana")
  await page.waitForSelector(CARD, { timeout: WAIT }).catch(() => {})
  await page.waitForTimeout(1000)
  const content = (await page.textContent("body")) || ""
  expect(content.toLowerCase()).toMatch(/chickpea|chana|gram/i)

  const titles = await page.locator(TITLE).allTextContents()
  console.log(titles)
  expect(titles).toContain("Natco - Chana Masala Mangal 100g")
  expect(titles).toContain("Natco - Chanadal Polished 2kg")
  expect(titles).toContain("Natco - Chanadal Polished 1kg")
  expect(titles).toContain("Natco - Chick Peas 2kg")
  expect(titles).toContain("Natco - Brown Chick Peas 2kg")
  expect(titles).toContain("Natco - Brown Chick Peas 500g")
  expect(titles).toContain("Natco - Kala Chana Boiled 400g")
})

test("Search basmati finds rice", async ({ page }) => {
  await page.goto("/search?q=basmati")
  await page.waitForSelector(CARD, { timeout: WAIT }).catch(() => {})
  await page.waitForTimeout(1000)
  const content = (await page.textContent("body")) || ""
  expect(content.toLowerCase()).toMatch(/basmati|rice/i)

  const titles = await page.locator(TITLE).allTextContents()
  console.log(titles)
  expect(titles).toContain("Natco - Basmati Rice India - Bag 5kg")
  expect(titles).toContain("Natco - Basmati Rice Kernel 5kg")
  expect(titles).toContain("Natco - Basmati Rice India 2kg")
  expect(titles).toContain("Tilda Pure Basmati")
})
