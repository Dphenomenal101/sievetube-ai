import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Hotjar } from "../components/Hotjar"
import { GoogleAnalytics } from "../components/GoogleAnalytics"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
}

export const metadata: Metadata = {
  metadataBase: new URL("https://sievetube.dphenomenal.com"),
  title: "SieveTube AI - Chat with YouTube Videos",
  description: "Transform your YouTube watching experience with SieveTube AI. Chat with videos, get instant summaries, ask questions, and interact with content through advanced AI. Your intelligent YouTube companion.",
  keywords: "YouTube AI, video chat, video summary, AI video interaction, YouTube assistant, video content analysis, YouTube learning tool",
  authors: [{ name: "SieveTube AI" }],
  creator: "SieveTube AI",
  publisher: "SieveTube AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "SieveTube AI - Chat with YouTube Videos",
    description: "Transform your YouTube watching experience with SieveTube AI. Chat with videos, get instant summaries, ask questions, and interact with content through advanced AI.",
    siteName: "SieveTube AI",
    images: [{
      url: "/youtube-icon.png",
      width: 192,
      height: 192,
      alt: "SieveTube AI Logo"
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SieveTube AI - Chat with YouTube Videos",
    description: "Transform your YouTube watching experience with SieveTube AI. Chat with videos, get instant summaries, ask questions, and interact with content through advanced AI.",
    images: ["/youtube-icon.png"],
  },
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
  robots: "index, follow",
  generator: "Next.js",
  applicationName: "SieveTube AI",
  referrer: "origin-when-cross-origin",
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
