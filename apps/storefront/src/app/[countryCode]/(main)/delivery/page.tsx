import { Metadata } from "next"
import DeliveryTemplate from "@modules/delivery/templates"

export const metadata: Metadata = {
  title: "Delivery Information | IndiaGrocers London",
  description: "Delivery charges, areas, cut-off times and FAQs for IndiaGrocers London",
}

export default function DeliveryPage() {
  return <DeliveryTemplate />
}
