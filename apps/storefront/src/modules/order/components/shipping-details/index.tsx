import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  return (
    <div className="space-y-4">
      <div data-testid="shipping-address-summary">
        <p className="text-sm font-medium text-gray-700">
          {order.shipping_address?.first_name}{" "}
          {order.shipping_address?.last_name}
        </p>
        <p className="text-sm text-gray-500">
          {order.shipping_address?.address_1}
          {order.shipping_address?.address_2 && (
            <>, {order.shipping_address?.address_2}</>
          )}
        </p>
        <p className="text-sm text-gray-500">
          {order.shipping_address?.postal_code},{" "}
          {order.shipping_address?.city}
        </p>
        <p className="text-sm text-gray-500">
          {order.shipping_address?.country_code?.toUpperCase()}
        </p>
      </div>

      <div data-testid="shipping-contact-summary">
        <p className="text-sm font-medium text-gray-700">Contact</p>
        <p className="text-sm text-gray-500">
          {order.shipping_address?.phone}
        </p>
        <p className="text-sm text-gray-500">{order.email}</p>
      </div>

      <div data-testid="shipping-method-summary">
        <p className="text-sm font-medium text-gray-700">Method</p>
        <p className="text-sm text-gray-500">
          {(order as any).shipping_methods?.[0]?.name} (
          {convertToLocale({
            amount: order.shipping_methods?.[0]?.total ?? 0,
            currency_code: order.currency_code,
          })}
          )
        </p>
      </div>
    </div>
  )
}

export default ShippingDetails
