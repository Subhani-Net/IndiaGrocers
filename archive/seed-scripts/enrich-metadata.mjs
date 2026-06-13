/**
 * Metadata Enrichment Script (Plain JS — runs with Node v26+)
 *
 * Populates grocery-specific metadata on all products and variants.
 * Backend must be running on http://127.0.0.1:9000
 *
 * Usage: node src/seed/enrich-metadata.mjs
 */

const BASE = "http://127.0.0.1:9000"

const CATEGORY_DEFAULTS = {
  "staples-grains": {
    vat_rate: 0, velocity: "A", sourcing_tier: "A",
    dietary_flags: ["vegetarian"],
    country_of_origin: "India",
    uk_food_business_operator: "IndiaGrocers Foods Ltd, London",
    subscription_eligible: true,
  },
  "atta-flours": {
    vat_rate: 0, velocity: "A", sourcing_tier: "A",
    dietary_flags: ["vegetarian"],
    allergens: ["gluten"],
    country_of_origin: "India",
    subscription_eligible: true,
  },
  "dal-lentils": {
    vat_rate: 0, velocity: "A", sourcing_tier: "A",
    dietary_flags: ["vegetarian"],
    country_of_origin: "India",
  },
  "oils-ghee": {
    vat_rate: 0, velocity: "A", sourcing_tier: "A",
    dietary_flags: ["vegetarian"],
    country_of_origin: "India",
  },
  "spices-whole": {
    vat_rate: 0, velocity: "B", sourcing_tier: "A",
    dietary_flags: ["vegetarian"],
    country_of_origin: "India",
  },
  "spices-ground": {
    vat_rate: 0, velocity: "B", sourcing_tier: "A",
    dietary_flags: ["vegetarian"],
    country_of_origin: "India",
  },
  "spice-blends": {
    vat_rate: 0, velocity: "B", sourcing_tier: "A",
    dietary_flags: ["vegetarian"],
    country_of_origin: "India",
  },
  "dairy": {
    vat_rate: 0, velocity: "A", sourcing_tier: "B",
    allergens: ["milk"],
    country_of_origin: "United Kingdom",
    requires_fast_delivery: true,
  },
  "beverages": {
    vat_rate: 0, velocity: "A", sourcing_tier: "A",
    country_of_origin: "India",
  },
  "snacks-namkeen": {
    vat_rate: 0.2, velocity: "B", sourcing_tier: "A",
    allergens: ["gluten"],
    country_of_origin: "India",
  },
  "pickles-chutneys": {
    vat_rate: 0, velocity: "B", sourcing_tier: "A",
    dietary_flags: ["vegetarian"],
    country_of_origin: "India",
  },
  "frozen": {
    vat_rate: 0, velocity: "B", sourcing_tier: "D",
    requires_cold_chain: true,
    country_of_origin: "India",
  },
  "fresh": {
    vat_rate: 0, velocity: "A", sourcing_tier: "C",
    dietary_flags: ["vegan"],
    requires_fast_delivery: true,
    country_of_origin: "United Kingdom",
  },
  "ready-to-cook": {
    vat_rate: 0, velocity: "B", sourcing_tier: "A",
    dietary_flags: ["vegetarian"],
    country_of_origin: "India",
  },
  "condiments": {
    vat_rate: 0, velocity: "B", sourcing_tier: "A",
    dietary_flags: ["vegetarian"],
    country_of_origin: "India",
  },
}

