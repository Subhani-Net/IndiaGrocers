import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
  setForgotEmail: (email: string) => void
}

const Login = ({ setCurrentView, setForgotEmail }: Props) => {
  const [message, formAction] = useActionState(login, null)

  const handleForgotPassword = () => {
    const emailInput = document.querySelector(
      'input[name="email"]'
    ) as HTMLInputElement
    if (emailInput?.value) {
      setForgotEmail(emailInput.value)
    }
    setCurrentView(LOGIN_VIEW.FORGOT_PASSWORD)
  }

  return (
    <div data-testid="login-page">
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-4">
          Sign in
        </SubmitButton>
      </form>
      <div className="text-center mt-3">
        <button
          onClick={handleForgotPassword}
          className="text-brand-orange text-sm font-medium hover:underline"
        >
          Forgot your password?
        </button>
      </div>
      <span className="text-center text-gray-500 text-sm mt-4 block">
        Not a member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="text-brand-orange font-semibold hover:underline"
          data-testid="register-button"
        >
          Join us
        </button>
        .
      </span>
    </div>
  )
}

export default Login
