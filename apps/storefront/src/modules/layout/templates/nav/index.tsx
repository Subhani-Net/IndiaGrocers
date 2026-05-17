import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listCategories } from "@lib/data/categories"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"

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

export default async function Nav() {
  const [regions, locales, currentLocale, categories] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
    fetchNavCategories(),
  ])

  return (
    <>
      <div className="bg-brand-orange text-white text-center text-sm py-1.5 px-4 font-medium">
        FREE DELIVERY on orders over £40 | Order by 2pm for next day delivery
      </div>

      <header className="sticky top-0 z-50 bg-white border-b border-grey-20">
        <div className="content-container flex items-center justify-between h-12 lg:h-14 gap-3">
          {/* Mobile hamburger + Logo */}
          <div className="flex items-center gap-2 lg:gap-0">
            <div className="lg:hidden">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} categories={categories} />
            </div>
            <LocalizedClientLink href="/" className="text-lg lg:text-xl font-bold text-brand-orange flex-shrink-0">
              IndiaGrocers
            </LocalizedClientLink>
          </div>

          {/* Category dropdown + Search — desktop */}
          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-2xl">
            <div className="nav-cat-group relative flex-shrink-0">
              <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-grey-70 hover:text-brand-orange border border-grey-20 rounded-lg hover:border-brand-orange transition-colors">
                Browse
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="mega-menu">
                <div className="p-3">
                  <div className="flex flex-col gap-0.5 min-w-[200px]">
                    <LocalizedClientLink href="/store" className="text-sm font-semibold text-brand-orange hover:bg-orange-50 px-2 py-1.5 rounded">
                      All Products
                    </LocalizedClientLink>
                    <div className="border-t border-grey-20 my-1" />
                    {categories.map((cat) => (
                      <div key={cat.handle}>
                        <LocalizedClientLink
                          href={`/categories/${cat.handle}`}
                          className="text-sm text-grey-70 hover:text-brand-orange hover:bg-orange-50 px-2 py-1.5 rounded block"
                        >
                          {cat.name}
                        </LocalizedClientLink>
                        {cat.children.map((child) => (
                          <LocalizedClientLink
                            key={child.handle}
                            href={`/categories/${child.handle}`}
                            className="text-xs text-grey-50 hover:text-brand-orange hover:bg-orange-50 pl-6 pr-2 py-1 rounded block"
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

            <form
              className="flex-1 flex items-center"
              action="/gb/search"
              method="get"
            >
              <input
                type="text"
                name="q"
                placeholder="Search products..."
                className="flex-1 border border-grey-20 rounded-l-lg py-1.5 px-3 text-sm text-grey-90 placeholder-grey-40 focus:outline-none focus:border-brand-orange"
              />
              <button type="submit" className="bg-brand-orange text-white px-3 py-1.5 rounded-r-lg hover:bg-brand-orange-dark transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Right: Account + Cart */}
          <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
            <LocalizedClientLink
              className="hidden sm:flex items-center gap-1.5 text-xs lg:text-sm text-grey-70 hover:text-brand-orange transition-colors"
              href="/account"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden lg:inline">Account</span>
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink className="hover:text-ui-fg-base flex gap-2" href="/cart">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  <span>Cart (0)</span>
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </div>
      </header>

      {/* Mega menu bar — scrolls away */}
      <div className="hidden lg:block bg-white border-b border-grey-20">
        <div className="content-container">
          <div className="flex items-center gap-1">
            {categories.map((cat) => (
              <div key={cat.handle} className="nav-cat-group relative">
                <LocalizedClientLink
                  href={`/categories/${cat.handle}`}
                  className="flex items-center gap-1 px-3 py-2.5 text-sm font-medium text-grey-70 hover:text-brand-orange transition-colors"
                >
                  {cat.name}
                  <svg className="w-3 h-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </LocalizedClientLink>
                {cat.children.length > 0 && (
                  <div className="mega-menu">
                    <div className="p-3">
                      <div className="flex flex-col gap-0.5">
                        {cat.children.map((child) => (
                          <LocalizedClientLink
                            key={child.handle}
                            href={`/categories/${child.handle}`}
                            className="text-sm text-grey-60 hover:text-brand-orange hover:bg-orange-50 px-2 py-1.5 rounded transition-colors"
                          >
                            {child.name}
                          </LocalizedClientLink>
                        ))}
                      </div>
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
