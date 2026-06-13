/**
 * Minimum Viable Catalogue — Pipeline Orchestrator
 *
 * Runs all MVC enrichment steps in order:
 *   1. Generate descriptions for products missing them
 *   2. Apply CSV tags + dietary + allergens to Natco products
 *   3. Build minimal enrichment for TRS products
 *   4. Populate per-product synonyms
 *   5. Reindex MeiliSearch
 *   6. Generate pseudo-query tags
 *
 * Usage:
 *   node scripts/mvc/pipeline.mjs              # Dry run — audit only
 *   node scripts/mvc/pipeline.mjs --apply      # Apply all enrichment
 *   node scripts/mvc/pipeline.mjs --step desc  # Run specific step
 */

import { readdirSync, readFileSync, existsSync, mkdirSync } from "fs"
import { resolve, dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..", "..")
const BASE = "http://127.0.0.1:9000"
const MEILI = "http://localhost:7700"
const DATA_DESIGN = resolve(ROOT, "data-design")
const APPLY = process.argv.includes("--apply")
const STEP = process.argv.includes("--step") ? process.argv[process.argv.indexOf("--step") + 1] : null

let stats = { descriptions: 0, tags: 0, dietary: 0, allergens: 0, synonyms: 0, trs: 0 }

// ═══════════════════════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

async function login() {
  const res = await fetch(BASE + "/auth/user/emailpass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: "Bearer " + (await res.json()).token, "Content-Type": "application/json" }
}

async function fetchAllProducts(headers) {
  const prods = []
  let off = 0
  while (true) {
    const r = await (await fetch(BASE + "/admin/products?limit=100&offset=" + off + "&fields=*variants,*categories,*tags,*metadata", { headers })).json()
    if (!r.products?.length) break
    prods.push(...r.products)
    off += 100
  }
  return prods
}

function log(icon, message) {
  console.log("  " + icon + " " + message)
}

function heading(text) {
  console.log("\n━ " + text + " ━".padEnd(60, "━"))
}

// ═══════════════════════════════════════════════════════════════════
//  STEP 1: GENERATE DESCRIPTIONS
// ═══════════════════════════════════════════════════════════════════

const CATEGORY_DESC = {
  "spices-herbs": "Premium whole and ground spice from Natco Foods. Essential for authentic Indian cooking.",
  "spice-herb-jars": "Convenient jar-packaged spice from Natco Foods. Ready to use, resealable for freshness.",
  "spice-blends-mixes": "Expertly blended masala mix from Natco Foods. Perfect balance of spices for traditional dishes.",
  "food-colourings-essences": "Food-grade colouring and flavouring essence from Natco Foods. Ideal for baking and desserts.",
  "rice-quinoa": "High-quality rice from Natco Foods. A pantry essential for everyday meals.",
  "flour-milk-powder": "Stone-ground flour from Natco Foods. Perfect for Indian breads, batters, and baking.",
  "dried-lentils-beans-peas": "Premium dried pulses from Natco Foods. Rich in protein, essential for Indian dal and curries.",
  "tinned-lentils-beans": "Ready-to-eat tinned pulses from Natco Foods. Convenient, no soaking required.",
  "tinned-vegetables": "Preserved vegetables from Natco Foods. Harvested at peak freshness.",
  "tinned-coconut": "Creamy coconut products from Natco Foods. Authentic taste for curries and desserts.",
  "tinned-fruit": "Sweet Alphonso mango products from Natco Foods. Taste of Indian summer all year round.",
  "raw-nuts": "Premium nuts from Natco Foods. Perfect for snacking, cooking, and baking.",
  "seeds": "Nutritious seeds from Natco Foods. Great for healthy meals and baking.",
  "coconut-products": "Natural coconut products from Natco Foods. Versatile for cooking and baking.",
  "dried-fruit": "Naturally sweet dried fruit from Natco Foods. Perfect for snacking and baking.",
  "pappadoms": "Crispy Indian pappadoms from Natco Foods. Quick to prepare, perfect with chutneys.",
  "chutneys-pickles-sauces": "Authentic Indian chutney and pickle from Natco Foods. Adds zest to any meal.",
  "namkeen-lentil-snacks": "Traditional Indian savoury snacks from Natco Foods. Perfect tea-time treats.",
  "flavoured-nuts-snacks": "Roasted and seasoned nuts from Natco Foods. Delicious and satisfying snacks.",
  "ghee-oils": "Pure cooking oil from Natco Foods. Essential for Indian cooking and frying.",
  "all-essentials": "Kitchen essential from Natco Foods. A must-have for your pantry.",
  "teas-drinks": "Refreshing drink from Natco Foods. Authentic Indian taste.",
  "vegetables": "Crispy fried onions from Natco Foods. Ready to use for biryani and garnishing.",
  "corn": "Premium popping corn from Natco Foods. Perfect for movie nights and snacking.",
  "sugar": "Natural sugar from Natco Foods. Essential for Indian sweets and daily use.",
  "soya-products": "Protein-rich soya from Natco Foods. Versatile meat alternative for curries and snacks.",
  "wheat-grains-couscous": "Fine couscous and wheat products from Natco Foods. Quick and versatile.",
  "flours": "Speciality flour from Natco Foods. Essential for Indian cooking.",
}

const TRS_CATEGORY_DESC = {
  "spices-herbs": "Premium spice from TRS Foods. Sourced for authentic taste and freshness.",
  "spice-blends-mixes": "Expertly blended masala from TRS Foods. Ready to use for traditional curries.",
  "dried-lentils-beans-peas": "High-quality pulse from TRS Foods. Perfect for dal, curries, and soups.",
  "rice-quinoa": "Fine ground rice from TRS Foods. Versatile for cooking and baking.",
  "flours": "Speciality flour from TRS Foods. Essential for Indian cooking and baking.",
  "corn": "Premium popcorn from TRS Foods. Light and fluffy when popped.",
  "seeds": "Speciality pearl from TRS Foods. Versatile for desserts and cooking.",
  "coconut-products": "Fine desiccated coconut from TRS Foods. Essential for Indian sweets and curries.",
  "all-essentials": "Kitchen paste from TRS Foods. Convenient, ready-to-use for cooking.",
}

function generateDescription(product) {
  const title = product.title
  const cats = product.categories || []
  const catHandle = cats[0]?.handle || ""
  const isTrs = title.startsWith("TRS")

  // Extract weight from variant
  const variants = product.variants || []
  const vTitle = variants[0]?.title || ""
  const weightStr = vTitle !== "Default" ? vTitle : ""

  let desc
  if (isTrs) {
    desc = TRS_CATEGORY_DESC[catHandle] || "Quality product from TRS Foods. Sourced for authentic Indian cooking."
  } else {
    desc = CATEGORY_DESC[catHandle] || "Authentic Indian grocery from Natco Foods. Premium quality for your kitchen."
  }

  if (weightStr) desc += " Available in " + weightStr + "."
  return desc
}

// ═══════════════════════════════════════════════════════════════════
//  STEP 2: APPLY CSV TAGS TO NATCO PRODUCTS
// ═══════════════════════════════════════════════════════════════════

function loadCsvEnrichmentMap() {
  const csvFiles = readdirSync(DATA_DESIGN).filter(f => f.endsWith("-master.csv"))
  const map = new Map()

  for (const f of csvFiles) {
    const content = readFileSync(join(DATA_DESIGN, f), "utf-8")
    const lines = content.split("\n").slice(1).filter(l => l.trim())
    for (const line of lines) {
      const parts = []
      let current = ""
      let inQuotes = false
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; continue }
        if (ch === "," && !inQuotes) { parts.push(current.trim()); current = ""; continue }
        current += ch
      }
      parts.push(current.trim())

      const rawTitle = parts[1] || ""
      const tagStr = parts[5] || ""
      if (!rawTitle || !tagStr) continue

      // Normalize title for matching
      const normalizedTitle = rawTitle.replace(/&amp;/g, "&").replace(/&apos;/g, "'")

      const tags = [...new Set(tagStr.split(";").map(t => t.trim().toLowerCase()).filter(Boolean))]
      map.set(normalizedTitle, { tags, natco_type: parts[3], natco_subcategory: parts[4] })
    }
  }
  return map
}

