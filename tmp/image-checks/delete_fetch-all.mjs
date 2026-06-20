/**
 * Combined Brand Image Scraper — Food Bazaar (Shopify API) + Asian Dukan (Magento search)
 *
 * Sources:
 *   Food Bazaar: /collections/{brand}/products.json
 *   Asian Dukan:  /catalogsearch/result/?q={brand}
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { chromium } from "playwright"

const __dirname = dirname(fileURLToPath(import.meta.url))
const CSV_PATH = resolve(__dirname, "products-missing-images.csv")
const IMAGE_DIR = resolve(__dirname, "images")
const LOG = resolve(IMAGE_DIR, "fetched-latest.csv")

if (!existsSync(IMAGE_DIR)) mkdirSync(IMAGE_DIR, { recursive: true })

// ── Spelling canonicalization ──────────────────────────────
const CANONICAL = { sambar: "sambhar", sambhar: "sambhar",
  halwa: "halwa", kheer: "kheer", kulfi: "kulfi", zarda: "zarda",
  sooji: "sooji", suji: "sooji", moong: "moong", mung: "moong" }

function canon(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
    .split(" ").map(w => CANONICAL[w] || w).join(" ")
}

function wordMatch(ourTitle, theirTitle) {
  const ow = canon(ourTitle).split(" ").filter(w => w.length > 1)
  const tw = canon(theirTitle).split(" ")
  if (ow.length < 2) return false
  return ow.every(w => tw.includes(w))
}

// ── Load missing products ─────────────────────────────────
function loadMissing() {
  if (!existsSync(CSV_PATH)) return []
  return readFileSync(CSV_PATH, "utf8").trim().split("\n").slice(1).map(line => {
    const parts = line.split(",")
    return { handle: (parts[0] || "").trim(), title: (parts[1] || "").trim() }
  }).filter(p => p.handle && p.title)
}

// ── State ─────────────────────────────────────────────────
const ALREADY = new Set()
if (existsSync(LOG)) {
  readFileSync(LOG, "utf8").split("\n").slice(1).forEach(l => {
    const h = l.split(",")[0]?.trim()
    if (h) ALREADY.add(h)
  })
}

// ═══════════════════════════════════════════════════════════
// SOURCE 1: Food Bazaar (Shopify API)
// ═══════════════════════════════════════════════════════════
async function scrapeFoodBazaar(page) {
  console.log("── Food Bazaar (Shopify API) ──\n")
  const brands = ["trs", "shan", "pataks", "laziza", "ashoka", "britannia", "parle", "mdh", "east-end", "priya", "haldirams", "mtr", "everest", "bikaji", "cadbury"]

  const allProducts = []
  for (const brand of brands) {
    try {
      const res = await page.request.get(`https://foodbazaar.co.uk/collections/${brand}/products.json?limit=250`)
      if (!res.ok()) continue
      const data = await res.json()
      const products = data.products || []
      if (products.length === 0) continue
      for (const p of products) {
        const img = p.image?.src || p.images?.[0]?.src || ""
        if (img) allProducts.push({ title: p.title, src: img.replace(/_(\d+x\d+)?\./, ".").replace(/\?v=\d+/, ""), source: "foodbazaar" })
      }
      console.log(`  ${brand}: ${products.length} products`)
    } catch (e) { }
  }
  console.log(`  Total: ${allProducts.length} products\n`)
  return allProducts
}

// ═══════════════════════════════════════════════════════════
// SOURCE 2: Asian Dukan (Magento search)
// ═══════════════════════════════════════════════════════════
async function scrapeAsianDukan(page) {
  console.log("── Asian Dukan (Magento) ──\n")
  const queries = ["priya", "east+end", "haldiram", "bikaji", "cadbury", "mtr", "everest", "shan"]

  const allProducts = []
  for (const q of queries) {
    try {
      await page.goto(`https://www.asiandukan.co.uk/catalogsearch/result/?q=${q}`, { waitUntil: "networkidle", timeout: 25000 })
      await page.waitForTimeout(2000)
      const items = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("img[alt]"))
          .filter(i => i.src.includes("http") && i.alt.length > 3 && !i.src.includes("logo") && !i.src.includes("icon"))
          .map(i => ({ alt: i.alt.trim(), src: i.src }))
      })
      console.log(`  ${q}: ${items.length} imgs`)
      items.forEach(i => allProducts.push({ title: i.alt, src: i.src, source: "asiandukan" }))
    } catch (e) { }
  }
  console.log(`  Total: ${allProducts.length} products\n`)
  return allProducts
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════
async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ userAgent: "Mozilla/5.0", viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  const missing = loadMissing()
  const toFind = missing.filter(p => !ALREADY.has(p.handle) && !existsSync(resolve(IMAGE_DIR, p.handle + ".jpg")) && !existsSync(resolve(IMAGE_DIR, p.handle + ".png")) && !existsSync(resolve(IMAGE_DIR, p.handle + ".webp")))

  // Also check already downloaded
  for (const p of missing) {
    if (existsSync(resolve(IMAGE_DIR, p.handle + ".jpg")) || existsSync(resolve(IMAGE_DIR, p.handle + ".png")) || existsSync(resolve(IMAGE_DIR, p.handle + ".webp"))) {
      ALREADY.add(p.handle)
    }
  }
  const remaining = missing.filter(p => !ALREADY.has(p.handle))

  console.log(`Missing: ${missing.length} | Already fetched: ${ALREADY.size} | To find: ${remaining.length}\n`)

  // Scrape
  const fb = await scrapeFoodBazaar(page)
  const ad = await scrapeAsianDukan(page)
  const allProducts = [...fb, ...ad]

  // Match
  console.log("── Matching ──\n")
  const matches = new Map() // handle → { src, source, alt }
  for (const prod of allProducts) {
    for (const op of remaining) {
      if (matches.has(op.handle)) continue
      if (wordMatch(op.title, prod.title)) {
        matches.set(op.handle, { src: prod.src, source: prod.source, alt: prod.title })
        break
      }
    }
  }

  // Download
  console.log(`\n  Matches: ${matches.size}\n── Downloading ──\n`)
  let dl = 0
  for (const [handle, { src, source, alt }] of matches) {
    const op = missing.find(p => p.handle === handle)
    if (ALREADY.has(handle)) continue
    try {
      const r = await page.request.get(src, { timeout: 20000 })
      if (!r.ok()) { console.log(`  ✗ ${handle}: HTTP ${r.status()}`); continue }
      const buf = await r.body()
      if (!buf || buf.length < 500) { console.log(`  ✗ ${handle}: too small`); continue }
      const ct = r.headers()["content-type"] || ""
      let ext = "jpg"
      if (ct.includes("png")) ext = "png"
      if (ct.includes("webp")) ext = "webp"
      const fn = `${handle}.${ext}`
      writeFileSync(resolve(IMAGE_DIR, fn), buf)
      console.log(`  ✓ ${fn} (${(buf.length / 1024).toFixed(1)} KB) ← ${source}`)
      dl++
      ALREADY.add(handle)
      appendLog(handle, op?.title || "", source, src, fn, alt)
    } catch (e) { console.log(`  ✗ ${handle}: ${(e.message || "").substring(0, 40)}`) }
    await new Promise(r => setTimeout(r, 200))
  }

  await browser.close()
  console.log(`\n${"=".repeat(60)}`)
  console.log(`  DOWNLOADED: ${dl}/${matches.size} matches`)
  console.log(`  Still missing: ${missing.length - ALREADY.size}`)
  console.log(`${"=".repeat(60)}`)
}

function appendLog(handle, title, source, url, filename, alt) {
  const e = existsSync(LOG)
  const hdr = e ? "" : "handle,title,source,url,filename,alt\n"
  writeFileSync(LOG, (e ? readFileSync(LOG, "utf8") : hdr) +
    `${handle},${title.replace(/,/g, ";")},${source},${url},${filename},${(alt || "").replace(/,/g, ";")}\n`)
}

main().catch(e => { console.error(`FATAL: ${e.message}`); process.exit(1) })
