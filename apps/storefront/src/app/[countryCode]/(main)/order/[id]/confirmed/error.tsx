"use client"

import { useEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function OrderError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[OrderConfirmed] render error:", error?.message || error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-white rounded-xl border border-stone-200 p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-stone-900 mb-2">
          Order Confirmed
        </h1>
        <p className="text-sm text-stone-500 mb-4">
          Your payment was successful and your order has been placed. Some
          details are still loading — they&apos;ll appear shortly.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={reset}
            className="w-full py-3 bg-brand-orange text-white font-bold rounded-lg hover:bg-brand-orange/90 active:scale-[0.98] transition-all text-sm"
          >
            Try Again
          </button>
          <LocalizedClientLink
            href="/store"
            className="block w-full py-2.5 text-sm font-semibold text-stone-600 border border-stone-200 rounded-lg hover:border-brand-orange/30 transition-colors"
          >
            Continue Shopping
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
