"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react"

export interface PantryItem {
  productId: string
  title: string
  handle: string
  variantId: string
  weight: string
  price: number
  thumbnail?: string
  status: "stocked" | "running-low"
  addedAt: string
  lastOrderedAt?: string
}

interface PantryContextType {
  items: PantryItem[]
  addItem: (item: Omit<PantryItem, "status" | "addedAt">) => void
  removeItem: (productId: string) => void
  toggleRunningLow: (productId: string) => void
  isInPantry: (productId: string) => boolean
  runningLow: PantryItem[]
  stocked: PantryItem[]
}

const PantryContext = createContext<PantryContextType | null>(null)

const STORAGE_KEY = "indiagrocers_pantry"

function loadPantry(): PantryItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function savePantry(items: PantryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new Event("pantry-updated"))
  } catch {}
}

export function PantryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PantryItem[]>([])

  useEffect(() => {
    setItems(loadPantry())
  }, [])

  const addItem = useCallback(
    (item: Omit<PantryItem, "status" | "addedAt">) => {
      setItems((prev) => {
        if (prev.some((i) => i.productId === item.productId)) return prev
        const next = [
          ...prev,
          { ...item, status: "stocked" as const, addedAt: new Date().toISOString() },
        ]
        savePantry(next)
        return next
      })
    },
    []
  )

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.productId !== productId)
      savePantry(next)
      return next
    })
  }, [])

  const toggleRunningLow = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.map((i) =>
        i.productId === productId
          ? {
              ...i,
              status:
                i.status === "running-low"
                  ? ("stocked" as const)
                  : ("running-low" as const),
            }
          : i
      )
      savePantry(next)
      return next
    })
  }, [])

  const isInPantry = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items]
  )

  const runningLow = items.filter((i) => i.status === "running-low")
  const stocked = items.filter((i) => i.status !== "running-low")

  return (
    <PantryContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        toggleRunningLow,
        isInPantry,
        runningLow,
        stocked,
      }}
    >
      {children}
    </PantryContext.Provider>
  )
}

export function usePantry() {
  const ctx = useContext(PantryContext)
  if (!ctx) throw new Error("usePantry must be used within PantryProvider")
  return ctx
}
