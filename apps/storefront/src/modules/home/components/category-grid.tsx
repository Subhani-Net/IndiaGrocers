import { listCategories } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { categoryEmojis } from "@modules/categories/templates"

const colorPalette = [
  "bg-green-100 text-green-700",
  "bg-amber-100 text-amber-700",
  "bg-orange-100 text-orange-700",
  "bg-red-100 text-red-700",
  "bg-yellow-100 text-yellow-700",
  "bg-stone-100 text-stone-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-lime-100 text-lime-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
]

export default async function CategoryGrid() {
  const allCategories = await listCategories()
  if (!allCategories?.length) {
    return (
      <section className="py-12 px-6">
        <div className="max-w-[1440px] mx-auto">
          <h2 className="section-title section-title-accent">Shop by Category</h2>
          <p className="section-subtitle">Categories are being set up. Check back soon.</p>
        </div>
      </section>
    )
  }

  const parents = allCategories.filter((c) => !c.parent_category_id)
  const children = allCategories.filter((c) => c.parent_category_id)

  const displayParents = parents
    .filter((p) => children.some((c) => c.parent_category_id === p.id))
    .slice(0, 12)

  if (!displayParents.length) {
    return (
      <section className="py-12 px-6">
        <div className="max-w-[1440px] mx-auto">
          <h2 className="section-title section-title-accent">Shop by Category</h2>
          <p className="section-subtitle">Categories are being set up. Check back soon.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 px-6">
      <div className="max-w-[1440px] mx-auto">
        <h2 className="section-title section-title-accent">Shop by Category</h2>
        <p className="section-subtitle">Everything you need from your local Indian grocery store</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-8">
          {displayParents.map((cat, idx) => {
            const emoji = categoryEmojis[cat.name] || "🛍️"
            const color = colorPalette[idx % colorPalette.length]

            return (
              <LocalizedClientLink
                key={cat.id}
                href={`/categories/${cat.handle}`}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border border-grey-20 
                         hover:shadow-lg hover:-translate-y-1 transition-all duration-300 
                         bg-white group"
              >
                <span
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${color} 
                              group-hover:scale-110 transition-transform duration-300`}
                >
                  {emoji}
                </span>
                <span className="text-sm font-semibold text-grey-70 text-center leading-tight group-hover:text-brand-orange transition-colors">
                  {cat.name}
                </span>
              </LocalizedClientLink>
            )
          })}
        </div>
      </div>
    </section>
  )
}
