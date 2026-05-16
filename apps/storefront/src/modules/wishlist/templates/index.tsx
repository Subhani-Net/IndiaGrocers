"use client"

import { useState, useEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type WishlistProduct = {
  id: string
  handle: string
  title: string
  thumbnail: string | null
}

const WishlistTemplate = () => {
  const [productIds, setProductIds] = useState<string[]>([])
  const [products, setProducts] = useState<WishlistProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const ids = JSON.parse(localStorage.getItem("wishlist") || "[]")
      setProductIds(ids)
    } catch {
      setProductIds([])
    }
  }, [])

  useEffect(() => {
    if (!mounted || productIds.length === 0) {
      setLoading(false)
      return
    }

    const fetchProducts = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
        const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        }
        if (publishableKey) {
          headers["x-publishable-api-key"] = publishableKey
        }

        const promises = productIds.map(async (id) => {
          try {
            const res = await fetch(`${baseUrl}/store/products/${id}?fields=id,handle,title,thumbnail`, {
              headers,
              cache: "no-store",
            })
            const data = await res.json()
            return data.product as WishlistProduct
          } catch {
            return null
          }
        })

        const results = (await Promise.all(promises)).filter(Boolean) as WishlistProduct[]
        setProducts(results)
      } catch {
        // silent fail
      }
      setLoading(false)
    }

    fetchProducts()
  }, [mounted, productIds])

  if (!mounted) return null

  return (
    <div className="py-12">
      <div className="content-container">
        <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
        <p className="text-grey-50 mb-8">
          {productIds.length} item{productIds.length !== 1 ? "s" : ""} saved
        </p>

        {loading && (
          <div className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-grey-10 rounded-lg animate-pulse aspect-[3/4]" />
            ))}
          </div>
        )}

        {!loading && productIds.length === 0 && (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-grey-30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-grey-70 mb-2">Your wishlist is empty</h2>
            <p className="text-grey-50 mb-6">Save your favourite products to come back to them later.</p>
            <LocalizedClientLink href="/store">
              <button className="btn-primary">Start Shopping</button>
            </LocalizedClientLink>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4">
            {products.map((product) => (
              <LocalizedClientLink
                key={product.id}
                href={`/products/${product.handle}`}
                className="group"
              >
                <div className="product-card">
                  <div className="relative aspect-square overflow-hidden bg-grey-10">
                    {product.thumbnail ? (
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-grey-30">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 btn-primary text-xs !py-1.5 !px-3 transition-opacity">
                        View Product
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-grey-90 leading-tight line-clamp-2 group-hover:text-brand-orange transition-colors min-h-[2.5rem]">
                      {product.title}
                    </h3>
                  </div>
                </div>
              </LocalizedClientLink>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default WishlistTemplate
