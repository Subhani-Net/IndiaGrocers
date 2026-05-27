/**
 * Assign categories to products by title keyword matching.
 * Backend must be running on http://127.0.0.1:9000
 *
 * Usage: node src/seed/assign-categories-from-titles.mjs
 */

const BASE = "http://127.0.0.1:9000"

function findCategory(title) {
  const t = (title || "").toLowerCase()

  // Order matters — most specific checks first

  // Beverages (check early — 'tea', 'coffee' are common substrings)
  if (t.includes(" tea ")||t.includes("tea ")||t.includes(" tea")||t.match(/\btea\b/)||
      t.includes("coffee")||t.includes("bru ")||t.includes("nescafe")||
      t.includes("horlicks")||t.includes("bournvita")||t.includes("complan")||
      t.includes("rooh afza")||t.includes("drink")||t.includes("maaza")||t.includes("nimbooz")) return "beverages"

  // Snacks (check before spices — 'papad', 'bhujia' etc.)
  if (t.includes("bhujia")||t.includes("namkeen")||t.includes("papad")||t.includes("pappad")||
      t.includes("mixture")||t.includes("biscuit")||t.includes("parle")||t.includes("kurkure")||
      t.includes("oreo")||t.includes("maggi")||t.includes("noodle")||t.includes("fryum")||
      t.includes("bhel")||t.includes("sev")||t.includes("chivda")||t.includes("farsan")||
      t.includes("chakli")||t.includes("murukku")||t.includes("gachak")||t.includes("brittle")||
      t.includes("soan")||t.includes("laddu")||t.includes("barfi")||t.includes("sweet")||
      t.includes("cashew")||t.includes("almond")||t.includes("peanut")||t.includes("monkey nut")||
      t.includes("honey roast")||t.includes("salted nut")||t.includes("lays")) return "snacks-namkeen"

  // Frozen
  if (t.includes("frozen")||t.includes("samosa")||t.includes("paratha")) return "frozen"

  // Pickles
  if (t.includes("pickle")||t.includes("chutney")||t.includes("achar")) return "pickles-chutneys"

  // Dairy
  if (t.includes("paneer")||t.includes("butter")&&!t.includes("peanut butter")||
      t.includes("curd")||t.includes("yoghurt")||t.includes("yogurt")||
      t.includes("milk powder")||t.includes("double cream")||t.includes("single cream")||
      t.includes("cheese")||t.includes("dahi")||t.includes("condensed milk")||t.includes("evaporated milk")) return "dairy"

  // Oils & Ghee (check before spices — 'oil' is a broad term)
  if (t.includes(" oil")||t.includes("oil ")||t.match(/\boil\b/)||t.includes("ghee")||
      t.includes("rapeseed")) return "oils-ghee"

  // Spice Blends
  if (t.includes("garam masala")||t.includes("chicken masala")||t.includes("chaat masala")||
      t.includes("tandoori")||t.includes("biryani masala")||t.includes("chole masala")||
      t.includes("chana masala")||t.includes("rajma masala")||t.includes("meat masala")||
      t.includes("fish masala")||t.includes("pav bhaji")||t.includes("kitchen king")||
      t.includes("pulao masala")||t.includes("sambar")||t.includes("rasam")||
      t.includes("paneer masala")||t.includes("chai masala")) return "spice-blends"

  // Spices — Ground
  if (t.includes("turmeric")||t.includes("haldi")||t.includes("mirchi")||t.includes("chilli powder")||
      t.includes("red chilli")||t.includes("dhania")||t.includes("coriander powder")||
      t.includes("jeera")||t.includes("cumin powder")||t.includes("amchur")||t.includes("mango powder")||
      t.includes("kasuri methi")||t.includes("curry leaf powder")||t.includes("curry powder")||
      t.includes("ginger powder")||t.includes("garlic powder")||t.includes("cardamom powder")||
      t.includes("black pepper powder")||t.includes("white pepper")||t.includes("kashmiri chilli")||
      t.includes("paprika")||t.includes("rosemary jar")||t.includes("spice jar")||
      t.includes("food colour")||t.includes("essence")||t.includes("flavouring")||
      t.includes("colour ")||t.includes("colourings")) return "spices-ground"

  // Spices — Whole
  if (t.includes("cumin seed")||t.includes("mustard seed")||t.includes("fenugreek seed")||t.includes("methi")||
      t.includes("fennel seed")||t.includes("cardamom")||t.includes("elaichi")||t.includes("clove")||
      t.includes("laung")||t.includes("cinnamon")||t.includes("dalchini")||t.includes("black pepper")||
      t.includes("kali mirch")||t.includes("hing")||t.includes("asafoetida")||t.includes("star anise")||
      t.includes("nutmeg")||t.includes("jaiphal")||t.includes("bay leaf")||t.includes("tej patta")||
      t.includes("panch phoron")||t.includes("ajwain")||t.includes("carom")||t.includes("sauf")||
      t.includes("dried chilli")||t.includes("cinnamon stick")||t.includes("mace")||
      t.includes("javitri")||t.includes("black cardamom")||t.includes("green cardamom")) return "spices-whole"

  // Atta & Flours
  if (t.includes("atta")||t.includes("besan")||t.includes("gram flour")||t.includes("maida")||
      t.includes("rice flour")||t.includes("ragi")||t.includes("finger millet")||t.includes("sooji")||
      t.includes("semolina")||t.includes("suji")||t.includes("jowar")||t.includes("bajra")||
      t.includes("bajri")||t.includes("millet flour")||t.includes("chapatti")||t.includes("chakki")||
      t.includes("wheat flour")||t.includes("corn flour")||t.includes("cornflour")||t.includes("maize meal")||
      t.includes("corn meal")) return "atta-flours"

  // Rice & Grains
  if (t.includes("basmati")||t.includes("sona masoori")||t.includes("ponni")||
      t.includes("idli rice")||t.includes("brown rice")||t.includes("poha")||t.includes("flattened rice")||
      t.includes("quinoa")||t.includes("sabudana")||t.includes("tapioca")||t.includes("soya chunk")||
      t.includes("makhana")||t.includes("phool makhana")||t.includes("lotus seed")||
      t.includes("couscous")) return "staples-grains"

  // Dals & Lentils
  if (t.includes("toor")||t.includes("toovar")||t.includes("chana dal")||t.includes("moong dal")||
      t.includes("mung dal")||t.includes("masoor")||t.includes("urad")||t.includes("rajma")||
      t.includes("kidney")||t.includes("black eye")||t.includes("kala chana")||t.includes("chick pea")||
      t.includes("chickpea")||t.includes("chana")||t.includes("moth dal")||t.includes("lobhia")||
      t.includes("pigeon")||t.includes("yellow pea")||t.includes("green pea")||t.includes("split pea")||
      t.includes("beans")||t.includes("borlotti")||t.includes("haricot")||t.includes("flageolet")||
      t.includes("black turtle")||t.includes("cannellini")||t.includes("butter bean")||
      t.includes("pinto")||t.includes("adzuki")||t.includes("soya")) return "dal-lentils"

  // Condiments / Cooking Essentials
  if (t.includes("jaggery")||t.includes("gur")||t.includes("vinegar")||t.includes("sauce")||
      t.includes("ketchup")||t.includes("coconut milk")||t.includes("coconut cream")||
      t.includes("coconut desiccated")||t.includes("coconut flake")||t.includes("coconut halve")||
      t.includes("tomato puree")||t.includes("tomato paste")||t.includes("ginger garlic")||
      t.includes("rose water")||t.includes("kewra")||t.includes("tamarind")||
      t.includes("lemon juice")||t.includes("syrup")||t.includes("squash")||
      t.includes("paste")||t.includes("sugar")||t.includes("salt")||
      t.includes("desiccated")||t.includes("dessicated")) return "condiments"

  // Nuts/seeds/coconut/dried fruit (to snacks)
  if (t.includes("coconut ")||t.includes("coconut,")||t.includes("peanut")||t.includes("cashew")||
      t.includes("almond")||t.includes("pistachio")||t.includes("walnut")||t.includes("raisin")||
      t.includes("dried fruit")||t.includes("seed")||t.includes("nut ")) return "snacks-namkeen"

  // Anything with 'rice' or 'grain' that wasn't caught above
  if (t.includes(" rice ")||t.includes(" rice")||t.includes("grain")||t.includes("rice ")) return "staples-grains"

  // Fresh produce
  if (t.includes("fresh ")||t.includes("okra")||t.includes("tinda")||t.includes("vegetable")||
      t.includes("curry leaf")||t.includes(" ginger ")||t.includes(" garlic ")||t.includes("onion")||
      t.includes("potato")||t.includes("tomato")||t.includes("chilli")||t.includes("coriander leaf")) return "fresh"

   // No fallback — unmatched products are skipped rather than dumped into a category
  return null
}

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

  // Fetch categories
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
      `${BASE}/admin/products?limit=100&offset=${offset}&fields=id,title,handle`,
      { headers }
    ).then(r => r.json())
    allProducts.push(...(products || []))
    if ((products || []).length < 100) break
    offset += 100
  }
  console.log(`  ${allProducts.length} products\n`)

  // Match and assign
  const byCategory = {}
  const unmatched = []
  let matched = 0

  for (const product of allProducts) {
    const handle = findCategory(product.title)
    if (!handle) {
      unmatched.push(`${product.title} → (no match)`)
      continue
    }
    const cat = catByHandle[handle]
    if (!cat) {
      unmatched.push(`${product.title} → ${handle} (NOT FOUND)`)
      continue
    }
    if (!byCategory[cat.id]) byCategory[cat.id] = []
    byCategory[cat.id].push(product.id)
    matched++
  }

  console.log(`${matched} matched, ${unmatched.length} could not be assigned\n`)
  if (unmatched.length > 0 && unmatched.length < 30) {
    console.log("Unmatched:")
    unmatched.forEach(t => console.log("  " + t))
    console.log()
  }

  // Batch assign
  let assigned = 0
  for (const [catId, prodIds] of Object.entries(byCategory)) {
    const cat = allCats.find((c) => c.id === catId)
    const name = cat?.name || catId
    try {
      const res = await fetch(
        `${BASE}/admin/product-categories/${catId}/products`,
        { method: "POST", headers, body: JSON.stringify({ add: prodIds }) }
      )
      if (res.ok) {
        assigned += prodIds.length
        console.log(`  ${name}: ${prodIds.length}`)
      } else {
        const e = await res.text()
        console.log(`  ${name}: FAIL — ${e.slice(0, 100)}`)
      }
    } catch (e) {
      console.log(`  ${name}: ERROR — ${e.message}`)
    }
  }

  console.log(`\nDone: ${assigned} assigned`)
}

main().catch(console.error)
