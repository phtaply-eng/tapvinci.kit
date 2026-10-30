import type { Metadata } from 'next'
import './globals.css'
import HamburgerMenu from '../components/HamburgerMenu'

export const metadata: Metadata = {
  title: 'TapVinci — Tap. Connect. Remember.',
  description: 'Premium NFC digital business cards',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <HamburgerMenu />
        {children}
      </body>
    </html>
  )
}