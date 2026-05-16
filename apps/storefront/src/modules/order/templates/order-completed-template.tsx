import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import OrderSummary from "@modules/order/components/order-summary"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  return (
    <div className="py-6 min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="content-container flex flex-col justify-center items-center gap-y-8 max-w-4xl h-full w-full">
        {isOnboarding && <OnboardingCta orderId={order.id} />}

        {/* Success Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-green mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Thank you! Your order #{order.display_id} has been placed.
          </h1>
          <p className="text-gray-500 mt-2">
            We have sent the order confirmation details to{" "}
            <span className="font-semibold">{order.email}</span>.
          </p>
        </div>

        {/* Orange Accent Bar */}
        <div className="w-full h-1 bg-brand-orange rounded-full" />

        {/* Delivery ETA */}
        <div className="w-full bg-orange-50 border border-brand-orange rounded-lg p-4 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-brand-orange mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-semibold text-brand-orange">Estimated Delivery</p>
            <p className="text-gray-700 text-sm">
              Your order is expected to arrive within 3-5 business days.
            </p>
          </div>
        </div>

        {/* Order Details Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Delivery Address
            </h3>
            <ShippingDetails order={order} />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Payment Info
            </h3>
            <PaymentDetails order={order} />
          </div>
        </div>

        {/* Order Items */}
        <div className="w-full bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Items Ordered
          </h3>
          <Items order={order} />
        </div>

        {/* Order Summary */}
        <div className="w-full bg-gray-50 rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
          <OrderSummary order={order} />
        </div>

        {/* Continue Shopping */}
        <LocalizedClientLink href="/">
          <button className="btn-primary text-lg px-10 py-3">
            Continue Shopping
          </button>
        </LocalizedClientLink>

        <Help />
      </div>
    </div>
  )
}
