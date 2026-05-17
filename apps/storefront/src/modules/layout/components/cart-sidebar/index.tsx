import LocalizedClientLink from "@modules/common/components/localized-client-link"

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(amount / 100)
}

export default function CartSidebar({ countryCode }: { countryCode: string }) {
  return (
    <div className="hidden xl:block w-60 flex-shrink-0">
      <div className="sticky top-16 bg-white rounded-xl border border-grey-20 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-grey-90">Your Basket</h3>
          <span className="text-xs text-grey-50">0 items</span>
        </div>
        <div className="text-center py-6">
          <svg className="w-10 h-10 text-grey-30 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <p className="text-sm text-grey-50">Your basket is empty</p>
          <LocalizedClientLink href="/store" className="text-xs text-brand-orange hover:underline mt-1 inline-block">
            Start shopping
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
