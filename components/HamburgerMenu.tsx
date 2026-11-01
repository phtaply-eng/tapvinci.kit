'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const SOCIALS = [
  { key: 'facebook', label: 'Facebook', href: 'https://facebook.com/shua.vallinas', icon: 'fa-brands fa-facebook-f' },
  { key: 'instagram', label: 'Instagram', href: 'https://instagram.com/shuashushu', icon: 'fa-brands fa-instagram' },
  { key: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com/@shuashushu5', icon: 'fa-brands fa-tiktok' },
]

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
            <svg className="menu-dial" viewBox="-100 -100 200 200" fill="none">
              <circle r="98.5" stroke="#D4AF37" strokeOpacity="0.28" strokeWidth="0.3" />
              <circle r="86" stroke="#D4AF37" strokeOpacity="0.14" strokeWidth="0.25" />
              <circle cy="-96" r="1.3" fill="#FFC21C" />
            </svg>
          </div>

          {/* ===== TOP: Logo + Tagline ===== */}
          <div className="menu-head">
            <Link href="/" className="menu-logo" onClick={close} aria-label="TapVinci Home">
              <div className="tv-logo tv-logo-sm" style={{ display: 'flex', gap: '0', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em' }}>
                <span className="tv-logo-tap" style={{ color: '#fff' }}>Tap</span>
                <span className="tv-logo-vinci" style={{ color: '#D4AF37' }}>Vinci</span>
              </div>
            </Link>
            <p className="menu-tagline">DRIVEN BY QUALITY • CHOSEN BY THOSE WHO KNOW THE DIFFERENCE • PHILIPPINES • 2026</p>
            <span className="menu-gold-line" aria-hidden="true" />
          </div>

          {/* ===== MIDDLE: REQUIRED ORDER LOCKED ===== */}
          {/* 1. Home (home icon, subtle) */}
          {/* 2. Contact (mail icon, RIGHT AFTER HOME, subtle, 14px Montserrat) */}
          <nav className="menu-nav" aria-label="Primary">
            <Link
              href="/"
              className="menu-link menu-anim"
              onClick={close}
              style={{ ['--i' as any]: 0 }}
            >
              <span className="menu-link-main">
                <span className="menu-link-icon"><i className="fa-solid fa-house" aria-hidden="true"></i></span>
                Home
              </span>
              <span className="menu-link-end">
                <span className="menu-link-tag">01</span>
                <span className="menu-link-arrow"><i className="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
              </span>
            </Link>

            <Link
              href="mailto:tapvinci@yahoo.com"
              className="menu-link menu-anim"
              onClick={close}
              style={{ ['--i' as any]: 1 }}
            >
              <span className="menu-link-main">
                <span className="menu-link-icon"><i className="fa-solid fa-envelope" aria-hidden="true"></i></span>
                Contact
              </span>
              <span className="menu-link-end">
                <span className="menu-link-tag">02</span>
                <span className="menu-link-arrow"><i className="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
              </span>
            </Link>

            <Link
              href="/reviews"
              className="menu-link menu-anim"
              onClick={close}
              style={{ ['--i' as any]: 2 }}
            >
              <span className="menu-link-main">
                <span className="menu-link-icon"><i className="fa-solid fa-star" aria-hidden="true"></i></span>
                Reviews
              </span>
              <span className="menu-link-end">
                <span className="menu-link-tag">03</span>
                <span className="menu-link-arrow"><i className="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
              </span>
            </Link>
          </nav>

          {/* 3. [24px spacer] */}
          <div className="menu-spacer-24" aria-hidden="true" />

          {/* 4. Open Dashboard (gold) + 5. View Demo (dark) */}
          <div className="menu-btn-stack">
            <Link
              href="/dashboard"
              className="menu-btn menu-btn-gold menu-anim"
              onClick={close}
              style={{ ['--i' as any]: 4, borderRadius: '24px' }}
            >
              Open Dashboard
            </Link>
            <Link
              href="/shua"
              className="menu-btn menu-btn-dark menu-anim"
              onClick={close}
              style={{ ['--i' as any]: 4, borderRadius: '24px' }}
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

            <a href="mailto:tapvinci@yahoo.com" className="menu-email menu-fade" style={{ ['--i' as any]: 5 } as any}>
              tapvinci@yahoo.com
            </a>

            <p className="menu-copy menu-fade" style={{ ['--i' as any]: 6 } as any}>
              © 2026 TapVinci • Philippines • All rights reserved.
            </p>

            {/* · Admin - ABSOLUTE LAST ELEMENT - OWNER-ONLY LOWKEY - NO ICON, NO BUTTON */}
            <Link href="/admin" className="admin-lowkey menu-fade" onClick={close} style={{ ['--i' as any]: 7 } as any}>
              · Admin
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
