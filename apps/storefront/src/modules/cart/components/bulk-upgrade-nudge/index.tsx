"use client"

import { useState } from "react"
import { formatGBP } from "@lib/util/format-price"

interface BulkUpgradeNudgeProps {
  productTitle: string
  currentWeight: string
  currentQty: number
  currentPricePerUnit: number
  upgradeWeight: string
  upgradeVariantId: string
  upgradePrice: number
  upgradePricePerUnit: number
  savingsPercent: number
  onSwitch: (variantId: string) => void
  onDismiss: () => void
}

export default function BulkUpgradeNudge({
  productTitle,
  currentWeight,
  currentQty,
  currentPricePerUnit,
  upgradeWeight,
  upgradeVariantId,
  upgradePrice,
  upgradePricePerUnit,
  savingsPercent,
  onSwitch,
  onDismiss,
}: BulkUpgradeNudgeProps) {
  const [dismissed, setDismissed] = useState(false)
  const [switching, setSwitching] = useState(false)

  if (dismissed) return null

  const handleSwitch = async () => {
    setSwitching(true)
    await onSwitch(upgradeVariantId)
    setSwitching(false)
    setDismissed(true)
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3 mt-3">
      <span className="text-lg flex-shrink-0">💡</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-stone-700 font-medium leading-snug">
          You have {currentQty} × {currentWeight}.{" "}
          <span className="text-green-700 font-bold">
            Switch to {upgradeWeight} and save{" "}
            {savingsPercent}%
          </span>{" "}
          — just {formatGBP(upgradePrice)}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleSwitch}
            disabled={switching}
            className="text-[11px] font-semibold bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {switching ? "Switching..." : `Switch to ${upgradeWeight}`}
          </button>
          <button
            onClick={() => {
              setDismissed(true)
              onDismiss()
            }}
            className="text-[11px] text-stone-400 hover:text-stone-600"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Detects if a bulk upgrade nudge should be shown.
 * Triggers when: qty >= 2 AND a larger size exists with >= 10% per-unit savings.
 */
export function detectBulkUpgrade(
  lineItems: Array<{
    title: string
    quantity: number
    variant: {
      id: string
      title: string
      metadata?: { weight_grams?: number; price_per_unit?: number }
      calculated_price?: { calculated_amount?: number }
    }
    product?: {
      variants?: Array<{
        id: string
        title: string
        metadata?: { weight_grams?: number; price_per_unit?: number }
        calculated_price?: { calculated_amount?: number }
      }>
    }
  }>
) {
  const nudges: Array<{
    lineItemIndex: number
    productTitle: string
    currentWeight: string
    currentQty: number
    currentPricePerUnit: number
    upgradeWeight: string
    upgradeVariantId: string
    upgradePrice: number
    upgradePricePerUnit: number
    savingsPercent: number
  }> = []

  for (let i = 0; i < lineItems.length; i++) {
    const item = lineItems[i]
    if (!item || item.quantity < 2) continue

    const variants = item.product?.variants || []
    if (variants.length < 2) continue

    const currentWeightGrams = (item.variant.metadata?.weight_grams || 0) as number
    const currentPPU = (item.variant.metadata?.price_per_unit || 0) as number
    if (currentWeightGrams <= 0 || currentPPU <= 0) continue

    // Find larger variants with better per-unit price
    const upgrades = variants
      .filter((v) => {
        const vWeight = (v.metadata?.weight_grams || 0) as number
        const vPPU = (v.metadata?.price_per_unit || Infinity) as number
        return vWeight > currentWeightGrams && vPPU < currentPPU
      })
      .sort((a, b) => {
        const aPPU = (a.metadata?.price_per_unit || Infinity) as number
        const bPPU = (b.metadata?.price_per_unit || Infinity) as number
        return aPPU - bPPU
      })

    if (upgrades.length > 0) {
      const best = upgrades[0]
      const ppu = (best.metadata?.price_per_unit || 0) as number
      const savingsPct = Math.round(((currentPPU - ppu) / currentPPU) * 100)

      if (savingsPct >= 10) {
        nudges.push({
          lineItemIndex: i,
          productTitle: item.title || "",
          currentWeight: item.variant.title || "",
          currentQty: item.quantity,
          currentPricePerUnit: currentPPU,
          upgradeWeight: best.title || "",
          upgradeVariantId: best.id,
          upgradePrice: best.calculated_price?.calculated_amount || 0,
          upgradePricePerUnit: ppu,
          savingsPercent: savingsPct,
        })
      }
    }
  }

  // Max 2 nudges
  return nudges.slice(0, 2)
}
