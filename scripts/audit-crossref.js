const fs = require("fs")
const path = require("path")

const DIR = "D:/Dump/IndiaGrocers-Fix/data-design"
const files = fs.readdirSync(DIR).filter(f => f.endsWith("-master.csv"))
const all = {}
const byFile = {}

for (const f of files) {
  const csv = fs.readFileSync(path.join(DIR, f), "utf-8")
  const lines = csv.trim().split("\n").slice(1)
  byFile[f] = lines.length
  for (const l of lines) {
    const cols = l.split(",")
    const handle = cols[0].replace(/"/g, "").trim()
    if (!handle) continue
    if (!all[handle]) all[handle] = { files: [], titles: [] }
    all[handle].files.push(f)
    all[handle].titles.push((cols[1] || "").replace(/"/g, "").trim())
  }
}

const unique = Object.keys(all).length
const total = Object.values(byFile).reduce((a, b) => a + b, 0)
const inMultiple = Object.entries(all).filter(function(e) { return e[1].files.length > 1 })

console.log("=== CROSS-REFERENCE AUDIT ===\n")
console.log("Total rows across all CSVs:", total)
console.log("Unique handles:", unique)
console.log("In multiple CSVs:", inMultiple.length, "\n")

console.log("Per-file breakdown:")
const sorted = Object.entries(byFile).sort()
for (const entry of sorted) {
  const f = entry[0]
  const c = entry[1]
  const csv = fs.readFileSync(path.join(DIR, f), "utf-8")
  const uniq = new Set()
  csv.trim().split("\n").slice(1).forEach(function(l) {
    const h = l.split(",")[0].replace(/"/g, "").trim()
    if (h) uniq.add(h)
  })
  const newCount = csv.trim().split("\n").filter(function(l) { return l.includes("NEW") || l.includes("in_shopify_only") }).length
  console.log("  " + f.padEnd(35) + String(c).padStart(3) + " rows  " + String(newCount).padStart(3) + " new/unique")
}

console.log("\nOverlapping handles (" + inMultiple.length + "):")
inMultiple.sort(function(a, b) { return b[1].files.length - a[1].files.length })
inMultiple.slice(0, 20).forEach(function(entry) {
  const h = entry[0]
  const d = entry[1]
  const titles = d.titles.filter(function(t, i, arr) { return arr.indexOf(t) === i }).join(" | ")
  console.log("  " + h.padEnd(42) + d.files.join(" + "))
  if (titles) console.log("    -> " + titles)
})

// VS Medusa catalog
console.log("\n--- VS MEDUSA CATALOG ---")
const pk = "pk_736cac65cdf91adefa6c0180c37a29f00047518c60376efb84586432312a2d00"
fetch("http://127.0.0.1:9000/store/products?limit=300&fields=id,title,handle", {
  headers: { "x-publishable-api-key": pk },
}).then(function(r) { return r.json() }).then(function(data) {
  const prods = data.products || []
  const ourHandles = new Set(prods.map(function(p) { return p.handle }))
  let inCatalog = 0, notInCatalog = 0
  Object.keys(all).forEach(function(handle) {
    if (ourHandles.has(handle)) inCatalog++
    else notInCatalog++
  })
  console.log("Products in our DB:", prods.length)
  console.log("Natco handles in our DB:", inCatalog)
  console.log("Natco handles NOT in our DB:", notInCatalog)
}).catch(function() {
  console.log("Backend not running - skipped catalog cross-reference")
})
