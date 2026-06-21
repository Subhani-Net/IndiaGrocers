"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Items from "@modules/order/components/items"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import OrderSummary from "@modules/order/components/order-summary"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { DELIVERY_ETA_RANGE, STANDARD_ETA } from "@lib/config/store-config"
import { HttpTypes } from "@medusajs/types"

type Props = {
  order: HttpTypes.StoreOrder
}

// ─── Safe helpers — never crash on missing data ───

function safeString(val: unknown, fallback = "—"): string {
  if (val === null || val === undefined) return fallback
  return String(val)
}

function safeNumber(val: unknown, fallback = 0): number {
  const n = Number(val)
  return Number.isFinite(n) ? n : fallback
}

// ─── Repeat Order button ───

function RepeatOrderButton({ order }: { order: HttpTypes.StoreOrder | null }) {
  const [adding, setAdding] = useState(false)
  const [done, setDone] = useState(false)

  const handleRepeat = async () => {
    if (!order?.items?.length || adding) return
    setAdding(true)
    try {
      const { addToCart } = await import("@lib/data/cart")
      for (const item of order.items) {
        if (item?.variant_id && item?.quantity) {
          const cc =
            order?.shipping_address?.country_code?.toLowerCase() || "gb"
          await addToCart({
            variantId: item.variant_id,
            quantity: item.quantity,
            countryCode: cc,
          })
        }
      }
      window.dispatchEvent(new Event("cart-updated"))
      setDone(true)
      setTimeout(() => setDone(false), 2500)
    } catch {
      // silent
    } finally {
      setAdding(false)
    }
  }

  if (!order?.items?.length) return null

  return (
    <button
      onClick={handleRepeat}
      disabled={adding || done}
      className={`w-full py-2.5 text-sm font-semibold rounded-xl border transition-all active:scale-[0.98] ${
        done
          ? "bg-green-50 border-green-300 text-green-700"
          : "border-brand-orange/30 text-brand-orange hover:bg-brand-orange/5"
      }`}
    >
      {done ? "✓ Added to Cart" : adding ? "Adding..." : "🔄 Repeat This Order"}
    </button>
  )
}

// ─── Order Status Tracker (dynamic — driven by order state) ───

function OrderStatusTracker({ order }: { order: HttpTypes.StoreOrder }) {
  const orderStatus = order?.status || "pending"
  const fulfillmentStatus = order?.fulfillment_status || "not_fulfilled"
  const paymentCollection = (order as any)?.payment_collections?.[0]
  const paymentCaptured = paymentCollection?.status === "completed" || paymentCollection?.status === "captured"

  // Determine which steps are complete based on actual order state
  const paymentDone = orderStatus !== "pending" || paymentCaptured
  const orderDone = orderStatus === "completed" || orderStatus === "archived"
  const fulfilled = ["fulfilled", "partially_fulfilled", "shipped", "partially_shipped", "delivered", "partially_delivered"].includes(fulfillmentStatus)
  const shipped = ["shipped", "partially_shipped", "delivered", "partially_delivered"].includes(fulfillmentStatus)

  const steps = [
    { label: "Order Confirmed", desc: "Payment received", done: paymentDone },
    { label: "Processing", desc: "Preparing your groceries", done: orderDone },
    { label: "Out for Delivery", desc: "On its way to you", done: fulfilled },
    { label: "Delivered", desc: "Enjoy your groceries!", done: shipped },
  ]

  // Find the current active step (first undone)
  const activeIndex = steps.findIndex(s => !s.done)
  const currentStep = activeIndex === -1 ? steps.length - 1 : activeIndex

  return (
    <div className="w-full bg-white border border-stone-200 rounded-xl p-4 sm:p-5 print:hidden">
      <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4">
        Order Status
      </h3>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.done
                    ? "bg-green-500"
                    : i === currentStep
                    ? "bg-brand-orange animate-pulse"
                    : "bg-stone-200"
                }`}
              >
                {step.done ? (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : i === currentStep ? (
                  <svg className="w-3.5 h-3.5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-0.5 h-4 ${step.done ? "bg-green-200" : "bg-stone-200"}`} />
              )}
            </div>
            <div className="pb-2">
              <p className={`text-sm font-semibold ${step.done ? "text-stone-800" : i === currentStep ? "text-brand-orange" : "text-stone-400"}`}>
                {step.label}
              </p>
              <p className="text-xs text-stone-400">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Print Receipt Button ───

function PrintReceiptButton() {
  return (
    <button
      onClick={() => window.print()}
      className="w-full py-2.5 text-sm font-semibold text-stone-600 border border-stone-200 rounded-xl hover:border-brand-orange/30 hover:text-brand-orange transition-colors print:hidden"
    >
      🖨️ Print Receipt
    </button>
  )
}

// ─── Main Template ───

