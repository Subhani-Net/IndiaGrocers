"use client"

import { useEffect } from "react"

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[main layout error]", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 px-4">
      <div className="bg-white rounded-xl border border-stone-200 p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-stone-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-stone-500 mb-6">
          We encountered a temporary issue loading this page. Your order data is safe.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-brand-orange text-white font-semibold rounded-lg hover:bg-brand-orange/90 active:scale-[0.98] transition-all text-sm"
        >
          Try again
        </button>
        <div className="mt-6 pt-4 border-t border-stone-100">
          <a href="/store" className="text-xs text-stone-400 hover:text-brand-orange transition-colors">
            Continue shopping
          </a>
        </div>
      </div>
    </div>
  )
}
