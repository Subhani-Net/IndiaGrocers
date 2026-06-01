import { test, expect } from "@playwright/test"
const TITLE = '[data-testid="product-title"]'
const CARD = ".product-card"

/**
 * EXPECTED PRODUCT LISTS — data validation baseline.
 * When products are added, removed, or reordered, update these lists.
 * Tests fail when display changes — review and update intentionally.
 */

test("Lentils parent — exhaustive product list validation", async ({ page }) => {
  await page.goto("/categories/lentils"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])

  // Log for audit
  console.log(`Lentils: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  // Count assertion — parent resolves all children
  expect(titles.length).toBeGreaterThanOrEqual(70)

  // === dried-lentils-beans-peas (59) ===

  expect(titles).toContain("Natco - Alubia Beans 2kg")
  expect(titles).toContain("Natco - Alubia Beans 500g")
  expect(titles).toContain("Natco - Black Eye Beans 2kg")
  expect(titles).toContain("Natco - Black Eye Beans 500g")
  expect(titles).toContain("Natco - Brown Chick Peas 2kg")
  expect(titles).toContain("Natco - Brown Chick Peas 500g")
  expect(titles).toContain("Natco - Brown Lentils 2kg")
  expect(titles).toContain("Natco - Brown Lentils 500g")
  expect(titles).toContain("Natco - Butter Beans 2kg")
  expect(titles).toContain("Natco - Butter Beans 500g")
  expect(titles).toContain("Natco - Chanadal Polished 1kg")
  expect(titles).toContain("Natco - Chanadal Polished 2kg")
  expect(titles).toContain("Natco - Chick Peas 2kg")
  expect(titles).toContain("Natco - Chick Peas Full Case 4x1kg")
  expect(titles).toContain("Natco - Green Lentils 1kg")
  expect(titles).toContain("Natco - Green Lentils 2kg")
  expect(titles).toContain("Natco - Moth Beans 2kg")
  expect(titles).toContain("Natco - Moth Beans 500g")
  expect(titles).toContain("Natco - Mung Beans 1kg")
  expect(titles).toContain("Natco - Mung Beans 2kg")
  expect(titles).toContain("Natco - Mung Dal Yellow 1kg")
  expect(titles).toContain("Natco - Mung Dal Yellow 2kg")
  expect(titles).toContain("Natco - Mung Split 2kg")
  expect(titles).toContain("Natco - Mung Split 500g")
  expect(titles).toContain("Natco - Red Kidney Beans 1kg")
  expect(titles).toContain("Natco - Red Kidney Beans 2kg")
  expect(titles).toContain("Natco - Red Lentils Polished 1kg")
  expect(titles).toContain("Natco - Red Lentils Polished 2kg")
  expect(titles).toContain("Natco - Rose Coco (Borlotti) Beans 2kg")
  expect(titles).toContain("Natco - Rose Coco (Borlotti) Beans 500g")
  expect(titles).toContain("Natco - Toor Dal Oily 1kg")
  expect(titles).toContain("Natco - Toor Dal Oily 2kg")
  expect(titles).toContain("Natco - Toor Dal Plain 2kg")
  expect(titles).toContain("Natco - Toor Dal Plain 500g")
  expect(titles).toContain("Natco - Urid Beans 1kg")
  expect(titles).toContain("Natco - Urid Beans 2kg")
  expect(titles).toContain("Natco - Urid Dal White 1kg")
  expect(titles).toContain("Natco - Urid Dal White 2kg")
  expect(titles).toContain("Natco - Urid Split 2kg")
  expect(titles).toContain("Natco - Urid Split 500g")
  expect(titles).toContain("Natco - Yellow Split Peas 1kg")
  expect(titles).toContain("Natco - Yellow Split Peas 2kg")

  expect(titles).toContain("TRS Green Lentils")
  expect(titles).toContain("TRS Green Peas")
  expect(titles).toContain("TRS Moth Beans")
  expect(titles).toContain("TRS Mung Beans")
  expect(titles).toContain("TRS Mung Dal")
  expect(titles).toContain("TRS Mung Dal Chilka (Split Green Peas)")
  expect(titles).toContain("TRS Red Adzuki Beans (Red Cow Peas)")
  expect(titles).toContain("TRS Red Kidney Beans")
  expect(titles).toContain("TRS Red Split Lentils")
  expect(titles).toContain("TRS Rosecoco Beans")
  expect(titles).toContain("TRS Toor Dal")
  expect(titles).toContain("TRS Urid Beans")
  expect(titles).toContain("TRS Urid Dal")
  expect(titles).toContain("TRS Urid Dal Chilka")
  expect(titles).toContain("TRS Urid Whole Gota")
  expect(titles).toContain("TRS Yellow Peas")
  expect(titles).toContain("TRS Yellow Split Peas")

  // === soya-products (5) ===

  expect(titles).toContain("Natco - Soya Beans 2kg")
  expect(titles).toContain("Natco - Soya Beans 500g")
  expect(titles).toContain("Natco - Soya Chunks 350g")
  expect(titles).toContain("Natco - Soya Chunks 700g")
  expect(titles).toContain("Natco - Soya Mince 300g")

  // === tinned-lentils-beans (9) ===

  expect(titles).toContain("Natco - Black Eyed Beans 400g")
  expect(titles).toContain("Natco - Chick Peas 2.5kg")
  expect(titles).toContain("Natco - Chick Peas Full Case 12x400g")
  expect(titles).toContain("Natco - Kala Chana Boiled 400g")
  expect(titles).toContain("Natco - Red Kidney Beans 2.5kg")
  expect(titles).toContain("Natco - Red Kidney Beans Boiled Full Case 12x400g")
  expect(titles).toContain("Natco - Rose Coco (Borlotti) Beans 400g")
  expect(titles).toContain("Natco - Toovar 400g")
  expect(titles).toContain("Natco - White Kidney Beans 400g")
})

test("Lentils — Dried Lentils, Beans & Peas child", async ({ page }) => {
  await page.goto("/categories/dried-lentils-beans-peas"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])

  console.log(`Dried Lentils, Beans & Peas: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(55)

  expect(titles).toContain("Natco - Alubia Beans 2kg")
  expect(titles).toContain("Natco - Alubia Beans 500g")
  expect(titles).toContain("Natco - Black Eye Beans 2kg")
  expect(titles).toContain("Natco - Black Eye Beans 500g")
  expect(titles).toContain("Natco - Brown Chick Peas 2kg")
  expect(titles).toContain("Natco - Brown Chick Peas 500g")
  expect(titles).toContain("Natco - Brown Lentils 2kg")
  expect(titles).toContain("Natco - Brown Lentils 500g")
  expect(titles).toContain("Natco - Butter Beans 2kg")
  expect(titles).toContain("Natco - Butter Beans 500g")
  expect(titles).toContain("Natco - Chanadal Polished 1kg")
  expect(titles).toContain("Natco - Chanadal Polished 2kg")
  expect(titles).toContain("Natco - Chick Peas 2kg")
  expect(titles).toContain("Natco - Chick Peas Full Case 4x1kg")
  expect(titles).toContain("Natco - Green Lentils 1kg")
  expect(titles).toContain("Natco - Green Lentils 2kg")
  expect(titles).toContain("Natco - Moth Beans 2kg")
  expect(titles).toContain("Natco - Moth Beans 500g")
  expect(titles).toContain("Natco - Mung Beans 1kg")
  expect(titles).toContain("Natco - Mung Beans 2kg")
  expect(titles).toContain("Natco - Mung Dal Yellow 1kg")
  expect(titles).toContain("Natco - Mung Dal Yellow 2kg")
  expect(titles).toContain("Natco - Mung Split 2kg")
  expect(titles).toContain("Natco - Mung Split 500g")
  expect(titles).toContain("Natco - Red Kidney Beans 1kg")
  expect(titles).toContain("Natco - Red Kidney Beans 2kg")
  expect(titles).toContain("Natco - Red Lentils Polished 1kg")
  expect(titles).toContain("Natco - Red Lentils Polished 2kg")
  expect(titles).toContain("Natco - Rose Coco (Borlotti) Beans 2kg")
  expect(titles).toContain("Natco - Rose Coco (Borlotti) Beans 500g")
  expect(titles).toContain("Natco - Toor Dal Oily 1kg")
  expect(titles).toContain("Natco - Toor Dal Oily 2kg")
  expect(titles).toContain("Natco - Toor Dal Plain 2kg")
  expect(titles).toContain("Natco - Toor Dal Plain 500g")
  expect(titles).toContain("Natco - Urid Beans 1kg")
  expect(titles).toContain("Natco - Urid Beans 2kg")
  expect(titles).toContain("Natco - Urid Dal White 1kg")
  expect(titles).toContain("Natco - Urid Dal White 2kg")
  expect(titles).toContain("Natco - Urid Split 2kg")
  expect(titles).toContain("Natco - Urid Split 500g")
  expect(titles).toContain("Natco - Yellow Split Peas 1kg")
  expect(titles).toContain("Natco - Yellow Split Peas 2kg")

  expect(titles).toContain("TRS Green Lentils")
  expect(titles).toContain("TRS Green Peas")
  expect(titles).toContain("TRS Moth Beans")
  expect(titles).toContain("TRS Mung Beans")
  expect(titles).toContain("TRS Mung Dal")
  expect(titles).toContain("TRS Mung Dal Chilka (Split Green Peas)")
  expect(titles).toContain("TRS Red Adzuki Beans (Red Cow Peas)")
  expect(titles).toContain("TRS Red Kidney Beans")
  expect(titles).toContain("TRS Red Split Lentils")
  expect(titles).toContain("TRS Rosecoco Beans")
  expect(titles).toContain("TRS Toor Dal")
  expect(titles).toContain("TRS Urid Beans")
  expect(titles).toContain("TRS Urid Dal")
  expect(titles).toContain("TRS Urid Dal Chilka")
  expect(titles).toContain("TRS Urid Whole Gota")
  expect(titles).toContain("TRS Yellow Peas")
  expect(titles).toContain("TRS Yellow Split Peas")
})

