/**
 * @indiagrocers/auth — Shared Types
 *
 * Designed for extraction as standalone service in future phases.
 * All interfaces are protocol-agnostic.
 */

/** Configuration passed to configureAuth() */
export interface AuthConfig {
  /** Resend API key for sending emails */
  resendApiKey: string
  /** From address for emails */
  fromEmail: string
  /** Base URL of the storefront (used for email links) */
  storefrontUrl: string
  /** OAuth providers configuration (Phase 5 — deferred) */
  oauth?: OAuthProviders
  /** Enable dev mode: log emails to console instead of sending */
  devMode?: boolean
}

/** OAuth provider config (Phase 5 — deferred) */
export interface OAuthProviders {
  google?: GoogleOAuthConfig
  facebook?: FacebookOAuthConfig
}

export interface GoogleOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface FacebookOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

/** Email template data for verification */
export interface VerificationEmailData {
  customerName: string
  verificationUrl: string
  storeName: string
}

/** Email template data for password reset */
export interface PasswordResetEmailData {
  customerName: string
  resetUrl: string
  storeName: string
}

/** Result of sending an email */
export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/** JWT payload for verification/reset tokens */
export interface AuthTokenPayload {
  sub: string        // auth_identity_id
  email: string       // customer email
  purpose: "verification" | "password_reset"
  iat: number
  exp: number
}

/** Abstract email provider — swap Resend for SES/Mailgun/etc. */
export interface EmailProvider {
  sendVerificationEmail(data: VerificationEmailData): Promise<EmailResult>
  sendPasswordResetEmail(data: PasswordResetEmailData): Promise<EmailResult>
}

/** Auth module export */
export interface AuthModule {
  /** Send verification email to a customer */
  sendVerificationEmail(email: string, customerName: string): Promise<EmailResult>
  /** Send password reset email to a customer */
  sendPasswordResetEmail(email: string, customerName: string): Promise<EmailResult>
  /** Verify a customer's email using a token */
  verifyEmail(token: string): Promise<{ success: boolean; email?: string }>
  /** Health check — used by future standalone service */
  healthCheck(): { status: string; config: Omit<AuthConfig, "resendApiKey"> }
}
