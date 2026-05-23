import { readFileSync, writeFileSync, renameSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const JSON_PATH = resolve(__dirname, "natcofoods-catalog.json")
const CSV_PATH = resolve(__dirname, "natcofoods-catalog.csv")
const IMAGES_DIR = resolve(__dirname, "images")

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 80)
}

const catalog = JSON.parse(readFileSync(JSON_PATH, "utf-8"))
const renameMap = new Map()
let renamed = 0
let errors = 0

for (const product of catalog.products) {
  const oldUrl = product.images?.[0]?.url
  if (!oldUrl) continue

  const oldFilename = oldUrl.split("/").pop()
  if (!oldFilename) continue

  const oldPath = resolve(IMAGES_DIR, oldFilename)
  if (!existsSync(oldPath)) continue

  // Generate new filename: natco_{product-title}.ext
  const ext = oldFilename.includes(".") ? oldFilename.split(".").pop() : "jpg"
  const newFilename = `natco_${slugify(product.title)}.${ext}`
  const newPath = resolve(IMAGES_DIR, newFilename)

  // Handle duplicates
  let finalNewPath = newPath
  let finalNewFilename = newFilename
  let counter = 1
  while (existsSync(finalNewPath) && oldPath !== finalNewPath) {
    const base = newFilename.replace(`.${ext}`, "")
    finalNewFilename = `${base}-${counter}.${ext}`
    finalNewPath = resolve(IMAGES_DIR, finalNewFilename)
    counter++
  }

  if (oldPath === finalNewPath) continue // already correct name

  try {
    renameSync(oldPath, finalNewPath)
    renameMap.set(oldFilename, finalNewFilename)
    renamed++
    process.stdout.write(".")
  } catch (e) {
    errors++
    process.stdout.write("x")
  }
}

console.log(`\n✅ Renamed ${renamed} files, ${errors} errors`)

// Update JSON
let jsonUpdates = 0
for (const product of catalog.products) {
  const oldUrl = product.images?.[0]?.url
  if (!oldUrl) continue
  const oldFilename = oldUrl.split("/").pop()
  if (!oldFilename) continue
  const newFilename = renameMap.get(oldFilename)
  if (newFilename) {
    product.images[0].url = `./images/${newFilename}`
    jsonUpdates++
  }
}
writeFileSync(JSON_PATH, JSON.stringify(catalog, null, 2), "utf-8")
console.log(`✅ JSON updated: ${jsonUpdates} image paths`)

// Update CSV
const csvContent = readFileSync(CSV_PATH, "utf-8")
const lines = csvContent.split("\n")
const updatedLines = [lines[0]]
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(",")
  if (cols[0]) {
    const product = catalog.products.find((p) => p.handle === cols[0])
    if (product && product.images?.[0]?.url) {
      cols[5] = product.images[0].url
    }
  }
  updatedLines.push(cols.join(","))
}
writeFileSync(CSV_PATH, updatedLines.join("\n"), "utf-8")
console.log("✅ CSV updated")

// Show samples
console.log("\nSample renamed files:")
const samples = [...renameMap.entries()].slice(0, 8)
for (const [oldName, newName] of samples) {
  const product = catalog.products.find((p) => p.images?.[0]?.url?.includes(newName))
  const title = product?.title || "?"
  console.log(`  ${oldName} → ${newName}  (${title})`)
}
