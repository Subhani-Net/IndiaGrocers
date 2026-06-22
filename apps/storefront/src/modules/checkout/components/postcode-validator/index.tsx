"use client"

import { useState, useEffect, useCallback } from "react"
import { checkPostcode, PostcodeCheckResult } from "@lib/util/postcode-validation"

interface PostcodeValidatorProps {
  value: string
  onChange: (value: string, valid: boolean) => void
  disabled?: boolean
}

export default function PostcodeValidator({
  value,
  onChange,
  disabled,
}: PostcodeValidatorProps) {
  const [result, setResult] = useState<PostcodeCheckResult | null>(null)
  const [typing, setTyping] = useState(false)

  const handleCheck = useCallback(() => {
    if (!value || value.length < 4) {
      setResult(null)
      onChange(value, false)
      return
    }
    const check = checkPostcode(value)
    setResult(check)
    onChange(value, check.status === "valid")
  }, [value, onChange])

  // Debounced validation on typing
  useEffect(() => {
    if (value.length >= 4) {
      setTyping(true)
      const timer = setTimeout(() => {
        setTyping(false)
        handleCheck()
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setResult(null)
      onChange(value, false)
    }
  }, [value, handleCheck, onChange])

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const v = e.target.value.toUpperCase()
              // Only allow valid postcode characters
              if (/^[A-Z0-9\s]*$/.test(v)) {
                onChange(v, false)
              }
            }}
            onBlur={handleCheck}
            placeholder="e.g. SW9 8AL"
            disabled={disabled}
            maxLength={8}
            className="w-full px-3.5 py-2.5 text-sm border rounded-lg outline-none transition-colors peer"
            style={{
              borderColor: result?.status === "valid"
                ? "#16a34a"
                : result?.status === "not_in_zone" || result?.status === "invalid_format"
                ? (value.length >= 5 ? "#dc2626" : undefined)
                : undefined
            }}
          />
          {typing && value.length >= 4 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="animate-spin w-4 h-4 text-stone-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </span>
          )}
        </div>
      </div>

      {/* Status messages */}
      {result && !typing && (
        <div className="mt-1.5">
          {result.status === "valid" && (
            <p className="text-[11px] text-green-600 font-medium flex items-center gap-1">
              <span>✓</span> Delivering to {result.outward}
            </p>
          )}
          {result.status === "not_in_zone" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-1.5">
              <p className="text-xs text-amber-800 font-medium">
                We're not in {result.outward} yet
              </p>
              <p className="text-[10px] text-amber-600 mt-1">
                Leave your details and we'll let you know when we arrive.
              </p>
              <button
                type="button"
                className="mt-2 text-[11px] font-semibold text-amber-800 underline hover:text-amber-900"
                onClick={() => {
                  alert(`Got it. We'll let you know when we reach ${result.outward}.`)
                }}
              >
                Notify me →
              </button>
            </div>
          )}
          {result.status === "invalid_format" && value.length >= 5 && (
            <p className="text-[11px] text-red-500">
              That doesn't look like a valid UK postcode
            </p>
          )}
        </div>
      )}
    </div>
  )
}
