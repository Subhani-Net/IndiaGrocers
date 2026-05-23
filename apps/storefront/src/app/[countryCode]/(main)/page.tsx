import { Suspense } from "react"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import FeaturedProducts from "@modules/home/components/featured-products"
import HeroCarousel from "@modules/home/components/hero-carousel"
import CategoryGrid from "@modules/home/components/category-grid"
import Testimonials from "@modules/home/components/testimonials"
import WhatsAppFloat from "@modules/home/components/whatsapp-float"

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const region = await getRegion(countryCode)
  const { collections } = await listCollections()

  if (!region) {
    return null
  }

  return (
    <>
      <HeroCarousel />
      <Suspense fallback={<div className="py-12 px-6 bg-grey-5"><div className="max-w-[1440px] mx-auto"><div className="h-8 w-48 bg-stone-100 rounded animate-pulse mb-2" /><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-8">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 bg-stone-100 rounded-xl animate-pulse" />)}</div></div></div>}>
        <CategoryGrid />
      </Suspense>
      <div className="py-12 bg-white">
        <div className="max-w-[1440px] mx-auto px-6">
          <h2 className="section-title section-title-accent">Popular Products</h2>
          <p className="section-subtitle">Best-selling Indian groceries loved by our customers</p>
        </div>
        <Suspense fallback={null}>
          <FeaturedProducts collections={collections} region={region} />
        </Suspense>
      </div>
      <Testimonials />
      <section className="py-16 px-6 bg-white">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { emoji: "🚚", title: "Free Delivery", desc: "On orders over £40", iconBg: "bg-brand-orange/10" },
            { emoji: "⚡", title: "Express Option", desc: "Next day delivery", iconBg: "bg-brand-saffron/10" },
            { emoji: "🥬", title: "Farm Fresh", desc: "Directly sourced", iconBg: "bg-brand-cardamom/10" },
            { emoji: "💝", title: "Best Price", desc: "Quality guaranteed", iconBg: "bg-brand-orange/10" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4 bg-stone-50 rounded-2xl p-5 border border-stone-200/40 hover:shadow-sm hover:border-stone-300/50 transition-all duration-200">
              <span className={`w-14 h-14 rounded-xl ${item.iconBg} flex items-center justify-center text-2xl flex-shrink-0`}>
                {item.emoji}
              </span>
              <div>
                <p className="font-semibold text-stone-900">{item.title}</p>
                <p className="text-sm text-stone-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <WhatsAppFloat />
    </>
  )
}
