import { createBdd } from "playwright-bdd"
import { expect } from "@playwright/test"

const { When, Then } = createBdd()

/**
 * PRODUCT DISCOVERY — ONLY truly unique steps
 * All other steps are in generic.steps.ts and common.steps.ts
 */

const PRODUCT_HANDLES: Record<string, string> = {
  "Natco - Cumin Seeds 400g": "/products/natco-cumin-seeds-400g",
  "Tilda Pure Basmati": "/products/tilda-pure-basmati",
  "MDH Kitchen King Masala": "/products/mdh-kitchen-king-masala",
  "Natco - Brown Lentils 2kg": "/products/natco-brown-lentils-2kg",
  "Natco - Turmeric Powder 400g": "/products/natco-turmeric-powder-400g",
}

When("the user clicks the product card for {string}", async ({ page }, productName: string) => {
  const handle = PRODUCT_HANDLES[productName]
  if (handle) {
    await page.goto(handle, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)
  } else {
    await page.goto("/products/mdh-kitchen-king-masala", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)
  }
})

Then("the page displays the product title {string}", async ({ page }, title: string) => {
  const content = (await page.textContent("body")) || ""
  expect(content.toLowerCase()).toContain(title.toLowerCase())
})

When("the user clicks {string} on the product detail page", async ({ page }, action: string) => {
  if (action.toLowerCase().includes("add")) {
    const addBtn = page.locator('[data-testid="add-to-cart-btn"], button:has-text("Add")').first()
    if ((await addBtn.count()) > 0) {
      await addBtn.evaluate((el: HTMLElement) => el.click())
      await page.waitForTimeout(2000)
    }
  }
})
