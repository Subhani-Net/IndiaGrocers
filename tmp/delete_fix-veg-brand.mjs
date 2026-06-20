import { readFileSync, writeFileSync } from "fs"

const dir = "../tmp/catalog-rebuild/"
const vegHandles = ["indian-onion","mud-potato","ginger","garlic","okra","green-chillies","bottle-gourd","bitter-gourd","drumsticks","tindora","curry-leaves","vine-tomato","green-lime","coconut","small-onion","green-plantains","cassava","arbi"]

function parseCSVLine(line) {
  const r = [], n = line.length
  let i = 0, c = "", q = false
  while (i < n) {
    const ch = line[i]
    if (q) {
      if (ch === '"') {
        if (i + 1 < n && line[i + 1] === '"') { c += '"'; i += 2; continue }
        else { q = false; i++; continue }
      }
      c += ch; i++
    } else {
      if (ch === '"') { q = true; i++; continue }
      if (ch === ",") { r.push(c.trim()); c = ""; i++; continue }
      c += ch; i++
    }
  }
  r.push(c.trim())
  return r
}

// Fix products-v2.csv (brand_slug column)
const prodText = readFileSync(dir + "products.csv", "utf8").replace(/\r\n/g, "\n")
const pLines = prodText.split("\n")
const pHdr = pLines[0].split(",").map(h => h.trim())
const bsIdx = pHdr.indexOf("brand_slug")
const phIdx = pHdr.indexOf("handle")
const pOut = [pLines[0]]

for (let i = 1; i < pLines.length; i++) {
  const line = pLines[i].trim()
  if (!line) { pOut.push(""); continue }
  const vals = parseCSVLine(line)
  const h = (vals[phIdx] || "").trim()
  if (vegHandles.includes(h)) vals[bsIdx] = "fresh_veg"
  pOut.push(vals.join(","))
}
writeFileSync(dir + "products.csv", pOut.join("\n") + "\n", "utf8")
console.log(`Fixed ${vegHandles.length} vegetables in products.csv`)

// Fix variants.csv — re-enhance with corrected brand_handle
const enhance = await import("./enhance-variants.mjs")
