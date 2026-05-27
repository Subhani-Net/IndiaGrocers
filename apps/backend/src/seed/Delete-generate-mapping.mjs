import { readFileSync, writeFileSync, readdirSync } from "fs"
import { extname } from "path"

const BASE = "http://127.0.0.1:9000"
const UPLOADS_DIR = "C:\\IndiaGrocers\\apps\\backend\\uploads"
const OUTPUT_PATH = "C:\\IndiaGrocers\\Implementation\\natcofoods-import\\product-image-mapping.json"

async function main() {
  // 1. Login
  const { token } = await (await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })).json()

  // 2. Get all Natco products from Medusa
  const r = await fetch(`${BASE}/admin/products?limit=500&fields=id,handle,title`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const { products } = await r.json()
  const natco = products.filter((p) => p.handle.startsWith("natco-"))
  console.log(`📦 ${natco.length} Natco products in Medusa`)

  // 3. Build index of available image files
  const availableFiles = {}
  for (const f of readdirSync(UPLOADS_DIR)) {
    const ext = extname(f).toLowerCase()
    if (ext !== ".jpg" && ext !== ".png") continue
    availableFiles[f] = true
  }
  console.log(`🖼️  ${Object.keys(availableFiles).length} image files in uploads`)

  // 4. Build mapping from actual DB data
  const mapping = []
  let matched = 0
  let unmatched = 0

  for (const p of natco) {
    const expectedFile = `natco_${p.handle.slice(6)}.jpg`
    const fallbackPng = `natco_${p.handle.slice(6)}.png`
    const actualFile = availableFiles[expectedFile] ? expectedFile : (availableFiles[fallbackPng] ? fallbackPng : null)

    mapping.push({
      id: p.id,
      handle: p.handle,
      title: p.title,
      image_file: actualFile || "MISSING",
      exists: !!actualFile,
      status: "",
    })

    if (actualFile) matched++
    else unmatched++
  }

  // 5. Write mapping
  writeFileSync(OUTPUT_PATH, JSON.stringify(mapping, null, 2), "utf-8")
  console.log(`\n✅ Mapping written to ${OUTPUT_PATH}`)
  console.log(`   Products with images: ${matched}`)
  console.log(`   Products without images: ${unmatched}`)

  // Show unmatched
  if (unmatched > 0) {
    console.log(`\n❌ ${unmatched} products have no matching image file:`)
    for (const m of mapping.filter((m) => !m.exists).slice(0, 10)) {
      console.log(`   ${m.handle}`)
    }
    if (unmatched > 10) console.log(`   ... and ${unmatched - 10} more`)
  }
}

main().catch(console.error)
