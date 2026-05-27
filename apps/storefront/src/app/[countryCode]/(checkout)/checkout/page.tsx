import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout | IndiaGrocers",
  description: "Complete your order — Indian groceries delivered across London",
}

export default async function Checkout() {
  const cart = await retrieveCart()
  if (!cart) return notFound()

  const customer = await retrieveCustomer()

  return (
    <div className="bg-stone-50 min-h-screen py-6 sm:py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <CheckoutForm cart={cart} customer={customer} />
      </div>
    </div>
  )
}
