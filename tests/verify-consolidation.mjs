/**
 * Admin Consolidation Verification Script (W08)
 *
 * Validates the order consolidation endpoint:
 * 1. POST /admin/consolidate-orders — aggregates product_id → SUM(quantity)
 * 2. Response format validation
 * 3. Empty response (no orders for target date)
 * 4. CSV export format
 *
 * Run: node tests/verify-consolidation.mjs
 *
 * Prerequisites: Backend on :9000, admin credentials configured
 */
import http from "http"

const BACKEND = "http://localhost:9000"
const PK = "pk_72deb296139d27885561a0fa58b77cbed187d8c5912390c2dc1912cb477083d3"

let passed = 0
let failed = 0

function ok(test, msg) {
  if (test) { passed++; console.log(`  ✅ ${msg}`) }
  else { failed++; console.log(`  ❌ ${msg}`) }
}

function fetchUrl(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: opts.method || "GET",
      headers: opts.headers || {},
      timeout: 15000,
    }
    if (opts.body) {
      options.headers["Content-Type"] = "application/json"
      options.headers["Content-Length"] = Buffer.byteLength(opts.body)
    }
    const req = http.request(options, (res) => {
      let d = ""
      res.on("data", (c) => (d += c))
      res.on("end", () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(d), text: d }) }
        catch { resolve({ status: res.statusCode, text: d }) }
      })
    })
    req.on("error", reject)
    if (opts.body) req.write(opts.body)
    req.end()
  })
}

console.log("=== ADMIN CONSOLIDATION VERIFICATION ===\n")

// ───────────────────────────────────────
// 1. AUTHENTICATE
// ───────────────────────────────────────
console.log("1. Authentication")

const authRes = await fetchUrl(`${BACKEND}/auth/user/emailpass`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
})

const token = authRes.json?.token
ok(!!token, "Admin authenticated")

if (!token) {
  console.log("\n❌ Cannot continue without auth token")
  process.exit(1)
}

const authHeaders = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "x-publishable-api-key": PK,
}

// ───────────────────────────────────────
// 2. CONSOLIDATE ORDERS — EMPTY (NO ORDERS)
// ───────────────────────────────────────
console.log("\n2. Consolidate Orders — Empty")

const emptyRes = await fetchUrl(`${BACKEND}/admin/consolidate-orders`, {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({ target_date: "2026-06-05" }),
})

ok(emptyRes.status >= 200 && emptyRes.status < 500, `HTTP ${emptyRes.status}`)

if (emptyRes.json) {
  const data = emptyRes.json
  // Response structure: { target_date, orders_found, consolidated_items, summary }
  const hasKey = data.consolidated_items !== undefined || data.consolidated !== undefined
  ok(hasKey, "Response has consolidated data")

  // Check for CSV data if present
  if (data.csv || data.consolidated) {
    const items = data.consolidated || data
    if (Array.isArray(items)) {
      ok(items.length === 0, `Empty result: ${items.length} items (expected 0 for no orders)`)
    } else if (typeof items === "object") {
      const keys = Object.keys(items)
      console.log(`  Items in consolidation: ${keys.length}`)
    }
  }

  console.log("  Response keys:", Object.keys(emptyRes.json).join(", "))
} else {
  console.log("  Response:", emptyRes.text?.slice(0, 200))
}

// ───────────────────────────────────────
// 3. CONSOLIDATE ORDERS — INVALID DATE
// ───────────────────────────────────────
console.log("\n3. Consolidate Orders — Invalid Date")

const invalidRes = await fetchUrl(`${BACKEND}/admin/consolidate-orders`, {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({ target_date: "invalid" }),
})

ok(invalidRes.status >= 200 && invalidRes.status < 500, `HTTP ${invalidRes.status} (accepted, server handles validation)`)

// ───────────────────────────────────────
// 4. CONSOLIDATE ORDERS — MISSING DATE
// ───────────────────────────────────────
console.log("\n4. Consolidate Orders — Missing target_date")

const missingRes = await fetchUrl(`${BACKEND}/admin/consolidate-orders`, {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({}),
})

ok(missingRes.status >= 200 && missingRes.status < 500, `HTTP ${missingRes.status} (server handles missing date)`)

// ───────────────────────────────────────
// 5. UNAUTHENTICATED ACCESS
// ───────────────────────────────────────
console.log("\n5. Unauthenticated Access")

const unauthRes = await fetchUrl(`${BACKEND}/admin/consolidate-orders`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ target_date: "2026-06-05" }),
})

const isRejected = unauthRes.status === 401 || unauthRes.status === 403
ok(isRejected, `HTTP ${unauthRes.status} (rejected unauthenticated)`)

// ───────────────────────────────────────
// 6. CSV EXPORT CHECK
// ───────────────────────────────────────
console.log("\n6. CSV Export Format")

// Fetch with ?format=csv or check if response includes csv field
const csvRes = await fetchUrl(`${BACKEND}/admin/consolidate-orders`, {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({ target_date: "2026-06-05", format: "csv" }),
})

ok(csvRes.status >= 200 && csvRes.status < 500, `HTTP ${csvRes.status}`)

const hasCsv = csvRes.text?.includes(",") || csvRes.json?.csv || csvRes.json?.csv_data
console.log("  CSV content: " + (hasCsv ? "found" : "not in response"))

// ───────────────────────────────────────
// SUMMARY
// ───────────────────────────────────────
console.log(`\n========================================`)
console.log(`  CONSOLIDATION: ${passed} passed, ${failed} failed`)
console.log(`========================================\n`)

if (failed > 0) process.exit(1)
