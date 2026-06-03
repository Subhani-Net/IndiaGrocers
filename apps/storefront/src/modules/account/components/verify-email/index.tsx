"use client"

import { useActionState } from "react"
import { verifyEmail } from "@lib/data/customer"

export default function VerifyEmail({
  setCurrentView,
  email,
}: {
  setCurrentView: (view: any) => void
  email?: string
}) {
  const [message, formAction] = useActionState(verifyEmail, null)

  if (message === "success") {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-grey-90 mb-2">Email Verified</h3>
        <p className="text-sm text-grey-50 mb-6">
          Your email has been verified. You can now sign in.
        </p>
        <button
          onClick={() => setCurrentView("sign-in")}
          className="w-full py-3 bg-brand-orange text-white font-semibold rounded-xl hover:bg-brand-orange-dark transition-colors"
        >
          Sign In
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-sm text-amber-800">
          We sent a verification link to
          {email ? <span className="font-semibold">{" " + email}</span> : " your email"}.
          Click the link in the email or paste the verification code below.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="token" className="block text-sm font-medium text-grey-70 mb-1.5">
            Verification Code
          </label>
          <input
            id="token"
            name="token"
            type="text"
            placeholder="Paste code from email"
            required
            className="w-full px-4 py-3 border border-grey-30 rounded-xl text-grey-90 placeholder-grey-40 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all"
          />
        </div>

        {typeof message === "string" && (
          <p className="text-sm text-red-500">{message}</p>
        )}

        <button
          type="submit"
          className="w-full py-3 bg-brand-orange text-white font-semibold rounded-xl hover:bg-brand-orange-dark transition-colors"
        >
          Verify Email
        </button>
      </form>

      <p className="text-center text-sm text-grey-50 mt-4">
        Already have an account?{" "}
        <button
          onClick={() => setCurrentView("sign-in")}
          className="text-brand-orange font-semibold hover:underline"
        >
          Sign In
        </button>
      </p>
    </div>
  )
}
