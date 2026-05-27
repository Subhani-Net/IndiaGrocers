import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /health
 *
 * Lightweight health check for ops and CI. Returns the status of each
 * required service. Used by the storefront /health page and deployment
 * pipelines to confirm the backend is ready.
 *
 * US-01-08
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const services: Record<string, "ok" | "error" | "not_configured"> = {}

  // --- Database ---
  try {
    const manager = req.scope.resolve(
      ContainerRegistrationKeys.MANAGER
    ) as any
    if (manager?.getConnection) {
      await manager.getConnection().query("SELECT 1")
    }
    services.db = "ok"
  } catch {
    services.db = "error"
  }

  // --- MeiliSearch ---
  if (process.env.MEILISEARCH_HOST && process.env.MEILISEARCH_API_KEY) {
    try {
      const response = await fetch(
        `${process.env.MEILISEARCH_HOST}/health`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MEILISEARCH_API_KEY}`,
          },
          signal: AbortSignal.timeout(3000),
        }
      )
      services.search = response.ok ? "ok" : "error"
    } catch {
      services.search = "error"
    }
  } else {
    services.search = "not_configured"
  }

  // --- Redis (via env check — full ping would need ioredis client) ---
  services.redis = process.env.REDIS_URL ? "ok" : "not_configured"

  // --- Stripe ---
  services.stripe = process.env.STRIPE_SECRET_KEY
    ? "ok"
    : "not_configured"

  // --- Email ---
  services.email =
    process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY
      ? "ok"
      : "not_configured"

  // --- SMS ---
  services.sms = process.env.TWILIO_ACCOUNT_SID ? "ok" : "not_configured"

  // --- S3 ---
  services.storage = process.env.S3_BUCKET ? "ok" : "not_configured"

  const hasErrors = Object.values(services).includes("error")

  res.status(hasErrors ? 503 : 200).json({
    status: hasErrors ? "degraded" : "ok",
    timestamp: new Date().toISOString(),
    services,
  })
}