const BRAND_PATTERNS = [
  { regex: /aashirvaad/i, slug: "aashirvaad" },
  { regex: /tilda/i, slug: "tilda" },
  { regex: /kohinoor/i, slug: "kohinoor" },
  { regex: /lal.?qilla/i, slug: "lal-qilla" },
  { regex: /daawat/i, slug: "daawat" },
  { regex: /india.?gate/i, slug: "india-gate" },
  { regex: /elephant/i, slug: "elephant" },
  { regex: /pillsbury/i, slug: "pillsbury" },
  { regex: /\btrs\b/i, slug: "trs" },
  { regex: /east.?end/i, slug: "east-end" },
  { regex: /\bheera\b/i, slug: "heera" },
  { regex: /\bnatco\b/i, slug: "natco" },
  { regex: /\bmdh\b/i, slug: "mdh" },
  { regex: /\beverest\b/i, slug: "everest" },
  { regex: /\bshan\b/i, slug: "shan" },
  { regex: /\bmtr\b/i, slug: "mtr" },
  { regex: /haldiram/i, slug: "haldirams" },
  { regex: /jabsons/i, slug: "jabsons" },
  { regex: /lijjat/i, slug: "lijjat" },
  { regex: /\bamul\b/i, slug: "amul" },
  { regex: /\bktc\b/i, slug: "ktc" },
  { regex: /wagh.?bakri/i, slug: "wagh-bakri" },
  { regex: /brooke.?bond/i, slug: "brooke-bond" },
  { regex: /\btetley\b/i, slug: "tetley" },
  { regex: /taj.?mahal/i, slug: "taj-mahal" },
  { regex: /\bbru\b/i, slug: "bru" },
  { regex: /nescaf|nescafé/i, slug: "nescafe" },
  { regex: /\bpriya\b/i, slug: "priya" },
  { regex: /patak/i, slug: "pataks" },
  { regex: /\bparle\b/i, slug: "parle-g" },
  { regex: /good.?day|britannia/i, slug: "britannia" },
  { regex: /\bmaggi\b/i, slug: "maggi" },
  { regex: /\bmaaza\b/i, slug: "maaza" },
  { regex: /rooh.?afza/i, slug: "rooh-afza" },
]

const ALLERGEN_KEYWORDS = [
  { keywords: ["atta", "wheat", "maida", "sooji", "rava", "bread", "biscuit", "paratha", "namkeen", "bhujia", "papad", "sev", "noodles", "pasta"], allergen: "gluten" },
  { keywords: ["paneer", "ghee", "curd", "yoghurt", "yogurt", "cream", "cheese", "milk", "dairy", "butter"], allergen: "milk" },
  { keywords: ["mustard oil", "mustard seeds", "mustard seed", "rai"], allergen: "mustard" },
  { keywords: ["soya", "soy"], allergen: "soya" },
  { keywords: ["peanut", "groundnut"], allergen: "peanuts" },
  { keywords: ["coconut"], allergen: "tree-nuts" },
  { keywords: ["sesame", "til"], allergen: "sesame" },
  { keywords: ["fish", "prawn", "shrimp"], allergen: "crustaceans" },
  { keywords: ["egg"], allergen: "eggs" },
]

function inferSynonyms(title) {
  const t = title.toLowerCase()
  const s = []
  if (t.includes("besan") || t.includes("gram flour")) s.push("gram flour", "chickpea flour")
  if (t.includes("sooji") || t.includes("semolina")) s.push("semolina", "rava")
  if (t.includes("jeera") || t.includes("cumin")) s.push("cumin")
  if (t.includes("haldi") || t.includes("turmeric")) s.push("turmeric")
  if (t.includes("dhania") || t.includes("coriander")) s.push("coriander")
  if (t.includes("ghee")) s.push("clarified butter")
  if (t.includes("paneer")) s.push("indian cheese", "cottage cheese")
  if (t.includes("toor dal")) s.push("split pigeon peas")
  if (t.includes("moong dal")) s.push("mung dal")
  if (t.includes("masoor dal")) s.push("red lentils")
  if (t.includes("urad dal")) s.push("black gram")
  if (t.includes("chana dal")) s.push("bengal gram")
  if (t.includes("rajma")) s.push("kidney beans")
  if (t.includes("chole") || t.includes("chana masala")) s.push("chickpea")
  if (t.includes("poha")) s.push("flattened rice")
  if (t.includes("methi") || t.includes("fenugreek")) s.push("fenugreek")
  if (t.includes("saunf") || t.includes("fennel")) s.push("fennel")
  if (t.includes("ajwain") || t.includes("carom")) s.push("carom seeds")
  if (t.includes("imli") || t.includes("tamarind")) s.push("tamarind")
  if (t.includes("elaichi") || t.includes("cardamom")) s.push("cardamom")
  if (t.includes("laung") || t.includes("clove")) s.push("cloves")
  if (t.includes("dalchini") || t.includes("cinnamon")) s.push("cinnamon")
  if (t.includes("sabudana")) s.push("tapioca pearls", "sago")
  if (t.includes("jaggery") || t.includes("gur")) s.push("unrefined sugar")
  if (t.includes("mirchi") || t.includes("chilli")) s.push("chilli")
  if (t.includes("namak") || t.includes("salt")) s.push("salt")
  if (t.includes("shakkar") || t.includes("cane sugar")) s.push("unrefined sugar")
  return [...new Set(s)]
}

