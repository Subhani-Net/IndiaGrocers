"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { usePantry } from "@lib/context/pantry-context"

const TABS = [
  { key: "home", label: "Home", href: "/", icon: HomeIcon },
  { key: "search", label: "Search", href: "/search", icon: SearchIcon },
  { key: "browse", label: "Browse", href: "/store", icon: BrowseIcon },
  { key: "reorder", label: "Reorder", href: "/account/reorder", icon: ReorderIcon },
  { key: "account", label: "Account", href: "/account", icon: AccountIcon },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { runningLow } = usePantry()
  const [basketCount, setBasketCount] = useState(0)
  const [basketTotal, setBasketTotal] = useState(0)

  // Listen for cart updates
  useEffect(() => {
    const handler = () => {
      // The cart count is managed in the cart context — for now, listen to events
    }
    window.addEventListener("cart-updated", handler)
    return () => window.removeEventListener("cart-updated", handler)
  }, [])

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/gb" || pathname === "/"
    return pathname.includes(href)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <nav className="bg-white border-t border-stone-200 safe-area-bottom">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {TABS.map((tab) => {
            const active = isActive(tab.href)
            return (
              <LocalizedClientLink
                key={tab.key}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  active ? "text-brand-orange" : "text-stone-400"
                }`}
              >
                <div className="relative">
                  <tab.icon active={active} />
                  {tab.key === "reorder" && runningLow.length > 0 && (
                    <span className="absolute -top-1 -right-3 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {runningLow.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </LocalizedClientLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function BrowseIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )
}

function ReorderIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function AccountIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}
