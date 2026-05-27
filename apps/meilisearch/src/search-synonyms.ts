/**
 * Global search synonym dictionary — bidirectional.
 * Both keys AND values are searchable.
 *
 * These are GLOBAL — they apply to all products. Per-product alternate
 * names go in `metadata.synonyms[]` on the product record.
 */
export interface SynonymEntry {
  term: string
  synonyms: string[]
}

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
 * Builds a bidirectional MeiliSearch synonym map.
 * Format: { "term": ["syn1", "syn2"] }
 */
export function buildMeiliSearchSynonyms(): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const entry of SEARCH_SYNONYMS) {
    map[entry.term] = entry.synonyms
    for (const syn of entry.synonyms) {
      const others = [entry.term, ...entry.synonyms.filter((s) => s !== syn)]
      map[syn] = others
    }
  }
  return map
}

/**
 * Resolves a search query against the synonym dictionary.
 * Returns all equivalent terms including the original.
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

/**
 * If the query matches a synonym value, returns the canonical term.
 * Used for the "Showing results for '[resolved]'" notice.
 */
export function getResolvedTerm(query: string): string | null {
  const normalized = query.toLowerCase().trim()
  for (const entry of SEARCH_SYNONYMS) {
    if (entry.synonyms.some((s) => s.toLowerCase() === normalized)) {
      return entry.term
    }
  }
  return null
}
