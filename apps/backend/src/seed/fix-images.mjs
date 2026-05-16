import { readFileSync } from "fs"
import { resolve, dirname, basename } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "http://127.0.0.1:9000"

async function main() {
  // Login
  const { token } = await (await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })).json()

  const headers = { Authorization: `Bearer ${token}` }

  // Get all Natco products
  const r = await fetch(`${BASE}/admin/products?limit=500&fields=id,handle,thumbnail`, { headers })
  const { products } = await r.json()
  const natco = products.filter((p) => p.handle.startsWith("natco-"))
  
  console.log(`📦 ${natco.length} Natco products`)

  let ok = 0
  let fail = 0

  for (let i = 0; i < natco.length; i++) {
    const p = natco[i]
    const filename = `natco_${p.handle.slice(6)}.jpg`
    const imageUrl = `/uploads/${filename}`

    // Update product with thumbnail + images array
    const res = await fetch(`${BASE}/admin/products/${p.id}`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        thumbnail: imageUrl,
        images: [{ url: imageUrl }],
      }),
    })

    if (res.ok) {
      ok++
    } else {
      fail++
      const err = await res.text()
      if (fail <= 3) console.error(`  ❌ ${p.handle}: ${err.slice(0, 100)}`)
    }

    if (i % 30 === 0) process.stdout.write(".")
  }

  console.log(`\n✅ ${ok} updated, ❌ ${fail} failed`)

  // Verify
  const v = await fetch(`${BASE}/admin/products?limit=500&fields=id,handle,thumbnail,images`, { headers })
  const vd = await v.json()
  const natco2 = vd.products.filter((p) => p.handle.startsWith("natco-"))
  const withThumb = natco2.filter((p) => p.thumbnail).length
  const withImages = natco2.filter((p) => p.images?.length > 0).length
  console.log(`📊 Thumbnail: ${withThumb}/${natco2.length}, Images array: ${withImages}/${natco2.length}`)
}

main().catch(console.error)
