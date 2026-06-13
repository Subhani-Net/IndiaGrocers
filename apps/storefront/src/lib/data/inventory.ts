"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "./cookies"

/**
 * Single source of truth for inventory availability.
 *
 * DESIGN:
 *   - Inventory is a separate data concern from product identity.
 *   - Products: ISR 60s (identity — changes rarely).
 *   - Inventory: ISR 10s (stock — volatile, 10s stale window acceptable).
 *   - After order placement, inventory is correct within 10s at worst.
 *   - All UI components read from this function — never from variant.inventory_quantity.
 */
export type InventoryMap = Record<string, { availability: number | null }>

export async function getBulkInventory(
  variantIds: string[]
): Promise<InventoryMap> {
  if (!variantIds.length) return {}

  try {
    const next = { ...(await getCacheOptions("inventory")) }
    const { inventory } = await sdk.client.fetch<{
      inventory: InventoryMap
    }>("/store/bulk-inventory", {
      method: "POST",
      body: { variant_ids: variantIds },
      headers: await getAuthHeaders(),
      next: Object.keys(next).length ? next : { revalidate: 10, tags: ["inventory"] },
    })
    return inventory ?? {}
  } catch (err: any) {
    console.warn(
      "[getBulkInventory] failed:",
      err?.message || err,
      `(${variantIds.length} variant ids)`
    )
    return {}
  }
}
