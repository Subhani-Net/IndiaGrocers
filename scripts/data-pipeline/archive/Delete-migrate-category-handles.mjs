/**
 * Category Handle Migration Script
 *
 * Remaps product category assignments from the OLD seed handles to the
 * NEW design-matched handles. Run this after re-seeding with the updated
 * initial-data-seed.ts categories.
 *
 * Prerequisites:
 * - Backend running on http://127.0.0.1:9000
 * - New categories have been seeded (handles match the design master list)
 * - Admin user exists: admin@example.com / password123
 *
 * Usage: node src/seed/migrate-category-handles.mjs
 */

const BASE = "http://127.0.0.1:9000"

// OLD handle → NEW handle mapping
// Old handles from the original seed
// New handles from the design master list
const HANDLE_MAP = {
  // Direct remaps
  "rice-grains": "staples-grains",
  "flours-grains": "atta-flours",
  "dals-lentils": "dal-lentils", // minor: "dals" → "dal"
  "cooking-oils-ghee": "oils-ghee",
  "spices-masalas": "spice-blends", // "spices-masalas" → "spice-blends"
  "spices-and-masalas": "spice-blends",
  "dairy-milk-products": "dairy",
  // Removed categories (products need reassignment)
  "papads-fryums": "snacks-namkeen", // Papads → Snacks
  "sweets-mithai": "snacks-namkeen", // Sweets → Snacks (closest match)
  "noodles-pasta": "ready-to-cook", // Noodles → Ready-to-Cook
  "sauces-ketchup": "condiments", // Sauces → Condiments
  // Phase 2 categories
  "frozen-foods": "frozen",
  "fresh-vegetables": "fresh",
  "ready-to-eat": "ready-to-cook",
}

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return {
    Authorization: `Bearer ${(await res.json()).token}`,
    "Content-Type": "application/json",
  }
}

async function main() {
  const headers = await login()
  console.log("Logged into admin\n")

  // 1. Fetch all product categories
  const { product_categories: allCats } = await (
    await fetch(`${BASE}/admin/product-categories?limit=200`, { headers })
  ).json()

  const catByOldHandle = {}
  const catByNewHandle = {}
  for (const c of allCats) {
    if (HANDLE_MAP[c.handle]) {
      catByOldHandle[c.handle] = c
    }
    catByNewHandle[c.handle] = c
  }

  console.log(`Found ${Object.keys(catByOldHandle).length} old categories to migrate\n`)

  // 2. For each old category, fetch its products and reassign to new category
  let migrated = 0
  let skipped = 0

  for (const [oldHandle, newHandle] of Object.entries(HANDLE_MAP)) {
    const oldCat = catByOldHandle[oldHandle]
    const newCat = catByNewHandle[newHandle]

    if (!oldCat) {
      console.log(`  ⏭ Old category "${oldHandle}" not found — skipping`)
      skipped++
      continue
    }
    if (!newCat) {
      console.log(`  ⚠ New category "${newHandle}" not found — cannot migrate "${oldHandle}"`)
      skipped++
      continue
    }

    // Get products in old category
    const { products } = await (
      await fetch(`${BASE}/admin/product-categories/${oldCat.id}/products`, { headers })
    ).json()

    if (!products || products.length === 0) {
      console.log(`  ⏭ ${oldHandle} → ${newHandle}: no products`)
      skipped++
      continue
    }

    // Add products to new category AND remove from old category
    const addRes = await fetch(
      `${BASE}/admin/product-categories/${newCat.id}/products`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ add: products.map((p) => p.id) }),
      }
    )

    if (addRes.ok) {
      migrated += products.length
      console.log(`  ✅ ${oldHandle} → ${newHandle}: ${products.length} products migrated`)
    } else {
      const err = await addRes.text()
      console.log(`  ❌ ${oldHandle} → ${newHandle}: ${err.slice(0, 100)}`)
    }
  }

  console.log(`\nDone: ${migrated} products migrated, ${skipped} skipped`)
}

main().catch(console.error)
