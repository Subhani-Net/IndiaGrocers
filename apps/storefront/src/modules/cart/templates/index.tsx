"use client"

import { useMemo, useCallback } from "react"
import { HttpTypes } from "@medusajs/types"
import { updateLineItem } from "@lib/data/cart"
import { InventoryMap } from "@lib/data/inventory"
import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import BasketProgressBar from "@modules/cart/components/basket-progress-bar"
import { MIN_ORDER_AMOUNT, FREE_DELIVERY_THRESHOLD } from "@lib/config/store-config"
import BulkUpgradeNudge, { detectBulkUpgrade } from "@modules/cart/components/bulk-upgrade-nudge"
import CategoryReminderStrip from "@modules/cart/components/category-reminder-strip"

const CartTemplate = ({
  cart,
  customer,
  inventoryMap,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  inventoryMap?: InventoryMap
}) => {
  const itemCount = cart?.items?.length ?? 0
  const itemTotal = cart?.item_total ?? 0

  // Bulk upgrade nudges
  const bulkNudges = useMemo(() => {
    if (!cart?.items) return []
    return detectBulkUpgrade(
      cart.items.map((item) => ({
        title: item.product_title || "",
        quantity: item.quantity,
        variant: {
          id: item.variant_id || "",
          title: item.variant?.title || "",
          metadata: (item.variant?.metadata || {}) as any,
          calculated_price: item.variant?.calculated_price as any,
        },
        product: {
          variants: item.variant?.product?.variants?.map((v) => ({
            id: v.id,
            title: v.title || "",
            metadata: (v.metadata || {}) as any,
            calculated_price: v.calculated_price as any,
          })),
        },
      }))
    )
  }, [cart?.items])

  const handleBulkSwitch = useCallback(
    async (lineItemIndex: number, newVariantId: string) => {
      const item = cart?.items?.[lineItemIndex]
      if (!item) return
      // Remove old item and add new variant
      try {
        await updateLineItem({ lineId: item.id, quantity: 0 })
        const { addToCart } = await import("@lib/data/cart")
        await addToCart({
          variantId: newVariantId,
          quantity: item.quantity,
          countryCode: "",
        })
        window.dispatchEvent(new Event("cart-updated"))
        window.location.reload()
      } catch {}
    },
    [cart?.items]
  )

  // Complete Your Basket — show when £30-£44.99
  const showCompleteBasket =
    itemTotal >= MIN_ORDER_AMOUNT && itemTotal < FREE_DELIVERY_THRESHOLD

  // Category reminder — cart categories already present
  const cartCategoryHandles = useMemo(() => {
    const handles = new Set<string>()
    for (const item of cart?.items || []) {
      const cat = item.variant?.product?.categories?.[0]?.handle
      if (cat) handles.add(cat)
    }
    return handles
  }, [cart?.items])

  // Common category suggestions for reminder strip
  const reminderCategories = useMemo(
    () => [
      { name: "Rice & Grains", handle: "grains" },
      { name: "Flour & Atta", handle: "flour-milk-powder" },
      { name: "Lentils & Dals", handle: "dried-lentils-beans-peas" },
      { name: "Oils & Ghee", handle: "ghee-oils" },
      { name: "Spices & Herbs", handle: "spices-herbs" },
      { name: "Spice Blends", handle: "spice-blends-mixes" },
      { name: "Teas & Drinks", handle: "teas-drinks" },
      { name: "Snacks", handle: "namkeen-lentil-snacks" },
      { name: "Pickles & Chutneys", handle: "chutneys-pickles-sauces" },
      { name: "Nuts & Seeds", handle: "nuts-seeds" },
    ],
    []
  )

  return (
    <div className="py-8 sm:py-12 bg-stone-50 min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {itemCount > 0 ? (
          <>
            {/* Page header with progress bar */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-4">
                Your Basket{" "}
                <span className="text-stone-400 text-lg font-normal">
                  ({itemCount} item{itemCount !== 1 ? "s" : ""})
                </span>
              </h1>

              {/* Full-width progress bar */}
              <BasketProgressBar
                itemTotal={itemTotal}
                itemCount={itemCount}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-x-10 gap-y-6">
              {/* Left: Cart items */}
              <div className="flex flex-col gap-y-6">
                {!customer && (
                  <>
                    <SignInPrompt />
                    <Divider />
                  </>
                )}

                {/* Bulk upgrade nudges */}
                {bulkNudges.map((nudge, i) => (
                  <BulkUpgradeNudge
                    key={i}
                    productTitle={nudge.productTitle}
                    currentWeight={nudge.currentWeight}
                    currentQty={nudge.currentQty}
                    currentPricePerUnit={nudge.currentPricePerUnit}
                    upgradeWeight={nudge.upgradeWeight}
                    upgradeVariantId={nudge.upgradeVariantId}
                    upgradePrice={nudge.upgradePrice}
                    upgradePricePerUnit={nudge.upgradePricePerUnit}
                    savingsPercent={nudge.savingsPercent}
                    onSwitch={(variantId) =>
                      handleBulkSwitch(nudge.lineItemIndex, variantId)
                    }
                    onDismiss={() => {}}
                  />
                ))}

                <ItemsTemplate cart={cart ?? undefined} inventoryMap={inventoryMap} />

                {/* Category Reminder Strip */}
                <CategoryReminderStrip
                  categories={reminderCategories}
                  cartCategoryHandles={cartCategoryHandles}
                  show={!!customer && itemCount > 0}
                />
              </div>

              {/* Right: Summary */}
              <div className="relative">
                <div className="flex flex-col gap-y-6 sticky top-24">
                  {cart && cart.region && (
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
                      <Summary cart={cart as any} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <EmptyCartMessage />
        )}
      </div>
    </div>
  )
}

export default CartTemplate
