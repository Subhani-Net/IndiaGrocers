/**
 * Dump product catalog from store API (includes category data).
 * Run: node tests/dump-catalog.mjs
 */
import http from "http"

const PK = "pk_72deb296139d27885561a0fa58b77cbed187d8c5912390c2dc1912cb477083d3"

function get(path, host = "localhost", port = 9000, headers = {}) {
  return new Promise((resolve) => {
    http.get({ hostname: host, port, path, headers }, (res) => {
      let d = ""
      res.on("data", (c) => (d += c))
      res.on("end", () => resolve(d))
    })
  })
}

async function main() {
  // Get region ID
  const regRaw = await get("/store/regions", "localhost", 9000, { "x-publishable-api-key": PK })
  const regionId = JSON.parse(regRaw).regions[0].id

  // Get all categories
  const catsRaw = await get("/store/product-categories?limit=100&fields=id,handle,name,parent_category_id", "localhost", 9000, { "x-publishable-api-key": PK })
  const cats = JSON.parse(catsRaw).product_categories
  const parents = cats.filter((c) => !c.parent_category_id)

  // Get all products
  const all = []
  let offset = 0
  while (true) {
    const r = JSON.parse(
      await get(
        `/store/products?limit=100&offset=${offset}&region_id=${regionId}&fields=id,title,handle,categories.handle,variants.id,variants.title`,
        "localhost", 9000, { "x-publishable-api-key": PK }
      )
    )
    all.push(...(r.products || []))
    if ((r.products || []).length < 100) break
    offset += 100
  }

  // Dump per category
  for (const c of parents) {
    const prods = all.filter((p) => (p.categories || []).some((cat) => cat.handle === c.handle))
    console.log(`${c.handle}|${c.name}|${prods.length}`)
    if (prods.length > 0) {
      prods.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title} [${p.handle}]`)
      })
    }
  }

  console.log(`\nTOTAL_PRODUCTS|${all.length}`)
}

main().catch((e) => console.error(e.message))
