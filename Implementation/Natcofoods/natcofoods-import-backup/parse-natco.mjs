import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs"
import { join, resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = resolve(__dirname, ".")
const NATCO_DIR = "D:\\Websites\\NatcoFoods\\NatcoFoods\\shop.natcofoods.com"
const COLLECTIONS_DIR = join(NATCO_DIR, "collections")

// Category taxonomy from site navigation
const CATEGORY_TAXONOMY = {
  "Spices": ["Spices & Herbs", "Spice & Herb Jars", "Spice Blends & Mixes", "Food Colourings & Essences", "Sugar"],
  "Essentials": ["Tinned Products", "Ghee & Oils", "Teas & Drinks", "Vegetables", "Flour"],
  "Lentils & Beans": ["Dried Lentils Beans & Peas", "Soya Products", "Tinned Lentils & Beans"],
  "Nuts & Seeds": ["Raw Nuts", "Flavoured Nuts", "Seeds", "Coconut Products", "Dried Fruit", "Nut and Seed Oils"],
  "Snacks": ["Pappadoms", "Chutneys Pickles & Sauces", "Namkeen & Lentil Snacks"],
  "Grains": ["Rice & Quinoa", "Flour & Milk Powder", "Wheat Grains & Couscous", "Corn", "Soya"],
}

// Map Shopify collection handles to parent categories
const COLLECTION_TO_PARENT = {
  "spices-herbs": "Spices", "spice-jars": "Spices", "spice-mixes": "Spices",
  "food-colourings-essences": "Spices", "sugar": "Spices",
  "essentials": "Essentials", "tinned-products": "Essentials", "ghee-oils": "Essentials",
  "teas-drinks": "Essentials", "vegetables": "Essentials", "flour": "Essentials",
  "lentils": "Lentils & Beans", "all-lentils": "Lentils & Beans", "soya": "Lentils & Beans",
  "tinned-lentils-beans": "Lentils & Beans",
  "nuts": "Nuts & Seeds", "raw-nuts": "Nuts & Seeds", "flavoured-nuts": "Nuts & Seeds",
  "seeds": "Nuts & Seeds", "coconut-products": "Nuts & Seeds", "dried-fruit": "Nuts & Seeds",
  "nut-seed-oils": "Nuts & Seeds",
  "snacks": "Snacks", "pappadoms": "Snacks", "condiments": "Snacks", "condiments-1": "Snacks",
  "namkeen": "Snacks",
  "grains": "Grains", "rice": "Grains", "wheat-grains-couscous": "Grains", "corn": "Grains",
}

// Extract handle from a Shopify product URL
function extractHandle(url) {
  const m = url.match(/\/products\/([^/?]+)/)
  return m ? m[1] : ""
}

// Extract image URL from CDATA summary
function extractImage(summary) {
  const m = summary.match(/<img[^>]+src="([^"]+)"/)
  return m ? m[1] : ""
}

// Clean description from CDATA summary
function extractDescription(summary) {
  const withoutImg = summary.replace(/<img[^>]+>/g, "")
  const withoutTables = withoutImg.replace(/<table[^>]*>[\s\S]*?<\/table>/g, "")
  const text = withoutTables
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return text.slice(0, 1000)
}

