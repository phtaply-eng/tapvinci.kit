'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Demo profile that "View Demo" opens (and where the menu is also shown). Override with NEXT_PUBLIC_DEMO_USERNAME.
const DEMO = (process.env.NEXT_PUBLIC_DEMO_USERNAME || 'shua').toLowerCase()

const ITEMS = [
  { href: '/', icon: '🏠', label: 'Home', hint: 'Tap. Connect. Remember.' },
  { href: `/${DEMO}`, icon: '👁️', label: 'View Demo', hint: '' },
]

// sections of the homepage (these work from any page that shows the menu)
const SECTIONS = [
  { href: '/#about', icon: '✨', label: 'About TapVinci' },
  { href: '/#offer', icon: '💳', label: 'What We Offer' },
  { href: '/#how-it-works', icon: '⚙️', label: 'How It Works' },
  { href: '/#gallery', icon: '🖼️', label: 'Gallery' },
  { href: '/#follow', icon: '📣', label: 'Follow & Share' },
  { href: '/#faq', icon: '❓', label: 'NFC Help / FAQ' },
]

export default function HamburgerMenu() {
  const pathname = usePathname() || '/'
  const [open, setOpen] = useState(false)

  // close on page change and on Esc
  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // visible on: homepage, dashboard, demo profile. Hidden on /admin and on every other public profile.
  const visible = pathname === '/' || pathname.startsWith('/dashboard') || pathname.toLowerCase() === `/${DEMO}`
  if (!visible) return null

  const row = 'flex items-center gap-3 h-12 px-4 rounded-xl bg-[#1E1E20] border border-[#2A2A2A] text-white text-sm hover:border-[#D4AF37]/50 transition'

  return (
    <>
      <button type="button" className="hamburger-btn" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
        <span /><span /><span />
      </button>

      {open && (
        <div className="menu-overlay" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="Menu">
          <div className="menu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <span className="text-white font-bold text-lg"><span className="text-[#E8C766]">Tap</span>Vinci</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="w-8 h-8 bg-[#1E1E20] rounded-full flex items-center justify-center text-white">✕</button>
            </div>

            <nav className="space-y-2 flex-1">
              {ITEMS.map((it) => (
                <Link key={it.label} href={it.href} className={row} onClick={() => setOpen(false)}>
                  <span>{it.icon}</span><span>{it.label}</span>
                  {it.hint && <span className="ml-auto text-[10px] text-gray-500">{it.hint}</span>}
                </Link>
              ))}
              <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3 h-12 px-4 rounded-xl bg-[#E8C766] text-black font-bold text-sm hover:bg-[#D4AF37] transition">
                <span>⚡</span><span>Open Dashboard</span>
              </Link>

              <div className="h-px bg-[#2A2A2A] my-4" />

              {SECTIONS.map((it) => (
                <Link key={it.label} href={it.href} onClick={() => setOpen(false)} className="flex items-center gap-3 h-11 px-4 rounded-xl text-gray-400 hover:text-white hover:bg-[#1E1E20] text-sm transition">
                  <span>{it.icon}</span><span>{it.label}</span>
                </Link>
              ))}

              <div className="h-px bg-[#2A2A2A] my-4" />

              <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 h-11 px-4 rounded-xl text-gray-400 hover:text-white hover:bg-[#1E1E20] text-sm transition">
                <span>🔐</span><span>Admin Panel - All Clients</span>
              </Link>
              <a href="mailto:tapvinci@yahoo.com" onClick={() => setOpen(false)} className="flex items-center gap-3 h-11 px-4 rounded-xl text-gray-400 hover:text-white hover:bg-[#1E1E20] text-sm transition">
                <span>💬</span><span>Contact Us</span>
              </a>
            </nav>

            <div className="mt-auto pt-6 border-t border-[#1E1E20]">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">TapVinci • Philippines 2026</p>
              <p className="text-[10px] text-white mt-1">Driven by quality • chosen by those who know the difference</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
