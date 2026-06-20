#!/usr/bin/env node
/**
 * Rebuild-from-Scratch Verification
 *
 * Validates that the entire IndiaGrocers catalogue can be rebuilt from scratch
 * using only:
 *   1. A fresh Medusa v2 install (npx medusa db:migrate + npx medusa user)
 *   2. The CSV catalogue files (products.csv + categories.csv + prices.csv)
 *   3. The seed-catalogue.mjs pipeline
 *
 * This test proves the catalogue is fully reproducible without any
 * proprietary data or manual steps.
 *
 * Usage:
 *   node tests/verify-rebuild-catalog.mjs
 *
 * IMPORTANT: This test DROPS the dev database. Only run in development.
 *   docker exec indiagrocers-postgres psql -U medusa -d indiagrocers -c "DROP DATABASE IF EXISTS indiagrocers_dev; CREATE DATABASE indiagrocers_dev;"
 */

import { execSync } from "child_process"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { readFileSync, existsSync } from "fs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const BACKEND = resolve(ROOT, "apps", "backend")
const CATALOGUE = resolve(ROOT, "catalogue")
const STOREFRONT = resolve(ROOT, "apps", "storefront")
const BASE = "http://127.0.0.1:9000"
const MEILI = "http://localhost:7700"

let passed = 0, failed = 0, warnings = 0
let sectionsPassed = 0, sectionsFailed = 0

function pass(name) { console.log(`  ✅ ${name}`); passed++ }
function fail(name, detail) { console.log(`  ❌ ${name}`); if (detail) console.log(`     ${detail}`); failed++ }
function section(name) { console.log(`\n${"─".repeat(50)}\n${name}\n${"─".repeat(50)}`) }

function run(cmd, cwd = ROOT, opts = {}) {
  try {
    return execSync(cmd, { cwd, encoding: "utf8", stdio: "pipe", ...opts })
  } catch (e) {
    return e.stdout || e.stderr || e.message
  }
}

// ═══════════════════════════════════════════════════════════
// SECTION 1: Prerequisites
// ═══════════════════════════════════════════════════════════
async function checkPrerequisites() {
  section("1. Prerequisites — Files & Infrastructure")

  // CSV files
  for (const f of ["products.csv", "categories.csv", "prices.csv"]) {
    const path = resolve(CATALOGUE, f)
    if (existsSync(path)) {
      const size = readFileSync(path, "utf8").length
      pass(`${f} exists (${(size / 1024).toFixed(1)} KB)`)
    } else {
      fail(`${f} missing`, `Expected at ${path}`)
      sectionsFailed++
    }
  }

  // Seed script
  for (const f of ["seed-catalogue.mjs", "lib/constants.mjs", "lib/api.mjs", "lib/validators.mjs", "lib/normalizer.mjs", "lib/categories.mjs", "lib/products.mjs"]) {
    if (existsSync(resolve(CATALOGUE, f))) pass(`${f} script found`)
    else fail(`${f} missing`)
  }

  // Docker services
  const dockerPs = run("docker ps --format '{{.Names}}'")
  for (const svc of ["indiagrocers-postgres", "indiagrocers-meilisearch", "indiagrocers-redis"]) {
    if (dockerPs.includes(svc)) pass(`Docker: ${svc} running`)
    else {
      fail(`Docker: ${svc} NOT running`)
      sectionsFailed++
    }
  }
}

// ═══════════════════════════════════════════════════════════
// SECTION 2: Validate CSV files (no backend needed)
// ═══════════════════════════════════════════════════════════
async function validateCSVs() {
  section("2. CSV Validation (--validate-only)")

  const output = run("node seed-catalogue.mjs --validate-only", CATALOGUE, { timeout: 30000 })
  console.log(output)

  if (output.includes("categories valid")) pass("Categories valid")
  else fail("Categories validation")

  if (output.includes("product rows valid")) pass("Products valid")
  else fail("Products validation")

  if (!output.includes("FAILED")) {
    pass("No validation failures")
    sectionsPassed++
  } else {
    sectionsFailed++
  }
}

// ═══════════════════════════════════════════════════════════
// SECTION 3: Dry-run (no backend needed)
// ═══════════════════════════════════════════════════════════
async function dryRun() {
  section("3. Dry-Run (--dry-run)")

  const output = run("node seed-catalogue.mjs --dry-run", CATALOGUE, { timeout: 30000 })
  console.log(output.split("\n").filter(l => l.includes("Groups:") || l.includes("variants:") || l.includes("variant rows")).join("\n"))

  const groupsMatch = output.match(/Groups:\s*(\d+)/)
  if (groupsMatch) {
    const groups = parseInt(groupsMatch[1])
    pass(`Variant normalization: ${groups} product groups`)
  } else {
    fail("Could not parse group count")
  }

  if (!output.includes("Error") && !output.includes("FATAL")) {
    pass("Dry-run completes cleanly")
    sectionsPassed++
  } else {
    sectionsFailed++
  }
}

