/**
 * Brand master list — source of truth for brand slugs used in product metadata.
 * US-01-04
 *
 * Used by:
 * - ProductMetadata validator (brand_slug field)
 * - Admin API GET /admin/reference/brands
 * - Storefront brand filter and brand page
 */

export interface Brand {
  slug: string
  name: string
  /** Category handles this brand primarily appears in */
  categories: string[]
}

export const BRANDS: Brand[] = [
  // Rice & Grains
  { slug: "india-gate", name: "India Gate", categories: ["staples-grains", "rice-grains"] },
  { slug: "daawat", name: "Daawat", categories: ["staples-grains", "rice-grains"] },
  { slug: "tilda", name: "Tilda", categories: ["staples-grains", "rice-grains"] },
  { slug: "kohinoor", name: "Kohinoor", categories: ["staples-grains", "rice-grains"] },
  { slug: "lal-qilla", name: "Lal Qilla", categories: ["staples-grains", "rice-grains"] },
  { slug: "elephant", name: "Elephant", categories: ["staples-grains", "atta-flours"] },

  // Atta & Flours
  { slug: "aashirvaad", name: "Aashirvaad", categories: ["atta-flours"] },
  { slug: "pillsbury", name: "Pillsbury", categories: ["atta-flours"] },
  { slug: "swad", name: "Swad", categories: ["atta-flours", "dal-lentils", "spice-blends"] },
  { slug: "double-horse", name: "Double Horse", categories: ["atta-flours", "dal-lentils"] },

  // Dals & Lentils
  { slug: "trs", name: "TRS", categories: ["dal-lentils", "spices-whole", "spices-ground", "atta-flours"] },
  { slug: "east-end", name: "East End", categories: ["dal-lentils", "spices-whole", "spices-ground"] },
  { slug: "heera", name: "Heera", categories: ["dal-lentils", "spices-ground", "oils-ghee"] },
  { slug: "natco", name: "Natco", categories: ["dal-lentils", "spices-ground", "snacks-namkeen", "pickles-chutneys"] },

  // Oils & Ghee
  { slug: "ktc", name: "KTC", categories: ["oils-ghee"] },
  { slug: "patanjali", name: "Patanjali", categories: ["oils-ghee", "atta-flours"] },
  { slug: "amul", name: "Amul", categories: ["oils-ghee", "dairy"] },

  // Spices
  { slug: "mdh", name: "MDH", categories: ["spices-ground", "spice-blends"] },
  { slug: "everest", name: "Everest", categories: ["spices-ground", "spice-blends"] },
  { slug: "shan", name: "Shan", categories: ["spice-blends"] },
  { slug: "mtr", name: "MTR", categories: ["spice-blends", "ready-to-cook", "beverages"] },
  { slug: "aachi", name: "Aachi", categories: ["spice-blends", "ready-to-cook"] },
  { slug: "vandevi", name: "Vandevi", categories: ["spices-whole", "spices-ground"] },

  // Snacks
  { slug: "haldirams", name: "Haldiram's", categories: ["snacks-namkeen"] },
  { slug: "jabsons", name: "Jabsons", categories: ["snacks-namkeen"] },
  { slug: "lijjat", name: "Lijjat", categories: ["snacks-namkeen"] },
  { slug: "bikaji", name: "Bikaji", categories: ["snacks-namkeen"] },
  { slug: "parle", name: "Parle", categories: ["snacks-namkeen"] },
  { slug: "britannia", name: "Britannia", categories: ["snacks-namkeen"] },
  { slug: "maggi", name: "Maggi", categories: ["snacks-namkeen", "condiments"] },

  // Beverages
  { slug: "wagh-bakri", name: "Wagh Bakri", categories: ["beverages"] },
  { slug: "brooke-bond", name: "Brooke Bond", categories: ["beverages"] },
  { slug: "tetley", name: "Tetley", categories: ["beverages"] },
  { slug: "tata-gold", name: "Tata Gold", categories: ["beverages"] },
  { slug: "wagh-bakri", name: "Wagh Bakri", categories: ["beverages"] },
  { slug: "horlicks", name: "Horlicks", categories: ["beverages"] },
  { slug: "bournvita", name: "Bournvita", categories: ["beverages"] },
  { slug: "girnar", name: "Girnar", categories: ["beverages"] },
  { slug: "hamdard", name: "Hamdard", categories: ["beverages"] },
  { slug: "dabur", name: "Dabur", categories: ["beverages", "condiments"] },
  { slug: "glucon-d", name: "Glucon-D", categories: ["beverages"] },
  { slug: "maaza", name: "Maaza", categories: ["beverages"] },
  { slug: "frooti", name: "Frooti", categories: ["beverages"] },
  { slug: "falak", name: "Falak", categories: ["staples-grains"] },

  // Pickles & Chutneys
  { slug: "priya", name: "Priya", categories: ["pickles-chutneys"] },
  { slug: "mothers-recipe", name: "Mother's Recipe", categories: ["pickles-chutneys", "ready-to-cook"] },
  { slug: "pataks", name: "Patak's", categories: ["pickles-chutneys", "spice-blends"] },
  { slug: "nilons", name: "Nilon's", categories: ["pickles-chutneys"] },
  { slug: "bedekar", name: "Bedekar", categories: ["pickles-chutneys"] },

  // Ready to Cook / Instant
  { slug: "gits", name: "Gits", categories: ["ready-to-cook"] },
  { slug: "bambino", name: "Bambino", categories: ["ready-to-cook"] },
  // Fallback
  { slug: "generic", name: "Generic / Unbranded", categories: [] },
]

/** Slugs set — used for fast O(1) validation */
export const BRAND_SLUGS = new Set(BRANDS.map((b) => b.slug))
