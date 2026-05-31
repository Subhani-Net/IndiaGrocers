/**
 * Data Design — Snapshot Manager
 *
 * Usage:
 *   node scripts/snapshot.js save "description"       # Save current state
 *   node scripts/snapshot.js list                      # List all snapshots
 *   node scripts/snapshot.js restore <filename>        # Restore from snapshot
 *   node scripts/snapshot.js apply <dataset> [--dry]   # Apply to DB
 */

import { readFileSync, writeFileSync, copyFileSync, readdirSync, mkdirSync, existsSync } from "fs"
import { resolve, dirname, basename } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const DATA_DIR = resolve(ROOT, "data-design")
const SNAPSHOT_DIR = resolve(DATA_DIR, "snapshots")
const BASE = "http://127.0.0.1:9000"

const cmd = process.argv[2]
const arg = process.argv[3]
const dryRun = process.argv.includes("--dry")

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
}

function saveSnapshot(description) {
  if (!existsSync(SNAPSHOT_DIR)) mkdirSync(SNAPSHOT_DIR, { recursive: true });

  const ts = timestamp()
  const prefix = `lentils-${ts}`

  const csvPath = resolve(DATA_DIR, "lentils-master.csv")
  const jsonPath = resolve(DATA_DIR, "lentils-master.json")

  if (!existsSync(csvPath)) { console.log("No lentils-master.csv found"); return; }

  copyFileSync(csvPath, resolve(SNAPSHOT_DIR, `${prefix}.csv`))
  if (existsSync(jsonPath)) copyFileSync(jsonPath, resolve(SNAPSHOT_DIR, `${prefix}.json`))

  // Write metadata
  const meta = {
    timestamp: ts,
    description: description || "manual snapshot",
    csv: `${prefix}.csv`,
    json: `${prefix}.json`,
  }
  writeFileSync(resolve(SNAPSHOT_DIR, `${prefix}.meta.json`), JSON.stringify(meta, null, 2))

  console.log(`Snapshot saved: ${prefix}`)
  console.log(`  ${meta.csv}`)
  console.log(`  ${meta.json}`)

  // Copy to snapshot for quick restore
  copyFileSync(csvPath, resolve(SNAPSHOT_DIR, `lentils-latest.csv`))
}

function listSnapshots() {
  if (!existsSync(SNAPSHOT_DIR)) { console.log("No snapshots yet"); return; }

  const files = readdirSync(SNAPSHOT_DIR).filter(f => f.endsWith(".meta.json"))
  console.log(`Snapshots (${files.length}):\n`)
  for (const f of files.sort().reverse()) {
    const meta = JSON.parse(readFileSync(resolve(SNAPSHOT_DIR, f), "utf-8"))
    console.log(`  ${meta.timestamp}  ${meta.description}`)
    console.log(`    ${meta.csv}`)
  }
}

function restoreSnapshot(filename) {
  const src = resolve(SNAPSHOT_DIR, filename)
  if (!existsSync(src)) { console.log(`Snapshot not found: ${filename}`); return; }

  copyFileSync(src, resolve(DATA_DIR, "lentils-master.csv"))
  console.log(`Restored: ${filename} → lentils-master.csv`)
}

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  return { Authorization: `Bearer ${(await res.json()).token}`, "Content-Type": "application/json" }
}

async function applyToDB(dataset) {
  const csvPath = resolve(DATA_DIR, `${dataset}-master.csv`)
  if (!existsSync(csvPath)) { console.log(`File not found: ${csvPath}`); return; }

  const csv = readFileSync(csvPath, "utf-8")
  const lines = csv.trim().split("\n")
  const headers = lines[0].split(",")

  const natcoIdx = headers.indexOf("natco_subcategory")
  const ourIdx = headers.indexOf("our_subcategory")
  const titleIdx = headers.indexOf("title")
  const inCatalogIdx = headers.indexOf("in_our_catalog")

  const rows = lines.slice(1).map(l => {
    const vals = l.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || []
    return vals.map(v => v.replace(/^"/, "").replace(/"$/, "").trim())
  })

  if (dryRun) {
    console.log("DRY RUN — would apply:")
    const changes = rows.filter(r => r[natcoIdx] !== r[ourIdx])
    console.log(`  ${changes.length} changes needed\n`)
    for (const r of changes) {
      console.log(`  ${r[titleIdx]}: ${r[ourIdx]} → ${r[natcoIdx]}`)
    }
    return
  }

  const headers_auth = await login()

  // Fetch categories for handle→ID mapping
  const cats = await (await fetch(`${BASE}/admin/product-categories?limit=300`, { headers: headers_auth })).json()
  const catByHandle = {}
  for (const c of cats.product_categories || []) catByHandle[c.handle] = c

  // Fetch products for title→ID mapping
  const allProducts = []
  let offset = 0
  while (true) {
    const r = await (await fetch(`${BASE}/admin/products?limit=100&offset=${offset}&fields=id,title,handle`, { headers: headers_auth })).json()
    if (!r.products?.length) break
    allProducts.push(...r.products)
    offset += 100
  }
  const prodByTitle = {}
  for (const p of allProducts) prodByTitle[p.title] = p.id

  // Apply assignments
  let changes = 0
  for (const r of rows) {
    const title = r[titleIdx]
    const ourCat = r[ourIdx]
    const natcoCat = r[natcoIdx]
    if (ourCat === natcoCat) continue

    const prodId = prodByTitle[title]
    const catId = catByHandle[natcoCat]?.id
    if (!prodId || !catId) {
      console.log(`  SKIP: ${title} — product or category not found`)
      continue
    }

    try {
      const res = await fetch(`${BASE}/admin/product-categories/${catId}/products`, {
        method: "POST", headers: headers_auth, body: JSON.stringify({ add: [prodId] }),
      })
      if (res.ok) { changes++; console.log(`  ✓ ${title} → ${natcoCat}`) }
      else console.log(`  ✗ ${title}: ${await res.text().then(t => t.slice(0, 80))}`)
    } catch (e) {
      console.log(`  ✗ ${title}: ${e.message}`)
    }
  }

  console.log(`\nApplied: ${changes} changes`)
}

// ─── Main ───

if (cmd === "save") {
  saveSnapshot(arg)
} else if (cmd === "list") {
  listSnapshots()
} else if (cmd === "restore") {
  restoreSnapshot(arg)
} else if (cmd === "apply") {
  await applyToDB(arg || "lentils")
} else {
  console.log(`
Data Design Snapshot Manager

Usage:
  node scripts/snapshot.js save "description"      Save current state
  node scripts/snapshot.js list                    List all snapshots
  node scripts/snapshot.js restore <filename>      Restore from snapshot
  node scripts/snapshot.js apply <dataset> [--dry]  Apply to DB
  `)
}