// Parse a single Atom entry
function parseEntry(xml) {
  const getTag = (tag) => {
    const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
    return m ? m[1].trim() : ""
  }
  const getAllTags = (tag) => {
    const results = []
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "g")
    let m
    while ((m = re.exec(xml))) results.push(m[1].trim())
    return results
  }

  const id = getTag("id")
  const title = getTag("title")
  const link = getTag("link")
  const handle = extractHandle(link || id)
  const type = getTag("s:type")
  const vendor = getTag("s:vendor")
  const summary = getTag("summary")
  const summaryCdata = xml.match(/<summary[^>]*>[\s\S]*?<!\[CDATA\[([\s\S]*?)\]\]>[\s\S]*?<\/summary>/)
  const description = summaryCdata ? extractDescription(summaryCdata[1]) : extractDescription(summary)
  const image = summaryCdata ? extractImage(summaryCdata[1]) : extractImage(summary)
  const tags = getAllTags("s:tag")
  const published = getTag("published")

  // Variant
  const variantMatch = xml.match(/<s:variant>([\s\S]*?)<\/s:variant>/)
  let sku = "", price = 0, grams = 0
  if (variantMatch) {
    const v = variantMatch[1]
    sku = (v.match(/<s:sku>([^<]*)<\/s:sku>/) || [])[1] || ""
    price = parseFloat((v.match(/<s:price[^>]*>([^<]*)<\/s:price>/) || [])[1] || "0")
    grams = parseInt((v.match(/<s:grams>([^<]*)<\/s:grams>/) || [])[1] || "0")
  }

  // Determine category path
  const typeLower = (type || "").toLowerCase().replace(/[\s&]+/g, "-")
  // Find collection handle for this product from known collections
  const knownCollections = Object.keys(COLLECTION_TO_PARENT)
  let categoryPath = ["All Products"]
  // Match type to a collection
  const matchedCollection = knownCollections.find((c) =>
    typeLower.includes(c) || c.includes(typeLower) || title.toLowerCase().includes(c.replace(/-/g, " "))
  )
  if (matchedCollection) {
    const parent = COLLECTION_TO_PARENT[matchedCollection]
    if (parent) categoryPath = [parent, matchedCollection.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())]
  }

  // Determine a display-friendly product type
  const productType = type || tags[0] || "General"

  return {
    id,
    handle,
    title,
    vendor,
    type: productType,
    categoryPath,
    category: categoryPath[categoryPath.length - 1],
    parentCategory: categoryPath.length > 1 ? categoryPath[0] : "",
    description,
    image,
    tags,
    published,
    sku,
    price_gbp: price,
    weight_g: grams,
  }
}

