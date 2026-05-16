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
      <Suspense fallback={<div className="py-12 px-6"><div className="max-w-[1440px] mx-auto"><div className="h-8 w-48 bg-grey-10 rounded animate-pulse mb-2" /><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-8">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 bg-grey-10 rounded-xl animate-pulse" />)}</div></div></div>}>
        <CategoryGrid />
      </Suspense>
      <div className="py-8 bg-gradient-to-b from-white to-grey-5">
        <div className="max-w-[1440px] mx-auto px-6">
          <h2 className="section-title section-title-accent">Popular Products</h2>
          <p className="section-subtitle">Best-selling Indian groceries loved by our customers</p>
        </div>
        <Suspense fallback={null}>
          <FeaturedProducts collections={collections} region={region} />
        </Suspense>
      </div>
      <Testimonials />
      {/* Promo banners */}
      <section className="py-12 px-6">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { emoji: "🚚", title: "Free Delivery", desc: "On orders over £40" },
            { emoji: "⚡", title: "Express Option", desc: "Next day delivery" },
            { emoji: "🥬", title: "Farm Fresh", desc: "Directly sourced" },
            { emoji: "💝", title: "Best Price", desc: "Quality guaranteed" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4 bg-white rounded-xl p-5 border border-grey-20">
              <span className="text-3xl">{item.emoji}</span>
              <div>
                <p className="font-semibold text-grey-90">{item.title}</p>
                <p className="text-sm text-grey-50">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <WhatsAppFloat />
    </>
  )
}
