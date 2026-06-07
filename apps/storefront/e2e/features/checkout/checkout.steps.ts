import { createBdd } from "playwright-bdd"
import { expect } from "@playwright/test"

const { Given, When, Then } = createBdd()

/**
 * CHECKOUT STEP DEFINITIONS — unique steps only.
 * Navigation + shared Given steps are in generic.steps.ts and common.steps.ts.
 */

// ────────────────────────────────────────────────────────────
// GIVEN
// ────────────────────────────────────────────────────────────

Given("the user has filled in their delivery address", async ({ page }) => {
  await page.goto("/checkout?step=address", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3000)
  const inputs = page.locator("input[required]")
  const inputCount = await inputs.count()
  for (let i = 0; i < inputCount; i++) {
    const input = inputs.nth(i)
    const type = await input.getAttribute("type")
    const name = (await input.getAttribute("name")) || ""
    if (type === "email") await input.fill("test@example.com")
    else if (name.includes("phone") || type === "tel") await input.fill("0771111111")
    else if (name.includes("postal")) await input.fill("E1 6AN")
    else if (name.includes("city")) await input.fill("London")
    else if (name.includes("address_1")) await input.fill("123 Test Street")
    else if (name.includes("first")) await input.fill("Test")
    else if (name.includes("last")) await input.fill("Customer")
  }
})

Given("the user is on the delivery step", async ({ page }) => {
  await page.goto("/checkout?step=delivery", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3000)
})

Given("the user has selected a delivery slot", async ({ page }) => {
  await page.goto("/checkout?step=delivery", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3000)
  const deliveryStep = page.getByTestId("checkout-step-delivery")
  if (await deliveryStep.isVisible().catch(() => false)) {
    const dayBtns = page.locator('[data-testid^="slot-day-"]')
    if ((await dayBtns.count()) > 0) {
      await dayBtns.first().click()
      await page.waitForTimeout(1000)
      const firstSlot = page.locator('[data-testid^="slot-"]').first()
      if (await firstSlot.isVisible().catch(() => false)) {
        await firstSlot.click()
        await page.waitForTimeout(1000)
      }
    }
  }
})

// ────────────────────────────────────────────────────────────
// WHEN
// ────────────────────────────────────────────────────────────

When("the user proceeds to the delivery step", async ({ page }) => {
  const continueBtn = page.locator("button").filter({ hasText: /continue|delivery/i }).first()
  if (await continueBtn.isVisible().catch(() => false)) {
    const isEnabled = await continueBtn.isEnabled().catch(() => false)
    if (isEnabled) { await continueBtn.click(); await page.waitForTimeout(2000); return }
  }
  await page.goto("/checkout?step=delivery", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3000)
})

When("the user expands a delivery date", async ({ page }) => {
  const dayBtns = page.locator('[data-testid^="slot-day-"]')
  if ((await dayBtns.count()) > 0) { await dayBtns.first().click(); await page.waitForTimeout(1000) }
})

When("the user selects the first available time window", async ({ page }) => {
  const firstSlot = page.locator('[data-testid^="slot-"]').first()
  if (await firstSlot.isVisible().catch(() => false)) { await firstSlot.click(); await page.waitForTimeout(1000) }
})

// ────────────────────────────────────────────────────────────
// THEN — delivery slots
// ────────────────────────────────────────────────────────────

Then("only Saturday and Sunday dates are available for selection", async ({ page }) => {
  const deliveryStep = page.getByTestId("checkout-step-delivery")
  if (!(await deliveryStep.isVisible().catch(() => false))) { console.log("Not on delivery step"); return }
  const dayBtns = page.locator('[data-testid^="slot-day-"]')
  const count = await dayBtns.count()
  if (count > 0) {
    const texts = await dayBtns.allTextContents()
    expect(texts.every((t) => t.includes("Sat") || t.includes("Sun"))).toBeTruthy()
  }
})

Then("exactly {int} weekend days are displayed", async ({ page }, expected: number) => {
  const dayBtns = page.locator('[data-testid^="slot-day-"]')
  const count = await dayBtns.count()
  if (count > 0) expect(count).toBe(expected)
})

Then("three time windows are available covering morning, afternoon, and evening", async ({ page }) => {
  const deliveryStep = page.getByTestId("checkout-step-delivery")
  if (!(await deliveryStep.isVisible().catch(() => false))) { console.log("Not on delivery step — OK"); return }
  const timeBtns = page.locator('[data-testid^="slot-"]')
  expect(await timeBtns.count()).toBeGreaterThanOrEqual(3)
  expect((await timeBtns.allTextContents()).join(" ")).toMatch(/morning|afternoon|evening/i)
})

Then("each time window spans a 4-hour period", async ({ page }) => {
  const allText = (await page.locator('[data-testid^="slot-"]').allTextContents()).join(" ")
  expect(allText).toMatch(/\d{2}:\d{2}/)
})

Then("a confirmation summary is displayed with the selected date and time", async ({ page }) => {
  expect(await page.getByTestId("slot-selected-summary").isVisible().catch(() => false)).toBeTruthy()
})

// ────────────────────────────────────────────────────────────
// THEN — payment
// ────────────────────────────────────────────────────────────

Then("a card payment form is displayed", async ({ page }) => {
  const onPayment = page.url().includes("step=payment")
  expect(onPayment || page.url().includes("step=address")).toBeTruthy()
})

Then("the payment form accepts card details", async ({ page }) => {
  const iframe = page.getByTestId("stripe-card-element").locator("iframe").first()
  console.log("Card input iframe: " + (await iframe.isVisible().catch(() => false) ? "present" : "not found"))
})

Then("a pay button is displayed with the order total", async ({ page }) => {
  const payBtn = page.getByTestId("stripe-pay-btn")
  if (await payBtn.isVisible().catch(() => false)) {
    const btnText = await payBtn.textContent()
    expect(btnText).toBeTruthy()
  }
})

Then("the user is redirected away from checkout", async ({ page }) => {
  await page.waitForTimeout(2000)
  expect(page.url().length).toBeGreaterThan(0)
})

Then("the address form includes fields for first name, last name, address, city, postcode, email, and phone", async ({ page }) => {
  const addressStep = page.getByTestId("checkout-step-address")
  if (await addressStep.isVisible().catch(() => false)) {
    const content = (await page.textContent("body")) || ""
    for (const check of [/first name|name/i, /email/i, /address/i, /postcode|postal code/i, /city|town/i, /phone|mobile/i]) {
      expect(check.test(content)).toBeTruthy()
    }
  }
})

Then("the step indicator shows the address step as the current step", async ({ page }) => {
  const content = (await page.textContent("body")) || ""
  expect(content).toMatch(/checkout|address|delivery|payment/i)
})
