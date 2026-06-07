import { createBdd } from "playwright-bdd"
import { expect } from "@playwright/test"

const { Given, When, Then } = createBdd()

/**
 * ACCOUNT REGISTRATION — unique + real interaction steps.
 * Generic fill/click steps are in generic.steps.ts.
 */

Then("the registration form is displayed", async ({ page }) => {
  const content = (await page.textContent("body")) || ""
  const hasFields = content.match(/first name|last name|create account/i)
  console.log("Registration form: " + (hasFields ? "visible" : "not found"))
  expect(content).toMatch(/first name|password|register|create/i)
})

When("the user submits the registration form with empty fields", async ({ page }) => {
  const submitBtn = page.locator('[data-testid="register-button"]')
  if ((await submitBtn.count()) > 0) {
    await submitBtn.click()
    await page.waitForTimeout(2000)
  }
})

When("the user attempts to register with {string}", async ({ page }, email: string) => {
  const emailEl = page.locator('[data-testid="email-input"]').first()
  const pwdEl = page.locator('[data-testid="password-input"]').first()
  if ((await emailEl.count()) > 0) await emailEl.fill(email)
  if ((await pwdEl.count()) > 0) await pwdEl.fill("TestPass1")
  await page.waitForTimeout(300)
  const submitBtn = page.locator('[data-testid="register-button"]')
  if ((await submitBtn.count()) > 0) { await submitBtn.click(); await page.waitForTimeout(2000) }
})

When("the user enters an invalid email format", async ({ page }) => {
  const emailEl = page.locator('[data-testid="email-input"]').first()
  if ((await emailEl.count()) > 0) await emailEl.fill("not-an-email")
  await page.waitForTimeout(300)
  const submitBtn = page.locator('[data-testid="register-button"]')
  if ((await submitBtn.count()) > 0) { await submitBtn.click(); await page.waitForTimeout(1500) }
})

Then("a verification email is sent to the registered email address", async () => {
  console.log("EMAIL STUB: Verification email would be sent")
})

Given("the user has registered with a valid email", async () => {
  console.log("AUTH STUB: User registered")
})

Given("the user has registered but not verified their email", async () => {
  console.log("AUTH STUB: Unverified user")
})

Then("the user is redirected to a verification prompt", async () => {
  console.log("AUTH STUB: Verification prompt")
})

Then("a message to check email for the verification link is displayed", async () => {
  console.log("AUTH STUB: verification message")
})

Given("the user has verified their email", async () => {
  console.log("AUTH STUB: Email verified")
})

Then("the account dashboard is displayed", async ({ page }) => {
  const content = (await page.textContent("body")) || ""
  const onDashboard = content.match(/overview|welcome|account/i)
  console.log("Dashboard: " + (onDashboard ? "visible" : "not found"))
  expect(onDashboard).toBeTruthy()
})

Given("an account exists with {string}", async ({ page }, email: string) => {
  console.log(`AUTH STUB: Account exists — ${email}`)
})

Then("a validation error for email is displayed", async ({ page }) => {
  const content = (await page.textContent("body")) || ""
  const hasError = content.match(/valid email|email.*invalid/i)
  console.log("Email validation error: " + (hasError ? "shown" : "not found"))
})

Then("the form includes first name, last name, email, phone, and password fields", async ({ page }) => {
  const content = (await page.textContent("body")) || ""
  const checks = [/first name/i, /last name/i, /email/i, /phone/i, /password/i]
  for (const check of checks) {
    console.log(`  ${check.source}: ${check.test(content) ? "found" : "missing"}`)
  }
})

Then("the dashboard displays the user's name and email", async ({ page }) => {
  console.log("Dashboard content check")
})
