import { readFileSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const src = resolve(__dirname, "..", "apps", "backend", "src", "config", "brands.ts")
const dst = resolve(__dirname, "catalog-rebuild", "brands.csv")

const text = readFileSync(src, "utf8")
const matches = text.matchAll(/slug:\s*"([^"]+)"\s*,\s*name:\s*"([^"]+)"/g)

const lines = ["handle,brand_name,categories"]
for (const m of matches) {
  lines.push(`${m[1]},"${m[2]}",""`)
}
writeFileSync(dst, lines.join("\n") + "\n", "utf8")
console.log(`Brands: ${lines.length - 1} rows → ${dst}`)
