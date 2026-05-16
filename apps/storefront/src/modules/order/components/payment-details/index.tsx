import { Container, Text } from "@medusajs/ui"

import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0]?.payments?.[0]

  return (
    <div>
      {payment && (
        <div>
          <div>
            <p className="text-sm font-medium text-gray-700">Payment method</p>
            <p
              className="text-sm text-gray-500"
              data-testid="payment-method"
            >
              {paymentInfoMap[payment.provider_id]?.title || payment.provider_id}
            </p>
          </div>
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700">Payment details</p>
            <div className="flex gap-2 text-sm text-gray-500 items-center mt-1">
              <Container className="flex items-center h-7 w-fit p-2 bg-gray-100">
                {paymentInfoMap[payment.provider_id]?.icon}
              </Container>
              <Text data-testid="payment-amount">
                {isStripeLike(payment.provider_id) && payment.data?.card_last4
                  ? `**** **** **** ${payment.data.card_last4}`
                  : `${convertToLocale({
                      amount: payment.amount,
                      currency_code: order.currency_code,
                    })} paid at ${new Date(
                      payment.created_at ?? ""
                    ).toLocaleString()}`}
              </Text>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentDetails
