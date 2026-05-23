import { readFileSync, readdirSync } from "fs"
import { extname, basename, resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const JSON_PATH = resolve(__dirname, "natcofoods-catalog.json")
const IMAGES_DIR = resolve(__dirname, "images")

const catalog = JSON.parse(readFileSync(JSON_PATH, "utf-8"))
const files = readdirSync(IMAGES_DIR)

// Build map of handle -> actual file extension
const fileExtMap = {}
for (const f of files) {
  const ext = extname(f).toLowerCase()
  const slug = f.replace(/^natco_/, "").replace(/\.[^.]+$/, "")
  const handle = "natco-" + slug
  fileExtMap[handle] = ext
}

console.log("=== Product Image Mapping Analysis ===")
console.log("")

const natcoProducts = catalog.products.filter((p) => p.handle.startsWith("natco-"))
console.log("Total Natco products:", natcoProducts.length)
console.log("Total image files:", files.length)

let consistent = 0
let issues = 0
const issueList = []

for (const p of natcoProducts) {
  const ext = fileExtMap[p.handle] || ".jpg"
  const expectedFile = "natco_" + p.handle.slice(6) + ext
  const actualUrl = p.images?.[0]?.url || ""

  if (!actualUrl) {
    issues++
    issueList.push({ handle: p.handle, title: p.title, issue: "No image URL in JSON" })
    continue
  }

  const actualFile = basename(actualUrl)

  if (actualFile === expectedFile) {
    consistent++
  } else {
    issues++
    issueList.push({
      handle: p.handle,
      title: p.title,
      issue: "Filename mismatch",
      expected: expectedFile,
      actual: actualFile,
    })
  }
}

console.log("Consistent:", consistent)
console.log("Issues:", issues)

if (issueList.length > 0) {
  console.log("\nIssues:")
  for (const item of issueList.slice(0, 15)) {
    console.log("  \u274c", item.handle)
    if (item.expected) console.log("     Expected:", item.expected)
    if (item.actual) console.log("     Actual:  ", item.actual)
    if (item.issue) console.log("     Issue:", item.issue)
  }
  if (issueList.length > 15) console.log("  ... and", issueList.length - 15, "more")
}

console.log("\n=== Verified Naming Pattern ===")
console.log("Product handle:  natco-{slugified-title}")
console.log("Image filename:  natco_{slugified-title}.{ext}")
console.log("Example handle:  natco-soya-chunks-700g")
console.log("Example image:   natco_soya-chunks-700g.jpg")
console.log("")
console.log("Conversion rule: image name = handle.replace('natco-', 'natco_') + '.ext'")
console.log("This is consistent across all", consistent, "products with images.")
