/**
 * PAYMENT DEBUG SUBSCRIBER
 * 
 * Captures all payment events and logs amounts to both console and a log file.
 * Log file: apps/backend/payment-debug.log
 *
 * Once the 100x issue is confirmed, this file can be deleted.
 */
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { appendFileSync } from "fs"
import { join } from "path"

const LOG_FILE = join(process.cwd(), "payment-debug.log")

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  try { appendFileSync(LOG_FILE, line + "\n") } catch {}
}

export const config: SubscriberConfig = {
  event: [
    "payment-collection.created",
    "payment-collection.payment_session_created",
    "order.placed",
  ],
}

export default async function paymentDebugSubscriber({ event, container }: SubscriberArgs) {
  try {
    const data = event?.data as any
    const eventName = event?.name || "unknown"

    if (eventName === "payment-collection.created") {
      log(`[payment-debug] PAYMENT COLLECTION CREATED | id=${data?.id} | amount=${data?.amount} | currency=${data?.currency_code}`)
    }

    if (eventName === "payment-collection.payment_session_created") {
      log(`[payment-debug] PAYMENT SESSION CREATED | provider=${data?.provider_id} | amount=${data?.amount} | pc_id=${data?.payment_collection_id}` +
        (data?.data ? ` | data=${JSON.stringify(data.data).slice(0, 300)}` : ""))
    }

    if (eventName === "order.placed") {
      // Fetch full order to get actual total
      try {
        const query = container.resolve("query") as any
        const { data: orders } = await query.graph({
          entity: "order",
          filters: { id: data?.id },
          fields: ["id", "display_id", "total", "subtotal", "shipping_total", "tax_total", "currency_code"],
        })
        const order = orders?.[0]
        if (order) {
          log(`[payment-debug] ORDER PLACED | id=${order.id} | display=#${order.display_id} | subtotal=${order.subtotal} | shipping=${order.shipping_total} | tax=${order.tax_total} | total=${order.total} | currency=${order.currency_code}`)
        }
      } catch {
        log(`[payment-debug] ORDER PLACED | id=${data?.id} (could not fetch full order)`)
      }
    }
  } catch (err: any) {
    log(`[payment-debug] ERROR: ${err.message}`)
  }
}