// Main parser
function main() {
  console.log("📂 Reading Atom feeds from:", COLLECTIONS_DIR)

  // Read all .atom files
  const atomFiles = readdirSync(COLLECTIONS_DIR).filter((f) => f.endsWith(".atom"))
  console.log(`📄 Found ${atomFiles.length} Atom feed files`)

  // Parse all products
  const allProducts = []
  const seenHandles = new Set()
  const categoryMap = new Map() // type -> set of handles

  for (const file of atomFiles) {
    const collectionHandle = file.replace(".atom", "")
    const xml = readFileSync(join(COLLECTIONS_DIR, file), "utf-8")

    // Extract entries
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
    let match
    let count = 0
    while ((match = entryRegex.exec(xml))) {
      const product = parseEntry(match[1])
      if (!product.handle || !product.sku) continue

      // Deduplicate by handle
      if (!seenHandles.has(product.handle)) {
        seenHandles.add(product.handle)
        product.sourceCollection = collectionHandle
        allProducts.push(product)
        count++
      } else {
        // Already seen - just add to category mapping if new
        const existing = allProducts.find((p) => p.handle === product.handle)
        if (existing) {
          // Merge tags and update source collection
          existing.tags = [...new Set([...existing.tags, ...product.tags])]
        }
      }
    }
  }

  console.log(`📦 ${allProducts.length} unique products parsed`)

  // Build category structure
  const categories = []
  const catSeen = new Set()
  for (const p of allProducts) {
    for (const cat of [p.parentCategory, p.category].filter(Boolean)) {
      if (!catSeen.has(cat)) {
        catSeen.add(cat)
        categories.push({ name: cat, handle: cat.toLowerCase().replace(/[\s&]+/g, "-") })
      }
    }
  }

  // Sort categories
  const parentOrder = ["Grains", "Lentils & Beans", "Nuts & Seeds", "Spices", "Essentials", "Snacks"]
  categories.sort((a, b) => {
    const ai = parentOrder.indexOf(a.name)
    const bi = parentOrder.indexOf(b.name)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.name.localeCompare(b.name)
  })

  console.log(`🏷️  ${categories.length} unique categories found`)

  // Generate MedusaJS-compatible JSON
  const medusaJson = {
    store: {
      name: "Natco Foods",
      supported_currencies: [{ currency_code: "gbp", is_default: true }],
    },
    categories: categories.map((c) => ({
      name: c.name,
      handle: c.handle,
      is_active: true,
      is_internal: false,
    })),
    products: allProducts.map((p) => ({
      title: p.title,
      handle: p.handle,
      description: p.description,
      status: "published",
      weight: p.weight_g || undefined,
      images: p.image ? [{ url: p.image }] : [],
      categories: [p.category].filter(Boolean),
      tags: p.tags,
      discountable: true,
      type: { value: p.type },
      options: [{ title: "Weight/Size", values: ["Default"] }],
      variants: [
        {
          title: "Default",
          sku: p.sku,
          manage_inventory: true,
          allow_backorder: false,
          options: { "Weight/Size": "Default" },
          prices: [{ currency_code: "gbp", amount: Math.round(p.price_gbp * 100) }],
        },
      ],
    })),
  }

  // Write JSON
  const jsonPath = join(OUTPUT_DIR, "natcofoods-catalog.json")
  writeFileSync(jsonPath, JSON.stringify(medusaJson, null, 2), "utf-8")
  console.log(`✅ JSON written: ${jsonPath} (${Math.round(jsonPath.length / 1024)} KB)`)

  // Generate CSV in MedusaJS v2 format
  const csvHeader = [
    "Product Handle", "Product Title", "Product Subtitle", "Product Description",
    "Product Status", "Product Thumbnail", "Product Weight", "Product Discountable",
    "Product Type", "Product Tag 1", "Product Tag 2", "Product Tag 3",
    "Variant Title", "Variant Sku", "Variant Barcode", "Variant Manage Inventory",
    "Variant Allow Backorder", "Variant Option 1 Name", "Variant Option 1 Value",
    "Variant Price GBP", "Shipping Profile Id",
  ]

  const escapeCsv = (val) => {
    if (val == null) return ""
    const s = String(val)
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  const csvRows = allProducts.flatMap((p) => {
    const tag1 = p.tags[0] || p.type || ""
    const tag2 = p.tags[1] || ""
    const tag3 = p.tags[2] || ""

    return [
      [
        escapeCsv(p.handle),
        escapeCsv(p.title),
        "",
        escapeCsv(p.description),
        "published",
        escapeCsv(p.image),
        p.weight_g || "",
        "TRUE",
        escapeCsv(p.type),
        escapeCsv(tag1),
        escapeCsv(tag2),
        escapeCsv(tag3),
        "Default",
        escapeCsv(p.sku),
        "",
        "TRUE",
        "FALSE",
        "Weight/Size",
        "Default",
        p.price_gbp || "",
        "default",
      ].join(","),
    ]
  })

  const csvContent = [csvHeader.join(","), ...csvRows].join("\n")
  const csvPath = join(OUTPUT_DIR, "natcofoods-catalog.csv")
  writeFileSync(csvPath, csvContent, "utf-8")
  console.log(`✅ CSV written: ${csvPath} (${csvRows.length} rows)`)

  // Generate summary report
  const byCategory = {}
  for (const p of allProducts) {
    const cat = p.category || "Uncategorised"
    byCategory[cat] = (byCategory[cat] || 0) + 1
  }

  const summaryPath = join(OUTPUT_DIR, "SUMMARY.md")
  const summaryLines = [
    "# Natco Foods — Product Catalog Summary",
    "",
    `Total products: **${allProducts.length}**`,
    `Total categories: **${categories.length}**`,
    "",
    "## Products by Category",
    "",
    "| Category | Count |",
    "|---|---|",
    ...Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => `| ${cat} | ${count} |`),
    "",
    "## Top Tags",
    "",
    "| Tag | Count |",
    "|---|---|",
    ...Object.entries(
      allProducts.reduce((acc, p) => {
        p.tags.forEach((t) => { acc[t] = (acc[t] || 0) + 1 })
        return acc
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => `| ${tag} | ${count} |`),
    "",
    "## SKU Prefix Distribution",
    "",
    "| Prefix | Count |",
    "|---|---|",
    ...Object.entries(
      allProducts.reduce((acc, p) => {
        const prefix = (p.sku || "?")[0]
        acc[prefix] = (acc[prefix] || 0) + 1
        return acc
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .map(([prefix, count]) => `| ${prefix} | ${count} |`),
  ]

  writeFileSync(summaryPath, summaryLines.join("\n"), "utf-8")
  console.log(`✅ Summary written: ${summaryPath}`)

  // Stats
  const totalPrice = allProducts.reduce((s, p) => s + p.price_gbp, 0)
  console.log("")
  console.log("═══════════════════════════════════════")
  console.log("  Natco Foods Catalog Complete!")
  console.log(`  Products: ${allProducts.length}`)
  console.log(`  Categories: ${categories.length}`)
  console.log(`  Avg Price: £${(totalPrice / allProducts.length).toFixed(2)}`)
  console.log(`  Total Value: £${totalPrice.toFixed(2)}`)
  console.log("═══════════════════════════════════════")
}

main()
