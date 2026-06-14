"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { Text, clx, useToggleState } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { Locale } from "@lib/data/locales"
import type { NavCategory, NavChild } from "@modules/layout/types"

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

  const utilityLinks = [
    { label: "About", href: "/about" },
    { label: "Delivery", href: "/delivery" },
    { label: "Contact", href: "/contact" },
  ]

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
              {/* ─── Depth 0: Main Menu ─── */}
              {depth === 0 && (
                <div key={viewKey} className={`flex flex-col h-full ${animClass}`}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-grey-20/60 flex-shrink-0">
                    <span className="font-bold text-base text-grey-90">
                      Shop by Category
                    </span>
                    <button
                      onClick={close}
                      aria-label="Close menu"
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-grey-10 transition-colors press-scale"
                    >
                      <XMark />
                    </button>
                  </div>

                  {/* L1 Categories list — high density, border separators */}
                  <div className="flex-1 overflow-y-auto">
                    {categories.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-grey-40">
                        No categories available
                      </div>
                    ) : (
                      <ul className="flex flex-col">
                        {categories.map((cat, i) => (
                          <li key={cat.handle}>
                            <button
                              className="flex items-center justify-between w-full py-2.5 px-3 text-sm font-medium text-grey-80 hover:text-brand-orange hover:bg-brand-orange/5 transition-colors border-b border-grey-20/40"
                              onClick={() => navigateToL2(i)}
                            >
                              <span>{cat.name}</span>
                              <ArrowRightMini className="text-grey-30 flex-shrink-0" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Footer — compact, utility links + controls */}
                  <div className="px-3 py-2 border-t border-grey-20/60 bg-grey-5/50 flex-shrink-0">
                    {/* Utility links */}
                    <div className="flex items-center gap-3 mb-2">
                      {utilityLinks.map((link) => (
                        <LocalizedClientLink
                          key={link.label}
                          href={link.href}
                          className="text-[11px] text-grey-40 hover:text-brand-orange transition-colors"
                          onClick={close}
                        >
                          {link.label}
                        </LocalizedClientLink>
                      ))}
                    </div>

                    {/* Language / Country selectors */}
                    <div className="flex items-center gap-3">
                      {!!locales?.length && (
                        <div
                          className="flex items-center gap-1"
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
                              "transition-transform duration-150 text-grey-40 w-3 h-3",
                              languageToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}
                      <div
                        className="flex items-center gap-1"
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
                            "transition-transform duration-150 text-grey-40 w-3 h-3",
                            countryToggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                    </div>
                    <Text className="text-[11px] text-grey-40 mt-1.5">
                      &copy; {new Date().getFullYear()} IndiaGrocers London
                    </Text>
                  </div>
                </div>
              )}

              {/* ─── Depth 1: L2 Subcategories ─── */}
              {depth === 1 && selectedCategory && (
                <div key={viewKey} className={`flex flex-col h-full ${animClass}`}>
                  {/* Back + Title + Close header */}
                  <div className="flex items-center gap-1 px-1.5 py-2 border-b border-grey-20/60 flex-shrink-0">
                    <button
                      onClick={navigateBack}
                      aria-label="Back to main menu"
                      className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-brand-orange hover:bg-brand-orange/5 rounded-lg transition-colors press-scale"
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
                    <span className="flex-1 text-sm font-semibold text-grey-80 truncate pr-1">
                      {selectedCategory.name}
                    </span>
                    <button
                      onClick={close}
                      aria-label="Close menu"
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-grey-10 transition-colors flex-shrink-0"
                    >
                      <XMark />
                    </button>
                  </div>

                  {/* L2 Categories list */}
                  <div className="flex-1 overflow-y-auto">
                    <ul className="flex flex-col">
                      {selectedCategory.children.length === 0 ? (
                        <li className="py-3 px-3 text-sm text-grey-40">
                          No subcategories
                        </li>
                      ) : (
                        selectedCategory.children.map((child, i) => {
                          if (child.isVirtual) {
                            return (
                              <li key={`all-${child.handle}`}>
                                <LocalizedClientLink
                                  href={`/categories/${child.handle}`}
                                  className="flex items-center py-2.5 px-3 text-sm font-semibold text-brand-orange hover:bg-brand-orange/5 transition-colors border-b border-grey-20/40"
                                  onClick={close}
                                >
                                  {child.name}
                                </LocalizedClientLink>
                              </li>
                            )
                          }
                          return (
                            <li key={child.handle}>
                              {child.grandchildren.length > 0 ? (
                                <button
                                  className="flex items-center justify-between w-full py-2.5 px-3 text-sm font-medium text-grey-70 hover:text-brand-orange hover:bg-brand-orange/5 transition-colors border-b border-grey-20/40"
                                  onClick={() => navigateToL3(i)}
                                >
                                  <span>{child.name}</span>
                                  <ArrowRightMini className="text-grey-30 flex-shrink-0" />
                                </button>
                              ) : (
                                <LocalizedClientLink
                                  href={`/categories/${child.handle}`}
                                  className="flex items-center py-2.5 px-3 text-sm font-medium text-grey-70 hover:text-brand-orange hover:bg-brand-orange/5 transition-colors border-b border-grey-20/40"
                                  onClick={close}
                                >
                                  {child.name}
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

              {/* ─── Depth 2: L3 Grandchildren ─── */}
              {depth === 2 && selectedChild && (
                <div key={viewKey} className={`flex flex-col h-full ${animClass}`}>
                  {/* Back + Title + Close header */}
                  <div className="flex items-center gap-1 px-1.5 py-2 border-b border-grey-20/60 flex-shrink-0">
                    <button
                      onClick={navigateBack}
                      aria-label={`Back to ${selectedCategory?.name || "categories"}`}
                      className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-brand-orange hover:bg-brand-orange/5 rounded-lg transition-colors press-scale"
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
                    <span className="flex-1 text-sm font-semibold text-grey-80 truncate pr-1">
                      {selectedChild.name}
                    </span>
                    <button
                      onClick={close}
                      aria-label="Close menu"
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-grey-10 transition-colors flex-shrink-0"
                    >
                      <XMark />
                    </button>
                  </div>

                  {/* L3 Grandchildren list */}
                  <div className="flex-1 overflow-y-auto">
                    {selectedChild.grandchildren.length > 0 ? (
                      <ul className="flex flex-col">
                        {selectedChild.grandchildren.map((gc) => (
                          <li key={gc.handle}>
                            <LocalizedClientLink
                              href={`/categories/${gc.handle}`}
                              className="flex items-center py-2.5 px-3 text-sm font-medium text-grey-70 hover:text-brand-orange hover:bg-brand-orange/5 transition-colors border-b border-grey-20/40"
                              onClick={close}
                            >
                              {gc.name}
                            </LocalizedClientLink>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-3">
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
