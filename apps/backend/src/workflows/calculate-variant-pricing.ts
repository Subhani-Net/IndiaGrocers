import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { VariantMetadata } from "../types/variant-metadata"

/**
 * Price-per-unit label logic — determines the label based on product category.
 * US-01-02
 */
function getPricePerUnitLabel(
  weightGrams: number,
  weightUnit: string,
  categoryHandle?: string
): string {
  const isLiquid = weightUnit === "ml" || weightUnit === "l"
  const isOil =
    categoryHandle === "oils-ghee" ||
    categoryHandle === "cooking-oils-ghee"
  const isSpice =
    categoryHandle?.includes("spice") ||
    categoryHandle?.includes("masala") ||
    categoryHandle === "spices-ground" ||
    categoryHandle === "spices-whole" ||
    categoryHandle === "spice-blends"
  const isBeverage = categoryHandle === "beverages"

  if (isOil || (isLiquid && !isBeverage)) {
    return "per 100ml"
  }
  if (isSpice || isBeverage) {
    return "per 100g"
  }
  // Default: staples, atta, dals, grains
  return "per kg"
}

/**
 * Normalises weight to grams regardless of the stored unit.
 */
function toGrams(value: number, unit: string): number {
  switch (unit) {
    case "kg":
      return value * 1000
    case "l":
      return value * 1000
    case "ml":
      return value
    case "g":
    default:
      return value
  }
}

/**
 * Calculates price-per-unit in pence per label-unit.
 * e.g. "per kg" = pence per 1000g; "per 100g" = pence per 100g
 */
function calcPricePerUnit(
  priceInPence: number,
  weightGrams: number,
  label: string
): number {
  if (weightGrams <= 0) return 0
  if (label === "per kg") {
    return Math.round((priceInPence / weightGrams) * 1000)
  }
  if (label === "per 100g" || label === "per 100ml") {
    return Math.round((priceInPence / weightGrams) * 100)
  }
  return Math.round((priceInPence / weightGrams) * 1000)
}

// ---------------------------------------------------------------------------
// Step 1: Fetch product with variants and prices
// ---------------------------------------------------------------------------
type FetchProductInput = { productId: string }

const fetchProductWithVariantsStep = createStep(
  "fetch-product-with-variants",
  async ({ productId }: FetchProductInput, { container }) => {
    const query = container.resolve("query" as any)

    const { data: products } = await query.graph({
      entity: "product",
      filters: { id: productId },
      fields: [
        "id",
        "collection.handle",
        "variants.id",
        "variants.metadata",
        "variants.prices.amount",
        "variants.prices.currency_code",
      ],
    })

    const product = products?.[0]
    if (!product) {
      throw new Error(`Product ${productId} not found`)
    }

    return new StepResponse(product)
  }
)

// ---------------------------------------------------------------------------
// Step 2: Calculate and update variant metadata
// ---------------------------------------------------------------------------
type UpdateVariantsInput = {
  product: any
}

const updateVariantPricingStep = createStep(
  "update-variant-pricing",
  async ({ product }: UpdateVariantsInput, { container }) => {
    const productModule = container.resolve(Modules.PRODUCT)
    const categoryHandle: string | undefined =
      product.collection?.handle

    type VariantPricingResult = {
      variantId: string
      weightGrams: number
      pricePerUnit: number
      label: string
    }

    const results: VariantPricingResult[] = []

    for (const variant of product.variants ?? []) {
      const meta = (variant.metadata ?? {}) as Partial<VariantMetadata>
      const weightValue = meta.weight_value
      const weightUnit = meta.weight_unit

      if (!weightValue || !weightUnit) continue

      const weightGrams = toGrams(weightValue, weightUnit)
      const label = getPricePerUnitLabel(weightGrams, weightUnit, categoryHandle)

      // Use GBP price; fall back to first available price
      const gbpPrice = (variant.prices ?? []).find(
        (p: any) => p.currency_code === "gbp"
      ) ?? variant.prices?.[0]

      const priceInPence: number = gbpPrice?.amount ?? 0
      const pricePerUnit = calcPricePerUnit(priceInPence, weightGrams, label)

      results.push({ variantId: variant.id, weightGrams, pricePerUnit, label })
    }

    // Determine best-value variant (lowest price per unit)
    const best = results.reduce<VariantPricingResult | null>((acc, r) => {
      if (r.pricePerUnit <= 0) return acc
      if (!acc || r.pricePerUnit < acc.pricePerUnit) return r
      return acc
    }, null)

    // Persist updated metadata back to each variant
    for (const r of results) {
      const variant = product.variants.find((v: any) => v.id === r.variantId)
      const existingMeta = (variant?.metadata ?? {}) as Record<string, unknown>

      await (productModule as any).updateProductVariants([
        {
          id: r.variantId,
          metadata: {
            ...existingMeta,
            weight_grams: r.weightGrams,
            price_per_unit: r.pricePerUnit,
            price_per_unit_label: r.label,
            is_best_value: best?.variantId === r.variantId,
          },
        },
      ])
    }

    return new StepResponse({ updatedCount: results.length })
  }
)

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------
type WorkflowInput = { productId: string }
type WorkflowOutput = { updatedCount: number }

const calculateVariantPricingWorkflow = createWorkflow(
  "calculate-variant-pricing",
  (input: WorkflowInput) => {
    const product = fetchProductWithVariantsStep({ productId: input.productId })
    const result = updateVariantPricingStep({ product })
    return new WorkflowResponse(result)
  }
)

export default calculateVariantPricingWorkflow
