/**
 * Order Confirmation Subscriber
 *
 * Listens to order.placed event and sends confirmation email via
 * Medusa's notification module. Also logs order details for
 * future invoice generation.
 */

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

export const config: SubscriberConfig = {
  event: ["order.placed"],
}

export default async function orderConfirmationSubscriber({ event, container }: SubscriberArgs) {
  const logger = container.resolve("logger") as any

  try {
    const orderData = event.data as any
    const orderId = orderData.id
    
    // Event data only carries { id } — fetch full order via remote query
    const query = container.resolve("query") as any
    const { data: orders } = await query.graph({
      entity: "order",
      filters: { id: orderId },
      fields: [
        "id", "email", "display_id", "total", "subtotal",
        "shipping_total", "tax_total", "created_at",
        "customer.email", "customer.first_name", "customer.last_name",
        "shipping_address.*",
        "items.*",
      ],
    })
    const order = orders?.[0]
    if (!order) {
      logger?.warn(`[order] Order ${orderId} not found via service`)
      return
    }

    const email = order.email || order.customer?.email
    if (!email || typeof email !== "string" || !email.includes("@")) {
      logger?.warn(`[order] No email on order ${orderId} or its customer`)
      return
    }

    const orderShortId = orderId?.slice(-8) || "Unknown"
    const displayId = order.display_id || orderShortId
    const items = (order.items || []).map((item: any) => ({
      title: item.title,
      quantity: item.quantity,
      unit_price: formatPrice(item.unit_price),
      total: formatPrice(item.total),
    }))
    const subtotal = formatPrice(order.subtotal || order.item_total)
    const shipping = formatPrice(order.shipping_total || 0)
    const tax = formatPrice(order.tax_total || 0)
    const total = formatPrice(order.total)
    const addressLine = order.shipping_address
      ? `${order.shipping_address.address_1 || ""}, ${order.shipping_address.city || ""}, ${order.shipping_address.postal_code || ""}`
      : "Not provided"

    const html = buildOrderConfirmationEmail({
      orderDisplayId: displayId,
      customerName: `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim() || "Customer",
      items: items as any,
      subtotal,
      shipping,
      tax,
      total,
      shippingAddress: addressLine,
      orderDate: new Date(order.created_at).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    })

    // Send via notification module
    try {
      const notificationService = container.resolve("notification") as any
      const methods = typeof notificationService === "object" && notificationService 
        ? Object.getOwnPropertyNames(Object.getPrototypeOf(notificationService)).concat(Object.keys(notificationService))
        : []
      logger?.info(`[order] Notification service methods: ${methods.filter(m => !m.startsWith("_")).join(", ")}`)
      
      if (notificationService?.createNotifications) {
        const notification = {
          to: email,
          channel: "email",
          content: {
            subject: `Order Confirmed — #${displayId}`,
            html,
          },
        }
        logger?.info(`[order] Sending notification to ${email} : ${JSON.stringify({ subject: notification.content.subject, htmlLength: html.length })}`)
        const result = await notificationService.createNotifications([notification])
        logger?.info(`[order] Notification result: ${JSON.stringify(result)}`)
        logger?.info(`[order] Confirmation email sent to ${email}`)
        return
      }
    } catch (err: any) {
      logger?.warn(`[order] Notification service unavailable: ${err.message}`)
    }

    // Dev fallback
    logger?.info(`[order] DEV EMAIL — Order #${displayId} to ${email}`)
    logger?.info(`[order] Items: ${items.length}, Total: ${total}`)
  } catch (err: any) {
    logger?.error(`[order] Subscriber error: ${err.message}`)
  }
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format((amount || 0) / 100)
}

function buildOrderConfirmationEmail(data: {
  orderDisplayId: string
  customerName: string
  items: { title: string; quantity: number; unit_price: string; total: string }[]
  subtotal: string
  shipping: string
  tax: string
  total: string
  shippingAddress: string
  orderDate: string
}): string {
  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.title}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${item.unit_price}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${item.total}</td>
    </tr>`
    )
    .join("")

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <tr><td style="background:#FF6B35;padding:24px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:22px;">Order Confirmed</h1>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;">#{ORDER_DISPLAY_ID} · {ORDER_DATE}</p>
  </td></tr>
  <tr><td style="padding:24px;">
    <p style="margin:0 0 16px;">Hi {CUSTOMER_NAME},</p>
    <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Your order has been confirmed and is being processed. You'll receive
      shipping updates once your order is on its way.
    </p>
    <h2 style="font-size:16px;margin:0 0 12px;">Order Summary</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
      <tr style="color:#888;text-transform:uppercase;font-size:11px;font-weight:bold;">
        <td style="padding:4px 0;border-bottom:2px solid #ddd;">Item</td>
        <td style="padding:4px 0;border-bottom:2px solid #ddd;text-align:center;">Qty</td>
        <td style="padding:4px 0;border-bottom:2px solid #ddd;text-align:right;">Price</td>
        <td style="padding:4px 0;border-bottom:2px solid #ddd;text-align:right;">Total</td>
      </tr>
      {ITEMS}
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:12px;">
      <tr><td style="padding:4px 0;">Subtotal</td><td style="text-align:right;">{SUBTOTAL}</td></tr>
      <tr><td style="padding:4px 0;">Delivery</td><td style="text-align:right;">{SHIPPING}</td></tr>
      <tr><td style="padding:4px 0;">VAT</td><td style="text-align:right;">{TAX}</td></tr>
      <tr style="font-weight:bold;font-size:16px;"><td style="padding:8px 0;border-top:2px solid #ddd;">Total</td><td style="text-align:right;border-top:2px solid #ddd;">{TOTAL}</td></tr>
    </table>
    <div style="background:#f9f9f9;border-radius:8px;padding:12px;margin-top:16px;font-size:13px;">
      <strong>Delivering to:</strong> {SHIPPING_ADDRESS}
    </div>
    <p style="color:#999;font-size:12px;text-align:center;margin-top:20px;">
      IndiaGrocers · London
    </p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`
    .replace(/\{ORDER_DISPLAY_ID\}/g, data.orderDisplayId)
    .replace(/\{ORDER_DATE\}/g, data.orderDate)
    .replace(/\{CUSTOMER_NAME\}/g, data.customerName)
    .replace(/\{ITEMS\}/g, itemsHtml)
    .replace(/\{SUBTOTAL\}/g, data.subtotal)
    .replace(/\{SHIPPING\}/g, data.shipping)
    .replace(/\{TAX\}/g, data.tax)
    .replace(/\{TOTAL\}/g, data.total)
    .replace(/\{SHIPPING_ADDRESS\}/g, data.shippingAddress)
}
