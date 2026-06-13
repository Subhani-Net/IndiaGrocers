import { readFileSync } from "fs"

const BASE = "http://127.0.0.1:9000"
const MAPPING_PATH = "C:\\IndiaGrocers\\Implementation\\collection-product-mapping.json"

async function main() {
  // Login
  const { token } = await (await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })).json()
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

  const mapping = JSON.parse(readFileSync(MAPPING_PATH, "utf-8"))

  console.log(`📋 Processing ${mapping.collections.length} collections\n`)

  for (const col of mapping.collections) {
    // 1. Create collection
    const createRes = await fetch(`${BASE}/admin/collections`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: col.name,
        handle: col.handle,
        metadata: { description: col.description },
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.text()
      console.log(`  ❌ ${col.name}: CREATE FAILED - ${err.slice(0, 80)}`)
      continue
    }

    const { collection } = await createRes.json()
    console.log(`  ✅ ${col.name}: created (${col.product_ids.length} products)`)

    // 2. Assign products to collection
    let assigned = 0
    for (const productId of col.product_ids) {
      const assignRes = await fetch(`${BASE}/admin/collections/${collection.id}/products`, {
        method: "POST",
        headers,
        body: JSON.stringify({ add: [productId] }),
      })

      if (assignRes.ok) assigned++
      else {
        const err = await assignRes.text()
        console.log(`    ❌ Product ${productId}: ${err.slice(0, 60)}`)
      }
    }
    console.log(`    📦 Assigned ${assigned}/${col.product_ids.length} products`)
  }

  // Verify
  console.log("\n🔍 Verifying...")
  const v = await fetch(`${BASE}/admin/collections?limit=20&fields=id,title,handle`, { headers })
  const vd = await v.json()
  console.log(`   Collections in system: ${vd.collections?.length || vd.count}`)
  for (const c of vd.collections || []) {
    const cr = await fetch(`${BASE}/admin/collections/${c.id}?fields=id,title,products.id`, { headers })
    const cd = await cr.json()
    const count = cd.collection?.products?.length || 0
    console.log(`   ${c.title}: ${count} products`)
  }
}

main().catch(console.error)