// ═══════════════════════════════════════════════════════════════════
//  TAG MANAGEMENT (Medusa v2 requires creating tags first)
// ═══════════════════════════════════════════════════════════════════

async function ensureTagsExist(headers, allTagsNeeded) {
  // Fetch existing tags
  const existingTags = new Map() // value → id
  let off = 0
  while (true) {
    const r = await (await fetch(BASE + "/admin/product-tags?limit=100&offset=" + off, { headers })).json()
    if (!r.product_tags?.length) break
    for (const t of r.product_tags) existingTags.set(t.value, t.id)
    off += 100
  }
  log("✓", "Existing tags: " + existingTags.size)

  // Create missing tags
  const missing = [...allTagsNeeded].filter(t => !existingTags.has(t))
  log("→", "Tags to create: " + missing.length)

  if (APPLY && missing.length > 0) {
    let created = 0
    for (const tagValue of missing) {
      try {
        const res = await fetch(BASE + "/admin/product-tags", {
          method: "POST", headers,
          body: JSON.stringify({ value: tagValue }),
        })
        if (res.ok) {
          const j = await res.json()
          existingTags.set(tagValue, j.product_tag.id)
          created++
          if (created % 100 === 0) log("·", created + "/" + missing.length + " tags created")
        }
      } catch (e) { /* skip */ }
    }
    log("✓", created + " tags created")
  }

  return existingTags // value → id map
}

