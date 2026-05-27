/**
 * Generate Natco Catalog Explorer HTML
 * Run: node tests/gen-catalog-explorer.mjs
 */
import fs from "fs"

const raw = fs.readFileSync("C:/IndiaGrocers/Implementation/Natcofoods/natcofoods-import/natcofoods-catalog.json", "utf-8")
const data = JSON.parse(raw)
const products = data.products || []

// Extract unique categories + counts
const catMap = {}
const tagMap = {}
const typeMap = {}
for (const p of products) {
  const cat = p.categories || "Uncategorized"
  catMap[cat] = (catMap[cat] || 0) + 1
  const type = (p.type?.value || "Unknown").replace(/&amp;/g, "&")
  typeMap[type] = (typeMap[type] || 0) + 1
  if (p.tags) {
    const tagList = Array.isArray(p.tags) ? p.tags : (typeof p.tags === "string" ? p.tags.split(/\s+/) : [])
    tagList.forEach((t) => {
      if (t && t.length > 1 && !/^\d+$/.test(t)) tagMap[t] = (tagMap[t] || 0) + 1
    })
  }
}

const categories = Object.entries(catMap).sort((a, b) => b[1] - a[1])
const types = Object.entries(typeMap).sort((a, b) => b[1] - a[1])
const tags = Object.entries(tagMap)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 60)

// Build product rows
let rows = ""
products.forEach((p, i) => {
  const typeVal = (p.type?.value || "—").replace(/&amp;/g, "&")
  const tagList = Array.isArray(p.tags) ? p.tags : (typeof p.tags === "string" ? p.tags.split(/\s+/) : [])
  const sku = p.variants?.[0]?.sku || "—"
  const img = Array.isArray(p.images) ? p.images[0]?.url || "—" : (typeof p.images === "string" && p.images ? p.images : "—")
  const catNames = Array.isArray(p.categories) ? p.categories.join(", ") : (p.categories || "—")
  const tagsStr = tagList.filter(Boolean).join(", ") || "—"
  rows += `<tr data-cat="${catNames}" data-type="${typeVal}" data-tags="${tagList.join(" ")}">
    <td>${i + 1}</td>
    <td class="title" title="${p.handle}">${p.title}</td>
    <td>${p.handle}</td>
    <td>${catNames}</td>
    <td>${typeVal}</td>
    <td>${sku}</td>
    <td class="r">${p.weight || "—"}</td>
    <td class="tags">${tagsStr}</td>
    <td>${img}</td>
  </tr>`
})

const catOptions = categories
  .map(([name, count]) => `<option value="${name}">${name} (${count})</option>`)
  .join("\n")

const catBars = categories
  .slice(0, 15)
  .map(
    ([name, count]) =>
      `<div class="bar-row"><span class="bar-label">${name}</span><span class="bar" style="width:${Math.max(count / 1, 1)}px"></span><span class="bar-count">${count}</span></div>`
  )
  .join("\n")

