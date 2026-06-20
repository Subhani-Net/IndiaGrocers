import { readFileSync, writeFileSync } from "fs"

const csv = readFileSync("products.csv", "utf8").replace(/\r\n/g, "\n")
const lines = csv.split("\n")
const header = lines[0].split(",").map(h => h.trim())
const bsIdx = header.indexOf("brand_slug")
const stIdx = header.indexOf("status")
const tiIdx = header.indexOf("product_title")

function detect(title) {
  const t = (title || "").toLowerCase()
  if (t.startsWith("natco")) return "natco"
  if (t.startsWith("trs")) return "trs"
  if (t.startsWith("east end")) return "east-end"
  if (t.startsWith("shan")) return "shan"
  if (t.startsWith("mdh")) return "mdh"
  if (t.startsWith("brooke bond")) return "brooke-bond"
  if (t.startsWith("tata")) return "tata-gold"
  if (t.startsWith("wagh bakri")) return "wagh-bakri"
  if (t.startsWith("hamdard")) return "hamdard"
  if (t.startsWith("bovonto")) return "bovonto"
  if (t.startsWith("bru ")) return "bru"
  if (t.startsWith("frooti")) return "frooti"
  if (t.startsWith("girnar")) return "girnar"
  if (t.startsWith("leo coffee")) return "leo-coffee"
  if (t.startsWith("nescafe")) return "nescafe"
  if (t.startsWith("parachute")) return "parachute"
  if (t.startsWith("rasna")) return "rasna"
  if (t.startsWith("udhayam")) return "udhayam"
  return "generic"
}

function parseCSVLine(line) {
  const r = []
  let c = "", q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (q) {
      if (ch === '"') { if (line[i + 1] === '"') { c += '"'; i++ } else q = false }
      else c += ch
    } else {
      if (ch === '"') q = true
      else if (ch === ",") { r.push(c.trim()); c = "" }
      else c += ch
    }
  }
  r.push(c.trim())
  return r
}

let fixedB = 0, fixedS = 0
const result = [lines[0]]
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim()
  if (!line) { result.push(""); continue }
  const vals = parseCSVLine(line)
  if (vals.length <= Math.max(bsIdx, stIdx)) { result.push(line); continue }
  const bs = (vals[bsIdx] || "").trim()
  const st = (vals[stIdx] || "").trim()
  const title = tiIdx < vals.length ? (vals[tiIdx] || "") : ""
  if (bs === "0" || !bs) { vals[bsIdx] = detect(title); fixedB++ }
  if (st === "Default" || !["published", "draft", "proposed", "rejected"].includes(st)) { vals[stIdx] = "published"; fixedS++ }
  result.push(vals.join(","))
}
writeFileSync("products.csv", result.join("\n") + "\n", "utf8")
console.log("Fixed: " + fixedB + " brand_slugs, " + fixedS + " statuses")
