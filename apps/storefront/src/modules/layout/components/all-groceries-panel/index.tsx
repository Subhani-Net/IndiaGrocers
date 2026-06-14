"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { NavCategory } from "@modules/layout/types"

interface AllGroceriesPanelProps {
  categories: NavCategory[]
}

export default function AllGroceriesPanel({
  categories,
}: AllGroceriesPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [panelTop, setPanelTop] = useState(0)

  const triggerRef = useRef<HTMLButtonElement>(null)

  const toggle = useCallback(() => {
    setIsOpen((v) => !v)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPanelTop(rect.bottom)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, close])

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
    <>
      <button
        ref={triggerRef}
        onClick={toggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        data-testid="nav-all-groceries-btn"
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-grey-70 hover:text-brand-orange border border-grey-20/80 rounded-xl hover:border-brand-orange/50 transition-all duration-200 bg-white/60 press-scale"
      >
        All Groceries
        <svg
          className={`w-3 h-3 mt-0.5 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <>
            {/* Dark backdrop over page content */}
            <div
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-fade-in"
              onClick={close}
              aria-hidden="true"
              data-testid="nav-all-groceries-backdrop"
            />

            {/* Unified all-categories grid panel */}
            <div
              className="fixed left-0 right-0 z-50 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] border-b border-grey-20/60 animate-fade-in"
              style={{ top: panelTop }}
              role="menu"
              aria-label="All grocery categories"
              data-testid="nav-all-groceries-panel"
            >
              <div className="content-container py-6 lg:py-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 lg:gap-x-8 gap-y-6 lg:gap-y-8">
                  {categories.map((cat) => (
                    <div key={cat.handle}>
                      {/* L1 Title */}
                      <LocalizedClientLink
                        href={`/categories/${cat.handle}`}
                        className="block text-sm font-bold text-grey-90 hover:text-brand-orange transition-colors mb-2 pb-2 border-b border-grey-20/40"
                        onClick={close}
                      >
                        {cat.name}
                      </LocalizedClientLink>

                      {/* Children: "All [Category]" + L2 subcategories */}
                      <ul className="flex flex-col gap-0.5">
                        {cat.children.map((child) => (
                          <li key={child.handle}>
                            <LocalizedClientLink
                              href={`/categories/${child.handle}`}
                              className={`block text-sm py-0.5 hover:text-brand-orange transition-colors ${
                                child.isVirtual
                                  ? "text-brand-orange font-semibold"
                                  : "text-grey-60 hover:text-brand-orange"
                              }`}
                              onClick={close}
                            >
                              {child.name}
                            </LocalizedClientLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  )
}
