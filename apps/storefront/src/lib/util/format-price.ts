/**
 * Price and weight formatting utilities for the IndiaGrocers storefront.
 * All prices are in GBP (pence as integers), displayed inclusive of VAT.
 *
 * US-01-06
 */

import { GroceryVariant } from "../../types/product"

// ---------------------------------------------------------------------------
// GBP formatting
// ---------------------------------------------------------------------------

/**
 * Formats an integer amount in pence to a GBP display string.
 * formatGBP(149) → "£1.49"
 * formatGBP(100) → "£1.00"
 * formatGBP(50)  → "50p"   (sub-£1 amounts shown as pence)
 */
export function formatGBP(amountInPence: number): string {
  if (amountInPence < 100) {
    return `${amountInPence}p`
  }
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInPence / 100)
}

/**
 * Formats a raw amount from Medusa (stored as integer pence) to GBP.
 * Safe to call with null/undefined — returns "—" in that case.
 */
export function formatProductPrice(
  amount: number | null | undefined,
  currencyCode: string = "gbp"
): string {
  if (amount == null) return "—"
  if (currencyCode.toLowerCase() !== "gbp") {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currencyCode.toUpperCase(),
    }).format(amount / 100)
  }
  return formatGBP(amount)
}

// ---------------------------------------------------------------------------
// Unit price formatting
// ---------------------------------------------------------------------------

/**
 * Formats the unit price for a variant.
 * formatUnitPrice(variant) → "89p per kg" or "£1.20 per 100g"
 */
export function formatUnitPrice(variant: GroceryVariant): string {
  const meta = variant.metadata
  if (!meta?.price_per_unit || !meta?.price_per_unit_label) {
    return ""
  }
  return `${formatGBP(meta.price_per_unit)} ${meta.price_per_unit_label}`
}

// ---------------------------------------------------------------------------
// Weight label formatting
// ---------------------------------------------------------------------------

/**
 * Returns the display weight string for a variant chip button.
 * getWeightLabel(variant) → "500g", "1kg", "5L", "750ml"
 */
export function getWeightLabel(variant: GroceryVariant): string {
  const meta = variant.metadata
  if (!meta?.weight_value || !meta?.weight_unit) {
    // Fall back to variant title (e.g. "1kg")
    return variant.title ?? ""
  }

  const { weight_value, weight_unit } = meta

  // Display whole numbers without decimals, fractions with one decimal place
  const displayValue =
    Number.isInteger(weight_value)
      ? weight_value.toString()
      : weight_value.toFixed(1)

  // Capitalise litre units for display
  const displayUnit = weight_unit === "l" ? "L" : weight_unit

  return `${displayValue}${displayUnit}`
}

/**
 * Returns the full weight string including pack count if > 1.
 * e.g. "500g", "1kg × 5"
 */
export function getFullWeightLabel(
  variant: GroceryVariant,
  packCount?: number
): string {
  const base = getWeightLabel(variant)
  if (packCount && packCount > 1) {
    return `${base} × ${packCount}`
  }
  return base
}
