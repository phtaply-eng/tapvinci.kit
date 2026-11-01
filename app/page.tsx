import Link from 'next/link'
import Image from 'next/image'
import { Fraunces, DM_Sans } from 'next/font/google'
import FaqAccordion from '../components/home/FaqAccordion'
import ShareCard from '../components/home/ShareCard'
import FlowSections from '../components/home/FlowSections'
import { ICONS } from '../components/home/icons'

const fraunces = Fraunces({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-fraunces', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dmsans', display: 'swap' })

// ---- Edit these in one place ----
const DEMO_USERNAME = (process.env.NEXT_PUBLIC_DEMO_USERNAME || 'shua').toLowerCase()
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tapvinci.vercel.app').replace(/\/+$/, '')
const CONTACT_EMAIL = 'tapvinci@yahoo.com'
const SOCIALS = [
  { key: 'facebook', label: 'Facebook', href: 'https://facebook.com/shua.vallinas', icon: 'fa-brands fa-facebook-f' },
  { key: 'instagram', label: 'Instagram', href: 'https://instagram.com/shuashushu', icon: 'fa-brands fa-instagram' },
  { key: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com/@shuashushu5', icon: 'fa-brands fa-tiktok' },
  { key: 'messenger', label: 'Messenger', href: 'https://m.me/shua.vallinas', icon: 'fa-brands fa-facebook-messenger' },
]

const TICKS = Array.from({ length: 120 }, (_, i) => {
  const a = (i * 3 * Math.PI) / 180
  const major = i % 10 === 0
  const mid = i % 5 === 0
  const r1 = 96
  const r2 = major ? 89 : mid ? 91.5 : 93.5
  return { x1: Math.sin(a) * r1, y1: -Math.cos(a) * r1, x2: Math.sin(a) * r2, y2: -Math.cos(a) * r2, major, mid }
})

function SectionHead({ label, title, id }: { label: string; title: string; id?: string }) {
  return (
    <div className="tv-head tv-rise">
      <p className="tv-label"><span className="tv-label-line" aria-hidden="true" />{label}</p>
      <h2 id={id} className="tv-h2">{title}</h2>
    </div>
  )
}

export default function Home() {
  return (
    <main className={`tv-home ${fraunces.variable} ${dmSans.variable}`}>
      <div className="tv-vignette" aria-hidden="true" />

      {/* 1. HERO */}
      <section className="tv-hero" id="top">
        <div className="tv-hero-art" aria-hidden="true">
          <span className="tv-orb" />
          <span className="tv-ripple" /><span className="tv-ripple" /><span className="tv-ripple" />
          <svg className="tv-bezel" viewBox="-100 -100 200 200" fill="none">
            <circle r="98.5" stroke="#D4AF37" strokeOpacity="0.28" strokeWidth="0.3" />
            <circle r="86" stroke="#D4AF37" strokeOpacity="0.14" strokeWidth="0.25" />
            {TICKS.map((t, i) => (
              <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#E8C766" strokeOpacity={t.major ? 0.85 : t.mid ? 0.5 : 0.25} strokeWidth={t.major ? 0.7 : 0.35} />
            ))}
            <circle cy="-96" r="1.3" fill="#FFC21C" />
          </svg>
        </div>
        <div className="tv-wrap tv-hero-inner">
          <p className="tv-est tv-in" style={{ ['--d' as string]: '0s' }}></p>
         <div className="tv-logo tv-in" style={{ ['--d' as string]: '.15s', marginBottom: '12px' } as any} aria-label="TapVinci">
            <Image src="/logo.png" alt="TapVinci" width={400} height={100} className="h-20 md:h-24 w-auto object-contain mx-auto" priority />
          </div>
          <h1 className="tv-hero-h1 tv-in whitespace-nowrap" style={{ ['--d' as string]: '.26s', fontSize: 'clamp(69px, 6vw, 48px)' }}>
          <span>Tap.</span> <span>Connect.</span> <em>Remember.</em>
          </h1>
          <p className="tv-hero-sub tv-in" style={{ ['--d' as string]: '.4s' }}></p>
          <div className="tv-hero-actions tv-in" style={{ ['--d' as string]: '.52s' }}>
            <Link href="/dashboard" className="tv-btn tv-btn-gold">Open Dashboard</Link>
            <Link href={`/${DEMO_USERNAME}`} className="tv-btn tv-btn-glass">View Demo</Link>
          </div>
          <p className="tv-tagline tv-in" style={{ ['--d' as string]: '.66s' }}>A NEW STANDARD OF INTRODUCTION • MADE TO CONNECT • PHILIPPINES 2026</p>
        </div>
        <a href="#about" className="tv-scroll" aria-label="Scroll down"><span /></a>
      </section>

      {/* 3. ABOUT */}
      <section className="tv-section" id="about" aria-labelledby="about-title">
        <div className="tv-wrap tv-about">
          <div className="tv-about-copy">
            <SectionHead label="About TapVinci" title="A better way to make an introduction." id="about-title" />
            <p className="tv-lead tv-rise">TapVinci is a Philippines-based NFC business. It offers digital calling card with landing pages, so people can share contact details and links with a single tap.</p>
            <p className="tv-p tv-rise">We help professionals and local businesses get noticed — Our goal is simple: make it personal, modern, and easy to share.</p>
            <p className="tv-sign tv-rise"><span>Shua Vallinas</span><small>Founder, TapVinci</small></p>
          </div>
          <figure className="tv-codex tv-rise" aria-hidden="true">
            <svg viewBox="-12 -12 634 401" fill="none">
              <g stroke="#D4AF37" strokeOpacity="0.16" strokeWidth="0.8">
                <rect x="0" y="0" width="610" height="377" />
                <rect x="0" y="0" width="377" height="377"/><rect x="377" y="0" width="233" height="233"/><rect x="466" y="233" width="144" height="144"/><rect x="377" y="288" width="89" height="89"/><rect x="377" y="233" width="55" height="55"/><rect x="432" y="233" width="34" height="34"/><rect x="445" y="267" width="21" height="21"/><rect x="432" y="275" width="13" height="13"/><rect x="432" y="267" width="8" height="8"/>
              </g>
              <g stroke="#D4AF37" strokeOpacity="0.12" strokeWidth="0.6" strokeDasharray="3 5">
                <circle cx="188.5" cy="188.5" r="188.5" />
                <path d="M0 0 L610 377 M0 377 L610 0" />
              </g>
              <path className="tv-spiral" pathLength="1" d="M0 377 A377 377 0 0 1 377 0 A233 233 0 0 1 610 233 A144 144 0 0 1 466 377 A89 89 0 0 1 377 288 A55 55 0 0 1 432 233 A34 34 0 0 1 466 267 A21 21 0 0 1 445 288 A13 13 0 0 1 432 275 A8 8 0 0 1 440 267" stroke="#E8C766" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="440" cy="267" r="3" fill="#FFC21C" />
            </svg>
            <figcaption>φ&nbsp;1.618 · Tap for tech, Vinci for craft</figcaption>
          </figure>
        </div>
      </section>

      <div className="tv-divider" aria-hidden="true"><i /></div>

      {/* 4. WHAT WE OFFER -> HOW IT WORKS (one connected flow) */}
      <FlowSections />

      <div className="tv-divider" aria-hidden="true"><i /></div>

      {/* 5. GALLERY */}
      <section className="tv-section" id="gallery" aria-labelledby="gallery-title">
        <div className="tv-wrap">
          <SectionHead label="Gallery" title="Our work" id="gallery-title" />
          <div className="tv-grid3">
            {['Landing page project 1', 'NFC card project 2', 'NFC chip project 3'].map((t) => (
              <div className="tv-gallery tv-rise" key={t} role="img" aria-label={`Placeholder: ${t}`}>
                <span className="tv-g-bg" aria-hidden="true" />
                <span className="tv-crop tl" /><span className="tv-crop tr" /><span className="tv-crop bl" /><span className="tv-crop br" />
                <div className="tv-g-center">{ICONS.image}</div>
                <p className="tv-g-cap">[PLACEHOLDER] {t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="tv-divider" aria-hidden="true"><i /></div>



      {/* 6. FOLLOW + SHARE */}
      <section className="tv-section" id="follow" aria-labelledby="follow-title">
        <div className="tv-wrap">
          <SectionHead label="Follow" title="Social media" id="follow-title" />
          <div className="tv-social-grid">
            {SOCIALS.map((s) => (
              <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" className={`tv-social tv-social-${s.key} tv-rise`}>
                <span className="tv-social-chip"><i className={s.icon} aria-hidden="true" /></span>
                <span className="tv-social-name">{s.label}</span>
                <i className="fa-solid fa-arrow-up-right-from-square tv-social-go" aria-hidden="true" />
              </a>
            ))}
          </div>

          <div className="tv-share-grid">
            <ShareCard url={`${SITE_URL}/`} />
            <div className="tv-cardviz tv-rise" aria-hidden="true">
              <div className="tv-nfc">
                <span className="tv-nfc-sheen" />
                <div className="tv-nfc-top">
                  <span className="tv-nfc-logo"><b>Tap</b>Vinci</span>
                  <svg viewBox="0 0 32 32" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 11.5a6.5 6.5 0 0 1 0 9M17 8a11.5 11.5 0 0 1 0 16M22 4.5a16.5 16.5 0 0 1 0 23" /></svg>
                </div>
                <div className="tv-nfc-chip" />
                <p className="tv-nfc-foot">A NEW STANDARD OF INTRODUCTION • MADE TO CONNECT • PHILIPPINES 2026</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="tv-divider" aria-hidden="true"><i /></div>

      {/* 7. NFC HELP */}
      <section className="tv-section" id="faq" aria-labelledby="faq-title">
        <div className="tv-wrap tv-faq-wrap">
          <SectionHead label="NFC help" title="Quick answers" id="faq-title" />
          <FaqAccordion />
        </div>
      </section>

      <div className="tv-divider" aria-hidden="true"><i /></div>

      {/* 8. REVIEWS - MOVED TO VERY BOTTOM - TRUST ANCHOR BEFORE FOOTER - APPLE-LEVEL SOCIAL PROOF */}
      <section className="tv-section tv-reviews-teaser" id="reviews-teaser" aria-labelledby="reviews-teaser-title">
        <div className="tv-wrap">
          <div className="tv-reviews-teaser-inner">
            <SectionHead label="Reviews" title="What people say" id="reviews-teaser-title" />
            <div className="tv-reviews-teaser-card tv-rise">
              <div className="tv-reviews-teaser-stars">
                <span className="tv-reviews-teaser-avg">4.9</span>
                <span className="tv-reviews-teaser-stars-icons">
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                </span>
                <span className="tv-reviews-teaser-count">(127 reviews)</span>
              </div>
              <p className="tv-reviews-teaser-text">"Premium quality, tap works instantly. Clients always impressed. TapVinci is the new standard."</p>
              <p className="tv-reviews-teaser-author">— Shua Vallinas, Founder</p>
              <div className="tv-reviews-teaser-actions">
                <Link href="/reviews" className="tv-btn tv-btn-gold">
                  <i className="fa-solid fa-star" style={{ marginRight: '8px' }}></i> Leave a Review
                </Link>
                <Link href="/reviews" className="tv-btn tv-btn-glass">
                  Read All Reviews
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - COPIED FROM MAIN SITE - EXACT SAME */}
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
          <p className="tv-copy">© 2026 TapVinci • Philippines. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}