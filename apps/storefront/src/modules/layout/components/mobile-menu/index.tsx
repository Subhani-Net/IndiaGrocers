"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { Text, clx, useToggleState } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { Locale } from "@lib/data/locales"
import type { NavCategory, NavChild } from "@modules/layout/types"

const StaticLinks = {
  Home: "/",
  Store: "/store",
  Account: "/account",
  Cart: "/cart",
} as const

type MobileMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
  categories: NavCategory[]
}

export default function MobileMenu({
  regions,
  locales,
  currentLocale,
  categories,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [depth, setDepth] = useState(0)
  const [selectedL1, setSelectedL1] = useState(0)
  const [selectedL2, setSelectedL2] = useState(0)
  const [animClass, setAnimClass] = useState("")
  const [viewKey, setViewKey] = useState(0)

  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()

  const selectedCategory = categories[selectedL1]
  const selectedChild: NavChild | undefined =
    selectedCategory?.children[selectedL2]

  const open = useCallback(() => {
    setIsOpen(true)
    setClosing(false)
  }, [])

  const close = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setClosing(false)
      setDepth(0)
      setSelectedL1(0)
      setSelectedL2(0)
    }, 200)
  }, [])

  const navigateToL2 = useCallback(
    (l1Index: number) => {
      setSelectedL1(l1Index)
      setSelectedL2(0)
      setAnimClass("animate-drawer-push-forward")
      setViewKey((k) => k + 1)
      setDepth(1)
    },
    []
  )

  const navigateToL3 = useCallback(
    (l2Index: number) => {
      setSelectedL2(l2Index)
      setAnimClass("animate-drawer-push-forward")
      setViewKey((k) => k + 1)
      setDepth(2)
    },
    []
  )

  const navigateBack = useCallback(() => {
    if (depth <= 0) {
      close()
      return
    }
    setAnimClass("animate-drawer-push-back")
    setViewKey((k) => k + 1)
    setDepth(depth - 1)
  }, [depth, close])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        {/* Hamburger trigger */}
        <button
          onClick={open}
          data-testid="nav-menu-button"
          aria-label="Open menu"
          aria-expanded={isOpen}
          className="relative h-full flex items-center transition-all ease-out duration-200 focus:outline-none hover:text-brand-orange px-1 press-scale"
        >
          <HamburgerIcon />
        </button>
      </div>

      {isOpen &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className={`fixed inset-0 z-[50] bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${
                closing ? "opacity-0" : "opacity-100"
              }`}
              onClick={close}
              aria-hidden="true"
            />

            {/* Drawer */}
            <div
              className={`mobile-drawer z-[51] ${
                closing
                  ? "animate-drawer-out"
                  : isOpen
                  ? "animate-drawer-in"
                  : ""
              }`}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              {/* Depth 0: Main Menu */}
              {depth === 0 && (
                <div key={viewKey} className={`flex flex-col h-full ${animClass}`}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-grey-20/60 flex-shrink-0">
                    <span className="font-bold text-lg text-grey-90">Menu</span>
                    <button
                      onClick={close}
                      aria-label="Close menu"
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-grey-10 transition-colors press-scale"
                    >
                      <XMark />
                    </button>
                  </div>

                  {/* Static nav links */}
                  <div className="px-2 py-3 flex-shrink-0">
                    <ul className="flex flex-col gap-0.5">
                      {Object.entries(StaticLinks).map(([name, href]) => (
                        <li key={name}>
                          <LocalizedClientLink
                            href={href}
                            className="drawer-row rounded-xl"
                            onClick={close}
                          >
                            {name}
                          </LocalizedClientLink>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Divider + Categories label */}
                  <div className="px-4 pt-2 pb-1 flex-shrink-0">
                    <p className="text-xs font-bold text-grey-40 uppercase tracking-wider">
                      Categories
                    </p>
                  </div>

                  {/* L1 Categories list */}
                  <div className="flex-1 overflow-y-auto px-2 pb-2">
                    <ul className="flex flex-col gap-0.5">
                      {categories.length === 0 ? (
                        <li className="drawer-row rounded-xl text-grey-40">
                          No categories available
                        </li>
                      ) : (
                        categories.map((cat, i) => (
                          <li key={cat.handle}>
                            <button
                              className="drawer-row w-full rounded-xl"
                              onClick={() => navigateToL2(i)}
                            >
                              <span>{cat.name}</span>
                              <ArrowRightMini className="text-grey-30 flex-shrink-0" />
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-grey-20/60 bg-grey-5/50 flex-shrink-0">
                    <div className="flex flex-col gap-y-3">
                      {!!locales?.length && (
                        <div
                          className="flex justify-between items-center"
                          onMouseEnter={languageToggleState.open}
                          onMouseLeave={languageToggleState.close}
                        >
                          <LanguageSelect
                            toggleState={languageToggleState}
                            locales={locales}
                            currentLocale={currentLocale}
                          />
                          <ArrowRightMini
                            className={clx(
                              "transition-transform duration-150 text-grey-40",
                              languageToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}
                      <div
                        className="flex justify-between items-center"
                        onMouseEnter={countryToggleState.open}
                        onMouseLeave={countryToggleState.close}
                      >
                        {regions && (
                          <CountrySelect
                            toggleState={countryToggleState}
                            regions={regions}
                          />
                        )}
                        <ArrowRightMini
                          className={clx(
                            "transition-transform duration-150 text-grey-40",
                            countryToggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                      <Text className="text-xs text-grey-40 pt-1">
                        &copy; {new Date().getFullYear()} IndiaGrocers London
                      </Text>
                    </div>
                  </div>
                </div>
              )}

              {/* Depth 1: L2 Subcategories */}
              {depth === 1 && selectedCategory && (
                <div key={viewKey} className={`flex flex-col h-full ${animClass}`}>
                  {/* Back + Title header */}
                  <div className="flex items-center gap-2 px-2 py-3 border-b border-grey-20/60 flex-shrink-0">
                    <button
                      onClick={navigateBack}
                      aria-label="Back to main menu"
                      className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-brand-orange hover:bg-brand-orange/5 rounded-xl transition-colors press-scale"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Back
                    </button>
                    <span className="text-sm font-semibold text-grey-80 truncate flex-1 pr-2">
                      {selectedCategory.name}
                    </span>
                  </div>

                  {/* L2 Categories list */}
                  <div className="flex-1 overflow-y-auto px-2 py-2">
                    <ul className="flex flex-col gap-0.5">
                      {selectedCategory.children.length === 0 ? (
                        <li className="drawer-row rounded-xl text-grey-40">
                          No subcategories
                        </li>
                      ) : (
                        selectedCategory.children.map((child, i) => {
                          // Injected "All [Category]" virtual child
                          if (child.isVirtual) {
                            return (
                              <li key={`all-${child.handle}`}>
                                <LocalizedClientLink
                                  href={`/categories/${child.handle}`}
                                  className="drawer-row rounded-xl !text-brand-orange font-semibold"
                                  onClick={close}
                                >
                                  {child.name}
                                </LocalizedClientLink>
                                {selectedCategory.children.length > 1 && (
                                  <div className="px-4 py-1">
                                    <div className="border-t border-grey-20/60" />
                                  </div>
                                )}
                              </li>
                            )
                          }

                          // Real L2 subcategory
                          return (
                            <li key={child.handle}>
                              {child.grandchildren.length > 0 ? (
                                <button
                                  className="drawer-row w-full rounded-xl"
                                  onClick={() => navigateToL3(i)}
                                >
                                  <span>{child.name}</span>
                                  <ArrowRightMini className="text-grey-30 flex-shrink-0" />
                                </button>
                              ) : (
                                <LocalizedClientLink
                                  href={`/categories/${child.handle}`}
                                  className="drawer-row rounded-xl"
                                  onClick={close}
                                >
                                  <span>{child.name}</span>
                                </LocalizedClientLink>
                              )}
                            </li>
                          )
                        })
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Depth 2: L3 Grandchildren */}
              {depth === 2 && selectedChild && (
                <div key={viewKey} className={`flex flex-col h-full ${animClass}`}>
                  {/* Back + Title header */}
                  <div className="flex items-center gap-2 px-2 py-3 border-b border-grey-20/60 flex-shrink-0">
                    <button
                      onClick={navigateBack}
                      aria-label={`Back to ${selectedCategory?.name || "categories"}`}
                      className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-brand-orange hover:bg-brand-orange/5 rounded-xl transition-colors press-scale"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Back
                    </button>
                    <span className="text-sm font-semibold text-grey-80 truncate flex-1 pr-2">
                      {selectedChild.name}
                    </span>
                  </div>

                  {/* L3 Grandchildren list */}
                  <div className="flex-1 overflow-y-auto px-2 py-2">
                    {selectedChild.grandchildren.length > 0 ? (
                      <ul className="flex flex-col gap-0.5">
                        {selectedChild.grandchildren.map((gc) => (
                          <li key={gc.handle}>
                            <LocalizedClientLink
                              href={`/categories/${gc.handle}`}
                              className="drawer-row rounded-xl"
                              onClick={close}
                            >
                              {gc.name}
                            </LocalizedClientLink>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
                        <p className="text-sm text-grey-40">
                          No further categories found
                        </p>
                        <LocalizedClientLink
                          href={`/categories/${selectedChild.handle}`}
                          className="text-sm font-medium text-brand-orange hover:text-brand-orange-dark transition-colors"
                          onClick={close}
                        >
                          View all in {selectedChild.name}
                        </LocalizedClientLink>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  )
}

function HamburgerIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  )
}
