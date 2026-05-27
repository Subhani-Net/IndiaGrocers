"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const REGIONS = [
  {
    key: "punjabi",
    label: "Punjabi / North Indian",
    emoji: "🫓",
    desc: "Atta, Basmati, Ghee, Paneer",
  },
  {
    key: "south-indian",
    label: "South Indian",
    emoji: "🥥",
    desc: "Sona Masoori, Filter Coffee, Sambar",
  },
  {
    key: "gujarati",
    label: "Gujarati",
    emoji: "🧆",
    desc: "Farsan, Dhokla, Khakhra, Thepla",
  },
  {
    key: "bengali",
    label: "Bengali",
    emoji: "🐟",
    desc: "Mustard Oil, Panch Phoron, Rosogolla",
  },
  {
    key: "east-african-asian",
    label: "East African Asian",
    emoji: "🌍",
    desc: "East African tea blends, specialist pickles",
  },
]

export default function NewCustomerOnboarding() {
  const [selected, setSelected] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              Welcome to IndiaGrocers! 👋
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              Tell us your preference and we&apos;ll show you the products
              most relevant to your cooking style.
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-stone-300 hover:text-stone-500 text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {REGIONS.map((region) => {
            const isSelected = selected === region.key
            return (
              <button
                key={region.key}
                onClick={() =>
                  setSelected(isSelected ? null : region.key)
                }
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-brand-orange bg-brand-orange/5"
                    : "border-stone-200 hover:border-stone-300 bg-white"
                }`}
              >
                <span className="text-2xl mb-1">{region.emoji}</span>
                <span
                  className={`text-xs font-semibold ${
                    isSelected ? "text-brand-orange" : "text-stone-700"
                  }`}
                >
                  {region.label}
                </span>
                <span className="text-[10px] text-stone-400 mt-0.5 text-center">
                  {region.desc}
                </span>
              </button>
            )
          })}
        </div>

        {selected && (
          <div className="mt-4 flex gap-2">
            <LocalizedClientLink
              href={`/store`}
              className="flex-1"
            >
              <button className="w-full py-2.5 bg-brand-orange text-white font-bold rounded-lg hover:bg-brand-orange/90 active:scale-[0.98] transition-all text-sm">
                Start Shopping {REGIONS.find((r) => r.key === selected)?.emoji}
              </button>
            </LocalizedClientLink>
            <button
              onClick={() => {
                setSelected(null)
                setDismissed(true)
              }}
              className="text-sm text-stone-400 hover:text-stone-600 px-3"
            >
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
