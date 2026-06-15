import { Metadata } from "next"
import OrderConfirmationClient from "@modules/order/components/order-confirmation-client"

type Props = {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your purchase was successful",
}

export default async function OrderConfirmedPage(props: Props) {
  const { id: orderId } = await props.params

  return <OrderConfirmationClient orderId={orderId} />
}
