const fs = require("fs")
const path = require("path")
const dir = "D:/Dump/IndiaGrocers-Fix/data-design"
const files = fs.readdirSync(dir).filter(f => f.endsWith("-master.csv"))

let totalRemoved = 0

for (const f of files) {
  const fp = path.join(dir, f)
  const csv = fs.readFileSync(fp, "utf-8")
  const lines = csv.trim().split("\n")
  const header = lines[0]
  const kept = []
  const removed = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",")
    const title = (cols[1] || "").replace(/"/g, "")
    const weight = (cols[2] || "").replace(/"/g, "")

    const isCase =
      title.toLowerCase().includes("full case") ||
      /^\d+x\d+/.test(weight) ||
      weight.includes("x")

    if (isCase) {
      removed.push(title + " [" + weight + "]")
    } else {
      kept.push(lines[i])
    }
  }

  if (removed.length > 0) {
    fs.writeFileSync(fp, header + "\n" + kept.join("\n"))
    console.log(f.padEnd(35) + (lines.length - 1) + " -> " + kept.length + " (removed " + removed.length + " case)")
    totalRemoved += removed.length
  } else {
    console.log(f.padEnd(35) + (lines.length - 1) + " (no case products)")
  }
}

console.log("\nTotal removed: " + totalRemoved + " case products")
