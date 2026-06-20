import { readFileSync, writeFileSync } from "fs"

const dir = "../tmp/catalog-rebuild/"
const varsText = readFileSync(dir + "variants.csv", "utf8").replace(/\r\n/g, "\n")
const lines = varsText.split("\n")

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

// Header: insert backup_barcodes after variant_barcode (index 2)
const oldHdr = lines[0].split(",").map(h => h.trim())
const bcIdx = oldHdr.indexOf("variant_barcode")
const newHdr = [...oldHdr.slice(0, bcIdx + 1), "backup_barcodes", ...oldHdr.slice(bcIdx + 1)]
const out = [newHdr.join(",")]

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim()
  if (!line) { out.push(""); continue }
  const vals = parseCSVLine(line)
  // backup_barcodes defaults to first variant_barcode as the primary backup
  const primaryBc = vals[bcIdx] || ""
  const backupBc = primaryBc.startsWith("GEN_") || primaryBc.startsWith("VEG_") ? primaryBc.replace(/^GEN_/, "ALT_") : primaryBc
  const newVals = [...vals.slice(0, bcIdx + 1), backupBc, ...vals.slice(bcIdx + 1)]
  out.push(newVals.join(","))
}

writeFileSync(dir + "variants.csv", out.join("\n") + "\n", "utf8")
console.log(`backup_barcodes added: ${out.length - 1} rows, header=${newHdr.length} cols`)
