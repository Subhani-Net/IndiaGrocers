"use client"

import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  if (orders?.length) {
    return (
      <div className="flex flex-col gap-y-6 w-full">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center gap-y-6 py-16 bg-white rounded-lg border border-gray-200 shadow-sm"
      data-testid="no-orders-container"
    >
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900">Nothing to see here</h2>
      <p className="text-gray-500 text-sm">
        You don&apos;t have any orders yet, let us change that {":)"}
      </p>
      <LocalizedClientLink href="/" passHref>
        <button className="btn-primary" data-testid="continue-shopping-button">
          Continue shopping
        </button>
      </LocalizedClientLink>
    </div>
  )
}

export default OrderOverview
