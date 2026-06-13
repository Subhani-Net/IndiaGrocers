import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { Text, clx } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MedusaCTA from "@modules/layout/components/medusa-cta"

export default async function Footer() {
  let collections: any[] = []
  let productCategories: any[] = []

  try {
    const result = await listCollections({ fields: "*products" })
    collections = result?.collections ?? []
  } catch (err) {
    console.warn("[Footer] collections fetch failed:", err?.message || err)
  }

  try {
    productCategories = await listCategories()
  } catch (err) {
    console.warn("[Footer] categories fetch failed:", err?.message || err)
  }

  return (
    <footer className="border-t-4 border-brand-orange w-full bg-grey-5">
      <div className="content-container flex flex-col w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
          <div className="flex flex-col gap-4">
            <LocalizedClientLink
              href="/"
              className="text-xl font-bold text-brand-orange"
            >
              IndiaGrocers
            </LocalizedClientLink>
            <p className="text-sm text-grey-50 leading-relaxed">
              Your trusted source for authentic Indian groceries in London.
              Fresh vegetables, premium spices, and traditional essentials
              delivered to your doorstep.
            </p>
            <div className="flex flex-col gap-1 text-sm text-grey-50">
              <span>123 Green Street,</span>
              <span>London E1 6AN, UK</span>
              <a href="tel:+442071234567" className="hover:text-brand-orange transition-colors">
                +44 20 7123 4567
              </a>
              <a
                href="https://wa.me/447867226626"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-orange transition-colors"
              >
                WhatsApp: +44 7867 226626
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-sm font-semibold text-grey-90 uppercase tracking-wider">
              Quick Links
            </span>
            <ul className="flex flex-col gap-2">
              {productCategories && productCategories?.length > 0 && (
                <>
                  {productCategories
                    .filter((c) => !c.parent_category)
                    .filter((p) =>
                      productCategories.some(
                        (c) => c.parent_category_id === p.id
                      )
                    )
                    .slice(0, 6)
                    .map((c) => (
                      <li key={c.id}>
                        <LocalizedClientLink
                          className="text-sm text-grey-50 hover:text-brand-orange transition-colors"
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                      </li>
                    )
                  )}
                </>
              )}
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-sm font-semibold text-grey-90 uppercase tracking-wider">
              Customer Service
            </span>
            <ul className="flex flex-col gap-2">
              <li>
                <LocalizedClientLink
                  className="text-sm text-grey-50 hover:text-brand-orange transition-colors"
                  href="/delivery"
                >
                  Delivery Information
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  className="text-sm text-grey-50 hover:text-brand-orange transition-colors"
                  href="/store"
                >
                  All Products
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  className="text-sm text-grey-50 hover:text-brand-orange transition-colors"
                  href="/offers"
                >
                  Special Offers
                </LocalizedClientLink>
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-sm font-semibold text-grey-90 uppercase tracking-wider">
              Connect
            </span>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center text-white hover:bg-brand-orange-dark transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center text-white hover:bg-brand-orange-dark transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center text-white hover:bg-brand-orange-dark transition-colors"
                aria-label="YouTube"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-xs font-semibold text-grey-90 uppercase tracking-wider">
                We Accept
              </span>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1.5 bg-white border border-grey-20 rounded text-xs text-grey-60 font-medium">Visa</span>
                <span className="px-3 py-1.5 bg-white border border-grey-20 rounded text-xs text-grey-60 font-medium">Mastercard</span>
                <span className="px-3 py-1.5 bg-white border border-grey-20 rounded text-xs text-grey-60 font-medium">Amex</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between py-6 border-t border-grey-20 gap-4">
          <Text className="txt-compact-small text-grey-50">
            &copy; {new Date().getFullYear()} IndiaGrocers London. All rights reserved.
          </Text>
          <div className="flex items-center gap-4 text-xs text-grey-40">
            <MedusaCTA />
          </div>
        </div>
      </div>
    </footer>
  )
}
