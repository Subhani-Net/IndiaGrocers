import { test, expect } from "@playwright/test"
const TITLE = '[data-testid="product-title"]'
const CARD = ".product-card"

/**
 * EXPECTED PRODUCT LISTS — data validation baseline.
 * Update these product expectations when catalog changes.
 * Last synced from MeiliSearch index: May 2026.
 */

test("Snacks parent — exhaustive product list validation", async ({ page }) => {
  await page.goto("/categories/snacks"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Snacks: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(38)

  // pappadoms (6)
  expect(titles).toContain("Natco - Pappadoms Black Pepper 200g")
  expect(titles).toContain("Natco - Pappadoms Jeera (Microwavable) 200g")
  expect(titles).toContain("Natco - Pappadoms Madras (Coin size) 200g")
  expect(titles).toContain("Natco - Pappadoms Madras (Papa Brand) 250g")
  expect(titles).toContain("Natco - Pappadoms Plain (Microwavable) 200g")
  expect(titles).toContain("Natco - Pappadoms Punjabi (Microwavable) 200g")

  // chutneys-pickles-sauces (16)
  expect(titles).toContain("Natco - Bombay Sandwich Spread 280g")
  expect(titles).toContain("Natco - Brinjal Chutney Sweet 300g")
  expect(titles).toContain("Natco - Chilli Pickle Hot 300g")
  expect(titles).toContain("Natco - Chilli Sauce Hot 310g")
  expect(titles).toContain("Natco - Chundo Chutney Sweet 340g")
  expect(titles).toContain("Natco - Coriander Mint Sauce 340g")
  expect(titles).toContain("Natco - Garlic &amp; Chilli Sauce 340g")
  expect(titles).toContain("Natco - Garlic Pickle 300g")
  expect(titles).toContain("Natco - Gorkeri Chutney Sweet 300g")
  expect(titles).toContain("Natco - Lime Pickle Hot 300g")
  expect(titles).toContain("Natco - Mango Chutney Spicy 340g")
  expect(titles).toContain("Natco - Mango Chutney Sweet 340g")
  expect(titles).toContain("Natco - Mango Pickle Hot 300g")
  expect(titles).toContain("Natco - Mixed Pickle 300g")
  expect(titles).toContain("Natco - Tamarind &amp; Date Sauce 340g")
  expect(titles).toContain("Natco - Tamarind Sauce 340g")

  // namkeen-lentil-snacks (6)
  expect(titles).toContain("Natco - Bhel Puri Kit 500g")
  expect(titles).toContain("Natco - Daria Dal 300g")
  expect(titles).toContain("Natco - Daria Gotta (Large) 700g")
  expect(titles).toContain("Natco - Daria Gotta (Small) 300g")
  expect(titles).toContain("Natco - Gram Roasted Salted 300g")
  expect(titles).toContain("Natco - Gram Roasted Unsalted 300g")

  // flavoured-nuts-snacks (11)
  expect(titles).toContain("Natco - Big D Honey Roast Peanuts 12x50g Packs on a Pub Card")
  expect(titles).toContain("Natco - Big D Salted Cashews 12x30g Cards")
  expect(titles).toContain("Natco - Big D Salted Peanuts 24x50g")
  expect(titles).toContain("Natco - Cashew Roasted Salted 250g")
  expect(titles).toContain("Natco - Peanut Gachak (Peanut Brittle) 400g")
  expect(titles).toContain("Natco - Pistachio Kernels 100g")
  expect(titles).toContain("Natco - Pistachio Kernels 1kg")
  expect(titles).toContain("Natco - Pistachio Kernels 250g")
  expect(titles).toContain("Natco - Roasted &amp; Salted Pistachio Nuts 100g")
  expect(titles).toContain("Natco - Roasted &amp; Salted Pistachio Nuts 1kg")
  expect(titles).toContain("Natco - Roasted &amp; Salted Pistachio Nuts 300g")
})

test("Snacks — Pappadoms child", async ({ page }) => {
  await page.goto("/categories/pappadoms"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Pappadoms: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(6)

  expect(titles).toContain("Natco - Pappadoms Black Pepper 200g")
  expect(titles).toContain("Natco - Pappadoms Jeera (Microwavable) 200g")
  expect(titles).toContain("Natco - Pappadoms Madras (Coin size) 200g")
  expect(titles).toContain("Natco - Pappadoms Madras (Papa Brand) 250g")
  expect(titles).toContain("Natco - Pappadoms Plain (Microwavable) 200g")
  expect(titles).toContain("Natco - Pappadoms Punjabi (Microwavable) 200g")
})

test("Snacks — Chutneys, Pickles & Sauces child", async ({ page }) => {
  await page.goto("/categories/chutneys-pickles-sauces"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Chutneys, Pickles & Sauces: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(14)

  expect(titles).toContain("Natco - Bombay Sandwich Spread 280g")
  expect(titles).toContain("Natco - Brinjal Chutney Sweet 300g")
  expect(titles).toContain("Natco - Chilli Pickle Hot 300g")
  expect(titles).toContain("Natco - Chilli Sauce Hot 310g")
  expect(titles).toContain("Natco - Chundo Chutney Sweet 340g")
  expect(titles).toContain("Natco - Coriander Mint Sauce 340g")
  expect(titles).toContain("Natco - Garlic &amp; Chilli Sauce 340g")
  expect(titles).toContain("Natco - Garlic Pickle 300g")
  expect(titles).toContain("Natco - Gorkeri Chutney Sweet 300g")
  expect(titles).toContain("Natco - Lime Pickle Hot 300g")
  expect(titles).toContain("Natco - Mango Chutney Spicy 340g")
  expect(titles).toContain("Natco - Mango Chutney Sweet 340g")
  expect(titles).toContain("Natco - Mango Pickle Hot 300g")
  expect(titles).toContain("Natco - Mixed Pickle 300g")
  expect(titles).toContain("Natco - Tamarind &amp; Date Sauce 340g")
  expect(titles).toContain("Natco - Tamarind Sauce 340g")
})

test("Snacks — Namkeen & Lentil Snacks child", async ({ page }) => {
  await page.goto("/categories/namkeen-lentil-snacks"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Namkeen & Lentil Snacks: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(6)

  expect(titles).toContain("Natco - Bhel Puri Kit 500g")
  expect(titles).toContain("Natco - Daria Dal 300g")
  expect(titles).toContain("Natco - Daria Gotta (Large) 700g")
  expect(titles).toContain("Natco - Daria Gotta (Small) 300g")
  expect(titles).toContain("Natco - Gram Roasted Salted 300g")
  expect(titles).toContain("Natco - Gram Roasted Unsalted 300g")
})

test("Snacks — Flavoured Nuts child", async ({ page }) => {
  await page.goto("/categories/flavoured-nuts-snacks"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Flavoured Nuts: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(10)

  expect(titles).toContain("Natco - Big D Honey Roast Peanuts 12x50g Packs on a Pub Card")
  expect(titles).toContain("Natco - Big D Salted Cashews 12x30g Cards")
  expect(titles).toContain("Natco - Big D Salted Peanuts 24x50g")
  expect(titles).toContain("Natco - Cashew Roasted Salted 250g")
  expect(titles).toContain("Natco - Peanut Gachak (Peanut Brittle) 400g")
  expect(titles).toContain("Natco - Pistachio Kernels 100g")
  expect(titles).toContain("Natco - Pistachio Kernels 1kg")
  expect(titles).toContain("Natco - Pistachio Kernels 250g")
  expect(titles).toContain("Natco - Roasted &amp; Salted Pistachio Nuts 100g")
  expect(titles).toContain("Natco - Roasted &amp; Salted Pistachio Nuts 1kg")
  expect(titles).toContain("Natco - Roasted &amp; Salted Pistachio Nuts 300g")
})
