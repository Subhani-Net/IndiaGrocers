"use client"

import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (optionId: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
}

const OptionSelect = ({
  option,
  current,
  updateOption,
  title,
  disabled,
  "data-testid": dataTestId,
}: OptionSelectProps) => {
  const filteredValues = option.values?.filter((val) => val?.value) ?? []

  return (
    <div className="flex flex-col gap-y-3" data-testid={dataTestId}>
      <span className="text-sm font-medium text-ui-fg-subtle">{title}</span>
      <div className="flex flex-wrap gap-2">
        {filteredValues.map((val) => {
          const isActive = current === val.value
          return (
            <button
              key={val.value}
              onClick={() => updateOption(option.id, val.value!)}
              disabled={disabled}
              className={clx(
                "px-4 py-1.5 text-sm rounded-full border transition-all duration-200",
                {
                  "bg-brand-orange text-white border-brand-orange font-medium":
                    isActive,
                  "border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white":
                    !isActive && !disabled,
                  "border-gray-200 text-gray-400 cursor-not-allowed": disabled,
                }
              )}
              data-testid="option-button"
            >
              {val.value}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
