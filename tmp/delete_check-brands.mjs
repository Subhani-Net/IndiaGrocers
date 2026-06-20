import { readFileSync } from "fs"

const csv = readFileSync("../tmp/catalog-rebuild-v3/brands.csv", "utf8")
const lines = csv.split("\n").filter(l => l.trim())
const csvSlugs = new Set(lines.slice(1).map(l => l.split(",")[0].trim()))

const bsText = readFileSync("../apps/backend/src/config/brands.ts", "utf8")
const matches = [...bsText.matchAll(/slug:\s*["']([^"']+)["']/g)]
const tsSlugs = new Set(matches.map(m => m[1]))

const missing = [...csvSlugs].filter(s => !tsSlugs.has(s))
const extra = [...tsSlugs].filter(s => !csvSlugs.has(s))

console.log(`CSV slugs: ${csvSlugs.size} | TS slugs: ${tsSlugs.size}`)
if (missing.length > 0) console.log(`❌ Missing from brands.ts: ${missing.join(", ")}`)
else console.log("✓ All CSV brand slugs are in brands.ts")
if (extra.length > 0) console.log(`ℹ Extra in TS (not in CSV): ${extra.join(", ")}`)

if (missing.length > 0) process.exit(1)
