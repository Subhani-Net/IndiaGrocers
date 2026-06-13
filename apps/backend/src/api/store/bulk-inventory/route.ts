import type { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, getVariantAvailability } from "@medusajs/framework/utils"

export async function POST(req: MedusaStoreRequest, res: MedusaResponse) {
  const { variant_ids } = req.body as { variant_ids?: string[] }

  if (!variant_ids?.length) {
    return res.status(400).json({ error: "variant_ids array is required" })
  }

  const salesChannelId = req.publishable_key_context?.sales_channel_ids?.[0]
  if (!salesChannelId) {
    return res.status(400).json({ error: "No sales channel resolved from publishable key" })
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const availability = await getVariantAvailability(query, {
      variant_ids,
      sales_channel_id: salesChannelId,
    })

    const inventory: Record<string, { availability: number | null }> = {}
    for (const [variantId, data] of Object.entries(availability)) {
      inventory[variantId] = { availability: data.availability }
    }

    return res.json({ inventory })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}
