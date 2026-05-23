import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const itemCount = cart?.items?.length ?? 0

  return (
    <div className="py-12">
      <div className="content-container" data-testid="cart-container">
        {itemCount > 0 ? (
          <>
            <h1 className="text-3xl font-bold mb-8">
              Shopping Cart{" "}
              <span className="text-ui-fg-subtle text-lg font-normal">
                ({itemCount} item{itemCount !== 1 ? "s" : ""})
              </span>
            </h1>
            <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-12">
              <div className="flex flex-col bg-white py-6 gap-y-6">
                {!customer && (
                  <>
                    <SignInPrompt />
                    <Divider />
                  </>
                )}
                <ItemsTemplate cart={cart ?? undefined} />
              </div>
              <div className="relative">
                <div className="flex flex-col gap-y-8 sticky top-12">
                  {cart && cart.region && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                      <Summary cart={cart as any} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
