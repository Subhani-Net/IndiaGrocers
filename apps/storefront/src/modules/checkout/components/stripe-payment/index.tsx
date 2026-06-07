"use client"

import { useState, useCallback } from "react"
import { loadStripe, StripeCardElementOptions } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_KEY || "pk_test_placeholder"
)

const cardElementOptions: StripeCardElementOptions = {
  hidePostalCode: true,
  style: {
    base: {
      fontSize: "16px",
      color: "#444",
      fontFamily: "system-ui, -apple-system, sans-serif",
      "::placeholder": { color: "#aaa" },
    },
    invalid: { color: "#e53e3e" },
  },
}

interface StripePaymentProps {
  amount: number
  onPay: (paymentMethodId: string) => Promise<void>
  onError: (error: string) => void
  disabled: boolean
}

function StripeCardForm({ amount, onPay, onError, disabled }: StripePaymentProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const handlePay = useCallback(async () => {
    if (!stripe || !elements) {
      onError("Stripe is not ready. Please refresh the page.")
      return
    }

    setProcessing(true)
    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        onError("Card details not found. Please try again.")
        setProcessing(false)
        return
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      })

      if (error) {
        onError(error.message || "Card validation failed. Please check your card details.")
        setProcessing(false)
        return
      }

      if (paymentMethod) {
        await onPay(paymentMethod.id)
      }
    } catch (e: any) {
      onError(e.message || "Payment failed")
      setProcessing(false)
    }
  }, [stripe, elements, onPay, onError])

  const busy = processing || disabled

  return (
    <div>
      <div className="bg-white border border-stone-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800">Card Payment</p>
            <p className="text-xs text-stone-400">Powered by Stripe · Visa, Mastercard, Amex</p>
          </div>
        </div>

        <div className="border border-stone-200 rounded-lg p-3 bg-white" data-testid="stripe-card-element">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <button
        type="button"
        onClick={handlePay}
        disabled={busy}
        className="w-full py-3.5 bg-brand-orange text-white text-sm font-bold rounded-lg hover:bg-brand-orange/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        data-testid="stripe-pay-btn"
      >
        {busy ? "Processing..." : `Pay ${formatAmount(amount)}`}
      </button>

      <p className="text-center text-xs text-stone-400 mt-3">
        🔒 Secure payment. Your card details are never stored.
      </p>
    </div>
  )
}

function formatAmount(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100)
}

export default function StripePayment(props: StripePaymentProps) {
  return (
    <Elements stripe={stripePromise} options={{ appearance: { theme: "stripe" } }}>
      <StripeCardForm {...props} />
    </Elements>
  )
}
