"use client"

import { useState, useEffect } from "react"

const WishlistButton = ({ productId }: { productId: string }) => {
  const [isWishlisted, setIsWishlisted] = useState(false)

  useEffect(() => {
    try {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]")
      setIsWishlisted(wishlist.includes(productId))
    } catch {
      setIsWishlisted(false)
    }
  }, [productId])

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]")
      if (wishlist.includes(productId)) {
        localStorage.setItem(
          "wishlist",
          JSON.stringify(wishlist.filter((id: string) => id !== productId))
        )
        setIsWishlisted(false)
      } else {
        localStorage.setItem(
          "wishlist",
          JSON.stringify([...wishlist, productId])
        )
        setIsWishlisted(true)
      }
    } catch {
      // localStorage not available
    }
  }

  return (
    <button
      onClick={toggleWishlist}
      className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform"
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      data-testid="wishlist-button"
    >
      <svg
        className={`w-4 h-4 ${
          isWishlisted
            ? "text-brand-orange fill-brand-orange"
            : "text-grey-40 fill-none"
        }`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        fill={isWishlisted ? "currentColor" : "none"}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  )
}

export default WishlistButton
