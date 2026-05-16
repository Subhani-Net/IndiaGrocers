import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderSummaryProps = {
  order: HttpTypes.StoreOrder
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  const getAmount = (amount?: number | null) => {
    if (!amount) {
      return
    }

    return convertToLocale({
      amount,
      currency_code: order.currency_code,
    })
  }

  return (
    <div>
      <div className="text-sm text-gray-600 space-y-2">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span className="font-medium">{getAmount(order.subtotal)}</span>
        </div>
        {order.discount_total > 0 && (
          <div className="flex items-center justify-between text-brand-green">
            <span>Discount</span>
            <span>- {getAmount(order.discount_total)}</span>
          </div>
        )}
        {order.gift_card_total > 0 && (
          <div className="flex items-center justify-between text-brand-green">
            <span>Gift Card</span>
            <span>- {getAmount(order.gift_card_total)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span className="font-medium">{getAmount(order.shipping_total)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Taxes</span>
          <span className="font-medium">{getAmount(order.tax_total)}</span>
        </div>
        <div className="h-px w-full border-b border-dashed border-gray-300 my-4" />
        <div className="flex items-center justify-between text-base font-bold text-brand-orange">
          <span>Total</span>
          <span>{getAmount(order.total)}</span>
        </div>
      </div>
    </div>
  )
}

export default OrderSummary
