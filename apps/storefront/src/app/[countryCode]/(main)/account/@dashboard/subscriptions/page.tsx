"use client"

import { useState } from "react"
import { formatGBP } from "@lib/util/format-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface Subscription {
  id: string
  productTitle: string
  productHandle: string
  variantWeight: string
  price: number
  discountedPrice: number
  discountPct: number
  interval: string
  nextDelivery: string
  status: "active" | "paused" | "cancelled"
}

const SAMPLE_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub_1",
    productTitle: "Aashirvaad Select Atta",
    productHandle: "aashirvaad-atta-10kg",
    variantWeight: "10kg",
    price: 899,
    discountedPrice: 827,
    discountPct: 8,
    interval: "monthly",
    nextDelivery: new Date(Date.now() + 30 * 86400000).toISOString(),
    status: "active",
  },
  {
    id: "sub_2",
    productTitle: "India Gate Basmati Rice",
    productHandle: "india-gate-basmati-5kg",
    variantWeight: "5kg",
    price: 1099,
    discountedPrice: 1011,
    discountPct: 8,
    interval: "monthly",
    nextDelivery: new Date(Date.now() + 30 * 86400000).toISOString(),
    status: "active",
  },
]

export default function SubscriptionManagement() {
  const [subs, setSubs] = useState(SAMPLE_SUBSCRIPTIONS)

  const toggleStatus = (id: string) => {
    setSubs((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: s.status === "active" ? "paused" : "active",
            }
          : s
      )
    )
  }

  const cancelSub = (id: string) => {
    setSubs((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: "cancelled" } : s
      )
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">
        Subscriptions
      </h1>

      {subs.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl block mb-3">🔄</span>
          <h3 className="text-lg font-semibold text-stone-700">
            No subscriptions yet
          </h3>
          <p className="text-sm text-stone-500 mt-1 mb-4">
            Subscribe to your staples and save on every delivery
          </p>
          <LocalizedClientLink href="/store">
            <button className="px-6 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-orange/90">
              Browse Products
            </button>
          </LocalizedClientLink>
        </div>
      ) : (
        <div className="space-y-3">
          {subs.map((sub) => {
            const isActive = sub.status === "active"
            const isPaused = sub.status === "paused"

            return (
              <div
                key={sub.id}
                className={`bg-white rounded-xl border p-4 ${
                  sub.status === "cancelled"
                    ? "border-stone-100 opacity-50"
                    : "border-stone-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <LocalizedClientLink
                      href={`/products/${sub.productHandle}`}
                    >
                      <h3 className="text-sm font-semibold text-stone-800 truncate">
                        {sub.productTitle}
                      </h3>
                    </LocalizedClientLink>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-stone-400">
                        {sub.variantWeight}
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-700 font-medium px-2 py-0.5 rounded-full">
                        {sub.interval}
                      </span>
                      <span className="text-xs text-stone-400 line-through">
                        {formatGBP(sub.price)}
                      </span>
                      <span className="text-xs font-bold text-purple-700">
                        {formatGBP(sub.discountedPrice)}
                      </span>
                      <span className="text-[10px] text-green-600 font-medium">
                        ({sub.discountPct}% off)
                      </span>
                    </div>

                    {isActive && (
                      <p className="text-xs text-stone-400 mt-1.5">
                        Next delivery:{" "}
                        {new Date(sub.nextDelivery).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </p>
                    )}
                    {isPaused && (
                      <p className="text-xs text-amber-600 mt-1.5 font-medium">
                        ⏸ Paused — resume to continue deliveries
                      </p>
                    )}
                    {sub.status === "cancelled" && (
                      <p className="text-xs text-stone-400 mt-1.5">
                        Cancelled
                      </p>
                    )}
                  </div>

                  {sub.status !== "cancelled" && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleStatus(sub.id)}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                          isActive
                            ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                            : "border-green-200 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {isActive ? "Pause" : "Resume"}
                      </button>
                      <button
                        onClick={() => cancelSub(sub.id)}
                        className="text-xs text-stone-400 hover:text-red-500 px-1"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
