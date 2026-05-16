import { VariantPrice } from "types/global"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  return (
    <div className="flex items-baseline gap-1.5">
      {price.price_type === "sale" && (
        <span className="text-xs line-through text-grey-40" data-testid="original-price">
          {price.original_price}
        </span>
      )}
      <span
        className={`font-bold ${price.price_type === "sale" ? "text-brand-red" : "text-grey-90"}`}
        data-testid="price"
      >
        {price.calculated_price}
      </span>
    </div>
  )
}
