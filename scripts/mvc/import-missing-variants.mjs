/**
 * Import missing MVC weight variants
 * Products with same base name but different weights were skipped during import.
 * This script imports the remaining variants with unique titles.
 */
const BASE = "http://127.0.0.1:9000"

async function login() {
  const res = await fetch(BASE + "/auth/user/emailpass", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: "Bearer " + (await res.json()).token, "Content-Type": "application/json" }
}

async function main() {
  const headers = await login()

  const prods = []; let off = 0
  while (true) {
    const r = await (await fetch(BASE + "/admin/products?limit=100&offset=" + off + "&fields=id,title", { headers })).json()
    if (!r.products?.length) break
    prods.push(...r.products); off += 100
  }
  const dbTitles = new Set(prods.map(p => p.title))

  const catsRes = await (await fetch(BASE + "/admin/product-categories?limit=300&fields=id,handle", { headers })).json()
  const catByHandle = {}
  catsRes.product_categories.forEach(c => { catByHandle[c.handle] = c.id })

  const toImport = [
    { title: "Tilda Pure Basmati 5kg", variant: "5kg", cat: "rice-quinoa", price: 799 },
    { title: "Tilda Pure Basmati 10kg", variant: "10kg", cat: "rice-quinoa", price: 1399 },
    { title: "Kohinoor Extra Long Basmati 5kg", variant: "5kg", cat: "rice-quinoa", price: 899 },
    { title: "Lal Qilla Premium Basmati 10kg", variant: "10kg", cat: "rice-quinoa", price: 999 },
    { title: "Elephant Atta Chakki Fresh 10kg", variant: "10kg", cat: "flour-milk-powder", price: 999 },
    { title: "Pillsbury Chakki Fresh Atta 10kg", variant: "10kg", cat: "flour-milk-powder", price: 999 },
    { title: "Aashirvaad Atta Select 10kg", variant: "10kg", cat: "flour-milk-powder", price: 1099 },
    { title: "Brooke Bond Red Label Tea 1kg", variant: "1kg", cat: "loose-leaf-tea", price: 799 },
    { title: "Tata Gold Tea 1kg", variant: "1kg", cat: "loose-leaf-tea", price: 899 },
    { title: "Wagh Bakri Premium Tea 1kg", variant: "1kg", cat: "loose-leaf-tea", price: 899 },
    { title: "Hamdard Rooh Afza 1.5L", variant: "1.5L", cat: "drinks-syrups", price: 699 },
    { title: "Haldiram's Aloo Bhujia 400g", variant: "400g", cat: "haldiram-namkeens", price: 199 },
    { title: "Haldiram's Aloo Bhujia 1kg", variant: "1kg", cat: "haldiram-namkeens", price: 399 },
    { title: "Haldiram's Moong Dal 400g", variant: "400g", cat: "haldiram-namkeens", price: 249 },
    { title: "Haldiram's Gulab Jamun Tin 1kg", variant: "1kg", cat: "tinned-sweets", price: 599 },
    { title: "Parle-G Glucose Biscuits 1kg", variant: "1kg", cat: "indian-biscuits", price: 399 },
    { title: "Maggi 2-Minute Noodles Masala 8-Pack", variant: "8-Pack", cat: "instant-noodles", price: 449 },
  ]

  let created = 0, skipped = 0
  for (const p of toImport) {
    if (dbTitles.has(p.title)) { skipped++; console.log("  SKIP: " + p.title); continue }

    const handle = p.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 80)
    const catId = catByHandle[p.cat]
    if (!catId) { console.log("  NO CAT: " + p.title + " -> " + p.cat); continue }

    const res = await fetch(BASE + "/admin/products", {
      method: "POST", headers,
      body: JSON.stringify({
        title: p.title, handle, status: "published",
        description: p.title + " - Premium quality product.",
        options: [{ title: "Weight/Size", values: [p.variant] }],
        variants: [{
          title: p.variant,
          sku: "MVC-" + handle + "-v0",
          manage_inventory: false, allow_backorder: true,
          prices: [{ currency_code: "gbp", amount: p.price }],
          options: { "Weight/Size": p.variant },
        }],
        metadata: {
          brand_slug: "generic", country_of_origin: "India",
          uk_food_business_operator: "Imported by IndiaGrocers Ltd, London",
          dietary_flags: ["vegetarian"], allergens: [], vat_rate: 0,
          velocity: "B", sourcing_tier: "B",
          ingredients: "See product packaging",
          best_before_guidance: "See product packaging",
          synonyms: [], regional_tags: [],
          subscription_eligible: true,
          requires_fast_delivery: false, requires_cold_chain: false,
          mvc_round: "1",
        },
      }),
    })

    if (res.ok) {
      const { product } = await res.json()
      if (catId) {
        await fetch(BASE + "/admin/product-categories/" + catId + "/products", {
          method: "POST", headers, body: JSON.stringify({ add: [product.id] }),
        })
      }
      console.log("  OK: " + p.title + " -> " + p.cat)
      created++
    } else {
      console.log("  FAIL: " + p.title + " " + (await res.text()).slice(0, 100))
    }
  }
  console.log("\nCreated: " + created + ", Skipped: " + skipped)
  if (created > 0) console.log("Reindex: cd apps/meilisearch && npm run reindex")
}

main().catch(console.error)
