"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface ComingSoonPageProps {
  categoryName: string
  categoryDescription?: string
  phase: 2 | 3
  expectedDate?: string
}

export default function ComingSoonPage({
  categoryName,
  categoryDescription,
  phase,
  expectedDate,
}: ComingSoonPageProps) {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    // In production: POST to waitlist API
    setSubmitted(true)
  }

  const dateEstimate =
    expectedDate || (phase === 2 ? "soon" : "in the coming months")

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-stone-50">
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-brand-orange/10 flex items-center justify-center mb-6">
          <span className="text-4xl">🔜</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-stone-900 mb-2">
          {categoryName} — Coming Soon
        </h1>

        {/* Phase badge */}
        <span
          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-4 ${
            phase === 2
              ? "bg-amber-100 text-amber-700"
              : "bg-purple-100 text-purple-700"
          }`}
        >
          Phase {phase}
        </span>

        {categoryDescription && (
          <p className="text-sm text-stone-500 mb-6">
            {categoryDescription}
          </p>
        )}

        <p className="text-sm text-stone-400 mb-8">
          We&apos;re stocking this category {dateEstimate}. Join the waitlist
          and we&apos;ll let you know as soon as it&apos;s live.
        </p>

        {/* Email capture */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-4 py-2.5 text-sm border border-stone-200 rounded-lg outline-none focus:border-brand-orange"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-orange/90 active:scale-[0.98] transition-all whitespace-nowrap"
            >
              Notify Me
            </button>
          </form>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-green-700">
              ✓ You&apos;re on the list!
            </p>
            <p className="text-xs text-green-600 mt-1">
              We&apos;ll email you when {categoryName} goes live.
            </p>
          </div>
        )}

        {/* Browse other categories */}
        <div className="mt-10 pt-6 border-t border-stone-200">
          <p className="text-xs text-stone-400 mb-3">Browse available categories:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { name: "Staples & Grains", handle: "staples-grains" },
              { name: "Atta & Flours", handle: "atta-flours" },
              { name: "Dal & Lentils", handle: "dal-lentils" },
              { name: "Oils & Ghee", handle: "oils-ghee" },
              { name: "Spices — Ground", handle: "spices-ground" },
              { name: "Spice Blends", handle: "spice-blends" },
              { name: "Beverages", handle: "beverages" },
              { name: "Snacks & Namkeen", handle: "snacks-namkeen" },
              { name: "Pickles & Chutneys", handle: "pickles-chutneys" },
            ].map((cat) => (
              <LocalizedClientLink
                key={cat.handle}
                href={`/categories/${cat.handle}`}
                className="text-xs font-medium text-stone-600 bg-white border border-stone-200 rounded-full px-3 py-1.5 hover:border-brand-orange/50 hover:text-brand-orange transition-colors"
              >
                {cat.name} →
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * @deprecated Use @lib/util/category-phase instead (server-compatible).
 * Kept here for client-side reference only.
 */