export default function OrderCompletedTemplate({ order }: Props) {
  const [showSavePrompt, setShowSavePrompt] = useState(true)
  const router = useRouter()

  // ─── Safe data extraction with fallbacks ───
  const displayId =
    safeString(order?.display_id) ||
    order?.id?.slice(-8)?.toUpperCase() ||
    order?.id ||
    "—"
  const items = order?.items ?? []
  const itemCount = items.length
  const total = safeNumber(order?.total, 0)
  const shipping = order?.shipping_methods?.[0]?.amount ?? 0
  const isFreeDelivery = shipping === 0
  const countryCode = order?.shipping_address?.country_code?.toLowerCase() || "gb"

  // ─── Delivery ETA — reads shipping method metadata slot if available ───
  const shippingMeta = (order?.shipping_methods?.[0]?.metadata || {}) as Record<string, string>
  const deliverySlotDate = shippingMeta?.delivery_date || ""
  const deliverySlotWindow = shippingMeta?.delivery_window || ""

  // Prevent back-button re-submit
  useEffect(() => {
    if (typeof window !== "undefined") {
      router.replace(window.location.pathname + window.location.search)
    }
  }, [])

  return (
    <>
      {/* ─── Print stylesheet ─── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .print-hidden { display: none !important; }
          @page { margin: 1cm; size: A4; }
        }
      `}</style>

      <div className="py-8 sm:py-12 min-h-screen bg-stone-50 print-area">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-y-6">

        {/* ─── Success Checkmark ─── */}
        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20 print-hidden">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* ─── Thank You ─── */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
            Order Confirmed!
          </h1>
          <p className="text-stone-500 mt-2">
            Your order number is{" "}
            <span className="font-bold text-brand-orange">#{displayId}</span>
          </p>
          {isFreeDelivery && (
            <p className="text-xs text-green-600 mt-1 font-medium">
              🎉 Free delivery on this order
            </p>
          )}
        </div>

        {/* ─── Estimated Delivery ─── */}
        <div className="w-full bg-white border border-stone-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🚚</span>
            <div>
              <p className="font-bold text-stone-800">Estimated Delivery</p>
              {deliverySlotDate ? (
                <p className="text-sm text-stone-500 mt-0.5">
                  Your delivery is scheduled for{" "}
                  <span className="font-semibold text-stone-700">{deliverySlotDate}</span>
                  {deliverySlotWindow && (
                    <> between{" "}<span className="font-semibold text-stone-700">{deliverySlotWindow}</span></>
                  )}
                </p>
              ) : (
                <p className="text-sm text-stone-500 mt-0.5">
                  {STANDARD_ETA || "3–5 working days"} · between {DELIVERY_ETA_RANGE || "8am–8pm"}
                </p>
              )}
              <p className="text-xs text-stone-400 mt-1">
                You&apos;ll receive tracking updates via email
              </p>
            </div>
          </div>
        </div>

        {/* ─── Order Status Tracker (dynamic) ─── */}
        <OrderStatusTracker order={order} />

        {/* ─── Delivery + Payment Cards ─── */}
        {order && (
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
        )}

        {/* ─── Items Ordered ─── */}
        {items.length > 0 && order && (
          <div className="w-full bg-white rounded-xl border border-stone-200 p-4 sm:p-5">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
              Items Ordered ({itemCount})
            </h3>
            <Items order={order} />
          </div>
        )}

        {/* ─── Order Summary ─── */}
        {order && (
          <div className="w-full bg-white rounded-xl border border-stone-200 p-4 sm:p-5">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
              Order Summary
            </h3>
            <OrderSummary order={order} />
          </div>
        )}

        {/* ─── Loyalty Points ─── */}
        {total > 0 && (
          <div className="w-full bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌶️</span>
              <p className="text-sm text-purple-800 font-medium">
                You earned{" "}
                <span className="font-bold">
                  {Math.round(total / 100)} Spice Points
                </span>{" "}
                on this order!
              </p>
            </div>
          </div>
        )}

        {/* ─── Post-Purchase Actions ─── */}
        <div className="w-full space-y-3">
          <RepeatOrderButton order={order} />
          <PrintReceiptButton />

          <LocalizedClientLink
            href="/account/orders"
            className="block w-full py-2.5 text-sm font-semibold text-center text-stone-600 border border-stone-200 rounded-xl hover:border-brand-orange/30 hover:text-brand-orange transition-colors"
          >
            📋 View Order History
          </LocalizedClientLink>
        </div>

        {/* ─── Save Details Prompt ─── */}
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

        {/* ─── Continue Shopping ─── */}
        <LocalizedClientLink href="/store" className="w-full">
          <button className="w-full py-3.5 bg-brand-orange text-white text-sm font-bold rounded-xl hover:bg-brand-orange/90 active:scale-[0.98] transition-all">
            Continue Shopping
          </button>
        </LocalizedClientLink>

        {/* ─── Footer ─── */}
        <p className="text-xs text-stone-400 pb-4">
          Need help?{" "}
          <LocalizedClientLink
            href="/account/orders"
            className="text-brand-orange font-medium hover:underline"
          >
            View your orders
          </LocalizedClientLink>{" "}
          or contact support.
        </p>
      </div>
      </div>
    </>
  )
}
