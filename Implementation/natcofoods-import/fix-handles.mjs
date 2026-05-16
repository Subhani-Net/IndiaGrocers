import { readFileSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const JSON_PATH = resolve(__dirname, "natcofoods-catalog.json")
const CSV_PATH = resolve(__dirname, "natcofoods-catalog.csv")

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

// Read JSON
const catalog = JSON.parse(readFileSync(JSON_PATH, "utf-8"))

// Fix handles: use natco_ + slugified title, ensure uniqueness
const usedHandles = new Set()
for (const product of catalog.products) {
  let handle = `natco-${slugify(product.title)}`
  let counter = 1
  while (usedHandles.has(handle)) {
    counter++
    handle = `natco-${slugify(product.title)}-${counter}`
  }
  usedHandles.add(handle)
  product.handle = handle
}

// Update CSV with new handles
const csvContent = readFileSync(CSV_PATH, "utf-8")
const lines = csvContent.split("\n")
const updatedLines = [lines[0]]

// Rebuild CSV from JSON data
const header = lines[0].split(",")
const csvRows = catalog.products.map((p) => {
  const row = []
  header.forEach((h) => {
    const col = h.trim()
    switch (col) {
      case "Product Handle": row.push(p.handle); break
      case "Product Title": row.push(p.title); break
      case "Product Description": row.push(`"${(p.description || '').replace(/"/g, '""')}"`); break
      case "Product Thumbnail": row.push(p.images?.[0]?.url || ""); break
      case "Product Weight": row.push(p.weight || ""); break
      case "Variant Sku": row.push("NATCO-" + p.sku); break
      case "Variant Price GBP": row.push(p.variants[0]?.prices[0]?.amount / 100 || ""); break
      case "Product Type": row.push(p.type || ""); break
      default: row.push("")
    }
  })
  return row.join(",")
})

writeFileSync(CSV_PATH, [lines[0], ...csvRows].join("\n"), "utf-8")

// Write updated JSON
writeFileSync(JSON_PATH, JSON.stringify(catalog, null, 2), "utf-8")

console.log(`✅ Fixed ${catalog.products.length} handles`)
console.log("Sample new handles:")
const seen = new Set()
for (const p of catalog.products.slice(0,15)) {
  if (!seen.has(p.handle)) {
    seen.add(p.handle)
    console.log(`  ${p.handle.padEnd(45)} ${p.title}`)
  }
}
