import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Hotjar } from "../components/Hotjar"
import { GoogleAnalytics } from "../components/GoogleAnalytics"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SieveTube Chat",
  description: "Chat with any YouTube video. Ask questions, get summaries, and interact with video content through AI.",
  icons: [
    {
      url: "/youtube-icon.png",
      type: "image/png",
      sizes: "192x192",
    },
    {
      url: "/favicon.ico",
      sizes: "any",
    },
  ],
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Hotjar />
        <GoogleAnalytics />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="min-h-screen bg-background font-sans antialiased">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  )
}
