import { defineConfig, devices } from "@playwright/test"
import { defineBddConfig } from "playwright-bdd"

const testDir = defineBddConfig({
  features: "e2e/features/**/*.feature",
  steps: "e2e/features/**/*.steps.ts",
  verbose: true,
})

console.log("BDD testDir:", testDir)

export default defineConfig({
  timeout: 120000,
  retries: 1,
  use: {
    baseURL: "http://localhost:8000/gb",
    headless: true,
  },
  projects: [
    {
      name: "bdd",
      testDir,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "e2e",
      testDir: "./e2e",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
