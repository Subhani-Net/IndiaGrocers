import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import calculateVariantPricingWorkflow from "../../../../../workflows/calculate-variant-pricing"

/**
 * GET /admin/products/:id/recalculate-pricing
 *
 * Manually triggers variant price-per-unit recalculation for a product.
 * Used by admins after bulk price changes or initial data imports.
 *
 * US-01-02
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  try {
    const { result } = await calculateVariantPricingWorkflow(req.scope).run({
      input: { productId: id },
    })

    res.json({
      product_id: id,
      updated_variants: result.updatedCount,
      message: `Price-per-unit recalculated for ${result.updatedCount} variant(s)`,
    })
  } catch (error: any) {
    res.status(400).json({
      type: "recalculation_error",
      message: error.message ?? "Failed to recalculate pricing",
    })
  }
}
