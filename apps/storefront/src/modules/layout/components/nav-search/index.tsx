"use client"

import { useRouter, useParams } from "next/navigation"
import { useState, FormEvent } from "react"

export default function NavSearch() {
  const router = useRouter()
  const params = useParams()
  const countryCode = (params?.countryCode as string) || "gb"
  const [query, setQuery] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(
        `/${countryCode}/search?q=${encodeURIComponent(query.trim())}`
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-96">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
        className="w-full border border-grey-20 rounded-lg py-2 px-4 text-sm text-grey-90 placeholder-grey-40 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
      />
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey-40"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </form>
  )
}
