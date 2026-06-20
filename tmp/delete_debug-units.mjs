// Quick test — why are 240g and 190ml missing from the unit pool?
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

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

function parseUnit(title) {
  const t = title.trim()
  if (!t) return null
  if (/^single$/i.test(t)) {
    return { unit_type: "each", unit_value: 1, unit_label: "piece", display_title: t }
  }
  let m = t.match(/^(\d+)\s*-\s*pack$/i)
  if (m) return { unit_type: "count", unit_value: parseFloat(m[1]), unit_label: "pack", display_title: t }
  m = t.match(/^(\d+)\s*-\s*piece\s*bag$/i)
  if (m) return { unit_type: "count", unit_value: parseFloat(m[1]), unit_label: "piece", display_title: t }
  m = t.match(/^(\d+)\s*x\s*(\d+\.?\d*)\s*(g|kg|ml|l)\s*$/i)
  if (m) return { unit_type: "count", unit_value: parseFloat(m[1]), unit_label: "multipack", display_title: t }
  m = t.match(/^(\d+)\s*teabags?$/i)
  if (m) return { unit_type: "count", unit_value: parseFloat(m[1]), unit_label: "teabag", display_title: t }
  m = t.match(/^(\d+\.?\d*)\s*(g|kg|ml|l|litre|liter|pack|case|piece|bunch|tin|can|jar|bag|pcs|box|oz|lb|fl\.?oz)\b\s*(.*)$/i)
  if (!m) return null
  const rawValue = parseFloat(m[1])
  let rawUnit = m[2].toLowerCase()
  if (["litre","liter"].includes(rawUnit)) rawUnit = "l"
  if (["fl.oz","floz"].includes(rawUnit)) rawUnit = "ml"
  let unitType = "weight"
  if (["l","ml"].includes(rawUnit)) unitType = "volume"
  if (["pack","case","piece","bunch","tin","can","jar","bag","pcs","box"].includes(rawUnit)) unitType = "count"
  if (rawUnit === "each") unitType = "each"
  let value = rawValue, label = rawUnit
  if (rawUnit === "ml" && rawValue >= 1000) { value = rawValue / 1000; label = "l" }
  return { unit_type: unitType, unit_value: value, unit_label: label, display_title: title }
}

const raw = readFileSync(resolve(__dirname, "catalog-rebuild", "variants.csv"), "utf8").replace(/\r\n/g, "\n")
const lines = raw.split("\n")
const header = lines[0].split(",").map(h=>h.trim())
for (let i = 1; i < lines.length; i++) {
  const vals = parseCSVLine(lines[i])
  const row = {}
  for (let j = 0; j < header.length; j++) row[header[j]] = (vals[j]||"").trim()

  const title = row.variant_title || row.variant_title_raw || "Default"
  const wv = row.weight_value
  const wu = row.weight_unit

  let unit = parseUnit(title)
  if (!unit && wv && wu) unit = parseUnit(`${wv}${wu}`)

  if (wv === "240" && wu === "g") {
    console.log(`Line ${i+1}: title_raw="${row.variant_title_raw}" wv=${wv} wu=${wu} unit=${JSON.stringify(unit)}`)
  }
  if (wu === "ml" && wv === "190") {
    console.log(`Line ${i+1}: title_raw="${row.variant_title_raw}" wv=${wv} wu=${wu} unit=${JSON.stringify(unit)}`)
  }
}
