import Link from 'next/link'
import { Fraunces, DM_Sans } from 'next/font/google'
import FaqAccordion from '../components/home/FaqAccordion'
import ShareCard from '../components/home/ShareCard'
import GlowCard from '../components/home/GlowCard'

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

// thin-line gold icons (1.5px stroke, 32px grid)
const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)
const ICONS = {
  tap: <Icon><circle cx="9" cy="16" r="1.7" /><path d="M14.5 11.5a6.5 6.5 0 0 1 0 9M19 8a11.5 11.5 0 0 1 0 16M23.5 4.5a16.5 16.5 0 0 1 0 23" /></Icon>,
  open: <Icon><rect x="9" y="3" width="14" height="26" rx="3.5" /><path d="M14 25h4M13 11h6M13 15h6M13 19h3.5" /></Icon>,
  connect: <Icon><circle cx="13" cy="11" r="4.5" /><path d="M4.5 27c.8-5.2 4.3-8 8.5-8s7.7 2.8 8.5 8M25 8v8M21 12h8" /></Icon>,
  page: <Icon><rect x="3.5" y="6" width="25" height="20" rx="3" /><path d="M3.5 12h25M8 9h.01M11.5 9h.01M8 17h9M8 21h6" /><rect x="19" y="16" width="6" height="6" rx="1.5" /></Icon>,
  card: <Icon><rect x="3" y="7" width="26" height="18" rx="3.5" /><path d="M3 13h26M8 20h6M21 17.5a3 3 0 0 1 0 4M24 16a5.5 5.5 0 0 1 0 7" /></Icon>,
  chip: <Icon><rect x="9" y="9" width="14" height="14" rx="2.5" /><rect x="13" y="13" width="6" height="6" rx="1" /><path d="M13 9V4M19 9V4M13 23v5M19 23v5M9 13H4M9 19H4M23 13h5M23 19h5" /></Icon>,
  image: <Icon><rect x="4" y="6" width="24" height="20" rx="3.5" /><circle cx="12" cy="13" r="2.2" /><path d="M5 23l7-6 5 4.5 4-3.5 6 5" /></Icon>,
}

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
          <p className="tv-est tv-in" style={{ ['--d' as string]: '0s' }}>Est. Philippines <i /> 2026</p>
          <div className="tv-logo tv-in" style={{ ['--d' as string]: '.12s' }} aria-label="TapVinci">
            <span className="tv-logo-tap">Tap</span><span className="tv-logo-vinci">Vinci</span>
          </div>
          <h1 className="tv-hero-h1 tv-in" style={{ ['--d' as string]: '.26s' }}>
            <span>Tap.</span> <span>Connect.</span> <em>Remember.</em>
          </h1>
          <p className="tv-hero-sub tv-in" style={{ ['--d' as string]: '.4s' }}>Premium NFC business cards and custom landing pages, made for the Philippines.</p>
          <div className="tv-hero-actions tv-in" style={{ ['--d' as string]: '.52s' }}>
            <Link href="/dashboard" className="tv-btn tv-btn-gold">Open Dashboard</Link>
            <Link href={`/${DEMO_USERNAME}`} className="tv-btn tv-btn-glass">View Demo</Link>
          </div>
          <p className="tv-tagline tv-in" style={{ ['--d' as string]: '.66s' }}>Driven by quality <i /> Chosen by those who know the difference <i /> Philippines <i /> 2026</p>
        </div>
        <a href="#how-it-works" className="tv-scroll" aria-label="Scroll to how it works"><span /></a>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="tv-section" id="how-it-works" aria-labelledby="how-title">
        <div className="tv-wrap">
          <SectionHead label="How it works" title="Three simple steps" id="how-title" />
          <div className="tv-steps">
            <div className="tv-rail" aria-hidden="true"><span className="tv-dot" /></div>
            {[
              { n: '01', t: 'Tap', i: ICONS.tap, p: 'Hold the back of a compatible phone against the TapVinci card or chip.' },
              { n: '02', t: 'Open', i: ICONS.open, p: "The phone opens the cardholder's landing page. No app is needed on most recent phones." },
              { n: '03', t: 'Connect', i: ICONS.connect, p: 'Call, message, follow, or save the contact straight from the page.' },
            ].map((s) => (
              <GlowCard key={s.t} className="tv-step tv-rise">
                <span className="tv-node" aria-hidden="true" />
                <span className="tv-bignum" aria-hidden="true">{s.n}</span>
                <div className="tv-ico">{s.i}</div>
                <h3>{s.t}</h3>
                <p>{s.p}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      <div className="tv-divider" aria-hidden="true"><i /></div>

      {/* 3. ABOUT */}
      <section className="tv-section" id="about" aria-labelledby="about-title">
        <div className="tv-wrap tv-about">
          <div className="tv-about-copy">
            <SectionHead label="About TapVinci" title="Personal, modern, easy to share" id="about-title" />
            <p className="tv-lead tv-rise">TapVinci is a Philippines-based NFC business. It offers digital landing pages, NFC cards and NFC chips, so people can share contact details and links with a single tap.</p>
            <p className="tv-p tv-rise">Hi, I&apos;m Shua Vallinas, founder of TapVinci. I help professionals and local businesses get noticed — through NFC digital business cards that share your contacts and links instantly, and custom landing pages built with HTML, CSS, and JavaScript. My goal is simple: make it personal, modern, and easy to share.</p>
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

      {/* 4. WHAT WE OFFER */}
      <section className="tv-section" id="offer" aria-labelledby="offer-title">
        <div className="tv-wrap">
          <SectionHead label="What we offer" title="Three ways to get shared" id="offer-title" />
          <div className="tv-grid3">
            {[
              { r: 'I', t: 'Digital landing pages', i: ICONS.page, p: 'A single mobile-friendly page with your details, links and contact buttons, built with HTML, CSS and JavaScript.' },
              { r: 'II', t: 'NFC cards', i: ICONS.card, p: 'A card that stores your page link. Tap it on a compatible phone and your page opens.' },
              { r: 'III', t: 'NFC chips', i: ICONS.chip, p: "A compact chip that holds your page link, for places where a full card isn't practical." },
            ].map((o) => (
              <GlowCard key={o.t} className="tv-offer tv-rise">
                <div className="tv-offer-top"><div className="tv-ico">{o.i}</div><span className="tv-roman" aria-hidden="true">{o.r}</span></div>
                <h3>{o.t}</h3>
                <p>{o.p}</p>
                <span className="tv-underline" aria-hidden="true" />
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

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
                <p className="tv-nfc-foot">Driven by quality · Philippines · 2026</p>
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

      {/* 8. FOOTER */}
      <footer className="tv-footer">
        <div className="tv-footer-mark" aria-hidden="true">TapVinci</div>
        <div className="tv-wrap tv-footer-inner">
          <div className="tv-logo tv-logo-sm"><span className="tv-logo-tap">Tap</span><span className="tv-logo-vinci">Vinci</span></div>
          <p className="tv-tagline">Driven by quality <i /> Chosen by those who know the difference <i /> Philippines <i /> 2026</p>
          <div className="tv-footer-actions">
            <Link href="/dashboard" className="tv-btn tv-btn-gold tv-btn-sm">Open Dashboard</Link>
            <Link href="/admin" className="tv-btn tv-btn-glass tv-btn-sm">Admin Panel</Link>
            <a href={`mailto:${CONTACT_EMAIL}`} className="tv-btn tv-btn-glass tv-btn-sm">Contact</a>
          </div>
          <p className="tv-copy">© {new Date().getFullYear()} TapVinci • Philippines. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
