/**
 * Search Intelligence — Playwright Headless Scraper
 * 
 * Run: node scraper-headless.mjs [--limit=N]
 * Install: npm install && npx playwright install chromium
 */
import { chromium } from "playwright"
import fs from "fs"

const OUT_DIR = "per-category"
const DELAY_MS = 8000
const PK = "pk_72deb296139d27885561a0fa58b77cbed187d8c5912390c2dc1912cb477083d3"

const BRANDS = ["Natco","TRS","East End","Heera","Swad","KTC","Amul","MDH","Everest","Shan","MTR","Aachi","Haldiram","Jabsons","Lijjat","Priya","Mother's Recipe","Nilon's","Bedekar","Patak's","Parle","Britannia","Wagh Bakri","Brooke Bond","Tetley","Tilda","Kohinoor","Lal Qilla","Daawat","India Gate","Aashirvaad","Pillsbury","Elephant"]

function cleanQuery(title) {
  let q = title
  for (const b of BRANDS) q = q.replace(new RegExp("\\b" + b.replace(/['.]/g, "['.]?") + "\\b", "gi"), "").trim()
  q = q.replace(/\s+\d+\.?\d*\s*(g|kg|ml|l|litre|litres|grams|kilos?)\b/gi, "").trim()
  q = q.replace(/\s*\(.*?\)\s*/g, " ").replace(/\bFull Case\b/gi, "").replace(/\bBoiled\b/gi, "").replace(/\s+/g, " ").trim()
  return q || title
}

async function fetchCatalog() {
  const regRes = await fetch("http://localhost:9000/store/regions", { headers: { "x-publishable-api-key": PK } })
  const { regions } = await regRes.json()
  const all = []; let offset = 0
  while (true) {
    const res = await fetch("http://localhost:9000/store/products?limit=100&offset=" + offset + "&region_id=" + regions[0].id + "&fields=id,title,handle,categories.handle", { headers: { "x-publishable-api-key": PK } })
    const { products } = await res.json()
    all.push(...(products || []))
    if ((products || []).length < 100) break
    offset += 100
  }
  return all
}

async function scrapePlatform(page, query, platform) {
  const urls = {
    blinkit: "https://blinkit.com/s/?q=" + encodeURIComponent(query),
    jiomart: "https://www.jiomart.com/catalogsearch/result/?q=" + encodeURIComponent(query),
  }
  try {
    await page.goto(urls[platform], { waitUntil: "domcontentloaded", timeout: 15000 })
    await page.waitForTimeout(3000)

    const result = await page.evaluate(function(searchTerm) {
      var h = document.documentElement.outerHTML
      var b = document.body ? document.body.innerText : ""
      var a = [], p = [], c = [], t = []

      document.querySelectorAll('[class*="suggest"], [class*="autocomplete"], [class*="Suggestion"]').forEach(function(e) { var x = e.textContent ? e.textContent.trim() : ""; if (x.length > 1) a.push(x) })
      document.querySelectorAll('a[href*="/pr/"], a[href*="/p/"], [class*="ProductCard"], [class*="product-card"]').forEach(function(e) { var n = e.getAttribute("title") || e.getAttribute("aria-label") || ""; if (n && n.length > 3) p.push(n.trim()) })
      document.querySelectorAll('[class*="breadcrumb"] a, nav[aria-label*="bread"] a').forEach(function(e) { var x = e.textContent ? e.textContent.trim() : ""; if (x) c.push(x) })
      document.querySelectorAll('[class*="tag"], [class*="badge"], [class*="pill"]').forEach(function(e) { var x = e.textContent ? e.textContent.trim() : ""; if (x) t.push(x) })

      return { html_length: h.length, body_preview: b.slice(0, 500), suggestions: a.slice(0, 15), products: p.slice(0, 10), breadcrumb: c.slice(0, 10), tags: t.slice(0, 20) }
    }, query)

    result.status = 200
    result.search_term = query
    return result
  } catch (e) {
    return { status: 0, error: e.message, search_term: query, suggestions: [], products: [], breadcrumb: [], tags: [] }
  }
}

async function main() {
  const limitArg = process.argv.find(function(a) { return a.startsWith("--limit=") })
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : 999

  console.log("Search Intelligence — Headless Scraper\n")

  const all = await fetchCatalog()
  console.log(all.length + " products\n")

  console.log("Launching browser...")
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" })
  const page = await ctx.newPage()

  const toProcess = all.slice(0, limit)
  let done = 0

  for (const p of toProcess) {
    const cat = (p.categories && p.categories[0] && p.categories[0].handle) || "uncategorized"
    const outFile = OUT_DIR + "/" + cat + "/" + p.handle + ".json"
    if (fs.existsSync(outFile)) { done++; continue }

    const q = cleanQuery(p.title)
    console.log("[" + (done + 1) + "/" + toProcess.length + "] " + p.title + " -> \"" + q + "\"")
    process.stdout.write("  BlinkIt... ")

    const b = await scrapePlatform(page, q, "blinkit")
    process.stdout.write((b.products ? b.products.length : 0) + " products")
    if (b.error) process.stdout.write(" (" + b.error.slice(0, 60) + ")")
    await page.waitForTimeout(DELAY_MS)

    process.stdout.write("  | JioMart... ")
    const j = await scrapePlatform(page, q, "jiomart")
    process.stdout.write((j.products ? j.products.length : 0) + " products\n")
    if (j.error) process.stdout.write("  (" + j.error.slice(0, 60) + ")\n")
    await page.waitForTimeout(DELAY_MS)

    fs.mkdirSync(OUT_DIR + "/" + cat, { recursive: true })
    fs.writeFileSync(outFile, JSON.stringify({
      our_handle: p.handle, our_title: p.title, cleaned_query: q,
      extracted_at: new Date().toISOString(),
      blinkit: b, jiomart: j,
    }, null, 2))
    done++
  }

  await browser.close()
  console.log("\nDone: " + done + " products")
}

main().catch(function(e) { console.error(e.message); process.exit(1) })
