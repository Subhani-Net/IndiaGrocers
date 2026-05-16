import { Disclosure } from "@headlessui/react"
import { Badge, clx } from "@medusajs/ui"
import { useEffect } from "react"

import useToggleState from "@lib/hooks/use-toggle-state"
import { useFormStatus } from "react-dom"

type AccountInfoProps = {
  label: string
  currentInfo: string | React.ReactNode
  isSuccess?: boolean
  isError?: boolean
  errorMessage?: string
  clearState: () => void
  children?: React.ReactNode
  'data-testid'?: string
}

const AccountInfo = ({
  label,
  currentInfo,
  isSuccess,
  isError,
  clearState,
  errorMessage = "An error occurred, please try again",
  children,
  'data-testid': dataTestid
}: AccountInfoProps) => {
  const { state, close, toggle } = useToggleState()

  const { pending } = useFormStatus()

  const handleToggle = () => {
    clearState()
    setTimeout(() => toggle(), 100)
  }

  useEffect(() => {
    if (isSuccess) {
      close()
    }
  }, [isSuccess, close])

  return (
    <div className="text-sm" data-testid={dataTestid}>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">{label}</span>
            <div className="flex items-center flex-1 basis-0 justify-end gap-x-4 mt-1">
              {typeof currentInfo === "string" ? (
                <span className="font-semibold text-gray-800" data-testid="current-info">{currentInfo}</span>
              ) : (
                currentInfo
              )}
            </div>
          </div>
          <div>
            <button
              className="btn-primary text-sm py-1.5 px-4"
              onClick={handleToggle}
              type={state ? "reset" : "button"}
              data-testid="edit-button"
              data-active={state}
            >
              {state ? "Cancel" : "Edit"}
            </button>
          </div>
        </div>

        {/* Success state */}
        <Disclosure>
          <Disclosure.Panel
            static
            className={clx(
              "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
              {
                "max-h-[1000px] opacity-100": isSuccess,
                "max-h-0 opacity-0": !isSuccess,
              }
            )}
            data-testid="success-message"
          >
            <Badge className="p-2 my-4" color="green">
              <span>{label} updated succesfully</span>
            </Badge>
          </Disclosure.Panel>
        </Disclosure>

        {/* Error state  */}
        <Disclosure>
          <Disclosure.Panel
            static
            className={clx(
              "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
              {
                "max-h-[1000px] opacity-100": isError,
                "max-h-0 opacity-0": !isError,
              }
            )}
            data-testid="error-message"
          >
            <Badge className="p-2 my-4" color="red">
              <span>{errorMessage}</span>
            </Badge>
          </Disclosure.Panel>
        </Disclosure>

        <Disclosure>
          <Disclosure.Panel
            static
            className={clx(
              "transition-[max-height,opacity] duration-300 ease-in-out overflow-visible",
              {
                "max-h-[1000px] opacity-100": state,
                "max-h-0 opacity-0": !state,
              }
            )}
          >
            <div className="flex flex-col gap-y-2 py-4">
              <div>{children}</div>
              <div className="flex items-center justify-end mt-2">
                <button
                  disabled={pending}
                  className="btn-primary text-sm py-2 px-6 disabled:opacity-50"
                  type="submit"
                  data-testid="save-button"
                >
                  {pending ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </Disclosure.Panel>
        </Disclosure>
      </div>
    </div>
  )
}

export default AccountInfo
