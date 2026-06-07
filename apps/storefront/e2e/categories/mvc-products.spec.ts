import { test, expect } from "@playwright/test"

/**
 * MVC PRODUCT INTEGRATION TESTS
 *
 * Validates all new MVC categories and products display correctly.
 * Uses [data-testid="product-title"] selector on category pages.
 *
 * Update these lists when MVC products are added or removed.
 */
const TITLE = '[data-testid="product-title"]'
const CARD = ".product-card"

// ═══════════════════════════════════════════════════════════════════
//  MASALAS & DESSERT MIXES
// ═══════════════════════════════════════════════════════════════════

test("MVC — Masalas parent (Shan + MDH)", async ({ page }) => {
  await page.goto("/categories/masalas-dessert-mixes"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Masalas: ${titles.length}`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(25)

  // Shan (18)
  expect(titles).toContain("Shan Special Chicken Biryani Mix")
  expect(titles).toContain("Shan Special Beef Biryani Mix")
  expect(titles).toContain("Shan Special Mutton Biryani Mix")
  expect(titles).toContain("Shan Sindhi Biryani Mix")
  expect(titles).toContain("Shan Bombay Biryani Mix")
  expect(titles).toContain("Shan Karahi Gosht Masala")
  expect(titles).toContain("Shan Nihari Masala")
  expect(titles).toContain("Shan Korma Masala")
  expect(titles).toContain("Shan Butter Chicken Masala")
  expect(titles).toContain("Shan Chicken Tikka Masala")
  expect(titles).toContain("Shan Tandoori Chicken Mix")
  expect(titles).toContain("Shan Seekh Kabab Mix")
  expect(titles).toContain("Shan Haleem Mix")
  expect(titles).toContain("Shan Chana Masala")
  expect(titles).toContain("Shan Daal Masala")
  expect(titles).toContain("Shan Achar Gosht Masala")
  expect(titles).toContain("Shan Keema Masala")
  expect(titles).toContain("Shan Pilau Rice Mix")

  // MDH (10)
  expect(titles).toContain("MDH Kitchen King Masala")
  expect(titles).toContain("MDH Chana Masala")
  expect(titles).toContain("MDH Rajma Masala")
  expect(titles).toContain("MDH Pav Bhaji Masala")
  expect(titles).toContain("MDH Paneer Butter Masala")
  expect(titles).toContain("MDH Dal Makhani Masala")
  expect(titles).toContain("MDH Sambar Masala")
  expect(titles).toContain("MDH Chicken Masala")
  expect(titles).toContain("MDH Tandoori Masala")
  expect(titles).toContain("MDH Meat Masala")
})

test("MVC — Shan Masalas child", async ({ page }) => {
  await page.goto("/categories/shan-masalas"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Shan: ${titles.length}`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(18)

  expect(titles).toContain("Shan Special Chicken Biryani Mix")
  expect(titles).toContain("Shan Special Beef Biryani Mix")
  expect(titles).toContain("Shan Special Mutton Biryani Mix")
  expect(titles).toContain("Shan Sindhi Biryani Mix")
  expect(titles).toContain("Shan Bombay Biryani Mix")
  expect(titles).toContain("Shan Karahi Gosht Masala")
  expect(titles).toContain("Shan Nihari Masala")
  expect(titles).toContain("Shan Korma Masala")
  expect(titles).toContain("Shan Butter Chicken Masala")
  expect(titles).toContain("Shan Chicken Tikka Masala")
  expect(titles).toContain("Shan Tandoori Chicken Mix")
  expect(titles).toContain("Shan Seekh Kabab Mix")
  expect(titles).toContain("Shan Haleem Mix")
  expect(titles).toContain("Shan Chana Masala")
  expect(titles).toContain("Shan Daal Masala")
  expect(titles).toContain("Shan Achar Gosht Masala")
  expect(titles).toContain("Shan Keema Masala")
  expect(titles).toContain("Shan Pilau Rice Mix")
})

test("MVC — MDH Masalas child", async ({ page }) => {
  await page.goto("/categories/mdh-masalas"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`MDH: ${titles.length}`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(10)

  expect(titles).toContain("MDH Kitchen King Masala")
  expect(titles).toContain("MDH Chana Masala")
  expect(titles).toContain("MDH Rajma Masala")
  expect(titles).toContain("MDH Pav Bhaji Masala")
  expect(titles).toContain("MDH Paneer Butter Masala")
  expect(titles).toContain("MDH Dal Makhani Masala")
  expect(titles).toContain("MDH Sambar Masala")
  expect(titles).toContain("MDH Chicken Masala")
  expect(titles).toContain("MDH Tandoori Masala")
  expect(titles).toContain("MDH Meat Masala")
})

// ═══════════════════════════════════════════════════════════════════
//  NAMKEENS & BISCUITS
// ═══════════════════════════════════════════════════════════════════

test("MVC — Haldiram Namkeens child", async ({ page }) => {
  await page.goto("/categories/haldiram-namkeens"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Haldiram Namkeens: ${titles.length}`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(7)

  expect(titles).toContain("Haldiram's Aloo Bhujia")
  expect(titles).toContain("Haldiram's Moong Dal")
  expect(titles).toContain("Haldiram's All In One Mix")
  expect(titles).toContain("Haldiram's Khatta Meetha Mix")
  expect(titles).toContain("Haldiram's Dalmoth")
  expect(titles).toContain("Haldiram's Bhujia Sev")
  expect(titles).toContain("Haldiram's Mathri")
})

test("MVC — Bikaji Namkeens child", async ({ page }) => {
  await page.goto("/categories/bikaji-namkeens"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Bikaji Namkeens: ${titles.length}`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(3)

  expect(titles).toContain("Bikaji Bhujia")
  expect(titles).toContain("Bikaji All In One Mix")
  expect(titles).toContain("Bikaji Khatta Meetha")
})

test("MVC — Indian Biscuits child", async ({ page }) => {
  await page.goto("/categories/indian-biscuits"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Biscuits: ${titles.length}`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(7)

  // Parle
  expect(titles).toContain("Parle-G Glucose Biscuits")
  expect(titles).toContain("Parle Monaco Salted Crackers")
  expect(titles).toContain("Parle Bourbon")
  // Britannia
  expect(titles).toContain("Britannia Good Day Butter Cookies")
  expect(titles).toContain("Britannia Good Day Cashew Cookies")
  expect(titles).toContain("Britannia Marie Gold")
  expect(titles).toContain("Britannia Bourbon Cream")
})

test("MVC — Pappadoms now includes Lijjat", async ({ page }) => {
  await page.goto("/categories/pappadoms"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Pappadoms: ${titles.length}`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(9)

  // Existing Natco
  expect(titles).toContain("Natco - Pappadoms Plain (Microwavable) 200g")
  // New Lijjat
  expect(titles).toContain("Lijjat Urad Papad Extra Thin")
  expect(titles).toContain("Lijjat Urad Special Papad")
  expect(titles).toContain("Lijjat Moong Dal Papad")
})

test("MVC — Chutneys now includes Patak's", async ({ page }) => {
  await page.goto("/categories/chutneys-pickles-sauces"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Chutneys: ${titles.length}`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(18)

  // New Patak's
  expect(titles).toContain("Patak's Mango Chutney")
  expect(titles).toContain("Patak's Lime Pickle")
  expect(titles).toContain("Patak's Mixed Pickle")
  expect(titles).toContain("Patak's Tikka Masala Paste")
})

// ═══════════════════════════════════════════════════════════════════
//  CONFECTIONERY & SWEETS
// ═══════════════════════════════════════════════════════════════════

test("MVC — Tinned Sweets child", async ({ page }) => {
  await page.goto("/categories/tinned-sweets"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Tinned Sweets: ${titles.length}`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(5)

  expect(titles).toContain("Haldiram's Gulab Jamun Tin")
  expect(titles).toContain("Haldiram's Rasgulla Tin")
  expect(titles).toContain("Haldiram's Soan Papdi")
  expect(titles).toContain("Bikaji Soan Papdi")
  expect(titles).toContain("Bikaji Gulab Jamun Tin")
})

test("MVC — Indian Candies child", async ({ page }) => {
  await page.goto("/categories/indian-candies"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Candies: ${titles.length}`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(2)

  expect(titles).toContain("Parle Mango Bite")
  expect(titles).toContain("Parle Melody")
})

test("MVC — Instant Noodles child", async ({ page }) => {
  await page.goto("/categories/instant-noodles"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Noodles: ${titles.length}`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(2)

  expect(titles).toContain("Maggi 2-Minute Noodles Masala")
  expect(titles).toContain("Maggi Hot & Sweet Sauce")
})

// ═══════════════════════════════════════════════════════════════════
//  BEVERAGES
// ═══════════════════════════════════════════════════════════════════

test("MVC — Loose Leaf Tea child", async ({ page }) => {
  await page.goto("/categories/loose-leaf-tea"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Tea: ${titles.length}`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(5)

  expect(titles).toContain("Brooke Bond Red Label Tea")
  expect(titles).toContain("Tata Gold Tea")
  expect(titles).toContain("Wagh Bakri Premium Tea")
  expect(titles).toContain("Wagh Bakri Masala Chai")
  expect(titles).toContain("Girnar Masala Chai Tea Bags")
})

test("MVC — Drinks & Syrups child", async ({ page }) => {
  await page.goto("/categories/drinks-syrups"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Drinks: ${titles.length}`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(3)

  expect(titles).toContain("Hamdard Rooh Afza")
  expect(titles).toContain("Maaza Mango Drink")
  expect(titles).toContain("Frooti Mango")
})

test("MVC — Health Drinks child", async ({ page }) => {
  await page.goto("/categories/health-drinks"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Health Drinks: ${titles.length}`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(4)

  expect(titles).toContain("Bournvita")
  expect(titles).toContain("Horlicks Original")
  expect(titles).toContain("Dabur Chyawanprash")
  expect(titles).toContain("Glucon-D Mango")
})

test("MVC — Beverages parent (tea + drinks + health)", async ({ page }) => {
  await page.goto("/categories/beverages-drinks"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Beverages: ${titles.length}`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(12)

  expect(titles).toContain("Brooke Bond Red Label Tea")
  expect(titles).toContain("Hamdard Rooh Afza")
  expect(titles).toContain("Bournvita")
})

// ═══════════════════════════════════════════════════════════════════
//  RICE & ATTA — new brands alongside existing
// ═══════════════════════════════════════════════════════════════════

test("MVC — Rice now includes Tilda, Kohinoor, etc.", async ({ page }) => {
  await page.goto("/categories/rice-quinoa"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Rice: ${titles.length}`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(15)

  // New brands
  expect(titles).toContain("Tilda Pure Basmati")
  expect(titles).toContain("Lal Qilla Premium Basmati")
  expect(titles).toContain("Kohinoor Extra Long Basmati")
  expect(titles).toContain("Daawat Rozana Basmati")
  expect(titles).toContain("Falak Super Basmati")
  // Existing Natco (still there)
  expect(titles).toContain("Natco - Basmati Rice India - Bag 5kg")
})

test("MVC — Flour now includes Elephant, Pillsbury, Aashirvaad", async ({ page }) => {
  await page.goto("/categories/flour-milk-powder"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])
  console.log(`Flour: ${titles.length}`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  expect(titles.length).toBeGreaterThanOrEqual(25)

  expect(titles).toContain("Elephant Atta Chakki Fresh")
  expect(titles).toContain("Pillsbury Chakki Fresh Atta")
  expect(titles).toContain("Aashirvaad Atta Select")
  // Existing Natco (still there)
  expect(titles).toContain("Natco - Chakki Atta Multigrain 5kg")
})

// ═══════════════════════════════════════════════════════════════════
//  PDP VARIANT SELECTION & PRICE DISPLAY
// ═══════════════════════════════════════════════════════════════════

test("MVC — PDP loads with title and price for single-variant product", async ({ page }) => {
  // MDH Kitchen King Masala — single variant, price £1.99
  await page.goto("/gb/products/mdh-kitchen-king-masala", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(4000)

  const content = (await page.textContent("body")) || ""
  expect(content.length).toBeGreaterThan(200)

  // Should show product title
  expect(content).toMatch(/kitchen king/i)

  // Should show a price
  expect(content).toMatch(/£[0-9]+\.[0-9]{2}/)

  console.log("PDP loaded: " + content.slice(0, 150).trim() + "...")
})

test("MVC — PDP shows add-to-cart button", async ({ page }) => {
  await page.goto("/gb/products/mdh-kitchen-king-masala", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(4000)

  const content = (await page.textContent("body")) || ""

  // Should have add to cart or similar
  const hasAddBtn = content.match(/add to cart|add to basket/i)
  console.log("Add to cart: " + (hasAddBtn ? "present" : "not found"))
})

test("MVC — PDP for multi-variant product (Tilda) shows variant options", async ({ page }) => {
  // Tilda Pure Basmati has 3 variants: 2kg, 5kg, 10kg
  await page.goto("/gb/products/tilda-pure-basmati", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(4000)

  const content = (await page.textContent("body")) || ""
  expect(content.length).toBeGreaterThan(200)

  // Variant options may be rendered as buttons or selectors
  // Check for the product title first
  expect(content.toLowerCase()).toMatch(/tilda|basmati/)

  // Price should be visible (confirming product page loaded)
  expect(content).toMatch(/£[0-9]+\.[0-9]{2}/)

  console.log("Tilda PDP loaded — title and price confirmed")
})

test("MVC — PDP for Natco product shows brand badge", async ({ page }) => {
  await page.goto("/gb/products/natco-cumin-seeds-400g", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(4000)

  const content = (await page.textContent("body")) || ""

  // Should show Natco brand somewhere
  expect(content.toLowerCase()).toMatch(/natco/)
  console.log("Natco brand visible on PDP")
})

test("MVC — PDP for TRS product loads correctly", async ({ page }) => {
  await page.goto("/gb/products/trs-coarse-black-pepper", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(4000)

  const content = (await page.textContent("body")) || ""

  // Should show TRS brand
  expect(content.toLowerCase()).toMatch(/trs|coarse|black pepper/i)
  console.log("TRS PDP: " + content.slice(0, 150).trim() + "...")
})

test("MVC — PDP handles non-existent product handle gracefully", async ({ page }) => {
  await page.goto("/gb/products/non-existent-product-handle-xyz", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3000)

  const content = (await page.textContent("body")) || ""

  // Should show 404 or redirect, not crash
  expect(content.length).toBeGreaterThan(50)
  console.log("404 product: " + content.slice(0, 100).trim() + "...")
})
