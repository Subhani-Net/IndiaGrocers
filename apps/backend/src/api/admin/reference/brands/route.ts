import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRANDS } from "../../../../config/brands"

/**
 * GET /admin/reference/brands
 *
 * Returns the full brand master list. Used by admin UI dropdowns when
 * creating or editing products (brand_slug field).
 *
 * US-01-04
 */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({ brands: BRANDS })
}
