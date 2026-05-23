"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    cartState?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = cartState?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = () => {
    open()
    const timer = setTimeout(close, 5000)
    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }
    open()
  }

  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      timedOpen()
    }
  }, [totalItems, itemRef.current])

  return (
    <div
      className="h-full z-50"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <PopoverButton className="h-full">
          <div className="relative flex items-center gap-1.5 text-sm text-grey-70 hover:text-brand-orange transition-colors rounded-xl px-2 py-1.5 hover:bg-brand-orange/5 press-scale" data-testid="nav-cart-link">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="hidden lg:inline font-medium">Cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 lg:static lg:ml-1.5 bg-brand-orange text-white text-[10px] font-bold min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1 shadow-sm">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </div>
        </PopoverButton>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="hidden small:block absolute top-[calc(100%+1px)] right-0 bg-white/95 backdrop-blur-2xl border border-grey-20/80 shadow-[0_16px_48px_rgba(0,0,0,0.12)] rounded-2xl w-[420px] overflow-hidden"
            data-testid="nav-cart-dropdown"
          >
            <div className="p-4 flex items-center justify-center border-b border-grey-20/60">
              <h3 className="text-base font-bold text-grey-90">Shopping Bag</h3>
            </div>
            {cartState && cartState.items?.length ? (
              <>
                <div className="overflow-y-scroll max-h-[360px] px-4 grid grid-cols-1 gap-y-4 no-scrollbar p-px py-4">
                  {cartState.items
                    .sort((a, b) => {
                      return (a.created_at ?? "") > (b.created_at ?? "")
                        ? -1
                        : 1
                    })
                     .slice(0, 5)
                    .map((item) => (
                      <div
                        className="grid grid-cols-[80px_1fr] gap-x-3"
                        key={item.id}
                        data-testid="cart-item"
                      >
                        <LocalizedClientLink
                          href={`/products/${item.product_handle}`}
                          className="w-20 rounded-xl overflow-hidden border border-grey-10/60"
                        >
                          <Thumbnail
                            thumbnail={item.thumbnail}
                            images={item.variant?.product?.images}
                            size="square"
                          />
                        </LocalizedClientLink>
                        <div className="flex flex-col justify-between flex-1 min-w-0">
                          <div className="flex flex-col flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-col overflow-hidden min-w-0">
                                <h3 className="text-sm font-medium text-grey-90 truncate">
                                  <LocalizedClientLink
                                    href={`/products/${item.product_handle}`}
                                    data-testid="product-link"
                                  >
                                    {item.title}
                                  </LocalizedClientLink>
                                </h3>
                                <LineItemOptions
                                  variant={item.variant}
                                  data-testid="cart-item-variant"
                                  data-value={item.variant}
                                />
                                <span
                                  className="text-xs text-grey-50 mt-0.5"
                                  data-testid="cart-item-quantity"
                                  data-value={item.quantity}
                                >
                                  Qty: {item.quantity}
                                </span>
                              </div>
                              <div className="flex-shrink-0">
                                <LineItemPrice
                                  item={item}
                                  style="tight"
                                  currencyCode={cartState.currency_code}
                                />
                              </div>
                            </div>
                          </div>
                          <DeleteButton
                            id={item.id}
                            className="text-xs text-grey-40 hover:text-brand-red mt-0.5 transition-colors self-start"
                            data-testid="cart-item-remove-button"
                          >
                            Remove
                          </DeleteButton>
                        </div>
                      </div>
                    ))}
                  {cartState.items.length > 5 && (
                    <p className="text-xs text-grey-50 text-center border-t border-grey-10/60 pt-3">
                      +{cartState.items.length - 5} more item{cartState.items.length - 5 > 1 ? "s" : ""} in bag
                    </p>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-y-3 border-t border-grey-20/60">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-grey-70">
                      Subtotal
                    </span>
                    <span
                      className="text-base font-bold text-grey-90"
                      data-testid="cart-subtotal"
                      data-value={subtotal}
                    >
                      {convertToLocale({
                        amount: subtotal,
                        currency_code: cartState.currency_code,
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <LocalizedClientLink href="/cart" passHref>
                      <button className="w-full py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-xl hover:bg-brand-orange-dark active:scale-[0.97] transition-all duration-200" data-testid="go-to-cart-button">
                        View Cart
                      </button>
                    </LocalizedClientLink>
                    <LocalizedClientLink href="/checkout" passHref>
                      <button className="w-full py-2.5 bg-grey-90 text-white text-sm font-semibold rounded-xl hover:bg-grey-80 active:scale-[0.97] transition-all duration-200" data-testid="go-to-checkout-button">
                        Checkout
                      </button>
                    </LocalizedClientLink>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <div className="flex py-16 flex-col gap-y-4 items-center justify-center">
                  <svg className="w-12 h-12 text-grey-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span className="text-grey-50 text-sm">Your cart is empty</span>
                  <div>
                    <LocalizedClientLink href="/store">
                      <button className="btn-primary text-sm !py-2" onClick={close}>
                        Start Shopping
                      </button>
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
