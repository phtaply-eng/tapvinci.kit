'use client'
import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Space_Grotesk, Inter } from 'next/font/google'

const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk', display: 'swap' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const AUTH_KEY = 'tapvinci_admin_ok'

const MENU = [
  { label: 'Overview', icon: 'fa-gauge-high', href: '/admin/overview' },
  { label: 'NFC Cards & URLs', icon: 'fa-credit-card', href: '/admin/nfc' },
  { label: 'Review Stands & QRs', icon: 'fa-star', href: '/admin/qr', soon: true },
  { label: 'Business Profiles', icon: 'fa-briefcase', href: '/admin/profiles' },
  { label: 'Orders & Sales', icon: 'fa-bag-shopping', href: '/admin' },
  { label: 'Live Test Demos', icon: 'fa-flask', href: '/admin/demos' },
  { label: 'User Feedbacks', icon: 'fa-comment-dots', href: '/admin/feedbacks' },
  { label: 'Scan Analytics', icon: 'fa-chart-column', href: '/admin/analytics' },
  { label: 'Content CMS', icon: 'fa-file-lines', href: '/admin/cms' },
  { label: 'Packages & Pricing', icon: 'fa-box', href: '/admin/packages' },
  { label: 'Admin Account', icon: 'fa-user', href: '/admin/account' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/admin'
  const [authed, setAuthed] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const sync = () => { try { setAuthed(sessionStorage.getItem(AUTH_KEY) === '1') } catch {} }
    sync()
    window.addEventListener('tv-admin-auth', sync)
    return () => window.removeEventListener('tv-admin-auth', sync)
  }, [])
  useEffect(() => { setOpen(false) }, [pathname])

  const logout = () => { try { sessionStorage.removeItem(AUTH_KEY) } catch {} ; window.dispatchEvent(new Event('tv-admin-auth')) }
  const wrap = `${grotesk.variable} ${inter.variable} ac-root`
  if (!authed) return <div className={wrap}>{children}</div>

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const nav = (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      {MENU.map((m) => m.href ? (
        m.soon ? (
          <div key={m.label} className="ac-link soon"><i className={`fa-solid ${m.icon}`} /><span>{m.label}</span><em>SOON</em></div>
        ) : (
          <Link key={m.label} href={m.href} className={`ac-link ${isActive(m.href) ? 'active' : ''}`}>
            <i className={`fa-solid ${m.icon}`} /><span>{m.label}</span>
          </Link>
        )
      ) : null)}
      <div className="h-px bg-[#1E1E1E] my-3" />
      <a href="/" target="_blank" className="ac-link"><i className="fa-solid fa-arrow-up-right-from-square" /><span>View Main Website</span></a>
      <button type="button" onClick={logout} className="ac-link danger w-full text-left"><i className="fa-solid fa-right-from-bracket" /><span>Safe Logout</span></button>
    </nav>
  )
  
  // TRANSPARENT LOGO - LIKE HAMBURGER MENU - NO SQUARE
  const brand = (
    <div className="flex flex-col items-center justify-center gap-2 px-5 py-8 border-b border-[#1E1E1E]">
      <Image src="/logo.png" alt="TapVinci" width={150} height={40} className="object-contain h-auto w-[150px]" priority />
      <p className="text-[11px] tracking-[3px] text-[#D4AF37] font-bold mt-1">ADMIN CONSOLE</p>
    </div>
  )
  
  const brandMobile = (
    <div className="flex items-center gap-3 px-5 h-[68px] border-b border-[#1E1E1E]">
      <Image src="/logo.png" alt="TapVinci" width={110} height={28} className="object-contain h-auto w-[110px]" />
    </div>
  )

  return (
    <div className={`${wrap} min-h-screen bg-[#050505]`}>
      <aside className="ac-sidebar hidden lg:flex">{brand}{nav}</aside>
      <header className="lg:hidden sticky top-0 z-30 h-14 px-4 flex items-center justify-between bg-[#0A0A0A]/95 backdrop-blur border-b border-[#1E1E1E]">
        <Image src="/logo.png" alt="TapVinci" width={110} height={28} className="object-contain h-auto w-[110px]" />
        <button onClick={() => setOpen(true)} className="w-10 h-10 rounded-xl bg-[#121214] border border-[#2A2A2A] text-white"><i className="fa-solid fa-bars" /></button>
      </header>
      {open && <div className="ac-overlay lg:hidden" onClick={() => setOpen(false)}><aside className="ac-sidebar ac-drawer flex" onClick={e=>e.stopPropagation()}>{brandMobile}{nav}</aside></div>}
      <div className="lg:ml-[280px]">{children}</div>
    </div>
  )
}