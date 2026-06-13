/**
 * Store Configuration — Single Source of Truth
 *
 * All configurable business values live here. To change:
 *   1. Edit the value in this file
 *   2. Restart the storefront
 *
 * Monetary values are in PENCE (Medusa v2 standard).
 * Display strings are derived from these values for consistency.
 */

// ── Monetary Values (pence) ──

/** Free delivery threshold — orders at or above this get free shipping */
export const FREE_DELIVERY_THRESHOLD = 4000 // £40.00

/** Minimum order amount — orders below this cannot be placed */
export const MIN_ORDER_AMOUNT = 3000 // £30.00

/** Standard delivery cost */
export const STANDARD_DELIVERY_COST = 399 // £3.99

/** Express delivery cost */
export const EXPRESS_DELIVERY_COST = 699 // £6.99

// ── Display Labels ──

export const FREE_DELIVERY_THRESHOLD_GBP = "£40"
export const STANDARD_DELIVERY_GBP = "£3.99"
export const EXPRESS_DELIVERY_GBP = "£6.99"

// ── Delivery Slots ──

export const DELIVERY_SLOTS = {
  /** Number of weekend days to display (2 Saturdays + 2 Sundays) */
  daysToShow: 4,
  /** Safety limit for date generation loop */
  maxAttempts: 14,
  /** If true, only Sat (6) and Sun (0) are available */
  weekendOnly: true,
  /** Time windows per day */
  windows: [
    { label: "Morning (8am-12pm)",   start: "08:00", end: "12:00" },
    { label: "Afternoon (12pm-4pm)", start: "12:00", end: "16:00" },
    { label: "Evening (4pm-8pm)",    start: "16:00", end: "20:00" },
  ],
} as const

// ── Cut-off & ETA ──

export const CUTOFF_TIME = "2:00 PM"
export const CUTOFF_TIME_24H = "14:00"
export const DELIVERY_ETA_RANGE = "8am–8pm"
export const STANDARD_ETA = "3–5 working days"
export const EXPRESS_ETA = "Next working day"

// ── Banner Text ──

export const FREE_DELIVERY_BANNER =
  `FREE DELIVERY on orders over ${FREE_DELIVERY_THRESHOLD_GBP} · Order by 2pm for next day delivery`
