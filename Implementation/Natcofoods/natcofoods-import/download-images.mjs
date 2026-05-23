import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { resolve, dirname, extname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const JSON_PATH = resolve(__dirname, "natcofoods-catalog.json")
const CSV_PATH = resolve(__dirname, "natcofoods-catalog.csv")
const IMAGES_DIR = resolve(__dirname, "images")
const LOCAL_BASE = "./images"

// Ensure images dir exists
if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true })

// Read catalog
const catalog = JSON.parse(readFileSync(JSON_PATH, "utf-8"))
const total = catalog.products.length

// Extract filename from CDN URL
function getImageFilename(url) {
  try {
    const u = new URL(url)
    const pathParts = u.pathname.split("/")
    const filename = pathParts[pathParts.length - 1]
    // Remove query params
    return filename.split("?")[0]
  } catch {
    return `product-${Date.now()}.jpg`
  }
}

// Map handle + URL to local filename
function getLocalFilename(handle, url, index) {
  const ext = extname(getImageFilename(url)) || ".jpg"
  return `${handle}${ext}`
}

// Download with retries and rate limiting
async function downloadImage(url, handle, index) {
  const localFilename = getLocalFilename(handle, url, index)
  const localPath = resolve(IMAGES_DIR, localFilename)

  // Skip if already downloaded
  if (existsSync(localPath) && readFileSync(localPath).length > 1000) {
    return { localFilename, cached: true }
  }

  const MAX_RETRIES = 3
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "image/webp,image/avif,image/*,*/*;q=0.8",
          Referer: "https://shop.natcofoods.com/",
        },
      })

      clearTimeout(timeout)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      writeFileSync(localPath, buffer)

      const fileSize = (buffer.length / 1024).toFixed(1)
      process.stdout.write(
        `\r[${index + 1}/${total}] ${handle.padEnd(35)} ${fileSize}Kb  `
      )

      return { localFilename, cached: false }
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        const delay = attempt * 2000
        await new Promise((r) => setTimeout(r, delay))
      } else {
        process.stdout.write(`\r[${index + 1}/${total}] ${handle.padEnd(35)} FAILED  `)
        return { localFilename: null, error: err.message }
      }
    }
  }
}

async function main() {
  console.log(`📥 Downloading ${total} product images...`)
  console.log(`   Saving to: ${IMAGES_DIR}\n`)

  const results = []
  const updateMap = new Map() // handle -> localFilename

  for (let i = 0; i < total; i++) {
    const product = catalog.products[i]
    const imageUrl = product.images?.[0]?.url

    if (imageUrl) {
      const result = await downloadImage(imageUrl, product.handle, i)
      results.push(result)
      if (result.localFilename) {
        updateMap.set(product.handle, `${LOCAL_BASE}/${result.localFilename}`)
      }
    } else {
      process.stdout.write(`\r[${i + 1}/${total}] ${product.handle.padEnd(35)} NO IMAGE `)
    }

    // Rate limiting delay between requests (200ms)
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 100))
  }

  console.log("\n")

  // Stats
  const succeeded = results.filter((r) => r.localFilename).length
  const failed = results.filter((r) => !r.localFilename).length
  const cached = results.filter((r) => r.cached).length
  console.log(`✅ Downloaded: ${succeeded - cached} new, ${cached} cached`)
  console.log(`❌ Failed: ${failed}`)

  // Update JSON with local paths
  let jsonUpdates = 0
  for (const product of catalog.products) {
    const localPath = updateMap.get(product.handle)
    if (localPath && product.images?.[0]) {
      product.images[0].url = localPath
      jsonUpdates++
    }
  }
  writeFileSync(JSON_PATH, JSON.stringify(catalog, null, 2), "utf-8")
  console.log(`✅ Updated JSON with local image paths (${jsonUpdates} products)`)

  // Update CSV with local paths
  const csvContent = readFileSync(CSV_PATH, "utf-8")
  const lines = csvContent.split("\n")
  const header = lines[0].split(",")
  const thumbCol = header.indexOf("Product Thumbnail")

  if (thumbCol !== -1) {
    const updatedLines = [lines[0]]
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",")
      if (cols[0]) {
        const product = catalog.products.find((p) => p.handle === cols[0])
        if (product && product.images?.[0]?.url) {
          cols[thumbCol] = product.images[0].url
        }
      }
      updatedLines.push(cols.join(","))
    }
    writeFileSync(CSV_PATH, updatedLines.join("\n"), "utf-8")
    console.log("✅ Updated CSV with local image paths")
  }

  console.log("\nDone!")
}

main().catch(console.error)
