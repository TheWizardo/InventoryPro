import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Navigation } from "@/components/navigation"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Inventory Management System",
  description: "Company inventory management dashboard",
  generator: "inventory.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <ThemeProvider attribute={"class"} defaultTheme="system" enableSystem disableTransitionOnChange >
          <div className="min-h-screen bg-background">
            <Navigation />
            <main className="md:pl-64">{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
