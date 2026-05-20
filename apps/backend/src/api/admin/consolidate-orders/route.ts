import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService } from "@medusajs/framework/types"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { target_date } = req.body as { target_date?: string }

  if (!target_date) {
    return res.status(400).json({
      error: "target_date is required. Format: YYYY-MM-DD",
    })
  }

  const targetDate = new Date(target_date)
  if (isNaN(targetDate.getTime())) {
    return res.status(400).json({
      error: "Invalid target_date. Format: YYYY-MM-DD",
    })
  }

  const startOfDay = new Date(targetDate)
  startOfDay.setUTCHours(0, 0, 0, 0)

  const endOfDay = new Date(targetDate)
  endOfDay.setUTCHours(23, 59, 59, 999)

  const orderService: IOrderModuleService = req.scope.resolve("order")

  try {
    const [orders] = await orderService.listAndCountOrders(
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
      return res.json({
        target_date,
        orders_found: 0,
        consolidated_items: [],
        summary: { total_products: 0, total_quantity: 0 },
      })
    }

    const productMap = new Map<
      string,
      {
        product_id: string
        product_title: string
        variant_id: string
        variant_title: string
        variant_sku: string | null
        total_quantity: number
        order_count: number
      }
    >()

    for (const order of orders) {
      const seenProducts = new Set<string>()

      for (const item of order.items || []) {
        const productId = item.product_id || item.variant_id?.split("_")[0] || "unknown"
        const key = item.product_id || item.variant_id || `line-${item.id}`

        const existing = productMap.get(key)
        if (existing) {
          existing.total_quantity += item.quantity
          if (!seenProducts.has(productId)) {
            existing.order_count += 1
            seenProducts.add(productId)
          }
        } else {
          productMap.set(key, {
            product_id: item.product_id || productId,
            product_title: item.product_title || item.title || "",
            variant_id: item.variant_id || "",
            variant_title: item.variant_title || item.title || "",
            variant_sku: item.variant_sku || null,
            total_quantity: item.quantity,
            order_count: 1,
          })
          seenProducts.add(productId)
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

    return res.json({
      target_date,
      orders_found: orders.length,
      consolidated_items: consolidated,
      summary: {
        total_products: consolidated.length,
        total_quantity: totalQuantity,
      },
    })
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to consolidate orders",
      detail: error.message || String(error),
    })
  }
}
