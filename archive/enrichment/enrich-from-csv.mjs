/**
 * Data Enrichment Engine — Plain JS
 * Usage: node scripts/enrich-from-csv.mjs [--apply]
 */
import { readFileSync, readdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const DATA_DIR = resolve(ROOT, "data-design")
const BASE = "http://127.0.0.1:9000"
const APPLY = process.argv.includes("--apply")

const VALID_DIETARY = ["vegetarian","vegan","gluten-free","organic"]
const UK14_ALLERGENS = ["celery","gluten","crustaceans","eggs","fish","lupin","milk","molluscs","mustard","tree-nuts","peanuts","sesame","soya","sulphites"]

const DRY_LENTILS_BEANS = ["vegan","vegetarian","dairy-free","high-protein","high-fibre","low-fat","gluten-free","no-added-sugar","halal"]
const TINNED_LENTILS = ["vegan","vegetarian","dairy-free","gluten-free","low-fat","halal"]
const TINNED_VEG = ["vegan","vegetarian","dairy-free","gluten-free","low-fat"]
const TINNED_COCONUT = ["vegan","vegetarian","dairy-free","gluten-free"]
const TINNED_FRUIT = ["vegan","vegetarian","dairy-free","gluten-free","no-added-sugar"]
const DARIA = ["vegan","vegetarian","high-protein","gluten-free","halal"]
const SOYA = ["vegan","vegetarian","dairy-free","high-protein","high-fibre","low-fat","gluten-free","meat-alternative","halal"]
const SPICES = ["vegan","vegetarian","dairy-free","gluten-free","low-fat","no-added-sugar","halal"]
const SPICE_BLENDS = ["vegan","vegetarian","dairy-free","low-fat","halal"]
const FLAVOURINGS = ["vegan","vegetarian","dairy-free"]
const SUGAR = ["vegan","vegetarian","dairy-free","gluten-free"]
const FLOUR = ["vegetarian","dairy-free","high-fibre","halal"]

function dietForType(natcoType) {
  const t = (natcoType || "").toLowerCase()
  if (t.includes("lentil") && t.includes("tinned")) return TINNED_LENTILS
  if (t.includes("tinned vegetable")) return TINNED_VEG
  if (t.includes("tinned coconut")) return TINNED_COCONUT
  if (t.includes("tinned fruit")) return TINNED_FRUIT
  if (t.includes("lentil") || t.includes("bean")) return DRY_LENTILS_BEANS
  if (t.includes("daria")) return DARIA
  if (t.includes("soya")) return SOYA
  if (t.includes("spice blend") || t.includes("masala") || t.includes("mix")) return SPICE_BLENDS
  if (t.includes("spice") || t.includes("herb")) return SPICES
  if (t.includes("food colour") || t.includes("flavour")) return FLAVOURINGS
  if (t.includes("sugar") || t.includes("jaggery")) return SUGAR
  if (t.includes("flour")) return FLOUR
  return SPICES
}

const ECO_RATINGS = {
  "Brown Chick Peas": { rating: "A", carbon: "A+", water: "D", pollution: "A+", biodiversity: "B" },
  "Chanadal": { rating: "B", carbon: "A", water: "D", pollution: "B", biodiversity: "B" },
  "Chick Peas": { rating: "B", carbon: "A", water: "D", pollution: "B", biodiversity: "B" },
  "Green Lentils": { rating: "A", carbon: "A", water: "A", pollution: "A+", biodiversity: "A+" },
  "Mung Dal Yellow": { rating: "B", carbon: "A", water: "C", pollution: "C", biodiversity: "E" },
  "Red Kidney Beans": { rating: "B", carbon: "A", water: "D", pollution: "A", biodiversity: "B" },
  "Red Lentils": { rating: "A", carbon: "A", water: "A*", pollution: "A*", biodiversity: "A" },
  "Toor Dal Oily": { rating: "B", carbon: "A", water: "A+", pollution: "B", biodiversity: "D" },
  "Toor Dal Plain": { rating: "B", carbon: "A", water: "A+", pollution: "B", biodiversity: "D" },
  "Urid Dal White": { rating: "B", carbon: "A", water: "A", pollution: "C", biodiversity: "E" },
  "Yellow Split Peas": { rating: "A", carbon: "A", water: "C", pollution: "A", biodiversity: "A+" },
}

function findEcoRating(title) {
  return ECO_RATINGS[title] || null
}

function allergensForType(natcoType, title) {
  const all = []
  all.push("cross-contamination: gluten, soya, milk, nuts, peanuts, sesame, mustard, celery, sulphites")
  const tt = title.toLowerCase()
  if (tt.includes("wheat") || tt.includes("atta") || tt.includes("maida")) all.push("gluten")
  if (tt.includes("peanut") || tt.includes("groundnut")) all.push("peanuts")
  if (tt.includes("soya")) all.push("soya")
  if (tt.includes("milk") || tt.includes("cream") || tt.includes("butter") || tt.includes("ghee")) all.push("milk")
  if (tt.includes("coconut")) all.push("tree-nuts")
  if (tt.includes("almond") || tt.includes("cashew") || tt.includes("pistachio") || tt.includes("walnut")) all.push("tree-nuts")
  if (tt.includes("bhel puri")) { all.push("gluten"); all.push("peanuts") }
  return [...new Set(all)]
}

async function login() {
  const res = await fetch(BASE + "/auth/user/emailpass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  const d = await res.json()
  return { Authorization: "Bearer " + d.token, "Content-Type": "application/json" }
}

async function main() {
  const headers = await login()
  console.log("Enrichment Engine\n")

  const csvFiles = readdirSync(DATA_DIR).filter(f => f.endsWith("-master.csv"))
  if (!csvFiles.length) { console.log("No CSVs in data-design/"); return }
  console.log(csvFiles.length + " CSV files found\n")

  // Read all CSVs
  const enrichMap = {}
  const tagCounts = {}
  for (const file of csvFiles) {
    const csv = readFileSync(resolve(DATA_DIR, file), "utf-8")
    const lines = csv.trim().split("\n")
    const hdrs = lines[0].split(",")
    const ti = hdrs.indexOf("title")
    const gi = hdrs.indexOf("tags")
    const yi = hdrs.indexOf("natco_type")
    const ci = hdrs.indexOf("natco_subcategory")
    if (ti < 0) continue
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",")
      const title = (cols[ti] || "").trim()
      if (!title) continue
      if (!enrichMap[title]) enrichMap[title] = { tags: [], natcoType: "", natcoCat: "" }
      if (gi >= 0 && cols[gi]) {
        const tags = cols[gi].replace(/"/g, "").split(";").map(t => t.trim()).filter(Boolean)
        for (const t of tags) { if (!enrichMap[title].tags.includes(t)) enrichMap[title].tags.push(t) }
      }
      if (yi >= 0 && !enrichMap[title].natcoType) enrichMap[title].natcoType = (cols[yi] || "").trim()
      if (ci >= 0 && !enrichMap[title].natcoCat) enrichMap[title].natcoCat = (cols[ci] || "").trim()
    }
  }
  console.log(Object.keys(enrichMap).length + " products in enrichment map\n")

  // Fetch all Medusa products
  console.log("Fetching Medusa products...")
  const allP = []
  let off = 0
  while (true) {
    const r = await fetch(BASE + "/admin/products?limit=100&offset=" + off + "&fields=id,title,handle,tags.value,metadata,categories.handle", { headers })
    const d = await r.json()
    if (!d.products || !d.products.length) break
    allP.push(...d.products)
    off += 100
  }
  console.log(allP.length + " products in DB")

  // Build plan
  const plans = []
  let totalTags = 0
  for (const prod of allP) {
    const enr = enrichMap[prod.title]
    if (!enr) continue
    const oldTags = (prod.tags || []).map(t => t.value)
    const newTags = enr.tags.filter(t => !oldTags.includes(t))
    const diet = dietForType(enr.natcoType)
    const aller = allergensForType(enr.natcoType, prod.title)
    const eco = findEcoRating(prod.title)
    if (newTags.length > 0 || diet.length > 0 || eco || enr.natcoCat) {
      plans.push({ id: prod.id, title: prod.title, newTags, diet, aller, eco, catHandle: enr.natcoCat })
      totalTags += newTags.length
    }
  }

  console.log(plans.length + " products to enrich (" + totalTags + " new tags total)\n")

  if (!APPLY) {
    console.log("DRY RUN — first 15:\n")
    for (const p of plans.slice(0, 15)) {
      console.log("  " + p.title)
      if (p.newTags.length) console.log("    +tags: " + p.newTags.slice(0, 6).join(", ") + (p.newTags.length > 6 ? " (+" + (p.newTags.length - 6) + " more)" : ""))
      if (p.diet.length) console.log("    +dietary: " + p.diet.join(", "))
      if (p.aller.length > 1) console.log("    +allergens: " + p.aller.slice(0, 2).join(", "))
      if (p.eco) console.log("    +eco: " + p.eco.rating)
    }
    console.log("\nRun with --apply to update " + plans.length + " products")
    return
  }

  // Apply
  console.log("Applying...")
  let upd = 0
  for (const plan of plans) {
    const pr = await fetch(BASE + "/admin/products/" + plan.id + "?fields=metadata,tags", { headers })
    const pd = await pr.json()
    const curMeta = pd.product?.metadata || {}
    const curTags = (pd.product?.tags || []).map(t => t.value)

    const payload = {
      tags: [...new Set([...curTags, ...plan.newTags])].map(v => ({ value: v })),
      metadata: {
        ...curMeta,
        dietary_flags: plan.diet.filter(f => VALID_DIETARY.includes(f)),
        allergens: plan.aller.filter(a => UK14_ALLERGENS.includes(a)),
      }
    }
    if (plan.eco) {
      payload.metadata.eco_rating = plan.eco.rating
      payload.metadata.eco_carbon = plan.eco.carbon
      payload.metadata.eco_water = plan.eco.water
      payload.metadata.eco_pollution = plan.eco.pollution
      payload.metadata.eco_biodiversity = plan.eco.biodiversity
    }
    try {
      const r = await fetch(BASE + "/admin/products/" + plan.id, { method: "POST", headers, body: JSON.stringify(payload) })
      if (r.ok) { upd++; if (upd % 25 === 0) console.log("  " + upd + "/" + plans.length) }
      else { const t = await r.text(); console.log("  FAIL: " + plan.title + " — " + t.slice(0, 80)) }
    } catch (e) { console.log("  ERROR: " + plan.title + " — " + e.message) }
  }
  console.log("\nDone: " + upd + " enriched")
  console.log("Run: cd apps/meilisearch && npm run reindex")
}

main().catch(console.error)
