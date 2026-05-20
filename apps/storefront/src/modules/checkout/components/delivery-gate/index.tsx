"use client"

import { useState } from "react"
import { checkPostcode } from "@modules/layout/components/postcode-overlay"

export default function DeliveryGate({
  children,
}: {
  children: React.ReactNode
}) {
  const [postcode, setPostcode] = useState("")
  const [validated, setValidated] = useState(false)
  const [error, setError] = useState(false)

  const handleCheck = () => {
    if (checkPostcode(postcode)) {
      setValidated(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  const handleSkip = () => {
    setValidated(true)
  }

  if (validated) {
    return <>{children}</>
  }

  return (
    <div className="bg-white rounded-xl border border-grey-20 p-8 text-center">
      <svg className="w-16 h-16 text-brand-orange mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <h2 className="text-xl font-bold text-grey-90 mb-2">Check Delivery Availability</h2>
      <p className="text-sm text-grey-50 mb-6">Enter your postcode to confirm we deliver to your area</p>

      <div className="flex gap-2 max-w-sm mx-auto mb-4">
        <input
          type="text"
          value={postcode}
          onChange={(e) => { setPostcode(e.target.value); setError(false) }}
          onKeyDown={(e) => { if (e.key === "Enter") handleCheck() }}
          placeholder="e.g. E1 6AN"
          className="flex-1 border border-grey-20 rounded-lg py-2.5 px-4 text-sm uppercase focus:outline-none focus:border-brand-orange"
        />
        <button
          onClick={handleCheck}
          disabled={!postcode.trim()}
          className="px-6 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-orange-dark disabled:opacity-50 transition-colors"
        >
          Check
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">Sorry, we don't deliver to this postcode yet.</p>
      )}

      <button onClick={handleSkip} className="text-xs text-grey-40 hover:text-brand-orange underline">
        Continue without checking
      </button>
    </div>
  )
}
