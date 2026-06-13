import { retrieveOrder } from "@lib/data/orders"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { Metadata } from "next"

type Props = {
  params: Promise<{ id: string }>
}
export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your purchase was successful",
}

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params
  const orderId = params.id
  const order = await retrieveOrder(orderId).catch(() => null)

  if (order) {
    return <OrderCompletedTemplate order={order} />
  }

  // Static confirmation — always renders even if backend is unreachable.
  // The user just paid; they MUST see a confirmation.
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-white rounded-xl border border-stone-200 p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-stone-900 mb-2">Order Confirmed</h1>
        <p className="text-sm text-stone-500 mb-4">
          Your order has been placed successfully.
        </p>
        <div className="bg-stone-50 rounded-lg p-3 mb-6 text-left">
          <p className="text-xs text-stone-400 mb-1">Order number</p>
          <p className="text-sm font-mono font-semibold text-stone-700 break-all">{orderId}</p>
        </div>
        <p className="text-xs text-stone-400 mb-6">
          A confirmation email is on its way. Full details will appear here shortly.
        </p>
        <a
          href="/store"
          className="inline-block w-full py-3 bg-brand-orange text-white font-bold rounded-lg hover:bg-brand-orange/90 active:scale-[0.98] transition-all text-sm"
        >
          Continue Shopping
        </a>
      </div>
    </div>
  )
}
