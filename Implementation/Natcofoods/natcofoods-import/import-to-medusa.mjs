import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const JSON_PATH = resolve(__dirname, "natcofoods-catalog.json")
const BASE = "http://127.0.0.1:9000"

// Login
async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  const { token } = await res.json()
  return token
}

// Get existing categories
async function getCategories(token) {
  const res = await fetch(`${BASE}/admin/product-categories?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  return data.product_categories || []
}

// Create a category
async function createCategory(token, cat) {
  const res = await fetch(`${BASE}/admin/product-categories`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: cat.name, handle: cat.handle, is_active: true }),
  })
  if (res.ok) {
    const data = await res.json()
    process.stdout.write(".")
    return data.product_category
  }
  const err = await res.text()
  if (err.includes("already exists")) return null
  process.stdout.write("x")
  return null
}

// Create a product
async function createProduct(token, product, catMap) {
  const categoryIds = (product.categories || [])
    .map((name) => catMap.get(name))
    .filter(Boolean)

  const payload = {
    title: product.title,
    handle: product.handle,
    description: product.description || "",
    status: "published",
    weight: product.weight || undefined,
    discountable: true,
    type_id: undefined,
    categories: categoryIds.map((id) => ({ id })),
    images: (product.images || []).map((img) => ({ url: img.url })),
    options: [
      {
        title: "Weight/Size",
        values: ["Default"],
      },
    ],
    variants: [
      {
        title: product.variants?.[0]?.title || "Default",
        sku: product.variants?.[0]?.sku || product.handle,
        manage_inventory: false,
        allow_backorder: true,
        options: { "Weight/Size": "Default" },
        prices: product.variants?.[0]?.prices || [
          { currency_code: "gbp", amount: 0 },
        ],
      },
    ],
  }

  const res = await fetch(`${BASE}/admin/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (res.ok) {
    process.stdout.write(".")
    return true
  }
  const err = await res.json()
  if (err.type === "duplicate_error") {
    process.stdout.write("s")
    return "skipped"
  }
  process.stdout.write("x")
  return false
}

async function main() {
  console.log("🔑 Logging in...")
  const token = await login()
  console.log("✅ Logged in")

  // Read Natco catalog
  const catalog = JSON.parse(readFileSync(JSON_PATH, "utf-8"))
  console.log(`📦 Natco catalog: ${catalog.products.length} products, ${catalog.categories.length} categories`)

  // Get existing categories
  const existingCats = await getCategories(token)
  const existingCatNames = new Set(existingCats.map((c) => c.name.toLowerCase()))
  console.log(`🏷️  Existing categories in Medusa: ${existingCats.length}`)

  // Create new categories
  console.log("\n📁 Creating new categories...")
  const newCats = catalog.categories.filter((c) => !existingCatNames.has(c.name.toLowerCase()))
  for (const cat of newCats) {
    await createCategory(token, cat)
  }
  console.log(`\n✅ Created ${newCats.length} new categories`)

  // Refresh category map
  const allCats = await getCategories(token)
  const catMap = new Map()
  for (const cat of allCats) {
    catMap.set(cat.name, cat.id)
  }

  // Import products
  console.log("\n📦 Importing Natco products...")
  let created = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < catalog.products.length; i++) {
    const product = catalog.products[i]
    const result = await createProduct(token, product, catMap)
    if (result === true) created++
    else if (result === "skipped") skipped++
    else errors++
  }

  console.log(`\n\n✅ ${created} created, ${skipped} skipped, ${errors} errors`)
  console.log("🎉 Natco catalog merged into IndiaGrocers!")
}

main().catch(console.error)
