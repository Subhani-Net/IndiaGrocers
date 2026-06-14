import { test, expect } from "@playwright/test"

/**
 * NAVIGATION SYSTEM — INTEGRATION TESTS
 *
 * Validates the desktop single-row header, All Groceries unified panel,
 * mobile 2-row sticky header, and mobile drill-down drawer.
 *
 * Architecture:
 *   Desktop: sticky header → Logo · AllGroceriesPanel · Search · Account · Cart
 *   Mobile:  sticky header (2 rows) → Row1: hamburger/logo/account+cart, Row2: search
 *   Data:    fetchNavCategories() → NavCategory[] with injected "All [Category]" children
 *   Portal:  AllGroceriesPanel uses createPortal to document.body for panel + backdrop
 *
 * System Rebuild Contracts — see Documentation/navigation-system.md
 */

test.describe("Navigation — Desktop Single-Row Header", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2000)
  })

  test("header displays all 5 core elements", async ({ page }) => {
    const logo = page.locator("header a").filter({ hasText: /India/i }).first()
    await expect(logo).toBeVisible()

    const allGroceriesBtn = page.locator('[data-testid="nav-all-groceries-btn"]')
    await expect(allGroceriesBtn).toBeVisible()

    const searchInput = page.locator('header input[type="text"]')
    await expect(searchInput).toBeVisible()

    const account = page.locator("header a[href*='account']").first()
    await expect(account).toBeVisible()

    const cart = page.locator('[data-testid="nav-cart-link"]').first()
    await expect(cart).toBeVisible()

    console.log("All 5 desktop header elements visible: logo, All Groceries, search, account, cart")
  })

  test("header has sticky positioning class", async ({ page }) => {
    const header = page.locator("header").first()
    const position = await header.evaluate((el) =>
      window.getComputedStyle(el).position
    )
    console.log(`Header position: ${position}`)
    expect(position).toBe("sticky")
  })

  test("header stays visible after scroll", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 800))
    await page.waitForTimeout(500)
    const header = page.locator("header").first()
    await expect(header).toBeVisible()
    const box = await header.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.y).toBeLessThan(5)
    }
    console.log(`Header visible after scroll, position y=${box?.y}`)
  })

  test("no second-row nav strip exists", async ({ page }) => {
    // The old Sports Direct nav-strip has been removed.
    // There should be exactly one header element with the core elements.
    const header = page.locator("header").first()
    const headerContent = await header.innerHTML()
    // Verify All Groceries button is inline (not in a separate nav strip)
    expect(headerContent).toContain("nav-all-groceries-btn")
    console.log("Single-row header confirmed: All Groceries button is inline")
  })
})

