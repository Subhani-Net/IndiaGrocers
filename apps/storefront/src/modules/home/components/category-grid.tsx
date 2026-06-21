import { listCategories } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { categoryEmojis } from "@lib/constants/category-emojis"

export default async function CategoryGrid() {
  const allCategories = await listCategories()
  if (!allCategories?.length) {
    return (
      <section className="py-16 px-6 bg-grey-5">
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
    .slice(0, 12)

  if (!displayParents.length) {
    return (
      <section className="py-16 px-6 bg-grey-5">
        <div className="max-w-[1440px] mx-auto">
          <h2 className="section-title section-title-accent">Shop by Category</h2>
          <p className="section-subtitle">Categories are being set up. Check back soon.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-6 bg-grey-5">
      <div className="max-w-[1440px] mx-auto">
        <h2 className="section-title section-title-accent">Shop by Category</h2>
        <p className="section-subtitle">Everything you need from your local Indian grocery store</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-8">
          {displayParents.map((cat) => {
            const emoji = categoryEmojis[cat.name] || "🛍️"

            return (
              <LocalizedClientLink
                key={cat.id}
                href={`/categories/${cat.handle}`}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-stone-200/60
                         hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5
                         transition-all duration-300 bg-white group"
              >
                <span className="w-16 h-16 rounded-full flex items-center justify-center text-2xl bg-stone-50 text-brand-saffron group-hover:text-brand-orange group-hover:bg-brand-orange/10 group-hover:scale-110 transition-all duration-300">
                  {emoji}
                </span>
                <span className="text-sm font-semibold text-stone-700 text-center leading-tight group-hover:text-brand-orange transition-colors">
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
