/**
 * Clear all category assignments from products, then reassign cleanly.
 *
 * Usage: node src/seed/reset-and-reassign.mjs
 */

const BASE = "http://localhost:9000"

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: `Bearer ${(await res.json()).token}`, "Content-Type": "application/json" }
}

async function main() {
  const H = await login()
  console.log("Logged in\n")

  // 1. Fetch all products
  console.log("Fetching products...")
  const allProducts = []
  let offset = 0
  while (true) {
    const { products } = await fetch(
      `${BASE}/admin/products?limit=100&offset=${offset}&fields=id`,
      { headers: H }
    ).then((r) => r.json())
    allProducts.push(...(products || []))
    if ((products || []).length < 100) break
    offset += 100
  }
  console.log(`  ${allProducts.length} products\n`)

  // 2. Clear ALL category assignments
  console.log("Clearing all category assignments...")
  let cleared = 0
  for (const p of allProducts) {
    try {
      const res = await fetch(`${BASE}/admin/products/${p.id}`, {
        method: "POST",
        headers: { ...H, "Content-Type": "application/json" },
        body: JSON.stringify({ categories: [] }),
      })
      if (res.ok) cleared++
    } catch {}
    if (cleared % 50 === 0 && cleared > 0) process.stdout.write(".")
  }
  console.log(`\n  ${cleared}/${allProducts.length} products cleared\n`)

  // 3. Verify
  const check = await fetch(
    `${BASE}/admin/products?category_id=pcat_01KRMC55Q8917D3QJKT26SRG8F&limit=1`,
    { headers: H }
  ).then((r) => r.json())
  console.log(`Verification: ${check.count || 0} products in staples-grains (should be 0)`)
  console.log("\nDone — now run: node src/seed/assign-categories-from-titles.mjs")
}

main().catch((e) => console.error(e.message))
