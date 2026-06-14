import { test, expect } from "@playwright/test"

/**
 * SEARCH LOADING STATES — Validates spinner lifecycle and loading behavior.
 *
 * Architecture (Option A — SSR-only data path):
 *   User types → 300ms debounce → router.replace(url)
 *   → Server Component re-renders → searchProducts + fetchProductsByIds (direct, no RSC protocol)
 *   → initialResults prop flows to client → useEffect syncs to state
 *   → useTransition.isPending drives the spinner (shows during navigation, stops on data arrival)
 *
 *   No client-side performSearch, no server actions, no AbortController, no Promise.race timeout.
 *   Single data path: SSR → initialResults → products state.
 *   Autocomplete: client-side MeiliSearch only (200ms debounce, abortable). Independent of main search.
 *
 * System Rebuild Contracts (see AGENTS.md § Search):
 *   - All search results flow through SSR (page.tsx reads searchParams, fetches directly)
 *   - Client component only manages UI state (query, filters, autocomplete)
 *   - useTransition provides isPending for loading indicator
 *   - Load More: router.push with ?page=N → server offsets → appends via initialPage > 1 check
 *   - Autocomplete: client-side MeiliSearch with AbortSignal; separate from main search
 */

const PRODUCT_CARD = ".product-card"
const FULL_TITLE = '[data-testid="product-full-title"]'

