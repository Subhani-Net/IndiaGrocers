import React from "react"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className="flex-1 bg-gray-50 min-h-screen" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-6xl mx-auto">
        {customer ? (
          <div className="grid grid-cols-1 small:grid-cols-[280px_1fr] gap-8 py-8">
            <div className="small:block">
              <AccountNav customer={customer} />
            </div>
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export default AccountLayout
