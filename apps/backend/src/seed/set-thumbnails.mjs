import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "http://127.0.0.1:9000"
const CSV_PATH = resolve(__dirname, "../../../../Implementation/Natcofoods/natcofoods-import-backup/natcofoods-catalog.csv")

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
  })
  const { token } = await res.json()
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
}

async function main() {
  const headers = await login()
  console.log("Logged in\n")

  // Build handle → image filename map from CSV
  const csv = readFileSync(CSV_PATH, "utf-8")
  const lines = csv.trim().split("\n").slice(1)
  const handleToImg = new Map()
  for (const line of lines) {
    const vals = line.split(",")
    const handle = vals[0]?.trim()
    const img = vals[5]?.trim().replace("./images/", "") || ""
    if (handle && img) handleToImg.set(handle, img)
  }
  console.log(`${handleToImg.size} handle→image mappings\n`)

  // Fetch all products
  let all = [], offset = 0
  while (true) {
    const r = await (await fetch(`${BASE}/admin/products?limit=100&offset=${offset}&fields=id,title,handle`, { headers })).json()
    if (!r.products?.length) break
    all.push(...r.products)
    offset += 100
  }
  console.log(`${all.length} products fetched\n`)

  // Update thumbnails
  let updated = 0
  for (const p of all) {
    const img = handleToImg.get(p.handle)
    if (!img) continue
    await fetch(`${BASE}/admin/products/${p.id}`, {
      method: "POST", headers,
      body: JSON.stringify({ thumbnail: `/images/${img}` }),
    })
    updated++
    if (updated % 50 === 0) console.log(`  ${updated}/${all.length}`)
  }

  console.log(`\nDone: ${updated} products updated with thumbnails`)
}

main().catch(console.error)
