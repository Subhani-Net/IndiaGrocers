"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState("sign-in")

  return (
    <div className="w-full flex justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-brand-orange to-brand-orange-light px-6 py-5">
          <h2 className="text-xl font-bold text-white">
            {currentView === "sign-in" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {currentView === "sign-in"
              ? "Sign in to access your account"
              : "Join IndiaGrocers today"}
          </p>
        </div>
        <div className="p-6">
          {currentView === "sign-in" ? (
            <Login setCurrentView={setCurrentView} />
          ) : (
            <Register setCurrentView={setCurrentView} />
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginTemplate
