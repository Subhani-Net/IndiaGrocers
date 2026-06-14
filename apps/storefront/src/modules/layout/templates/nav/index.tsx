import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listCategories } from "@lib/data/categories"
import { retrieveCart } from "@lib/data/cart"
import { FREE_DELIVERY_BANNER } from "@lib/config/store-config"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import MobileMenu from "@modules/layout/components/mobile-menu"
import AllGroceriesPanel from "@modules/layout/components/all-groceries-panel"
import NavSearch from "@modules/layout/components/nav-search"
import type { NavCategory } from "@modules/layout/types"

const USE_NEW_MOBILE_MENU = true

async function fetchNavCategories(): Promise<NavCategory[]> {
  try {
    const allCategories = await listCategories()
    if (!allCategories?.length) return []

    const parents = allCategories.filter((c) => !c.parent_category_id)
    const children = allCategories.filter((c) => c.parent_category_id)
    const grandchildren = allCategories.filter(
      (c) => c.parent_category_id && children.some((ch) => ch.id === c.parent_category_id)
    )

    return parents
      .filter((p) => children.some((c) => c.parent_category_id === p.id))
      .map((p) => ({
        name: p.name,
        handle: p.handle,
        children: [
          // Injected "All [Category]" virtual L2 child
          {
            name: `All ${p.name}`,
            handle: p.handle,
            isVirtual: true,
            grandchildren: [],
          },
          ...children
            .filter((c) => c.parent_category_id === p.id)
            .map((c) => ({
              name: c.name,
              handle: c.handle,
              grandchildren: grandchildren
                .filter((g) => g.parent_category_id === c.id)
                .map((g) => ({ name: g.name, handle: g.handle })),
            })),
        ],
      }))
  } catch (err) {
    console.error("Failed to fetch categories for nav:", err)
    return []
  }
}

function AccountIcon() {
  return (
    <svg className="w-5 h-5 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  )
}

export default async function Nav({ customer }: { customer?: any }) {
  const [regions, locales, currentLocale, categories, cart] = await Promise.all([
    listRegions().catch((err) => {
      console.warn("[Nav] regions fetch failed:", err?.message || err)
      return [] as StoreRegion[]
    }),
    listLocales(),
    getLocale().catch(() => null),
    fetchNavCategories(),
    retrieveCart().catch(() => null),
  ])

  const totalItems =
    cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0

  const accountLink = customer ? (
    <LocalizedClientLink
      className="min-tap flex items-center gap-1.5 text-xs lg:text-sm text-grey-70 hover:text-brand-orange transition-colors rounded-xl px-2 py-1.5 hover:bg-brand-orange/5"
      href="/account"
    >
      <AccountIcon />
      <span className="hidden lg:inline font-medium">
        Hi, {customer.first_name}
      </span>
    </LocalizedClientLink>
  ) : (
    <LocalizedClientLink
      className="min-tap flex items-center gap-1.5 text-xs lg:text-sm text-grey-70 hover:text-brand-orange transition-colors rounded-xl px-2 py-1.5 hover:bg-brand-orange/5"
      href="/account"
    >
      <AccountIcon />
      <span className="hidden lg:inline font-medium">Account</span>
    </LocalizedClientLink>
  )

  return (
    <>
      {/* Free delivery banner — scrolls away */}
      <div className="bg-gradient-to-r from-brand-orange via-brand-orange-light to-brand-orange text-white text-center text-sm py-2 px-4 font-medium tracking-wide">
        {FREE_DELIVERY_BANNER}
      </div>

      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-white border-b border-grey-20/60">
        {/* ─── MOBILE: 2-row layout ─── */}
        <div className="lg:hidden">
          {/* Row 1: Hamburger | Logo (centered) | Account + Cart */}
          <div className="relative flex items-center justify-between h-14 px-4 sm:px-6">
            <div>
              {USE_NEW_MOBILE_MENU ? (
                <MobileMenu regions={regions} locales={locales} currentLocale={currentLocale} categories={categories} />
              ) : (
                <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} categories={categories} />
              )}
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
              <LocalizedClientLink href="/" className="pointer-events-auto text-xl font-bold text-brand-orange flex-shrink-0 tracking-tight">
                India<span className="text-grey-90">Grocers</span>
              </LocalizedClientLink>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {accountLink}
              {/* Mobile cart: plain link — navigates to /cart, no Popover dropdown */}
              <LocalizedClientLink
                className="min-tap relative flex items-center gap-1.5 text-grey-70 hover:text-brand-orange transition-colors rounded-xl px-2 py-1.5 hover:bg-brand-orange/5"
                href="/cart"
                data-testid="nav-mobile-cart-link"
              >
                <CartIcon />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-orange text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-0.5">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </LocalizedClientLink>
            </div>
          </div>
          {/* Row 2: Full-width search */}
          <div className="pb-2.5 px-4 sm:px-6">
            <NavSearch />
          </div>
        </div>

        {/* ─── DESKTOP: 1-row layout ─── */}
        <div className="hidden lg:flex content-container items-center h-16 gap-3">
          <div className="flex items-center gap-3 flex-shrink-0">
            <LocalizedClientLink href="/" className="text-2xl font-bold text-brand-orange flex-shrink-0 tracking-tight">
              India<span className="text-grey-90">Grocers</span>
            </LocalizedClientLink>
            <AllGroceriesPanel categories={categories} />
          </div>
          <div className="flex-1 mx-4">
            <NavSearch />
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {accountLink}
            {/* Desktop cart: Popover dropdown (Suspense wrapped for streaming) */}
            <Suspense
              fallback={
                <LocalizedClientLink className="min-tap relative flex items-center gap-1.5 text-grey-70 hover:text-brand-orange transition-colors rounded-xl px-2 py-1.5 hover:bg-brand-orange/5" href="/cart">
                  <CartIcon />
                  <span className="hidden lg:inline text-sm font-medium">Cart</span>
                  <span className="absolute -top-0.5 -right-0.5 lg:static lg:ml-1 bg-brand-orange text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center">0</span>
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </div>
      </header>
    </>
  )
}
