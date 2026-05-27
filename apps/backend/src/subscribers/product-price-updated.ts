import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import calculateVariantPricingWorkflow from "../workflows/calculate-variant-pricing"

/**
 * Triggers price-per-unit recalculation whenever a product variant's price
 * is updated via the Medusa admin.
 *
 * US-01-02
 */
export default async function productPriceUpdatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const productId = data.id

  if (!productId) {
    return
  }

  await calculateVariantPricingWorkflow(container).run({
    input: { productId },
  })
}

export const config: SubscriberConfig = {
  event: ["product.updated", "product-variant.updated"],
}
