"use client"

import { useState, useMemo, useCallback } from "react"
import { formatGBP } from "@lib/util/format-price"

interface DeliverySlot {
  date: Date
  dateLabel: string
  timeWindows: TimeWindow[]
}

interface TimeWindow {
  id: string
  label: string
  start: string
  end: string
  available: boolean
  premium: boolean
  price: number
}

// Generate next N weekend days (Sat & Sun only)
function generateSlots(days: number = 5, hasFastRequired: boolean = false): DeliverySlot[] {
  const slots: DeliverySlot[] = []
  const now = new Date()
  
  // Find next Saturday from today
  let current = new Date(now)
  // Skip to Saturday if today is not already Fri/Sat/Sun for next-weekend preview
  const dayOfWeek = current.getDay()
  if (dayOfWeek > 0 && dayOfWeek < 5) {
    // Weekday - jump to Saturday
    current.setDate(current.getDate() + (6 - dayOfWeek))
  } else if (dayOfWeek === 5) {
    // Friday - tomorrow is Saturday
    current.setDate(current.getDate() + 1)
  }
  // If Sunday, start from today

  // Generate 4 weekend days (2 Saturdays + 2 Sundays across 2 weekends)
  let daysGenerated = 0
  let attempts = 0
  while (daysGenerated < 4 && attempts < 14) {
    const d = new Date(current)
    d.setDate(d.getDate() + attempts)
    const dow = d.getDay()
    
    // Only Sat (6) and Sun (0)
    if (dow !== 6 && dow !== 0) {
      attempts++
      continue
    }

    const dayName = d.toLocaleDateString("en-GB", { weekday: "short" })
    const monthDay = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    const dateLabel = `${dayName} ${monthDay}`

    // 4-hour time windows
    const allWindows: TimeWindow[] = [
      { id: `${daysGenerated}-morning`, label: "Morning (8am-12pm)", start: "08:00", end: "12:00", available: true, premium: false, price: 0 },
      { id: `${daysGenerated}-afternoon`, label: "Afternoon (12pm-4pm)", start: "12:00", end: "16:00", available: true, premium: false, price: 0 },
      { id: `${daysGenerated}-evening`, label: "Evening (4pm-8pm)", start: "16:00", end: "20:00", available: true, premium: false, price: 0 },
    ]

    slots.push({ date: d, dateLabel, timeWindows: allWindows })
    daysGenerated++
    attempts++
  }

  return slots
}

interface DeliverySlotSelectorProps {
  onSelect: (date: Date, timeWindow: TimeWindow) => void
  selectedDate?: Date | null
  selectedWindow?: TimeWindow | null
  hasFastRequired?: boolean
}

export default function DeliverySlotSelector({
  onSelect,
  selectedDate,
  selectedWindow,
  hasFastRequired = false,
}: DeliverySlotSelectorProps) {
  const slots = useMemo(() => generateSlots(5, hasFastRequired), [hasFastRequired])
  const [expandedDay, setExpandedDay] = useState<number>(0)

  const handleSelect = useCallback(
    (slot: DeliverySlot, window: TimeWindow) => {
      if (!window.available) return
      onSelect(slot.date, window)
    },
    [onSelect]
  )

  return (
    <div className="space-y-3" data-testid="delivery-slot-selector">
      <div>
        <h3 className="text-sm font-bold text-stone-800 mb-1">Choose Delivery Slot</h3>
        <p className="text-xs text-stone-400" data-testid="delivery-slot-subtitle">
          Weekend delivery — Saturday &amp; Sunday, 4-hour slots
        </p>
      </div>

      {hasFastRequired && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 font-medium">
          ⚡ Your order includes fresh/dairy items — next-day delivery required
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {slots.map((slot, i) => {
          const isExpanded = expandedDay === i
          const isSelected =
            selectedDate?.toDateString() === slot.date.toDateString()
          const availableWindows = slot.timeWindows.filter((w) => w.available)

          return (
            <button
              key={i}
              onClick={() => setExpandedDay(isExpanded ? -1 : i)}
              data-testid={`slot-day-${slot.date.toISOString().slice(0, 10)}`}
              className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all ${
                isExpanded
                  ? "border-brand-orange bg-brand-orange/5"
                  : isSelected
                  ? "border-brand-orange bg-white"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              <span className="text-[10px] text-stone-400 uppercase font-medium">
                {slot.date.toLocaleDateString("en-GB", { weekday: "short" })}
              </span>
              <span className="text-lg font-bold text-stone-800">
                {slot.date.getDate()}
              </span>
              <span className="text-[10px] text-stone-400">
                {slot.date.toLocaleDateString("en-GB", { month: "short" })}
              </span>
              <span className="text-[9px] text-stone-400 mt-1">
                {availableWindows.length} slot{availableWindows.length !== 1 ? "s" : ""}
              </span>
            </button>
          )
        })}
      </div>

      {/* Time windows for expanded day */}
      {expandedDay >= 0 && expandedDay < slots.length && (
        <div className="bg-white border border-stone-200 rounded-xl p-3">
          <h4 className="text-xs font-semibold text-stone-500 mb-2">
            {slots[expandedDay].dateLabel}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slots[expandedDay].timeWindows.map((window) => {
              const isWindowSelected =
                selectedWindow?.id === window.id
              const isDisabled = !window.available

              return (
                <button
                  key={window.id}
                  disabled={isDisabled}
                  onClick={() => handleSelect(slots[expandedDay], window)}
                  data-testid={`slot-${window.id}`}
                  className={`text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                    isWindowSelected
                      ? "bg-brand-orange text-white border-brand-orange"
                      : isDisabled
                      ? "bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed"
                      : "bg-white border-stone-200 text-stone-600 hover:border-brand-orange/50 hover:bg-brand-orange/5"
                  }`}
                >
                  <span className="block font-semibold">
                    {window.label}
                  </span>
                  <span className={`block text-[10px] mt-0.5 ${
                    isWindowSelected ? "text-white/70" : "text-stone-400"
                  }`}>
                    {window.start} – {window.end}
                  </span>
                  {window.premium && (
                    <span className={`block text-[10px] mt-0.5 font-bold ${
                      isWindowSelected ? "text-white/80" : "text-brand-orange"
                    }`}>
                      {formatGBP(window.price)}
                    </span>
                  )}
                  {isDisabled && (
                    <span className="block text-[9px] text-stone-300 mt-0.5">
                      Unavailable
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected slot summary */}
      {selectedDate && selectedWindow && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3" data-testid="slot-selected-summary">
          <span className="text-xs text-green-700 font-medium flex items-center gap-1">
            <span>✓</span>
            Delivery:{" "}
            {selectedDate.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}{" "}
            {selectedWindow.start} – {selectedWindow.end}
            {selectedWindow.premium && (
              <span className="text-brand-orange font-bold">
                ({formatGBP(selectedWindow.price)})
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  )
}
