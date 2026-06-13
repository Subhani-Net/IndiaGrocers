/**
 * TRS Images Fix Script
 *
 * All 50 TRS products were imported without thumbnails.
 * Images exist on disk at apps/storefront/public/images/trs_*.{png,jpg}
 * This script maps each TRS product to its image file and updates Medusa.
 *
 * Usage: node scripts/fix-trs-images.mjs --apply
 */

import { readdirSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const BASE = "http://127.0.0.1:9000"
const APPLY = process.argv.includes("--apply")
const IMG_DIR = resolve(ROOT, "apps/storefront/public/images")

// Build a lookup from slug → file on disk
const imgFiles = readdirSync(IMG_DIR).filter(f => f.startsWith("trs_"))
const slugToFile = {}
for (const f of imgFiles) {
  const noExt = f.replace(/\.(png|jpg|jpeg|webp)$/i, "")
  slugToFile[noExt] = f
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 80)
}

async function login() {
  const res = await fetch(BASE + "/auth/user/emailpass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: "Bearer " + (await res.json()).token, "Content-Type": "application/json" }
}

async function main() {
  const headers = await login()
  const CAT = await (await fetch(BASE + "/admin/product-categories?limit=300&fields=id,handle", { headers })).json()
  const catMap = {}
  CAT.product_categories.forEach(c => { catMap[c.handle] = c.id })

  // Fetch all TRS products
  const trsProducts = []
  let off = 0
  while (true) {
    const r = await (await fetch(BASE + "/admin/products?limit=100&offset=" + off + "&fields=id,title,handle,thumbnail,images", { headers })).json()
    if (!r.products || !r.products.length) break
    for (const p of r.products) {
      if (p.title?.startsWith("TRS")) trsProducts.push(p)
    }
    off += 100
  }

  console.log(`Found ${trsProducts.length} TRS products in DB\n`)

  let fixed = 0, missing = 0, skipped = 0

  for (const p of trsProducts) {
    const title = p.title
    const nameSlug = slugify(title.replace(/^TRS\s*/i, ""))
    const imgSlug = "trs_" + nameSlug

    const file = slugToFile[imgSlug]
    if (!file) {
      console.log(`  MISSING: ${title}  (expected: ${imgSlug}.png)`)
      missing++
      continue
    }

    const thumbnailPath = "/images/" + file
    if (p.thumbnail === thumbnailPath) {
      console.log(`  SKIP (already set): ${title}`)
      skipped++
      continue
    }

    if (!APPLY) {
      console.log(`  WOULD SET: ${title}  ->  ${thumbnailPath}`)
      continue
    }

    // Update product thumbnail
    const res = await fetch(BASE + "/admin/products/" + p.id, {
      method: "POST",
      headers,
      body: JSON.stringify({ thumbnail: thumbnailPath }),
    })

    if (res.ok) {
      console.log(`  FIXED: ${title}  ->  ${thumbnailPath}`)
      fixed++
    } else {
      const err = await res.text()
      console.log(`  FAILED: ${title}  —  ${err.slice(0, 100)}`)
    }
  }

  console.log(`\nSummary: ${fixed} fixed, ${missing} missing, ${skipped} skipped`)

  if (!APPLY) {
    console.log("\nDry run. Run with --apply to update Medusa.")
  } else if (fixed > 0) {
    console.log("\nReindex: cd apps/meilisearch && npm run reindex")
  }
}

main().catch(console.error)
