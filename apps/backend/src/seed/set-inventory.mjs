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
  console.log("Logged in")

  // Get all products with variants
  console.log("Fetching products...")
  const { products } = await (await fetch(
    `${BASE}/admin/products?limit=500&fields=id,title,variants.id,variants.title,variants.manage_inventory`,
    { headers }
  )).json()
  console.log(`  ${products.length} products`)

  // Disable inventory management for all variants
  let updated = 0
  for (const p of products) {
    if (!p.variants?.length) continue

    const variantUpdates = p.variants.map(v => ({
      id: v.id,
      manage_inventory: false,
      allow_backorder: true,
      inventory_quantity: 100,
    }))

    const res = await fetch(`${BASE}/admin/products/${p.id}/variants/batch`, {
      method: "POST",
      headers,
      body: JSON.stringify({ update: variantUpdates }),
    })

    if (res.ok) {
      updated++
      if (updated % 50 === 0) console.log(`  ${updated}...`)
    } else {
      // Try individual variant update
      for (const v of variantUpdates) {
        const r2 = await fetch(`${BASE}/admin/products/${p.id}/variants/${v.id}`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            manage_inventory: false,
            allow_backorder: true,
          }),
        })
        if (r2.ok) updated++
        else {
          // Try another endpoint
          const r3 = await fetch(`${BASE}/admin/products/${p.id}`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              variants: p.variants.map(v => ({
                id: v.id,
                manage_inventory: false,
                allow_backorder: true,
              })),
            }),
          })
          if (r3.ok) {
            updated++
            break
          } else {
            // Last resort: update product directly
            const r4 = await fetch(`${BASE}/admin/products/${p.id}`, {
              method: "POST",
              headers,
              body: JSON.stringify({ manage_inventory: false }),
            })
            if (r4.ok) updated++
            else {
              const e4 = await r4.text()
              console.log(`  ❌ ${p.title}: ${e4.slice(0,80)}`)
            }
            break
          }
        }
      }
    }
  }

  console.log(`\nDone: ${updated} products updated`)

  // Verify
  console.log("\nVerifying...")
  const key = "pk_72deb296139d27885561a0fa58b77cbed187d8c5912390c2dc1912cb477083d3"
  const v = await fetch(`${BASE}/store/products?limit=3&fields=title,variants.inventory_quantity,variants.manage_inventory`, {
    headers: { "x-publishable-api-key": key },
  })
  const { products: sp } = await v.json()
  for (const p of sp.slice(0, 3)) {
    const v0 = p.variants?.[0]
    console.log(`  ${p.title}: qty=${v0?.inventory_quantity}, manage=${v0?.manage_inventory}`)
  }
}

main().catch(console.error)
