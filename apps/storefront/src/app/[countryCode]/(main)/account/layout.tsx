import { retrieveCustomer } from "@lib/data/customer"
import { Toaster } from "@medusajs/ui"
import AccountLayout from "@modules/account/templates/account-layout"
import { PantryProvider } from "@lib/context/pantry-context"

export default async function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <PantryProvider>
      <AccountLayout customer={customer}>
        {customer ? dashboard : login}
        <Toaster />
      </AccountLayout>
    </PantryProvider>
  )
}
