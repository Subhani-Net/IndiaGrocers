/**
 * Rename TRS product images to convention: trs_{product-handle}.{ext}
 * 
 * Reads products.json to get product names, renames images,
 * copies to storefront public directory.
 *
 * Usage: node scripts/rename-trs-images.mjs
 */

import { readFileSync, renameSync, copyFileSync, readdirSync, existsSync, mkdirSync } from "fs"
import { resolve, dirname, extname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const TRS_IMG_DIR = resolve(ROOT, "Implementation/TRS_products/images")
const TRS_JSON = resolve(ROOT, "Implementation/TRS_products/products.json")
const STOREFRONT_IMG = resolve(ROOT, "apps/storefront/public/images")

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 80)
}

if (!existsSync(STOREFRONT_IMG)) mkdirSync(STOREFRONT_IMG, { recursive: true })

// Read TRS products
const raw = readFileSync(TRS_JSON, "utf-8")
const trsProducts = JSON.parse(raw.replace(/^\uFEFF/, ""))

console.log(`Renaming ${trsProducts.length} TRS product images...\n`)

let renamed = 0, missing = 0

for (const product of trsProducts) {
  const originalName = product.image_filename || ""
  if (!originalName) { console.log(`  SKIP: ${product.product_name} — no image_filename`); continue }

  const srcPath = resolve(TRS_IMG_DIR, originalName)
  if (!existsSync(srcPath)) {
    console.log(`  MISSING: ${originalName}`)
    missing++
    continue
  }

  // Target: trs_{product-name-slug}.{ext}
  const nameSlug = slugify(product.product_name.replace(/^TRS\s*/i, ""))
  const ext = extname(originalName).toLowerCase() || ".jpg"
  const targetName = `trs_${nameSlug}${ext}`
  const targetPath = resolve(STOREFRONT_IMG, targetName)

  // Copy to storefront (rename source)
  copyFileSync(srcPath, targetPath)
  console.log(`  ${originalName.padEnd(45)} → ${targetName}`)
  renamed++
}

console.log(`\nRenamed: ${renamed}, Missing: ${missing}`)
console.log(`Images in storefront: ${STOREFRONT_IMG}`)
