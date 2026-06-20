import { readFileSync, writeFileSync } from "fs"

const veg = ["indian-onion","mud-potato","ginger","garlic","okra","green-chillies","bottle-gourd","bitter-gourd","drumsticks","tindora","curry-leaves","vine-tomato","green-lime","coconut","small-onion","green-plantains","cassava","arbi"]
const txt = readFileSync("../catalogue/products-v2.csv", "utf8").replace(/\r\n/g, "\n")
const lines = txt.split("\n")
const hdr = lines[0].split(",").map(h => h.trim())
const bsIdx = hdr.indexOf("brand_slug")
const hIdx = hdr.indexOf("handle")
const stIdx = hdr.indexOf("status")

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

const out = [lines[0]]
let fixed = 0
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim()
  if (!line) { out.push(""); continue }
  const vals = parseCSVLine(line)
  const h = (vals[hIdx] || "").trim()
  if (veg.includes(h)) {
    vals[bsIdx] = "fresh_veg"
    if (vals[stIdx]) vals[stIdx] = "published"
    fixed++
  }
  out.push(vals.join(","))
}
writeFileSync("../catalogue/products-v2.csv", out.join("\n") + "\n", "utf8")
console.log(`Fixed ${fixed} vegetable brand_slug to fresh_veg`)
