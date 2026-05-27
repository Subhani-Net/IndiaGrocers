/**
 * Fix category handles + create missing categories.
 * Backend must be running on http://127.0.0.1:9000
 *
 * Usage: node src/seed/fix-category-handles.mjs
 */

const BASE = "http://127.0.0.1:9000"

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: `Bearer ${(await res.json()).token}`, "Content-Type": "application/json" }
}

function api(url, opts, headers) {
  return fetch(url, { ...opts, headers }).then(async (r) => {
    const text = await r.text()
    if (!r.ok) throw new Error(`${r.status}: ${text.slice(0, 120)}`)
    try { return JSON.parse(text) } catch { return text }
  })
}

async function main() {
  const H = await login()
  console.log("Logged in\n")

  // 1. Fetch current state
  const { product_categories } = await api(`${BASE}/admin/product-categories?limit=300`, {}, H)

  // 2. Merge conflicts — deactivate old, let assign-categories-from-titles handle reassignment
  const MERGES = [
    { old: "sweets-and-mithai" },
    { old: "ready-to-eat" },
  ]

  console.log("Deactivating conflicting old categories...")
  for (const { old } of MERGES) {
    const oldCat = product_categories.find((c) => c.handle === old)
    if (!oldCat) { console.log(`  ${old}: not found, skip`); continue }

    await api(`${BASE}/admin/product-categories/${oldCat.id}`, {
      method: "POST",
      body: JSON.stringify({ is_active: false, handle: old + "-old" }),
    }, H)
    console.log(`  Deactivated: ${old} → ${old}-old`)
  }

  // 3. Create completely missing categories
  console.log("\nCreating missing categories...")
  const CREATE = [
    { name: "Spices — Whole", handle: "spices-whole", phase: 1 },
    { name: "Spices — Ground", handle: "spices-ground", phase: 1 },
    { name: "Dairy & Eggs", handle: "dairy", phase: 1 },
    { name: "Condiments & Cooking Essentials", handle: "condiments", phase: 2 },
    { name: "Pooja Essentials", handle: "pooja", phase: 3 },
    { name: "Household & Kitchen", handle: "household", phase: 3 },
    { name: "Regional Specialties", handle: "regional", phase: 3 },
  ]

  for (const m of CREATE) {
    const exists = product_categories.find((c) => c.handle === m.handle)
    if (exists) { console.log(`  ${m.handle}: already exists`); continue }
    try {
      await api(`${BASE}/admin/product-categories`, {
        method: "POST",
        body: JSON.stringify({
          name: m.name, handle: m.handle, is_active: true,
          metadata: { phase: m.phase, status: m.phase === 1 ? "live" : "coming-soon" },
        }),
      }, H)
      console.log(`  ✅ ${m.handle}`)
    } catch (e) {
      console.log(`  ❌ ${m.handle}: ${e.message}`)
    }
  }

  // 4. Verify final state
  console.log("\nFinal category handles:")
  const { product_categories: final } = await api(`${BASE}/admin/product-categories?limit=300`, {}, H)
  final.filter((c) => !c.parent_category_id && c.is_active).forEach((c) => console.log(`  ${c.handle} — ${c.name}`))

  console.log("\nDone")
}

main().catch((e) => console.error("FATAL:", e.message))