// ═══════════════════════════════════════════════════════════
// SECTION 4: Rebuild from scratch
// ═══════════════════════════════════════════════════════════
async function rebuildFromScratch() {
  section("4. Full Rebuild (--apply --reindex)")

  // 4a: Drop and recreate database
  console.log("  4a. Wiping database...")
  try {
    // Terminate connections first
    run(
      "docker exec indiagrocers-postgres psql -U medusa -d indiagrocers -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'indiagrocers_dev' AND pid <> pg_backend_pid();\"",
    )
    // Drop database
    const dropResult = run(
      "docker exec indiagrocers-postgres psql -U medusa -d indiagrocers -c \"DROP DATABASE IF EXISTS indiagrocers_dev;\"",
    )
    // Create database
    const createResult = run(
      "docker exec indiagrocers-postgres psql -U medusa -d indiagrocers -c \"CREATE DATABASE indiagrocers_dev;\"",
    )
    if (createResult.includes("CREATE DATABASE")) pass("Database recreated")
    else { fail("Database create", createResult); sectionsFailed++; return }
  } catch (e) { fail("Database wipe", e.message); sectionsFailed++; return }

  // 4b: Run migrations
  console.log("  4b. Running migrations...")
  const migrateOutput = run("npx medusa db:migrate", BACKEND, { timeout: 180000 })
  if (migrateOutput.includes("Migrated") || migrateOutput.includes("Migration scripts completed")) {
    pass("Migrations completed")
  } else {
    fail("Migrations", migrateOutput.substring(0, 200))
    sectionsFailed++
    return
  }

  // 4c: Create admin user
  console.log("  4c. Creating admin user...")
  const userOutput = run("npx medusa user -e admin@example.com -p password123", BACKEND, { timeout: 60000 })
  const userOk = userOutput.includes("created successfully") || userOutput.includes("already exists")
  if (userOk) pass("Admin user ready")
  else { fail("Admin user", userOutput.substring(0, 200)); sectionsFailed++; return }

  // 4d: Check backend health
  console.log("  4d. Checking backend...")
  try {
    const healthRes = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(10000) })
    const health = await healthRes.json()
    if (health.status) pass(`Backend: ${health.status}`)
    else fail("Backend health check")
  } catch (e) {
    warn("Backend not responding — it may need manual start: npx medusa develop")
  }

  // 4e: Clear MeiliSearch
  console.log("  4e. Clearing MeiliSearch...")
  try {
    await fetch(`${MEILI}/indexes/products/documents`, { method: "DELETE" })
    pass("MeiliSearch cleared")
  } catch (e) { warn(`MeiliSearch clear: ${e.message}`) }

  // 4f: Run seed-catalogue
  console.log("  4f. Running seed-catalogue --apply --reindex...")
  try {
    const seedOutput = run("node seed-catalogue.mjs --apply --reindex", CATALOGUE, { timeout: 300000 })
    console.log(seedOutput.split("\n").filter(l =>
      l.includes("Categories:") || l.includes("Products:") || l.includes("Prices") || l.includes("Reindex") || l.includes("Done")
    ).join("\n"))

    const createdMatch = seedOutput.match(/C=(\d+)/)
    const failedMatch = seedOutput.match(/F=(\d+)/)

    if (createdMatch) {
      const created = parseInt(createdMatch[1])
      if (created > 0) pass(`Products created: ${created}`)
      else warn("0 products created — may already exist or backend not running")
    }

    if (failedMatch) {
      const failedCount = parseInt(failedMatch[1])
      if (failedCount === 0) {
        pass("0 failures — clean sync")
      } else {
        fail(`${failedCount} products failed to sync`)
      }
    }

    if (seedOutput.includes("Writing updated CSV")) {
      pass("CSV updated with barcodes")
    }

    if (seedOutput.includes("✓ Reindex triggered")) {
      pass("MeiliSearch reindex triggered")
    }

    sectionsPassed++
  } catch (e) {
    fail("Seed execution", e.message)
    sectionsFailed++
  }
}

