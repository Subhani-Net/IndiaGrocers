import { createBdd } from "playwright-bdd"

const { Given, When, Then } = createBdd()

/**
 * PAYMENT REFUNDS — documentation stubs (G14, future feature)
 * Shared step patterns are in generic.steps.ts
 */

Given("an order has been placed and payment captured", async () => {
  console.log("STUB [G14]: Order placed and captured")
})

When("the admin initiates a full refund", async () => {
  console.log("STUB [G14]: Full refund initiated")
})

Given("an order has been placed with multiple items", async () => {
  console.log("STUB [G14]: Multi-item order")
})

When("the admin initiates a refund for a single item", async () => {
  console.log("STUB [G14]: Partial refund")
})

Then("only the refunded item's amount is returned to the customer", async () => {
  console.log("STUB [G14]: Partial refund processed")
})

Then("the remaining items are still charged", async () => {
  console.log("STUB [G14]: Unrefunded items still charged")
})

Then("the charge-already-refunded status is returned", async () => {
  console.log("STUB [G14]: Already refunded")
})

Given("a payment was captured for {string}", async ({ page }, amount: string) => {
  console.log("STUB [G14]: Payment captured for", amount)
})

When("a refund is initiated for {string}", async ({ page }, amount: string) => {
  console.log("STUB [G14]: Refund for", amount)
})

Then("the Stripe refund API receives {string} as the amount", async ({ page }, amount: string) => {
  console.log("STUB [G14]: Stripe amount:", amount)
})

Then("no duplicate refund is created", async () => {
  console.log("STUB [G14]: No duplicate")
})

Then("the refund is rejected", async () => {
  console.log("STUB [G14]: Refund rejected")
})

When("the admin attempts to refund the same order again", async () => {
  console.log("STUB [G14]: Duplicate refund")
})

Then("the refund appears in the Stripe dashboard", async () => {
  console.log("STUB [G14]: Stripe dashboard")
})

Then("a refund confirmation email is sent to the customer", async () => {
  console.log("STUB [G14]: Refund email")
})

Then("the full order amount is refunded to the customer's card", async () => {
  console.log("STUB [G14]: Full refund")
})

Then("the customer's card is credited {string}", async ({ page }, amount: string) => {
  console.log("STUB [G14]: Card credited", amount)
})

Given("an order has already been refunded", async () => {
  console.log("STUB [G14]: Already refunded")
})

Given("an order has been placed for {string}", async ({ page }, amount: string) => {
  console.log("STUB [G14]: Order for", amount)
})

When("the admin attempts to refund {string}", async ({ page }, amount: string) => {
  console.log("STUB [G14]: Refund attempt for", amount)
})

Given("a refund has been processed", async () => {
  console.log("STUB [G14]: Refund processed")
})

Then("the email includes the refunded amount and order number", async () => {
  console.log("STUB [G14]: Refund email details")
})