test("Lentils — Soya Products child", async ({ page }) => {
  await page.goto("/categories/soya-products"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])

  console.log(`Soya Products: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(5)

  expect(titles).toContain("Natco - Soya Beans 2kg")
  expect(titles).toContain("Natco - Soya Beans 500g")
  expect(titles).toContain("Natco - Soya Chunks 350g")
  expect(titles).toContain("Natco - Soya Chunks 700g")
  expect(titles).toContain("Natco - Soya Mince 300g")
})

test("Lentils — Tinned Lentils & Beans child", async ({ page }) => {
  await page.goto("/categories/tinned-lentils-beans"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])

  console.log(`Tinned Lentils & Beans: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(9)

  expect(titles).toContain("Natco - Black Eyed Beans 400g")
  expect(titles).toContain("Natco - Chick Peas 2.5kg")
  expect(titles).toContain("Natco - Chick Peas Full Case 12x400g")
  expect(titles).toContain("Natco - Kala Chana Boiled 400g")
  expect(titles).toContain("Natco - Red Kidney Beans 2.5kg")
  expect(titles).toContain("Natco - Red Kidney Beans Boiled Full Case 12x400g")
  expect(titles).toContain("Natco - Rose Coco (Borlotti) Beans 400g")
  expect(titles).toContain("Natco - Toovar 400g")
  expect(titles).toContain("Natco - White Kidney Beans 400g")
})

test("Lentils — All Lentils & Beans fallback", async ({ page }) => {
  await page.goto("/categories/all-lentils-beans"); await page.waitForSelector(CARD, { timeout: 60000 })
  const titles = await page.$$eval(TITLE, (els) => els.map((el) => el.textContent?.trim()).filter(Boolean) as string[])

  console.log(`All Lentils & Beans: ${titles.length} products`)
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  expect(titles.length).toBeGreaterThanOrEqual(45)
})
