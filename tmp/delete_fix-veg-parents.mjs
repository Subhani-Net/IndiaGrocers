import { readFileSync, writeFileSync } from "fs"

const text = readFileSync("../catalogue/products-v2.csv", "utf8").replace(/\r\n/g, "\n")
const lines = text.split("\n")
const header = lines[0]
const cols = header.split(",").map(h => h.trim())
const hIdx = cols.indexOf("handle")
const ctIdx = cols.indexOf("category_handle")
const descIdx = cols.indexOf("description")
const titleIdx = cols.indexOf("product_title")
const stIdx = cols.indexOf("status")
const bsIdx = cols.indexOf("brand_slug")

const veg = {
  garlic: { title: "Garlic", desc: "Fresh garlic bulbs. Essential for almost every Indian dish.", cat: "fresh_veg" },
  okra: { title: "Okra / Bhindi", desc: "Fresh okra. The most popular Indian vegetable.", cat: "fresh_veg" },
  "green-chillies": { title: "Green Chillies", desc: "Fresh Indian green chillies. Essential for tempering and chutneys.", cat: "fresh_veg" },
  "bottle-gourd": { title: "Bottle Gourd / Dudhi", desc: "Fresh bottle gourd. Mild and versatile.", cat: "fresh_veg" },
  "vine-tomato": { title: "Vine Tomato", desc: "Fresh vine tomatoes. Essential for rasam and South Indian curries.", cat: "fresh_veg" },
  "green-lime": { title: "Green Lime", desc: "Fresh green limes. Essential for pickles and daily cooking.", cat: "fresh_veg" },
  coconut: { title: "Coconut", desc: "Fresh whole coconut. Essential for South Indian chutneys and curries.", cat: "fresh_veg" },
  "green-plantains": { title: "Green Plantains", desc: "Fresh green plantains. Used for chips and curries.", cat: "fresh_veg" },
}

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
      if (ch === ",") { r.push(c); c = ""; i++; continue }
      c += ch; i++
    }
  }
  r.push(c)
  return r
}

const out = [header]
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim()
  if (!line) { out.push(""); continue }
  const vals = parseCSVLine(line)
  const h = (vals[hIdx] || "").trim()
  if (veg[h]) {
    vals[titleIdx] = veg[h].title
    vals[descIdx] = veg[h].desc
    vals[ctIdx] = veg[h].cat
    vals[stIdx] = "published"
    vals[bsIdx] = "generic"
  }
  out.push(vals.join(","))
}
writeFileSync("../catalogue/products-v2.csv", out.join("\n") + "\n", "utf8")
console.log("Fixed 8 vegetable parents")
