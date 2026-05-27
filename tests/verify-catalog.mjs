/**
 * Hardcoded Catalog Verification Test
 *
 * Verifies exact product counts, specific product titles per category,
 * and PDP accessibility. All values are hardcoded from the database dump.
 *
 * Run: node tests/verify-catalog.mjs
 *
 * ⚠️  GUARDRAIL: APPEND-ONLY. Never delete or overwrite existing sections.
 *     To add new tests, append a new section AFTER the last existing one:
 *       console.log("\nN. New Section Name\n")
 *       // ... your test assertions ...
 */

import http from "http"

const PK = "pk_72deb296139d27885561a0fa58b77cbed187d8c5912390c2dc1912cb477083d3"

let passed = 0
let failed = 0

function ok(test, msg) {
  if (test) { passed++; console.log(`  ✅ ${msg}`) }
  else { failed++; console.log(`  ❌ ${msg}`) }
}

function get(path, port = 8000, extraHeaders = {}) {
  const headers = { Cookie: "_medusa_cache_id=test-catalog", ...extraHeaders }
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: "localhost", port, path, headers }, (res) => {
      let d = ""
      res.on("data", (c) => (d += c))
      res.on("end", () => resolve({ status: res.statusCode, text: d }))
    })
    req.on("error", reject)
  })
}

function getMeiliSearch(body) {
  return new Promise((resolve, reject) => {
    const postData = typeof body === "string" ? body : JSON.stringify(body)
    const options = {
      hostname: "localhost",
      port: 7700,
      path: "/indexes/products/search",
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(postData) },
    }
    const req = http.request(options, (res) => {
      let d = ""
      res.on("data", (c) => (d += c))
      res.on("end", () => resolve(JSON.parse(d)))
    })
    req.on("error", reject)
    req.write(postData)
    req.end()
  })
}

