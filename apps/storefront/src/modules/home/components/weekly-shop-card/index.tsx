"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { formatGBP } from "@lib/util/format-price"

interface WeeklyShopCardProps {
  lastOrderDate?: string
  lastOrderItemCount?: number
}

export default function WeeklyShopCard({
  lastOrderDate,
  lastOrderItemCount,
}: WeeklyShopCardProps) {
  const dateStr = lastOrderDate
    ? new Date(lastOrderDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
      })
    : "your last order"

  return (
    <div className="bg-gradient-to-br from-brand-orange to-orange-600 rounded-2xl overflow-hidden text-white shadow-lg shadow-brand-orange/20">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold">
              Quick Shop
            </span>
            <h2 className="text-lg sm:text-xl font-bold mt-1">
              Your Weekly Shop
            </h2>
            <p className="text-sm text-white/80 mt-1">
              Based on {dateStr}{" "}
              {lastOrderItemCount
                ? `(${lastOrderItemCount} items)`
                : ""}
            </p>
          </div>
          <span className="text-3xl">🛒</span>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <LocalizedClientLink
            href="/account/reorder"
            className="flex-1"
          >
            <button className="w-full py-2.5 bg-white text-brand-orange font-bold rounded-lg hover:bg-orange-50 active:scale-[0.98] transition-all text-sm">
              Reorder Last Shop
            </button>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/store"
            className="flex-1"
          >
            <button className="w-full py-2.5 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 active:scale-[0.98] transition-all text-sm border border-white/30">
              Browse All Products
            </button>
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
