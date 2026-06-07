import { test, expect } from "@playwright/test"

/**
 * SEARCH TOP RESULTS — Hardcoded baseline for common search terms.
 * Validates top-10 results after MVC tag enrichment and MeiliSearch reindex.
 *
 * Uses [data-testid="product-full-title"] on ProductCards (hidden span with full title).
 * Update these lists when catalog, tags, or MeiliSearch ranking rules change.
 */
const TITLE = '[data-testid="product-full-title"]'
const CARD = ".product-card"

test("Search 'jeera' — cumin products, top 10", async ({ page }) => {
  await page.goto("/search?q=jeera")
  await page.waitForSelector(CARD, { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(1000)
  const titles = await page.locator(TITLE).allTextContents()
  console.log(`jeera: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(10)

  expect(titles).toContain("Natco - Cumin Seeds Jar 100g")
  expect(titles).toContain("Natco - Cumin Seeds Black 100g")
  expect(titles).toContain("Natco - Cumin Ground 400g")
  expect(titles).toContain("Natco - Cumin Ground Jar 70g")
  expect(titles).toContain("Natco - Cumin Seeds 400g")
  expect(titles).toContain("Natco - Cumin Ground 100g")
  expect(titles).toContain("TRS Cumin Powder")
  expect(titles).toContain("TRS Cumin Seeds")
  expect(titles).toContain("Natco - Pappadoms Jeera (Microwavable) 200g")
  expect(titles).toContain("Natco - Coriander Ground 400g")
})

test("Search 'haldi' — turmeric products, top 8", async ({ page }) => {
  await page.goto("/search?q=haldi")
  await page.waitForSelector(CARD, { timeout: 15000 }).catch(() => {})
  const titles = await page.locator(TITLE).allTextContents()
  console.log(`haldi: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(8)

  expect(titles).toContain("Natco - Turmeric Powder 400g")
  expect(titles).toContain("Natco - Turmeric Powder Jar 100g")
  expect(titles).toContain("Haldiram's Aloo Bhujia")
  expect(titles).toContain("Haldiram's Moong Dal")
  expect(titles).toContain("Haldiram's All In One Mix")
  expect(titles).toContain("Haldiram's Khatta Meetha Mix")
  expect(titles).toContain("Haldiram's Dalmoth")
  expect(titles).toContain("Haldiram's Bhujia Sev")
})

test("Search 'chana' — chickpea products, top 10", async ({ page }) => {
  await page.goto("/search?q=chana")
  await page.waitForSelector(CARD, { timeout: 15000 }).catch(() => {})
  const titles = await page.locator(TITLE).allTextContents()
  console.log(`chana: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(10)

  expect(titles).toContain("Natco - Chanadal Polished 2kg")
  expect(titles).toContain("Natco - Chanadal Polished 1kg")
  expect(titles).toContain("Natco - Chana Masala Mangal 100g")
  expect(titles).toContain("Natco - Kala Chana Boiled 400g")
  expect(titles).toContain("Natco - Brown Chick Peas 2kg")
  expect(titles).toContain("Natco - Brown Chick Peas 500g")
  expect(titles).toContain("Natco - Chick Peas 2.5kg")
  expect(titles).toContain("Natco - Bhel Puri Kit 500g")
  expect(titles).toContain("Natco - Chick Peas 2kg")
  expect(titles).toContain("Natco - Gram Roasted Unsalted 300g")
})

test("Search 'basmati' — basmati rice products, top 10", async ({ page }) => {
  await page.goto("/search?q=basmati")
  await page.waitForSelector(CARD, { timeout: 15000 }).catch(() => {})
  const titles = await page.locator(TITLE).allTextContents()
  console.log(`basmati: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(10)

  expect(titles).toContain("Natco - Basmati Rice India 2kg")
  expect(titles).toContain("Natco - Basmati Rice India - Bag 5kg")
  expect(titles).toContain("Natco - Basmati Rice Kernel 5kg")
  expect(titles).toContain("Tilda Pure Basmati")
  expect(titles).toContain("Kohinoor Extra Long Basmati")
  expect(titles).toContain("Daawat Rozana Basmati")
  expect(titles).toContain("Lal Qilla Premium Basmati")
  expect(titles).toContain("Falak Super Basmati")
  expect(titles).toContain("Tilda Pure Basmati 5kg")
  expect(titles).toContain("Tilda Pure Basmati 10kg")
})

test("Search 'besan' — gram flour, top 10", async ({ page }) => {
  await page.goto("/search?q=besan")
  await page.waitForSelector(CARD, { timeout: 15000 }).catch(() => {})
  const titles = await page.locator(TITLE).allTextContents()
  console.log(`besan: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(10)

  expect(titles).toContain("Natco - Gram Flour Superfine 1kg")
  expect(titles).toContain("Natco - Gram Flour Superfine 500g")
  expect(titles).toContain("Natco - Gram Flour (Papa brand) 2kg")
  expect(titles).toContain("Natco - Gram Flour Superfine 2kg")
  expect(titles).toContain("TRS Pure Gram Flour")
  expect(titles).toContain("Bikaji Bhujia")
  expect(titles).toContain("Bikaji Khatta Meetha")
  expect(titles).toContain("Haldiram's Aloo Bhujia")
  expect(titles).toContain("Haldiram's Khatta Meetha Mix")
  expect(titles).toContain("Haldiram's Bhujia Sev")
})

test("Search 'rice' — rice products, top 10", async ({ page }) => {
  await page.goto("/search?q=rice")
  await page.waitForSelector(CARD, { timeout: 15000 }).catch(() => {})
  const titles = await page.locator(TITLE).allTextContents()
  console.log(`rice: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(10)

  expect(titles).toContain("TRS Ground Rice")
  expect(titles).toContain("Natco - Basmati Rice India 2kg")
  expect(titles).toContain("Natco - Basmati Rice India - Bag 5kg")
  expect(titles).toContain("Natco - Basmati Rice Kernel 5kg")
  expect(titles).toContain("Natco - Long Grain White Rice 5kg")
  expect(titles).toContain("Natco - Easycook Parboiled Rice 5kg")
  expect(titles).toContain("Natco - Sona Masuri Rice 5kg")
  expect(titles).toContain("Natco - Ponni Rice 5kg")
  expect(titles).toContain("Natco - Idli Rice 5kg")
  expect(titles).toContain("Natco - Powa Medium (Flaked Rice) 1kg")
})

test("Search 'dal' — lentil/dal products, top 10", async ({ page }) => {
  await page.goto("/search?q=dal")
  await page.waitForSelector(CARD, { timeout: 15000 }).catch(() => {})
  const titles = await page.locator(TITLE).allTextContents()
  console.log(`dal: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(10)

  expect(titles).toContain("Natco - Mung Dal Yellow 2kg")
  expect(titles).toContain("Natco - Toor Dal Oily 2kg")
  expect(titles).toContain("Natco - Toor Dal Oily 1kg")
  expect(titles).toContain("Natco - Toor Dal Plain 2kg")
  expect(titles).toContain("Natco - Toor Dal Plain 500g")
  expect(titles).toContain("Natco - Urid Dal White 2kg")
  expect(titles).toContain("Natco - Urid Dal White 1kg")
  expect(titles).toContain("MDH Dal Makhani Masala")
  expect(titles).toContain("Haldiram's Dalmoth")
  expect(titles).toContain("TRS Mung Dal")
})

test("Search 'masala' — spice blends, top 10", async ({ page }) => {
  await page.goto("/search?q=masala")
  await page.waitForSelector(CARD, { timeout: 15000 }).catch(() => {})
  const titles = await page.locator(TITLE).allTextContents()
  console.log(`masala: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(10)

  expect(titles).toContain("Shan Karahi Gosht Masala")
  expect(titles).toContain("Shan Nihari Masala")
  expect(titles).toContain("Shan Korma Masala")
  expect(titles).toContain("Shan Butter Chicken Masala")
  expect(titles).toContain("Shan Chicken Tikka Masala")
  expect(titles).toContain("Shan Chana Masala")
  expect(titles).toContain("Shan Daal Masala")
  expect(titles).toContain("Shan Achar Gosht Masala")
  expect(titles).toContain("Shan Keema Masala")
  expect(titles).toContain("MDH Kitchen King Masala")
})

test("Search 'mango' — mango products, top 10", async ({ page }) => {
  await page.goto("/search?q=mango")
  await page.waitForSelector(CARD, { timeout: 15000 }).catch(() => {})
  const titles = await page.locator(TITLE).allTextContents()
  console.log(`mango: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(10)

  expect(titles).toContain("TRS Mango Powder (Amchoor)")
  expect(titles).toContain("Patak's Mango Chutney")
  expect(titles).toContain("Maaza Mango Drink")
  expect(titles).toContain("Frooti Mango")
  expect(titles).toContain("Parle Mango Bite")
  expect(titles).toContain("Natco - Mango Chutney Spicy 340g")
  expect(titles).toContain("Natco - Mango Pickle Hot 300g")
  expect(titles).toContain("Natco - Mango Chutney Sweet 340g")
  expect(titles).toContain("Natco - Mango Pulp Alphonso 450g")
  expect(titles).toContain("Natco - Mango Slices Alphonso 425g")
})

test("Search 'coconut' — coconut products, top 10", async ({ page }) => {
  await page.goto("/search?q=coconut")
  await page.waitForSelector(CARD, { timeout: 15000 }).catch(() => {})
  const titles = await page.locator(TITLE).allTextContents()
  console.log(`coconut: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(10)

  expect(titles).toContain("TRS Fine Desiccated Coconut")
  expect(titles).toContain("Natco - Coconut Cream 400ml")
  expect(titles).toContain("Natco - Coconut Flour 200g")
  expect(titles).toContain("Natco - Coconut Flour 1kg")
  expect(titles).toContain("Natco - Coconut Milk 400ml")
  expect(titles).toContain("Natco - Coconut Milk Light 400ml")
  expect(titles).toContain("Natco - Coconut Oil (Parachute Brand) 500ml")
  expect(titles).toContain("Natco - Coconut Desicated Medium 1kg")
  expect(titles).toContain("Natco - Coconut Desiccated (Fine) 300g")
  expect(titles).toContain("Natco - Coconut Milk Powder 300g")
})

test("Search 'papad' — pappadoms, top 7", async ({ page }) => {
  await page.goto("/search?q=papad")
  await page.waitForSelector(CARD, { timeout: 15000 }).catch(() => {})
  const titles = await page.locator(TITLE).allTextContents()
  console.log(`papad: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(7)

  expect(titles).toContain("Natco - Pappadoms Madras (Coin size) 200g")
  expect(titles).toContain("Natco - Pappadoms Black Pepper 200g")
  expect(titles).toContain("Natco - Pappadoms Jeera (Microwavable) 200g")
  expect(titles).toContain("Natco - Pappadoms Plain (Microwavable) 200g")
  expect(titles).toContain("Natco - Pappadoms Punjabi (Microwavable) 200g")
  expect(titles).toContain("Natco - Pappadoms Madras (Papa Brand) 250g")
  expect(titles).toContain("Natco - Gram Flour (Papa brand) 2kg")
})

test("Search 'pickle' — pickle products, top 10", async ({ page }) => {
  await page.goto("/search?q=pickle")
  await page.waitForSelector(CARD, { timeout: 15000 }).catch(() => {})
  const titles = await page.locator(TITLE).allTextContents()
  console.log(`pickle: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(10)

  expect(titles).toContain("Natco - Pickle Masala Mangal 125g")
  expect(titles).toContain("Natco - Mixed Pickle 300g")
  expect(titles).toContain("Natco - Mango Pickle Hot 300g")
  expect(titles).toContain("Natco - Chilli Pickle Hot 300g")
  expect(titles).toContain("Natco - Lime Pickle Hot 300g")
  expect(titles).toContain("Natco - Garlic Pickle 300g")
  expect(titles).toContain("Natco - Mango Chutney Spicy 340g")
  expect(titles).toContain("Natco - Tamarind Sauce 340g")
  expect(titles).toContain("Natco - Garlic &amp; Chilli Sauce 340g")
  expect(titles).toContain("Natco - Tamarind &amp; Date Sauce 340g")
})

test("Search 'ghee' — ghee products, top 10", async ({ page }) => {
  await page.goto("/search?q=ghee")
  await page.waitForSelector(CARD, { timeout: 15000 }).catch(() => {})
  const titles = await page.locator(TITLE).allTextContents()
  console.log(`ghee: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(10)

  expect(titles).toContain("Natco - Ghee Pure (Plough brand) 500g")
  expect(titles).toContain("Natco - Ghee Pure Butter 1kg")
  expect(titles).toContain("Natco - Pure Mustard Oil 250ml")
  expect(titles).toContain("Natco - Pure Mustard Oil 1Ltr")
  expect(titles).toContain("Natco - Coconut Oil (Parachute Brand) 500ml")
  expect(titles).toContain("Natco - Almond Oil 500ml")
  expect(titles).toContain("Natco - Almond Oil 250ml")
  expect(titles).toContain("Natco - Castor Oil 250ml")
  expect(titles).toContain("Natco - Pure Linseed Oil 250ml")
  expect(titles).toContain("Natco - Groundnut Oil 1 Litre")
})

test("Search 'almond' — almond products, top 10", async ({ page }) => {
  await page.goto("/search?q=almond")
  await page.waitForSelector(CARD, { timeout: 15000 }).catch(() => {})
  const titles = await page.locator(TITLE).allTextContents()
  console.log(`almond: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(10)

  expect(titles).toContain("Natco - Almond Flavouring Essence 28ml")
  expect(titles).toContain("Natco - Almonds Ground 300g")
  expect(titles).toContain("Natco - Almond Oil 500ml")
  expect(titles).toContain("Natco - Almond Oil 250ml")
  expect(titles).toContain("Natco - Almond Blanched Whole 250g")
  expect(titles).toContain("Natco - Almond Flakes 1kg")
  expect(titles).toContain("Natco - Almond Flakes 300g")
  expect(titles).toContain("Natco - Almonds 1kg")
  expect(titles).toContain("Natco - Almonds 400g")
  expect(titles).toContain("Natco - Blanched Almond Whole 700g")
})

test("Search 'toor' — toor dal products, top 5", async ({ page }) => {
  await page.goto("/search?q=toor")
  await page.waitForSelector(CARD, { timeout: 15000 }).catch(() => {})
  const titles = await page.locator(TITLE).allTextContents()
  console.log(`toor: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(5)

  expect(titles).toContain("Natco - Toor Dal Oily 2kg")
  expect(titles).toContain("Natco - Toor Dal Oily 1kg")
  expect(titles).toContain("Natco - Toor Dal Plain 2kg")
  expect(titles).toContain("Natco - Toor Dal Plain 500g")
  expect(titles).toContain("TRS Toor Dal")
})

test("Search 'atta' — chapati flour products, top 3", async ({ page }) => {
  await page.goto("/search?q=atta")
  await page.waitForSelector(CARD, { timeout: 15000 }).catch(() => {})
  const titles = await page.locator(TITLE).allTextContents()
  console.log(`atta: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(3)

  expect(titles).toContain("Natco - Chakki Atta Multigrain 5kg")
  expect(titles).toContain("Natco - Chapati Flour White 1.5kg")
  expect(titles).toContain("Natco - Chapati Flour Medium 1.5kg")
})
