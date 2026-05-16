import { useMemo } from "react"

import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

const OrderCard = ({ order }: OrderCardProps) => {
  const numberOfLines = useMemo(() => {
    return (
      order.items?.reduce((acc, item) => {
        return acc + item.quantity
      }, 0) ?? 0
    )
  }, [order])

  const numberOfProducts = useMemo(() => {
    return order.items?.length ?? 0
  }, [order])

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || ""
    if (statusLower.includes("delivered") || statusLower.includes("fulfilled")) {
      return "bg-brand-green text-white"
    }
    if (
      statusLower.includes("processing") ||
      statusLower.includes("pending") ||
      statusLower.includes("shipped")
    ) {
      return "bg-brand-orange text-white"
    }
    if (statusLower.includes("cancelled") || statusLower.includes("canceled")) {
      return "bg-brand-red text-white"
    }
    return "bg-gray-500 text-white"
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:border-brand-orange transition-colors duration-200" data-testid="order-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg font-bold text-gray-900">
          #<span data-testid="order-display-id">{order.display_id}</span>
        </span>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadge(order.fulfillment_status)}`}
        >
          {order.fulfillment_status?.replace(/_/g, " ")}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <span data-testid="order-created-at">
          {new Date(order.created_at).toDateString()}
        </span>
        <span className="text-gray-300">|</span>
        <span data-testid="order-amount" className="font-semibold text-brand-orange">
          {convertToLocale({
            amount: order.total,
            currency_code: order.currency_code,
          })}
        </span>
        <span className="text-gray-300">|</span>
        <span>{`${numberOfLines} ${numberOfLines > 1 ? "items" : "item"}`}</span>
      </div>
      <div className="grid grid-cols-2 small:grid-cols-4 gap-4 my-4">
        {order.items?.slice(0, 3).map((i) => {
          return (
            <div
              key={i.id}
              className="flex flex-col gap-y-2"
              data-testid="order-item"
            >
              <Thumbnail thumbnail={i.thumbnail} images={[]} size="full" />
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-semibold text-gray-800" data-testid="item-title">
                  {i.title}
                </span>
                <span className="ml-2 text-gray-400">x</span>
                <span className="text-gray-500" data-testid="item-quantity">{i.quantity}</span>
              </div>
            </div>
          )
        })}
        {numberOfProducts > 4 && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-500">
              + {numberOfLines - 4}
            </span>
            <span className="text-sm text-gray-400">more</span>
          </div>
        )}
      </div>
      <div className="flex justify-end pt-3 border-t border-gray-100">
        <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
          <button className="btn-primary text-sm py-2 px-4">
            View Details
          </button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderCard
