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

  // Read mapping
  const mapping = JSON.parse(readFileSync(MAPPING_PATH, "utf-8"))
  console.log(`📋 Processing ${mapping.collections.length} collections\n`)

  // Get sales channel
  const sc = await fetch(`${BASE}/admin/sales-channels?limit=5`, { headers: { Authorization: `Bearer ${token}` } })
  const { sales_channels } = await sc.json()
  const channelId = sales_channels?.[0]?.id
  if (!channelId) { console.log("❌ No sales channel found"); return }

  // Get all existing collections
  const existingRes = await fetch(`${BASE}/admin/collections?limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const existingData = await existingRes.json()
  const existingCollections = existingData.collections || []

  let created = 0, skipped = 0, assigned = 0

  for (const col of mapping.collections) {
    // Check if collection already exists
    let collection = existingCollections.find((c) => c.handle === col.handle)

    if (!collection) {
      const createRes = await fetch(`${BASE}/admin/collections`, {
        method: "POST", headers,
        body: JSON.stringify({
          title: col.name,
          handle: col.handle,
          metadata: { description: `Collection: ${col.name}` },
        }),
      })
      if (createRes.ok) {
        const data = await createRes.json()
        collection = data.collection
        created++
        process.stdout.write("+")
      } else {
        console.log(`  ❌ ${col.name}: CREATE FAILED`)
        continue
      }
    } else {
      skipped++
      process.stdout.write("~")
    }

    // Assign products to sales channel first
    for (const pid of col.product_ids) {
      await fetch(`${BASE}/admin/products/${pid}`, {
        method: "POST", headers,
        body: JSON.stringify({ sales_channels: [{ id: channelId }] }),
      })
    }

    // Add products to collection
    await fetch(`${BASE}/admin/collections/${collection.id}/products`, {
      method: "POST", headers,
      body: JSON.stringify({ add: col.product_ids }),
    })

    assigned += col.product_ids.length
  }

  console.log(`\n\n✅ Created: ${created} | Skipped: ${skipped} | Total assigned: ${assigned} products`)

  // Verify
  console.log("\n🔍 Verifying...")
  const v = await fetch(`${BASE}/admin/collections?limit=50&fields=id,title,handle`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const vd = await v.json()
  for (const c of vd.collections || []) {
    const cr = await fetch(`${BASE}/admin/collections/${c.id}?fields=products.id`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const cd = await cr.json()
    console.log(`  ${c.title}: ${cd.collection?.products?.length || 0} products`)
  }
}

main().catch(console.error)
