import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listCategories } from "@lib/data/categories"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import PostcodeCheckButton from "@modules/layout/components/postcode-check-button"

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

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
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

export default async function Nav() {
  const [regions, locales, currentLocale, categories] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
    fetchNavCategories(),
  ])

  return (
    <>
      <div className="bg-gradient-to-r from-brand-orange via-brand-orange-light to-brand-orange text-white text-center text-sm py-2 px-4 font-medium tracking-wide">
        FREE DELIVERY on orders over £40 &nbsp;·&nbsp; Order by 2pm for next day delivery
      </div>

      <header className="sticky top-0 z-50 glass border-b border-grey-20/60">
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

            <form className="flex-1 flex items-center" action="/gb/search" method="get">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-grey-40">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  name="q"
                  placeholder="Search rice, spices, dals..."
                  className="w-full h-10 pl-10 pr-4 text-sm bg-grey-5 border border-grey-20/80 rounded-xl text-grey-90 placeholder-grey-40 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all duration-200"
                />
              </div>
              <button type="submit" className="ml-2 min-w-[40px] h-10 flex items-center justify-center bg-brand-orange text-white rounded-xl hover:bg-brand-orange-dark active:scale-95 transition-all duration-200 press-scale">
                <SearchIcon />
              </button>
            </form>
          </div>

          {/* Right: Postcode + Account + Cart */}
          <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
            <div className="hidden sm:block">
              <PostcodeCheckButton />
            </div>
            <LocalizedClientLink
              className="min-tap flex items-center gap-1.5 text-xs lg:text-sm text-grey-70 hover:text-brand-orange transition-colors rounded-xl px-2 py-1.5 hover:bg-brand-orange/5"
              href="/account"
            >
              <AccountIcon />
              <span className="hidden lg:inline font-medium">Account</span>
            </LocalizedClientLink>
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
      <div className="hidden lg:block bg-white/60 backdrop-blur-sm border-b border-grey-20/40">
        <div className="content-container">
          <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
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
                          href={`/categories/${child.handle}`}
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
