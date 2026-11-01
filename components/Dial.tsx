const TICKS = Array.from({ length: 120 }, (_, i) => {
  const a = (i * 3 * Math.PI) / 180
  const major = i % 10 === 0
  const mid = i % 5 === 0
  const r1 = 96
  const r2 = major ? 89 : mid ? 91.5 : 93.5
  return { x1: Math.sin(a) * r1, y1: -Math.cos(a) * r1, x2: Math.sin(a) * r2, y2: -Math.cos(a) * r2, major, mid }
})

export default function Dial({ className, withTicks = false }: { className?: string; withTicks?: boolean }) {
  return (
    <svg className={className} viewBox="-100 -100 200 200" fill="none" aria-hidden="true">
      <circle r="98.5" stroke="#D4AF37" strokeOpacity="0.28" strokeWidth="0.3" />
      <circle r="86" stroke="#D4AF37" strokeOpacity="0.14" strokeWidth="0.25" />
      {withTicks && TICKS.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#E8C766" strokeOpacity={t.major ? 0.85 : t.mid ? 0.5 : 0.25} strokeWidth={t.major ? 0.7 : 0.35} />
      ))}
      <circle cy="-96" r="1.3" fill="#FFC21C" />
    </svg>
  )
}
