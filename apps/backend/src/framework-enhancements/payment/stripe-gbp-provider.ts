/**
 * STRIPE GBP PAYMENT PROVIDER
 *
 * Framework enhancement — standalone Stripe provider that fixes a unit mismatch
 * in Medusa v2's @medusajs/payment-stripe@2.15.2 for GBP transactions.
 *
 * PROBLEM:
 * Medusa v2 stores amounts in pence. The stock Stripe provider calls
 * getSmallestUnit() which multiplies by 100. Since amounts are already in pence,
 * the result is 100× overcharge. This provider skips that conversion for GBP.
 *
 * UPGRADE CHECK:
 * After upgrading @medusajs/payment-stripe, verify payment session amounts match
 * Stripe charges. If correct without this provider, delete and revert medusa-config.ts.
 */
import { AbstractPaymentProvider } from "@medusajs/framework/utils"
import Stripe from "stripe"

console.log("=== STRIPE-GBP-PROVIDER LOADED ===")

// Stock Stripe-provider identifiers (same IDs so existing sessions are recognised)
const IDENTIFIERS = {
  STRIPE: "stripe",
  STRIPE_BANCONTACT: "stripe-bancontact",
  STRIPE_BLIK: "stripe-blik",
  STRIPE_GIROPAY: "stripe-giropay",
  STRIPE_IDEAL: "stripe-ideal",
  STRIPE_PRZELEWY24: "stripe-przelewy24",
  STRIPE_PROMPT_PAY: "stripe-promptpay",
  STRIPE_OXOO: "stripe-oxxo",
}

// Core provider — creates Stripe PaymentIntents with correct GBP amounts
abstract class StripeGbpBaseProvider extends AbstractPaymentProvider {
  protected stripe_: Stripe
  protected options_: Record<string, unknown>

  constructor(cradle: any, options: any) {
    super(cradle, options)
    this.options_ = options
    this.stripe_ = new Stripe(options.apiKey || "", {
      // @ts-ignore
      apiVersion: "2024-04-10",
    })
  }

  async initiatePayment(input: {
    currency_code: string
    amount: number
    data: Record<string, unknown>
    context: Record<string, unknown>
  }): Promise<any> {
    console.log("[stripe-gbp] ★ initiatePayment CALLED", "amount:", input.amount, "currency:", input.currency_code)
    const amount = input.amount
    const currency = input.currency_code

    try {
      const pi = await this.stripe_.paymentIntents.create({
        amount,
        currency,
        capture_method: (this.options_.capture ? "automatic" : "manual") as Stripe.PaymentIntentCreateParams.CaptureMethod,
        automatic_payment_methods: this.options_.automaticPaymentMethods ? { enabled: true } : undefined,
        payment_method: (input.data as any)?.payment_method,
        confirm: (input.data as any)?.confirm,
        return_url: (input.data as any)?.return_url,
        metadata: {
          session_id: (input.context as any)?.session_id ?? "",
          resource_id: (input.context as any)?.resource_id ?? "",
        },
      })

      console.log("[stripe-gbp] initiatePayment: PI created", pi.id, "status:", pi.status)
      return {
        id: pi.id,
        data: { ...input.data, stripe_pi_id: pi.id } as any,
      }
    } catch (err: any) {
      console.log("[stripe-gbp] ★ initiatePayment FAILED:", err.message)
      return this.buildPaymentError("Failed to initiate Stripe payment", err)
    }
  }

  async authorizePayment(input: any): Promise<{ data: Record<string, unknown>; status: string }> {
    // PaymentIntent was created with confirm: true during initiatePayment
    // so Stripe has already confirmed it. Check the ACTUAL Stripe status
    // rather than blindly returning "authorized".
    // With capture_method: "automatic", the PI may already be "succeeded" →
    // the payment should show as "captured" in Medusa immediately.
    const piId = input.data?.id || input.data?.stripe_pi_id
    if (!piId) {
      console.log("[stripe-gbp] authorizePayment: NO PI ID — returning pending")
      return { data: input.data || {}, status: "pending" }
    }
    try {
      const pi = await this.stripe_.paymentIntents.retrieve(piId)
      const status = this.mapStripeStatus(pi.status)
      console.log(`[stripe-gbp] authorizePayment: PI ${piId} Stripe status=${pi.status} → Medusa status=${status}`)
      return { data: { ...input.data, stripe_pi_id: pi.id }, status }
    } catch (err: any) {
      console.log("[stripe-gbp] authorizePayment: Stripe retrieve failed:", err.message)
      return { data: input.data || {}, status: "authorized" }
    }
  }

  async getPaymentStatus(input: any): Promise<{ data: Record<string, unknown>; status: string }> {
    try {
      // PI ID comes either directly in data.id or from stripe_pi_id stored during initiatePayment
      const piId = input.data?.id || input.data?.stripe_pi_id
      if (!piId) {
        console.log("[stripe-gbp] getPaymentStatus: NO PI ID found — data keys:", Object.keys(input.data || {}))
        return { data: input.data || {}, status: "pending" }
      }

      const pi = await this.stripe_.paymentIntents.retrieve(piId)
      return { data: pi as any, status: this.mapStripeStatus(pi.status) }
    } catch (err: any) {
      console.log("[stripe-gbp] getPaymentStatus ERROR:", err.message)
      return { data: input.data || {}, status: "pending" }
    }
  }

