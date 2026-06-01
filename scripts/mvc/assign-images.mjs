/**
 * Assign scraped images to MVC products in Medusa
 * Maps images by slugified title matching.
 */

import { readdirSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..", "..")
const BASE = "http://127.0.0.1:9000"
const IMG_DIR = resolve(ROOT, "apps/storefront/public/images")

function slugify(text) {
  return text.toLowerCase().replace(/&/g, "and").replace(/'/g, "").replace(/"/g, "").replace(/\(/g, "").replace(/\)/g, "").replace(/,/g, "").replace(/\./g, "").replace(/-/g, " ").replace(/\s\s+/g, " ").trim().replace(/\s+/g, "-")
}

async function login() {
  const res = await fetch(BASE + "/auth/user/emailpass", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: "Bearer " + (await res.json()).token, "Content-Type": "application/json" }
}

async function main() {
  const headers = await login()

  const imgFiles = readdirSync(IMG_DIR)
  const imgBySlug = {}
  for (const f of imgFiles) {
    const noExt = f.replace(/\.(jpg|png|webp|jpeg)$/i, "")
    imgBySlug[noExt] = f
  }
  console.log("Images on disk: " + Object.keys(imgBySlug).length)

  // Fetch all products without thumbnails
  const prods = []; let off = 0
  while (true) {
    const r = await (await fetch(BASE + "/admin/products?limit=100&offset=" + off + "&fields=id,title,thumbnail", { headers })).json()
    if (!r.products?.length) break
    prods.push(...r.products)
    off += 100
  }

  const noImg = prods.filter(p => !p.thumbnail)
  console.log("Products without thumbnails: " + noImg.length + "\n")

  let assigned = 0, unmatched = 0
  for (const p of noImg) {
    let slug = slugify(p.title)
    let file = imgBySlug[slug]

    // Try without weight suffix (various formats)
    if (!file) {
      const baseTitle = p.title.replace(/\s+\d+\.?\d*\s*(?:g|kg|ml|l|L|Bags?|Pack)s?\b.*$/i, "").replace(/\s+\d+-?(?:Pack|Piece|Bag|Tub|Tin)\b.*$/i, "").trim()
      const baseSlug = slugify(baseTitle)
      file = imgBySlug[baseSlug]
    }

    if (!file) {
      unmatched++
      continue
    }

    const thumbnail = "/images/" + file
    const res = await fetch(BASE + "/admin/products/" + p.id, {
      method: "POST", headers,
      body: JSON.stringify({ thumbnail }),
    })

    if (res.ok) {
      assigned++
      if (assigned % 20 === 0) console.log("  " + assigned)
    } else {
      console.log("  FAIL: " + p.title)
    }
  }

  console.log("\nAssigned: " + assigned + " | Unmatched: " + unmatched)
  if (assigned > 0) console.log("Reindex: cd apps/meilisearch && npm run reindex")
}

main().catch(console.error)
