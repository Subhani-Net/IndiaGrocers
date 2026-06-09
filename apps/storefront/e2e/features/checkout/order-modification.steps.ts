import { createBdd } from "playwright-bdd"

const { Given, When, Then } = createBdd()

/**
 * ORDER MODIFICATION + WEIGHT-BASED CHARGING — documentation stubs (G15, future)
 * Shared step patterns are in generic.steps.ts
 */

Given("an order contains a product that is out of stock", async () => {
  console.log("STUB [G15]: OOS item")
})

When("the packer marks the item as unavailable", async () => {
  console.log("STUB [G15]: Item unavailable")
})

Then("the order total is recalculated without the unavailable item", async () => {
  console.log("STUB [G15]: Total recalculated")
})

Then("the existing Stripe PaymentIntent is updated with the new total", async () => {
  console.log("STUB [G15]: PI updated")
})

When("the packer substitutes it with a similar available product", async () => {
  console.log("STUB [G15]: Item substituted")
})

Then("the order total reflects the substituted product's price", async () => {
  console.log("STUB [G15]: Substitution price updated")
})

Given("a customer ordered 1kg of loose paneer at an estimated price of £8.00", async () => {
  console.log("STUB [G15]: Paneer ordered")
})

When("the packer weighs the actual paneer and records {string}", async ({ page }, weight: string) => {
  console.log("STUB [G15]: Weight measured:", weight)
})

Then("the customer is charged the actual weight-based amount", async () => {
  console.log("STUB [G15]: Weight-based charge")
})

Then("the customer is charged only for the actual weight", async () => {
  console.log("STUB [G15]: Under-weight charge")
})

Given("the packer has adjusted an order during packing", async () => {
  console.log("STUB [G15]: Packing adjusted")
})

When("the adjustments are saved", async () => {
  console.log("STUB [G15]: Saved")
})

Then("the customer receives an email with the updated order summary", async () => {
  console.log("STUB [G15]: Customer notified")
})

Then("the updated total is displayed in their order history", async () => {
  console.log("STUB [G15]: Order history updated")
})

Given("an order has been packed and adjusted", async () => {
  console.log("STUB [G15]: Packed and adjusted")
})

When("the packer confirms the order is ready for delivery", async () => {
  console.log("STUB [G15]: Delivery confirmed")
})

Then("the PaymentIntent is captured at the final adjusted amount", async () => {
  console.log("STUB [G15]: PI captured")
})

Given("the packing window for an order has closed", async () => {
  console.log("STUB [G15]: Window closed")
})

When("the packer attempts to modify the order", async () => {
  console.log("STUB [G15]: Modification attempt")
})

Then("the modification is rejected", async () => {
  console.log("STUB [G15]: Rejected")
})

Then("the order proceeds to delivery with its current state", async () => {
  console.log("STUB [G15]: Proceeds unchanged")
})

Given("an existing PaymentIntent for an order", async () => {
  console.log("STUB [G15]: Existing PI")
})

When("the order total is adjusted during packing", async () => {
  console.log("STUB [G15]: Total adjusted")
})

Then("the updatePayment method is called on the same PaymentIntent", async () => {
  console.log("STUB [G15]: updatePayment called")
})

Then("no new PaymentIntent is created", async () => {
  console.log("STUB [G15]: No new PI")
})

Then("no additional payment authorization is required", async () => {
  console.log("STUB [G15]: No re-auth")
})

Then("no additional payment authorization is required from the customer", async () => {
  console.log("STUB [G15]: No customer re-auth")
})

Then("the PaymentIntent is updated accordingly", async () => {
  console.log("STUB [G15]: PI updated accordingly")
})
