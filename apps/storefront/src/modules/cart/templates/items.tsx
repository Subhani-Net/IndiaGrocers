import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table } from "@medusajs/ui"
import { InventoryMap } from "@lib/data/inventory"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
  inventoryMap?: InventoryMap
}

const isOOS = (item: HttpTypes.StoreCartLineItem, inventoryMap?: InventoryMap) => {
  if (!item.variant?.manage_inventory || !item.variant_id) return false
  const availability = inventoryMap?.[item.variant_id]?.availability
  if (availability == null) return false
  return availability <= 0
}

const ItemsTemplate = ({ cart, inventoryMap }: ItemsTemplateProps) => {
  const items = cart?.items
  return (
    <div>
      <div className="pb-3 flex items-center">
        <Heading className="text-[2rem] leading-[2.75rem]">Cart</Heading>
      </div>

      {items && items.length > 0 ? (
        <>
          {/* OOS items pulled to top with alert */}
          {items.some((item) => isOOS(item, inventoryMap)) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
              Some items in your cart are currently out of stock. They will be removed before checkout.
            </div>
          )}

          {/* Categorised display */}
          {(() => {
            const grouped: Record<string, HttpTypes.StoreCartLineItem[]> = {}
            const oosItems: HttpTypes.StoreCartLineItem[] = []
            const inStockItems: HttpTypes.StoreCartLineItem[] = []

            for (const item of items.sort((a, b) => (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1)) {
              const itemIsOOS = isOOS(item, inventoryMap)
              if (itemIsOOS) { oosItems.push(item) }
              else {
                const cat = item.variant?.product?.categories?.[0]?.name || "Other"
                if (!grouped[cat]) grouped[cat] = []
                grouped[cat].push(item)
              }
            }

            return (
              <>
                {oosItems.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-red-600 mb-3 bg-red-50 px-3 py-1.5 rounded-lg inline-block">
                      Out of Stock ({oosItems.length})
                    </h3>
                    <Table>
                      <Table.Body>
                        {oosItems.map((item) => (
                          <Item key={item.id} item={item} currencyCode={cart?.currency_code} inventoryMap={inventoryMap} />
                        ))}
                      </Table.Body>
                    </Table>
                  </div>
                )}

                {Object.entries(grouped).map(([category, catItems]) => (
                  <div key={category} className="mb-6">
                    <h3 className="text-sm font-bold text-grey-60 mb-3 bg-grey-10 px-3 py-1.5 rounded-lg inline-block">
                      {category} ({catItems.length})
                    </h3>
                    <Table>
                      <Table.Header className="border-t-0">
                        <Table.Row className="text-ui-fg-subtle txt-medium-plus">
                          <Table.HeaderCell className="!pl-0">Item</Table.HeaderCell>
                          <Table.HeaderCell></Table.HeaderCell>
                          <Table.HeaderCell>Quantity</Table.HeaderCell>
                          <Table.HeaderCell className="hidden small:table-cell">Price</Table.HeaderCell>
                          <Table.HeaderCell className="!pr-0 text-right">Total</Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {catItems.map((item) => (
                          <Item key={item.id} item={item} currencyCode={cart?.currency_code} inventoryMap={inventoryMap} />
                        ))}
                      </Table.Body>
                    </Table>
                  </div>
                ))}
              </>
            )
          })()}
        </>
      ) : (
        <Table>
          <Table.Body>
            {repeat(5).map((i) => (
              <SkeletonLineItem key={i} />
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  )
}

export default ItemsTemplate
