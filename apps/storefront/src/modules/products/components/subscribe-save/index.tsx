"use client"

import { useState } from "react"
import { formatGBP } from "@lib/util/format-price"

const SUBSCRIPTION_INTERVALS = [
  { value: "2-weeks", label: "Every 2 weeks", discount: 5 },
  { value: "monthly", label: "Monthly", discount: 8 },
  { value: "6-weeks", label: "Every 6 weeks", discount: 8 },
]

interface SubscribeSaveProps {
  price: number
  subscriptionEligible: boolean
  onSubscribe: (interval: string) => void
}

export default function SubscribeSave({
  price,
  subscriptionEligible,
  onSubscribe,
}: SubscribeSaveProps) {
  const [selectedInterval, setSelectedInterval] = useState("monthly")
  const [subscribing, setSubscribing] = useState(false)

  if (!subscriptionEligible) return null

  const discount =
    SUBSCRIPTION_INTERVALS.find((i) => i.value === selectedInterval)
      ?.discount ?? 8
  const discountedPrice = Math.round(price * (1 - discount / 100))
  const annualSaving = Math.round((price - discountedPrice) * 12)

  const handleSubscribe = async () => {
    setSubscribing(true)
    await onSubscribe(selectedInterval)
    setSubscribing(false)
  }

  return (
    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-purple-200 bg-purple-100/50">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔄</span>
          <div>
            <h3 className="text-sm font-bold text-purple-900">
              Subscribe &amp; Save {discount}%
            </h3>
            <p className="text-xs text-purple-600">
              Never run out — auto-delivered to your door
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Interval selector */}
        <div>
          <label className="text-xs font-semibold text-purple-700 uppercase tracking-wider block mb-2">
            Deliver every
          </label>
          <div className="flex flex-wrap gap-2">
            {SUBSCRIPTION_INTERVALS.map((interval) => (
              <button
                key={interval.value}
                onClick={() => setSelectedInterval(interval.value)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                  selectedInterval === interval.value
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white border-purple-200 text-purple-700 hover:border-purple-400"
                }`}
              >
                {interval.label} ({interval.discount}% off)
              </button>
            ))}
          </div>
        </div>

        {/* Price comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg border border-purple-200 p-3">
            <p className="text-[10px] text-purple-500 uppercase font-medium">
              One-time
            </p>
            <p className="text-sm font-bold text-stone-600">
              {formatGBP(price)}
            </p>
          </div>
          <div className="bg-purple-600 rounded-lg p-3 text-white">
            <p className="text-[10px] text-purple-200 uppercase font-medium">
              Subscribe ({discount}% off)
            </p>
            <p className="text-sm font-bold">{formatGBP(discountedPrice)}</p>
          </div>
        </div>

        {/* Annual saving */}
        <p className="text-xs text-purple-700 font-medium">
          Estimated annual saving:{" "}
          <span className="font-bold">{formatGBP(annualSaving)}</span>
        </p>

        {/* Subscribe CTA */}
        <button
          onClick={handleSubscribe}
          disabled={subscribing}
          className="w-full py-2.5 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 active:scale-[0.98] disabled:opacity-50 transition-all"
        >
          {subscribing ? "Subscribing..." : `Subscribe — ${formatGBP(discountedPrice)}/${selectedInterval === "monthly" ? "mo" : selectedInterval.replace("-", " ")}`}
        </button>
      </div>
    </div>
  )
}
