'use client'
import { useEffect, useRef, useState } from 'react'
import GlowCard from './GlowCard'
import { ICONS } from './icons'

const OFFERS = [
  { r: '', t: 'Digital landing pages', i: ICONS.page, p: 'A personalized digital profile for your professional details, contact information, and important links\u2014all in one place.' },
  { r: '', t: 'NFC cards', i: ICONS.card, p: 'A premium physical card with built-in NFC technology, giving others access to your digital profile with a single tap.' },
]
const STEPS = [
  { n: '', t: 'Tap', i: ICONS.tap, d: 8, p: 'Tap or hold your TapVinci card in front or back of the compatible phone.' },
  { n: '', t: 'Open', i: ICONS.open, d: 13, p: 'Your phone opens the digital profile, bringing contact details and links together in one place. No app is needed on most recent phones.' },
  { n: '', t: 'Connect', i: ICONS.connect, d: 18, p: 'Call, message, follow, or save the contact straight from the page.' },
]

// Adds "tv-armed" after hydration (so the page is fully visible without JS) and "is-in" when the block scrolls into view.
function useReveal<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null)
  const [armed, setArmed] = useState(false)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    setArmed(true)
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) { setSeen(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold, rootMargin: '0px 0px -6% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return { ref, cls: `${armed ? 'tv-armed' : ''} ${seen ? 'is-in' : ''}` }
}

const vars = (o: Record<string, string | number>) => o as unknown as React.CSSProperties

export default function FlowSections() {
  const offer = useReveal<HTMLElement>(0.25)
  const how = useReveal<HTMLElement>(0.2)
  const conn = useReveal<HTMLDivElement>(0.4)

  // diamond turns slightly as the connector scrolls through the screen
  useEffect(() => {
    const el = conn.ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)))
      el.style.setProperty('--rot', `${45 + p * 270}deg`)
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(update) }
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    update()
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); if (raf) cancelAnimationFrame(raf) }
  }, [conn.ref])

  // very faint parallax on the 01 / 02 / 03 numerals
  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = how.ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--px', (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3))
    el.style.setProperty('--py', (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3))
  }
  const onLeave = () => {
    const el = how.ref.current
    if (!el) return
    el.style.setProperty('--px', '0')
    el.style.setProperty('--py', '0')
  }

  return (
    <>
      {/* WHAT WE OFFER */}
      <section id="offer" ref={offer.ref} className={`tv-flow tv-flow-offer ${offer.cls}`} aria-labelledby="offer-title">
        <div className="tv-wrap">
          <div className="tv-head tv-rise">
            <p className="tv-label"><span className="tv-label-line" aria-hidden="true" />What we offer</p>
            <h2 id="offer-title" className="tv-h2">Two ways to get shared</h2>
          </div>
          <div className="tv-flow-grid is-2">
            <div className="tv-tl-line" aria-hidden="true" />
            {OFFERS.map((o, idx) => (
              <GlowCard key={o.t} className="tv-flow-card tv-offer" style={vars({ '--i': idx })}>
                <span className="tv-dot" aria-hidden="true" />
                <div className="tv-offer-top"><div className="tv-ico">{o.i}</div><span className="tv-roman" aria-hidden="true">{o.r}</span></div>
                <h3>{o.t}</h3>
                <p>{o.p}</p>
                <span className="tv-underline" aria-hidden="true" />
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* CONNECTOR */}
      <div ref={conn.ref} className={`tv-connector ${conn.cls}`} aria-hidden="true">
        <div className="tv-conn-line" />
        <div className="tv-conn-diamond" />
      </div>

      {/* HOW IT WORKS */}
      <section id="how-it-works" ref={how.ref} className={`tv-flow tv-flow-how ${how.cls}`} aria-labelledby="how-title" onMouseMove={onMove} onMouseLeave={onLeave}>
        <div className="tv-wrap">
          <div className="tv-head tv-rise">
            <p className="tv-label"><span className="tv-label-line" aria-hidden="true" />How it works</p>
            <h2 id="how-title" className="tv-h2">Three simple steps</h2>
          </div>
          <div className="tv-flow-grid is-3">
            <div className="tv-tl-line" aria-hidden="true" />
            {STEPS.map((s, idx) => (
              <GlowCard key={s.t} className="tv-flow-card tv-step" style={vars({ '--i': idx, '--depth': s.d })}>
                <span className="tv-dot" aria-hidden="true" />
                <span className="tv-bignum" aria-hidden="true">{s.n}</span>
                <div className="tv-ico">{s.i}</div>
                <h3>{s.t}</h3>
                <p>{s.p}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
