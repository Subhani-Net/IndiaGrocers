"use client"

import { useLayover } from "@lib/context/layover-context"
import PdpLayover from "@modules/products/components/pdp-layover"

export default function PdpLayoverShell({ countryCode }: { countryCode: string }) {
  const { openProduct, closeLayover } = useLayover()

  if (!openProduct) return null

  return (
    <PdpLayover
      product={openProduct}
      countryCode={countryCode}
      onClose={closeLayover}
    />
  )
}
