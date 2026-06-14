"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react"
import { HttpTypes } from "@medusajs/types"

// ─── Types ───

interface LayoverContextValue {
  openProduct: HttpTypes.StoreProduct | null
  openLayover: (product: HttpTypes.StoreProduct) => void
  closeLayover: () => void
}

const LayoverContext = createContext<LayoverContextValue | null>(null)

// ─── Hook ───

export function useLayover() {
  const ctx = useContext(LayoverContext)
  if (!ctx) throw new Error("useLayover must be used within LayoverProvider")
  return ctx
}

// ─── Provider ───

export function LayoverProvider({
  children,
  countryCode,
}: {
  children: React.ReactNode
  countryCode: string
}) {
  const [openProduct, setOpenProduct] =
    useState<HttpTypes.StoreProduct | null>(null)

  const openLayover = useCallback((product: HttpTypes.StoreProduct) => {
    setOpenProduct(product)
    document.body.style.overflow = "hidden"
  }, [])

  const closeLayover = useCallback(() => {
    setOpenProduct(null)
    document.body.style.overflow = ""
  }, [])

  return (
    <LayoverContext.Provider
      value={{ openProduct, openLayover, closeLayover }}
    >
      {children}
    </LayoverContext.Provider>
  )
}
