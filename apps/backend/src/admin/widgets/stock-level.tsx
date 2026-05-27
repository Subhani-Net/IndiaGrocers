import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useState, useEffect } from "react"
import { Container, Heading, Text, Badge, Table } from "@medusajs/ui"

interface LowStockItem {
  id: string
  title: string
  sku: string | null
  variant_title: string
  inventory_quantity: number
  low_stock_threshold: number
  velocity_class: string
}

const StockLevelWidget = () => {
  const [items, setItems] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await fetch("/admin/products?limit=100&fields=*variants")
        const data = await res.json()
        const lowStock: LowStockItem[] = []

        for (const product of data.products || []) {
          const velocity = (product.metadata as any)?.velocity || "B"
          for (const variant of product.variants || []) {
            const qty = variant.inventory_quantity || 0
            const threshold =
              (variant.metadata as any)?.low_stock_threshold ||
              (velocity === "A" ? 20 : velocity === "C" ? 5 : 10)

            if (variant.manage_inventory && qty <= threshold && qty >= 0) {
              lowStock.push({
                id: variant.id,
                title: product.title,
                sku: variant.sku,
                variant_title: variant.title,
                inventory_quantity: qty,
                low_stock_threshold: threshold,
                velocity_class: velocity,
              })
            }
          }
        }

        setItems(lowStock.sort((a, b) => a.inventory_quantity - b.inventory_quantity))
      } catch {}
      setLoading(false)
    }
    fetchStock()
  }, [])

  const getStatusColor = (qty: number, threshold: number) => {
    if (qty === 0) return "red"
    if (qty <= threshold / 3) return "orange"
    return "orange"
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Stock Levels</Heading>
        {items.length > 0 && (
          <Badge color="orange" size="small">
            {items.length} low
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="px-6 py-8 text-center text-ui-fg-muted text-sm">
          Loading stock data...
        </div>
      ) : items.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <Text className="text-ui-fg-muted text-sm">
            All products are well stocked ✓
          </Text>
        </div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Product</Table.HeaderCell>
                <Table.HeaderCell>Variant</Table.HeaderCell>
                <Table.HeaderCell>Stock</Table.HeaderCell>
                <Table.HeaderCell>Threshold</Table.HeaderCell>
                <Table.HeaderCell>Velocity</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.slice(0, 30).map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell>
                    <Text size="small" className="truncate max-w-[200px]">
                      {item.title}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small">{item.variant_title}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text
                      size="small"
                      className={
                        item.inventory_quantity === 0
                          ? "text-red-600 font-semibold"
                          : ""
                      }
                    >
                      {item.inventory_quantity}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small">{item.low_stock_threshold}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      size="small"
                      color={
                        item.velocity_class === "A"
                          ? "green"
                          : item.velocity_class === "C"
                          ? "grey"
                          : "blue"
                      }
                    >
                      {item.velocity_class}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      size="small"
                      color={getStatusColor(
                        item.inventory_quantity,
                        item.low_stock_threshold
                      )}
                    >
                      {item.inventory_quantity === 0
                        ? "Restock"
                        : "Low"}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.list.after",
})

export default StockLevelWidget
