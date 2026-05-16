import Link from "next/link"

const offers = [
  {
    title: "Under £5",
    description: "Everyday essentials under £5 — rice, spices, snacks and more",
    href: "/search?maxPrice=5",
    emoji: "💷",
  },
  {
    title: "Under £10",
    description: "Great value items under £10 — stock up your pantry",
    href: "/search?maxPrice=10",
    emoji: "💰",
  },
  {
    title: "Buy More Save More",
    description: "Bulk discounts on popular Indian grocery items",
    href: "/search",
    emoji: "🏷️",
  },
]

export default function OffersTemplate() {
  return (
    <div className="content-container py-12">
      <h1 className="text-3xl font-bold text-grey-90 mb-2">Special Offers</h1>
      <p className="text-grey-50 mb-8">
        Great deals on your favourite Indian groceries
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {offers.map((offer) => (
          <Link
            key={offer.title}
            href={offer.href}
            className="block p-6 rounded-xl border border-grey-20 hover:border-brand-orange hover:shadow-lg transition-all duration-200 group"
          >
            <span className="text-4xl">{offer.emoji}</span>
            <h2 className="text-xl font-bold text-grey-90 mt-4 group-hover:text-brand-orange transition-colors">
              {offer.title}
            </h2>
            <p className="text-grey-50 mt-2">{offer.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
