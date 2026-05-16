import { readFileSync } from "fs"
import { resolve, dirname, basename } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "http://127.0.0.1:9000"
const UPLOADS_DIR = resolve(__dirname, "../../uploads")

// Pick 10 diverse Natco products
const HANDLES = [
  "natco-soya-chunks-700g",
  "natco-toor-dal-2kg",
  "natco-turmeric-powder-100g",
  "natco-bhujia-200g",
  "natco-mustard-oil-1l",
  "natco-besan-1kg",
  "natco-mango-pickle-500g",
  "natco-basmati-rice-india-2kg",
  "natco-laddu-250g",
  "natco-tea-100g",
]

async function uploadImage(token, handle) {
  const filename = `natco_${handle.slice(6)}.jpg`
  const filePath = `${UPLOADS_DIR}/${filename}`
  
  // Read file
  const fileBuffer = readFileSync(filePath)
  
  // Create multipart form data
  const boundary = `----boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const encoder = new TextEncoder()
  
  const headerStr = `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n`
  const footerStr = `\r\n--${boundary}--\r\n`
  
  const headerBytes = encoder.encode(headerStr)
  const footerBytes = encoder.encode(footerStr)
  
  const totalLength = headerBytes.length + fileBuffer.length + footerBytes.length
  const body = new Uint8Array(totalLength)
  body.set(headerBytes, 0)
  body.set(new Uint8Array(fileBuffer), headerBytes.length)
  body.set(footerBytes, headerBytes.length + fileBuffer.length)
  
  const res = await fetch(`${BASE}/admin/uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: body,
  })
  
  if (!res.ok) {
    const err = await res.text()
    return { ok: false, error: err.slice(0, 100), handle }
  }
  
  const data = await res.json()
  return { ok: true, url: data.files?.[0]?.url, handle }
}

async function main() {
  // 1. Login
  console.log("🔑 Logging in...")
  const { token } = await (await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })).json()
  console.log("✅ Logged in")

  // 2. Get all products and find the selected ones
  const r = await fetch(`${BASE}/admin/products?limit=500&fields=id,handle`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const { products } = await r.json()
  
  const selectedProducts = HANDLES.map((handle) => products.find((p) => p.handle === handle)).filter(Boolean)
  console.log(`📦 Found ${selectedProducts.length} of ${HANDLES.length} selected products`)

  // 3. Upload images
  console.log("\n📤 Uploading images...")
  const uploadResults = []
  for (let i = 0; i < selectedProducts.length; i++) {
    const p = selectedProducts[i]
    process.stdout.write(`  [${i + 1}/${selectedProducts.length}] ${p.handle}... `)
    const result = await uploadImage(token, p.handle)
    uploadResults.push({ ...result, productId: p.id })
    console.log(result.ok ? `✅ ${result.url}` : `❌ ${result.error}`)
  }

  // 4. Link images to products
  console.log("\n🔗 Linking images to products...")
  let linked = 0
  for (const result of uploadResults) {
    if (!result.ok) continue
    
    const res = await fetch(`${BASE}/admin/products/${result.productId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        thumbnail: result.url,
        images: [{ url: result.url }],
      }),
    })
    
    if (res.ok) {
      linked++
      process.stdout.write(".")
    } else {
      const err = await res.text()
      process.stdout.write("x")
      console.error(`\n  ❌ ${result.handle}: ${err.slice(0, 100)}`)
    }
  }

  console.log(`\n✅ ${linked}/${uploadResults.filter((r) => r.ok).length} images linked to products`)

  // 5. Verify
  console.log("\n🔍 Verifying...")
  for (const result of uploadResults) {
    if (!result.ok) continue
    const v = await fetch(`${BASE}/admin/products/${result.productId}?fields=id,title,thumbnail,images`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const d = await v.json()
    const p = d.product || d
    const hasThumb = p.thumbnail ? "✅" : "❌"
    const imgCount = p.images?.length || 0
    console.log(`  ${hasThumb} ${p.title.padEnd(35)} thumb: ${p.thumbnail || "—"}`)
    if (imgCount > 0) {
      console.log(`     images[0]: ${p.images[0].url}`)
    }
  }

  console.log("\n🎉 Done! Check http://localhost:9000/app/products in browser")
}

main().catch(console.error)