const tagCloud = tags
  .map(
    ([tag, count]) =>
      `<span class="tagc" style="font-size:${Math.max(11, Math.min(24, 10 + count / 2))}px">${tag}<sup>${count}</sup></span>`
  )
  .join(" ")

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Natco Foods — Catalog Explorer (${products.length} products)</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f5f0eb;color:#292524;padding:16px}
.top{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.top h1{font-size:18px;color:#292524}
.top .sub{font-size:12px;color:#78716c}
.controls{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center}
.controls input,.controls select{padding:7px 10px;border:1px solid #d6d3d1;border-radius:7px;font-size:12px;outline:none;background:#fff}
.controls input:focus,.controls select:focus{border-color:#ff6b35}
.controls input{width:240px}
.tabs{display:flex;gap:2px;margin-bottom:12px}
.tabs button{padding:6px 14px;border:1px solid #d6d3d1;border-radius:7px 7px 0 0;font-size:12px;cursor:pointer;background:#fff;color:#57534e}
.tabs button.active,.tabs button:hover{background:#ff6b35;color:#fff;border-color:#ff6b35}
.view{display:none}
.view.active{display:block}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.05);font-size:12px}
th{background:#ff6b35;color:#fff;padding:7px 10px;text-align:left;font-weight:600;white-space:nowrap;position:sticky;top:0;cursor:pointer;user-select:none}
th:hover{background:#e85d2a}
td{padding:5px 10px;border-bottom:1px solid #f0efed;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
tr:hover{background:#fff7ed}
tr.hidden{display:none}
.r{text-align:right}
.title{max-width:280px}
.tags{max-width:200px}
.tag{display:inline-block;background:#fef3c7;color:#92400e;font-size:10px;padding:1px 5px;border-radius:4px;margin:1px}
#visible{font-size:12px;color:#78716c}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.stat-card{background:#fff;border-radius:8px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.05)}
.stat-card h3{font-size:13px;color:#57534e;margin-bottom:8px}
.bar-row{display:flex;align-items:center;gap:8px;margin-bottom:3px;font-size:11px}
.bar-label{width:160px;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#57534e}
.bar{height:14px;background:#ff6b35;border-radius:3px;min-width:2px;transition:width .3s}
.bar-count{margin-left:4px;font-weight:600;color:#292524}
.tagc{display:inline-block;margin:2px 4px;color:#78716c;cursor:pointer}
.tagc:hover{color:#ff6b35}
.tagc sup{font-size:70%;color:#d6d3d1}
.num{font-size:26px;font-weight:700;color:#ff6b35}
.modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:100;justify-content:center;align-items:center}
.modal.open{display:flex}
.modal-inner{background:#fff;border-radius:12px;padding:20px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.15)}
.modal-inner h2{font-size:16px;margin-bottom:8px}
.modal-inner p{margin:4px 0;font-size:13px}
.modal-inner .label{font-weight:600;color:#78716c;display:inline-block;width:80px}
.modal-close{float:right;cursor:pointer;font-size:18px;color:#78716c}
</style>
</head>
<body>
<div class="top">
  <div><h1>Natco Foods — Catalog Explorer</h1><p class="sub">${products.length} products · ${categories.length} categories · ${Object.keys(typeMap).length} types</p></div>
  <div style="display:flex;gap:8px">
    <button onclick="copyCSV()" style="padding:6px 12px;border:1px solid #ff6b35;border-radius:6px;font-size:11px;cursor:pointer;background:#fff;color:#ff6b35">Copy CSV</button>
  </div>
</div>

<div class="tabs">
  <button class="active" onclick="showTab('table')">Table</button>
  <button onclick="showTab('stats')">Stats</button>
  <button onclick="showTab('tags')">Tag Cloud</button>
</div>

<div class="controls">
  <input type="text" id="search" placeholder="Search by title, handle, category, tags..." oninput="filter()">
  <select id="catFilter" onchange="filter()"><option value="">All Categories</option>${catOptions}</select>
  <span id="visible">${products.length} visible</span>
</div>

<div class="view active" id="view-table">
<table>
<thead><tr>
  <th onclick="sortCol(0)">#</th>
  <th onclick="sortCol(1)">Title</th>
  <th onclick="sortCol(2)">Handle</th>
  <th onclick="sortCol(3)">Category</th>
  <th onclick="sortCol(4)">Type</th>
  <th onclick="sortCol(5)">SKU</th>
  <th onclick="sortCol(6)">Weight</th>
  <th onclick="sortCol(7)">Tags</th>
  <th onclick="sortCol(8)">Image</th>
</tr></thead>
<tbody id="tbody">${rows}</tbody>
</table>
</div>

<div class="view" id="view-stats">
<div class="stats">
  <div class="stat-card">
    <h3>Products by Category</h3>
    ${catBars}
  </div>
  <div class="stat-card">
    <h3>Products by Type</h3>
    ${types.slice(0,15).map(([name,count])=>`<div class="bar-row"><span class="bar-label">${name}</span><span class="bar" style="width:${Math.max(count,1)}px"></span><span class="bar-count">${count}</span></div>`).join("\n")}
  </div>
</div>
</div>

<div class="view" id="view-tags">
  <div class="stat-card"><h3>Tag Cloud — Top ${tags.length}</h3><p style="line-height:2">${tagCloud}</p></div>
</div>

<div class="modal" id="modal"><div class="modal-inner" id="modalBody"></div></div>

<script>
let sortDir={}
function sortCol(col){
  sortDir[col]=!sortDir[col]
  const rows=[...document.querySelectorAll("#tbody tr")]
  rows.sort((a,b)=>{
    let va=a.cells[col].textContent.trim(),vb=b.cells[col].textContent.trim()
    let na=parseFloat(va),nb=parseFloat(vb)
    if(!isNaN(na)&&!isNaN(nb))return sortDir[col]?nb-na:na-nb
    return sortDir[col]?vb.localeCompare(va):va.localeCompare(vb)
  })
  rows.forEach(r=>document.getElementById("tbody").appendChild(r))
}
function filter(){
  const q=document.getElementById("search").value.toLowerCase()
  const cat=document.getElementById("catFilter").value
  let v=0
  document.querySelectorAll("#tbody tr").forEach(r=>{
    const match=((!q||r.textContent.toLowerCase().includes(q))&&(!cat||r.dataset.cat===cat))
    r.classList.toggle("hidden",!match);if(match)v++
  })
  document.getElementById("visible").textContent=v+" visible"
}
function showTab(t){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"))
  document.getElementById("view-"+t).classList.add("active")
  document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("active"))
  event.target.classList.add("active")
}
function copyCSV(){
  const rows=[],headers=[]
  document.querySelectorAll("th").forEach(th=>headers.push(th.textContent.trim()))
  rows.push(headers.join(","))
  document.querySelectorAll("#tbody tr:not(.hidden)").forEach(r=>{
    const cells=[...r.cells].map(c=>'"'+c.textContent.replace(/"/g,'""').trim().replace(/<[^>]*>/g,'')+'"')
    rows.push(cells.join(","))
  })
  navigator.clipboard.writeText(rows.join("\n"))
  alert("Copied "+rows.length+" rows as CSV")
}
document.querySelectorAll("#tbody").forEach(t=>t.addEventListener("click",e=>{
  const tr=e.target.closest("tr")
  if(!tr)return
  const cells=tr.cells
  document.getElementById("modalBody").innerHTML='<span class="modal-close" onclick="document.getElementById(\'modal\').classList.remove(\'open\')">&times;</span><h2>'+cells[1].textContent+'</h2>'+[...cells].slice(1).map(c=>'<p><span class="label">'+document.querySelectorAll("th")[c.cellIndex].textContent.trim()+':</span> '+c.textContent.replace(/<[^>]*>/g,'')+'</p>').join("")
  document.getElementById("modal").classList.add("open")
}))
document.getElementById("modal").addEventListener("click",function(e){if(e.target===this)this.classList.remove("open")})
filter()
</script>
</body>
</html>`

fs.writeFileSync("C:/IndiaGrocers/Implementation/Natcofoods/natcofoods-import/catalog-explorer.html", html)
console.log(`Generated catalog-explorer.html — ${Math.round(html.length / 1024)}KB`)
