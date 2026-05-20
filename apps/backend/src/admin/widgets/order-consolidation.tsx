import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useState } from "react"

interface ConsolidatedItem {
  product_id: string
  product_title: string
  variant_id: string
  variant_title: string
  variant_sku: string | null
  total_quantity: number
  order_count: number
}

interface ConsolidationResult {
  target_date: string
  orders_found: number
  consolidated_items: ConsolidatedItem[]
  summary: { total_products: number; total_quantity: number }
}

const ConsolidationPanel = () => {
  const [targetDate, setTargetDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ConsolidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConsolidate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/admin/consolidate-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_date: targetDate }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || data.detail || `HTTP ${res.status}`)
      }

      const data: ConsolidationResult = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || "Failed to consolidate orders")
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (!result?.consolidated_items.length) return

    const headers = [
      "Product ID",
      "Product Title",
      "Variant ID",
      "Variant Title",
      "Variant SKU",
      "Total Quantity",
      "Order Count",
    ]

    const rows = result.consolidated_items.map((item) => [
      item.product_id,
      `"${item.product_title.replace(/"/g, '""')}"`,
      item.variant_id,
      `"${item.variant_title.replace(/"/g, '""')}"`,
      item.variant_sku || "",
      item.total_quantity,
      item.order_count,
    ])

    const csv =
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n") + "\n"

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `order-consolidation-${result.target_date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-6 py-4">
      <h2 className="text-lg font-semibold text-ui-fg-base mb-4">
        Order Consolidation — Wholesale Master List
      </h2>

      <div className="flex items-end gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="consolidation-date"
            className="text-xs font-medium text-ui-fg-subtle"
          >
            Target Date
          </label>
          <input
            id="consolidation-date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="border border-ui-border-base rounded-md px-3 py-2 text-sm text-ui-fg-base bg-ui-bg-field"
          />
        </div>

        <button
          onClick={handleConsolidate}
          disabled={loading}
          className="px-4 py-2 rounded-md text-sm font-medium bg-ui-button-inverted text-ui-fg-on-inverted hover:bg-ui-button-inverted-hover disabled:opacity-50"
        >
          {loading ? "Processing..." : "Consolidate"}
        </button>

        {result?.consolidated_items.length ? (
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-md text-sm font-medium border border-ui-border-base text-ui-fg-base hover:bg-ui-bg-subtle"
          >
            Export CSV
          </button>
        ) : null}
      </div>

      {error && (
        <div className="text-ui-fg-error text-sm mb-4 p-3 bg-ui-bg-error rounded-md">
          {error}
        </div>
      )}

      {result && (
        <div className="mb-2 text-sm text-ui-fg-subtle">
          {result.orders_found} orders found &bull;{" "}
          {result.summary.total_products} unique products &bull;{" "}
          {result.summary.total_quantity} total units
        </div>
      )}

      {result?.consolidated_items.length ? (
        <div className="overflow-x-auto border border-ui-border-base rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-ui-bg-subtle text-ui-fg-subtle">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Product</th>
                <th className="text-left px-3 py-2 font-medium">Variant</th>
                <th className="text-right px-3 py-2 font-medium">
                  Total Qty
                </th>
                <th className="text-right px-3 py-2 font-medium">Orders</th>
              </tr>
            </thead>
            <tbody>
              {result.consolidated_items.map((item, i) => (
                <tr
                  key={item.variant_id || item.product_id || i}
                  className={`border-t border-ui-border-base ${
                    i % 2 === 0 ? "bg-ui-bg-base" : "bg-ui-bg-subtle"
                  }`}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium">{item.product_title}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div>{item.variant_title}</div>
                    {item.variant_sku && (
                      <div className="text-xs text-ui-fg-muted">
                        SKU: {item.variant_sku}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {item.total_quantity}
                  </td>
                  <td className="px-3 py-2 text-right">{item.order_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : result ? (
        <div className="text-sm text-ui-fg-subtle py-4">
          No orders found for this date.
        </div>
      ) : null}
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default ConsolidationPanel
