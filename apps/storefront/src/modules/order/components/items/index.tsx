import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Table } from "@medusajs/ui"

import Item from "@modules/order/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsProps = {
  order: HttpTypes.StoreOrder
}

const Items = ({ order }: ItemsProps) => {
  const items = order.items

  return (
    <div className="flex flex-col">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell className="!pl-0 text-gray-500 text-xs uppercase tracking-wider">
              Item
            </Table.HeaderCell>
            <Table.HeaderCell className="text-gray-500 text-xs uppercase tracking-wider">
              Details
            </Table.HeaderCell>
            <Table.HeaderCell className="!pr-0 text-right text-gray-500 text-xs uppercase tracking-wider">
              Total
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body data-testid="products-table">
          {items?.length
            ? items
                .sort((a, b) => {
                  return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                })
                .map((item) => {
                  return (
                    <Item
                      key={item.id}
                      item={item}
                      currencyCode={order.currency_code}
                    />
                  )
                })
            : repeat(5).map((i) => {
                return <SkeletonLineItem key={i} />
              })}
        </Table.Body>
      </Table>
    </div>
  )
}

export default Items