async function enrichProduct(headers, product, enrichment, tagIdMap) {
  const existingMeta = product.metadata || {}

  // Build tag IDs from tag values
  const tagIds = []
  for (const tagVal of enrichment.tags || []) {
    const tagId = tagIdMap.get(tagVal)
    if (tagId) tagIds.push({ id: tagId, value: tagVal })
  }

  // Merge metadata: preserve ALL existing fields
  const mergedMeta = { ...existingMeta }
  if (enrichment.dietary && enrichment.dietary.length > 0) mergedMeta.dietary_flags = enrichment.dietary
  if (enrichment.allergens && enrichment.allergens.length > 0) mergedMeta.allergens = enrichment.allergens
  if (enrichment.synonyms !== undefined) mergedMeta.synonyms = enrichment.synonyms

  const body = { metadata: mergedMeta }
  if (tagIds.length > 0) body.tags = tagIds

  try {
    const res = await fetch(BASE + "/admin/products/" + product.id, {
      method: "POST", headers,
      body: JSON.stringify(body),
    })
    if (!res.ok && stats.tags + stats.trs < 5) {
      const errText = await res.text()
      console.error("  FAIL " + product.title + ": " + errText.slice(0, 200))
    }
    return res.ok
  } catch (e) {
    console.error("  ERROR " + product.title + ": " + e.message)
    return false
  }
}

function dietForType(natcoType) {
  const t = (natcoType || "").toLowerCase().replace(/\s+/g, "-")
  const rules = {
    "lentils": ["vegetarian", "vegan", "gluten-free"],
    "beans": ["vegetarian", "vegan", "gluten-free"],
    "peas": ["vegetarian", "vegan", "gluten-free"],
    "rice": ["vegetarian", "vegan", "gluten-free"],
    "flour": ["vegetarian", "vegan"],
    "nuts": ["vegetarian", "vegan", "gluten-free"],
    "seeds": ["vegetarian", "vegan", "gluten-free"],
    "spice": ["vegetarian", "vegan", "gluten-free"],
    "oil": ["vegetarian", "vegan", "gluten-free"],
    "ghee": ["vegetarian", "gluten-free"],
    "sugar": ["vegetarian", "vegan", "gluten-free"],
    "milk-powder": ["vegetarian", "gluten-free"],
    "pickle": ["vegetarian", "vegan", "gluten-free"],
    "chutney": ["vegetarian", "vegan", "gluten-free"],
    "sauce": ["vegetarian", "vegan", "gluten-free"],
    "paste": ["vegetarian", "vegan", "gluten-free"],
    "popcorn": ["vegetarian", "vegan", "gluten-free"],
    "coconut": ["vegetarian", "vegan", "gluten-free"],
    "soya": ["vegetarian", "vegan"],
    "tea": ["vegetarian", "vegan", "gluten-free"],
    "snack": ["vegetarian"],
    "drink": ["vegetarian", "vegan", "gluten-free"],
  }
  for (const [key, flags] of Object.entries(rules)) {
    if (t.includes(key)) return flags
  }
  return ["vegetarian"]
}

