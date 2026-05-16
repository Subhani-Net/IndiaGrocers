"use client"

import { useState, useEffect, useCallback } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const slides = [
  {
    emoji: "🥘",
    title: "Cook Delicious Protein-Rich Meals",
    subtitle: "with our finest dals, lentils & spices – shop now!",
    link: "/categories/dals-and-lentils",
    bg: "from-brand-orange to-brand-orange-dark",
  },
  {
    emoji: "🧴",
    title: "Cook Healthier Every Day",
    subtitle: "Premium quality cooking oils & ghee for your kitchen",
    link: "/categories/cooking-oils-and-ghee",
    bg: "from-brand-green to-brand-green-dark",
  },
  {
    emoji: "🌾",
    title: "Top Quality Rice & Grains",
    subtitle: "Basmati, Sona Masoori, Ponni & more – perfect for daily cooking",
    link: "/categories/rice-and-grains",
    bg: "from-brand-orange-dark to-brand-red",
  },
]

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [])

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  return (
    <div className="relative w-full overflow-hidden bg-grey-90">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`min-w-full hero-slide bg-gradient-to-r ${slide.bg} flex items-center justify-center px-6`}
          >
            <div className="text-center max-w-3xl mx-auto py-16 md:py-24">
              <span className="text-6xl md:text-8xl block mb-6">{slide.emoji}</span>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                {slide.title}
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-8">
                {slide.subtitle}
              </p>
              <LocalizedClientLink
                href={slide.link}
                className="inline-block bg-white text-brand-orange font-semibold px-8 py-3 rounded-lg 
                         hover:bg-grey-5 transition-colors duration-200 text-lg"
              >
                Shop Now
              </LocalizedClientLink>
            </div>
          </div>
        ))}
      </div>
      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i === current ? "bg-white scale-110" : "bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
