"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"

interface MobileFilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function MobileFilterDrawer({
  isOpen,
  onClose,
  children,
}: MobileFilterDrawerProps) {
  const [closing, setClosing] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Mount only after isOpen to trigger entrance animation
  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      setClosing(false)
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setMounted(false)
      onClose()
    }, 200)
  }, [onClose])

  // Body scroll lock
  useEffect(() => {
    if (mounted) {
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mounted])

  // ESC key
  useEffect(() => {
    if (!mounted) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [mounted, handleClose])

  if (!mounted) return null

  return createPortal(
    <div className="sm:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${
          closing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`mobile-drawer z-[51] flex flex-col ${
          closing ? "animate-drawer-out" : "animate-drawer-in"
        }`}
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200/60 flex-shrink-0 bg-white">
          <h2 className="text-base font-bold text-stone-800">Filters</h2>
          <button
            onClick={handleClose}
            aria-label="Close filters"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
          >
            <svg
              className="w-5 h-5 text-stone-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
