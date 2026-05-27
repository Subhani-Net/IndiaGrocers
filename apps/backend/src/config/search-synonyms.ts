/**
 * Global search synonym dictionary — bidirectional.
 * Both keys AND values are searchable.
 *
 * Used by:
 * - MeiliSearch index configuration (US-01-07)
 * - Search query parser (US-05-02)
 * - Storefront autocomplete (US-05-01)
 *
 * Maintained in code but designed to be editable via admin UI (US-05-04)
 * using a JSON file that can be hot-reloaded.
 */

export interface SynonymEntry {
  /** Primary term (canonical) */
  term: string
  /** All equivalent terms including the primary */
  synonyms: string[]
}

/**
 * Primary synonym dictionary — 23 pairs covering core Indian grocery
 * transliterations (Hindi/Urdu/Tamil ↔ English).
 *
 * These are GLOBAL — they apply to all products. Per-product alternate
 * names go in `metadata.synonyms[]` on the product record.
 */
export const SEARCH_SYNONYMS: SynonymEntry[] = [
  { term: "besan", synonyms: ["chickpea flour", "gram flour", "chana flour"] },
  { term: "hing", synonyms: ["asafoetida", "heeng"] },
  { term: "sooji", synonyms: ["semolina", "rava", "suji", "cream of wheat"] },
  { term: "jeera", synonyms: ["cumin seeds", "cumin", "zeera"] },
  { term: "haldi", synonyms: ["turmeric", "turmeric powder"] },
  { term: "dhania", synonyms: ["coriander", "coriander powder", "dhana"] },
  { term: "methi", synonyms: ["fenugreek", "fenugreek leaves", "methi leaves"] },
  { term: "saunf", synonyms: ["fennel seeds", "fennel"] },
  { term: "ajwain", synonyms: ["carom seeds", "bishop's weed"] },
  { term: "imli", synonyms: ["tamarind"] },
  { term: "ghee", synonyms: ["clarified butter", "desi ghee"] },
  { term: "paneer", synonyms: ["indian cheese", "cottage cheese"] },
  { term: "arhar dal", synonyms: ["toor dal", "pigeon pea", "split pigeon peas"] },
  { term: "chana", synonyms: ["chickpeas", "garbanzo", "chole"] },
  { term: "mirchi", synonyms: ["chilli", "chili", "chilli powder", "red chilli"] },
  { term: "poha", synonyms: ["flattened rice", "beaten rice", "aval"] },
  { term: "panch phoron", synonyms: ["five spice bengali", "panch puran"] },
  { term: "namak", synonyms: ["salt"] },
  { term: "shakkar", synonyms: ["cane sugar", "unrefined sugar"] },
  { term: "mooli", synonyms: ["daikon", "white radish", "mouli"] },
  { term: "karela", synonyms: ["bitter melon", "bitter gourd"] },
  { term: "kadi patta", synonyms: ["curry leaves", "meetha neem"] },
  { term: "atta", synonyms: ["chapatti flour", "whole wheat flour", "chakki atta"] },
]

/**
 * Returns a flat bidirectional map suitable for MeiliSearch's synonym API.
 * MeiliSearch synonyms format: { "term": ["syn1", "syn2"] }
 */
export function buildMeiliSearchSynonyms(): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const entry of SEARCH_SYNONYMS) {
    // Key → all alternates
    map[entry.term] = entry.synonyms
    // Each alternate also maps to all others including key
    for (const syn of entry.synonyms) {
      const others = [entry.term, ...entry.synonyms.filter((s) => s !== syn)]
      map[syn] = others
    }
  }
  return map
}

/**
 * Merges per-product synonyms with the global dictionary and returns
 * all equivalent search terms for a given query.
 */
export function resolveSynonyms(query: string): string[] {
  const normalized = query.toLowerCase().trim()
  const results = new Set<string>([normalized])

  for (const entry of SEARCH_SYNONYMS) {
    const all = [entry.term, ...entry.synonyms]
    if (all.some((t) => t.toLowerCase() === normalized)) {
      for (const t of all) results.add(t)
    }
  }

  return [...results]
}
