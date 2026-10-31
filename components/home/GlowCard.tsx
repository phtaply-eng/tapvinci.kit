'use client'
import { useRef } from 'react'

// Glass card with a gold spotlight that follows the cursor (CSS reads --mx / --my).
export default function GlowCard({ className = '', style, children }: { className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const move = (e: React.PointerEvent<HTMLElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <article ref={ref} onPointerMove={move} className={`tv-glass ${className}`} style={style}>
      {children}
    </article>
  )
}
