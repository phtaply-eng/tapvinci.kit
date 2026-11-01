import Link from 'next/link'
import Image from 'next/image'

export default function SiteFooter({ copyright = '' }: { copyright?: string }) {
  return (
    <footer className="tv-footer">
      <div className="tv-footer-mark" aria-hidden="true">TapVinci</div>
      <div className="tv-wrap tv-footer-inner">
        <div className="tv-logo tv-logo-sm flex flex-col items-center">
          <Image src="/logo.png" alt="TapVinci" width={220} height={56} className="h-10 md:h-12 w-auto object-contain mx-auto" />
        </div>
        <p className="tv-tagline">A NEW STANDARD OF INTRODUCTION • MADE TO CONNECT • PHILIPPINES 2026</p>
        <div className="tv-footer-actions">
          <Link href="/dashboard" className="tv-btn tv-btn-gold tv-btn-sm">Open Dashboard</Link>
          <Link href="/admin" className="tv-btn tv-btn-glass tv-btn-sm">Admin Panel</Link>
          <a href="mailto:tapvinci@yahoo.com" className="tv-btn tv-btn-glass tv-btn-sm">Contact</a>
        </div>
        <p className="tv-copy">{copyright}</p>
      </div>
    </footer>
  )
}
