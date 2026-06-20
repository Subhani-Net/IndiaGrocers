/**
 * Category sync pipeline.
 * Creates/updates categories from CSV, respecting parent-child ordering.
 */
import { fetchCategories, createCategory, updateCategory } from "./api.mjs"

/**
 * Sync categories from CSV to Medusa DB.
 *
 * @param {Array<Record<string,string>>} csvRows — parsed categories.csv rows
 * @returns {Promise<{ catMap: Map<string, string>, created: number, updated: number }>}
 */
export async function syncCategories(csvRows) {
  // Sort: parents before children
  const sorted = [...csvRows].sort((a, b) => {
    const aParent = a.parent_handle && a.parent_handle.trim()
    const bParent = b.parent_handle && b.parent_handle.trim()
    if (!aParent && bParent) return -1
    if (aParent && !bParent) return 1
    return 0
  })

  // Fetch existing DB categories
  const dbCategories = await fetchCategories()
  const dbMap = new Map(dbCategories.map(c => [c.handle, c]))

  let created = 0, updated = 0

  for (const row of sorted) {
    const handle = row.handle.trim()
    const dbCat = dbMap.get(handle)

    if (!dbCat) {
      // ── CREATE ───────────────────────────────────────
      const body = {
        handle,
        name: row.name || handle,
        is_active: true,
      }
      if (row.parent_handle && row.parent_handle.trim()) {
        const parentId = dbMap.get(row.parent_handle)?.id
        if (parentId) body.parent_category_id = parentId
      }
      if (row.rank) body.rank = parseInt(row.rank, 10)
      if (row.description) body.description = row.description

      const res = await createCategory(body)
      if (res.ok) {
        const data = await res.json()
        const newCat = data.product_category
        if (newCat?.id) {
          dbMap.set(handle, { id: newCat.id, handle })
        }
        created++
      } else {
        console.error(`  ✗ Category create failed: ${handle} → ${res.status}`)
      }
    } else {
      // ── UPDATE ───────────────────────────────────────
      const changes = {}
      if (row.name && row.name !== dbCat.name) changes.name = row.name
      if (row.rank) {
        const r = parseInt(row.rank, 10)
        if (r !== dbCat.rank) changes.rank = r
      }
      if (row.description !== undefined && row.description !== (dbCat.description || "")) {
        changes.description = row.description
      }
      if (Object.keys(changes).length > 0) {
        await updateCategory(dbCat.id, changes)
        updated++
      }
    }
  }

  // Build catMap: handle → id
  const catMap = new Map()
  for (const [handle, cat] of dbMap) {
    if (cat.id) catMap.set(handle, cat.id)
  }

  return { catMap, created, updated }
}
