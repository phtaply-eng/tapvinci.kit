'use client'
import { useState } from 'react'

const FAQS = [
  { q: "My phone didn't open the page. What now?", a: "Make sure NFC is switched on and the screen is unlocked. Hold the back of the phone flat against the card or chip, moving it slightly if nothing happens. Thick or metal cases can block the signal. If it still doesn't open, use the share link or QR code instead." },
  { q: 'Do I need an app to open it?', a: 'Most recent iPhones and Android phones can read NFC without an extra app. Some older phones may need a tag-reading setting switched on.' },
  { q: 'Does the card or chip need a battery?', a: 'No. It is passive and powered briefly by the phone when you tap, so there is nothing to charge or replace.' },
  { q: 'What if my phone has no NFC?', a: 'You can still open the same page from the link or the QR code.' },
  { q: 'Can the page be updated later?', a: 'Yes. The card stores a link to your page, not the page itself, so you can edit your details any time without rewriting the card.' },
]

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="tv-faq">
      {FAQS.map((f, i) => {
        const isOpen = open === i
        return (
          <div key={f.q} className={`tv-faq-item tv-rise${isOpen ? ' is-open' : ''}`}>
            <button type="button" className="tv-faq-q" aria-expanded={isOpen} aria-controls={`faq-a-${i}`} id={`faq-q-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
              <span className="tv-faq-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span className="tv-faq-text">{f.q}</span>
              <span className="tv-faq-chev" aria-hidden="true"><i className="fa-solid fa-chevron-down" /></span>
            </button>
            <div className="tv-faq-a" id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
              <div><p>{f.a}</p></div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
