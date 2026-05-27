/**
 * Categories that are Phase 2 or 3 and should show Coming Soon
 * regardless of whether products exist. Matches the categories master list.
 *
 * This file is SERVER-COMPATIBLE — no "use client" directive.
 */

export const PHASE_2_CATEGORIES = new Set([
  "frozen",
  "fresh",
  "ready-to-cook",
  "condiments",
])

export const PHASE_3_CATEGORIES = new Set([
  "pooja",
  "household",
  "regional",
])

export function getCategoryPhase(handle: string): 2 | 3 | null {
  if (PHASE_2_CATEGORIES.has(handle)) return 2
  if (PHASE_3_CATEGORIES.has(handle)) return 3
  return null
}
