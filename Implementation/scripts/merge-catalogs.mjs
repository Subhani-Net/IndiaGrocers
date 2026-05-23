// Merge TRS Foods + Natco Foods catalogs
import { readFileSync, writeFileSync } from "fs"

const TRS_PATH = "C:\\IndiaGrocers\\Implementation\\TRS_products\\products.json"
const NATCO_PATH = "C:\\IndiaGrocers\\Implementation\\Natcofoods\\natcofoods-import\\natcofoods-catalog.json"
const OUTPUT_PATH = "C:\\IndiaGrocers\\Implementation\\merged-catalog.json"

// TRS category → seed parent category
const TRS_CATEGORY_MAP = {
  "Spices": "spices-and-masalas", "Pulses": "dals-and-lentils",
  "Flours": "flours-and-grains", "Condiments Sauces": "pickles-and-chutneys",
  "Rice": "rice-and-grains", "Dried Fruit Nuts": "snacks-and-namkeen",
  "Snacks": "snacks-and-namkeen", "Cans": "fresh-vegetables",
  "Speciality": "flours-and-grains",
}

const TRS_CATEGORY_NAMES = {
  "Spices": "Spices & Masalas", "Pulses": "Dals & Lentils",
  "Flours": "Flours & Grains", "Condiments Sauces": "Pickles & Chutneys",
  "Rice": "Rice & Grains", "Dried Fruit Nuts": "Snacks & Namkeen",
  "Snacks": "Snacks & Namkeen", "Cans": "Fresh Vegetables",
  "Speciality": "Flours & Grains",
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

// Load data
const trsProducts = JSON.parse(readFileSync(TRS_PATH, "utf-8").replace(/^\uFEFF/, ""))
const natcoRaw = JSON.parse(readFileSync(NATCO_PATH, "utf-8").replace(/^\uFEFF/, ""))
const natcoCatalog = natcoRaw.products || natcoRaw

console.log("=".repeat(60))
console.log("  IndiaGrocers — TRS + Natco Catalog Merge")
console.log("=".repeat(60))

// Analyze TRS
const trsByCategory = {}
trsProducts.forEach(p => {
  if (!trsByCategory[p.category]) trsByCategory[p.category] = []
  trsByCategory[p.category].push(p)
})

console.log("\nTRS Foods: " + trsProducts.length + " products")
for (const [cat, products] of Object.entries(trsByCategory).sort((a, b) => b[1].length - a[1].length)) {
  console.log("  " + cat + " -> " + (TRS_CATEGORY_NAMES[cat] || "Other") + " (" + products.length + ")")
}

// Analyze Natco
const natcoByType = {}
natcoCatalog.forEach(p => {
  const t = (p.type?.value || "Other").replace(/&amp;/g, "&")
  if (!natcoByType[t]) natcoByType[t] = []
  natcoByType[t].push(p)
})

console.log("\nNatco Foods: " + natcoCatalog.length + " products, " + Object.keys(natcoByType).length + " types")
for (const [type, products] of Object.entries(natcoByType).sort((a, b) => b[1].length - a[1].length).slice(0, 10)) {
  const seed = NATCO_TYPE_MAP[type] || "other"
  console.log("  " + type + " -> " + seed + " (" + products.length + ")")
}

// Build merged catalog
const mergedCatalog = []
const seedCatCounts = {}

for (const p of trsProducts) {
  const seedHandle = TRS_CATEGORY_MAP[p.category] || "other"
  const catName = TRS_CATEGORY_NAMES[p.category] || p.category
  const cleanName = p.product_name.replace(/^TRS\s+/, "")
  const variants = (p.variants || []).filter(v => v)
  
  mergedCatalog.push({
    source: "TRS", title: cleanName, original_title: p.product_name,
    category: p.category, seed_category_handle: seedHandle,
    seed_category_name: catName,
    variants: variants.length > 0 ? variants : ["Standard"],
    description: p.description || "",
    image: p.image_relative_path || null,
  })
  
  if (!seedCatCounts[catName]) seedCatCounts[catName] = 0
  seedCatCounts[catName]++
}

for (const p of natcoCatalog) {
  const natcoType = (p.type?.value || "").replace(/&amp;/g, "&")
  const seedHandle = NATCO_TYPE_MAP[natcoType] || "other"
  
  mergedCatalog.push({
    source: "Natco", title: p.title || "", original_title: p.title || "",
    product_type: natcoType, seed_category_handle: seedHandle,
    variants: (p.variants || []).map(v => v.title).filter(v => v !== "Default"),
    description: p.description || "",
  })
  
  const catName = seedHandle.replace(/-and-/g, " & ").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())
  if (!seedCatCounts[catName]) seedCatCounts[catName] = 0
  seedCatCounts[catName]++
}

// Save
writeFileSync(OUTPUT_PATH, JSON.stringify(mergedCatalog, null, 2))

// Summary
console.log("\n" + "=".repeat(60))
console.log("  MERGED CATALOG: " + mergedCatalog.length + " products")
console.log("  TRS: " + trsProducts.length + " | Natco: " + natcoCatalog.length)
console.log("=".repeat(60))
console.log("\nSeed category distribution:")
for (const [cat, count] of Object.entries(seedCatCounts).sort((a, b) => b[1] - a[1])) {
  const bar = "#".repeat(Math.round(count / 5))
  console.log("  " + cat.padEnd(30) + " " + String(count).padStart(4) + "  " + bar)
}
console.log("\nOutput: " + OUTPUT_PATH)
