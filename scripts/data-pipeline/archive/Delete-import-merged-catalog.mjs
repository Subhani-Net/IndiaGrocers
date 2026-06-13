// Import merged TRS + Natco catalog into Medusa backend
import { readFileSync } from "fs"
import { resolve, extname } from "path"

const BASE = "http://127.0.0.1:9000"
const MERGED_PATH = "C:\\IndiaGrocers\\Implementation\\merged-catalog.json"

const TRS_CATEGORY_MAP = {
  "Spices": "spices-and-masalas", "Pulses": "dals-and-lentils",
  "Flours": "flours-and-grains", "Condiments Sauces": "pickles-and-chutneys",
  "Rice": "rice-and-grains", "Dried Fruit Nuts": "snacks-and-namkeen",
  "Snacks": "snacks-and-namkeen", "Cans": "fresh-vegetables",
  "Speciality": "flours-and-grains",
}

const NATCO_TYPE_MAP = {
  "Soya": "dals-and-lentils", "Lentils": "dals-and-lentils", "Beans": "dals-and-lentils",
  "Tinned Lentils, Beans": "dals-and-lentils",
  "Rice": "rice-and-grains", "Flour": "flours-and-grains", "Corn": "flours-and-grains",
  "Couscous": "flours-and-grains", "Pasta": "noodles-and-pasta",
  "Ghee & Oils": "cooking-oils-and-ghee", "Ghee": "cooking-oils-and-ghee", "Oil": "cooking-oils-and-ghee",
  "Nuts": "snacks-and-namkeen", "Raw Nuts": "snacks-and-namkeen", "Flavoured Nuts": "snacks-and-namkeen",
  "Seeds": "snacks-and-namkeen", "Dried Fruit": "snacks-and-namkeen", "Tinned Fruit": "sweets-and-mithai",
  "Snacks": "snacks-and-namkeen", "Namkeen & Lentil Snacks": "snacks-and-namkeen",
  "Daria Lentil Snack": "snacks-and-namkeen", "Lentil Snack": "snacks-and-namkeen",
  "Pappadoms": "papads-and-fryums", "Pappadom": "papads-and-fryums",
  "Chutneys, Pickles & Sauces": "pickles-and-chutneys",
  "Pickles": "pickles-and-chutneys", "Chutney": "pickles-and-chutneys",
  "Sauces": "sauces-and-ketchup", "Sauce": "sauces-and-ketchup", "Paste": "pickles-and-chutneys",
  "Spices": "spices-and-masalas", "Spice Jars": "spices-and-masalas",
  "Spice & Herb Jars": "spices-and-masalas", "Spice Blends and Mixes": "spices-and-masalas",
  "Seasoning": "spices-and-masalas", "Herbs": "spices-and-masalas", "Flavouring": "spices-and-masalas",
  "Food Colouring": "spices-and-masalas", "Food Colourings & Essences": "spices-and-masalas",
  "Sugar": "sweets-and-mithai", "Sugar & Jaggery": "sweets-and-mithai",
  "Teas & Drinks": "beverages", "Tea": "beverages", "Drinks": "beverages", "Drink": "beverages",
  "Coconut Products": "cooking-oils-and-ghee", "Coconut": "cooking-oils-and-ghee",
  "Tinned Coconut": "cooking-oils-and-ghee",
  "Vegetables": "fresh-vegetables", "Tinned Vegetables": "fresh-vegetables",
  "Dairy": "dairy-and-milk-products", "Milk Powder": "dairy-and-milk-products",
}

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: `Bearer ${(await res.json()).token}`, "Content-Type": "application/json" }
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

async function main() {
  const headers = await login()
  console.log("Logged in\n")

  // Load merged catalog
  const catalog = JSON.parse(readFileSync(MERGED_PATH, "utf-8"))
  console.log(`Loaded ${catalog.length} products from merged catalog`)

  // Get categories
  const { product_categories } = await (await fetch(`${BASE}/admin/product-categories?limit=100`, { headers })).json()
  const catByHandle = {}
  for (const c of product_categories) catByHandle[c.handle] = c
  console.log(`Fetched ${product_categories.length} categories`)

  // Get existing products to avoid duplicates
  const { products: existingProducts } = await (await fetch(`${BASE}/admin/products?limit=500&fields=id,title,handle`, { headers })).json()
  const existingTitles = new Set(existingProducts.map(p => p.title))
  console.log(`Existing products in DB: ${existingProducts.length}`)

  // Process TRS products (new ones only)
  const trsProducts = catalog.filter(p => p.source === "TRS")
  let created = 0, skipped = 0

  for (const p of trsProducts) {
    // Skip if already exists
    if (existingTitles.has(p.title) || existingTitles.has(p.original_title)) {
      skipped++
      continue
    }

    const variants = p.variants || []
    const handle = "trs-" + slugify(p.title)
    const seedHandle = TRS_CATEGORY_MAP[p.category] || "other"
    const seedCat = catByHandle[seedHandle]
    const optionTitle = "Weight/Size"

    const productData = {
      title: "TRS " + p.title,
      handle,
      status: "published",
      discountable: true,
      description: `TRS ${p.category} from IndiaGrocers. ${p.description || ""}`.slice(0, 500),
      options: variants.length > 1 ? [{ title: optionTitle, values: variants }] : undefined,
      variants: variants.map((v, i) => ({
        title: v,
        sku: `TRS-${slugify(p.title).toUpperCase().slice(0,20)}-${v}`,
        options: variants.length > 1 ? { [optionTitle]: v } : undefined,
        prices: [{ currency_code: "gbp", amount: Math.round(99 + i * 50) }],
        manage_inventory: false,
      })),
      ...(variants.length <= 1 ? {
        variants: [{ title: variants[0] || "Standard", prices: [{ currency_code: "gbp", amount: 99 }], manage_inventory: false }],
      } : {}),
    }

    // Remove undefined fields
    Object.keys(productData).forEach(k => { if (productData[k] === undefined) delete productData[k] })

    const res = await fetch(`${BASE}/admin/products`, { method: "POST", headers, body: JSON.stringify(productData) })
    if (res.ok) {
      created++
      const { product } = await res.json()
      // Assign category
      if (seedCat && product) {
        await fetch(`${BASE}/admin/product-categories/${seedCat.id}/products`, {
          method: "POST", headers, body: JSON.stringify({ add: [product.id] }),
        })
      }
      if (created % 10 === 0) console.log(`  ${created} TRS products created...`)
    } else {
      const e = await res.text()
      console.log(`  FAIL ${p.title}: ${e.slice(0,100)}`)
    }
  }

  console.log(`\nTRS: ${created} created, ${skipped} skipped (already exist)`)

  // Verify final state
  const { products: finalProducts } = await (await fetch(`${BASE}/admin/products?limit=500&fields=id,title`, { headers })).json()
  console.log(`\nFinal product count: ${finalProducts.length}`)
}

main().catch(console.error)
