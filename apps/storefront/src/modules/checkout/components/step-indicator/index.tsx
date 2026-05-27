"use client"

import { clx } from "@medusajs/ui"
import { useSearchParams } from "next/navigation"

const STEPS = [
  { key: "address", label: "Address" },
  { key: "delivery", label: "Delivery Slot" },
  { key: "payment", label: "Payment" },
]

const StepIndicator = () => {
  const searchParams = useSearchParams()
  const currentStep = searchParams.get("step") || "address"

  const getStepStatus = (stepKey: string) => {
    const stepOrder = STEPS.map((s) => s.key)
    const currentIndex = stepOrder.indexOf(currentStep)
    const stepIndex = stepOrder.indexOf(stepKey)

    if (stepIndex < currentIndex) return "completed"
    if (stepIndex === currentIndex) return "active"
    return "upcoming"
  }

  return (
    <div className="w-full mb-6 sm:mb-8">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {STEPS.map((step, index) => {
          const status = getStepStatus(step.key)
          const isLast = index === STEPS.length - 1

          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={clx(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                    {
                      "bg-brand-orange text-white shadow-md shadow-brand-orange/20":
                        status === "active",
                      "bg-green-500 text-white": status === "completed",
                      "bg-stone-200 text-stone-400": status === "upcoming",
                    }
                  )}
                >
                  {status === "completed" ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={clx("text-[11px] mt-1.5 font-semibold whitespace-nowrap", {
                    "text-brand-orange": status === "active",
                    "text-green-600": status === "completed",
                    "text-stone-400": status === "upcoming",
                  })}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={clx("flex-1 h-0.5 mx-2 mt-[-1.5rem] transition-colors duration-300", {
                    "bg-green-400": STEPS.findIndex((s) => s.key === currentStep) > index,
                    "bg-stone-200": STEPS.findIndex((s) => s.key === currentStep) <= index,
                  })}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StepIndicator
