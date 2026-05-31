import { readFileSync, readdirSync } from "fs"
import { resolve } from "path"

const DIR = resolve("D:/Dump/IndiaGrocers-Fix/data-design")
const files = readdirSync(DIR).filter(f => f.endsWith("-master.csv"))
const all = {}
const byFile = {}

for (const f of files) {
  const csv = readFileSync(resolve(DIR, f), "utf-8")
  const lines = csv.trim().split("\n").slice(1)
  byFile[f] = lines.length
  for (const l of lines) {
    const cols = l.split(",")
    const handle = cols[0].replace(/"/g, "").trim()
    if (!handle) continue
    if (!all[handle]) all[handle] = { files: [], titles: [] }
    all[handle].files.push(f)
    all[handle].titles.push(cols[1]?.replace(/"/g, "").trim())
  }
}

const unique = Object.keys(all).length
const total = Object.values(byFile).reduce((a, b) => a + b, 0)
const inMultiple = Object.entries(all).filter(([, v]) => v.files.length > 1)

console.log("=== CROSS-REFERENCE AUDIT ===\n")
console.log("Total rows across all CSVs:", total)
console.log("Unique handles:", unique)
console.log("In multiple CSVs:", inMultiple.length, "\n")

console.log("Per-file breakdown:")
for (const [f, c] of Object.entries(byFile).sort()) {
  const csv = readFileSync(resolve(DIR, f), "utf-8")
  const uniq = new Set()
  csv.trim().split("\n").slice(1).forEach(l => {
    const h = l.split(",")[0].replace(/"/g, "").trim()
    if (h) uniq.add(h)
  })
  console.log(`  ${f.padEnd(35)} ${String(c).padStart(3)} rows  ${String(uniq.size).padStart(3)} unique`)
}

console.log(`\nOverlapping handles (${inMultiple.length}):`)
for (const [h, d] of inMultiple.sort((a, b) => b[1].files.length - a[1].files.length)) {
  const titles = [...new Set(d.titles)].join(" | ")
  console.log(`  ${h.padEnd(42)} ${d.files.join(" + ")}`)
  if (titles) console.log(`    → ${titles}`)
}

// Check against our 265 products
console.log("\n--- VS MEDUSA CATALOG ---")
const pk = "pk_736cac65cdf91adefa6c0180c37a29f00047518c60376efb84586432312a2d00"
try {
  const r = await fetch(`http://127.0.0.1:9000/store/products?limit=300&fields=id,title,handle`, {
    headers: { "x-publishable-api-key": pk },
  })
  const prods = (await r.json()).products || []
  const ourHandles = new Set(prods.map((p: any) => p.handle))
  
  let inCatalog = 0, notInCatalog = 0
  for (const [handle] of Object.entries(all)) {
    if (ourHandles.has(handle)) inCatalog++
    else notInCatalog++
  }
  
  console.log(`Products in our DB: ${prods.length}`)
  console.log(`Natco handles in our DB: ${inCatalog}`)
  console.log(`Natco handles NOT in our DB: ${notInCatalog}`)
} catch {
  console.log("Backend not running — skipped catalog cross-reference")
}
