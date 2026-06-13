/**
 * Assign products to LEAF subcategories (not parent categories).
 *
 * Phase 1: Generates a JSON mapping file for review.
 * Phase 2: Uploads mapping to Medusa DB (run with --apply flag).
 *
 * Usage:
 *   node src/seed/assign-categories-to-children.mjs              # generate JSON for review
 *   node src/seed/assign-categories-to-children.mjs --apply      # upload to DB
 */

import { writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "http://127.0.0.1:9000"
const OUTPUT_PATH = resolve(__dirname, "category-assignment-review.json")
const APPLY = process.argv.includes("--apply")

// ─── CHILD SUBCATEGORY HANDLES (from initial-data-seed.ts) ───

const STAINS_GRAINS = {
  basmati:                "basmati-rice",
  "sona masoori":         "sona-masoori-rice",
  "sona masuri":          "sona-masoori-rice",
  "idli rice":            "idli-rice",
  "brown rice":           "brown-rice",
  poha:                   "poha-flattened-rice",
  "flattened rice":       "poha-flattened-rice",
  "powa medium":          "poha-flattened-rice",
  "powa ":                "poha-flattened-rice",
  semolina:               "semolina-sooji-rava",
  sooji:                  "semolina-sooji-rava",
  suji:                   "semolina-sooji-rava",
  rava:                   "semolina-sooji-rava",
  couscous:               "semolina-sooji-rava",
  // Fallback: products with "rice" or "grain" but no specific keyword → staples-grains parent
}

const ATTA_FLOURS = {
  "chapatti":              "chapatti-flour-atta",
  "chapati":               "chapatti-flour-atta",
  "chakki atta":           "chapatti-flour-atta",
  atta:                    "chapatti-flour-atta",
  besan:                   "besan-gram-flour",
  "gram flour":            "besan-gram-flour",
  maida:                   "plain-flour-maida",
  "plain flour":           "plain-flour-maida",
  "rice flour":            "rice-flour",
  "ground rice":           "rice-flour",
  ragi:                    "ragi-finger-millet-flour",
  "finger millet":         "ragi-finger-millet-flour",
  "millet flour":          "ragi-finger-millet-flour",
  "bajri":                 "ragi-finger-millet-flour",
  "bajra":                 "ragi-finger-millet-flour",
  "coarse semolina":       "suji-coarse-semolina",
  "extra coarse":          "suji-coarse-semolina",
  // cornmeal/corn meal → check: is it flour type or grain?
}

const DAL_LENTILS = {
  toor:                    "toor-dal",
  toovar:                  "toor-dal",
  "chana dal":             "chana-dal",
  chanadal:                "chana-dal",
  "moong dal":             "moong-dal-yellow",
  "mung dal yellow":       "moong-dal-yellow",
  "mung dal":              "moong-dal-yellow",
  "mung split":            "moong-dal-yellow",
  "mung beans":            "whole-moong-green",
  "whole moong":           "whole-moong-green",
  "green lentils":         "whole-moong-green",
  masoor:                  "masoor-dal-red-lentils",
  "red lentils":           "masoor-dal-red-lentils",
  "brown lentils":         "masoor-dal-red-lentils",
  "urad dal":              "urad-dal-split",
  "whole urad":            "whole-urad-black",
  rajma:                   "rajma-kidney-beans",
  "kidney beans":          "rajma-kidney-beans",
  "red kidney":            "rajma-kidney-beans",
  "white kidney":          "rajma-kidney-beans",
  chana:                   "chana-whole-chickpeas",
  chickpea:                "chana-whole-chickpeas",
  "chick pea":             "chana-whole-chickpeas",
  "kala chana":            "kala-chana-black-chickpeas",
  "black chana":           "kala-chana-black-chickpeas",
  "black eye":             "lobhia-black-eye-beans",
  "black eyed":            "lobhia-black-eye-beans",
  lobhia:                  "lobhia-black-eye-beans",
  soya:                    "dal-lentils",          // soya chunks → dal-lentils parent
  "butter bean":           "chana-whole-chickpeas",
  "rose coco":             "chana-whole-chickpeas",
  alubia:                  "chana-whole-chickpeas",
  "pinto":                 "chana-whole-chickpeas",
  "flageolet":             "chana-whole-chickpeas",
  "cannellini":            "chana-whole-chickpeas",
  "black turtle":          "kala-chana-black-chickpeas",
}

const OILS_GHEE = {
  "sunflower oil":         "sunflower-oil",
  "mustard oil":           "mustard-oil",
  "vegetable oil":         "vegetable-refined-oil",
  "refined oil":           "vegetable-refined-oil",
  "coconut oil":           "coconut-oil",
  "parachute":             "coconut-oil",
  "groundnut oil":         "groundnut-peanut-oil",
  "peanut oil":            "groundnut-peanut-oil",
  "sesame oil":            "groundnut-peanut-oil",
  "olive oil":             "vegetable-refined-oil",
  "pomace olive":          "vegetable-refined-oil",
  "almond oil":            "vegetable-refined-oil",
  "castor oil":            "vegetable-refined-oil",
  "linseed oil":           "vegetable-refined-oil",
  ghee:                    "ghee-clarified-butter",
  "clarified butter":      "ghee-clarified-butter",
}

const SPICES_WHOLE = {
  "cumin seed":            "cumin-seeds-jeera",
  "jeera seed":            "cumin-seeds-jeera",
  "mustard seed":          "mustard-seeds-rai",
  "coriander seed":        "coriander-seeds-dhania",
  "dhania seed":           "coriander-seeds-dhania",
  "fenugreek seed":        "fenugreek-seeds-methi",
  "methi seed":            "fenugreek-seeds-methi",
  "fennel seed":           "fennel-seeds-saunf",
  saunf:                   "fennel-seeds-saunf",
  "carom seed":            "carom-seeds-ajwain",
  ajwain:                  "carom-seeds-ajwain",
  ajwan:                   "carom-seeds-ajwain",
  "bay leaf":              "bay-leaves-tej-patta",
  "tej patta":             "bay-leaves-tej-patta",
  "green cardamom":        "green-cardamom-elaichi",
  elaichi:                 "green-cardamom-elaichi",
  "cardamom green":        "green-cardamom-elaichi",
  "black cardamom":        "black-cardamom",
  clove:                   "cloves-laung",
  laung:                   "cloves-laung",
  "cinnamon stick":        "cinnamon-sticks-dalchini",
  dalchini:                "cinnamon-sticks-dalchini",
  cassia:                  "cinnamon-sticks-dalchini",
  "black pepper":          "black-pepper-kali-mirch",
  "kali mirch":            "black-pepper-kali-mirch",
  asafoetida:              "asafoetida-hing",
  hing:                    "asafoetida-hing",
  "dried red chilli":      "dried-red-chillies",
  "whole birdseye chilli": "dried-red-chillies",
  "star anise":            "star-anise",
  aniseed:                 "star-anise",
  "panch phoron":          "panch-phoron",
  nutmeg:                  "nutmeg-jaiphal",
  jaiphal:                 "nutmeg-jaiphal",
}

const SPICES_GROUND = {
  "turmeric powder":       "turmeric-powder-haldi",
  "haldi powder":          "turmeric-powder-haldi",
  haldi:                   "turmeric-powder-haldi",
  turmeric:                "turmeric-powder-haldi",
  "red chilli powder":     "red-chilli-powder-mirchi",
  "chilli powder hot":     "red-chilli-powder-mirchi",
  "chilli powder":         "red-chilli-powder-mirchi",
  mirchi:                  "red-chilli-powder-mirchi",
  "coriander powder":      "coriander-powder-dhania",
  "coriander ground":      "coriander-powder-dhania",
  "dhania powder":          "coriander-powder-dhania",
  "cumin powder":           "cumin-powder-jeera",
  "jeera powder":           "cumin-powder-jeera",
  "black pepper powder":    "black-pepper-powder",
  "ginger powder":          "ginger-powder-sonth",
  sonth:                    "ginger-powder-sonth",
  "kashmiri chilli":        "kashmiri-chilli-powder",
  amchur:                   "amchur-mango-powder",
  amchoor:                  "amchur-mango-powder",
  "mango powder":           "amchur-mango-powder",
  "kasuri methi":           "kasuri-methi-dried-fenugreek-leaves",
  "dried fenugreek":        "kasuri-methi-dried-fenugreek-leaves",
  paprika:                  "red-chilli-powder-mirchi",
  "food colour":            "spices-ground",     // food colouring → spices-ground parent
  "food colouring":         "spices-ground",
  flavouring:               "spices-ground",
  essence:                  "spices-ground",
  "rosemary jar":           "spices-ground",     // herb jars → spices-ground parent
  "basil jar":              "spices-ground",
  "coriander leaves jar":   "spices-ground",
  "marjoram jar":           "spices-ground",
  "mint jar":               "spices-ground",
  "mixed herbs jar":        "spices-ground",
  "oregano jar":            "spices-ground",
  "parsley jar":            "spices-ground",
  "sage jar":               "spices-ground",
  "dried tarragon":         "spices-ground",
}

const SPICE_BLENDS = {
  "garam masala":           "garam-masala",
  "chaat masala":           "chaat-masala",
  "chat masala":            "chaat-masala",
  "chana masala":           "chole-chana-masala",
  "chole masala":           "chole-chana-masala",
  "rajma masala":           "rajma-masala",
  "biryani masala":         "biryani-masala",
  "sambar powder":          "sambar-powder",
  "sambhar masala":         "sambar-powder",
  "rasam powder":           "rasam-powder",
  "pav bhaji":              "pav-bhaji-masala",
  pavbhaji:                 "pav-bhaji-masala",
  "kitchen king":           "kitchen-king-masala",
  "tandoori masala":        "tandoori-masala",
  "meat masala":            "meat-masala",
  "fish masala":            "fish-curry-masala",
  "fish curry masala":      "fish-curry-masala",
  "chicken masala":         "chicken-masala",
  "paneer masala":          "paneer-masala",
  "pulao masala":           "pulao-masala",
  "all purpose seasoning":  "garam-masala",
  "anardana powder":        "chole-chana-masala",
  "pickle masala":          "spice-blends",   // pickle masala → spice-blends parent
  "mixed masala whole":     "spice-blends",
}

const DAIRY = {
  paneer:                   "paneer",
  "set yoghurt":            "set-yoghurt-dahi",
  dahi:                     "set-yoghurt-dahi",
  curd:                     "set-yoghurt-dahi",
  yoghurt:                  "set-yoghurt-dahi",
  yogurt:                   "set-yoghurt-dahi",
  "butter salted":          "butter-salted",
  "salted butter":          "butter-salted",
  "butter unsalted":        "butter-unsalted",
  "unsalted butter":        "butter-unsalted",
  butter:                   "butter-salted",
  "double cream":           "double-cream",
  "single cream":           "single-cream",
  "condensed milk":         "condensed-milk",
  "evaporated milk":        "evaporated-milk",
  "milk powder":            "dairy",      // milk powder → dairy parent
}

const BEVERAGES = {
  "spiced tea":             "loose-leaf-tea-chai",
  "masala tea":             "loose-leaf-tea-chai",
  "tea bag":                "tea-bags",
  tea:                      "tea-bags",
  "filter coffee":          "filter-coffee",
  "instant coffee":         "instant-coffee",
  coffee:                   "instant-coffee",
  horlicks:                 "horlicks",
  bournvita:                "bournvita",
  "rooh afza":              "rooh-afza-rose-syrup",
  "rose water":             "rooh-afza-rose-syrup",
  "rose syrup":             "rooh-afza-rose-syrup",
  "kevda water":            "sherbets-squash",
  sherbet:                  "sherbets-squash",
  squash:                   "sherbets-squash",
  syrup:                    "sherbets-squash",
  drink:                    "sherbets-squash",
  "coconut water":          "sherbets-squash",
  "mango pulp":             "sherbets-squash",
}

const SNACKS_NAMKEEN = {
  bhujia:                   "bhujia",
  "bombay mix":             "mixture-bombay-mix",
  mixture:                  "mixture-bombay-mix",
  sev:                      "sev",
  papad:                    "papad",
  pappadom:                 "papad",
  pappad:                   "papad",
  chivda:                   "chivda",
  "parle g":                "biscuits-parle-g",
  "parle-g":                "biscuits-parle-g",
  parle:                    "biscuits-parle-g",
  "britannia":              "biscuits-cream",
  "good day":               "biscuits-cream",
  oreo:                     "biscuits-cream",
  biscuit:                  "biscuits-cream",
  "roasted peanut":         "roasted-peanuts-chana",
  "roasted monkey":         "roasted-peanuts-chana",
  "roasted salted":         "roasted-peanuts-chana",
  "honey roast":            "roasted-peanuts-chana",
  "salted peanut":          "roasted-peanuts-chana",
  "salted cashew":          "roasted-peanuts-chana",
  "big d":                  "roasted-peanuts-chana",
  popcorn:                  "snacks-namkeen",    // popcorn → snacks parent
  "peanut gachak":          "snacks-namkeen",    // sweet snacks → snacks parent
  "soan papdi":             "snacks-namkeen",
  laddu:                    "snacks-namkeen",
  barfi:                    "snacks-namkeen",
  "daria gotta":            "snacks-namkeen",
  "daria dal":              "snacks-namkeen",
}

const PICKLES_CHUTNEYS = {
  "mango pickle":           "mango-pickle-achar",
  "mango achar":            "mango-pickle-achar",
  "mixed pickle":           "mixed-pickle",
  "lime pickle":            "lime-lemon-pickle",
  "lemon pickle":            "lime-lemon-pickle",
  "green chilli pickle":    "green-chilli-pickle",
  "chilli pickle":          "green-chilli-pickle",
  "garlic pickle":          "garlic-pickle",
  "tamarind paste":         "tamarind-paste-concentrate",
  "tamarind sauce":         "tamarind-paste-concentrate",
  "tamarind date":          "tamarind-paste-concentrate",
  "mango chutney":          "mango-chutney",
  gorkeri:                  "mango-chutney",
  chundo:                   "mango-chutney",
  "tamarind chutney":       "tamarind-chutney",
  "brinjal chutney":        "tamarind-chutney",
  thecha:                   "tamarind-chutney",
  "coriander mint sauce":   "tamarind-chutney",
  "chilli sauce":           "tamarind-chutney",
  "bombay sandwich":        "tamarind-chutney",
}

const CONDIMENTS = {
  "coconut milk":           "coconut-milk",
  "coconut cream":          "coconut-milk",
  "coconut flour":          "coconut-milk",
  "coconut desiccated":     "coconut-milk",
  "coconut flake":          "coconut-milk",
  "coconut halve":          "coconut-milk",
  "coconut milk powder":    "coconut-milk",
  "ginger garlic paste":    "ginger-garlic-paste",
  "garlic paste":           "ginger-garlic-paste",
  "ginger paste":           "ginger-garlic-paste",
  jaggery:                  "jaggery-gur",
  gur:                      "jaggery-gur",
  "sugar candy":            "jaggery-gur",
  sugar:                    "jaggery-gur",
  demerara:                 "jaggery-gur",
  "tomato paste":           "condiments",      // tinned foods → condiments parent
  "tomato puree":           "condiments",
  "tomatoes peeled":        "condiments",
  "tomatoes chopped":       "condiments",
  "spinach puree":          "condiments",
  "spinach leaf":           "condiments",
  "mango slice":            "condiments",
  "mango pulp kesar":       "condiments",
  karela:                   "condiments",
  patra:                    "condiments",
  "lotus root":             "condiments",
  suran:                    "condiments",
  "yam":                    "condiments",
  "sarson ka saag":         "condiments",
  okra:                     "condiments",
  "punjabi tinda":          "condiments",
}

const FRESH = {
  "fresh ginger":           "fresh-ginger",
  ginger:                   "fresh-ginger",
  "curry leaf":             "curry-leaves",
  "green chilli":           "green-chillies",
  "fresh chilli":           "green-chillies",
  "fresh coriander":        "fresh-coriander",
  coriander:                "fresh-coriander",
  "lemon juice":            "condiments",
}

const NUTS_SEEDS = {
  cashew:                   "snacks-namkeen",
  almond:                   "snacks-namkeen",
  "peanut red":             "snacks-namkeen",
  pistachio:                "snacks-namkeen",
  walnut:                   "snacks-namkeen",
  pecan:                    "snacks-namkeen",
  "pine nut":               "snacks-namkeen",
  "golden raisin":          "snacks-namkeen",
  "fruit nut":              "snacks-namkeen",
  "fruit & nut":            "snacks-namkeen",
  "pumpkin seed":           "snacks-namkeen",
  "sunflower seed":         "snacks-namkeen",
  "linseed brown":          "snacks-namkeen",
  "white poppy seed":       "snacks-namkeen",
  "sesame seed":            "snacks-namkeen",
  "black chia seed":        "snacks-namkeen",
  "sagoo seed":             "snacks-namkeen",
  "phool makhana":          "snacks-namkeen",
  makhana:                  "snacks-namkeen",
  "lotus seed":             "snacks-namkeen",
  soya:                     "dal-lentils",
}

// ─── MATCHING LOGIC ───

function findCategory(title) {
  const t = (title || "").toLowerCase()

  // Staples & Grains — specific rice/grain subcategories
  for (const [keyword, handle] of Object.entries(STAINS_GRAINS)) {
    if (t.includes(keyword)) return handle
  }
  // Generic rice/grain → staples-grains (parent)
  if (t.includes("rice") || t.includes("grain") || t.includes("quinoa") || t.includes("sabudana") || t.includes("tapioca"))
    return "staples-grains"
  // Soya chunks/mince → dal-lentils
  if (t.includes("soya chunk") || t.includes("soya mince") || t.includes("soya bean"))
    return "dal-lentils"

  // Atta & Flours
  for (const [keyword, handle] of Object.entries(ATTA_FLOURS)) {
    if (t.includes(keyword)) return handle
  }
  if (t.includes("corn meal") || t.includes("cornmeal") || t.includes("maize meal"))
    return "suji-coarse-semolina"
  if (t.includes("flour")) return "atta-flours"

  // Dal & Lentils
  for (const [keyword, handle] of Object.entries(DAL_LENTILS)) {
    if (t.includes(keyword)) return handle
  }
  if (t.includes("dal") || t.includes("lentil") || t.includes("pulse") || t.includes("gram") && !t.includes("gram flour"))
    return "dal-lentils"

  // Beverages (check before spices — tea/coffee are common)
  for (const [keyword, handle] of Object.entries(BEVERAGES)) {
    if (t.includes(keyword)) return handle
  }

  // Oils & Ghee (check before spices — "oil" is broad)
  for (const [keyword, handle] of Object.entries(OILS_GHEE)) {
    if (t.includes(keyword)) return handle
  }
  if (t.includes(" oil") || t.includes("oil ") || t.match(/\boil\b/)) return "vegetable-refined-oil"

  // Snacks & Namkeen (check before spices)
  for (const [keyword, handle] of Object.entries(SNACKS_NAMKEEN)) {
    if (t.includes(keyword)) return handle
  }
  if (t.includes("namkeen") || t.includes("farsan") || t.includes("kurkure") || t.includes("noodle") || t.includes("fryum") || t.includes("bhel") || t.includes("chakli") || t.includes("murukku") || t.includes("gachak") || t.includes("brittle") || t.includes("sweet") || t.includes("lays"))
    return "snacks-namkeen"

  // Nuts & Seeds
  for (const [keyword, handle] of Object.entries(NUTS_SEEDS)) {
    if (t.includes(keyword)) return handle
  }
  if (t.includes("nut") || t.includes("seed")) return "snacks-namkeen"
  if (t.includes("coconut") && !t.includes("coconut oil") && !t.includes("coconut milk") && !t.includes("coconut cream") && !t.includes("coconut flour"))
    return "snacks-namkeen"

  // Spice Blends
  for (const [keyword, handle] of Object.entries(SPICE_BLENDS)) {
    if (t.includes(keyword)) return handle
  }

  // Spices Ground
  for (const [keyword, handle] of Object.entries(SPICES_GROUND)) {
    if (t.includes(keyword)) return handle
  }

  // Spices Whole
  for (const [keyword, handle] of Object.entries(SPICES_WHOLE)) {
    if (t.includes(keyword)) return handle
  }

  // Dairy
  for (const [keyword, handle] of Object.entries(DAIRY)) {
    if (t.includes(keyword)) return handle
  }
  if (t.includes("cheese") || t.includes("milk")) return "dairy"

  // Pickles & Chutneys
  for (const [keyword, handle] of Object.entries(PICKLES_CHUTNEYS)) {
    if (t.includes(keyword)) return handle
  }
  if (t.includes("pickle") || t.includes("chutney") || t.includes("achar")) return "mango-pickle-achar"

  // Condiments
  for (const [keyword, handle] of Object.entries(CONDIMENTS)) {
    if (t.includes(keyword)) return handle
  }
  if (t.includes("vinegar") || t.includes("ketchup") || t.includes("sauce") || t.includes("paste") || t.includes("salt")) return "condiments"

  // Fresh
  for (const [keyword, handle] of Object.entries(FRESH)) {
    if (t.includes(keyword)) return handle
  }
  if (t.includes("fresh") || t.includes("vegetable") || t.includes("onion") || t.includes("potato") || t.includes("tomato"))
    return "condiments"

  // Frozen
  if (t.includes("frozen") || t.includes("samosa") || t.includes("paratha")) return "frozen"

  // Ready to cook
  if (t.includes("idli mix") || t.includes("dosa mix") || t.includes("dhokla mix") || t.includes("gulab jamun mix")) return "ready-to-cook"

  // Default uncategorized
  return null
}

// ─── MAIN ───

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: `Bearer ${(await res.json()).token}`, "Content-Type": "application/json" }
}

