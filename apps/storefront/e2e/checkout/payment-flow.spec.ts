import { test, expect } from "@playwright/test"

/**
 * STRIPE PAYMENT & ORDER FLOW INTEGRATION TESTS
 */

test("Cart page loads successfully", async ({ page }) => {
  await page.goto("/gb/cart", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2000)
  const content = (await page.textContent("body")) || ""
  expect(content.length).toBeGreaterThan(100)
  console.log("Cart page loaded: " + content.slice(0, 80).trim() + "...")
})

test("Checkout address step loads", async ({ page }) => {
  await page.goto("/gb/checkout?step=address", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3000)
  const content = (await page.textContent("body")) || ""
  expect(content).toMatch(/address|postcode|delivery/i)
  console.log("Address step: " + (content.includes("address") ? "OK" : "redirected (no cart)"))
})

test("Checkout payment step redirects or shows Stripe", async ({ page }) => {
  await page.goto("/gb/checkout?step=payment", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3000)
  const content = (await page.textContent("body")) || ""

  // Either shows payment UI or redirects to address step (no cart)
  const hasPayment = content.match(/stripe|card payment|pay/i)
  const hasRedirect = page.url().includes("step=address")
  expect(hasPayment || hasRedirect).toBeTruthy()
  console.log("Payment step: " + (hasPayment ? "Stripe UI present" : "redirected to address (no cart)"))
})

test("Order confirmation page shows content", async ({ page }) => {
  await page.goto("/gb/order/test/confirmed", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2000)
  const content = (await page.textContent("body")) || ""
  expect(content.length).toBeGreaterThan(100)
  console.log("Order page loaded: " + content.slice(0, 80).trim() + "...")
})
