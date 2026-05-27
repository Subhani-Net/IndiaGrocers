import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useState } from "react"
import { Container, Heading, Text, Button, Badge, Textarea } from "@medusajs/ui"

interface PriceUpdateResult {
  updated: number
  failed: number
  errors: string[]
}

const PriceUpdateWidget = () => {
  const [csv, setCsv] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PriceUpdateResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePreview = () => {
    // Parse CSV and show preview
    const lines = csv.trim().split("\n").filter(Boolean)
    if (lines.length === 0) {
      setError("Please paste CSV data")
      return
    }

    // Format: sku_id, new_price_gbp
    const errors: string[] = []
    const updates: Array<{ sku: string; price: string }> = []

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(",").map((s) => s.trim())
      if (parts.length < 2) {
        errors.push(`Line ${i + 1}: Invalid format (need sku_id,price)`)
        continue
      }
      const price = parseFloat(parts[1])
      if (isNaN(price) || price <= 0) {
        errors.push(`Line ${i + 1}: Invalid price "${parts[1]}"`)
        continue
      }
      updates.push({ sku: parts[0], price: parts[1] })
    }

    if (errors.length > 0) {
      setResult({ updated: updates.length, failed: errors.length, errors })
    } else {
      setResult({ updated: updates.length, failed: 0, errors: [] })
    }
    setError(null)
  }

  const handleApply = async () => {
    setLoading(true)
    setError(null)

    const lines = csv.trim().split("\n").filter(Boolean)
    let updated = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < lines.length; i++) {
      try {
        const [sku, priceStr] = lines[i].split(",").map((s) => s.trim())
        const price = Math.round(parseFloat(priceStr) * 100)

        // Find product by SKU and update price
        const searchRes = await fetch(
          `/admin/products?q=${encodeURIComponent(sku)}&fields=*variants`
        )
        const { products } = await searchRes.json()
        const product = products?.[0]

        if (!product) {
          failed++
          errors.push(`Line ${i + 1}: SKU "${sku}" not found`)
          continue
        }

        const variant = product.variants?.find(
          (v: any) => v.sku === sku
        )

        if (!variant) {
          failed++
          errors.push(`Line ${i + 1}: Variant for SKU "${sku}" not found`)
          continue
        }

        // Update variant price via Medusa API
        const updateRes = await fetch(
          `/admin/products/${product.id}/variants/${variant.id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prices: [
                {
                  currency_code: "gbp",
                  amount: price,
                },
              ],
            }),
          }
        )

        if (updateRes.ok) {
          updated++
        } else {
          failed++
          errors.push(`Line ${i + 1}: Failed to update "${sku}"`)
        }
      } catch (e: any) {
        failed++
        errors.push(`Line ${i + 1}: ${e.message}`)
      }
    }

    setResult({ updated, failed, errors })
    setLoading(false)
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Bulk Price Update</Heading>
        <div className="flex gap-2">
          <Badge color="grey" size="small">
            CSV import
          </Badge>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <Text size="small" className="text-ui-fg-muted">
          Paste CSV data in format: <code>sku_id,price_gbp</code> (one per line)
        </Text>

        <Textarea
          value={csv}
          onChange={(e) => {
            setCsv(e.target.value)
            setResult(null)
            setError(null)
          }}
          placeholder={`AF-AA-10KG,8.99\nBS-5KG,11.99\nTD-1KG,1.69`}
          rows={8}
          className="font-mono text-xs"
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <Text size="small" className="text-red-700">
              {error}
            </Text>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-3">
              <Badge color="green" size="small">
                ✓ {result.updated} updated
              </Badge>
              {result.failed > 0 && (
                <Badge color="red" size="small">
                  ✗ {result.failed} failed
                </Badge>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-[150px] overflow-y-auto space-y-1">
                {result.errors.slice(0, 10).map((err, i) => (
                  <Text key={i} size="xsmall" className="text-red-600">
                    {err}
                  </Text>
                ))}
                {result.errors.length > 10 && (
                  <Text size="xsmall" className="text-ui-fg-muted">
                    +{result.errors.length - 10} more errors
                  </Text>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handlePreview}
            disabled={!csv.trim()}
          >
            Preview
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            isLoading={loading}
            disabled={!csv.trim()}
          >
            {loading ? "Updating..." : "Apply Price Updates"}
          </Button>
        </div>

        <Text size="xsmall" className="text-ui-fg-muted">
          Prices are in GBP (£), inclusive of VAT. Price-per-unit will be
          recalculated automatically.
        </Text>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.list.before",
})

export default PriceUpdateWidget
