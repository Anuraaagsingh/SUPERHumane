import type React from "react"
import { Lexend } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/query-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata = {
  title: "MasterMail - Built for Speed",
  description: "Ultra-fast, keyboard-first email client",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${lexend.variable} antialiased`}>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
