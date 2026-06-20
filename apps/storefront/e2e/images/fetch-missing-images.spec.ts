/**
 * Fetch Missing Product Images — Playwright E2E
 *
 * Reads catalogue/mvp/products-missing-images.csv and fetches images from:
 *   1. Ocado product search (primary)
 *   2. Google Images (fallback)
 *
 * Saves to catalogue/mvp/images/{brand}_{handle}.jpg
 *
 * Usage:
 *   npx playwright test --project=e2e e2e/images/fetch-missing-images.spec.ts --headed
 */
import { test, expect } from "@playwright/test"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..", "..", "..", "..")
const CSV_PATH = resolve(ROOT, "catalogue", "mvp", "products-missing-images.csv")
const IMAGE_DIR = resolve(ROOT, "catalogue", "mvp", "images")
const FETCHED_LOG = resolve(IMAGE_DIR, "fetched.csv")
const FAILED_LOG = resolve(IMAGE_DIR, "failed.csv")

// Ensure directories exist
if (!existsSync(IMAGE_DIR)) mkdirSync(IMAGE_DIR, { recursive: true })

// ── Load products ─────────────────────────────────────────
function loadProducts() {
  if (!existsSync(CSV_PATH)) {
    console.error(`Missing CSV: ${CSV_PATH}`)
    return []
  }
  const text = readFileSync(CSV_PATH, "utf8")
  const lines = text.trim().split("\n").slice(1) // skip header
  return lines.map(line => {
    const [handle, title, thumb, issue] = line.split(",")
    const brand = extractBrand(title)
    const brandSlug = brand.toLowerCase().replace(/\s+/g, "-")
    return { handle: (handle || "").trim(), title: (title || "").trim(), thumb, issue, brand, brandSlug }
  })
}

function extractBrand(title) {
  if (!title) return "generic"
  // "TRS - Garam Masala" → "TRS"
  // "Ashoka - Palak Paneer" → "Ashoka"
  const dashIdx = title.indexOf(" - ")
  if (dashIdx > 0) return title.substring(0, dashIdx).trim()
  // "Haldiram's Gulab Jamun Tin" → "Haldiram's"
  return title.split(" ")[0].trim()
}

function safeHandle(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

// ── Ocado source ───────────────────────────────────────────
async function tryOcado(page, product) {
  try {
    const query = encodeURIComponent(product.title.replace(/\s*-\s*/g, " "))
    const url = `https://www.ocado.com/search?entry=${query}`
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 })
    await page.waitForTimeout(3000)

    // Find product cards with images
    const imgs = page.locator("img[alt]")
    const count = await imgs.count()

    for (let i = 0; i < Math.min(count, 10); i++) {
      const alt = (await imgs.nth(i).getAttribute("alt")) || ""
      const src = (await imgs.nth(i).getAttribute("src")) || ""
      // Match product name loosely
      const productWords = product.title.toLowerCase().split(/\s+/).filter(w => w.length > 2)
      const matchCount = productWords.filter(w => alt.toLowerCase().includes(w)).length
      if (matchCount >= 2 && src.startsWith("http") && !src.includes("logo") && !src.includes("icon")) {
        console.log(`  [Ocado] Found: ${alt.substring(0, 50)}...`)
        return src
      }
    }
  } catch (e) {
    console.log(`  [Ocado] Error: ${e.message?.substring(0, 60)}`)
  }
  return null
}

// ── Google Images source ───────────────────────────────────
async function tryGoogleImages(page, product) {
  try {
    const query = encodeURIComponent(`${product.brand} ${product.title}`.replace(/\s*-\s*/g, " "))
    const url = `https://www.google.com/search?tbm=isch&q=${query}`
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 })
    await page.waitForTimeout(2000)

    // Google Images thumbnail grid
    const imgs = page.locator('img.rg_i, img[jsname="Q4LuWd"], img[src^="http"]')
    const count = await imgs.count()

    for (let i = 0; i < Math.min(count, 5); i++) {
      const src = (await imgs.nth(i).getAttribute("src")) || ""
      if (src.startsWith("http") && src.length > 100 && !src.includes("googlelogo") && !src.includes("favicon")) {
        console.log(`  [Google] Found result #${i + 1}`)
        return src
      }
    }
  } catch (e) {
    console.log(`  [Google] Error: ${e.message?.substring(0, 60)}`)
  }
  return null
}

