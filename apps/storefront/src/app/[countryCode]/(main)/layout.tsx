import { Metadata } from "next"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"
import PantryShell from "@modules/home/components/pantry-shell"
import { SearchProvider } from "@lib/context/search-context"
import { LayoverProvider } from "@lib/context/layover-context"
import SearchLayoutClient from "@modules/layout/components/search-layout-client"
import PdpLayoverShell from "@modules/layout/components/pdp-layover-shell"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

type Params = { params: Promise<{ countryCode: string }>; children: React.ReactNode }

export default async function PageLayout(props: Params) {
  const { countryCode } = await props.params
  const customer = await retrieveCustomer()
  const cart = await retrieveCart()
  let shippingOptions: StoreCartShippingOption[] = []

  if (cart) {
    try {
      const { shipping_options } = await listCartOptions()
      shippingOptions = shipping_options
    } catch (err: any) {
      console.warn("[layout] listCartOptions failed:", err?.message || err)
    }
  }

  return (
    <SearchProvider countryCode={countryCode}>
      <LayoverProvider countryCode={countryCode}>
        <Nav />
        {customer && cart && (
          <CartMismatchBanner customer={customer} cart={cart} />
        )}

        {cart && (
          <FreeShippingPriceNudge
            variant="popup"
            cart={cart}
            shippingOptions={shippingOptions}
          />
        )}
        <SearchLayoutClient>
          <PantryShell>{props.children}</PantryShell>
        </SearchLayoutClient>
        <Footer />
        <PdpLayoverShell countryCode={countryCode} />
      </LayoverProvider>
    </SearchProvider>
  )
}
