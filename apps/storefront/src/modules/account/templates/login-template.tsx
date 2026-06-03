"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"
import ForgotPassword from "@modules/account/components/forgot-password"
import ResetPassword from "@modules/account/components/reset-password"
import VerifyEmail from "@modules/account/components/verify-email"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
  FORGOT_PASSWORD = "forgot-password",
  RESET_PASSWORD = "reset-password",
  VERIFY_EMAIL = "verify-email",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState(LOGIN_VIEW.SIGN_IN)
  const [forgotEmail, setForgotEmail] = useState("")

  const headerTitle = {
    [LOGIN_VIEW.SIGN_IN]: "Welcome Back",
    [LOGIN_VIEW.REGISTER]: "Create Account",
    [LOGIN_VIEW.FORGOT_PASSWORD]: "Reset Password",
    [LOGIN_VIEW.RESET_PASSWORD]: "Enter New Password",
    [LOGIN_VIEW.VERIFY_EMAIL]: "Verify Your Email",
  }

  const headerSubtitle = {
    [LOGIN_VIEW.SIGN_IN]: "Sign in to access your account",
    [LOGIN_VIEW.REGISTER]: "Join IndiaGrocers today",
    [LOGIN_VIEW.FORGOT_PASSWORD]: "We'll send a code to your email",
    [LOGIN_VIEW.RESET_PASSWORD]: "Enter the code we sent and your new password",
    [LOGIN_VIEW.VERIFY_EMAIL]: "Check your email for the verification link",
  }

  return (
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-120px)] px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-brand-orange to-brand-orange-light px-6 py-5">
          <h2 className="text-xl font-bold text-white">
            {headerTitle[currentView]}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {headerSubtitle[currentView]}
          </p>
        </div>
        <div className="p-6">
          {currentView === LOGIN_VIEW.SIGN_IN && (
            <Login
              setCurrentView={setCurrentView}
              setForgotEmail={setForgotEmail}
            />
          )}
          {currentView === LOGIN_VIEW.REGISTER && (
            <Register setCurrentView={setCurrentView} />
          )}
          {currentView === LOGIN_VIEW.FORGOT_PASSWORD && (
            <ForgotPassword
              setCurrentView={setCurrentView}
              email={forgotEmail}
            />
          )}
          {currentView === LOGIN_VIEW.RESET_PASSWORD && (
            <ResetPassword
              setCurrentView={setCurrentView}
              email={forgotEmail}
            />
          )}
          {currentView === LOGIN_VIEW.VERIFY_EMAIL && (
            <VerifyEmail
              setCurrentView={setCurrentView}
              email={forgotEmail}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginTemplate
