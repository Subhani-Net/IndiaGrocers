/**
 * Category → emoji mappings for navigation, category grid, and search.
 * Shared across all components. Uses design-matched category names.
 */

export const categoryEmojis: Record<string, string> = {
  // Phase 1 — Launch
  "Staples & Grains": "🌾", "Basmati Rice": "🌾", "Sona Masoori Rice": "🌾", "Idli Rice": "🍚", "Brown Rice": "🌾",
  "Atta & Flours": "🫓", "Chapatti Flour (Atta)": "🫓", "Besan (Gram Flour)": "🫓",
  "Dal & Lentils": "🫘", "Toor Dal": "🫘", "Moong Dal (Yellow)": "🫘", "Chana Dal": "🫘", "Masoor Dal (Red Lentils)": "🫘", "Rajma (Kidney Beans)": "🫘",
  "Oils & Ghee": "🫒", "Sunflower Oil": "🫒", "Mustard Oil": "🫒", "Ghee (Clarified Butter)": "🫒",
  "Spices — Whole": "🌿", "Cumin Seeds (Jeera)": "🌿", "Mustard Seeds (Rai)": "🌿", "Green Cardamom (Elaichi)": "🌿",
  "Spices — Ground": "🌶️", "Turmeric Powder (Haldi)": "🌶️", "Red Chilli Powder (Mirchi)": "🌶️",
  "Spice Blends": "🍛", "Garam Masala": "🍛", "Chicken Masala": "🍛", "Biryani Masala": "🍛",
  "Dairy & Eggs": "🥛", "Paneer": "🧀",
  "Beverages": "☕", "Loose Leaf Tea / Chai": "☕",
  "Snacks & Namkeen": "🍿", "Bhujia": "🍿",
  "Pickles & Chutneys": "🥒", "Mango Pickle (Achar)": "🥒",
  // Phase 2
  "Frozen Foods": "❄️",
  "Fresh Produce": "🥬",
  "Ready-to-Cook & Instant Mixes": "🥘",
  "Condiments & Cooking Essentials": "🧂",
  // Phase 3
  "Pooja Essentials": "🪔",
  "Household & Kitchen": "🍳",
  "Regional Specialties": "🌏", "Punjabi / North Indian": "🫓", "Gujarati": "🧆", "South Indian": "🥥", "Bengali": "🐟",
}

/**
 * Returns the emoji for a category name, or a fallback.
 */
export function getCategoryEmoji(name: string): string {
  return categoryEmojis[name] || "🛍️"
}
