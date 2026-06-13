import { Suspense } from "react"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import { FREE_DELIVERY_THRESHOLD_GBP } from "@lib/config/store-config"
import FeaturedProducts from "@modules/home/components/featured-products"
import HeroCarousel from "@modules/home/components/hero-carousel"
import CategoryGrid from "@modules/home/components/category-grid"
import Testimonials from "@modules/home/components/testimonials"
import WhatsAppFloat from "@modules/home/components/whatsapp-float"
import QuickReorderShelf from "@modules/home/components/quick-reorder-shelf"
import WeeklyShopCard from "@modules/home/components/weekly-shop-card"
import NewCustomerOnboarding from "@modules/home/components/new-customer-onboarding"

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const region = await getRegion(countryCode)
  const { collections } = await listCollections()

  if (!region) return null

  // Personalisation engine
  const customer = await retrieveCustomer().catch(() => null)
  const orders = await listOrders().catch(() => null)
  const isReturning = customer && orders && orders.length > 0
  const lastOrder = orders?.[0]

  return (
    <>
      <HeroCarousel />

      {/* === RETURNING CUSTOMER === */}
      {isReturning && (
        <>
          {/* Greeting + Weekly Shop Card */}
          <div className="py-8 bg-white">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
              <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
                  Welcome back, {customer?.first_name} 👋
                </h1>
                {lastOrder && (
                  <p className="text-sm text-stone-500 mt-1">
                    Your last shop was on{" "}
                    {new Date(lastOrder.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              <div className="max-w-lg">
                <WeeklyShopCard
                  lastOrderDate={lastOrder?.created_at?.toString()}
                  lastOrderItemCount={lastOrder?.items?.length}
                />
              </div>
            </div>
          </div>

          {/* Quick Reorder Shelf */}
          <div className="py-10 bg-stone-50">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
              <QuickReorderShelf />
            </div>
          </div>

          {/* Category Grid */}
          <Suspense
            fallback={
              <div className="py-8 px-6 bg-white">
                <div className="max-w-[1440px] mx-auto">
                  <div className="h-8 w-48 bg-stone-100 rounded animate-pulse mb-2" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-36 bg-stone-100 rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              </div>
            }
          >
            <CategoryGrid />
          </Suspense>
        </>
      )}

      {/* === NEW CUSTOMER / GUEST === */}
      {!isReturning && (
        <>
          {/* Welcome + Regional Preference */}
          <div className="py-8 bg-white">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
              {customer && (
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900 mb-6">
                  Welcome, {customer.first_name}! 👋
                </h1>
              )}
              <NewCustomerOnboarding />
            </div>
          </div>

          {/* Top Sellers */}
          <Suspense fallback={null}>
            <FeaturedProducts collections={collections} region={region} />
          </Suspense>

          {/* Category Grid */}
          <Suspense
            fallback={
              <div className="py-8 px-6 bg-stone-50">
                <div className="max-w-[1440px] mx-auto">
                  <div className="h-8 w-48 bg-stone-100 rounded animate-pulse mb-2" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-36 bg-stone-100 rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              </div>
            }
          >
            <CategoryGrid />
          </Suspense>
        </>
      )}

      {/* Everyone gets: Featured Products */}
      <div className="py-12 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-stone-900">
            Popular Products
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Best-selling Indian groceries loved by our customers
          </p>
        </div>
        {!isReturning ? null : (
          <Suspense fallback={null}>
            <FeaturedProducts collections={collections} region={region} />
          </Suspense>
        )}
      </div>

      {/* Everyone gets: Testimonials + Promo banners */}
      <Testimonials />
      <section className="py-16 px-6 bg-white">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { emoji: "🚚", title: "Free Delivery", desc: `On orders over ${FREE_DELIVERY_THRESHOLD_GBP}`, iconBg: "bg-brand-orange/10" },
            { emoji: "⚡", title: "Express Option", desc: "Next day delivery", iconBg: "bg-brand-saffron/10" },
            { emoji: "🥬", title: "Farm Fresh", desc: "Directly sourced", iconBg: "bg-brand-cardamom/10" },
            { emoji: "💝", title: "Best Price", desc: "Quality guaranteed", iconBg: "bg-brand-orange/10" },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 bg-stone-50 rounded-2xl p-5 border border-stone-200/40 hover:shadow-sm hover:border-stone-300/50 transition-all duration-200"
            >
              <span
                className={`w-14 h-14 rounded-xl ${item.iconBg} flex items-center justify-center text-2xl flex-shrink-0`}
              >
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
