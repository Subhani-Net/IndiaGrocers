import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listCategories } from "@lib/data/categories"
import { FREE_DELIVERY_BANNER } from "@lib/config/store-config"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import NavSearch from "@modules/layout/components/nav-search"

interface NavCategory {
  name: string
  handle: string
  children: { name: string; handle: string }[]
}

async function fetchNavCategories(): Promise<NavCategory[]> {
  try {
    const allCategories = await listCategories()
    if (!allCategories?.length) return []
    const parents = allCategories.filter((c) => !c.parent_category_id)
    const children = allCategories.filter((c) => c.parent_category_id)
    return parents
      .filter((p) => children.some((c) => c.parent_category_id === p.id))
      .map((p) => ({
        name: p.name,
        handle: p.handle,
        children: children
          .filter((c) => c.parent_category_id === p.id)
          .map((c) => ({ name: c.name, handle: c.handle })),
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

function ChevronDown() {
  return (
    <svg className="w-3 h-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default async function Nav({ customer }: { customer?: any }) {
  const [regions, locales, currentLocale, categories] = await Promise.all([
    listRegions().catch((err) => {
      console.warn("[Nav] regions fetch failed:", err?.message || err)
      return [] as StoreRegion[]
    }),
    listLocales(),
    getLocale().catch(() => null),
    fetchNavCategories(),
  ])

  return (
    <>
      <div className="bg-gradient-to-r from-brand-orange via-brand-orange-light to-brand-orange text-white text-center text-sm py-2 px-4 font-medium tracking-wide">
        {FREE_DELIVERY_BANNER}
      </div>

        <header className="z-50 bg-white border-b border-grey-20/60">
        <div className="content-container flex items-center justify-between h-14 lg:h-16 gap-3">
          {/* Mobile hamburger + Logo */}
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="lg:hidden">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} categories={categories} />
            </div>
            <LocalizedClientLink href="/" className="text-xl lg:text-2xl font-bold text-brand-orange flex-shrink-0 tracking-tight">
              India<span className="text-grey-90">Grocers</span>
            </LocalizedClientLink>
          </div>

          {/* Category dropdown + Search — desktop */}
          <div className="hidden lg:flex items-center gap-3 flex-1 max-w-xl mx-auto">
            <div className="nav-cat-group relative flex-shrink-0">
              <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-grey-70 hover:text-brand-orange border border-grey-20/80 rounded-xl hover:border-brand-orange/50 transition-all duration-200 bg-white/60 press-scale">
                Browse
                <ChevronDown />
              </button>
              <div className="mega-menu">
                <div className="p-2">
                  <LocalizedClientLink
                    href="/store"
                    className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-brand-orange hover:bg-brand-orange/10 rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    All Products
                  </LocalizedClientLink>
                  <div className="border-t border-grey-20/60 my-1" />
                  <div className="grid grid-cols-2 gap-1">
                    {categories.map((cat) => (
                      <div key={cat.handle}>
                        <LocalizedClientLink
                          href={`/categories/${cat.handle}`}
                          className="block px-3 py-2 text-sm font-medium text-grey-70 hover:text-brand-orange hover:bg-brand-orange/5 rounded-xl transition-colors"
                        >
                          {cat.name}
                        </LocalizedClientLink>
                        {cat.children.slice(0, 4).map((child) => (
                          <LocalizedClientLink
                            key={child.handle}
                            href={`/categories/${child.handle}`}
                            className="block px-3 py-1 text-xs text-grey-50 hover:text-brand-orange hover:bg-brand-orange/5 rounded-lg transition-colors ml-1"
                          >
                            {child.name}
                          </LocalizedClientLink>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <NavSearch />
          </div>

          {/* Right: Account + Cart */}
          <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
            {customer ? (
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
            )}
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

      {/* Category strip — desktop only, scrolls away */}
      <div className="hidden lg:block bg-white/60 backdrop-blur-sm border-b border-grey-20/40 overflow-visible">
        <div className="content-container">
          <div className="flex items-center gap-0.5 overflow-x-auto overflow-y-visible no-scrollbar">
            {categories.map((cat) => (
              <div key={cat.handle} className="nav-cat-group relative flex-shrink-0">
                <LocalizedClientLink
                  href={`/categories/${cat.handle}`}
                  className="flex items-center gap-1 px-3.5 py-2.5 text-sm font-medium text-grey-70 hover:text-brand-orange transition-colors rounded-lg hover:bg-brand-orange/5 whitespace-nowrap"
                >
                  {cat.name}
                  {cat.children.length > 0 && <ChevronDown />}
                </LocalizedClientLink>
                {cat.children.length > 0 && (
                  <div className="mega-menu">
                    <div className="p-2 min-w-[200px]">
                      {cat.children.map((child) => (
                        <LocalizedClientLink
                          key={child.handle}
                          href={`/categories/${cat.handle}`}
                          className="block px-3 py-2 text-sm text-grey-60 hover:text-brand-orange hover:bg-brand-orange/5 rounded-xl transition-colors"
                        >
                          {child.name}
                        </LocalizedClientLink>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          </div>
        </div>
    </>
  )
}