  async capturePayment(input: any): Promise<{ data: Record<string, unknown> }> {
    try {
      const id = input.data?.id as string
      const pi = await this.stripe_.paymentIntents.capture(id)
      return { data: pi as unknown as Record<string, unknown> }
    } catch (err: any) {
      throw this.buildPaymentError("Failed to capture Stripe payment", err)
    }
  }

  async cancelPayment(input: any): Promise<{ data: Record<string, unknown> }> {
    try {
      const id = input.data?.id as string
      if (!id) return { data: input.data || {} }
      const pi = await this.stripe_.paymentIntents.cancel(id)
      return { data: pi as unknown as Record<string, unknown> }
    } catch (err: any) {
      throw this.buildPaymentError("Failed to cancel Stripe payment", err)
    }
  }

  async refundPayment(input: {
    amount: number
    data: Record<string, unknown>
    context: Record<string, unknown>
  }): Promise<{ data: Record<string, unknown> }> {
    try {
      const id = input.data?.id as string
      await this.stripe_.refunds.create({
        amount: input.amount,
        payment_intent: id,
      })
      return { data: input.data }
    } catch (err: any) {
      if ((err as any)?.code === "CHARGE_ALREADY_REFUNDED") {
        return { data: input.data }
      }
      throw this.buildPaymentError("Failed to refund Stripe payment", err)
    }
  }

  async retrievePayment(input: any): Promise<{ data: Record<string, unknown> }> {
    try {
      const id = input.data?.id as string
      const pi = await this.stripe_.paymentIntents.retrieve(id)
      return { data: pi as unknown as Record<string, unknown> }
    } catch (err: any) {
      throw this.buildPaymentError("Failed to retrieve Stripe payment", err)
    }
  }

  async updatePayment(input: {
    amount: number
    currency_code: string
    data: Record<string, unknown>
    context: Record<string, unknown>
  }): Promise<any> {
    try {
      const id = input.data?.id as string
      const pi = await this.stripe_.paymentIntents.update(id, { amount: input.amount })
      return this.getPaymentStatus({ data: pi })
    } catch (err: any) {
      throw this.buildPaymentError("Failed to update Stripe payment", err)
    }
  }

  async deletePayment(input: any): Promise<void> {
    // Stripe PaymentIntents cannot be deleted — just return
  }

  // ── Webhook support: verifies Stripe signature, maps events to Medusa actions ──

  constructWebhookEvent(payload: { rawBody: Buffer; signature: string }): Stripe.Event {
    return this.stripe_.webhooks.constructEvent(
      payload.rawBody,
      payload.signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    )
  }

  async getWebhookActionAndData(data: { event: any }): Promise<{ action: string; data: Record<string, unknown> } | null> {
    const event = data.event as Stripe.Event
    switch (event.type) {
      case "payment_intent.succeeded":
        return {
          action: "captured",
          data: {
            session_id: (event.data.object as any).metadata?.session_id,
            amount: (event.data.object as any).amount,
          },
        }
      case "payment_intent.payment_failed":
        return {
          action: "failed",
          data: {
            session_id: (event.data.object as any).metadata?.session_id,
          },
        }
      default:
        return null
    }
  }

  private mapStripeStatus(status: string): string {
    switch (status) {
      case "requires_payment_method": return "pending"
      case "requires_confirmation": return "pending"
      case "requires_capture": return "authorized"
      case "processing": return "authorized"
      case "succeeded": return "captured"
      case "canceled": return "canceled"
      case "requires_action": return "requires_more"
      default: return "pending"
    }
  }

  private buildPaymentError(message: string, err: Error): Error {
    return new Error(`${message}: ${err.message}`)
  }
}

// Method-specific providers
class StripeGbpProviderService extends StripeGbpBaseProvider {}
StripeGbpProviderService.identifier = IDENTIFIERS.STRIPE

class StripeGbpBancontactService extends StripeGbpBaseProvider {}
StripeGbpBancontactService.identifier = IDENTIFIERS.STRIPE_BANCONTACT

class StripeGbpBlikService extends StripeGbpBaseProvider {}
StripeGbpBlikService.identifier = IDENTIFIERS.STRIPE_BLIK

class StripeGbpGiropayService extends StripeGbpBaseProvider {}
StripeGbpGiropayService.identifier = IDENTIFIERS.STRIPE_GIROPAY

class StripeGbpIdealService extends StripeGbpBaseProvider {}
StripeGbpIdealService.identifier = IDENTIFIERS.STRIPE_IDEAL

class StripeGbpPrzelewy24Service extends StripeGbpBaseProvider {}
StripeGbpPrzelewy24Service.identifier = IDENTIFIERS.STRIPE_PRZELEWY24

class StripeGbpPromptpayService extends StripeGbpBaseProvider {}
StripeGbpPromptpayService.identifier = IDENTIFIERS.STRIPE_PROMPT_PAY

class StripeGbpOxxoService extends StripeGbpBaseProvider {}
StripeGbpOxxoService.identifier = IDENTIFIERS.STRIPE_OXOO

import { ModuleProvider } from "@medusajs/framework/utils"
import { Modules } from "@medusajs/framework/utils"

export default ModuleProvider(Modules.PAYMENT, {
  services: [
    StripeGbpBancontactService,
    StripeGbpBlikService,
    StripeGbpGiropayService,
    StripeGbpIdealService,
    StripeGbpProviderService,
    StripeGbpPrzelewy24Service,
    StripeGbpPromptpayService,
    StripeGbpOxxoService,
  ],
})
