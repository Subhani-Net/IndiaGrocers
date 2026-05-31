import { readFileSync, writeFileSync } from "fs"

// Read fresh Natco data from Shopify JSON
const raw = readFileSync("D:/Dump/IndiaGrocers-Fix/data-design/lentils-master.json", "utf-8")
const data = JSON.parse(raw)

// Fetch our catalog
const BASE = "http://127.0.0.1:9000"
const pk = "pk_736cac65cdf91adefa6c0180c37a29f00047518c60376efb84586432312a2d00"
const r = await fetch(`${BASE}/store/products?limit=300&fields=id,title,handle,categories.handle,categories.name`, {
  headers: { "x-publishable-api-key": pk },
})
const ourProducts = (await r.json()).products || []
const ourById = {}
const ourByTitle = {}
for (const p of ourProducts) {
  ourByTitle[p.title] = { id: p.id, categories: (p.categories || []).map(c => c.handle) }
  ourById[p.id] = p
}

// Rebuild CSV
const header = "natco_handle,title,variant_weight,natco_type,natco_subcategory,our_subcategory,in_catalog,our_product_id,our_categories,match_status"
const rows = []

for (const p of data.products) {
  const natcoCat = p.natco_subcategory
  const ourInfo = ourByTitle[p.title]
  const inCatalog = ourInfo ? "YES" : "NO"
  const id = ourInfo?.id || ""
  const ourCats = ourInfo?.categories?.join("; ") || ""
  const ourCat = ourInfo?.categories?.[0] || ""

  let status = "MISSING"
  if (ourInfo && ourCats === natcoCat) status = "OK"
  else if (ourInfo && ourCats !== natcoCat) status = "WRONG_CATEGORY"

  const title = p.title.replace(/,/g, " ") // Remove commas from title
  const type = p.natco_type.replace(/,/g, ";") // Replace comma in type

  rows.push(`${p.natco_handle},${title},${p.variant_weight},${type},${natcoCat},${ourCat},${inCatalog},${id},${ourCats},${status}`)
}

// Write
writeFileSync("D:/Dump/IndiaGrocers-Fix/data-design/lentils-master.csv", header + "\n" + rows.join("\n"))

// Summary
const counts = {}
for (const r of rows) {
  const status = r.split(",").pop()
  counts[status] = (counts[status] || 0) + 1
}
console.log("Summary:", JSON.stringify(counts))
console.log("\nMISMATCHES (wrong subcategory):")
for (const r of rows) {
  if (r.includes("WRONG_CATEGORY")) {
    const cols = r.split(",")
    console.log(`  ${cols[1]} | natco: ${cols[4]} | our: ${cols[8]}`)
  }
}
