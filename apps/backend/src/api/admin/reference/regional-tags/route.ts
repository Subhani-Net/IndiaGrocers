import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REGIONAL_TAGS, REGIONAL_TAG_LABELS } from "../../../../config/regional-tags"

/**
 * GET /admin/reference/regional-tags
 *
 * Returns all valid regional tag values with their display labels.
 * Used by admin UI dropdowns when tagging products.
 *
 * US-01-04
 */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  const tags = REGIONAL_TAGS.map((value) => ({
    value,
    label: REGIONAL_TAG_LABELS[value],
  }))
  res.json({ regional_tags: tags })
}
