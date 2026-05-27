"use client"

import { PantryProvider } from "@lib/context/pantry-context"

export default function PantryShell({ children }: { children: React.ReactNode }) {
  return <PantryProvider>{children}</PantryProvider>
}
