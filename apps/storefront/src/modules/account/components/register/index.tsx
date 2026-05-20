"use client"

import { useActionState, useState } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const validatePassword = (password: string) => {
  const errors: string[] = []
  if (password.length < 8) errors.push("at least 8 characters")
  if (!/[a-zA-Z]/.test(password)) errors.push("at least 1 letter")
  if (!/[0-9]/.test(password)) errors.push("at least 1 number")
  return errors
}

const PasswordRules = ({ password }: { password: string }) => {
  const rules = validatePassword(password)
  if (rules.length === 0) return null
  return (
    <ul className="text-xs text-gray-500 mt-1 space-y-0.5 pl-1">
      <li className={!password || password.length >= 8 ? "text-green-600" : "text-gray-400"}>
        {password.length >= 8 ? "\u2713" : "\u2022"} At least 8 characters
      </li>
      <li className={!/[a-zA-Z]/.test(password) ? "text-gray-400" : "text-green-600"}>
        {/[a-zA-Z]/.test(password) ? "\u2713" : "\u2022"} At least 1 letter
      </li>
      <li className={!/[0-9]/.test(password) ? "text-gray-400" : "text-green-600"}>
        {/[0-9]/.test(password) ? "\u2713" : "\u2022"} At least 1 number
      </li>
    </ul>
  )
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signup, null)
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)

  const handleSubmit = (formData: FormData) => {
    const email = formData.get("email") as string
    const pw = formData.get("password") as string

    setEmailError(null)

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address")
      return
    }

    const passwordErrors = validatePassword(pw)
    if (passwordErrors.length > 0) {
      return
    }

    formAction(formData)
  }

  return (
    <div data-testid="register-page">
      <form className="w-full flex flex-col" action={handleSubmit}>
        <div className="flex flex-col w-full gap-y-4">
          <div className="grid grid-cols-2 gap-x-4">
            <Input
              label="First name"
              name="first_name"
              required
              autoComplete="given-name"
              data-testid="first-name-input"
            />
            <Input
              label="Last name"
              name="last_name"
              required
              autoComplete="family-name"
              data-testid="last-name-input"
            />
          </div>
          <Input
            label="Email"
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          {emailError && (
            <p className="text-rose-500 text-xs -mt-2">{emailError}</p>
          )}
          <Input
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <div>
            <Input
              label="Password"
              name="password"
              required
              type="password"
              autoComplete="new-password"
              data-testid="password-input"
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordRules password={password} />
          </div>
        </div>
        <ErrorMessage error={message} data-testid="register-error" />
        <span className="text-center text-gray-500 text-sm mt-4">
          By creating an account, you agree to IndiaGrocers&apos;s{" "}
          <LocalizedClientLink
            href="/content/privacy-policy"
            className="text-brand-orange hover:underline"
          >
            Privacy Policy
          </LocalizedClientLink>{" "}
          and{" "}
          <LocalizedClientLink
            href="/content/terms-of-use"
            className="text-brand-orange hover:underline"
          >
            Terms of Use
          </LocalizedClientLink>
          .
        </span>
        <SubmitButton className="w-full mt-6" data-testid="register-button">
          Join
        </SubmitButton>
      </form>
      <span className="text-center text-gray-500 text-sm mt-6 block">
        Already a member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="text-brand-orange font-semibold hover:underline"
        >
          Sign in
        </button>
        .
      </span>
    </div>
  )
}

export default Register
