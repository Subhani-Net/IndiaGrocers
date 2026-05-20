"use client"

const CACHE_PREFIX = "ig_cache_"
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export function cacheGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() - entry.timestamp > entry.ttl) {
      localStorage.removeItem(CACHE_PREFIX + key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

export function cacheSet<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  if (typeof window === "undefined") return
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl }
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
  } catch { /* storage full or unavailable */ }
}

export function cacheRemove(key: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(CACHE_PREFIX + key)
  } catch { }
}

// Recently viewed products
const RECENT_KEY = "recent_products"
const MAX_RECENT = 20

export function getRecentProducts(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + RECENT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function addRecentProduct(productId: string): void {
  if (typeof window === "undefined") return
  try {
    const recent = getRecentProducts()
    const filtered = recent.filter((id) => id !== productId)
    filtered.unshift(productId)
    const trimmed = filtered.slice(0, MAX_RECENT)
    localStorage.setItem(CACHE_PREFIX + RECENT_KEY, JSON.stringify(trimmed))
  } catch { }
}

// Cart persistence (backup in case server cart is lost)
const CART_KEY = "cart_backup"

export function getCachedCart(): any | null {
  return cacheGet(CART_KEY)
}

export function setCachedCart(cart: any): void {
  cacheSet(CART_KEY, cart, 24 * 60 * 60 * 1000) // 24 hours
}

export function clearCachedCart(): void {
  cacheRemove(CART_KEY)
}
