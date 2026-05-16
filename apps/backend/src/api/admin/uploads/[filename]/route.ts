import { createReadStream, existsSync } from "fs"
import { join } from "path"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const filename = req.params.filename
  if (!filename || filename.includes("..")) {
    return res.status(400).json({ message: "Invalid filename" })
  }

  const filePath = join(process.cwd(), "uploads", filename)
  if (!existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" })
  }

  const ext = filename.split(".").pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  }

  res.setHeader("Content-Type", mimeTypes[ext || ""] || "application/octet-stream")
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable")

  const stream = createReadStream(filePath)
  stream.pipe(res)
}
