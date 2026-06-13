const http = require("http")
const fs = require("fs")

;(async () => {
  const auth = await new Promise(r => {
    const rq = http.request({ hostname: "127.0.0.1", port: 9000, path: "/auth/user/emailpass", method: "POST", headers: { "Content-Type": "application/json" } }, res => { let d = ""; res.on("data", c => d += c); res.on("end", () => r(JSON.parse(d))) })
    rq.write(JSON.stringify({ email: "admin@example.com", password: "password123" })); rq.end()
  })
  const H = { Authorization: "Bearer " + auth.token }

  const cols = []
  for (let o = 0; ; o += 100) {
    await new Promise(r => {
      http.get("http://127.0.0.1:9000/admin/collections?limit=100&offset=" + o + "&fields=handle,title", { headers: H }, res => {
        let d = ""; res.on("data", c => d += c); res.on("end", () => {
          const j = JSON.parse(d); cols.push(...(j.collections || [])); r()
        })
      })
    })
    if (cols.length === 0) break
  }

  const lines = ["handle,title,status"]
  cols.forEach(c => lines.push(c.handle + ',"' + (c.title || "").replace(/"/g, '""') + '",active'))
  fs.writeFileSync("D:/Dump/IndiaGrocers-Fix/catalogue/collections.csv", lines.join("\n"))
  console.log("collections.csv:", cols.length)
})()
