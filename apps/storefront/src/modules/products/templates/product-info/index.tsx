import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

function extractBrand(
  title: string
): { brand: string | null; cleanTitle: string } {
  const separators = [" - ", " – ", " — "]
  for (const sep of separators) {
    const idx = title.lastIndexOf(sep)
    if (idx > 0) {
      return {
        brand: title.slice(idx + sep.length).trim(),
        cleanTitle: title.slice(0, idx).trim(),
      }
    }
  }
  return { brand: null, cleanTitle: title }
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const { brand, cleanTitle } = extractBrand(product.title)

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4 lg:max-w-[500px] mx-auto">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-medium text-ui-fg-muted hover:text-ui-fg-subtle"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="text-3xl leading-10 text-ui-fg-base"
          data-testid="product-title"
        >
          {cleanTitle}
        </Heading>

        {brand && (
          <span className="inline-block w-fit bg-brand-orange/10 text-brand-orange text-xs font-semibold px-2.5 py-0.5 rounded uppercase tracking-wide">
            {brand}
          </span>
        )}

        <Text
          className="text-medium text-ui-fg-subtle whitespace-pre-line"
          data-testid="product-description"
        >
          {product.description}
        </Text>
      </div>
    </div>
  )
}

export default ProductInfo