function allergensForType(natcoType, title) {
  const t = (title || "").toLowerCase()
  const allergens = []
  if (/wheat|atta|maida|chapati|gram flour|semolina|couscous|vermic/i.test(t)) allergens.push("gluten")
  if (/soya/i.test(t)) allergens.push("soya")
  if (/milk|ghee|paneer|butter/i.test(t)) allergens.push("milk")
  if (/nut|almond|cashew|pistachio|walnut|pecan|peanut|monkey|pine nut/i.test(t)) allergens.push("tree-nuts")
  if (/peanut|groundnut/i.test(t)) allergens.push("peanuts")
  if (/sesame|til/i.test(t)) allergens.push("sesame")
  if (/mustard|sarson/i.test(t)) allergens.push("mustard")
  return allergens
}

function generateTagsFromTitle(title) {
  // Generate basic tags from product title words for TRS products
  const t = title.toLowerCase().replace(/^trs\s*/i, "")
  const words = t.replace(/[()]/g, "").split(/\s+/)
  const stopWords = new Set(["trs", "natco", "-", "for", "and", "the", "of", "in", "on", "a", "an", "with"])
  const tags = words.filter(w => w.length > 2 && !stopWords.has(w) && !/^\d/.test(w))
  return [...new Set(tags)]
}

// ═══════════════════════════════════════════════════════════════════
//  STEP 3: PER-PRODUCT SYNONYMS
// ═══════════════════════════════════════════════════════════════════

const SYNONYM_INFERENCE = {
  besan: ["gram flour", "chickpea flour", "chana flour"],
  semolina: ["sooji", "rava", "suji", "cream of wheat"],
  cumin: ["jeera", "zeera"],
  turmeric: ["haldi"],
  coriander: ["dhania", "dhana"],
  fenugreek: ["methi"],
  fennel: ["saunf"],
  asafoetida: ["hing", "heeng"],
  tamarind: ["imli"],
  jaggery: ["gur", "gud", "goor"],
  ghee: ["clarified butter", "desi ghee"],
  chickpea: ["chana", "chole", "garbanzo", "gram"],
  mung: ["moong", "green gram"],
  toor: ["arhar", "pigeon pea"],
  urid: ["urad", "black gram"],
  kidney: ["rajma"],
  pappadom: ["papad", "poppadom", "papadum"],
  popcorn: ["pop corn", "popping corn"],
  coconut: ["nariyal", "naariyal"],
  almond: ["badam"],
  cashew: ["kaju", "cajew"],
  pistachio: ["pista"],
  rice: ["chawal", "bhat"],
  atta: ["chapati flour", "whole wheat flour"],
  chilli: ["mirch", "mirchi", "lal mirch"],
  cardamom: ["elaichi", "elachi"],
  cinnamon: ["dalchini"],
  clove: ["lavang", "laung"],
  pepper: ["kali mirch"],
  mustard: ["sarson", "rai"],
  nutmeg: ["jaiphal"],
  saffron: ["kesar"],
  mango: ["aam", "amchoor"],
  pickle: ["achar"],
  chutney: ["chatni"],
  sugar: ["cheeni", "shakkar"],
  salt: ["namak"],
  tea: ["chai", "masala chai"],
}

