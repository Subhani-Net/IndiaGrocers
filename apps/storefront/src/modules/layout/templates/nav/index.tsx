import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listCategories } from "@lib/data/categories"
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
      .filter((p) =>
        children.some((c) => c.parent_category_id === p.id)
      )
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
    <div className="sticky top-0 inset-x-0 z-50">
      <div className="bg-brand-orange text-white text-center text-sm py-2 px-4 font-medium">
        FREE DELIVERY on orders over £40 | Order by 2pm for next day delivery
      </div>
      <header className="relative border-b bg-white border-grey-20">
        <nav className="content-container flex items-center justify-between h-16">
          <div className="flex items-center gap-4 lg:hidden">
            <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} categories={categories} />
          </div>
          <div className="flex items-center gap-8">
            <LocalizedClientLink
              href="/"
              className="text-2xl font-bold text-brand-orange"
              data-testid="nav-store-link"
            >
              IndiaGrocers
            </LocalizedClientLink>
            <div className="hidden lg:flex items-center">
              <NavSearch />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <LocalizedClientLink
              className="hidden small:flex items-center gap-2 text-sm text-grey-70 hover:text-brand-orange transition-colors"
              href="/account"
              data-testid="nav-account-link"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Account</span>
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
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
        </nav>
      </header>
      <div className="hidden lg:block bg-white border-b border-grey-20">
        <div className="content-container">
          <div className="flex items-center gap-1">
            {categories.map((cat) => (
              <div key={cat.handle} className="nav-cat-group relative">
                <LocalizedClientLink
                  href={`/categories/${cat.handle}`}
                  className="flex items-center gap-1 px-3 py-3 text-sm font-medium text-grey-70 hover:text-brand-orange transition-colors"
                >
                  {cat.name}
                  <svg className="w-3 h-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </LocalizedClientLink>
                {cat.children.length > 0 && (
                  <div className="mega-menu">
                    <div className="p-4">
                      <div className="flex flex-col gap-1">
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
    </div>
  )
}
