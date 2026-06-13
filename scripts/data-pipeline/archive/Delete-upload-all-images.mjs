import { readFileSync, readdirSync } from "fs"
import { extname } from "path"

const BASE = "http://127.0.0.1:9000"
const JSON_PATH = "C:\\IndiaGrocers\\Implementation\\natcofoods-import\\natcofoods-catalog.json"
const UPLOADS_DIR = "C:\\IndiaGrocers\\apps\\backend\\uploads"

// Load catalog to get product handle -> image mapping
const catalog = JSON.parse(readFileSync(JSON_PATH, "utf-8"))
const natcoProducts = catalog.products.filter((p) => p.handle.startsWith("natco-"))

// Find actual image files in uploads dir
const imageFiles = readdirSync(UPLOADS_DIR)
const imageMap = {}
for (const f of imageFiles) {
  const ext = extname(f).toLowerCase()
  if (ext !== ".jpg" && ext !== ".png") continue
  const slug = f.replace(/^natco_/, "").replace(/\.[^.]+$/, "")
  const handle = "natco-" + slug
  imageMap[handle] = f
}

console.log(`Found ${natcoProducts.length} Natco products in JSON`)
console.log(`Found ${Object.keys(imageMap).length} image files in uploads dir`)
console.log(`Matchable: ${natcoProducts.filter((p) => imageMap[p.handle]).length}`)

async function uploadImage(token, filePath, filename) {
  const buffer = readFileSync(filePath)
  const boundary = `--boundary_${Date.now()}`
  const enc = new TextEncoder()
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${filename}"\r\nContent-Type: ${filename.endsWith(".png") ? "image/png" : "image/jpeg"}\r\n\r\n`
  const footer = `\r\n--${boundary}--\r\n`
  const hb = enc.encode(header)
  const fb = enc.encode(footer)
  const body = new Uint8Array(hb.length + buffer.length + fb.length)
  body.set(hb, 0)
  body.set(new Uint8Array(buffer), hb.length)
  body.set(fb, hb.length + buffer.length)
  
  const res = await fetch(`${BASE}/admin/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body,
  })
  if (!res.ok) return { ok: false, error: (await res.text()).slice(0, 100) }
  const data = await res.json()
  return { ok: true, url: data.files?.[0]?.url }
}

async function main() {
  // Login
  const { token } = await (await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })).json()
  console.log("✅ Logged in")

  // Get all products from Medusa to get IDs
  const r = await fetch(`${BASE}/admin/products?limit=500&fields=id,handle`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const { products } = await r.json()
  const productMap = {}
  for (const p of products) productMap[p.handle] = p.id

  let uploaded = 0
  let linked = 0
  let errors = 0

  for (let i = 0; i < natcoProducts.length; i++) {
    const p = natcoProducts[i]
    const filename = imageMap[p.handle]
    if (!filename) { errors++; continue }

    const filePath = `${UPLOADS_DIR}/${filename}`
    const productId = productMap[p.handle]
    if (!productId) { errors++; continue }

    // Upload
    const up = await uploadImage(token, filePath, filename)
    if (!up.ok) { errors++; continue }
    uploaded++

    // Link to product
    const res = await fetch(`${BASE}/admin/products/${productId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ thumbnail: up.url, images: [{ url: up.url }] }),
    })
    if (res.ok) linked++
    else errors++

    if (i % 25 === 0) process.stdout.write(".")
  }

  console.log(`\n✅ Uploaded: ${uploaded}`)
  console.log(`✅ Linked: ${linked}`)
  console.log(`❌ Errors: ${errors}`)

  // Verify
  const v = await fetch(`${BASE}/admin/products?limit=500&fields=id,handle,thumbnail,images`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const vd = await v.json()
  const natcoInDb = vd.products.filter((p) => p.handle.startsWith("natco-"))
  const withThumb = natcoInDb.filter((p) => p.thumbnail).length
  const withImages = natcoInDb.filter((p) => p.images?.length > 0).length
  console.log(`\n📊 After upload: ${natcoInDb.length} Natco products`)
  console.log(`   Thumbnail set: ${withThumb}`)
  console.log(`   Images array: ${withImages}`)
}

main().catch(console.error)
