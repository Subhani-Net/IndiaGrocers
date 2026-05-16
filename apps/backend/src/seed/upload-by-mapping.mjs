import { readFileSync } from "fs"

const BASE = "http://127.0.0.1:9000"
const MAPPING_PATH = "C:\\IndiaGrocers\\Implementation\\natcofoods-import\\product-image-mapping.json"
const UPLOADS_DIR = "C:\\IndiaGrocers\\apps\\backend\\uploads"

async function uploadImage(token, filePath, filename) {
  const buffer = readFileSync(filePath)
  const boundary = `----boundary_${Date.now()}`
  const ext = filename.split(".").pop().toLowerCase()
  const mime = ext === "png" ? "image/png" : "image/jpeg"

  const enc = new TextEncoder()
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`
  const footer = `\r\n--${boundary}--\r\n`
  const hb = enc.encode(header)
  const fb = enc.encode(footer)

  const body = new Uint8Array(hb.length + buffer.length + fb.length)
  body.set(hb, 0)
  body.set(new Uint8Array(buffer), hb.length)
  body.set(fb, hb.length + buffer.length)

  const res = await fetch(`${BASE}/admin/uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "unknown error")
    return { ok: false, error: errText.slice(0, 100) }
  }

  const data = await res.json()
  return { ok: true, url: data.files?.[0]?.url }
}

async function main() {
  // 1. Read mapping
  const mapping = JSON.parse(readFileSync(MAPPING_PATH, "utf-8"))
  const pending = mapping.filter((m) => m.status !== "uploaded")
  console.log(`📋 Mapping has ${mapping.length} products, ${pending.length} pending upload`)

  if (pending.length === 0) {
    console.log("✅ All images already uploaded. Update status fields to re-upload.")
    return
  }

  // 2. Login
  console.log("🔑 Logging in...")
  const { token } = await (await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })).json()
  console.log("✅ Logged in")

  // 3. Get Medusa products by handle
  const r = await fetch(`${BASE}/admin/products?limit=500&fields=id,handle`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const { products } = await r.json()
  const productById = {}
  for (const p of products) productById[p.handle] = p.id

  // 4. Process each pending item
  let uploaded = 0
  let linked = 0
  let errors = 0

  for (const item of pending) {
    const filePath = `${UPLOADS_DIR}/${item.image_file}`
    const productId = productById[item.handle]

    // Check file exists
    try {
      readFileSync(filePath)
    } catch {
      console.log(`  ❌ ${item.handle}: image file not found (${item.image_file})`)
      item.status = "error: file not found"
      errors++
      continue
    }

    // Check product exists
    if (!productId) {
      console.log(`  ❌ ${item.handle}: product not found in Medusa`)
      item.status = "error: product not found"
      errors++
      continue
    }

    // Upload image
    const up = await uploadImage(token, filePath, item.image_file)
    if (!up.ok) {
      console.log(`  ❌ ${item.handle}: upload failed - ${up.error}`)
      item.status = "error: upload failed"
      errors++
      continue
    }
    uploaded++

    // Link to product
    const linkRes = await fetch(`${BASE}/admin/products/${productId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        thumbnail: up.url,
      }),
    })

    if (linkRes.ok) {
      linked++
      item.status = "uploaded"
      process.stdout.write(".")
    } else {
      const errText = await linkRes.text().catch(() => "unknown")
      console.log(`  ❌ ${item.handle}: link failed - ${errText.slice(0, 100)}`)
      item.status = "error: link failed"
      errors++
    }
  }

  // 5. Report
  console.log("\n")
  console.log("═══════════════════════════════════════")
  console.log("  Upload Complete")
  console.log("═══════════════════════════════════════")
  console.log(`  Total in mapping: ${mapping.length}`)
  console.log(`  Uploaded:         ${uploaded}`)
  console.log(`  Linked to product:${linked}`)
  console.log(`  Errors:           ${errors}`)
  console.log("═══════════════════════════════════════")

  // 6. Write updated mapping
  const fs = await import("fs")
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(mapping, null, 2), "utf-8")
  console.log(`\n✅ Mapping file updated with upload status`)

  // 7. Summary of any errors
  const failed = mapping.filter((m) => m.status?.startsWith("error"))
  if (failed.length > 0) {
    console.log(`\n❌ ${failed.length} failures:`)
    for (const f of failed) console.log(`   - ${f.title}: ${f.status}`)
  }
}

main().catch(console.error)
