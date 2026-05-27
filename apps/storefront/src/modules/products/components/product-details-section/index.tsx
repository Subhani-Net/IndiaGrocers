"use client"

import { useState } from "react"
import { getDietaryBadges } from "@lib/util/allergen-display"
import { formatGBP, getWeightLabel } from "@lib/util/format-price"

interface ProductDetailsSectionProps {
  product: any
  selectedVariant: any
}

export default function ProductDetailsSection({
  product,
  selectedVariant,
}: ProductDetailsSectionProps) {
  const meta = product.metadata || {}
  const vMeta = selectedVariant?.metadata || {}
  const vatRate = meta.vat_rate as number | undefined
  const countryOfOrigin = meta.country_of_origin as string | undefined
  const fbo = meta.uk_food_business_operator as string | undefined
  const bestBefore = meta.best_before_guidance as string | undefined
  const sourcingTier = meta.sourcing_tier as string | undefined
  const dietaryFlags = (meta.dietary_flags as string[]) || []
  const weightLabel = vMeta.weight_value
    ? getWeightLabel({
        id: selectedVariant?.id || "",
        title: selectedVariant?.title || "",
        metadata: vMeta,
      } as any)
    : ""

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-100">
        <h2 className="text-sm font-bold text-stone-800">Product Details</h2>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Detail rows */}
        <DetailRow label="Weight" value={weightLabel || "—"} />
        <DetailRow
          label="Brand"
          value={
            meta.brand_slug
              ? (meta.brand_slug as string)
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (c: string) => c.toUpperCase())
              : "—"
          }
        />
        <DetailRow label="Country of Origin" value={countryOfOrigin || "—"} />
        <DetailRow
          label="UK Food Business Operator"
          value={fbo || "—"}
        />
        {bestBefore && (
          <DetailRow label="Best Before" value={bestBefore} />
        )}

        {/* Dietary checklist */}
        {dietaryFlags.length > 0 && (
          <div className="border-t border-stone-100 pt-3">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-2">
              Dietary
            </span>
            <div className="flex flex-wrap gap-2">
              {["vegetarian", "vegan", "gluten-free", "organic"].map((flag) => {
                const has = dietaryFlags.includes(flag)
                return (
                  <span
                    key={flag}
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                      has
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-stone-50 text-stone-400 border-stone-200"
                    }`}
                  >
                    {has ? "✓" : "—"}{" "}
                    {flag
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* VAT */}
        {vatRate !== undefined && (
          <div className="border-t border-stone-100 pt-3">
            <p className="text-[11px] text-stone-400">
              {vatRate === 0
                ? "VAT: 0% (zero-rated food item)"
                : "VAT: 20% included in price shown"}
            </p>
          </div>
        )}

        {/* Trust signals */}
        <div className="border-t border-stone-100 pt-3 flex flex-wrap gap-2">
          {countryOfOrigin?.toLowerCase() === "india" && (
            <span className="text-[10px] bg-brand-orange/10 text-brand-orange font-medium px-2 py-0.5 rounded-full">
              🇮🇳 Authentically Sourced
            </span>
          )}
          {(sourcingTier === "A" || sourcingTier === "B") && (
            <span className="text-[10px] bg-green-50 text-green-700 font-medium px-2 py-0.5 rounded-full">
              ✓ UK Stocked
            </span>
          )}
          {meta.subscription_eligible && (
            <span className="text-[10px] bg-purple-50 text-purple-700 font-medium px-2 py-0.5 rounded-full">
              🔄 Subscribe Eligible
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex-shrink-0">
        {label}
      </span>
      <span className="text-xs text-stone-700 text-right">{value}</span>
    </div>
  )
}
