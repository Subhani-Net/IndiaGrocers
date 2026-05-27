"use client"

import { formatGBP } from "@lib/util/format-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const FREE_DELIVERY_TARGET = 4500 // £45.00 in pence
const MIN_ORDER = 3000 // £30.00 in pence
const STANDARD_DELIVERY = 399 // £3.99

interface BasketProgressBarProps {
  itemTotal: number
  itemCount: number
}

export default function BasketProgressBar({
  itemTotal,
  itemCount,
}: BasketProgressBarProps) {
  const progress = Math.min((itemTotal / FREE_DELIVERY_TARGET) * 100, 100)
  const remaining = Math.max(FREE_DELIVERY_TARGET - itemTotal, 0)
  const reachedFreeDelivery = itemTotal >= FREE_DELIVERY_TARGET
  const belowMinOrder = itemTotal > 0 && itemTotal < MIN_ORDER

  if (itemCount === 0) return null

  return (
    <div
      className={`rounded-xl overflow-hidden border ${
        reachedFreeDelivery
          ? "border-green-300 bg-green-50"
          : belowMinOrder
          ? "border-red-200 bg-red-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="px-4 py-3">
        {/* Icon + message */}
        <div className="flex items-center gap-2 mb-2">
          {reachedFreeDelivery ? (
            <>
              <span className="text-lg">🎉</span>
              <span className="text-sm font-bold text-green-700">
                Free delivery unlocked!
              </span>
            </>
          ) : belowMinOrder ? (
            <>
              <span className="text-lg">⚠️</span>
              <span className="text-sm font-bold text-red-700">
                Minimum order {formatGBP(MIN_ORDER)}
              </span>
            </>
          ) : (
            <>
              <span className="text-lg">🚚</span>
              <span className="text-sm font-semibold text-amber-800">
                Add {formatGBP(remaining)} for FREE delivery
              </span>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div
          className={`w-full h-3 rounded-full overflow-hidden ${
            reachedFreeDelivery ? "bg-green-200" : "bg-white/60"
          }`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              reachedFreeDelivery
                ? "bg-green-500"
                : belowMinOrder
                ? "bg-red-400"
                : "bg-brand-orange"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Labels */}
        <div className="flex justify-between mt-1.5">
          <span
            className={`text-xs font-bold ${
              reachedFreeDelivery
                ? "text-green-700"
                : belowMinOrder
                ? "text-red-600"
                : "text-stone-600"
            }`}
          >
            {formatGBP(itemTotal)}
          </span>
          <span className="text-xs text-stone-400 font-medium">
            Free at {formatGBP(FREE_DELIVERY_TARGET)}
          </span>
        </div>
      </div>

      {/* Min order gate */}
      {belowMinOrder && (
        <div className="bg-red-100/50 px-4 py-2 border-t border-red-200">
          <p className="text-xs text-red-700 font-medium">
            Add {formatGBP(MIN_ORDER - itemTotal)} more to reach the {formatGBP(MIN_ORDER)} minimum order
          </p>
        </div>
      )}

      {/* Delivery cost note when in the middle */}
      {!reachedFreeDelivery && !belowMinOrder && (
        <div className="bg-white/50 px-4 py-2 border-t border-amber-200/50">
          <p className="text-xs text-stone-500">
            Delivery: {formatGBP(STANDARD_DELIVERY)} — FREE over{" "}
            {formatGBP(FREE_DELIVERY_TARGET)}
          </p>
        </div>
      )}
    </div>
  )
}

export { FREE_DELIVERY_TARGET, MIN_ORDER, STANDARD_DELIVERY }