function inferRegionalTags(title, category) {
  const t = title.toLowerCase()
  const tags = []
  if (t.includes("sona masoori") || t.includes("idli") || t.includes("dosa") || t.includes("sambar") || t.includes("rasam") || t.includes("ponni") || t.includes("parboiled")) tags.push("south-indian")
  if (t.includes("panch phoron") || t.includes("mustard oil")) tags.push("bengali")
  if (t.includes("aashirvaad") || t.includes("pillsbury") || t.includes("elephant")) tags.push("punjabi")
  if (t.includes("dhokla") || t.includes("farsan") || t.includes("khakhra") || t.includes("thepla")) tags.push("gujarati")
  return [...new Set(tags)]
}

function parseVariantWeight(title) {
  const t = (title || "").trim().toLowerCase()
  let match = t.match(/^(\d+\.?\d*)\s*kg$/i)
  if (match) {
    const val = parseFloat(match[1])
    return { weight_value: val, weight_unit: "kg", weight_grams: Math.round(val * 1000) }
  }
  match = t.match(/^(\d+)\s*g$/i)
  if (match) {
    const val = parseInt(match[1])
    return { weight_value: val, weight_unit: "g", weight_grams: val }
  }
  match = t.match(/^(\d+\.?\d*)\s*l$/i)
  if (match) {
    const val = parseFloat(match[1])
    return { weight_value: val, weight_unit: "l", weight_grams: Math.round(val * 1000) }
  }
  match = t.match(/^(\d+)\s*ml$/i)
  if (match) {
    const val = parseInt(match[1])
    return { weight_value: val, weight_unit: "ml", weight_grams: val }
  }
  return null
}

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  const { token } = await res.json()
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
}

