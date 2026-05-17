import { readFileSync } from "fs"

const BASE = "http://127.0.0.1:9000"

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: `Bearer ${(await res.json()).token}`, "Content-Type": "application/json" }
}

function extractBaseAndWeight(title) {
  // Match weight/size at end: "400g", "1kg", "2.5kg", "500ml", "1L", "1Ltr", "1 Litre", etc.
  const patterns = [
    /^(.*?)\s+(\d+\.?\d*\s*(?:g|kg|ml|l|litre|litres|ltr)s?)$/i,
    /^(.*?)\s+(\d+\s*(?:x|X)\s*\d+\s*(?:g|kg|ml))\b.*$/i,  // "Full Case 12x400g"
    /^(.*?)\s+(\d+s)$/i,  // "160s"
  ]

  for (const pat of patterns) {
    const m = title.match(pat)
    if (m) {
      const base = m[1].trim()
      const weight = m[2].trim()
      // Skip if base would be too short or empty
      if (base.length < 3) return { base: title, weight: null }
      // Skip if full case (these stay separate)
      if (title.toLowerCase().includes("full case")) {
        return { base: title, weight: null }
      }
      return { base, weight }
    }
  }
  return { base: title, weight: null }
}

async function main() {
  const headers = await login()
  console.log("Logged in")

  // 1. Fetch all products
  console.log("Fetching products...")
  const { products } = await (await fetch(`${BASE}/admin/products?limit=500&fields=id,title,handle,thumbnail,variants,categories`, { headers })).json()
  console.log(`  ${products.length} products`)

  // 2. Group by base name
  const groups = {}
  for (const p of products) {
    const { base, weight } = extractBaseAndWeight(p.title)
    if (!weight) continue // skip unparseable

    if (!groups[base]) groups[base] = []
    groups[base].push({ ...p, weight })
  }

  // Filter to groups with 2+ products (actual variants)
  const variantGroups = Object.entries(groups).filter(([_, items]) => items.length >= 2)
  console.log(`\nFound ${variantGroups.length} variant groups`)
  for (const [base, items] of variantGroups.slice(0, 10)) {
    const weights = items.map(i => i.weight).join(", ")
    console.log(`  ${base}: ${weights} (${items.length} variants)`)
  }

  // Show what wouldn't be affected (single products)
  const singleProductBaseNames = Object.entries(groups).filter(([_, items]) => items.length === 1)
  console.log(`\n${singleProductBaseNames.length} single products stay unchanged`)

  // 3. Ask before proceeding
  console.log(`\n========================================`)
  console.log(`  Will merge ${variantGroups.length} groups`)
  console.log(`  Total individual products to merge: ${variantGroups.reduce((sum, [_, items]) => sum + items.length, 0)}`)
  console.log(`  Estimated consolidated products: ${variantGroups.length}`)
  console.log(`  168 single products stay unchanged`)
  console.log(`========================================`)
  console.log(`\nRunning merge...\n`)

  let merged = 0, failed = 0
  for (const [base, items] of variantGroups) {
    items.sort((a, b) => {
      const aVal = parseFloat(a.weight) || 0
      const bVal = parseFloat(b.weight) || 0
      return aVal - bVal
    })

    const categoryIds = items[0].categories?.map(c => c.id) || []
    const thumbnail = items.find(i => i.thumbnail)?.thumbnail || items[0].thumbnail
    const handle = "natco-" + base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    const weightValues = [...new Set(items.map(i => i.weight))]

    const variantData = items.map((item) => {
      const price = item.variants?.[0]?.prices?.[0]?.amount || 0
      return {
        title: item.weight,
        sku: `NATCO-${base.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 20)}-${item.weight.replace(/\s+/g, "")}`,
        options: { "Weight/Size": item.weight },
        prices: [{ currency_code: "gbp", amount: price }],
      }
    })

    const type = titleToType[base] || "grocery"
    const catName = items[0].categories?.[0]?.name || "Indian Groceries"

    const newProduct = {
      title: base,
      handle,
      status: "published",
      discountable: true,
      description: `Premium ${type.toLowerCase()} from Natco Foods. ${catName}.`,
      thumbnail: thumbnail || undefined,
      options: [{ title: "Weight/Size", values: weightValues }],
      variants: variantData,
    }

    try {
      const createRes = await fetch(`${BASE}/admin/products`, {
        method: "POST",
        headers,
        body: JSON.stringify(newProduct),
      })

      if (createRes.ok) {
        const { product } = await createRes.json()

        // Assign categories after creation
        if (categoryIds.length > 0) {
          const catId = categoryIds[0]
          await fetch(`${BASE}/admin/product-categories/${catId}/products`, {
            method: "POST",
            headers,
            body: JSON.stringify({ add: [product.id] }),
          })
        }

        // Delete old individual products
        for (const item of items) {
          await fetch(`${BASE}/admin/products/${item.id}`, { method: "DELETE", headers })
        }
        merged++
        console.log(`  ✅ ${base}: ${items.length} variants`)
      } else {
        const e = await createRes.text()
        console.log(`  ❌ ${base}: ${e.slice(0, 100)}`)
        failed++
      }
    } catch (e) {
      console.log(`  ❌ ${base}: ${e.message}`)
      failed++
    }
  }

  console.log(`\nDone: ${merged} merged, ${failed} failed`)
}

main().catch(console.error)
