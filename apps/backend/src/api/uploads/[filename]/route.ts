import { createReadStream, existsSync } from "fs"
import { join } from "path"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const filename = req.params.filename
  if (!filename || filename.includes("..")) {
    res.status(400).json({ message: "Invalid filename" })
    return
  }

  const filePath = join(process.cwd(), "uploads", filename)
  if (!existsSync(filePath)) {
    res.status(404).json({ message: "File not found" })
    return
  }

  const ext = filename.split(".").pop()?.toLowerCase() || ""
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    gif: "image/gif", webp: "image/webp",
  }

  res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream")
  res.setHeader("Cache-Control", "public, max-age=86400")

  const stream = createReadStream(filePath)
  stream.pipe(res)
}
