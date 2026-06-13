"use client"

import { useState } from "react"
// PostcodeOverlay has been deleted — this component is deprecated

export default function PostcodeCheckButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); setOpen(true) }}
        className="min-tap flex items-center gap-1.5 text-xs text-grey-50 hover:text-brand-orange transition-colors rounded-xl px-2.5 py-1.5 hover:bg-brand-orange/5 press-scale"
        title="Check delivery availability"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="hidden lg:inline font-medium">Postcode</span>
      </button>
      {/* PostcodeOverlay removed — component is deprecated */}
    </>
  )
}
