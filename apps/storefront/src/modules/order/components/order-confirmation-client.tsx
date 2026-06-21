"use client"

import { useState, useEffect, useRef } from "react"
import { HttpTypes } from "@medusajs/types"
import { retrieveOrder } from "@lib/data/orders"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// ─── Polling intervals (ms from start of previous attempt) ───
// Extended from 4 to 6 attempts to give the backend workflow
// enough time to commit the order (Stripe PI creation + authorization).
// Total window: ~30s before failover screen.
const RETRY_INTERVALS = [0, 2000, 4000, 6000, 8000, 10000]
const MAX_ATTEMPTS = RETRY_INTERVALS.length

type Status = "loading" | "success" | "failed"

interface OrderConfirmationClientProps {
  orderId: string
}

export default function OrderConfirmationClient({
  orderId,
}: OrderConfirmationClientProps) {
  const [status, setStatus] = useState<Status>("loading")
  const [order, setOrder] = useState<HttpTypes.StoreOrder | null>(null)
  const [attempt, setAttempt] = useState(0)

  const cancelledRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // ─── Polling engine ───
  useEffect(() => {
    cancelledRef.current = false

    const schedulePoll = (index: number) => {
      if (cancelledRef.current) return
      if (index >= MAX_ATTEMPTS) {
        setStatus("failed")
        return
      }

      const delay = RETRY_INTERVALS[index]

      const poll = async () => {
        if (cancelledRef.current) return

        try {
          const result = await retrieveOrder(orderId)
          if (cancelledRef.current) return
          if (result) {
            setOrder(result)
            setStatus("success")
            return // ← terminate: success
          }
        } catch {
          // silent — will retry
        }

        if (cancelledRef.current) return
        setAttempt(index + 1)

        // Schedule next retry
        if (index + 1 < MAX_ATTEMPTS) {
          timerRef.current = setTimeout(
            () => schedulePoll(index + 1),
            RETRY_INTERVALS[index + 1]
          )
        } else {
          setStatus("failed")
        }
      }

      if (delay === 0) {
        poll()
      } else {
        timerRef.current = setTimeout(poll, delay)
      }
    }

    schedulePoll(0)

    return () => {
      cancelledRef.current = true
      if (timerRef.current !== undefined) {
        clearTimeout(timerRef.current)
      }
    }
  }, [orderId])

  // ─── OPTIMISTIC LOADING ───
  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-lg w-full mx-auto px-4 text-center">
          {/* Pulse indicator */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-brand-orange/10 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-brand-orange animate-pulse" />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 mb-2">
            Finishing your order...
          </h1>
          <p className="text-sm text-stone-500 mb-8">
            Please do not close or refresh this page.
          </p>

          {/* Skeleton receipts */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-stone-200 p-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-stone-100 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-stone-100 rounded w-3/4" />
                    <div className="h-3 bg-stone-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-stone-400 mt-6">
            Attempt {attempt + 1} of {MAX_ATTEMPTS}
          </p>
        </div>
      </div>
    )
  }

  // ─── SUCCESS ───
  if (status === "success" && order) {
    return <OrderCompletedTemplate order={order} />
  }

  // ─── FAILOVER (all retries exhausted) ───
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
          Your order has been placed successfully. Full details will appear
          shortly.
        </p>
        <div className="bg-stone-50 rounded-lg p-3 mb-6 text-left">
          <p className="text-xs text-stone-400 mb-1">Order number</p>
          <p className="text-sm font-mono font-semibold text-stone-700 break-all">
            {orderId}
          </p>
        </div>
        <p className="text-xs text-stone-400 mb-6">
          A confirmation email is on its way. If you don&apos;t see your order in
          a few minutes, try refreshing this page.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-brand-orange text-white font-bold rounded-lg hover:bg-brand-orange/90 active:scale-[0.98] transition-all text-sm"
          >
            Refresh Page
          </button>
          <LocalizedClientLink
            href="/account/orders"
            className="block w-full py-2.5 text-sm font-semibold text-stone-600 border border-stone-200 rounded-lg hover:border-brand-orange/30 transition-colors"
          >
            View Order History
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
