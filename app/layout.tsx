import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SieveTube Chat',
  description: 'Chat with any YouTube video. Ask questions, get summaries, and interact with video content through AI.',
  icons: [
    {
      url: '/youtube-icon.png',
      type: 'image/png',
      sizes: '192x192',
    },
    {
      url: '/favicon.ico',
      sizes: 'any',
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