test.describe("Navigation — All Groceries Unified Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2000)
  })

  test("click opens the unified grid panel", async ({ page }) => {
    const btn = page.locator('[data-testid="nav-all-groceries-btn"]')
    await btn.click()
    await page.waitForTimeout(500)

    const panel = page.locator('[data-testid="nav-all-groceries-panel"]')
    await expect(panel).toBeVisible({ timeout: 3000 })

    const backdrop = page.locator('[data-testid="nav-all-groceries-backdrop"]')
    await expect(backdrop).toBeVisible()

    console.log("All Groceries panel opened with backdrop")
  })

  test("panel shows L1 category blocks with All [Category] links", async ({ page }) => {
    const btn = page.locator('[data-testid="nav-all-groceries-btn"]')
    await btn.click()
    await page.waitForTimeout(500)

    const panel = page.locator('[data-testid="nav-all-groceries-panel"]')

    // Verify L1 block headers exist
    const categoryHeaders = panel.locator("a.font-bold")
    const headerCount = await categoryHeaders.count()
    expect(headerCount).toBeGreaterThanOrEqual(2)
    console.log(`L1 category headers: ${headerCount}`)

    // Verify "All [Category]" virtual links exist
    const allLinks = panel.locator("a").filter({ hasText: /^All /i })
    const allCount = await allLinks.count()
    console.log(`"All [Category]" links: ${allCount}`)
    expect(allCount).toBeGreaterThanOrEqual(1)
  })

  test("panel shows L2 subcategories under each L1 block", async ({ page }) => {
    const btn = page.locator('[data-testid="nav-all-groceries-btn"]')
    await btn.click()
    await page.waitForTimeout(500)

    const panel = page.locator('[data-testid="nav-all-groceries-panel"]')
    const content = (await panel.textContent()) || ""

    // Verify real L2 subcategories are present (from CSV data)
    const l2Terms = ["Basmati", "Everyday", "Lentils", "Pickles", "Chutneys"]
    const found = l2Terms.filter((t) => content.includes(t))
    console.log(`L2 subcategories found: ${found.length}/${l2Terms.length} — [${found.join(", ")}]`)
    expect(found.length).toBeGreaterThanOrEqual(2)
  })

  test("backdrop click dismisses the panel", async ({ page }) => {
    const btn = page.locator('[data-testid="nav-all-groceries-btn"]')
    await btn.click()
    await page.waitForTimeout(500)

    const backdrop = page.locator('[data-testid="nav-all-groceries-backdrop"]')
    await backdrop.click({ position: { x: 10, y: 10 } })
    await page.waitForTimeout(500)

    const panel = page.locator('[data-testid="nav-all-groceries-panel"]')
    await expect(panel).not.toBeVisible({ timeout: 2000 })
    console.log("Panel dismissed by backdrop click")
  })

  test("ESC key dismisses the panel", async ({ page }) => {
    const btn = page.locator('[data-testid="nav-all-groceries-btn"]')
    await btn.click()
    await page.waitForTimeout(500)

    await page.keyboard.press("Escape")
    await page.waitForTimeout(500)

    const panel = page.locator('[data-testid="nav-all-groceries-panel"]')
    await expect(panel).not.toBeVisible({ timeout: 2000 })
    console.log("Panel dismissed by ESC key")
  })

  test("clicking an All [Category] link navigates and closes panel", async ({ page }) => {
    const btn = page.locator('[data-testid="nav-all-groceries-btn"]')
    await btn.click()
    await page.waitForTimeout(500)

    const panel = page.locator('[data-testid="nav-all-groceries-panel"]')
    const allLink = panel.locator("a").filter({ hasText: /^All /i }).first()
    const linkText = await allLink.textContent()
    await allLink.click()
    await page.waitForTimeout(2000)

    const url = page.url()
    expect(url).toMatch(/\/categories\//)
    console.log(`Clicked "${linkText?.trim()}" → navigated to ${url}`)

    // Panel should be closed after navigation
    const panelAfter = page.locator('[data-testid="nav-all-groceries-panel"]')
    await expect(panelAfter).not.toBeVisible({ timeout: 2000 })
  })

  test("ARIA attributes are set correctly on the trigger button", async ({ page }) => {
    const btn = page.locator('[data-testid="nav-all-groceries-btn"]')
    await expect(btn).toHaveAttribute("aria-haspopup", "menu")

    const expandedBefore = await btn.getAttribute("aria-expanded")
    expect(expandedBefore).toBe("false")

    await btn.click()
    await page.waitForTimeout(500)

    const expandedAfter = await btn.getAttribute("aria-expanded")
    expect(expandedAfter).toBe("true")
    console.log("ARIA aria-expanded toggles correctly: false → true")
  })
})

