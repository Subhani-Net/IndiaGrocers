"use client"

import { Button, Heading, Input, Badge } from "@medusajs/ui"
import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { formatGBP } from "@lib/util/format-price"
import BasketProgressBar from "@modules/cart/components/basket-progress-bar"
import {
  FREE_DELIVERY_THRESHOLD,
  MIN_ORDER_AMOUNT,
  STANDARD_DELIVERY_COST,
} from "@lib/config/store-config"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) return "address"
  if (cart?.shipping_methods?.length === 0) return "delivery"
  return "payment"
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState("")

  const { promotions = [] } = cart
  const itemTotal = cart.item_total || 0
  const itemCount = cart.items?.length || 0
  const belowMinOrder = itemCount > 0 && itemTotal < MIN_ORDER_AMOUNT

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

  const reachedFree = itemTotal >= FREE_DELIVERY_THRESHOLD
  const deliveryCost = reachedFree ? 0 : STANDARD_DELIVERY_COST
  const total = itemTotal + (reachedFree ? 0 : STANDARD_DELIVERY_COST)

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-xl leading-tight">
        Order Summary
      </Heading>

      {/* Basket Progress Bar */}
      <BasketProgressBar itemTotal={itemTotal} itemCount={itemCount} />

      <Divider />

      {/* Promo Code Section */}
      <div className="border border-grey-20 rounded-lg p-4">
        <button
          onClick={() => setPromoOpen(!promoOpen)}
          className="text-sm text-grey-50 hover:text-grey-70 flex items-center gap-2 w-full text-left"
        >
          <svg
            className={`w-3 h-3 transition-transform ${promoOpen ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Got a code?
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
              className="bg-brand-orange text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-orange/90 disabled:opacity-50 whitespace-nowrap"
            >
              {applying ? "Applying..." : "Apply"}
            </button>
          </div>
        )}

        {error && <p className="text-xs text-brand-red mt-2">{error}</p>}

        {promotions.length > 0 && (
          <div className="mt-3 space-y-2">
            {promotions.map((promotion) => (
              <div
                key={promotion.id}
                className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Badge color="green" size="small">{promotion.code}</Badge>
                  <span className="text-sm font-medium text-green-700">
                    {promotion.application_method?.type === "percentage"
                      ? `-${promotion.application_method.value}%`
                      : promotion.application_method?.value !== undefined
                        ? `-${convertToLocale({ amount: Number(promotion.application_method.value), currency_code: promotion.application_method.currency_code || cart.currency_code })}`
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
                  className="bg-brand-orange text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-orange/90 disabled:opacity-50 whitespace-nowrap"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Divider />

      {/* Line items */}
      <div className="flex flex-col gap-y-1.5 text-sm">
        <div className="flex justify-between text-stone-500">
          <span>Subtotal</span>
          <span>{formatGBP(itemTotal)}</span>
        </div>
        <div className="flex justify-between text-stone-500">
          <span>Delivery</span>
          <span className={reachedFree ? "text-green-600 font-medium" : ""}>
            {reachedFree ? "Free" : formatGBP(STANDARD_DELIVERY_COST)}
          </span>
        </div>
        {!reachedFree && (
          <p className="text-xs text-stone-400">
            Free delivery on orders over {formatGBP(FREE_DELIVERY_THRESHOLD)}
          </p>
        )}
      </div>

      <Divider />

      <div className="flex justify-between items-baseline">
        <span className="text-lg font-bold text-stone-800">Total</span>
        <span className="text-xl font-bold text-stone-800">
          {formatGBP(total)}
        </span>
      </div>

      {/* Checkout Button */}
      {belowMinOrder ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p className="text-sm font-semibold text-red-700">
            Add {formatGBP(MIN_ORDER_AMOUNT - itemTotal)} more to checkout
          </p>
          <p className="text-xs text-red-500 mt-0.5">
            Minimum order is {formatGBP(MIN_ORDER_AMOUNT)}
          </p>
        </div>
      ) : (
        <LocalizedClientLink
          href={"/checkout?step=" + step}
          data-testid="checkout-button"
        >
          <button className="w-full py-3 bg-brand-orange text-white font-bold rounded-lg hover:bg-brand-orange/90 active:scale-[0.98] transition-all">
                            Go to Checkout — {formatGBP(total)}
          </button>
        </LocalizedClientLink>
      )}
    </div>
  )
}

export default Summary