// ── Image download ─────────────────────────────────────────
async function downloadImage(page, imageUrl, product) {
  try {
    const response = await page.request.get(imageUrl, { timeout: 15000 })
    if (!response.ok()) return null
    const buffer = await response.body()
    if (!buffer || buffer.length < 1000) return null // too small = not a real image

    // Determine extension from Content-Type
    const contentType = response.headers()["content-type"] || ""
    let ext = "jpg"
    if (contentType.includes("png")) ext = "png"
    else if (contentType.includes("webp")) ext = "webp"
    else if (contentType.includes("gif")) ext = "gif"

    // AGENTS.md convention: {brand}_{handle}.{ext}
    const filename = `${product.brandSlug}_${product.handle}.${ext}`
    const filepath = resolve(IMAGE_DIR, filename)
    writeFileSync(filepath, buffer)
    console.log(`  ✓ Saved: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`)
    return filename
  } catch (e) {
    console.log(`  ✗ Download failed: ${e.message?.substring(0, 60)}`)
    return null
  }
}

// ── Results tracking ───────────────────────────────────────
let fetched = []
let failed = []

function logFetched(handle, title, source, url, filename) {
  fetched.push({ handle, title, source, url, filename })
  appendCSV(FETCHED_LOG, `${handle},${title.replace(/,/g, ";")},${source},${url},${filename}`)
}

function logFailed(handle, title, reason) {
  failed.push({ handle, title, reason })
  appendCSV(FAILED_LOG, `${handle},${title.replace(/,/g, ";")},${reason}`)
}

function appendCSV(filepath, line) {
  const exists = existsSync(filepath)
  const fd = exists ? readFileSync(filepath, "utf8") : "handle,title,source,url,filename\n"
  // Avoid duplicates
  if (fd.includes(line.split(",")[0])) return
  writeFileSync(filepath, fd.trim() + "\n" + line + "\n")
}

// ═══════════════════════════════════════════════════════════
// MAIN TEST
// ═══════════════════════════════════════════════════════════

test("Fetch missing product images from Ocado + Google Images", async ({ page }) => {
  const products = loadProducts()
  console.log(`\nLoaded ${products.length} products without images\n`)

  // Already-fetched tracking (resume support)
  const alreadyDone = new Set()
  if (existsSync(FETCHED_LOG)) {
    readFileSync(FETCHED_LOG, "utf8").split("\n").slice(1).forEach(l => {
      const handle = l.split(",")[0]?.trim()
      if (handle) alreadyDone.add(handle)
    })
  }
  if (alreadyDone.size > 0) console.log(`Resuming: ${alreadyDone.size} already fetched\n`)

  // Process in batches with rate limiting
  const BATCH_SIZE = 10
  for (let batchStart = 0; batchStart < products.length; batchStart += BATCH_SIZE) {
    const batch = products.slice(batchStart, batchStart + BATCH_SIZE)
    console.log(`\n── Batch ${Math.floor(batchStart / BATCH_SIZE) + 1} (${batchStart + 1}-${Math.min(batchStart + BATCH_SIZE, products.length)}) ──`)

    for (const product of batch) {
      if (alreadyDone.has(product.handle)) {
        console.log(`  ⏭ Skipping ${product.handle} (already fetched)`)
        continue
      }

      console.log(`\n  ⟐ ${product.title} (${product.handle})`)

      // ── Try Ocado ────────────────────────────
      await page.waitForTimeout(2000)
      let imageUrl = await tryOcado(page, product)

      // ── Try Google Images ────────────────────
      if (!imageUrl) {
        await page.waitForTimeout(3000)
        imageUrl = await tryGoogleImages(page, product)
      }

      // ── Download ─────────────────────────────
      if (imageUrl) {
        const filename = await downloadImage(page, imageUrl, product)
        if (filename) {
          logFetched(product.handle, product.title, imageUrl.includes("google") ? "google" : "ocado", imageUrl, filename)
        } else {
          logFailed(product.handle, product.title, "Download failed")
        }
      } else {
        logFailed(product.handle, product.title, "Not found on Ocado or Google Images")
      }
    }

    // Rate limit between batches
    if (batchStart + BATCH_SIZE < products.length) {
      await page.waitForTimeout(5000)
    }
  }

  // ── Final report ─────────────────────────────
  console.log(`\n${"=".repeat(60)}`)
  console.log(`  FETCHED: ${fetched.length} | FAILED: ${failed.length}`)
  console.log(`  Images saved to: ${IMAGE_DIR}`)
  console.log(`${"=".repeat(60)}`)

  // Don't fail the test on missing images — this is a collection script
  expect(true).toBe(true)
})