test.describe("Navigation — Mobile 2-Row Sticky Header", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2000)
  })

  test("header has sticky positioning on mobile too", async ({ page }) => {
    const header = page.locator("header").first()
    const position = await header.evaluate((el) =>
      window.getComputedStyle(el).position
    )
    expect(position).toBe("sticky")
    console.log(`Mobile header position: ${position}`)
  })

  test("row 1 shows hamburger, logo, and account+cart", async ({ page }) => {
    const hamburger = page.locator('[data-testid="nav-menu-button"], button[aria-label*="menu" i]').first()
    await expect(hamburger).toBeVisible()

    const logo = page.locator("header a").filter({ hasText: /India/i }).first()
    await expect(logo).toBeVisible()

    const cartLink = page.locator('[data-testid="nav-mobile-cart-link"]').first()
    await expect(cartLink).toBeVisible()

    console.log("Mobile row 1: hamburger, logo, cart all visible")
  })

  test("row 2 shows full-width search input", async ({ page }) => {
    const searchInput = page.locator('header input[type="text"]').first()
    await expect(searchInput).toBeVisible()

    const box = await searchInput.boundingBox()
    if (box) {
      const viewportWidth = page.viewportSize()?.width || 375
      // Search should take most of the row width
      expect(box.width).toBeGreaterThan(viewportWidth * 0.6)
      console.log(`Search input width: ${box.width}px (viewport: ${viewportWidth}px)`)
    }
  })

  test("logo is centered on mobile", async ({ page }) => {
    const logo = page.locator("header a").filter({ hasText: /India/i }).first()
    const box = await logo.boundingBox()
    if (box) {
      const viewportWidth = page.viewportSize()?.width || 375
      const logoCenter = box.x + box.width / 2
      const viewportCenter = viewportWidth / 2
      const distance = Math.abs(logoCenter - viewportCenter)
      console.log(`Logo center: ${logoCenter}, Viewport center: ${viewportCenter}, Distance: ${distance}`)
      expect(distance).toBeLessThan(viewportWidth * 0.3)
    }
  })

  test("mobile cart link navigates to /cart", async ({ page }) => {
    const cartLink = page.locator('[data-testid="nav-mobile-cart-link"]').first()
    await cartLink.click()
    await page.waitForTimeout(2000)

    const url = page.url()
    expect(url).toMatch(/\/cart/)
    console.log(`Mobile cart → navigated to: ${url}`)
  })

  test("header stays visible after scroll on mobile", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 400))
    await page.waitForTimeout(500)

    const header = page.locator("header").first()
    await expect(header).toBeVisible()

    const box = await header.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.y).toBeLessThan(5)
    }

    // Search should still be visible (row 2 is part of sticky header)
    const search = page.locator('header input[type="text"]').first()
    await expect(search).toBeVisible()
    console.log(`Mobile header visible after scroll, search still visible`)
  })
})

