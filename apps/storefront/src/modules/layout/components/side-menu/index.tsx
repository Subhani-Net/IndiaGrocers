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
                  className="relative h-full flex items-center transition-all ease-out duration-200 focus:outline-none hover:text-ui-fg-base"
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
                enter="transition ease-out duration-150"
                enterFrom="opacity-0"
                enterTo="opacity-100 backdrop-blur-2xl"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 backdrop-blur-2xl"
                leaveTo="opacity-0"
              >
                <PopoverPanel className="flex flex-col absolute w-full pr-4 sm:pr-0 sm:w-1/3 2xl:w-1/4 sm:min-w-min h-[calc(100vh-1rem)] z-[51] inset-x-0 m-2">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex flex-col h-full bg-white rounded-xl shadow-2xl border border-grey-20 overflow-y-auto"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-grey-20">
                      <span className="font-bold text-lg text-grey-90">Menu</span>
                      <button onClick={close} className="text-grey-40 hover:text-grey-70">
                        <XMark />
                      </button>
                    </div>
                    <div className="flex-1 p-4">
                      <ul className="flex flex-col gap-1">
                        {Object.entries(SideMenuItems).map(([name, href]) => (
                          <li key={name}>
                            <LocalizedClientLink
                              href={href}
                              className="block px-3 py-2.5 text-sm font-medium text-grey-70 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-colors"
                              onClick={close}
                            >
                              {name}
                            </LocalizedClientLink>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 pt-4 border-t border-grey-20">
                        <p className="text-xs font-semibold text-grey-40 uppercase tracking-wider px-3 mb-2">Categories</p>
                        <ul className="flex flex-col gap-1">
                          {categories?.map((cat) => (
                            <li key={cat.handle}>
                              <LocalizedClientLink
                                href={`/categories/${cat.handle}`}
                                className="block px-3 py-2 text-sm text-grey-70 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-colors"
                                onClick={close}
                              >
                                {cat.name}
                              </LocalizedClientLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="p-4 border-t border-grey-20">
                      <div className="flex flex-col gap-y-3">
                        {!!locales?.length && (
                          <div className="flex justify-between" onMouseEnter={languageToggleState.open} onMouseLeave={languageToggleState.close}>
                            <LanguageSelect toggleState={languageToggleState} locales={locales} currentLocale={currentLocale} />
                            <ArrowRightMini className={clx("transition-transform duration-150", languageToggleState.state ? "-rotate-90" : "")} />
                          </div>
                        )}
                        <div className="flex justify-between" onMouseEnter={countryToggleState.open} onMouseLeave={countryToggleState.close}>
                          {regions && <CountrySelect toggleState={countryToggleState} regions={regions} />}
                          <ArrowRightMini className={clx("transition-transform duration-150", countryToggleState.state ? "-rotate-90" : "")} />
                        </div>
                        <Text className="text-xs text-grey-40 pt-2">© {new Date().getFullYear()} IndiaGrocers London</Text>
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
