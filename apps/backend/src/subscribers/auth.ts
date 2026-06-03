/**
 * Auth Subscriber — handles customer verification and password reset emails.
 *
 * Uses Medusa's built-in notification module (configured in medusa-config.ts).
 * Tokens are stored in customer metadata and verified via the API endpoint.
 *
 * Events:
 *   customer.created   → generate token, store in metadata, send email
 *   auth.password_reset → send password reset email (token from Medusa)
 */

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import crypto from "crypto"

export const config: SubscriberConfig = {
  event: ["customer.created", "auth.password_reset"],
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

async function sendNotification(
  container: any,
  to: string,
  content: { subject: string; html: string }
) {
  const logger = container.resolve("logger") as any

  try {
    const notificationService = container.resolve("notification") as any
    if (notificationService?.createNotifications) {
      await notificationService.createNotifications([{ to, channel: "email", content }])
      return
    }
  } catch (err: any) {
    logger?.warn(`[auth] Notification service error: ${err.message}`)
  }

  // Dev fallback — log email to console
  logger?.info(`[auth] DEV EMAIL — to:${to} subject:${content.subject}`)
}

function buildVerificationHtml(name: string, token: string, storefrontUrl: string): string {
  const link = `${storefrontUrl}/account?verify=true`
  return `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px">
<div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
<div style="background:#FF6B35;padding:24px;text-align:center"><h1 style="color:white;margin:0">IndiaGrocers</h1></div>
<div style="padding:24px">
<h2 style="color:#333;font-size:18px">Verify your email</h2>
<p style="color:#666;font-size:14px">Hi ${name},</p>
<p style="color:#666;font-size:14px">Please verify your email address to activate your account.</p>
<p style="margin:16px 0;font-family:monospace;background:#f5f5f5;padding:12px;border-radius:8px;text-align:center;font-size:18px;letter-spacing:2px">${token}</p>
<a href="${link}" style="display:block;background:#FF6B35;color:white;text-align:center;padding:12px;border-radius:8px;text-decoration:none;font-weight:600">Verify Email</a>
<p style="color:#999;font-size:12px;margin-top:16px">If you didn't create an account, ignore this email.</p>
</div></div></body></html>`
}

function buildResetHtml(email: string, token: string, storefrontUrl: string): string {
  const link = `${storefrontUrl}/account?reset=true&token=${token}`
  return `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px">
<div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
<div style="background:#FF6B35;padding:24px;text-align:center"><h1 style="color:white;margin:0">IndiaGrocers</h1></div>
<div style="padding:24px">
<h2 style="color:#333;font-size:18px">Reset your password</h2>
<p style="color:#666;font-size:14px">You requested a password reset for ${email}.</p>
<p style="margin:16px 0;font-family:monospace;background:#f5f5f5;padding:12px;border-radius:8px;text-align:center;font-size:18px;letter-spacing:2px">${token}</p>
<a href="${link}" style="display:block;background:#FF6B35;color:white;text-align:center;padding:12px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
<p style="color:#999;font-size:12px;margin-top:16px">If you didn't request this, ignore this email.</p>
</div></div></body></html>`
}

export default async function authSubscriber({ event, container }: SubscriberArgs) {
  const logger = container.resolve("logger") as any
  const storefrontUrl = process.env.STOREFRONT_URL || "http://localhost:8000/gb"

  try {
    if (event.name === "customer.created") {
      const customer = event.data as any
      const email = customer.email
      const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Customer"

      if (!email) return

      // Generate verification token and store in customer metadata
      const token = generateToken()
      const customerService = container.resolve("customerService") as any
      if (customerService) {
        await customerService.update(customer.id, {
          metadata: {
            email_verified: false,
            verification_token: token,
          },
        })
      }

      await sendNotification(container, email, {
        subject: "Verify your email — IndiaGrocers",
        html: buildVerificationHtml(name, token, storefrontUrl),
      })

      logger?.info(`[auth] Verification email sent to ${email}`)
    }

    if (event.name === "auth.password_reset") {
      const data = event.data as any
      const email = data.entity_id || data.identifier

      if (!email) return

      // Medusa generates the reset token — just forward the notification
      const token = data.token || ""
      await sendNotification(container, email, {
        subject: "Reset your password — IndiaGrocers",
        html: buildResetHtml(email, token, storefrontUrl),
      })

      logger?.info(`[auth] Password reset email sent to ${email}`)
    }
  } catch (err: any) {
    logger?.error(`[auth] Subscriber error: ${err.message}`)
  }
}
