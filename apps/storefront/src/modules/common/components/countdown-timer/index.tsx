"use client"

import { useState, useEffect } from "react"

function getSecondsUntil(targetHour: number, targetMinute: number): number {
  const now = new Date()
  const target = new Date(now)
  target.setHours(targetHour, targetMinute, 0, 0)
  if (now > target) {
    target.setDate(target.getDate() + 1)
  }
  return Math.floor((target.getTime() - now.getTime()) / 1000)
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export default function CountdownTimer() {
  const [seconds, setSeconds] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setSeconds(getSecondsUntil(14, 0))

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          return getSecondsUntil(14, 0)
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  const isBeforeCutoff = seconds > 0 && seconds < 86400
  const isAfterCutoff = !isBeforeCutoff

  return (
    <div className="bg-brand-orange/10 border-b border-brand-orange/20">
      <div className="content-container py-2">
        <div className="flex items-center justify-center gap-2 text-sm text-brand-orange font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {isBeforeCutoff ? (
            <span>
              Order within <span className="font-bold">{formatTime(seconds)}</span> for next day delivery
            </span>
          ) : (
            <span>
              Order by 2PM for next day delivery
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