async function main() {
  const headers = await login()
  console.log("Logged into admin\n")

  // Fetch categories for handle→ID mapping
  const { product_categories: allCats } = await (
    await fetch(`${BASE}/admin/product-categories?limit=300`, { headers })
  ).json()
  const catByHandle = {}
  for (const c of allCats) catByHandle[c.handle] = c
  console.log(`Categories loaded: ${Object.keys(catByHandle).length}`)

  // Fetch all products
  console.log("Fetching products...")
  const allProducts = []
  let offset = 0
  while (true) {
    const { products, count } = await fetch(
      `${BASE}/admin/products?limit=100&offset=${offset}&fields=id,title,handle,categories.handle,categories.name`,
      { headers }
    ).then(r => r.json())
    allProducts.push(...(products || []))
    if ((products || []).length < 100) break
    offset += 100
  }
  console.log(`  ${allProducts.length} products`)

  // Match and build mapping
  const mapping = []
  const unmatched = []
  let matched = 0

  for (const product of allProducts) {
    const handle = findCategory(product.title)
    const cat = handle ? catByHandle[handle] : null
    const entry = {
      product_id: product.id,
      product_title: product.title,
      product_handle: product.handle,
      current_categories: (product.categories || []).map(c => c.handle),
      assigned_leaf_category: handle,
      assigned_leaf_category_id: cat?.id || null,
      assigned_leaf_category_name: cat?.name || null,
    }

    if (handle && cat) {
      mapping.push(entry)
      matched++
    } else {
      unmatched.push(entry)
    }
  }

  console.log(`\n${matched} matched, ${unmatched.length} unmatched\n`)

  // Write JSON for review
  const review = {
    _generated: new Date().toISOString(),
    _total_products: allProducts.length,
    _matched: matched,
    _unmatched: unmatched.length,
    _instructions: "Review the assignments. Run with --apply to upload to DB.",
    assigned: mapping.sort((a, b) => (a.assigned_leaf_category || "").localeCompare(b.assigned_leaf_category || "")),
    unmatched: unmatched.sort((a, b) => a.product_title.localeCompare(b.product_title)),
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(review, null, 2))
  console.log(`Review file written: ${OUTPUT_PATH}\n`)

  if (APPLY) {
    // Batch assign products to leaf categories
    const byCategory = {}
    for (const m of mapping) {
      if (!m.assigned_leaf_category_id) continue
      if (!byCategory[m.assigned_leaf_category_id]) byCategory[m.assigned_leaf_category_id] = []
      byCategory[m.assigned_leaf_category_id].push(m.product_id)
    }

    // Build ID→name lookup
    const nameById = {}
    for (const c of allCats) nameById[c.id] = c.name

    let assigned = 0
    let i = 0
    for (const [catId, prodIds] of Object.entries(byCategory)) {
      i++
      const name = nameById[catId] || catId
      // Delay to avoid overwhelming backend + subscriber (MeiliSearch reindex per product)
      await new Promise(r => setTimeout(r, 200))
      try {
        const res = await fetch(`${BASE}/admin/product-categories/${catId}/products`, {
          method: "POST", headers, body: JSON.stringify({ add: prodIds }),
        })
        if (res.ok) {
          assigned += prodIds.length
          console.log(`  ${name}: ${prodIds.length}`)
        } else {
          const e = await res.text()
          console.log(`  ${name}: FAIL — ${e.slice(0, 100)}`)
        }
      } catch (e) {
        // Retry once after a pause
        if (e.cause?.code === "ECONNREFUSED") {
          await new Promise(r => setTimeout(r, 2000))
          try {
            const res = await fetch(`${BASE}/admin/product-categories/${catId}/products`, {
              method: "POST", headers, body: JSON.stringify({ add: prodIds }),
            })
            if (res.ok) {
              assigned += prodIds.length
              console.log(`  ${name}: ${prodIds.length} (retry)`)
            } else {
              const e2 = await res.text()
              console.log(`  ${name}: FAIL — ${e2.slice(0, 100)}`)
            }
          } catch (e2) {
            console.log(`  ${name}: ERROR — ${e2.cause?.message || e2.message}`)
          }
        } else {
          console.log(`  ${name}: ERROR — ${e.cause?.message || e.message}`)
        }
      }
    }
    console.log(`\nDone: ${assigned} assigned`)
  } else {
    console.log("Dry run complete. Review the JSON, then run with --apply to upload.")
  }
}

main().catch(console.error)
