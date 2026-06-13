// Upload TRS product images to Medusa and link to products
import { readFileSync, readdirSync, createReadStream, statSync } from "fs"
import { resolve, extname } from "path"
import { fileURLToPath } from "url"

const __dirname = resolve(fileURLToPath(import.meta.url), "..")
const BASE = "http://127.0.0.1:9000"
const IMAGES_DIR = "C:\\IndiaGrocers\\Implementation\\TRS_products\\images"
const TRS_JSON = "C:\\IndiaGrocers\\Implementation\\TRS_products\\products.json"

// Map TRS image filenames to product handles (slugified)
function trsTitleToHandle(title) {
  const clean = title.replace(/^TRS\s+/i, "").toLowerCase()
  return "trs-" + clean.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: `Bearer ${(await res.json()).token}`, "Content-Type": "application/json" }
}

async function uploadFile(headers, filePath, filename) {
  const stat = statSync(filePath)
  const boundary = "----FormBoundary" + Math.random().toString(36).slice(2)
  const ext = extname(filename).toLowerCase()
  const mime = ext === ".png" ? "image/png" : "image/jpeg"

  const header = `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`
  const footer = `\r\n--${boundary}--\r\n`
  const body = Buffer.concat([
    Buffer.from(header),
    readFileSync(filePath),
    Buffer.from(footer),
  ])

  const res = await fetch(`${BASE}/admin/uploads`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body,
  })
  return res.ok ? await res.json() : null
}

async function main() {
  const headers = await login()
  console.log("Logged in")

  // Load TRS catalog
  const trsProducts = JSON.parse(readFileSync(TRS_JSON, "utf-8").replace(/^\uFEFF/, ""))

  // Fetch all TRS products from DB
  const { products } = await (await fetch(`${BASE}/admin/products?limit=500&fields=id,title,handle,thumbnail`, { headers })).json()
  const trsInDb = products.filter(p => p.handle.startsWith("trs-"))
  const dbByHandle = {}
  for (const p of trsInDb) dbByHandle[p.handle] = p
  console.log(`TRS products in DB: ${trsInDb.length}`)

  // Index available image files
  const imageFiles = readdirSync(IMAGES_DIR)
  const imageMap = {}
  for (const f of imageFiles) {
    const baseName = f.replace(/\.[^.]+$/, "").toLowerCase()
    imageMap[baseName] = f
  }
  console.log(`TRS image files available: ${imageFiles.length}`)

  // Match and upload
  let uploaded = 0
  for (const p of trsProducts) {
    const handle = trsTitleToHandle(p.product_name)
    const dbProduct = dbByHandle[handle]
    if (!dbProduct) {
      console.log(`  SKIP ${p.product_name} — not found in DB`)
      continue
    }
    if (dbProduct.thumbnail) {
      console.log(`  OK ${p.product_name} — already has thumbnail`)
      continue
    }

    const imageName = p.image_filename
    if (!imageName) {
      console.log(`  SKIP ${p.product_name} — no image filename in JSON`)
      continue
    }

    const imagePath = resolve(IMAGES_DIR, imageName)
    if (!statSync(imagePath, { throwIfNoEntry: false })) {
      console.log(`  SKIP ${p.product_name} — image file not found: ${imageName}`)
      continue
    }

    // Upload the image
    const up = await uploadFile(headers, imagePath, imageName)
    if (!up) {
      console.log(`  FAIL ${p.product_name} — upload failed`)
      continue
    }

    const url = up.url || (up.files?.[0]?.url)
    if (!url) {
      console.log(`  FAIL ${p.product_name} — no URL in upload response: ${JSON.stringify(up).slice(0, 100)}`)
      continue
    }

    // Link to product
    const linkRes = await fetch(`${BASE}/admin/products/${dbProduct.id}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ thumbnail: url, images: [{ url }] }),
    })

    if (linkRes.ok) {
      uploaded++
      console.log(`  ✅ ${p.product_name}: ${url}`)
    } else {
      const err = await linkRes.text()
      console.log(`  ❌ ${p.product_name}: link failed - ${err.slice(0, 80)}`)
    }
  }

  console.log(`\nDone: ${uploaded} images uploaded and linked`)
}

main().catch(console.error)