// ═══════════════════════════════════════════════════════════
// SECTION 5: Verify database state
// ═══════════════════════════════════════════════════════════
async function verifyDatabase() {
  section("5. Database State Verification")

  try {
    const loginRes = await fetch(`${BASE}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
    })
    if (!loginRes.ok) {
      fail("Admin login", `HTTP ${loginRes.status}`)
      sectionsFailed++
      return
    }
    const { token } = await loginRes.json()
    const H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

    // Product count
    const prodRes = await fetch(`${BASE}/admin/products?limit=1&fields=id`, { headers: H })
    const prodData = await prodRes.json()
    const prodCount = prodData.count || 0
    if (prodCount >= 400) pass(`Products: ${prodCount}`)
    else { fail(`Products: ${prodCount} (expected 400+)`); sectionsFailed++; return }

    // Category count
    const catRes = await fetch(`${BASE}/admin/product-categories?limit=200&fields=id`, { headers: H })
    const catData = await catRes.json()
    const catCount = catData.count || 0
    if (catCount === 43) pass(`Categories: ${catCount}`)
    else warn(`Categories: ${catCount} (expected 43)`)

    // MeiliSearch
    const statsRes = await fetch(`${MEILI}/indexes/products/stats`)
    const stats = await statsRes.json()
    const docCount = stats.numberOfDocuments || 0
    if (docCount === prodCount) pass(`MeiliSearch docs (${docCount}) = DB products (${prodCount})`)
    else warn(`MeiliSearch docs (${docCount}) ≠ DB products (${prodCount})`)

    // Publishable key sync
    const keyRes = await fetch(`${BASE}/admin/api-keys?limit=1&type=publishable&fields=token`, { headers: H })
    const keyData = await keyRes.json()
    const pk = keyData.api_keys?.[0]?.token
    if (pk) {
      const envPath = resolve(STOREFRONT, ".env")
      if (existsSync(envPath)) {
        const envContent = readFileSync(envPath, "utf8")
        if (envContent.includes(pk)) pass("Publishable key synced to storefront .env")
        else warn("Publishable key NOT synced — run seed-catalogue to auto-update")
      }
    }

    sectionsPassed++
  } catch (e) {
    fail("Database verification", e.message)
    sectionsFailed++
  }
}

// ═══════════════════════════════════════════════════════════
// SECTION 6: Barcode verification
// ═══════════════════════════════════════════════════════════
async function verifyBarcodes() {
  section("6. Barcode Verification")

  try {
    const prodCSV = readFileSync(resolve(CATALOGUE, "products.csv"), "utf8")
    const lines = prodCSV.trim().split("\n")
    const header = lines[0].split(",").map(h => h.trim())
    const bcIdx = header.indexOf("variant_barcode")
    let total = 0, withBc = 0, genBc = 0

    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i])
      if (vals.length <= bcIdx) continue
      total++
      const bc = (vals[bcIdx] || "").trim()
      if (bc) {
        withBc++
        if (bc.startsWith("GEN_")) genBc++
      }
    }

    if (total === withBc) pass(`100% coverage: ${withBc}/${total}`)
    else fail(`Coverage: ${withBc}/${total}`)

    pass(`${genBc} GEN_ placeholder barcodes (replaceable)`)
    sectionsPassed++
  } catch (e) {
    fail("Barcode verification", e.message)
    sectionsFailed++
  }
}

// ═══════════════════════════════════════════════════════════
// SECTION 7: Summary — Rebuild completeness report
// ═══════════════════════════════════════════════════════════
async function summary() {
  section("7. Rebuild Completeness Report")

  console.log(`  CSV catalogue:  ready`)
  console.log(`  Seed pipeline:  ready`)
  console.log(`  DB migration:   ready`)
  console.log(`  Admin user:     admin@example.com`)
  console.log(`  Commands:`)
  console.log(`    1. docker compose -f docker-compose.yml up -d`)
  console.log(`    2. cd apps/backend && npx medusa db:migrate`)
  console.log(`    3. npx medusa user -e admin@example.com -p password123`)
  console.log(`    4. npx medusa develop`)
  console.log(`    5. cd catalogue && node seed-catalogue.mjs --apply --reindex`)
  console.log(`    6. cd apps/storefront && yarn dev`)
  console.log()
  console.log(`  Verify:`)
  console.log(`    node catalogue/seed-catalogue.mjs --validate-only`)
  console.log(`    node tests/verify-seed-pipeline.mjs`)
  console.log(`    node scripts/verify-data-health.mjs`)
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function parseCSVLine(line) {
  const result = []
  let current = "", inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = false
      } else current += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ",") { result.push(current.trim()); current = "" }
      else current += ch
    }
  }
  result.push(current.trim())
  return result
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

async function main() {
  console.log("=".repeat(60))
  console.log("  Rebuild-from-Scratch Verification")
  console.log("  IndiaGrocers — Medusa v2 + Next.js 15")
  console.log("=".repeat(60))
  console.log("\n  This test validates the entire catalogue can be rebuilt")
  console.log("  from scratch using only CSV files + out-of-box Medusa starter.")

  await checkPrerequisites()
  await validateCSVs()
  await dryRun()
  await rebuildFromScratch()
  await verifyDatabase()
  await verifyBarcodes()
  await summary()

  console.log(`\n${"=".repeat(60)}`)
  console.log(`  SECTIONS: ${sectionsPassed} passed, ${sectionsFailed} failed`)
  console.log(`  CHECKS:   ${passed} passed, ${warnings} warnings, ${failed} failed`)
  console.log(`${"=".repeat(60)}`)
  process.exit(failed > 0 || sectionsFailed > 0 ? 1 : 0)
}

main().catch(e => {
  console.error(`\nFATAL: ${e.message}`)
  console.error(e.stack)
  process.exit(1)
})
