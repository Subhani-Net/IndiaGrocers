"use client"

import { Button, Heading, Input, Badge } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { useState } from "react"
import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState("")

  const { promotions = [] } = cart

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setApplying(true)
    setError("")
    try {
      const codes = promotions
        .filter((p) => p.code !== undefined)
        .map((p) => p.code!)
      codes.push(promoCode.trim())
      await applyPromotions(codes)
      setPromoCode("")
    } catch (e: any) {
      setError(e.message || "Failed to apply code")
    }
    setApplying(false)
  }

  const handleRemovePromo = async (code: string) => {
    const validPromotions = promotions.filter(
      (promotion) => promotion.code !== code
    )
    await applyPromotions(
      validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    )
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
        Order Summary
      </Heading>

      {/* Promo Code Section */}
      <div className="border border-grey-20 rounded-lg p-4">
        <button
          onClick={() => setPromoOpen(!promoOpen)}
          className="text-sm text-grey-50 hover:text-grey-70 flex items-center gap-2 w-full text-left"
        >
          <svg
            className={`w-3 h-3 transition-transform ${promoOpen ? "rotate-90" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Have a promo code?
        </button>

        {promoOpen && promotions.length === 0 && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter code"
              className="flex-1 border border-grey-20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
              onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
            />
            <button
              onClick={handleApplyPromo}
              disabled={applying || !promoCode.trim()}
              className="btn-primary text-sm !py-2 !px-4 whitespace-nowrap"
            >
              {applying ? "Applying..." : "Apply"}
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs text-brand-red mt-2">{error}</p>
        )}

        {promotions.length > 0 && (
          <div className="mt-3 space-y-2">
            {promotions.map((promotion) => (
              <div
                key={promotion.id}
                className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Badge color="green" size="small">
                    {promotion.code}
                  </Badge>
                  <span className="text-sm font-medium text-green-700">
                    {promotion.application_method?.type === "percentage"
                      ? `-${promotion.application_method.value}%`
                      : promotion.application_method?.value !== undefined
                        ? `-${convertToLocale({
                            amount: Number(promotion.application_method.value),
                            currency_code: promotion.application_method.currency_code || cart.currency_code,
                          })}`
                        : ""}
                  </span>
                  {!promotion.is_automatic && (
                    <button
                      onClick={() => handleRemovePromo(promotion.code!)}
                      className="text-xs text-grey-50 hover:text-brand-red ml-1 underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            {promoOpen && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Add another code"
                  className="flex-1 border border-grey-20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
                  onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={applying || !promoCode.trim()}
                  className="btn-primary text-sm !py-2 !px-4 whitespace-nowrap"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Divider />
      <CartTotals totals={cart} />
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <button className="btn-primary w-full text-center">
          Proceed to Checkout
        </button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
