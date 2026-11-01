'use client'
import { useRef, useState, type KeyboardEvent } from 'react'
import Image from 'next/image'

const TAGLINE = 'A NEW STANDARD OF INTRODUCTION • MADE TO CONNECT • PHILIPPINES 2026'
const DURATION = 1800 // ms - keep in sync with --flip-ms in globals.css

function Wifi() {
  return (
    <svg className="tv-flip-wifi" viewBox="0 0 32 32" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M12 11.5a6.5 6.5 0 0 1 0 9M17 8a11.5 11.5 0 0 1 0 16M22 4.5a16.5 16.5 0 0 1 0 23" />
    </svg>
  )
}

function Face({ back }: { back?: boolean }) {
  return (
    <div className={`tv-flip-face ${back ? 'tv-flip-back' : 'tv-flip-front'}`} aria-hidden={back ? true : undefined}>
      <span className="tv-nfc-sheen" />
      <div className="tv-nfc-top">
        <span className="tv-nfc-logo"><Image src="/logo.png" alt="" width={140} height={32} className="h-7 md:h-8 w-auto object-contain" /></span>
</div>
      <p className="tv-nfc-foot">{TAGLINE}</p>
    </div>
  )
}

/** TapVinci card: click / Enter / Space -> spins 2-4 full turns and lands on the other side (black <-> white). */
export default function FlipCard() {
  const [rot, setRot] = useState(0)          // total degrees turned; every click adds 180 + 360 * spins
  const [spinning, setSpinning] = useState(false)
  const [flippedOnce, setFlippedOnce] = useState(false)
  const [ms, setMs] = useState(DURATION)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flip = () => {
    if (spinning) return
    const spins = 2 + Math.floor(Math.random() * 3) // 2, 3 or 4
    setMs(DURATION)
    setRot((r) => r + 180 + spins * 360)
    setSpinning(true)
    setFlippedOnce(true)
    timer.current = setTimeout(() => setSpinning(false), DURATION)
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip() }
  }

  const showingWhite = (rot / 180) % 2 === 1
  return (
    <div className="tv-flip-wrap">
      <div
        className={`tv-flip ${spinning ? 'is-spinning' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={showingWhite ? 'TapVinci card, white side. Activate to flip.' : 'TapVinci card, black side. Activate to flip.'}
        onClick={flip}
        onKeyDown={onKey}
      >
        <div className="tv-flip-pop">
          <div className="tv-flip-inner" style={{ transform: `perspective(1200px) rotateY(${rot}deg)`, transition: rot === 0 ? 'none' : `transform ${ms}ms cubic-bezier(0.16,1,0.3,1)` }}>
            <Face />
            <Face back />
          </div>
        </div>
      </div>
      <p className={`tv-flip-hint ${flippedOnce ? 'is-gone' : ''}`} aria-hidden="true">Tap to flip</p>
    </div>
  )
}
