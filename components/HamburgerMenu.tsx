'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import Dial from './Dial'

const SOCIALS = [
  { key: 'facebook', label: 'Facebook', href: 'https://facebook.com/shua.vallinas', icon: 'fa-brands fa-facebook-f' },
  { key: 'instagram', label: 'Instagram', href: 'https://instagram.com/shuashushu', icon: 'fa-brands fa-instagram' },
  { key: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com/@shuashushu5', icon: 'fa-brands fa-tiktok' },
]

const links = [
  { label: "Home", href: "#top" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#follow" },
  { label: "Reviews", href: "#reviews-teaser" },
]

const linkIcons: Record<string, string> = {
  Home: 'fa-solid fa-house',
  'How It Works': 'fa-solid fa-layer-group',
  Pricing: 'fa-solid fa-tag',
  FAQ: 'fa-solid fa-circle-question',
  Contact: 'fa-solid fa-envelope',
  Reviews: 'fa-solid fa-star',
}

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  const close = () => setIsOpen(false)

  const pathname = usePathname()
  // On the homepage, use hash-only links for smooth in-page scrolling.
  // From other routes, prefix "/" so the link returns home and reaches the section.
  const resolveHref = (href: string) => (pathname === '/' ? href : `/${href}`)

  return (
    <>
      <button
        className={`hamburger-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <span className="line"></span>
        <span className="line"></span>
        <span className="hamburger-dot"></span>
      </button>

      <div className={`menu-overlay ${isOpen ? 'open' : ''}`} onClick={close} aria-hidden="true" />

      <aside className={`menu-panel ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
        <div className="menu-scroll">
          {/* Dial background art */}
          <div className="menu-dial-wrap" aria-hidden="true">
            <Dial className="menu-dial" />
          </div>

          {/* ===== TOP: Logo + Tagline ===== */}
          <div className="menu-head">
            <Link href="/" className="menu-logo" onClick={close} aria-label="TapVinci Home">
              <div className="tv-logo tv-logo-sm" style={{ display: 'flex', alignItems: 'center' }}>
              <Image src="/logo.png" alt="TapVinci" width={140} height={36} className="h-7 w-auto object-contain" priority />
            </div>
            </Link>
            <p className="menu-tagline">A NEW STANDARD OF INTRODUCTION • MADE TO CONNECT • PHILIPPINES 2026</p>
            <span className="menu-gold-line" aria-hidden="true" />
          </div>

          {/* ===== MIDDLE: Home, How It Works, Pricing, FAQ, Contact, Reviews ===== */}
          <nav className="menu-nav" aria-label="Primary">
            {links.map((item, i) => (
              <Link
                key={item.label}
                href={resolveHref(item.href)}
                className="menu-link menu-anim"
                onClick={() => setIsOpen(false)}
                style={{ ['--i' as any]: i }}
              >
                <span className="menu-link-main">
                  <span className="menu-link-icon"><i className={linkIcons[item.label]} aria-hidden="true"></i></span>
                  {item.label}
                </span>
                <span className="menu-link-end">
                  <span className="menu-link-tag">{String(i + 1).padStart(2, '0')}</span>
                  <span className="menu-link-arrow"><i className="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
                </span>
              </Link>
            ))}
          </nav>

          {/* 3. [24px spacer] */}
          <div className="menu-spacer-24" aria-hidden="true" />

          {/* 4. Open Dashboard (gold) + 5. View Demo (dark) */}
          <div className="menu-btn-stack">
            <Link
              href="/dashboard"
              className="menu-btn menu-btn-gold menu-anim"
              onClick={close}
              style={{ ['--i' as any]: 6, borderRadius: '24px' }}
            >
              Open Dashboard
            </Link>
            <Link
              href="/shua"
              className="menu-btn menu-btn-dark menu-anim"
              onClick={close}
              style={{ ['--i' as any]: 6, borderRadius: '24px' }}
            >
              View Demo
            </Link>
          </div>

          {/* 6. [flex-1 spacer to push footer down] */}
          <div className="menu-spacer-flex" aria-hidden="true" />

          {/* 7. FOOTER GROUP (bottom) */}
          <div className="menu-foot">
            <div className="menu-socials menu-fade" style={{ ['--i' as any]: 8 } as any}>
              {SOCIALS.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="menu-social"
                  aria-label={s.label}
                >
                  <i className={s.icon} aria-hidden="true"></i>
                </a>
              ))}
            </div>
            <p className="menu-copy menu-fade" style={{ ['--i' as any]: 6 } as any}>
              © 2026 TapVinci • Philippines • All rights reserved.
            </p>

            {/* · Admin - ABSOLUTE LAST ELEMENT - OWNER-ONLY LOWKEY - NO ICON, NO BUTTON */}
            <Link href="/admin" className="admin-lowkey menu-fade" onClick={close} style={{ ['--i' as any]: 7 } as any}>-ADMIN</Link>
          </div>
        </div>
      </aside>
    </>
  )
}
