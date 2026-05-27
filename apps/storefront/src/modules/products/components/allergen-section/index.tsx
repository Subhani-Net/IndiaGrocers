import { ALLERGEN_LABELS, getDietaryBadges } from "@lib/util/allergen-display"
import type { Allergen } from "../../../../types/product"

interface AllergenSectionProps {
  allergens: Allergen[]
  ingredients: string
  dietaryFlags: string[]
  countryOfOrigin: string
}

export default function AllergenSection({
  allergens,
  ingredients,
  dietaryFlags,
  countryOfOrigin,
}: AllergenSectionProps) {
  const badges = getDietaryBadges(dietaryFlags)

  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-amber-100/60 px-4 py-3 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wider">
            Allergens & Dietary Information
          </h2>
        </div>
        <p className="text-[10px] text-amber-700 mt-0.5">
          UK Food Information Regulations 2014
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Allergens */}
        {allergens && allergens.length > 0 ? (
          <div>
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-2">
              Contains
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {allergens.map((code) => (
                <span
                  key={code}
                  className="inline-block bg-white border border-amber-300 text-amber-800 text-[11px] font-medium px-2.5 py-1 rounded-full"
                >
                  {ALLERGEN_LABELS[code] || code}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-amber-700 font-medium">
              ✓ Contains no major allergens from the UK 14-allergen list.
              Always check product packaging before consumption.
            </p>
          </div>
        )}

        {/* Dietary flags */}
        {badges.length > 0 && (
          <div className="border-t border-amber-200 pt-3">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-2">
              Dietary
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {badges.map(({ label, color }) => (
                <span
                  key={label}
                  className={`inline-block text-[11px] font-medium px-2.5 py-1 rounded-full ${
                    color === "green"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : color === "emerald"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : color === "amber"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-lime-50 text-lime-700 border border-lime-200"
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Country of Origin */}
        {countryOfOrigin && (
          <div className="border-t border-amber-200 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-700 font-medium">
                Country of Origin:{" "}
                <span className="font-bold">{countryOfOrigin}</span>
              </span>
              {countryOfOrigin.toLowerCase() === "india" && (
                <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                  Authentically Sourced
                </span>
              )}
            </div>
          </div>
        )}

        {/* Ingredients */}
        {ingredients && (
          <div className="border-t border-amber-200 pt-3">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-1">
              Full Ingredients
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              {ingredients}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
