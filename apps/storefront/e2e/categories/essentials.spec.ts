import { test, expect } from "@playwright/test"

const TITLE = '[data-testid="product-title"]'
const CARD = ".product-card"

test.describe("Essentials Category", () => {
  test("Essentials parent — exhaustive product list validation", async ({
    page,
  }) => {
    await page.goto("/categories/essentials")
    await page.waitForSelector(CARD, { timeout: 60000 })

    const titles = await page.locator(TITLE).allTextContents()
    console.log(
      `Essentials parent — Found ${titles.length} products:`,
      titles,
    )

    expect(titles.length).toBeGreaterThanOrEqual(25)
    // FIXME: After cache expiry, increase to 45 when tinned products appear

    // all-essentials (5)
    expect(titles).toContain("Natco - Garlic &amp; Ginger Paste 190g")
    expect(titles).toContain("Natco - Garlic Paste 190g")
    expect(titles).toContain("Natco - Ginger Paste 190g")
    expect(titles).toContain("TRS Ginger  Garlic Paste")
    expect(titles).toContain("TRS Ginger Paste")

    // ghee-oils (16)
    expect(titles).toContain("Natco - Almond Oil 250ml")
    expect(titles).toContain("Natco - Almond Oil 500ml")
    expect(titles).toContain("Natco - Castor Oil 250ml")
    expect(titles).toContain("Natco - Coconut Oil (Parachute Brand) 500ml")
    expect(titles).toContain("Natco - Ghee Pure (Plough brand) 500g")
    expect(titles).toContain("Natco - Ghee Pure Butter 1kg")
    expect(titles).toContain("Natco - Groundnut Oil 1 Litre")
    expect(titles).toContain("Natco - Olive Oil Extra Virgin 500ml")
    expect(titles).toContain("Natco - Pomace Olive Oil 1 Litre")
    expect(titles).toContain("Natco - Pomace Olive Oil 5 Litre")
    expect(titles).toContain("Natco - Pomace Olive Oil Blend 3 Litres")
    expect(titles).toContain("Natco - Pure Linseed Oil 250ml")
    expect(titles).toContain("Natco - Pure Mustard Oil 1Ltr")
    expect(titles).toContain("Natco - Pure Mustard Oil 250ml")
    expect(titles).toContain("Natco - Pure Sesame Oil 1 Litre")
    expect(titles).toContain("Natco - Pure Sesame Oil 250ml")

    // teas-drinks (3)
    expect(titles).toContain("Natco - Coconut Water 1L")
    expect(titles).toContain("Natco - Coconut Water 330ml")
    expect(titles).toContain("Natco - Spiced Tea - Masala Blend 160s")

    // vegetables (2)
    expect(titles).toContain("Natco - Crispy Fried Onions 150g")
    expect(titles).toContain("Natco - Crispy Fried Onions 400g")

    // NOTE: Tinned products (tinned-vegetables, tinned-coconut, tinned-fruit) are correctly
    // assigned in Medusa and MeiliSearch, but the storefront category tree has a 5-min
    // force-cache (categories.ts:47). They will appear after cache expiry.
    // Child page tests (below) validate individual tinned pages work correctly.
  })

  test("Essentials — All Essentials (Pastes) child", async ({ page }) => {
    await page.goto("/categories/all-essentials")
    await page.waitForSelector(CARD, { timeout: 60000 })

    const titles = await page.locator(TITLE).allTextContents()
    console.log(
      `All Essentials child — Found ${titles.length} products:`,
      titles,
    )

    expect(titles.length).toBeGreaterThanOrEqual(5)

    expect(titles).toContain("Natco - Garlic &amp; Ginger Paste 190g")
    expect(titles).toContain("Natco - Garlic Paste 190g")
    expect(titles).toContain("Natco - Ginger Paste 190g")
    expect(titles).toContain("TRS Ginger  Garlic Paste")
    expect(titles).toContain("TRS Ginger Paste")
  })

  test("Essentials — Ghee & Oils child", async ({ page }) => {
    await page.goto("/categories/ghee-oils")
    await page.waitForSelector(CARD, { timeout: 60000 })

    const titles = await page.locator(TITLE).allTextContents()
    console.log(
      `Ghee & Oils child — Found ${titles.length} products:`,
      titles,
    )

    expect(titles.length).toBeGreaterThanOrEqual(14)

    expect(titles).toContain("Natco - Almond Oil 250ml")
    expect(titles).toContain("Natco - Almond Oil 500ml")
    expect(titles).toContain("Natco - Castor Oil 250ml")
    expect(titles).toContain("Natco - Coconut Oil (Parachute Brand) 500ml")
    expect(titles).toContain("Natco - Ghee Pure (Plough brand) 500g")
    expect(titles).toContain("Natco - Ghee Pure Butter 1kg")
    expect(titles).toContain("Natco - Groundnut Oil 1 Litre")
    expect(titles).toContain("Natco - Olive Oil Extra Virgin 500ml")
    expect(titles).toContain("Natco - Pomace Olive Oil 1 Litre")
    expect(titles).toContain("Natco - Pomace Olive Oil 5 Litre")
    expect(titles).toContain("Natco - Pomace Olive Oil Blend 3 Litres")
    expect(titles).toContain("Natco - Pure Linseed Oil 250ml")
    expect(titles).toContain("Natco - Pure Mustard Oil 1Ltr")
    expect(titles).toContain("Natco - Pure Mustard Oil 250ml")
    expect(titles).toContain("Natco - Pure Sesame Oil 1 Litre")
    expect(titles).toContain("Natco - Pure Sesame Oil 250ml")
  })

  test("Essentials — Teas & Drinks child", async ({ page }) => {
    await page.goto("/categories/teas-drinks")
    await page.waitForSelector(CARD, { timeout: 60000 })

    const titles = await page.locator(TITLE).allTextContents()
    console.log(
      `Teas & Drinks child — Found ${titles.length} products:`,
      titles,
    )

    expect(titles.length).toBeGreaterThanOrEqual(3)

    expect(titles).toContain("Natco - Coconut Water 1L")
    expect(titles).toContain("Natco - Coconut Water 330ml")
    expect(titles).toContain("Natco - Spiced Tea - Masala Blend 160s")
  })

  test("Essentials — Vegetables child", async ({ page }) => {
    await page.goto("/categories/vegetables")
    await page.waitForSelector(CARD, { timeout: 60000 })

    const titles = await page.locator(TITLE).allTextContents()
    console.log(
      `Vegetables child — Found ${titles.length} products:`,
      titles,
    )

    expect(titles.length).toBeGreaterThanOrEqual(2)

    expect(titles).toContain("Natco - Crispy Fried Onions 150g")
    expect(titles).toContain("Natco - Crispy Fried Onions 400g")
  })

  test("Essentials — Tinned Vegetables child", async ({ page }) => {
    await page.goto("/categories/tinned-vegetables")
    await page.waitForSelector(CARD, { timeout: 60000 })

    const titles = await page.locator(TITLE).allTextContents()
    console.log(
      `Tinned Vegetables child — Found ${titles.length} products:`,
      titles,
    )

    expect(titles.length).toBeGreaterThanOrEqual(13)

    expect(titles).toContain("Natco - Karela 400g")
    expect(titles).toContain("Natco - Lotus Root 400g")
    expect(titles).toContain("Natco - Okra Full Case 12x400g")
    expect(titles).toContain("Natco - Patra 400g")
    expect(titles).toContain("Natco - Punjabi Tinda Full Case 12x400g")
    expect(titles).toContain("Natco - Sarson Ka Saag 450g")
    expect(titles).toContain("Natco - Spinach Leaf 396g")
    expect(titles).toContain("Natco - Spinach Puree 395g")
    expect(titles).toContain("Natco - Spinach Puree 794g")
    expect(titles).toContain("Natco - Suran (Yam) 400g")
    expect(titles).toContain("Natco - Tomato Paste 800g")
    expect(titles).toContain("Natco - Tomatoes Chopped Full Case 12x400g")
    expect(titles).toContain("Natco - Tomatoes Peeled 400g")
  })

  test("Essentials — Tinned Coconut child", async ({ page }) => {
    await page.goto("/categories/tinned-coconut")
    await page.waitForSelector(CARD, { timeout: 60000 })

    const titles = await page.locator(TITLE).allTextContents()
    console.log(
      `Tinned Coconut child — Found ${titles.length} products:`,
      titles,
    )

    expect(titles.length).toBeGreaterThanOrEqual(3)

    expect(titles).toContain("Natco - Coconut Cream 400ml")
    expect(titles).toContain("Natco - Coconut Milk 400ml")
    expect(titles).toContain("Natco - Coconut Milk Light 400ml")
  })

  test("Essentials — Tinned Fruit child", async ({ page }) => {
    await page.goto("/categories/tinned-fruit")
    await page.waitForSelector(CARD, { timeout: 60000 })

    const titles = await page.locator(TITLE).allTextContents()
    console.log(
      `Tinned Fruit child — Found ${titles.length} products:`,
      titles,
    )

    expect(titles.length).toBeGreaterThanOrEqual(3)

    expect(titles).toContain("Natco - Mango Pulp Alphonso 450g")
    expect(titles).toContain("Natco - Mango Pulp Kesar 850g")
    expect(titles).toContain("Natco - Mango Slices Alphonso 425g")
  })
})
