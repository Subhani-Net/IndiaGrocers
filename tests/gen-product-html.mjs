/**
 * Generate a self-contained HTML view of all-products.json
 * Run: node tests/gen-product-html.mjs
 */
import fs from "fs"

const data = JSON.parse(fs.readFileSync("tests/all-products.json", "utf-8"))
const products = data.products

const categories = [...new Set(products.map((p) => p.categories?.[0]?.handle || "uncategorized"))].sort()
const counts = {}
for (const p of products) {
  const c = p.categories?.[0]?.handle || "uncategorized"
  counts[c] = (counts[c] || 0) + 1
}

// Build product rows
let rows = ""
let i = 0
for (const p of products) {
  i++
  const cat = p.categories?.[0]
  const v = p.variants?.[0]
  const m = p.metadata || {}
  const price = v?.calculated_price?.calculated_amount
  const priceStr = price ? `£${(price / 100).toFixed(2)}` : "—"

  rows += `    <tr data-category="${cat?.handle || "uncategorized"}">
      <td>${i}</td>
      <td class="title" title="${p.handle}">${p.title}</td>
      <td class="handle"><code>${p.handle}</code></td>
      <td>${m.brand_slug || "—"}</td>
      <td>${cat?.name || "—"}</td>
      <td>${v?.title || "—"}</td>
      <td>${v?.sku || "—"}</td>
      <td>${priceStr}</td>
      <td>${m.allergens?.join(", ") || "—"}</td>
      <td>${m.vat_rate === 0.2 ? "20%" : "0%"}</td>
      <td>${m.velocity || "—"}</td>
      <td>${m.dietary_flags?.join(", ") || "—"}</td>
    </tr>\n`
}

// Build category filter options
let catOptions = '<option value="">All Categories</option>\n'
for (const c of categories) {
  const name = products.find((p) => p.categories?.[0]?.handle === c)?.categories?.[0]?.name || c
  catOptions += `    <option value="${c}">${name} (${counts[c] || 0})</option>\n`
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>IndiaGrocers — Product Catalog (${products.length} products)</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f0eb; color: #292524; padding: 20px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .sub { color: #78716c; font-size: 13px; margin-bottom: 16px; }
  .controls { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
  .controls input, .controls select { padding: 8px 12px; border: 1px solid #d6d3d1; border-radius: 8px; font-size: 13px; outline: none; }
  .controls input:focus, .controls select:focus { border-color: #ff6b35; }
  .controls input { width: 280px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.06); font-size: 13px; }
  th { background: #ff6b35; color: #fff; padding: 10px 12px; text-align: left; font-weight: 600; white-space: nowrap; position: sticky; top: 0; z-index: 1; cursor: pointer; }
  th:hover { background: #e85d2a; }
  td { padding: 8px 12px; border-bottom: 1px solid #f0efed; }
  tr:hover { background: #fff7ed; }
  .title { max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .handle { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .handle code { font-size: 11px; color: #a8a29e; }
  tr.hidden { display: none; }
  .count { margin-left: 8px; color: #78716c; font-size: 12px; }
  .nav { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .nav a { padding: 4px 10px; border-radius: 6px; font-size: 12px; cursor: pointer; background: #fff; border: 1px solid #d6d3d1; color: #57534e; text-decoration: none; white-space: nowrap; }
  .nav a:hover, .nav a.active { background: #ff6b35; color: #fff; border-color: #ff6b35; }
</style>
</head>
<body>
<h1>IndiaGrocers — Product Catalog</h1>
<p class="sub">${products.length} products · ${categories.length} categories · generated ${new Date().toISOString().slice(0, 10)}</p>

<div class="nav" id="nav">${categories.map((c) => {
  const name = products.find((p) => p.categories?.[0]?.handle === c)?.categories?.[0]?.name || c
  return `<a href="#" data-cat="${c}">${name} <span class="count">${counts[c] || 0}</span></a>`
}).join("")}<a href="#" data-cat="" class="active">All <span class="count">${products.length}</span></a></div>

<div class="controls">
  <input type="text" id="search" placeholder="Search by title, handle, brand, SKU..." oninput="filter()">
  <select id="catSelect" onchange="filter()">${catOptions}</select>
  <span id="visible" style="font-size:13px;color:#78716c;line-height:2.2"></span>
</div>

<table>
<thead>
<tr>
  <th onclick="sort(0)">#</th>
  <th onclick="sort(1)">Title</th>
  <th onclick="sort(2)">Handle</th>
  <th onclick="sort(3)">Brand</th>
  <th onclick="sort(4)">Category</th>
  <th onclick="sort(5)">Variant</th>
  <th onclick="sort(6)">SKU</th>
  <th onclick="sort(7)">Price</th>
  <th onclick="sort(8)">Allergens</th>
  <th onclick="sort(9)">VAT</th>
  <th onclick="sort(10)">Velocity</th>
  <th onclick="sort(11)">Dietary</th>
</tr>
</thead>
<tbody id="tbody">
${rows}
</tbody>
</table>

<script>
function filter() {
  const q = document.getElementById("search").value.toLowerCase()
  const cat = document.getElementById("catSelect").value
  const rows = document.querySelectorAll("#tbody tr")
  let v = 0
  rows.forEach((row) => {
    const text = row.textContent.toLowerCase()
    const rowCat = row.dataset.category
    const match = (!q || text.includes(q)) && (!cat || rowCat === cat)
    row.classList.toggle("hidden", !match)
    if (match) v++
  })
  document.getElementById("visible").textContent = v + " visible"
  document.querySelectorAll(".nav a").forEach((a) => {
    a.classList.toggle("active", a.dataset.cat === cat || (!cat && a.dataset.cat === ""))
  })
}
document.querySelectorAll(".nav a").forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault()
    document.getElementById("catSelect").value = a.dataset.cat
    filter()
  })
})
let sortDir = {}
function sort(col) {
  sortDir[col] = !sortDir[col]
  const tbody = document.getElementById("tbody")
  const rows = [...tbody.querySelectorAll("tr")]
  rows.sort((a, b) => {
    let va = a.cells[col].textContent.trim()
    let vb = b.cells[col].textContent.trim()
    let na = parseFloat(va.replace(/[£%]/g, ""))
    let nb = parseFloat(vb.replace(/[£%]/g, ""))
    if (!isNaN(na) && !isNaN(nb)) return sortDir[col] ? nb - na : na - nb
    return sortDir[col] ? vb.localeCompare(va) : va.localeCompare(vb)
  })
  rows.forEach((r) => tbody.appendChild(r))
}
filter()
</script>
</body>
</html>`

fs.writeFileSync("tests/product-catalog.html", html)
console.log(`Generated product-catalog.html — ${products.length} products, ${Math.round(html.length / 1024)}KB`)
