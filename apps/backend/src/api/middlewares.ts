import { defineMiddlewares } from "@medusajs/medusa"
import { NextFunction } from "express"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { validateProductMetadata } from "../lib/validators/product-metadata"

/**
 * Validates the `metadata` field on product create/update requests against
 * the ProductMetadata Zod schema. Returns HTTP 400 with descriptive errors
 * on invalid input rather than letting garbage reach the database.
 *
 * US-01-01
 */
function validateProductMetadataMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: NextFunction
) {
  const body = req.body as Record<string, unknown> | undefined

  // Metadata is optional on the request — only validate if provided
  if (!body || !body.metadata) {
    return next()
  }

  const result = validateProductMetadata(body.metadata)

  if (!result.success) {
    const messages = result.error.issues.map(
      (e) => `${e.path.join(".")}: ${e.message}`
    )
    return res.status(400).json({
      type: "invalid_product_metadata",
      message: "Product metadata validation failed",
      errors: messages,
    })
  }

  return next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/products",
      method: ["POST"],
      middlewares: [validateProductMetadataMiddleware],
    },
    {
      matcher: "/admin/products/:id",
      method: ["POST", "PUT", "PATCH"],
      middlewares: [validateProductMetadataMiddleware],
    },
  ],
})
