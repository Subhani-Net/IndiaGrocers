"use client"

import { useState, useCallback, useEffect } from "react"
import { setAddresses, placeOrder, initiatePaymentSession, setShippingMethod } from "@lib/data/cart"
import { STANDARD_DELIVERY_COST } from "@lib/config/store-config"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState } from "react"
import { formatGBP } from "@lib/util/format-price"
import StepIndicator from "@modules/checkout/components/step-indicator"
import PostcodeValidator from "@modules/checkout/components/postcode-validator"
import DeliverySlotSelector from "@modules/checkout/components/delivery-slot-selector"
import ErrorMessage from "@modules/checkout/components/error-message"
import Spinner from "@modules/common/icons/spinner"
import StripePayment from "@modules/checkout/components/stripe-payment"

interface CheckoutFormProps {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
  shippingOptions?: any[]
}

export default function CheckoutForm({ cart, customer, shippingOptions = [] }: CheckoutFormProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const step = searchParams.get("step") || "address"

  // Address state
  const [firstName, setFirstName] = useState(cart?.shipping_address?.first_name || "")
  const [lastName, setLastName] = useState(cart?.shipping_address?.last_name || "")
  const [address1, setAddress1] = useState(cart?.shipping_address?.address_1 || "")
  const [city, setCity] = useState(cart?.shipping_address?.city || "London")
  const [phone, setPhone] = useState(cart?.shipping_address?.phone || "")
  const [email, setEmail] = useState(cart?.email || "")
  const [postcode, setPostcode] = useState(cart?.shipping_address?.postal_code || "")
  const [postcodeValid, setPostcodeValid] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)

  // Delivery slot state
  const [selectedSlotDate, setSelectedSlotDate] = useState<Date | null>(null)
  const [selectedSlotWindow, setSelectedSlotWindow] = useState<any>(null)
  const [settingShipping, setSettingShipping] = useState(false)
  const [deliveryError, setDeliveryError] = useState<string | null>(null)

  // Payment state
  const [placingOrder, setPlacingOrder] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  // Shipping method — derive from cart after it's been set
  const hasShippingMethod = (cart?.shipping_methods?.length ?? 0) > 0

  // Step guard: if user manually navigates to payment without shipping, redirect to delivery
  useEffect(() => {
    if (step === "payment" && !hasShippingMethod) {
      const params = new URLSearchParams(searchParams)
      params.set("step", "delivery")
      router.replace(`${pathname}?${params.toString()}`)
    }
  }, [step, hasShippingMethod, searchParams, router, pathname])

  const pushStep = useCallback(
    (newStep: string) => {
      const params = new URLSearchParams(searchParams)
      params.set("step", newStep)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname]
  )

  // Handle address via form submission to server action
  const handleAddressSubmit = async () => {
    setAddressError(null)
    if (!firstName || !lastName || !address1 || !city || !phone || !email) {
      setAddressError("Please fill in all required fields")
      return
    }
    if (!postcodeValid) {
      setAddressError("Please enter a valid London postcode (e.g. SW9 8AL)")
      return
    }
    setSavingAddress(true)
    try {
      const countryCode = cart?.shipping_address?.country_code?.toLowerCase() || "gb"
      const f = new FormData()
      f.set("shipping_address.first_name", firstName)
      f.set("shipping_address.last_name", lastName)
      f.set("shipping_address.address_1", address1)
      f.set("shipping_address.city", city)
      f.set("shipping_address.postal_code", postcode)
      f.set("shipping_address.country_code", countryCode)
      f.set("shipping_address.phone", phone)
      f.set("email", email)
      f.set("shipping_address.province", "")
      f.set("shipping_address.company", "")
      f.set("shipping_address.address_2", "")

      const result = await setAddresses(null as any, f as any)
      if (result && typeof result === "string") {
        setAddressError(result)
      }
      // setAddresses redirects on success — if we get here, it failed
    } catch (e: any) {
      setAddressError(e.message || "Failed to save address")
    }
    setSavingAddress(false)
  }

  // Slot selection
  const handleSlotSelect = (date: Date, window: any) => {
    setSelectedSlotDate(date)
    setSelectedSlotWindow(window)
    setDeliveryError(null)
  }

  // Delivery Continue: register shipping method on the cart, then advance
  const handleDeliveryContinue = async () => {
    if (!selectedSlotDate || !selectedSlotWindow) return
    setDeliveryError(null)

    const shippingOptionId = selectedSlotWindow.shippingOptionId
    if (!shippingOptionId) {
      setDeliveryError("No shipping option available. Please try again.")
      return
    }

    setSettingShipping(true)
    try {
      await setShippingMethod({ cartId: cart.id, shippingMethodId: shippingOptionId })
      pushStep("payment")
    } catch (e: any) {
      setDeliveryError(e.message || "Failed to set delivery method. Please try again.")
    }
    setSettingShipping(false)
  }

  // Handle order placement
  const handlePlaceOrder = async (paymentMethodId?: string) => {
    setPlacingOrder(true)
    setPaymentError(null)

    if (!cart?.shipping_methods?.length) {
      setPaymentError("Please select a delivery slot before placing your order.")
      setPlacingOrder(false)
      return
    }
    console.log("[placeOrder] paymentMethodId:", paymentMethodId, "provider:", paymentMethodId ? "pp_stripe_stripe" : "pp_system_default")
    console.log("[placeOrder] cart.item_total:", cart?.item_total, "cart.total:", cart?.total)
    try {
      if (cart) {
        await initiatePaymentSession(cart, {
          provider_id: paymentMethodId ? "pp_stripe_stripe" : "pp_system_default",
          data: paymentMethodId ? { 
            payment_method: paymentMethodId,
            confirm: true,
            return_url: window.location.href,
          } : undefined,
        } as any)
      }
      await placeOrder()
    } catch (e: any) {
      if (e?.digest?.startsWith("NEXT_REDIRECT")) throw e
      setPaymentError(
        e.message || "Payment failed. Please try again."
      )
      setPlacingOrder(false)
    }
  }

  const itemTotal = cart?.item_total || 0
  const deliveryCost = cart?.shipping_methods?.[0]?.amount ?? STANDARD_DELIVERY_COST
  const total = itemTotal + (deliveryCost > 0 ? deliveryCost : 0)

  // Log amounts for price verification (all values in pence)
  if (process.env.NODE_ENV === "development" && cart) {
    console.log("[checkout] itemTotal:", itemTotal, "deliveryCost:", deliveryCost, "total:", total)
  }

  return (
    <div className="w-full">
      <StepIndicator />

      <div className="w-full max-w-xl mx-auto">
        {/* === STEP 1: ADDRESS === */}
        {step === "address" && (
          <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6" data-testid="checkout-step-address">
            <h2 className="text-lg font-bold text-stone-900 mb-1">Delivery Address</h2>
            <p className="text-xs text-stone-400 mb-4">
              We deliver across Greater London. Enter your postcode to check availability.
            </p>

            {/* Guest notice */}
            {!customer && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  <span className="font-bold">Guest checkout</span> — no account needed.{" "}
                  <a href="/account" className="text-brand-orange font-medium underline">
                    Sign in
                  </a>{" "}
                  for faster checkout next time.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">First name *</span>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 text-sm border border-stone-200 rounded-lg outline-none focus:border-brand-orange transition-colors" required />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Last name *</span>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 text-sm border border-stone-200 rounded-lg outline-none focus:border-brand-orange transition-colors" required />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Phone *</span>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXX XXXXXX"
                    className="w-full mt-1 px-3 py-2.5 text-sm border border-stone-200 rounded-lg outline-none focus:border-brand-orange transition-colors" required />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Email *</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 text-sm border border-stone-200 rounded-lg outline-none focus:border-brand-orange transition-colors" required />
                </label>
              </div>

              <label className="block">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Address *</span>
                <input type="text" value={address1} onChange={(e) => setAddress1(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 text-sm border border-stone-200 rounded-lg outline-none focus:border-brand-orange transition-colors" required />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">City *</span>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 text-sm border border-stone-200 rounded-lg outline-none focus:border-brand-orange transition-colors" required />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Postcode *</span>
                  <PostcodeValidator value={postcode} onChange={(val, valid) => { setPostcode(val); setPostcodeValid(valid) }} />
                </label>
              </div>

              {addressError && <ErrorMessage error={addressError} />}

              <button onClick={handleAddressSubmit}
                disabled={savingAddress || !postcodeValid}
                className="w-full py-3 bg-brand-orange text-white font-bold rounded-lg hover:bg-brand-orange/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm">
                {savingAddress ? "Saving..." : "Continue to Delivery Slot"}
              </button>
            </div>
          </div>
        )}

        {/* === STEP 2: DELIVERY SLOT === */}
        {step === "delivery" && (
          <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6" data-testid="checkout-step-delivery">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-900">Delivery Slot</h2>
              <button onClick={() => pushStep("address")} className="text-xs text-stone-400 hover:text-brand-orange">← Back</button>
            </div>

            <div className="bg-stone-50 rounded-lg p-3 mb-5 text-xs text-stone-600">
              <p className="font-medium text-stone-700">{firstName} {lastName}</p>
              <p>{address1}, {city}, {postcode}</p>
            </div>

            <DeliverySlotSelector
              onSelect={handleSlotSelect}
              selectedDate={selectedSlotDate}
              selectedWindow={selectedSlotWindow}
              hasFastRequired={false}
              shippingOptions={shippingOptions}
            />

            {deliveryError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {deliveryError}
              </div>
            )}

            <button onClick={handleDeliveryContinue}
              disabled={!selectedSlotDate || !selectedSlotWindow || settingShipping}
              className="w-full mt-5 py-3 bg-brand-orange text-white font-bold rounded-lg hover:bg-brand-orange/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              data-testid="continue-to-payment-btn">
              {settingShipping ? "Saving delivery..." : "Continue to Payment"}
            </button>
          </div>
        )}

        {/* === STEP 3: PAYMENT + REVIEW === */}
        {step === "payment" && (
          <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6" data-testid="checkout-step-payment">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-900">Review &amp; Pay</h2>
              <button onClick={() => pushStep("delivery")} className="text-xs text-stone-400 hover:text-brand-orange">← Back</button>
            </div>

            {/* Order breakdown */}
            <div className="border border-stone-200 rounded-lg p-4 mb-4" data-testid="checkout-order-summary">
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal ({cart?.items?.length || 0} items)</span>
                  <span>{formatGBP(itemTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Delivery</span>
                  <span className={deliveryCost === 0 ? "text-green-600 font-medium" : "text-stone-500"}>
                    {deliveryCost === 0 ? "FREE" : formatGBP(deliveryCost)}
                  </span>
                </div>
                <div className="border-t border-stone-100 pt-2 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-stone-800">{formatGBP(total)}</span>
                </div>
              </div>

              {/* Address + slot summary */}
              <div className="mt-4 pt-3 border-t border-stone-100 space-y-1">
                <p className="text-xs text-stone-500">
                  <span className="font-medium text-stone-600">Delivering to:</span> {address1}, {city}, {postcode}
                </p>
                {selectedSlotDate && selectedSlotWindow && (
                  <p className="text-xs text-stone-500">
                    <span className="font-medium text-stone-600">Slot:</span>{" "}
                    {selectedSlotDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}{" "}
                    {selectedSlotWindow.start}–{selectedSlotWindow.end}
                  </p>
                )}
              </div>
            </div>

            {paymentError && <div className="mb-4"><ErrorMessage error={paymentError} /></div>}

            {/* Stripe Card Payment */}
            <StripePayment
              amount={total}
              onPay={async (paymentMethodId) => {
                await handlePlaceOrder(paymentMethodId)
              }}
              onError={(error) => setPaymentError(error)}
              disabled={placingOrder}
            />

            <label className="flex items-start gap-2 mt-4 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-brand-orange" defaultChecked />
              <span className="text-xs text-stone-500">I agree to the Terms &amp; Conditions and Privacy Policy</span>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
