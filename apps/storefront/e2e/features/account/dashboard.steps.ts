import { createBdd } from "playwright-bdd"
import { expect } from "@playwright/test"

const { Given, When, Then } = createBdd()

/**
 * DASHBOARD STEP DEFINITIONS (unique steps only)
 * Shared steps like "the user clicks {string}", "the user fills in all
 * required fields", "the name is updated" are in generic.steps.ts.
 */

Given("the user is signed in with previous orders", async ({ page }) => {
  console.log("AUTH STUB: Signed in with orders")
})

When("the user views the account overview", async ({ page }) => {
  await page.goto("/account", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2000)
})

Given("the user is signed in with no orders", async ({ page }) => {
  console.log("AUTH STUB: Signed in, no orders")
})

Given("the user is viewing their order history", async ({ page }) => {
  console.log("AUTH STUB: Viewing order history")
})

Given("the user is signed in and viewing {string}", async ({ page }, section: string) => {
  console.log(`AUTH STUB: Viewing ${section}`)
})

Given("the user has at least one saved address", async ({ page }) => {
  console.log("AUTH STUB: Has saved addresses")
})
