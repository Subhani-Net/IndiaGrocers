import { getBaseURL } from "@lib/util/env"
import { Metadata, Viewport } from "next"
import "styles/globals.css"

export const viewport: Viewport = {
  themeColor: "#FF6B35",
}

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  manifest: "/manifest.json",
  title: "IndiaGrocers London | Indian Grocery Store Online",
  description:
    "Your favourite Indian grocery store in London. Fresh vegetables, spices, rice, dals, pooja essentials and more delivered to your door.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IndiaGrocers",
  },
  openGraph: {
    title: "IndiaGrocers London | Indian Grocery Store Online",
    description:
      "Your favourite Indian grocery store in London. Fresh vegetables, spices, rice, dals & more.",
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
