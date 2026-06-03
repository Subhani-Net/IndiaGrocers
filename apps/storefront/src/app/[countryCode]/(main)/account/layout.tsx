import { retrieveCustomer } from "@lib/data/customer"
import { Toaster } from "@medusajs/ui"
import AccountLayout from "@modules/account/templates/account-layout"
import { PantryProvider } from "@lib/context/pantry-context"
import VerificationGate from "@modules/account/components/verification-gate"

export default async function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  // Show verification gate for newly registered unverified customers
  // Existing accounts without email_verified metadata are grandfathered in
  const requiresVerification =
    customer &&
    (customer as any).metadata?.email_verified === false

  return (
    <PantryProvider>
      <AccountLayout customer={customer}>
        {customer
          ? requiresVerification
            ? <VerificationGate />
            : dashboard
          : login}
        <Toaster />
      </AccountLayout>
    </PantryProvider>
  )
}
