import { readFileSync, writeFileSync } from "fs"

const text = readFileSync("../catalogue/products.csv", "utf8").replace(/\r\n/g, "\n")
const lines = text.split("\n")
const header = lines[0]

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

function csvQuote(val) {
  if (!val) return ""
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return '"' + val.replace(/"/g, '""') + '"'
  }
  return val
}

const out = [header]
let fixed = 0
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim()
  if (!line) { out.push(""); continue }
  const vals = parseCSVLine(line)
  const quoted = vals.map(csvQuote)
  if (quoted.join(",") !== line) fixed++
  out.push(quoted.join(","))
}
writeFileSync("../catalogue/products.csv", out.join("\n") + "\n", "utf8")
console.log("Fixed " + fixed + " rows with commas")
