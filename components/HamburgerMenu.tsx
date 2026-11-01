'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Dial from './Dial'

const SOCIALS = [
  { key: 'facebook', label: 'Facebook', href: 'https://facebook.com/shua.vallinas', icon: 'fa-brands fa-facebook-f' },
  { key: 'instagram', label: 'Instagram', href: 'https://instagram.com/shuashushu', icon: 'fa-brands fa-instagram' },
  { key: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com/@shuashushu5', icon: 'fa-brands fa-tiktok' },
]

type Theme = 'dark' | 'light'
const THEME_KEY = 'tapvinci-theme'

// lucide-style sun / moon (inline so the toggle stays inside this file)
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>('dark')

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

  // Restore saved theme (default dark) and mirror it on <html data-theme>
  useEffect(() => {
    let saved: Theme = 'dark'
    try {
      const stored = localStorage.getItem(THEME_KEY)
      if (stored === 'light' || stored === 'dark') saved = stored
    } catch {}
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      try { localStorage.setItem(THEME_KEY, next) } catch {}
      return next
    })
  }

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
            {/* 6b. THEME TOGGLE - Apple-minimal 32px pill */}
            <div className="menu-theme-row menu-fade" style={{ ['--i' as any]: 5 } as any}>
              <button
                type="button"
                role="switch"
                aria-checked={theme === 'light'}
                aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                className={`menu-theme-toggle ${theme === 'light' ? 'is-light' : ''}`}
                onClick={toggleTheme}
              >
                <span className="menu-theme-track" aria-hidden="true">
                  <span className="menu-theme-thumb" />
                  <span className="menu-theme-icon menu-theme-sun"><SunIcon /></span>
                  <span className="menu-theme-icon menu-theme-moon"><MoonIcon /></span>
                </span>
              </button>
            </div>

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

      <style jsx>{`
        .menu-theme-row {
          margin: 0 0 18px;
          display: flex;
          justify-content: center;
        }
        .menu-theme-toggle {
          display: inline-flex;
          padding: 0;
          border: 0;
          background: transparent;
          border-radius: 999px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .menu-theme-toggle:focus-visible {
          outline: 2px solid rgba(212, 175, 55, 0.75);
          outline-offset: 4px;
        }
        .menu-theme-track {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 64px;
          height: 32px;
          padding: 0 8px;
          box-sizing: border-box;
          border-radius: 999px;
          background: #1E1E20;
          border: 1px solid #2A2A2A;
          transition: border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
        }
        .menu-theme-toggle:hover .menu-theme-track {
          border-color: rgba(212, 175, 55, 0.5);
          box-shadow: 0 0 18px -6px rgba(212, 175, 55, 0.6);
        }
        .menu-theme-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #D4AF37;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45), 0 0 14px -4px rgba(212, 175, 55, 0.85);
          transform: translateX(32px);
          transition: transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease;
        }
        .menu-theme-toggle.is-light .menu-theme-thumb {
          transform: translateX(0);
        }
        .menu-theme-icon {
          position: relative;
          z-index: 1;
          display: grid;
          place-items: center;
          width: 14px;
          height: 14px;
          color: #6B7280;
          pointer-events: none;
          transition: color 0.3s ease;
        }
        .menu-theme-icon :global(svg) {
          display: block;
          width: 13px;
          height: 13px;
        }
        .menu-theme-toggle:not(.is-light) .menu-theme-moon {
          color: #111111;
        }
        .menu-theme-toggle.is-light .menu-theme-sun {
          color: #111111;
        }
        @media (prefers-reduced-motion: reduce) {
          .menu-theme-track,
          .menu-theme-thumb,
          .menu-theme-icon {
            transition: none;
          }
        }
      `}</style>
    </>
  )
}
