/**
 * Resend Email Provider
 *
 * Sends verification and password reset emails via Resend.
 * In dev mode (no API key), logs to console instead.
 *
 * Swap this for SES, Mailgun, or any other provider by implementing EmailProvider interface.
 */

import { Resend } from "resend"
import type {
  AuthConfig,
  EmailProvider,
  EmailResult,
  VerificationEmailData,
  PasswordResetEmailData,
} from "../types"

export function createResendProvider(config: AuthConfig): EmailProvider {
  const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null

  async function send(args: {
    to: string
    subject: string
    html: string
  }): Promise<EmailResult> {
    if (config.devMode || !resend) {
      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
      console.log("  [DEV EMAIL]")
      console.log("  To:      " + args.to)
      console.log("  Subject: " + args.subject)
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
      console.log(args.html)
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
      return { success: true, messageId: "dev-mode" }
    }

    try {
      const result = await resend.emails.send({
        from: config.fromEmail,
        to: args.to,
        subject: args.subject,
        html: args.html,
      })
      if (result.error) {
        return { success: false, error: result.error.message }
      }
      return { success: true, messageId: result.data?.id }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  return {
    async sendVerificationEmail(
      data: VerificationEmailData
    ): Promise<EmailResult> {
      return send({
        to: "",  // filled by caller
        subject: `Verify your email — ${data.storeName}`,
        html: buildVerificationEmail(data),
      })
    },

    async sendPasswordResetEmail(
      data: PasswordResetEmailData
    ): Promise<EmailResult> {
      return send({
        to: "",  // filled by caller
        subject: `Reset your password — ${data.storeName}`,
        html: buildPasswordResetEmail(data),
      })
    },
  }
}

// ── Email Templates (plain HTML — swap for React Email later) ──

function buildVerificationEmail(data: VerificationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
    <div style="background: #FF6B35; padding: 32px 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">${data.storeName}</h1>
    </div>
    <div style="padding: 32px 24px;">
      <h2 style="color: #333; font-size: 20px; margin: 0 0 12px;">Verify your email address</h2>
      <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
        Hi ${data.customerName},
      </p>
      <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Please verify your email address to activate your account and start shopping.
      </p>
      <a href="${data.verificationUrl}" style="display: block; background: #FF6B35; color: white; text-decoration: none; text-align: center; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 600; margin: 0 0 24px;">
        Verify Email
      </a>
      <p style="color: #999; font-size: 13px; line-height: 1.5; margin: 0;">
        If you didn't create an account, you can ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`
}

function buildPasswordResetEmail(data: PasswordResetEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
    <div style="background: #FF6B35; padding: 32px 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">${data.storeName}</h1>
    </div>
    <div style="padding: 32px 24px;">
      <h2 style="color: #333; font-size: 20px; margin: 0 0 12px;">Reset your password</h2>
      <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
        Hi ${data.customerName},
      </p>
      <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        You requested a password reset. Click below to set a new password.
      </p>
      <a href="${data.resetUrl}" style="display: block; background: #FF6B35; color: white; text-decoration: none; text-align: center; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 600; margin: 0 0 24px;">
        Reset Password
      </a>
      <p style="color: #999; font-size: 13px; line-height: 1.5; margin: 0;">
        If you didn't request this, you can ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`
}
