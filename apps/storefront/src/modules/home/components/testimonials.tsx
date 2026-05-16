"use client"

import { useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid"

const testimonials = [
  {
    name: "Priya K.",
    location: "East London",
    text: "Best Indian grocery store in London! Fresh vegetables and amazing variety of spices. Delivery is always on time.",
    rating: 5,
  },
  {
    name: "Rajesh M.",
    location: "Ilford",
    text: "I've been shopping here for months. The basmati rice is top quality and the dals are always fresh. Highly recommended!",
    rating: 5,
  },
  {
    name: "Lakshmi S.",
    location: "Wembley",
    text: "Finally found all my Kerala grocery needs under one roof. The banana leaves and coconut oil are authentic.",
    rating: 5,
  },
  {
    name: "Arjun V.",
    location: "Southall",
    text: "Great prices on bulk rice and dals. The express delivery option is fantastic when I need things urgently.",
    rating: 4,
  },
]

export default function Testimonials() {
  const [current, setCurrent] = useState(0)

  const next = () => setCurrent((c) => (c + 1) % testimonials.length)
  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length)

  return (
    <section className="py-16 bg-gradient-to-b from-grey-5 to-white">
      <div className="max-w-[1440px] mx-auto px-6">
        <h2 className="section-title section-title-accent">Trusted by Customers</h2>
        <p className="section-subtitle">Here is what our customers say about us</p>

        <div className="relative max-w-2xl mx-auto mt-10">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {testimonials.map((t, i) => (
                <div key={i} className="min-w-full px-4">
                  <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-grey-10">
                    <div className="flex justify-center gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <svg
                          key={s}
                          className={`w-5 h-5 ${s < t.rating ? "text-accent-yellow" : "text-grey-20"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-grey-70 text-lg italic mb-6 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                    <div>
                      <p className="font-semibold text-grey-90">{t.name}</p>
                      <p className="text-sm text-grey-50">{t.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 
                     w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center
                     hover:bg-grey-5 transition-colors text-grey-60"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12
                     w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center
                     hover:bg-grey-5 transition-colors text-grey-60"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>

          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === current ? "bg-brand-orange w-6" : "bg-grey-30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
