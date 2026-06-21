/**
 * FULFILLMENT ITEM TITLE ENRICHER
 *
 * When Medusa creates a fulfillment, fulfillment_item.title is set to the
 * variant_title (e.g., "5kg") rather than the product_title. Since our
 * variant titles are shared unit-pool values, this makes the fulfillment
 * tab useless for pickers — they see "1x 5kg" instead of "Natco - Idli Rice (5kg)".
 *
 * This subscriber listens to fulfillment.created and retroactively sets
 * fulfillment_item.title = product_title + " - " + variant_title.
 *
 * Triggered by: fulfillment.created event
 */

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

export const config: SubscriberConfig = {
  event: ["fulfillment.created"],
}

export default async function fulfillmentItemTitleEnricher({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const pg = container.resolve("__pg_connection__") as any

  const fulfillmentId = event.data?.id
  if (!fulfillmentId) return

  try {
    const result = await pg.query(`
      UPDATE fulfillment_item fi
      SET title = oli.product_title || ' - ' || oli.variant_title
      FROM order_line_item oli
      WHERE fi.line_item_id = oli.id
        AND fi.fulfillment_id = $1
        AND oli.product_title IS NOT NULL
        AND oli.variant_title IS NOT NULL
      RETURNING fi.id, fi.title
    `, [fulfillmentId])

    if (result.rowCount > 0) {
      const titles = result.rows.map((r: any) => r.title).join(", ")
      logger.info(
        `[fulfillment-title] Fulfillment ${fulfillmentId}: enriched ${result.rowCount} item titles → [${titles}]`
      )
    }
  } catch (e: any) {
    logger.error(
      `[fulfillment-title] Failed to enrich titles for ${fulfillmentId}: ${e.message}`
    )
  }
}
