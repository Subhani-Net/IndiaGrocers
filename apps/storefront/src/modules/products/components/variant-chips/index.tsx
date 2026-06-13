"use client"

import { useCallback } from "react"
import { formatGBP, formatUnitPrice, getWeightLabel } from "@lib/util/format-price"
import type { GroceryVariant } from "../../../../types/product"

type VariantChip = {
  variant: GroceryVariant
  weightLabel: string
  price: number
  pricePerUnit: number
  pricePerUnitLabel: string
  isBestValue: boolean
  inStock: boolean
  inventoryQty: number
}

function buildChips(
  variants: any[],
  inventoryMap?: Record<string, { availability: number | null }>
): VariantChip[] {
  return variants
    .map((v): VariantChip | null => {
      const meta = v.metadata || {}
      if (!meta.weight_value) return null
      const price = v.calculated_price?.calculated_amount ?? 0
      const availability = inventoryMap?.[v.id]?.availability
      const inStock = !v.manage_inventory
        || v.allow_backorder
        || availability == null
        || availability > 0
      return {
        variant: {
          id: v.id,
          title: v.title,
          sku: v.sku,
          metadata: meta,
        } as GroceryVariant,
        weightLabel: getWeightLabel({
          id: v.id,
          title: v.title,
          metadata: meta,
        } as any),
        price,
        pricePerUnit: meta.price_per_unit || 0,
        pricePerUnitLabel: meta.price_per_unit_label || "",
        isBestValue: meta.is_best_value || false,
        inStock,
        inventoryQty: availability ?? 0,
      }
    })
    .filter(Boolean) as VariantChip[]
}

interface VariantChipsProps {
  product: any
  selectedVariantId?: string
  onSelect: (variantId: string) => void
  inventoryMap?: Record<string, { availability: number | null }>
}

export default function VariantChips({
  product,
  selectedVariantId,
  onSelect,
  inventoryMap,
}: VariantChipsProps) {
  const chips = buildChips(product.variants || [], inventoryMap)

  if (chips.length <= 1) return null

  const selectedChip = chips.find((c) => c.variant.id === selectedVariantId) || chips[0]

  return (
    <div className="flex flex-col gap-3" role="radiogroup" aria-label="Weight variants">
      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
        Weight / Size
      </span>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const isSelected = chip.variant.id === selectedChip.variant.id
          return (
            <button
              key={chip.variant.id}
              role="radio"
              aria-checked={isSelected}
              disabled={!chip.inStock}
              onClick={() => chip.inStock && onSelect(chip.variant.id)}
              className={`
                relative flex flex-col items-start px-3.5 py-2.5 rounded-xl border-2 transition-all
                min-w-[80px] cursor-pointer
                ${isSelected
                  ? "bg-brand-orange text-white border-brand-orange"
                  : chip.isBestValue && !isSelected
                  ? "bg-amber-50 border-amber-300 hover:border-amber-400"
                  : "bg-white border-stone-200 hover:border-brand-orange/50"
                }
                ${!chip.inStock ? "opacity-40 cursor-not-allowed" : ""}
              `}
            >
              {/* Best value badge */}
              {chip.isBestValue && (
                <span className={`
                  absolute -top-2 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full
                  ${isSelected ? "bg-white text-brand-orange" : "bg-amber-400 text-amber-900"}
                `}>
                  ★ Best Value
                </span>
              )}

              {/* Weight label */}
              <span className={`text-sm font-bold ${isSelected ? "text-white" : "text-stone-800"}`}>
                {chip.weightLabel}
              </span>

              {/* Price */}
              <span className={`text-sm font-semibold mt-0.5 ${isSelected ? "text-white/90" : "text-stone-600"}`}>
                {formatGBP(chip.price)}
              </span>

              {/* Price per unit */}
              {chip.pricePerUnit > 0 && (
                <span className={`text-[10px] mt-0.5 ${isSelected ? "text-white/70" : "text-stone-400"}`}>
                  {formatUnitPrice(chip.variant)}
                </span>
              )}

              {/* Out of stock */}
              {!chip.inStock && (
                <span className="text-[10px] text-stone-400 mt-0.5">
                  Out of stock
                </span>
              )}

              {/* Low stock */}
              {chip.inStock && chip.inventoryQty > 0 && chip.inventoryQty <= 5 && (
                <span className={`text-[10px] mt-0.5 ${isSelected ? "text-white/70" : "text-amber-600"}`}>
                  Only {chip.inventoryQty} left
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { buildChips }
export type { VariantChip }
