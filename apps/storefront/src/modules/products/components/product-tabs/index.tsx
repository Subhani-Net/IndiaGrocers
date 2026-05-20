"use client"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "Product Information",
      component: <ProductInfoTab product={product} />,
    },
    {
      label: "Allergens & Dietary",
      component: <AllergensTab product={product} />,
    },
    {
      label: "Shipping & Delivery",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const meta = (product: HttpTypes.StoreProduct, key: string) =>
  (product.metadata as Record<string, unknown>)?.[key] as string | undefined

const Section = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <div>
    <span className="font-semibold">{label}</span>
    <p>{children || "-"}</p>
  </div>
)

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  const ingredients = meta(product, "ingredients") || meta(product, "Ingredients")
  const storage = meta(product, "storage") || meta(product, "Storage")
  const cookingInstructions = meta(product, "cooking_instructions") || meta(product, "Cooking Instructions")

  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        <div className="flex flex-col gap-y-4">
          {ingredients ? (
            <Section label="Ingredients">{ingredients}</Section>
          ) : (
            <Section label="Product Type">
              {product.type?.value ?? "-"}
            </Section>
          )}
          <Section label="Country of Origin">
            {product.origin_country ?? "India"}
          </Section>
          <Section label="Net Weight">
            {product.weight ? `${product.weight}g` : "-"}
          </Section>
        </div>
        <div className="flex flex-col gap-y-4">
          {storage ? (
            <Section label="Storage">{storage}</Section>
          ) : (
            <Section label="Storage">
              Store in a cool, dry place. Keep sealed after opening.
            </Section>
          )}
          {cookingInstructions && (
            <Section label="Cooking Instructions">
              {cookingInstructions}
            </Section>
          )}
          {product.material && !ingredients && (
            <Section label="Description">{product.material}</Section>
          )}
        </div>
      </div>
    </div>
  )
}

const AllergensTab = ({ product }: ProductTabsProps) => {
  const allergens =
    meta(product, "allergens") || meta(product, "Allergens")
  const dietary =
    meta(product, "dietary") || meta(product, "Dietary")
  const suitableFor =
    meta(product, "suitable_for") || meta(product, "Suitable For")

  return (
    <div className="text-small-regular py-8">
      <div className="flex flex-col gap-y-6">
        {allergens ? (
          <div>
            <span className="font-semibold">Allergen Information</span>
            <p>{allergens}</p>
          </div>
        ) : (
          <div>
            <span className="font-semibold">Allergen Information</span>
            <p>
              Packed in a facility that handles nuts, gluten, dairy, and other
              allergens. For specific allergen information, please check the
              product packaging.
            </p>
          </div>
        )}
        <div className="border-t border-gray-100 pt-4">
          {dietary || suitableFor ? (
            <div className="flex flex-col gap-y-2">
              {dietary && (
                <Section label="Dietary Info">{dietary}</Section>
              )}
              {suitableFor && (
                <Section label="Suitable For">{suitableFor}</Section>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <span className="inline-block bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full">
                Vegetarian
              </span>
              <span className="inline-block bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-full">
                No Artificial Colours
              </span>
              <span className="inline-block bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-full">
                No Artificial Preservatives
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-6">
        <div className="flex items-start gap-x-3">
          <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg
              className="w-5 h-5 text-brand-orange"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          </div>
          <div>
            <span className="font-semibold block">
              Standard Delivery - pound 3.99
            </span>
            <p className="max-w-sm text-ui-fg-subtle">
              Delivered in 3-5 business days. Free delivery on orders over pound 40.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-x-3">
          <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg
              className="w-5 h-5 text-brand-orange"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <span className="font-semibold block">
              Express Delivery - pound 6.99
            </span>
            <p className="max-w-sm text-ui-fg-subtle">
              Next-day delivery when you order before 2pm. Available for most
              London postcodes.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-start gap-x-3">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <span className="font-semibold block">Freshness Guarantee</span>
              <p className="max-w-sm text-ui-fg-subtle">
                We take pride in sourcing the freshest Indian groceries. If you
                are not satisfied with the quality, contact us within 24 hours
                and we will make it right.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-start gap-x-3">
            <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div>
              <span className="font-semibold block">Returns Policy</span>
              <p className="max-w-sm text-ui-fg-subtle">
                Due to the nature of food products, we can only accept returns
                for items that arrive damaged, incorrect, or past their
                best-before date. Please inspect your delivery upon arrival and
                report any issues within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
