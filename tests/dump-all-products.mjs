/**
 * Dump all products to a single JSON file with full metadata.
 * Run: node tests/dump-all-products.mjs
 */
import http from "http"
import fs from "fs"

const PK = "pk_72deb296139d27885561a0fa58b77cbed187d8c5912390c2dc1912cb477083d3"

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: "localhost", port: 9000, path, headers: { "x-publishable-api-key": PK } }, (res) => {
      let d = ""
      res.on("data", (c) => (d += c))
      res.on("end", () => resolve({ status: res.statusCode, text: d }))
    })
    req.on("error", reject)
  })
}

async function main() {
  // Get region
  const regRaw = await get("/store/regions")
  const regionId = JSON.parse(regRaw.text).regions[0].id

  // Fetch all products with full fields
  const all = []
  let offset = 0
  while (true) {
    const fields = [
      "id", "title", "handle", "subtitle", "description", "thumbnail", "status", "created_at",
      "categories.handle", "categories.name",
      "collection.handle", "collection.title",
      "tags.value",
      "variants.id", "variants.title", "variants.sku", "variants.inventory_quantity",
      "variants.calculated_price.calculated_amount", "variants.calculated_price.currency_code",
      "*metadata", "*variants.metadata",
    ].join(",")

    const path = `/store/products?limit=100&offset=${offset}&region_id=${regionId}&fields=${fields}`
    const r = await get(path)
    const data = JSON.parse(r.text)
    all.push(...(data.products || []))
    if ((data.products || []).length < 100) break
    offset += 100
  }

  // Write JSON
  const output = {
    generated: new Date().toISOString(),
    total: all.length,
    products: all,
  }

  fs.writeFileSync("tests/all-products.json", JSON.stringify(output, null, 2))
  console.log(`Wrote ${all.length} products to tests/all-products.json`)
}

main().catch((e) => { console.error(e.message); process.exit(1) })
