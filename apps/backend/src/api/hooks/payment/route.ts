/**
 * POST /hooks/payment/stripe
 *
 * Stripe webhook endpoint. Receives payment events from Stripe
 * and delegates to the Stripe payment module for processing.
 *
 * Medusa's @medusajs/payment-stripe module handles:
 *   - payment_intent.succeeded → marks payment as captured
 *   - payment_intent.payment_failed → marks payment as failed
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger") as any

  try {
    const paymentService = req.scope.resolve("payment_stripe") as any

    if (paymentService?.handleWebhook) {
      // Medusa's Stripe module has a built-in webhook handler
      await paymentService.handleWebhook({
        payload: req.body,
        signature: req.headers["stripe-signature"] || "",
      })
    } else {
      // Fallback: log for manual processing
      logger?.info("[stripe] Webhook received (manual processing)")
      logger?.info("[stripe] Event type: " + (req.body?.type || "unknown"))
    }

    return res.json({ received: true })
  } catch (err: any) {
    logger?.error("[stripe] Webhook error: " + err.message)
    return res.status(400).json({ error: err.message })
  }
}
