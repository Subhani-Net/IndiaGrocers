"use client"

import React from "react"
import { useFormStatus } from "react-dom"

export function SubmitButton({
  children,
  variant = "primary",
  className,
  "data-testid": dataTestId,
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "transparent" | "danger" | null
  className?: string
  "data-testid"?: string
}) {
  const { pending } = useFormStatus()

  const btnClass =
    variant === "secondary" || variant === "transparent" || variant === "danger"
      ? "border-2 border-brand-orange text-brand-orange px-6 py-3 rounded-lg font-semibold hover:bg-brand-orange hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      : "btn-primary"

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${btnClass} w-full text-center disabled:opacity-50 disabled:cursor-not-allowed ${className || ""}`}
      data-testid={dataTestId}
    >
      {pending ? "Processing..." : children}
    </button>
  )
}
