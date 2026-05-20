"use client"

import { useActionState, useEffect, useState } from "react"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { resetPassword } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
  email: string
}

const ResetPassword = ({ setCurrentView, email }: Props) => {
  const [message, formAction] = useActionState(resetPassword, null)
  const [success, setSuccess] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (message === "success") {
      setSuccess(true)
    }
  }, [message])

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Password Updated</h3>
        <p className="text-sm text-gray-500 mb-6">
          Your password has been reset successfully. Sign in with your new password.
        </p>
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="w-full font-semibold py-2 px-4 rounded-lg bg-brand-orange hover:bg-brand-orange-dark text-white transition-colors duration-200"
        >
          Sign In
        </button>
      </div>
    )
  }

  const handleSubmit = (formData: FormData) => {
    setLocalError(null)

    if (newPassword.length < 8) {
      setLocalError("Password must be at least 8 characters")
      return
    }

    if (!/[a-zA-Z]/.test(newPassword)) {
      setLocalError("Password must include at least one letter")
      return
    }

    if (!/[0-9]/.test(newPassword)) {
      setLocalError("Password must include at least one number")
      return
    }

    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match")
      return
    }

    formAction(formData)
  }

  const displayError =
    localError || (message && message !== "success" ? message : null)

  return (
    <div data-testid="reset-password-page">
      <p className="text-sm text-gray-500 mb-4">
        Enter the code sent to <span className="font-medium text-gray-700">{email}</span> and set your new password.
      </p>
      <form className="w-full" action={handleSubmit}>
        <div className="flex flex-col w-full gap-y-4">
          <Input
            label="Reset Code"
            name="token"
            type="text"
            autoComplete="off"
            required
            data-testid="reset-token-input"
          />
          <Input
            label="New Password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            data-testid="new-password-input"
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm Password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            required
            data-testid="confirm-password-input"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <ErrorMessage error={displayError} data-testid="reset-password-error" />
        <SubmitButton data-testid="reset-password-button" className="w-full mt-6">
          Reset Password
        </SubmitButton>
      </form>
      <p className="text-center text-gray-500 text-sm mt-6">
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

export default ResetPassword
