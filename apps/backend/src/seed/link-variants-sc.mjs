const BASE = "http://127.0.0.1:9000"

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: `Bearer ${(await res.json()).token}`, "Content-Type": "application/json" }
}

async function main() {
  const headers = await login()

  // Get default sales channel
  const { sales_channels } = await (await fetch(`${BASE}/admin/sales-channels?limit=5`, { headers })).json()
  const sc = sales_channels[0]
  console.log(`Sales channel: ${sc.name} (${sc.id})`)

  // Get all products with >1 variant
  const { products } = await (await fetch(`${BASE}/admin/products?limit=500&fields=id,title,variants.id,variants.title,options`, { headers })).json()

  let updated = 0
  for (const p of products) {
    if (!p.variants || p.variants.length <= 1) continue

    // Update product to link sales channel
    const res = await fetch(`${BASE}/admin/products/${p.id}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ sales_channels: [{ id: sc.id }] }),
    })
    if (res.ok) {
      updated++
      console.log(`  ${p.title}: ${p.variants.length} variants`)
    } else {
      console.log(`  FAIL ${p.title}`)
    }
  }

  console.log(`\nDone: ${updated} products updated`)
}

main().catch(console.error)
