"use client"

import { useState } from "react"
import Items from "@modules/order/components/items"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import OrderSummary from "@modules/order/components/order-summary"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { DELIVERY_ETA_RANGE } from "@lib/config/store-config"
import { HttpTypes } from "@medusajs/types"

type Props = {
  order: HttpTypes.StoreOrder
}

export default function OrderCompletedTemplate({ order }: Props) {
  const [showSavePrompt, setShowSavePrompt] = useState(true)

  const displayId = (order as any)?.display_id || order.id?.slice(-8).toUpperCase() || order.id
  const items = order.items || []
  const itemCount = items.length
  const total = (order as any)?.total || 0
  const currencyCode = (order as any)?.currency_code || "gbp"

  // Delivery ETA — 3-5 business days from now
  const eta = new Date()
  eta.setDate(eta.getDate() + 3)
  const etaStr = eta.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="py-8 sm:py-12 min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-y-6">

        {/* Success Checkmark */}
        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Thank You */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
            Order Confirmed!
          </h1>
          <p className="text-stone-500 mt-2">
            Your order number is{" "}
            <span className="font-bold text-brand-orange">#{displayId}</span>
          </p>
        </div>

        {/* Estimated Delivery */}
        <div className="w-full bg-white border border-stone-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🚚</span>
            <div>
              <p className="font-bold text-stone-800">Estimated Delivery</p>
              <p className="text-sm text-stone-500 mt-0.5">
                Your order will arrive by{" "}
                <span className="font-semibold text-stone-700">{etaStr}</span>
                {" "}between {DELIVERY_ETA_RANGE}
              </p>
              <p className="text-xs text-stone-400 mt-1">
                You&apos;ll receive tracking updates via email and SMS
              </p>
            </div>
          </div>
        </div>

        {/* Delivery + Payment Cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              📍 Delivery Address
            </h3>
            <ShippingDetails order={order} />
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              💳 Payment
            </h3>
            <PaymentDetails order={order} />
          </div>
        </div>

        {/* Items Ordered */}
        <div className="w-full bg-white rounded-xl border border-stone-200 p-4 sm:p-5">
          <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
            Items Ordered ({itemCount})
          </h3>
          <Items order={order} />
        </div>

        {/* Order Summary */}
        <div className="w-full bg-white rounded-xl border border-stone-200 p-4 sm:p-5">
          <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
            Order Summary
          </h3>
          <OrderSummary order={order} />
        </div>

        {/* Loyalty Points Earned */}
        <div className="w-full bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌶️</span>
            <p className="text-sm text-purple-800 font-medium">
              You earned{" "}
              <span className="font-bold">
                {Math.round(Number(total) / 100)} Spice Points
              </span>{" "}
              on this order!
            </p>
          </div>
        </div>

        {/* Save Details Prompt (first-time customers) */}
        {showSavePrompt && (
          <div className="w-full bg-gradient-to-r from-brand-orange/5 to-amber-50 border border-brand-orange/20 rounded-xl p-4 sm:p-5">
            <p className="text-sm font-semibold text-stone-800 mb-2">
              Save your details for next time
            </p>
            <p className="text-xs text-stone-500 mb-3">
              Create an account and breeze through checkout on your next order.
            </p>
            <div className="flex gap-2">
              <LocalizedClientLink href="/account?mode=register">
                <button className="px-5 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-orange/90 active:scale-95 transition-all">
                  Create Account
                </button>
              </LocalizedClientLink>
              <button
                onClick={() => setShowSavePrompt(false)}
                className="px-5 py-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        )}

        {/* Continue Shopping */}
        <LocalizedClientLink href="/store" className="w-full">
          <button className="w-full py-3.5 bg-brand-orange text-white text-sm font-bold rounded-xl hover:bg-brand-orange/90 active:scale-[0.98] transition-all">
            Continue Shopping
          </button>
        </LocalizedClientLink>

        {/* Help link */}
        <p className="text-xs text-stone-400">
          Need help?{" "}
          <LocalizedClientLink
            href="/account/orders"
            className="text-brand-orange font-medium hover:underline"
          >
            View your order
          </LocalizedClientLink>{" "}
          or contact support.
        </p>
      </div>
    </div>
  )
}