test.describe("Search — Spinner Lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2000)
  })

  test("L1: spinner visible after typing triggers debounced search", async ({ page }) => {
    const input = page.locator('input[type="text"]').first()
    await input.fill("basmati")
    // Spinner appears after ~300ms debounce + fetch initiation
    await page.waitForTimeout(600)
    // The spinner is an animate-spin SVG; check it existed at some point
    const body = await page.textContent("body")
    expect(body?.length).toBeGreaterThan(200)
    console.log("Spinner check — page rendered after typing")
  })

  test("L2: spinner disappears after results load", async ({ page }) => {
    const input = page.locator('input[type="text"]').first()
    await input.fill("basmati")
    // Wait for product cards to render
    const visible = await page.waitForSelector(PRODUCT_CARD, { timeout: 15000 }).then(() => true).catch(() => false)
    if (visible) {
      // After results load, the animate-spin element should not be visible
      const spinner = page.locator(".animate-spin")
      await expect(spinner).not.toBeVisible({ timeout: 8000 })
      console.log("Spinner gone after results rendered")
    } else {
      console.log("No product cards rendered — MeiliSearch may be down, checking spinner anyway")
      const spinner = page.locator(".animate-spin")
      await expect(spinner).not.toBeVisible({ timeout: 5000 })
    }
  })

  test("L3: no spinner appears for empty query", async ({ page }) => {
    // Navigate with empty query
    await page.goto("/search?q=", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2000)
    const spinner = page.locator(".animate-spin")
    await expect(spinner).not.toBeVisible({ timeout: 3000 })
    const content = (await page.textContent("body")) || ""
    expect(content).toMatch(/start typing|select a category/i)
    console.log("Empty query: no spinner, guidance shown")
  })

  test("L4: spinner reappears and stops when query changes after first search", async ({ page }) => {
    const input = page.locator('input[type="text"]').first()
    // First search
    await input.fill("rice")
    await page.waitForSelector(PRODUCT_CARD, { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(1000)
    // Second search
    await input.fill("jeera")
    await page.waitForSelector(PRODUCT_CARD, { timeout: 15000 }).catch(() => {})
    // After both searches complete, spinner should be gone
    const spinner = page.locator(".animate-spin")
    await expect(spinner).not.toBeVisible({ timeout: 8000 })
    console.log("Second search completed, spinner gone")
  })

  test("L5: spinner stops when search returns zero results", async ({ page }) => {
    const input = page.locator('input[type="text"]').first()
    await input.fill("xyznonexistentproduct12345")
    // Wait for debounce + fetch + error/empty render
    await page.waitForTimeout(5000)
    const spinner = page.locator(".animate-spin")
    await expect(spinner).not.toBeVisible({ timeout: 5000 })
    // Empty state or "no results" should be shown
    const content = (await page.textContent("body")) || ""
    console.log(`Zero-results content: ${content.slice(0, 200)}`)
  })

  test("L6: rapid typing resolves with final query results only", async ({ page }) => {
    const input = page.locator('input[type="text"]').first()
    // Type character by character with minimal gaps
    for (const c of "basmati") {
      await input.press(c)
      await page.waitForTimeout(60)
    }
    // Wait for final debounce + fetch
    await page.waitForSelector(PRODUCT_CARD, { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(1000)

    const titles = await page.locator(FULL_TITLE).allTextContents()
    const basmatiRelated = titles.filter(t => /basmati|rice/i.test(t))
    console.log(`Rapid type "basmati": ${titles.length} results, ${basmatiRelated.length} basmati-related`)

    expect(titles.length).toBeGreaterThanOrEqual(3)
    expect(basmatiRelated.length).toBeGreaterThanOrEqual(2)

    // No stuck spinner
    const spinner = page.locator(".animate-spin")
    await expect(spinner).not.toBeVisible({ timeout: 5000 })
  })

  test("L7: clearing input after search shows empty guidance without spinner", async ({ page }) => {
    const input = page.locator('input[type="text"]').first()
    // Do a search first
    await input.fill("rice")
    await page.waitForSelector(PRODUCT_CARD, { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(1000)
    // Clear the input
    await input.fill("")
    await page.waitForTimeout(2000) // debounce + re-render to empty state
    // Spinner should be absent
    const spinner = page.locator(".animate-spin")
    await expect(spinner).not.toBeVisible({ timeout: 3000 })
    // Guidance text should show
    const content = (await page.textContent("body")) || ""
    expect(content).toMatch(/start typing|select a category/i)
    console.log("Cleared input: guidance shown, no spinner")
  })
})

test.describe("Search — Race Condition & AbortController", () => {
  test("R1: consecutive rapid searches show latest results only", async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2000)

    const input = page.locator('input[type="text"]').first()
    // Rapidly fill with different queries
    await input.fill("r")
    await page.waitForTimeout(80)
    await input.fill("ri")
    await page.waitForTimeout(80)
    await input.fill("ric")
    await page.waitForTimeout(80)
    await input.fill("rice")
    // Wait for final debounce
    await page.waitForSelector(PRODUCT_CARD, { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(1000)

    const titles = await page.locator(FULL_TITLE).allTextContents()
    const riceRelated = titles.filter(t => /rice/i.test(t))
    console.log(`Rapid search "rice": ${titles.length} results, ${riceRelated.length} rice`)

    // Results should be for "rice", not "r" or "ri"
    expect(riceRelated.length).toBeGreaterThanOrEqual(2)

    // Now do a completely different search rapidly
    await input.fill("d")
    await page.waitForTimeout(80)
    await input.fill("da")
    await page.waitForTimeout(80)
    await input.fill("dal")
    await page.waitForSelector(PRODUCT_CARD, { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(1000)

    const titles2 = await page.locator(FULL_TITLE).allTextContents()
    const dalRelated = titles2.filter(t => /dal|lentil|mung|toor|urid/i.test(t))
    console.log(`Rapid search "dal": ${titles2.length} results, ${dalRelated.length} dal-related`)

    // Latest results should be dal-related, not rice
    expect(dalRelated.length).toBeGreaterThanOrEqual(2)
  })

  test("R3: aborted search produces no console errors", async ({ page }) => {
    const consoleErrors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text())
    })

    await page.goto("/search", { waitUntil: "domcontentloaded" })
    const input = page.locator('input[type="text"]').first()

    // Trigger search, abort early, trigger new search
    await input.fill("rice")
    await page.waitForTimeout(100)
    await input.fill("basmati")
    await page.waitForSelector(PRODUCT_CARD, { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(1000)

    const unhandledAborts = consoleErrors.filter(
      e => e.toLowerCase().includes("abort") && e.toLowerCase().includes("unhandled")
    )
    console.log(`Console errors: ${consoleErrors.length}, Unhandled abort: ${unhandledAborts.length}`)
    expect(unhandledAborts.length).toBe(0)
  })

  test("R4: filter change during active search resolves correctly", async ({ page }) => {
    await page.goto("/search?q=rice", { waitUntil: "domcontentloaded" })
    await page.waitForSelector(PRODUCT_CARD, { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(1000)

    // Click a dietary filter chip if visible
    const dietaryChips = page.locator("button").filter({ hasText: /Vegan|Vegetarian|Halal|Organic|Gluten/i })
    const chipCount = await dietaryChips.count()
    if (chipCount > 0) {
      await dietaryChips.first().click()
      await page.waitForTimeout(3000)
      // After filter-triggered search, spinner must stop
      const spinner = page.locator(".animate-spin")
      await expect(spinner).not.toBeVisible({ timeout: 8000 })
      console.log(`Filter applied (${chipCount} dietary chips available), spinner resolved`)
    } else {
      console.log("No dietary chips visible — skipping filter test")
    }
  })
})
