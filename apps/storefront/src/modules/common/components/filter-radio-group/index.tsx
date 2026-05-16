import { EllipseMiniSolid } from "@medusajs/icons"
import { Label, RadioGroup, clx } from "@medusajs/ui"

type FilterRadioGroupProps = {
  title: string
  items: {
    value: string
    label: string
  }[]
  value: any
  handleChange: (...args: any[]) => void
  "data-testid"?: string
}

const FilterRadioGroup = ({
  title,
  items,
  value,
  handleChange,
  "data-testid": dataTestId,
}: FilterRadioGroupProps) => {
  return (
    <div className="flex flex-col gap-y-2">
      <RadioGroup data-testid={dataTestId} onValueChange={handleChange}>
        {items?.map((i) => (
          <div
            key={i.value}
            className={clx("flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors cursor-pointer", {
              "bg-brand-orange/10": i.value === value,
            })}
            onClick={() => handleChange(i.value)}
          >
            <div className={clx(
              "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
              i.value === value ? "border-brand-orange" : "border-grey-30"
            )}>
              {i.value === value && <div className="w-2 h-2 rounded-full bg-brand-orange" />}
            </div>
            <RadioGroup.Item
              checked={i.value === value}
              className="hidden peer"
              id={i.value}
              value={i.value}
            />
            <Label
              htmlFor={i.value}
              className={clx(
                "text-sm cursor-pointer transition-colors",
                i.value === value ? "text-brand-orange font-semibold" : "text-grey-60 hover:text-grey-90"
              )}
              data-testid="radio-label"
              data-active={i.value === value}
            >
              {i.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

export default FilterRadioGroup
