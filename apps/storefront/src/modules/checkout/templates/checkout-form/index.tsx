"use client"

import { useState, useCallback } from "react"
import { setAddresses, placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState } from "react"
import { formatGBP } from "@lib/util/format-price"
import StepIndicator from "@modules/checkout/components/step-indicator"
import PostcodeValidator from "@modules/checkout/components/postcode-validator"
import DeliverySlotSelector from "@modules/checkout/components/delivery-slot-selector"
import ErrorMessage from "@modules/checkout/components/error-message"
import Spinner from "@modules/common/icons/spinner"

interface CheckoutFormProps {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
}

export default function CheckoutForm({ cart, customer }: CheckoutFormProps) {
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

  // Payment state
  const [placingOrder, setPlacingOrder] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

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
  }

  // Handle order placement
  const handlePlaceOrder = async () => {
    setPlacingOrder(true)
    setPaymentError(null)
    try {
      await placeOrder()
      // placeOrder does redirect internally on success
    } catch (e: any) {
      setPaymentError(
        e.message || "Payment failed. Please try again."
      )
      setPlacingOrder(false)
    }
  }

  const itemTotal = cart?.item_total || 0
  const deliveryCost = selectedSlotWindow?.premium
    ? selectedSlotWindow.price
    : selectedSlotWindow
    ? 399
    : 399
  const total = itemTotal + (deliveryCost > 0 ? deliveryCost : 0)

  return (
    <div className="w-full">
      <StepIndicator />

      <div className="w-full max-w-xl mx-auto">
        {/* === STEP 1: ADDRESS === */}
        {step === "address" && (
          <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6">
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
          <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6">
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
            />

            <button onClick={() => { if (selectedSlotDate && selectedSlotWindow) pushStep("payment") }}
              disabled={!selectedSlotDate || !selectedSlotWindow}
              className="w-full mt-5 py-3 bg-brand-orange text-white font-bold rounded-lg hover:bg-brand-orange/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm">
              Continue to Payment
            </button>
          </div>
        )}

        {/* === STEP 3: PAYMENT + REVIEW === */}
        {step === "payment" && (
          <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-900">Review &amp; Pay</h2>
              <button onClick={() => pushStep("delivery")} className="text-xs text-stone-400 hover:text-brand-orange">← Back</button>
            </div>

            {/* Order breakdown */}
            <div className="border border-stone-200 rounded-lg p-4 mb-4">
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

            {/* Wallet Payments */}
            <div className="mb-4 space-y-2">
              <button
                type="button"
                className="w-full py-3 bg-black text-white font-semibold rounded-xl hover:bg-stone-800 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
                onClick={handlePlaceOrder}
              >
                <span className="text-lg"></span> Pay
              </button>
              <button
                type="button"
                className="w-full py-3 bg-stone-800 text-white font-semibold rounded-xl hover:bg-stone-700 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
                onClick={handlePlaceOrder}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.5 4.5c-1.95 0-3.46.84-4.38 2.17-.92-1.33-2.43-2.17-4.38-2.17C5.36 4.5 3 7.36 3 11c0 5.5 8.5 12.5 8.5 12.5S20 16.5 20 11c0-3.64-2.36-6.5-2.5-6.5z"/>
                </svg>
                Google Pay
              </button>
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-stone-200" />
                <span className="text-xs text-stone-400 font-medium">or pay with card</span>
                <div className="flex-1 h-px bg-stone-200" />
              </div>
            </div>

            {/* Card payment method */}
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-stone-200 flex items-center justify-center">
                  <span className="text-lg">💳</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800">Card Payment</p>
                  <p className="text-xs text-stone-400">Powered by Stripe · Visa, Mastercard, Amex</p>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2 mb-5 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-brand-orange" defaultChecked />
              <span className="text-xs text-stone-500">I agree to the Terms &amp; Conditions and Privacy Policy</span>
            </label>

            {paymentError && <ErrorMessage error={paymentError} />}

            <button onClick={handlePlaceOrder} disabled={placingOrder}
              className="w-full py-3.5 bg-brand-orange text-white text-sm font-bold rounded-lg hover:bg-brand-orange/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {placingOrder ? (
                <span className="flex items-center justify-center gap-2"><Spinner /> Processing...</span>
              ) : (
                `Place Order — ${formatGBP(total)}`
              )}
            </button>

            <p className="text-[10px] text-stone-400 text-center mt-3">
              🔒 Secure payment. Your card details are never stored.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
