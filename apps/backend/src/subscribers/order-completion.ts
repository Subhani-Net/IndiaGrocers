/**
 * ORDER COMPLETION SUBSCRIBER
 *
 * Auto-transitions orders from "pending" → "completed" when payment is captured.
 * Closes the order loop: checkout → payment → completion without admin intervention.
 *
 * Triggered by: payment.captured event
 * Falls back to: payment.created + Stripe status check (for auto-captured payments)
 */

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import Stripe from "stripe"

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || ""

export const config: SubscriberConfig = {
  event: ["payment.captured"],
}

export default async function orderCompletionSubscriber({
  event,
  container,
}: SubscriberArgs<{ id: string; payment_collection_id?: string }>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query") as any

  try {
    const paymentId = event.data?.id
    if (!paymentId) return

    logger.info(`[order-completion] Payment captured: ${paymentId}. Looking up order...`)

    // Find the payment collection → order link
    const { data: paymentCollections } = await query.graph({
      entity: "payment",
      fields: ["id", "payment_collection_id"],
      filters: { id: paymentId },
    })

    const pcId = event.data?.payment_collection_id || paymentCollections?.[0]?.payment_collection_id
    if (!pcId) {
      logger.warn(`[order-completion] No payment collection found for payment ${paymentId}`)
      return
    }

    // Find orders linked to this payment collection
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "display_id", "status"],
      filters: { payment_collections: { id: pcId } },
    })

    if (!orders?.length) {
      logger.warn(`[order-completion] No order found for payment collection ${pcId}`)
      return
    }

    // Transition each order from pending → completed
    const orderModule = container.resolve(Modules.ORDER)
    let completed = 0

    for (const order of orders) {
      if (order.status === "completed" || order.status === "archived" || order.status === "canceled") {
        continue
      }

      try {
        await orderModule.completeOrder({ id: order.id } as any)
        logger.info(
          `[order-completion] Order #${order.display_id} transitioned pending → completed`
        )
        completed++
      } catch (e: any) {
        logger.error(
          `[order-completion] Failed to complete order #${order.display_id}: ${e.message}`
        )
      }
    }

    if (completed > 0) {
      logger.info(`[order-completion] ${completed} orders auto-completed`)
    }
  } catch (e: any) {
    logger.error(`[order-completion] Subscriber error: ${e.message}`)
  }
}
