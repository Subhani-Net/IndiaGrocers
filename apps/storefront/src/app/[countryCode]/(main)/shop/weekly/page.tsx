import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import WeeklyShopPage from "@modules/weekly-shop/templates"
import { notFound } from "next/navigation"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Weekly Shop | IndiaGrocers",
  description: "Review your weekly shop — pre-filled from your last order",
}

export default async function WeeklyShopRoute(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const customer = await retrieveCustomer().catch(() => null)
  const orders = await listOrders().catch(() => null)

  if (!customer || !orders?.length) {
    return notFound()
  }

  // Build pre-filled items from last order
  const lastOrder = orders[0]
  const preFilledItems =
    lastOrder?.items?.map((item: any) => ({
      id: item.id,
      title: item.product_title || item.title,
      handle: item.product_handle || "",
      variantId: item.variant_id,
      weight: item.variant?.title || (item.metadata as any)?.weight || "",
      currentPrice: item.unit_price || item.variant?.calculated_price?.calculated_amount || 0,
      previousPrice: item.unit_price,
      priceChanged: false,
      thumbnail: item.thumbnail,
      quantity: item.quantity || 1,
      category: item.variant?.product?.categories?.[0]?.name || "Other",
    })) || []

  return (
    <WeeklyShopPage
      lastOrderDate={lastOrder?.created_at?.toString()}
      preFilledItems={preFilledItems.slice(0, 40)}
      countryCode={countryCode}
    />
  )
}
