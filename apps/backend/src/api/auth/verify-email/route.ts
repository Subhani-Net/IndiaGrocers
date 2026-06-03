/**
 * POST /store/auth/verify-email
 *
 * Verifies a customer's email using a token stored in customer metadata.
 * The token is generated and stored during signup by the auth subscriber.
 *
 * Request:  { token: string }
 * Response: { success: boolean, error?: string }
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { token } = req.body as { token: string }

  if (!token) {
    return res.status(400).json({ success: false, error: "Token is required" })
  }

  try {
    const customerService = req.scope.resolve("customerService") as any
    const logger = req.scope.resolve("logger") as any

    // Find customer by verification token in metadata
    const customers = await customerService.list({
      "metadata.verification_token": token,
    })

    if (!customers?.length) {
      return res.status(400).json({ success: false, error: "Invalid or expired verification code" })
    }

    const customer = customers[0]

    // Check token expiry (24 hours from creation)
    const createdAt = new Date(customer.created_at).getTime()
    if (Date.now() - createdAt > 24 * 60 * 60 * 1000) {
      return res.status(400).json({ success: false, error: "Verification code has expired. Please request a new one." })
    }

    // Mark as verified
    await customerService.update(customer.id, {
      metadata: {
        ...customer.metadata,
        email_verified: true,
        verified_at: new Date().toISOString(),
        verification_token: null, // clear token after use
      },
    })

    logger?.info(`[auth] Email verified for customer ${customer.email}`)

    return res.json({ success: true, email: customer.email })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