async function main() {
  const headers = await login()
  console.log("Logged into Medusa admin\n")

  // 1. Fetch all products
  console.log("Fetching all products...")
  const allProducts = []
  let offset = 0
  while (true) {
    const res = await fetch(
      `${BASE}/admin/products?limit=100&offset=${offset}&fields=id,title,handle,variants.id,variants.title,variants.sku,categories.handle,categories.name,metadata`,
      { headers }
    )
    const data = await res.json()
    const products = data.products || []
    allProducts.push(...products)
    if (products.length < 100) break
    offset += 100
  }
  console.log(`  Fetched ${allProducts.length} products\n`)

  // 2. Process each product
  let updatedProducts = 0
  let updatedVariants = 0
  let skipped = 0

  for (const product of allProducts) {
    const categoryHandle = (product.categories && product.categories[0] && product.categories[0].handle) || ""
    const defaults = CATEGORY_DEFAULTS[categoryHandle] || CATEGORY_DEFAULTS["staples-grains"] || {}
    const existingMeta = product.metadata || {}

    // Skip if already enriched
    if (existingMeta.allergens && Array.isArray(existingMeta.allergens) && existingMeta.allergens.length > 0) {
      skipped++
      continue
    }

    // --- Product metadata ---
    const allergens = (defaults.allergens || []).slice()

    for (const rule of ALLERGEN_KEYWORDS) {
      if (!rule.allergen) continue
      for (const kw of rule.keywords) {
        if (product.title.toLowerCase().includes(kw) && !allergens.includes(rule.allergen)) {
          allergens.push(rule.allergen)
          break
        }
      }
    }

    let brandSlug = ""
    for (const bp of BRAND_PATTERNS) {
      if (bp.regex.test(product.title)) {
        brandSlug = bp.slug
        break
      }
    }

    const synonyms = inferSynonyms(product.title)
    const regionalTags = inferRegionalTags(product.title, categoryHandle)

    const productMeta = {
      allergens: [...new Set(allergens)],
      vat_rate: defaults.vat_rate ?? 0,
      country_of_origin: defaults.country_of_origin || "India",
      uk_food_business_operator: defaults.uk_food_business_operator || "IndiaGrocers Foods Ltd, London",
      dietary_flags: defaults.dietary_flags || [],
      velocity: defaults.velocity || "B",
      sourcing_tier: defaults.sourcing_tier || "A",
      regional_tags: regionalTags,
      subscription_eligible: defaults.subscription_eligible || false,
      requires_fast_delivery: defaults.requires_fast_delivery || false,
      requires_cold_chain: defaults.requires_cold_chain || false,
      brand_slug: brandSlug || "generic",
      synonyms,
      ingredients: "See product packaging for full ingredients list",
      best_before_guidance: "See product packaging",
    };

    // --- Variant metadata ---
    const variantUpdates = []
    for (const variant of (product.variants || [])) {
      const weight = parseVariantWeight(variant.title || "")
      if (weight) {
        variantUpdates.push({
          id: variant.id,
          metadata: {
            weight_value: weight.weight_value,
            weight_unit: weight.weight_unit,
            weight_grams: weight.weight_grams,
            low_stock_threshold: defaults.velocity === "A" ? 20 : defaults.velocity === "C" ? 5 : 10,
          },
        })
      }
    }

    // --- Update product ---
    try {
      const productRes = await fetch(`${BASE}/admin/products/${product.id}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ metadata: productMeta }),
      })

      if (productRes.ok) {
        updatedProducts++
        if (updatedProducts % 20 === 0) process.stdout.write(".")
      } else {
        const err = await productRes.text()
        process.stdout.write(`\n  ? ${product.handle}: ${err.slice(0, 80)}\n`)
      }

      for (const vu of variantUpdates) {
        try {
          const variantRes = await fetch(
            `${BASE}/admin/products/${product.id}/variants/${vu.id}`,
            { method: "POST", headers, body: JSON.stringify({ metadata: vu.metadata }) }
          )
          if (variantRes.ok) updatedVariants++
        } catch {}
      }
    } catch (e) {
      process.stdout.write(`\n  ? ${product.handle}: ${e.message}\n`)
    }
  }

  console.log(`\n`)
  console.log(`========================================`)
  console.log(`  Metadata Enrichment Complete`)
  console.log(`========================================`)
  console.log(`  Products updated:   ${updatedProducts}/${allProducts.length}`)
  console.log(`  Variants updated:   ${updatedVariants}`)
  console.log(`  Already enriched:   ${skipped}`)

  // 3. Trigger price-per-unit recalculation
  console.log(`\n  Triggering price-per-unit recalculation on ${Math.min(updatedProducts, 50)} products...`)
  let recalcCount = 0
  for (const product of allProducts.slice(0, Math.min(updatedProducts, 50))) {
    try {
      await fetch(`${BASE}/admin/products/${product.id}/recalculate-pricing`, { method: "GET", headers })
      recalcCount++
    } catch {}
  }
  console.log(`  Recalculated: ${recalcCount} products`)
  console.log(`========================================\n`)
}

main().catch(console.error)