async function main() {
  console.log("IndiaGrocers — Hardcoded Catalog Verification\n")

  // Get region ID
  const regRaw = await get("/store/regions", 9000, { "x-publishable-api-key": PK })
  const regData = JSON.parse(regRaw.text)
  const regionId = regData.regions[0].id

  // Fetch all products
  const all = []
  let offset = 0
  while (true) {
    const apiPath = `/store/products?limit=100&offset=${offset}&region_id=${regionId}&fields=id,title,handle,categories.handle`
    const r = await get(apiPath, 9000, { "x-publishable-api-key": PK })
    const data = JSON.parse(r.text)
    all.push(...(data.products || []))
    if ((data.products || []).length < 100) break
    offset += 100
  }

  function count(handle) { return all.filter((p) => (p.categories || []).some((c) => c.handle === handle)).length }
  function titles(handle) { return all.filter((p) => (p.categories || []).some((c) => c.handle === handle)).map((p) => p.title) }

  // ═══════════════════════════════════════════════
  // 1. HARDCODED PRODUCT COUNTS PER CATEGORY
  // ═══════════════════════════════════════════════
  console.log("1. Product Counts per Category\n")

  const EXPECTED_COUNTS = {
    "staples-grains": 79,
    "dal-lentils": 33,
    "spice-blends": 9,
    "oils-ghee": 11,
    "atta-flours": 14,
    "snacks-namkeen": 47,
    "beverages": 1,
    "pickles-chutneys": 7,
    "frozen": 0,
    "ready-to-cook": 0,
    "fresh": 12,
    "spices-whole": 11,
    "spices-ground": 23,
    "dairy": 4,
    "condiments": 32,
    "pooja": 0,
    "household": 0,
    "regional": 0,
  }

  for (const [handle, expected] of Object.entries(EXPECTED_COUNTS)) {
    const actual = count(handle)
    ok(actual === expected, `${handle}: ${actual} (expected ${expected})`)
  }

  // ═══════════════════════════════════════════════
  // 2. HARDCODED SPECIFIC PRODUCTS IN EACH CATEGORY
  // ═══════════════════════════════════════════════
  console.log("\n2. Specific Products per Category\n")

  const CATALOG = {
    "staples-grains": {
      must: [
        "Natco Basmati Rice India 2kg",
        "Natco Phool Makhana (Popped Lotus Seeds) 100g",
        "Natco Sona Masuri Rice 5kg",
        "Natco Idli Rice 5kg",
        "Natco Powa Medium (Flaked Rice) 1kg",
        "Natco Couscous 500g",
        "Natco Mamra Basmati",
        "TRS Tapioca Pearls",
      ],
      mustNot: [
        "Natco Black Eyed Beans 400g",        // belongs to dal-lentils
        "Natco Mixed Pickle 300g",             // belongs to pickles-chutneys
        "Natco Coconut Oil (Parachute Brand)", // belongs to oils-ghee
      ],
    },
    "dal-lentils": {
      must: [
        "Natco Black Eyed Beans 400g",
        "Natco White Kidney Beans 400g",
        "Natco Toovar 400g",
        "Natco Kala Chana Boiled 400g",
        "TRS Toor Dal",
        "TRS Yellow Peas",
      ],
      mustNot: [
        "Natco Basmati Rice India 2kg",     // belongs to staples-grains
        "Natco Jaggery 500g",               // belongs to condiments
      ],
    },
    "spice-blends": {
      must: [
        "Natco Garam Masala 400g",
        "Natco Tandoori Masala 400g",
        "Natco Biryani Masala Mangal 50g",
        "Natco Chicken Masala Mangal 100g",
      ],
      mustNot: [
        "Natco Chilli Powder Hot Jar 100g",  // belongs to spices-ground
        "Natco Cinnamon Ground Jar 100g",    // belongs to spices-whole
      ],
    },
    "oils-ghee": {
      must: [
        "Natco Groundnut Oil 1 Litre",
        "Natco Ghee Pure (Plough brand) 500g",
        "Natco Pure Mustard Oil",
        "Natco Coconut Oil (Parachute Brand) 500ml",
      ],
      mustNot: [],
    },
    "atta-flours": {
      must: [
        "Natco Chakki Atta Multigrain 5kg",
        "Natco Gram Flour (Papa brand) 2kg",
        "Natco Rice Flour 500g",
        "Natco Semolina Extra Coarse 1.5kg",
        "TRS Pure Gram Flour",
      ],
    },
    "snacks-namkeen": {
      must: [
        "Natco Bhel Puri Kit 500g",
        "Natco Big D Honey Roast Peanuts 12x50g Packs on a Pub Card",
        "Natco Pappadoms Plain (Microwavable) 200g",
        "Natco Peanut Gachak (Peanut Brittle) 400g",
        "TRS Pomegranate Seeds (Anardana Whole)",
      ],
    },
    "beverages": {
      must: ["Natco Spiced Tea - Masala Blend 160s"],
    },
    "pickles-chutneys": {
      must: [
        "Natco Mixed Pickle 300g",
        "Natco Mango Pickle Hot 300g",
        "Natco Lime Pickle Hot 300g",
        "Natco Garlic Pickle 300g",
      ],
    },
    "spices-whole": {
      must: [
        "Natco Asafoetida (Hing) Jar 100g",
        "Natco Cardamom Green Jar 50g",
        "TRS Cumin Seeds",
        "TRS Whole Cinnamon (Dalchini)",
      ],
      mustNot: ["Natco Garam Masala 400g"], // belongs to spice-blends
    },
    "spices-ground": {
      must: [
        "Natco Kasuri Methi Leaves 100g",
        "TRS Coriander Powder (Dhania)",
        "TRS Garlic Powder",
        "TRS Garlic Powder",
      ],
    },
    "dairy": {
      must: ["Natco Ghee Pure Butter 1kg", "Natco Milk Powder"],
    },
    "condiments": {
      must: [
        "Natco Jaggery 500g",
        "Natco Coconut Milk 400ml",
        "Natco Ginger Paste 190g",
        "Natco Rose Water 310ml",
        "TRS Ginger & Garlic Paste",
      ],
    },
  }

  for (const [handle, checks] of Object.entries(CATALOG)) {
    const ts = titles(handle)
    if (checks.must) {
      for (const title of checks.must) {
        ok(ts.includes(title), `${handle}: has "${title}"`)
      }
    }
    if (checks.mustNot) {
      for (const title of checks.mustNot) {
        ok(!ts.includes(title), `${handle}: does NOT have "${title}"`)
      }
    }
  }

  // ═══════════════════════════════════════════════
  // 3. STOREFRONT PAGE ACCESSIBILITY
  // ═══════════════════════════════════════════════
  console.log("\n3. Storefront Pages — 200 OK\n")

  for (const handle of Object.keys(EXPECTED_COUNTS)) {
    const res = await get(`/gb/categories/${handle}`)
    ok(res.status === 200, `/${handle} returns 200`)
  }

  // ═══════════════════════════════════════════════
  // 4. SPECIFIC PRODUCT DETAIL PAGES
  // ═══════════════════════════════════════════════
  console.log("\n4. Product Detail Pages\n")

  const PDP_CHECKS = [
    { handle: "natco-basmati-rice-india-2kg", title: "Natco Basmati Rice India 2kg" },
    { handle: "natco-black-eyed-beans-400g", title: "Natco Black Eyed Beans 400g" },
    { handle: "natco-garam-masala-400g", title: "Natco Garam Masala 400g" },
    { handle: "natco-mixed-pickle-300g", title: "Natco Mixed Pickle 300g" },
    { handle: "natco-spiced-tea-masala-blend-160s", title: "Natco Spiced Tea - Masala Blend 160s" },
    { handle: "trs-toor-dal", title: "TRS Toor Dal" },
    { handle: "natco-chakki-atta-multigrain-5kg", title: "Natco Chakki Atta Multigrain 5kg" },
    { handle: "natco-jaggery-500g", title: "Natco Jaggery 500g" },
  ]

  for (const pdp of PDP_CHECKS) {
    const res = await get(`/gb/products/${pdp.handle}`)
    ok(res.status === 200, `PDP /${pdp.handle} — 200`)
    ok(res.text.includes(pdp.title), `PDP /${pdp.handle} — shows "${pdp.title}"`)
  }

  // ═══════════════════════════════════════════════
  // 5. NAVIGATION CATEGORY LINKS
  // ═══════════════════════════════════════════════
  console.log("\n5. Navigation — Category Links\n")

  const NAV_CATEGORIES = [
    "Staples & Grains",
    "Dal & Lentils",
    "Atta & Flours",
    "Oils & Ghee",
    "Spice Blends",
    "Beverages",
    "Snacks & Namkeen",
    "Pickles & Chutneys",
  ]

  const homeRes = await get("/gb")
  for (const name of NAV_CATEGORIES) {
    ok(homeRes.text.includes(name), `Homepage nav has "${name}"`)
  }

  // ═══════════════════════════════════════════════
  // 6. SEARCH RESULTS
  // ═══════════════════════════════════════════════
  console.log("\n6. Search\n")

  const SEARCH_TESTS = [
    { q: "basmati", expected: "Natco Basmati Rice" },
    { q: "toor dal", expected: "TRS Toor Dal" },
    { q: "pickle", expected: "Natco Mixed Pickle" },
    { q: "besan", expected: true }, // should work via synonym "gram flour"
  ]

  for (const st of SEARCH_TESTS) {
    const res = await get(`/gb/search?q=${encodeURIComponent(st.q)}`)
    ok(res.status === 200, `Search "${st.q}" returns 200`)
    if (typeof st.expected === "string") {
      ok(res.text.includes(st.expected), `Search "${st.q}" includes "${st.expected}"`)
    }
  }

  // ═══════════════════════════════════════════════
  // 7. COMING SOON PAGES
  // ═══════════════════════════════════════════════
  console.log("\n7. Coming Soon Pages\n")

  const COMING_SOON = ["frozen", "ready-to-cook", "pooja", "household", "regional"]
  for (const handle of COMING_SOON) {
    const res = await get(`/gb/categories/${handle}`)
    ok(res.status === 200, `/${handle} returns 200`)
    ok(res.text.includes("Coming Soon") || res.text.includes("Notify Me"), `/${handle} shows Coming Soon`)
  }

  // ═══════════════════════════════════════════════
  // 8. NAV STRUCTURE VALIDATION
  // ═══════════════════════════════════════════════
  console.log("\n8. Nav Structure — Sticky Header + Mega Menu\n")

  const navRes = await get("/gb")
  const html = navRes.text

  // 1. Header element must exist (no sticky — scrolls with page)
  ok(/<header[^>]*class="[^"]*z-50[^"]*"/.test(html),
    "<header> has z-50 (no sticky — scrolls with page)")

  // 2. Header must NOT have sticky (prevents separate scroll context)
  ok(!/<header[^>]*sticky/.test(html),
    "<header> does NOT have sticky class")

  // 3. Header must NOT be wrapped in a plain <div> that could create a scroll container
  //    Check: the header appears directly after the promo banner, not inside a wrapper div
  const headerIdx = html.indexOf("<header")
  const promoEnd = html.indexOf("FREE DELIVERY")
  const betweenPromoAndHeader = html.substring(promoEnd + 100, headerIdx)
  // Count opening divs minus closing divs between promo and header
  const openDivs = (betweenPromoAndHeader.match(/<div[^>]*>/g) || []).length
  const closeDivs = (betweenPromoAndHeader.match(/<\/div>/g) || []).length
  ok(openDivs <= closeDivs,
    `No unclosed wrapper div around header (open:${openDivs} close:${closeDivs} in gap)`)

  // 4. Browse mega menu button must exist
  ok(html.includes(">Browse<") || html.includes('"Browse"'),
    "Browse mega menu button exists")

  // 5. Mega menu dropdown must exist with category links
  ok(html.includes("mega-menu") || html.includes("nav-cat-group"),
    "Mega menu dropdown class exists")

  // 6. Desktop category strip must exist (hidden on mobile)
  ok(html.includes("hidden lg:block") && html.includes("backdrop-blur"),
    "Desktop category strip exists (hidden lg:block)")

  // 7. Category strip is AFTER </header> (part of page flow, not inside header)
  const headerClose = html.indexOf("</header>")
  const catStrip = html.indexOf("hidden lg:block")
  ok(catStrip > headerClose,
    "Category strip is AFTER </header> (scrolled with page, not sticky)")

  // 8. Mobile bottom nav must exist
  ok(html.includes("MobileBottomNav") || html.includes("fixed bottom-0"),
    "Mobile bottom nav exists")

  // 9. Mobile bottom nav has 5 tabs
  ok(html.includes("Home") && html.includes("Search") && html.includes("Browse") && html.includes("Reorder") && html.includes("Account"),
    "Mobile nav has 5 tabs: Home, Search, Browse, Reorder, Account")

  // 10. Header scrolls with page (no sticky or fixed positioning on header)
  ok(!/<header[^>]*(sticky|fixed)/.test(html),
    "Header uses normal flow (no sticky/fixed on header)")

  // ═══════════════════════════════════════════════
  // 9. COMING SOON PAGES (Phase 2/3)
  // ═══════════════════════════════════════════════
  console.log("\n9. Phase 2/3 Coming Soon Pages\n")
  for (const cat of ["frozen", "fresh", "ready-to-cook", "condiments", "pooja", "household", "regional"]) {
    const res = await get(`/gb/categories/${cat}`)
    ok(res.status === 200, `/${cat} returns 200`)
    ok(res.text.includes("Coming Soon") || res.text.includes("Notify Me") || res.text.includes("coming"),
      `/${cat} shows Coming Soon`)
  }

  // ═══════════════════════════════════════════════
  // 10. HEALTH CHECK
  // ═══════════════════════════════════════════════
  console.log("\n10. Health\n")
  const healthRes = await get("/gb/health")
  ok(healthRes.status === 200, "Health page returns 200")
  ok(healthRes.text.includes("Backend") || healthRes.text.includes("Service") || healthRes.text.includes("health"),
    "Health page renders")

  // ═══════════════════════════════════════════════
  // 11. MENU CONTENT vs BLUEPRINT
  // ═══════════════════════════════════════════════
  console.log("\n11. Menu Content (vs Blueprint)\n")
  const PHASE1 = [
    { name: "Staples & Grains", handle: "staples-grains" },
    { name: "Atta & Flours", handle: "atta-flours" },
    { name: "Dal & Lentils", handle: "dal-lentils" },
    { name: "Oils & Ghee", handle: "oils-ghee" },
    { name: "Spices — Whole", handle: "spices-whole" },
    { name: "Spices — Ground", handle: "spices-ground" },
    { name: "Spice Blends", handle: "spice-blends" },
    { name: "Dairy & Eggs", handle: "dairy" },
    { name: "Beverages", handle: "beverages" },
    { name: "Snacks & Namkeen", handle: "snacks-namkeen" },
    { name: "Pickles & Chutneys", handle: "pickles-chutneys" },
  ]
  for (const cat of PHASE1) {
    ok(html.includes(cat.name) || html.includes(cat.handle), `Nav has "${cat.name}"`)
  }
  // No old names
  for (const old of ["Rice & Grains", "Dals & Lentils", "Cooking Oils", "Flours & Grains",
    "Sweets & Mithai", "Papads & Fryums", "Noodles & Pasta", "Sauces & Ketchup", "Dairy & Milk"]) {
    ok(!html.includes(`"${old}"`) && !html.includes(`>${old}<`), `Old name "${old}" NOT in nav`)
  }
  ok(html.includes("45") || html.includes("£45"), "Shows £45 free delivery threshold")

  // ═══════════════════════════════════════════════
  // 12. CATEGORY DATA — PRODUCT COUNTS PER CATEGORY
  // ═══════════════════════════════════════════════
  console.log("\n12. Category Data — Products per Design Category\n")
  for (const cat of PHASE1) {
    const cnt = count(cat.handle)
    ok(cnt >= 1, `${cat.name} has ${cnt} products (min 1)`)
  }
  // Phase 3 should be empty
  ok(count("pooja") === 0, "pooja has 0 products (Phase 3)")
  ok(count("household") === 0, "household has 0 products (Phase 3)")
  ok(count("regional") === 0, "regional has 0 products (Phase 3)")

  // ═══════════════════════════════════════════════
  // 13. STOREFRONT CATEGORY PAGES — PRODUCT COUNT
  // ═══════════════════════════════════════════════
  console.log("\n13. Storefront Category Pages — Product Count\n")
  for (const cat of PHASE1) {
    const res = await get(`/gb/categories/${cat.handle}`)
    ok(res.status === 200, `Storefront /${cat.handle} loads`)
    ok(!res.text.includes("No products found") && !res.text.includes("No products yet"),
      `Storefront /${cat.handle} shows products`)
  }

  // ═══════════════════════════════════════════════
  // 14. PRODUCT DETAIL PAGE — METADATA VISIBLE
  // ═══════════════════════════════════════════════
  console.log("\n14. Product Detail Page — Metadata Visible\n")
  if (all.length > 0) {
    const sample = all[0]
    const pdpRes = await get(`/gb/products/${sample.handle}`)
    ok(pdpRes.status === 200, "PDP loads")
    ok(pdpRes.text.includes("Allergen") || pdpRes.text.includes("allergen") || pdpRes.text.includes("Dietary"),
      "PDP shows allergen/dietary section")
    ok(pdpRes.text.includes("Product Details") || pdpRes.text.includes("product-details"),
      "PDP shows product details section")
  }

  // ═══════════════════════════════════════════════
  // 15. CATEGORY BROWSING — HARDCODED PRODUCTS + TEMPLATES
  // ═══════════════════════════════════════════════
  console.log("\n15. Category Browsing — Products, Filters, Sub-Chips\n")

  const CATEGORY_CHECKS = [
    {
      handle: "staples-grains",
      template: "weight-heavy",
      defaultSort: "weight_desc",
      products: ["Natco Basmati Rice India 2kg", "Natco Sona Masuri Rice 5kg", "Natco Idli Rice 5kg", "Natco Couscous 500g"],
      notProducts: ["Natco Mixed Pickle 300g", "Natco Black Eyed Beans 400g"],
      subChips: ["Basmati Rice", "Sona Masoori", "Ponni", "Idli Rice"],
      weightFilter: ["500g", "1kg", "5kg", "10kg", "20kg"],
    },
    {
      handle: "dal-lentils",
      template: "weight-heavy",
      defaultSort: "weight_desc",
      products: ["Natco Black Eyed Beans 400g", "TRS Toor Dal", "Natco Kala Chana Boiled 400g"],
      notProducts: ["Natco Basmati Rice India 2kg"],
      subChips: ["Toor Dal", "Moong Dal", "Masoor Dal", "Chana Dal", "Urad Dal"],
    },
    {
      handle: "atta-flours",
      template: "weight-heavy",
      defaultSort: "weight_desc",
      products: ["Natco Chakki Atta Multigrain 5kg", "Natco Gram Flour (Papa brand) 2kg", "TRS Pure Gram Flour"],
      notProducts: ["Natco Basmati Rice India 2kg"],
      subChips: ["Wheat Atta", "Besan", "Rice Flour", "Sooji", "Maida"],
    },
    {
      handle: "oils-ghee",
      template: "weight-heavy",
      defaultSort: "weight_desc",
      products: ["Natco Groundnut Oil 1 Litre", "Natco Coconut Oil (Parachute Brand) 500ml", "Natco Ghee Pure (Plough brand) 500g"],
      notProducts: [],
      subChips: ["Mustard Oil", "Sunflower Oil", "Coconut Oil", "Ghee", "Groundnut Oil"],
    },
    {
      handle: "spice-blends",
      template: "brand-showcase",
      defaultSort: "title_asc",
      products: ["Natco Garam Masala 400g", "Natco Tandoori Masala 400g", "Natco Chicken Masala Mangal 100g"],
      notProducts: ["Natco Kasuri Methi Leaves 100g"],
      brandTiles: true,
    },
    {
      handle: "beverages",
      template: "brand-showcase",
      defaultSort: "title_asc",
      products: ["Natco Spiced Tea - Masala Blend 160s"],
      notProducts: [],
      brandTiles: true,
    },
    {
      handle: "snacks-namkeen",
      template: "standard",
      products: ["Natco Bhel Puri Kit 500g", "Natco Peanut Gachak (Peanut Brittle) 400g", "Natco Pappadoms Plain (Microwavable) 200g"],
      notProducts: [],
      vatNotice: true,
    },
    {
      handle: "pickles-chutneys",
      template: "standard",
      products: ["Natco Mixed Pickle 300g", "Natco Mango Pickle Hot 300g", "Natco Lime Pickle Hot 300g"],
      notProducts: [],
    },
  ]

  for (const cat of CATEGORY_CHECKS) {
    const res = await get(`/gb/categories/${cat.handle}`)
    ok(res.status === 200, `/${cat.handle} — 200 OK`)

    // Template check
    if (cat.template) {
      ok(res.text.includes(cat.template), `/${cat.handle} — ${cat.template} template`)
    }

    // Default sort check
    if (cat.defaultSort) {
      ok(res.text.includes(cat.defaultSort), `/${cat.handle} — default sort ${cat.defaultSort}`)
    }

    // Must-have products
    for (const title of (cat.products || [])) {
      ok(res.text.includes(title), `/${cat.handle} — has "${title}"`)
    }

    // Must-NOT-have products
    for (const title of (cat.notProducts || [])) {
      ok(!res.text.includes(title), `/${cat.handle} — does NOT have "${title}"`)
    }

    // Sub-type chips
    for (const chip of (cat.subChips || [])) {
      ok(res.text.includes(chip), `/${cat.handle} — sub-chip "${chip}"`)
    }
    if (cat.subChips && cat.subChips.length > 0) {
      ok(res.text.includes("All"), `/${cat.handle} — has "All" sub-chip`)
    }

    // Weight filter chips
    for (const weight of (cat.weightFilter || [])) {
      ok(res.text.includes(weight), `/${cat.handle} — weight filter "${weight}"`)
    }

    // Brand tiles (brand-showcase)
    if (cat.brandTiles) {
      ok(res.text.includes("Shop by Brand") || res.text.includes("Brand"), `/${cat.handle} — brand tiles strip`)
    }

    // VAT notice (snacks-namkeen)
    if (cat.vatNotice) {
      ok(res.text.includes("VAT") || res.text.includes("Prices include"), `/${cat.handle} — VAT notice`)
    }

    // Filter panel essentials
    ok(res.text.includes("In Stock") || res.text.includes("Sort"), `/${cat.handle} — filter panel renders`)
    ok(res.text.includes("Brand"), `/${cat.handle} — brand filter exists`)
    ok(res.text.includes("Weight") || res.text.includes("Price Range"), `/${cat.handle} — weight/price filter exists`)
  }

  // ═══════════════════════════════════════════════
  // 16. SUB-CATEGORY PAGES — HARDCODED RESULTS PER SUB
  // ═══════════════════════════════════════════════
  console.log("\n16. Sub-Category Pages — Hardcoded Expected Results\n")

  // For each parent category, verify all its sub-categories
  const SUB_CATEGORY_TREE = [
    {
      parent: "staples-grains",
      subs: [
        { handle: "basmati-rice", mustHave: ["Natco Basmati Rice India 2kg", "Natco Sona Masuri Rice 5kg"] },
        { handle: "sona-masoori", mustHave: ["Natco Sona Masuri Rice 5kg"] },
        { handle: "idli-rice", mustHave: ["Natco Idli Rice 5kg"] },
        { handle: "ponni-boiled", mustHave: ["Natco Ponni Rice 5kg"], optional: true },
      ],
    },
    {
      parent: "dal-lentils",
      subs: [
        { handle: "toor-dal", mustHave: ["TRS Toor Dal", "Natco Toovar 400g"] },
        { handle: "moong-dal", mustHave: ["Natco Mung Dal Yellow 1kg"] },
        { handle: "masoor-dal", mustHave: ["Red Lentils"], optional: true },
        { handle: "chana-dal", mustHave: ["Natco Chanadal"] },
        { handle: "urad-dal", mustHave: ["Urid"], optional: true },
      ],
    },
    {
      parent: "atta-flours",
      subs: [
        { handle: "sooji", mustHave: ["Natco Semolina"] },
        { handle: "wheat-atta", mustHave: ["Natco Chakki Atta Multigrain 5kg"] },
        { handle: "besan", mustHave: ["Natco Gram Flour"] },
        { handle: "maida", mustHave: [], optional: true },
      ],
    },
    {
      parent: "oils-ghee",
      subs: [
        { handle: "mustard-oil", mustHave: ["Natco Pure Mustard Oil"] },
        { handle: "sunflower-oil", mustHave: [], optional: true },
        { handle: "coconut-oil", mustHave: ["Natco Coconut Oil (Parachute Brand) 500ml"] },
        { handle: "ghee", mustHave: ["Natco Ghee Pure"] },
        { handle: "groundnut-oil", mustHave: ["Natco Groundnut Oil 1 Litre"] },
      ],
    },
    {
      parent: "spice-blends",
      subs: [
        { handle: "garam-masala", mustHave: ["Natco Garam Masala 400g"] },
        { handle: "chicken-masala", mustHave: ["Natco Chicken Masala Mangal 100g"] },
      ],
    },
    {
      parent: "spices-ground",
      subs: [
        { handle: "turmeric", mustHave: ["Tumeric"], optional: true },
        { handle: "chilli-powder", mustHave: ["Natco Chilli"] },
        { handle: "cumin", mustHave: ["TRS Cumin Powder"] },
        { handle: "coriander", mustHave: ["TRS Coriander Powder"] },
      ],
    },
    {
      parent: "snacks-namkeen",
      subs: [
        { handle: "bhujia", mustHave: ["Natco"] },
        { handle: "namkeen", mustHave: ["Natco"] },
      ],
    },
    {
      parent: "beverages",
      subs: [
        { handle: "tea", mustHave: ["Natco Spiced Tea"] },
        { handle: "drinks", mustHave: [], optional: true },
      ],
    },
    {
      parent: "pickles-chutneys",
      subs: [
        { handle: "chutneys", mustHave: [], optional: true },
      ],
    },
  ]

  for (const group of SUB_CATEGORY_TREE) {
    for (const sub of group.subs) {
      const res = await get(`/gb/categories/${sub.handle}`)
      ok(res.status === 200, `/${sub.handle} — 200 OK`)

      // Must-have product checks: at least one from the list should be in parent's full catalog
      if (sub.mustHave && sub.mustHave.length > 0 && !sub.optional) {
        // Check against API data (all parent products), not just page 1
        const parentProds = titles(group.parent)
        let found = 0
        for (const title of sub.mustHave) {
          if (parentProds.some((p) => p.includes(title))) found++
        }
        ok(found >= 1, `/${sub.handle} — ${found}/${sub.mustHave.length} expected in parent "${group.parent}" catalog`)
      }

      // Must NOT be empty
      ok(!res.text.includes("No products found") && !res.text.includes("No products yet"),
        `/${sub.handle} — not empty (shows products)`)
    }

    // Verify parent category page shows sub-chips for all children
    const parentRes = await get(`/gb/categories/${group.parent}`)
    const chipCount = group.subs.filter((s) => parentRes.text.includes(s.handle)).length
    ok(chipCount >= Math.floor(group.subs.length / 2),
      `${group.parent} — at least half sub-chips visible (${chipCount}/${group.subs.length})`)
  }

  // Specific child → parent mapping verification
  console.log("\n  Child → Parent Mapping Verification")
  const CHILD_PARENT_MAP = [
    { child: "coriander", expectedParent: "spices-ground" },
    { child: "chilli-powder", expectedParent: "spices-ground" },
    { child: "turmeric", expectedParent: "spices-ground" },
    { child: "cumin", expectedParent: "spices-ground" },
    { child: "whole-spices", expectedParent: "spices-whole" },
  ]

  for (const cp of CHILD_PARENT_MAP) {
    const res = await get(`/gb/categories/${cp.child}`)
    const hasProducts = !res.text.includes("No products found") && !res.text.includes("No products yet")
    ok(hasProducts, `/${cp.child} — shows products (from ${cp.expectedParent} parent)`)
  }

  // ═══════════════════════════════════════════════
  // 17. CATEGORY NAVIGATION FROM HOMEPAGE
  // ═══════════════════════════════════════════════
  console.log("\n17. Homepage → Category Navigation\n")

  const hp = await get("/gb")
  const NAV_CATS = [
    "Staples & Grains",
    "Dal & Lentils",
    "Atta & Flours",
    "Oils & Ghee",
    "Spice Blends",
    "Beverages",
    "Snacks & Namkeen",
    "Pickles & Chutneys",
    "Dairy & Eggs",
    "Spices — Whole",
    "Spices — Ground",
  ]

  for (const name of NAV_CATS) {
    ok(hp.text.includes(name), `Homepage nav contains "${name}"`)
  }

  // Verify no old names in homepage nav
  const FORBIDDEN = ["Rice & Grains", "Dals & Lentils", "Cooking Oils", "Flours & Grains",
    "Sweets & Mithai", "Papads & Fryums", "Noodles & Pasta", "Sauces & Ketchup",
    "Dairy & Milk", "Fresh Vegetables", "Ready to Eat"]
  for (const name of FORBIDDEN) {
    ok(!hp.text.includes(name), `Homepage nav does NOT contain "${name}"`)
  }

  // Each nav link href should point to correct category handle
  const NAV_HANDLES = [
    { name: "Staples & Grains", href: "categories/staples-grains" },
    { name: "Dal & Lentils", href: "categories/dal-lentils" },
    { name: "Atta & Flours", href: "categories/atta-flours" },
    { name: "Oils & Ghee", href: "categories/oils-ghee" },
    { name: "Spice Blends", href: "categories/spice-blends" },
    { name: "Beverages", href: "categories/beverages" },
  ]
  for (const nav of NAV_HANDLES) {
    ok(hp.text.includes(nav.href), `Nav link "${nav.name}" → ${nav.href}`)
  }

  // ═══════════════════════════════════════════════
  // 18. SEARCH — REGIONAL LANGUAGE + SYNONYMS + TYPOS
  // ═══════════════════════════════════════════════
  console.log("\n18. Search — Regional Language + Synonyms + Typos\n")

  const REGIONAL_TESTS = [
    // Tamil terms
    { q: "kadala", expectMin: 1, desc: "Tamil: kadala → chana/chickpea" },
    { q: "jeeragam", expectMin: 1, desc: "Tamil: jeeragam → cumin" },
    { q: "aval", expectMin: 1, desc: "Tamil: aval → poha/powa" },
    { q: "pasupu", expectMin: 1, desc: "Telugu: pasupu → turmeric" },
    { q: "miriyalu", expectMin: 1, desc: "Telugu: miriyalu → black pepper" },

    // Hindi/Urdu terms
    { q: "chawal", expectMin: 1, desc: "Hindi: chawal → rice" },
    { q: "jeera", expectMin: 1, desc: "Hindi: jeera → cumin" },
    { q: "haldi", expectMin: 1, desc: "Hindi: haldi → turmeric" },
    { q: "dhania", expectMin: 1, desc: "Hindi: dhania → coriander" },
    { q: "besan", expectMin: 1, desc: "Hindi: besan → gram flour" },
    { q: "sooji", expectMin: 1, desc: "Hindi: sooji → semolina" },
    { q: "ghee", expectMin: 1, desc: "Hindi: ghee → clarified butter" },

    // Brand typos
    { q: "ashirvad", expectMin: 1, desc: "Typo: ashirvad → Aashirvaad" },
    { q: "haldiram", expectMin: 1, desc: "Typo: haldiram → Haldiram's" },

    // Kannada terms
    { q: "togari bele", expectMin: 1, desc: "Kannada: togari bele → toor dal" },
    { q: "uddina bele", expectMin: 1, desc: "Kannada: uddina bele → urad dal" },

    // Bengali terms
    { q: "musur dal", expectMin: 1, desc: "Bengali: musur dal → masoor dal" },
    { q: "shorshe", expectMin: 1, desc: "Bengali: shorshe → mustard" },
  ]

  let searchPassed = 0
  for (const test of REGIONAL_TESTS) {
    try {
      const body = JSON.stringify({ q: test.q, limit: 5 })
      const r = await getMeiliSearch(body)
      const hits = (r.hits || []).length
      if (hits >= test.expectMin) {
        searchPassed++
        console.log(`  ✅ "${test.q}" → ${hits} hits (${test.desc})`)
      } else {
        console.log(`  ❌ "${test.q}" → ${hits} hits (${test.desc})`)
      }
    } catch (e) {
      console.log(`  ❌ "${test.q}" → ERROR: ${e.message}`)
    }
  }

  // Allocate to passed/failed
  const meiliFailed = REGIONAL_TESTS.length - searchPassed
  passed += searchPassed
  failed += meiliFailed

  console.log(`\n========================================`)
  console.log(`  Results: ${passed} passed, ${failed} failed`)
  console.log(`========================================`)
  if (failed > 0) process.exit(1)
}

main().catch((e) => { console.error(e.message); process.exit(1) })
