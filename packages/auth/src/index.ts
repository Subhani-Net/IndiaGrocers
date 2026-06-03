/**
 * @indiagrocers/auth — Core Module
 *
 * Pure Node.js auth module. No Medusa/Next.js dependencies.
 * Designed for extraction as standalone service.
 *
 * Usage:
 *   import { createAuth } from "@indiagrocers/auth"
 *   const auth = createAuth({ resendApiKey, fromEmail, storefrontUrl })
 */

import jwt from "jsonwebtoken"
import { createResendProvider } from "./email/provider"
import type { AuthConfig, AuthModule, AuthTokenPayload } from "./types"

export type { AuthConfig, AuthModule, AuthTokenPayload, EmailProvider, VerificationEmailData, PasswordResetEmailData } from "./types.js"

export function createAuth(config: AuthConfig): AuthModule {
  const email = createResendProvider(config)
  const jwtSecret = config.resendApiKey || "dev-secret"

  function generateToken(
    sub: string,
    emailAddr: string,
    purpose: "verification" | "password_reset"
  ): string {
    const payload: AuthTokenPayload = {
      sub, email: emailAddr, purpose,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    }
    return jwt.sign(payload, jwtSecret)
  }

  function verifyToken(token: string): AuthTokenPayload | null {
    try {
      const payload = jwt.verify(token, jwtSecret) as AuthTokenPayload
      if (payload.purpose !== "verification" && payload.purpose !== "password_reset") {
        return null
      }
      return payload
    } catch { return null }
  }

  return {
    async sendVerificationEmail(emailAddr: string, customerName: string) {
      const token = generateToken(emailAddr, emailAddr, "verification")
      const verificationUrl = `${config.storefrontUrl}/verify?token=${token}`
      return email.sendVerificationEmail({ customerName, verificationUrl, storeName: "IndiaGrocers" })
    },

    async sendPasswordResetEmail(emailAddr: string, customerName: string) {
      const token = generateToken(emailAddr, emailAddr, "password_reset")
      const resetUrl = `${config.storefrontUrl}/reset-password?token=${token}`
      return email.sendPasswordResetEmail({ customerName, resetUrl, storeName: "IndiaGrocers" })
    },

    async verifyEmail(token: string) {
      const payload = verifyToken(token)
      if (!payload) return { success: false }
      return { success: true, email: payload.email }
    },

    healthCheck() {
      const { resendApiKey, ...safe } = config
      return { status: "ok", config: safe }
    },
  }
}
