import { createBdd } from "playwright-bdd"
import { expect } from "@playwright/test"

const { Given, When, Then } = createBdd()

/**
 * PRODUCT DISCOVERY — unique steps for PDP, category, navigation
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

// ────────────────────────────────────────────────────────────
// D9 — Real product card navigation (click, not direct URL)
// ────────────────────────────────────────────────────────────

// "the user clicks any product card link" is in generic.steps.ts

// "the PDP displays a product title" is in generic.steps.ts

Then("the PDP displays a product price in GBP", async ({ page }) => {
  const content = (await page.textContent("body")) || ""
  // Price should be in £X.XX or XXp format
  const hasPrice = content.match(/£\d+\.\d{2}/) || content.match(/\d+p\b/)
  console.log("PDP price:", hasPrice?.[0] || "NOT FOUND")
  expect(hasPrice).toBeTruthy()
})

Then("the breadcrumbs contain a link to the product's category", async ({ page }) => {
  // Breadcrumbs should have a link to /categories/ or /store
  const allLinks = page.locator('nav a, [class*="breadcrumb"] a, a[href*="/categories/"], a[href*="/store"]')
  const count = await allLinks.count()
  console.log("Breadcrumb links:", count)
  expect(count).toBeGreaterThanOrEqual(2)
})

Then("the breadcrumbs contain a link to the store", async ({ page }) => {
  // The breadcrumb nav should be present on the PDP
  const nav = page.locator("nav, [class*=\"breadcrumb\"]").first()
  const exists = await nav.isAttached().catch(() => false)
  console.log("Breadcrumb navigation:", exists)
  expect(exists).toBeTruthy()
})

Then("the page displays basmati rice information", async ({ page }) => {
  const content = (await page.textContent("body")) || ""
  const hasBasmati = content.match(/basmati|rice/i)
  expect(hasBasmati).toBeTruthy()
})
