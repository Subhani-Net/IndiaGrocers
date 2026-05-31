/**
 * Download product images from Natco Shopify and save with convention:
 *   natco_{product-slug}.{ext}
 *
 * Usage: node scripts/download-natco-images.mjs
 * Prerequisites: Backend running on :9000
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const IMG_DIR = resolve(ROOT, "apps/storefront/public/images")
const BASE = "http://127.0.0.1:9000"

// All Shopify JSON files we fetched
const OUTFILES = [
  "tool_e727f970c001iGsCnPszJ3NkKU",
  "tool_e750f76cb0019fUhhV7LBFuwFu",
  "tool_e75d8b59f0019D2TM1pzEYOeLt",
  "tool_e75d890d000115TlXZap7AGYuu",
  "tool_e75f3ebef001domtF9anGMeYc4",
  "tool_e75f3ee6f001f27S3a4SdPylpe",
  "tool_e75f3f12a001LLcb35JzMhO3Kw",
  "tool_e75f4128f001BzAJlfR8i1swIE",
]
const TOOL_DIR = "C:/Users/Subhani/.local/share/opencode/tool-output"

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 80)
}

async function main() {
  if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true })

  // 1. Collect all Shopify image URLs by product handle
  console.log("Collecting image URLs from Shopify JSON...")
  const productImages = {}
  for (const f of OUTFILES) {
    const fp = resolve(TOOL_DIR, f)
    try {
      const raw = readFileSync(fp, "utf-8")
      const data = JSON.parse(raw)
      if (!data.products) continue
      for (const p of data.products) {
        if (!p.handle || !p.title) continue
        const imgSrc = p.images?.[0]?.src
        if (!imgSrc) continue
        productImages[p.handle] = {
          title: p.title,
          src: imgSrc,
          ext: imgSrc.split("?").shift().split(".").pop() || "jpg",
        }
      }
    } catch (e) { /* skip missing files */ }
  }
  console.log(`  ${Object.keys(productImages).length} products with images\n`)

  // 2. Download images (skip if already exists with correct name)
  console.log("Downloading images...")
  let downloaded = 0, skipped = 0, failed = 0, total = Object.keys(productImages).length

  for (const [handle, info] of Object.entries(productImages)) {
    const slug = slugify(handle)
    const filename = `natco_${slug}.${info.ext}`
    const filepath = resolve(IMG_DIR, filename)

    if (existsSync(filepath)) { skipped++; continue }

    try {
      const r = await fetch(info.src)
      if (!r.ok) { failed++; continue }
      const buf = Buffer.from(await r.arrayBuffer())
      writeFileSync(filepath, buf)
      downloaded++
      if (downloaded % 25 === 0) console.log(`  ${downloaded}/${total}`)
    } catch (e) { failed++ }
  }
  console.log(`\nDownloaded: ${downloaded}, Skipped (exists): ${skipped}, Failed: ${failed}\n`)

  // 3. Assign thumbnails to products without one
  console.log("Assigning thumbnails to products...")

  // Fetch auth token
  const authRes = await fetch(BASE + "/auth/user/emailpass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  const authToken = (await authRes.json()).token
  const headers = { Authorization: "Bearer " + authToken, "Content-Type": "application/json" }

  // Fetch all products
  const allProds = []
  let off = 0
  while (true) {
    const r = await (await fetch(BASE + "/admin/products?limit=100&offset=" + off + "&fields=id,title,handle,thumbnail", { headers })).json()
    if (!r.products?.length) break
    allProds.push(...r.products)
    off += 100
  }

  let assigned = 0
  for (const p of allProds) {
    if (p.thumbnail && p.thumbnail !== "/images/") continue
    const slug = slugify(p.handle)
    const jpgPath = resolve(IMG_DIR, `natco_${slug}.jpg`)
    const pngPath = resolve(IMG_DIR, `natco_${slug}.png`)

    let file = null
    if (existsSync(jpgPath)) file = `natco_${slug}.jpg`
    else if (existsSync(pngPath)) file = `natco_${slug}.png`

    // Fallback: try other handles from Shopify that match this product title
    if (!file) {
      for (const [shopHandle, shopInfo] of Object.entries(productImages)) {
        if (shopInfo.title === p.title) {
          const altSlug = slugify(shopHandle)
          const altJpg = resolve(IMG_DIR, `natco_${altSlug}.jpg`)
          const altPng = resolve(IMG_DIR, `natco_${altSlug}.png`)
          if (existsSync(altJpg)) { file = `natco_${altSlug}.jpg`; break }
          if (existsSync(altPng)) { file = `natco_${altSlug}.png`; break }
        }
      }
    }

    if (file) {
      await fetch(BASE + "/admin/products/" + p.id, {
        method: "POST", headers, body: JSON.stringify({ thumbnail: "/images/" + file }),
      })
      assigned++
      if (assigned % 30 === 0) console.log(`  ${assigned}/${allProds.length}`)
    }
  }

  console.log(`Thumbnails assigned: ${assigned}/${allProds.length}`)
  console.log("\n✅ Next: cd apps/meilisearch && npm run reindex")
}

main().catch(console.error)
