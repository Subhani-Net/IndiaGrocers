"use client"

import { useActionState, useEffect, useState } from "react"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { requestPasswordReset } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
  email: string
}

const ForgotPassword = ({ setCurrentView, email }: Props) => {
  const [message, formAction] = useActionState(requestPasswordReset, null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (message === "success") {
      setSent(true)
    }
  }, [message])

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Your Email</h3>
        <p className="text-sm text-gray-500 mb-6">
          We sent a reset code to <span className="font-medium text-gray-700">{email}</span>.
          Use it below to set your new password.
        </p>
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.RESET_PASSWORD)}
          className="w-full font-semibold py-2 px-4 rounded-lg bg-brand-orange hover:bg-brand-orange-dark text-white transition-colors duration-200"
        >
          Enter Reset Code
        </button>
        <p className="text-center text-gray-500 text-sm mt-4">
          <button
            onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
            className="text-brand-orange font-semibold hover:underline"
          >
            Back to sign in
          </button>
        </p>
      </div>
    )
  }

  return (
    <div data-testid="forgot-password-page">
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Enter the email address associated with your account."
            autoComplete="email"
            required
            defaultValue={email}
            data-testid="forgot-email-input"
          />
        </div>
        <ErrorMessage error={message && message !== "success" ? message : null} data-testid="forgot-password-error" />
        <SubmitButton data-testid="send-reset-code-button" className="w-full mt-6">
          Send Reset Code
        </SubmitButton>
      </form>
      <p className="text-center text-gray-500 text-sm mt-6">
        Remember your password?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="text-brand-orange font-semibold hover:underline"
        >
          Sign in
        </button>
      </p>
    </div>
  )
}

export default ForgotPassword
