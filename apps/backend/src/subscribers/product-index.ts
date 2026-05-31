import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import {
  getProductsIndex,
  resolveSynonyms,
} from "@indiagrocers/meilisearch"

/**
 * Subscriber that indexes a product into MeiliSearch whenever it is
 * created or updated in Medusa.
 *
 * US-05: Search System — auto-indexing
 */
export default async function productIndexHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const productId = data.id
  if (!productId) return

  const query = container.resolve("query" as any)
  const logger = container.resolve("logger" as any)

  try {
    // Fetch the full product with all relations
    const { data: products } = await query.graph({
      entity: "product",
      filters: { id: productId },
      fields: [
        "id",
        "title",
        "handle",
        "subtitle",
        "description",
        "thumbnail",
        "status",
        "created_at",
        "metadata",
        "tags.value",
        "categories.handle",
        "categories.name",
        "collection.title",
        "collection.handle",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.inventory_quantity",
        "variants.metadata",
        "variants.calculated_price.calculated_amount",
      ],
    })

    const product = products?.[0]
    if (!product) return

    // Build MeiliSearch document
    const meta = (product.metadata || {}) as Record<string, unknown>
    const price =
      product.variants?.[0]?.calculated_price?.calculated_amount || 0
    const maxWeight = Math.max(
      0,
      ...(product.variants || []).map(
        (v: any) => v.metadata?.weight_grams || v.metadata?.weight_value || 0
      )
    )

    const document = {
      id: product.id,
      title: product.title,
      handle: product.handle,
      subtitle: product.subtitle || "",
      description: product.description || "",
      thumbnail: product.thumbnail || "",
      status: product.status,
      created_at: product.created_at,
      price_gbp: price,
      weight_grams: maxWeight,
      category_name: product.categories?.[0]?.name || "",
      category_handle: product.categories?.[0]?.handle || "",
      collection_title: product.collection?.title || "",
      collection_handle: product.collection?.handle || "",
      tags: (product.tags || []).map((t: any) => t.value),
      metadata: {
        ...meta,
        brand_slug: meta.brand_slug || "",
        synonyms_text: Array.isArray(meta.synonyms)
          ? (meta.synonyms as string[]).join(" ")
          : "",
      },
    }

    // Index into MeiliSearch
    const index = await getProductsIndex()
    await index.addDocuments([document])

    logger.info(`[search] Indexed product: ${product.title} (${product.id})`)
  } catch (err: any) {
    logger.warn(
      `[search] Failed to index product ${productId}: ${err.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"] as any,
}
