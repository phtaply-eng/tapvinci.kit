import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TapVinci - Tap. Connect. Remember.',
  description: 'Premium NFC digital business cards',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}