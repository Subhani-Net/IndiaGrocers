// MeiliSearch client
export {
  meiliAdmin,
  meiliSearchClient,
  getProductsIndex,
  PRODUCTS_INDEX,
} from "./client"

// Synonym dictionary
export {
  SEARCH_SYNONYMS,
  buildMeiliSearchSynonyms,
  resolveSynonyms,
  getResolvedTerm,
} from "./search-synonyms"

export type { SynonymEntry } from "./search-synonyms"