function inferSynonyms(title) {
  const t = title.toLowerCase()
  const found = []
  for (const [keyword, syns] of Object.entries(SYNONYM_INFERENCE)) {
    if (t.includes(keyword)) found.push(...syns)
  }
  return [...new Set(found)]
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN PIPELINE
// ═══════════════════════════════════════════════════════════════════

async function main() {
  heading("MVC Pipeline — " + (APPLY ? "APPLY MODE" : "DRY RUN"))
  console.log("Use --apply to write changes to Medusa")
  console.log("")

  const headers = await login()
  const products = await fetchAllProducts(headers)
  console.log("Products: " + products.length)

  // ═══ STEP 1: Descriptions ═══
  if (!STEP || STEP === "desc") {
    heading("Step 1: Generate Descriptions")
    const missing = products.filter(p => !p.description)
    console.log(missing.length + " products missing descriptions")

    for (const p of missing.slice(0, 5)) {
      const desc = generateDescription(p)
      console.log("  " + p.title + " → \"" + desc + "\"")
    }
    if (missing.length > 5) console.log("  ... and " + (missing.length - 5) + " more")

    if (APPLY) {
      let done = 0
      for (const p of missing) {
        const desc = generateDescription(p)
        try {
          const res = await fetch(BASE + "/admin/products/" + p.id, {
            method: "POST", headers,
            body: JSON.stringify({ description: desc }),
          })
          if (res.ok) { done++; if (done % 50 === 0) console.log("  " + done + "/" + missing.length) }
        } catch (e) { /* skip */ }
      }
      stats.descriptions = done
      console.log("  Generated: " + done + " descriptions")
    }
  }

  // ═══ STEP 2: CSV Enrichment (Natco tags + dietary + allergens) ═══
  if (!STEP || STEP === "tags") {
    heading("Step 2: Apply CSV Tags + Dietary + Allergens (Natco)")
    const csvMap = loadCsvEnrichmentMap()
    log("✓", "CSV enrichment data: " + csvMap.size + " products")

    let matched = 0
    const allTagsNeeded = new Set()
    const toApply = []
    for (const p of products) {
      if (!p.title.startsWith("Natco")) continue
      // Strip brand prefix, normalize HTML entities
      let rawTitle = p.title.replace(/^Natco\s*-\s*/, "")
      rawTitle = rawTitle.replace(/&amp;/g, "&").replace(/&apos;/g, "'")
      const csvData = csvMap.get(rawTitle)
      if (!csvData) continue
      matched++

      const tags = csvData.tags
      const dietary = dietForType(csvData.natco_type)
      const allergens = allergensForType(csvData.natco_type, p.title)
      const synonyms = inferSynonyms(p.title)
      tags.forEach(t => allTagsNeeded.add(t))

      toApply.push({ product: p, tags, dietary, allergens, synonyms })
    }
    log("✓", "Matched: " + matched + " / " + products.filter(p => p.title.startsWith("Natco")).length + " Natco products")
    log("→", "Unique tags needed: " + allTagsNeeded.size)

    // Create all tags first
    const tagIdMap = await ensureTagsExist(headers, allTagsNeeded)

    // Then enrich products
    if (APPLY) {
      let done = 0
      for (const item of toApply) {
        const ok = await enrichProduct(headers, item.product, item, tagIdMap)
        if (ok) { done++; if (done % 50 === 0) log("·", done + "/" + toApply.length) }
      }
      stats.tags = done
      stats.dietary = done
      stats.allergens = done
      stats.synonyms = done
      log("✓", "Enriched: " + done + " products")
    }
  }

  // ═══ STEP 3: TRS Minimal Enrichment ═══
  if (!STEP || STEP === "trs") {
    heading("Step 3: Minimal Enrichment (TRS)")
    const trsProducts = products.filter(p => p.title.startsWith("TRS"))
    log("✓", trsProducts.length + " TRS products")

    const trsTagsNeeded = new Set()
    const trsToApply = []
    for (const p of trsProducts) {
      const tags = generateTagsFromTitle(p.title)
      const dietary = ["vegetarian"]
      const allergens = allergensForType("", p.title)
      const synonyms = inferSynonyms(p.title)
      tags.forEach(t => trsTagsNeeded.add(t))

      trsToApply.push({ product: p, tags, dietary, allergens, synonyms })
    }
    log("→", "Unique TRS tags needed: " + trsTagsNeeded.size)

    const trsTagIdMap = await ensureTagsExist(headers, trsTagsNeeded)

    if (APPLY) {
      let done = 0
      for (const item of trsToApply) {
        const ok = await enrichProduct(headers, item.product, item, trsTagIdMap)
        if (ok) done++
      }
      stats.trs = done
      log("✓", "Enriched: " + done + " TRS products")
    }
  }

  // ═══ STEP 4: Descriptions for TRS ═══
  if (!STEP || STEP === "trs-desc") {
    const trsProducts = products.filter(p => p.title.startsWith("TRS") && !p.description)
    if (trsProducts.length > 0 && APPLY) {
      let done = 0
      for (const p of trsProducts) {
        const desc = generateDescription(p)
        try {
          const res = await fetch(BASE + "/admin/products/" + p.id, {
            method: "POST", headers,
            body: JSON.stringify({ description: desc }),
          })
          if (res.ok) done++
        } catch (e) { /* skip */ }
      }
      console.log("  TRS descriptions: " + done)
    }
  }

  // ═══ SUMMARY ═══
  heading("Summary")
  if (APPLY) {
    console.log("  Descriptions: " + (stats.descriptions || "N/A"))
    console.log("  CSV enrichment: " + (stats.tags || "N/A"))
    console.log("  TRS enrichment: " + (stats.trs || "N/A"))
  } else {
    console.log("  Dry run — run with --apply to apply changes")
  }
  console.log("  Next: cd apps/meilisearch && npm run reindex")
}

main().catch(console.error)
