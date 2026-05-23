"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { Text, clx, useToggleState } from "@medusajs/ui"
import { Fragment } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"

const SideMenuItems = {
  Home: "/",
  Store: "/store",
  Account: "/account",
  Cart: "/cart",
}

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
  categories?: { name: string; handle: string; children: { name: string; handle: string }[] }[]
}

const SideMenu = ({ regions, locales, currentLocale, categories }: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="relative h-full flex items-center transition-all ease-out duration-200 focus:outline-none hover:text-brand-orange px-1 press-scale"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Popover.Button>
              </div>

              {open && (
                <div
                  className="fixed inset-0 z-[50] bg-black/0 pointer-events-auto"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              )}

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 -translate-x-4"
                enterTo="opacity-100 translate-x-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-x-0"
                leaveTo="opacity-0 -translate-x-4"
              >
                <PopoverPanel className="flex flex-col absolute w-full pr-4 sm:pr-0 sm:w-80 2xl:w-96 h-dvh z-[51] inset-y-0 left-0">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex flex-col h-full bg-white/95 backdrop-blur-2xl shadow-2xl border-r border-grey-20/80 overflow-y-auto"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-grey-20/60">
                      <span className="font-bold text-lg text-grey-90">Menu</span>
                      <button onClick={close} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-grey-10 transition-colors press-scale">
                        <XMark />
                      </button>
                    </div>

                    {/* Main nav links */}
                    <div className="flex-1 p-4">
                      <ul className="flex flex-col gap-0.5">
                        {Object.entries(SideMenuItems).map(([name, href]) => (
                          <li key={name}>
                            <LocalizedClientLink
                              href={href}
                              className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-grey-70 hover:text-brand-orange hover:bg-brand-orange/5 rounded-xl transition-colors"
                              onClick={close}
                            >
                              {name}
                            </LocalizedClientLink>
                          </li>
                        ))}
                      </ul>

                      {/* Categories with nested hierarchy */}
                      {categories && categories.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-grey-20/60">
                          <p className="text-xs font-bold text-grey-40 uppercase tracking-wider px-3 mb-2">Categories</p>
                          <ul className="flex flex-col gap-0.5">
                            {categories.map((cat) => (
                              <li key={cat.handle}>
                                <LocalizedClientLink
                                  href={`/categories/${cat.handle}`}
                                  className="block px-3 py-2.5 text-sm font-medium text-grey-70 hover:text-brand-orange hover:bg-brand-orange/5 rounded-xl transition-colors"
                                  onClick={close}
                                >
                                  {cat.name}
                                </LocalizedClientLink>
                                {cat.children.length > 0 && (
                                  <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-grey-20/60 pl-3">
                                    {cat.children.map((child) => (
                                      <LocalizedClientLink
                                        key={child.handle}
                                        href={`/categories/${child.handle}`}
                                        className="block px-3 py-1.5 text-xs text-grey-50 hover:text-brand-orange hover:bg-brand-orange/5 rounded-lg transition-colors"
                                        onClick={close}
                                      >
                                        {child.name}
                                      </LocalizedClientLink>
                                    ))}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Footer: language/country/legal */}
                    <div className="p-4 border-t border-grey-20/60 bg-grey-5/50">
                      <div className="flex flex-col gap-y-3">
                        {!!locales?.length && (
                          <div className="flex justify-between items-center" onMouseEnter={languageToggleState.open} onMouseLeave={languageToggleState.close}>
                            <LanguageSelect toggleState={languageToggleState} locales={locales} currentLocale={currentLocale} />
                            <ArrowRightMini className={clx("transition-transform duration-150 text-grey-40", languageToggleState.state ? "-rotate-90" : "")} />
                          </div>
                        )}
                        <div className="flex justify-between items-center" onMouseEnter={countryToggleState.open} onMouseLeave={countryToggleState.close}>
                          {regions && <CountrySelect toggleState={countryToggleState} regions={regions} />}
                          <ArrowRightMini className={clx("transition-transform duration-150 text-grey-40", countryToggleState.state ? "-rotate-90" : "")} />
                        </div>
                        <Text className="text-xs text-grey-40 pt-1">© {new Date().getFullYear()} IndiaGrocers London</Text>
                      </div>
                    </div>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
