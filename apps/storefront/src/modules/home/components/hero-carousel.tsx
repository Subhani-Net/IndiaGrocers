"use client"

import { useState, useEffect, useCallback } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const slides = [
  {
    emoji: "🥘",
    title: "Cook Delicious Protein-Rich Meals",
    subtitle: "with our finest dals, lentils & spices — shop now!",
    link: "/categories/dals-and-lentils",
    bg: "from-brand-orange to-brand-orange-dark",
    iconBg: "bg-white/15",
  },
  {
    emoji: "🧴",
    title: "Cook Healthier Every Day",
    subtitle: "Premium quality cooking oils & ghee for your kitchen",
    link: "/categories/cooking-oils-and-ghee",
    bg: "from-brand-cardamom to-brand-cardamom-dark",
    iconBg: "bg-white/15",
  },
  {
    emoji: "🌾",
    title: "Top Quality Rice & Grains",
    subtitle: "Basmati, Sona Masoori, Ponni & more — perfect for daily cooking",
    link: "/categories/rice-and-grains",
    bg: "from-brand-saffron to-brand-orange-dark",
    iconBg: "bg-white/15",
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
    <div className="relative w-full overflow-hidden bg-stone-900">
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`min-w-full relative flex items-center justify-center px-6 py-20 md:py-28 lg:py-32 bg-gradient-to-br ${slide.bg} overflow-hidden`}
          >
            {/* Decorative circles */}
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-white/[0.03]" />

            <div className="text-center max-w-3xl mx-auto relative z-10">
              <span className={`inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-full ${slide.iconBg} backdrop-blur-sm mb-6 md:mb-8 text-5xl md:text-6xl shadow-2xl`}>
                {slide.emoji}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
                {slide.title}
              </h1>
              <p className="text-base md:text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                {slide.subtitle}
              </p>
              <LocalizedClientLink
                href={slide.link}
                className="inline-flex items-center gap-2 bg-white text-brand-orange font-semibold px-8 py-3.5 rounded-xl
                         hover:bg-grey-5 active:scale-[0.97] transition-all duration-200 text-base shadow-xl shadow-black/20"
              >
                Shop Now
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </LocalizedClientLink>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-8 h-2.5 bg-white"
                : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