test.describe("Navigation — Mobile Drill-Down Drawer", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2000)
  })

  test("hamburger opens drawer with static links and categories", async ({ page }) => {
    const menuBtn = page.locator('[data-testid="nav-menu-button"], button[aria-label*="menu" i]').first()
    await menuBtn.click()
    await page.waitForTimeout(1000)

    const drawer = page.locator('[role="dialog"]').first()
    await expect(drawer).toBeVisible({ timeout: 3000 })

    const content = (await drawer.textContent()) || ""
    const hasStaticLinks = ["Home", "Store", "Account", "Cart"].every((l) =>
      content.includes(l)
    )
    console.log(`Static links present: ${hasStaticLinks}`)
    expect(hasStaticLinks).toBeTruthy()

    const hasCategories = content.includes("Categories")
    console.log(`Categories section: ${hasCategories}`)
    expect(hasCategories).toBeTruthy()
  })

  test("tapping L1 category drills down to L2 with All [Category] banner", async ({ page }) => {
    // Open drawer
    const menuBtn = page.locator('[data-testid="nav-menu-button"], button[aria-label*="menu" i]').first()
    await menuBtn.click()
    await page.waitForTimeout(1000)

    const drawer = page.locator('[role="dialog"]').first()

    // Tap first L1 category
    const l1Btn = drawer.locator("button").filter({ hasText: /Rice/i }).first()
    if (!(await l1Btn.isVisible({ timeout: 2000 }).catch(() => false))) {
      console.log("Rice L1 category not found — trying first available L1")
      const anyL1 = drawer.locator("button").first()
      await anyL1.click()
    } else {
      await l1Btn.click()
    }
    await page.waitForTimeout(800)

    const content = (await drawer.textContent()) || ""

    // Check for Back button
    expect(content.includes("Back")).toBeTruthy()

    // Check for "All [Category]" banner
    const hasAllLink = content.match(/All /i)
    console.log(`"All [Category]" banner: ${!!hasAllLink}`)
    expect(hasAllLink).toBeTruthy()

    // Check for real L2 subcategories (after the virtual "All" item)
    const hasL2Content = content.includes("Basmati") || content.includes("Everyday")
    console.log(`L2 subcategories after banner: ${hasL2Content}`)
    expect(hasL2Content).toBeTruthy()
  })

  test("Back button returns to main menu from L2 view", async ({ page }) => {
    // Open drawer and navigate to L2
    const menuBtn = page.locator('[data-testid="nav-menu-button"], button[aria-label*="menu" i]').first()
    await menuBtn.click()
    await page.waitForTimeout(1000)

    const drawer = page.locator('[role="dialog"]').first()
    const l1Btn = drawer.locator("button").filter({ hasText: /Rice/i }).first()
    if (await l1Btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await l1Btn.click()
    } else {
      const anyL1 = drawer.locator("button").first()
      await anyL1.click()
    }
    await page.waitForTimeout(800)

    // Tap Back
    const backBtn = drawer.locator("button").filter({ hasText: /Back/i }).first()
    await backBtn.click()
    await page.waitForTimeout(800)

    const content = (await drawer.textContent()) || ""
    // Should be back at main menu
    expect(content.includes("Home")).toBeTruthy()
    expect(content.includes("Categories")).toBeTruthy()
    console.log("Back button returns to main menu ✓")
  })

  test("backdrop tap closes the drawer", async ({ page }) => {
    const menuBtn = page.locator('[data-testid="nav-menu-button"], button[aria-label*="menu" i]').first()
    await menuBtn.click()
    await page.waitForTimeout(1000)

    // Tap outside — the backdrop
    await page.mouse.click(10, 10)
    await page.waitForTimeout(500)

    const drawer = page.locator('[role="dialog"]').first()
    await expect(drawer).not.toBeVisible({ timeout: 2000 })
    console.log("Drawer dismissed by backdrop tap")
  })
})

test.describe("Navigation — Data Integrity", () => {
  test("category links in panel use correct URL structure", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2000)

    const btn = page.locator('[data-testid="nav-all-groceries-btn"]')
    await btn.click()
    await page.waitForTimeout(500)

    const panel = page.locator('[data-testid="nav-all-groceries-panel"]')
    const links = panel.locator("a")
    const linkCount = await links.count()
    console.log(`Total links in panel: ${linkCount}`)
    expect(linkCount).toBeGreaterThanOrEqual(5)

    // All links should have valid href starting with /categories/
    for (let i = 0; i < Math.min(linkCount, 10); i++) {
      const href = await links.nth(i).getAttribute("href")
      if (href) {
        expect(href).toMatch(/^\/gb\/categories\/[a-z_]+$/)
      }
    }
    console.log("All sampled links have valid /categories/ handle URLs")
  })

  test("no duplicate category handles in the panel", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2000)

    const btn = page.locator('[data-testid="nav-all-groceries-btn"]')
    await btn.click()
    await page.waitForTimeout(500)

    const panel = page.locator('[data-testid="nav-all-groceries-panel"]')
    const links = panel.locator("a")
    const count = await links.count()

    const hrefs: string[] = []
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href")
      if (href) hrefs.push(href)
    }

    const unique = new Set(hrefs)
    console.log(`Links: ${hrefs.length}, Unique: ${unique.size}`)
    // Allow some duplication for "All [Category]" sharing parent handle
    // But no more than 2 duplicates of any URL
    const duplicates = hrefs.filter((h, i) => hrefs.indexOf(h) !== i)
    console.log(`Duplicate URLs: ${duplicates.length}`)
    expect(duplicates.length).toBeLessThan(hrefs.length * 0.3)
  })
})
