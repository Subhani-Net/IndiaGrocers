import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const Overview = ({ customer, orders }: OverviewProps) => {
  return (
    <div data-testid="overview-page-wrapper">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hello, {customer?.first_name}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Welcome to your IndiaGrocers account
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Signed in as</p>
            <p
              className="font-semibold text-gray-700"
              data-testid="customer-email"
              data-value={customer?.email}
            >
              {customer?.email}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Profile Completion */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Profile Completion</h3>
          <div className="flex items-end gap-3">
            <span
              className="text-4xl font-bold text-brand-orange"
              data-testid="customer-profile-completion"
              data-value={getProfileCompletion(customer)}
            >
              {getProfileCompletion(customer)}%
            </span>
            <span className="text-gray-500 text-sm mb-1">Completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className="bg-brand-orange rounded-full h-2 transition-all duration-500"
              style={{ width: `${getProfileCompletion(customer)}%` }}
            />
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Saved Addresses</h3>
          <div className="flex items-end gap-3">
            <span
              className="text-4xl font-bold text-brand-orange"
              data-testid="addresses-count"
              data-value={customer?.addresses?.length || 0}
            >
              {customer?.addresses?.length || 0}
            </span>
            <span className="text-gray-500 text-sm mb-1">Saved</span>
          </div>
          <LocalizedClientLink
            href="/account/addresses"
            className="text-brand-orange text-sm font-medium hover:underline mt-3 inline-block"
          >
            Manage addresses &rarr;
          </LocalizedClientLink>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Total Orders</h3>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-brand-orange">
              {orders?.length || 0}
            </span>
            <span className="text-gray-500 text-sm mb-1">Placed</span>
          </div>
          <LocalizedClientLink
            href="/account/orders"
            className="text-brand-orange text-sm font-medium hover:underline mt-3 inline-block"
          >
            View all orders &rarr;
          </LocalizedClientLink>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Orders</h3>
          <LocalizedClientLink
            href="/account/orders"
            className="text-brand-orange text-sm font-medium hover:underline"
          >
            View all
          </LocalizedClientLink>
        </div>
        <ul data-testid="orders-wrapper" className="space-y-3">
          {orders && orders.length > 0 ? (
            orders.slice(0, 5).map((order) => {
              const statusColor =
                order.fulfillment_status === "fulfilled"
                  ? "bg-brand-green text-white"
                  : order.fulfillment_status === "shipped"
                  ? "bg-blue-500 text-white"
                  : "bg-brand-orange text-white"

              return (
                <li
                  key={order.id}
                  data-testid="order-wrapper"
                  data-value={order.id}
                >
                  <LocalizedClientLink
                    href={`/account/orders/details/${order.id}`}
                  >
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:bg-orange-50 transition-colors duration-200">
                      <div className="grid grid-cols-3 gap-6 flex-1 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Date placed</p>
                          <p
                            className="font-medium text-gray-700"
                            data-testid="order-created-date"
                          >
                            {new Date(order.created_at).toDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Order number</p>
                          <p
                            className="font-medium text-gray-700"
                            data-testid="order-id"
                            data-value={order.display_id}
                          >
                            #{order.display_id}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Total amount</p>
                          <p
                            className="font-medium text-brand-orange"
                            data-testid="order-amount"
                          >
                            {convertToLocale({
                              amount: order.total,
                              currency_code: order.currency_code,
                            })}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}
                      >
                        {order.fulfillment_status?.replace("_", " ")}
                      </span>
                    </div>
                  </LocalizedClientLink>
                </li>
              )
            })
          ) : (
            <div className="text-center py-8" data-testid="no-orders-message">
              <p className="text-gray-500">No recent orders</p>
              <LocalizedClientLink href="/">
                <button className="btn-primary mt-4">Start Shopping</button>
              </LocalizedClientLink>
            </div>
          )}
        </ul>
      </div>
    </div>
  )
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  if (billingAddress) {
    count++
  }

  return (count / 4) * 100
}

export default Overview
