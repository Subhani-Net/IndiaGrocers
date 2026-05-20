import { MedusaContainer } from "@medusajs/framework/types"

export default async function orderConsolidationJob(
  container: MedusaContainer
) {
  const logger = container.resolve("logger")
  const orderService = container.resolve("order")

  const today = new Date()
  const startOfDay = new Date(today)
  startOfDay.setUTCHours(0, 0, 0, 0)

  const endOfDay = new Date(today)
  endOfDay.setUTCHours(23, 59, 59, 999)

  try {
    const orders = await orderService.listOrders(
      {
        created_at: {
          $gte: startOfDay.toISOString(),
          $lt: endOfDay.toISOString(),
        },
      },
      {
        relations: ["items"],
        take: 500,
      }
    )

    if (!orders.length) {
      logger.info("[order-consolidation] No orders found for today")
      return
    }

    const productMap = new Map<
      string,
      {
        product_id: string
        product_title: string
        total_quantity: number
      }
    >()

    for (const order of orders) {
      for (const item of order.items || []) {
        const productId =
          item.product_id ||
          item.variant_id?.split("_")[0] ||
          "unknown"
        const key = item.product_id || item.variant_id || `line-${item.id}`

        const existing = productMap.get(key)
        if (existing) {
          existing.total_quantity += item.quantity
        } else {
          productMap.set(key, {
            product_id: productId,
            product_title: item.product_title || item.title || "",
            total_quantity: item.quantity,
          })
        }
      }
    }

    const consolidated = Array.from(productMap.values()).sort(
      (a, b) => b.total_quantity - a.total_quantity
    )

    const totalQuantity = consolidated.reduce(
      (sum, item) => sum + item.total_quantity,
      0
    )

    logger.info(
      `[order-consolidation] ${today.toISOString().split("T")[0]}: ` +
        `${orders.length} orders, ${consolidated.length} products, ` +
        `${totalQuantity} total units`
    )

    if (consolidated.length > 0) {
      logger.info(
        "[order-consolidation] Top 5 items: " +
          consolidated
            .slice(0, 5)
            .map((i) => `${i.product_title} (${i.total_quantity})`)
            .join(", ")
      )
    }
  } catch (error: any) {
    logger.error(
      `[order-consolidation] Error: ${error.message || String(error)}`
    )
  }
}

export const config = {
  name: "order-consolidation",
  schedule: "0 0 * * *", // Daily at midnight
}
